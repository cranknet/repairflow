import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

// Helper function to generate tracking code
function generateTrackingCode(): string {
  return nanoid(8).toUpperCase();
}

// Helper function to generate ticket number
let ticketCounter = 0;
function generateTicketNumber(): string {
  ticketCounter++;
  return `T${Date.now().toString().slice(-6)}${ticketCounter.toString().padStart(2, '0')}`;
}

async function main() {
  console.log('🌱 Seeding database...');

  // Check if already installed - skip seeding sample data if not installed yet
  // The installer wizard will handle initial setup
  const isInstalled = await prisma.settings.findUnique({
    where: { key: 'is_installed' },
  });

  if (!isInstalled || isInstalled.value !== 'true') {
    console.log('⚠️  Application not installed yet. Run the installer wizard first.');
    console.log('   Skipping sample data seeding...');
    return;
  }

  // Get admin and staff users (created by installer)
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  const staff = await prisma.user.findFirst({
    where: { role: 'STAFF' },
  });

  if (!admin) {
    console.log('⚠️  No admin user found. Please run the installer wizard first.');
    return;
  }

  // Use admin as fallback if no staff exists
  const assignee = staff || admin;

  console.log('✅ Found existing users');

  // Create default settings if missing (installer should have created these)
  const defaultSettings = [
    // Company Info
    { key: 'company_name', value: 'RepairShop', description: 'Company name' },
    { key: 'company_email', value: 'info@repairshop.com', description: 'Company email' },
    { key: 'company_phone', value: '+1 (555) 123-4567', description: 'Company phone' },
    { key: 'company_address', value: '123 Main St, City, State 12345', description: 'Company address' },
    { key: 'currency', value: 'USD', description: 'Default currency' },
    { key: 'country', value: 'US', description: 'Default country' },
    { key: 'language', value: 'en', description: 'Default language' },

    // Ticket Settings
    { key: 'auto_mark_tickets_as_paid', value: 'false', description: 'Auto-mark tickets as paid when completed' },
    { key: 'require_device_photos', value: 'false', description: 'Require photos when creating tickets' },
    { key: 'require_estimated_price', value: 'true', description: 'Require estimated price for tickets' },
    { key: 'require_status_notes', value: 'false', description: 'Require notes when changing status' },
    { key: 'auto_assign_creator', value: 'true', description: 'Auto-assign tickets to creator' },
    { key: 'default_priority', value: 'MEDIUM', description: 'Default ticket priority' },
    { key: 'ticket_prefix', value: 'T', description: 'Ticket number prefix' },
    { key: 'enable_auto_close', value: 'false', description: 'Enable auto-close for completed tickets' },
    { key: 'auto_close_days', value: '30', description: 'Days after which completed tickets auto-close' },
    { key: 'allow_price_below_estimate', value: 'true', description: 'Allow final price below estimate' },

    // Warranty Settings
    { key: 'enable_warranty_tracking', value: 'true', description: 'Enable warranty tracking' },
    { key: 'default_warranty_days', value: '30', description: 'Default warranty period in days' },
    { key: 'default_warranty_text', value: 'Standard 30-day warranty on parts and labor', description: 'Default warranty text' },
    { key: 'return_window_days', value: '14', description: 'Return window in days' },
    { key: 'require_return_approval', value: 'true', description: 'Require admin approval for returns' },
    { key: 'allow_partial_refunds', value: 'true', description: 'Allow partial refunds' },
    { key: 'auto_restock_returns', value: 'true', description: 'Auto-restock returned parts' },

    // Inventory Settings
    { key: 'enable_inventory_tracking', value: 'true', description: 'Enable inventory tracking' },
    { key: 'auto_deduct_parts', value: 'true', description: 'Auto-deduct parts from stock' },
    { key: 'allow_negative_stock', value: 'false', description: 'Allow negative stock levels' },
    { key: 'enable_low_stock_alerts', value: 'true', description: 'Enable low stock alerts' },
    { key: 'default_low_stock_threshold', value: '5', description: 'Default low stock threshold' },
    { key: 'default_reorder_level', value: '10', description: 'Default reorder level' },
    { key: 'require_supplier', value: 'false', description: 'Require supplier for parts' },

    // Finance Settings
    { key: 'currency_code', value: 'USD', description: 'Currency code' },
    { key: 'currency_symbol', value: '$', description: 'Currency symbol' },
    { key: 'currency_position', value: 'before', description: 'Currency symbol position' },
    { key: 'enable_tax', value: 'false', description: 'Enable tax/VAT' },
    { key: 'tax_rate', value: '0', description: 'Tax rate percentage' },
    { key: 'tax_label', value: 'Tax', description: 'Tax label' },
    { key: 'prices_include_tax', value: 'false', description: 'Prices include tax' },
    { key: 'accept_cash', value: 'true', description: 'Accept cash payments' },
    { key: 'accept_card', value: 'true', description: 'Accept card payments' },
    { key: 'accept_mobile', value: 'true', description: 'Accept mobile payments' },
    { key: 'enable_diagnostic_fee', value: 'false', description: 'Enable diagnostic fee' },
    { key: 'diagnostic_fee', value: '0', description: 'Default diagnostic fee' },
    { key: 'enable_rush_fee', value: 'false', description: 'Enable rush fee' },
    { key: 'rush_fee', value: '0', description: 'Default rush fee' },

    // Print Settings
    { key: 'label_size', value: '2x1', description: 'Label size for printing' },
    { key: 'print_qr_code', value: 'true', description: 'Print QR code on labels' },
    { key: 'print_barcode', value: 'false', description: 'Print barcode on labels' },
    { key: 'invoice_prefix', value: 'INV-', description: 'Invoice number prefix' },
    { key: 'show_logo_on_invoice', value: 'true', description: 'Show logo on invoices' },
    { key: 'show_terms_on_invoice', value: 'true', description: 'Show terms on invoices' },
    { key: 'invoice_terms', value: 'Payment is due upon receipt of device.', description: 'Invoice terms text' },
    { key: 'invoice_footer', value: 'Thank you for your business!', description: 'Invoice footer text' },
    { key: 'invoice_thank_you', value: 'Thank you for choosing us!', description: 'Thank you message' },

    // Tracking Settings
    { key: 'enable_public_tracking', value: 'true', description: 'Enable public tracking page' },
    { key: 'show_price_on_tracking', value: 'false', description: 'Show price on tracking page' },
    { key: 'show_notes_on_tracking', value: 'false', description: 'Show notes on tracking page' },
    { key: 'show_eta_on_tracking', value: 'true', description: 'Show ETA on tracking page' },
    { key: 'tracking_welcome_message', value: 'Track your repair status', description: 'Tracking welcome message' },
    { key: 'tracking_completion_message', value: 'Your repair is complete! Please pick up your device.', description: 'Tracking completion message' },
    { key: 'show_contact_form', value: 'true', description: 'Show contact form on tracking' },
    { key: 'show_phone_on_tracking', value: 'true', description: 'Show phone on tracking page' },

    // Security Settings
    { key: 'password_min_length', value: '8', description: 'Minimum password length' },
    { key: 'require_uppercase', value: 'true', description: 'Require uppercase in password' },
    { key: 'require_number', value: 'true', description: 'Require number in password' },
    { key: 'require_special_char', value: 'false', description: 'Require special character in password' },
    { key: 'session_timeout', value: '60', description: 'Session timeout in minutes' },
    { key: 'max_login_attempts', value: '5', description: 'Max failed login attempts' },
    { key: 'lockout_duration', value: '15', description: 'Lockout duration in minutes' },
  ];

  for (const setting of defaultSettings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('✅ Settings verified');

  // Create mock customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { id: 'customer-1' },
      update: {},
      create: {
        id: 'customer-1',
        name: 'John Smith',
        phone: '+1 (555) 123-4567',
        email: 'john.smith@email.com',
        address: '123 Oak Street, City, State 12345',
        notes: 'Regular customer, prefers phone contact',
      },
    }),
    prisma.customer.upsert({
      where: { id: 'customer-2' },
      update: {},
      create: {
        id: 'customer-2',
        name: 'Sarah Johnson',
        phone: '+1 (555) 234-5678',
        email: 'sarah.j@email.com',
        address: '456 Pine Avenue, City, State 12345',
      },
    }),
    prisma.customer.upsert({
      where: { id: 'customer-3' },
      update: {},
      create: {
        id: 'customer-3',
        name: 'Mike Davis',
        phone: '+1 (555) 345-6789',
        email: 'mike.davis@email.com',
        address: '789 Elm Road, City, State 12345',
        notes: 'Bulk repairs, corporate account',
      },
    }),
    prisma.customer.upsert({
      where: { id: 'customer-4' },
      update: {},
      create: {
        id: 'customer-4',
        name: 'Emily Wilson',
        phone: '+1 (555) 456-7890',
        email: 'emily.w@email.com',
      },
    }),
    prisma.customer.upsert({
      where: { id: 'walking-customer' },
      update: {},
      create: {
        id: 'walking-customer',
        name: 'walking-customer',
        phone: '0000000000',
        email: null,
        address: null,
        notes: 'Default customer for walk-in repairs',
      },
    }),
    prisma.customer.upsert({
      where: { id: 'customer-5' },
      update: {},
      create: {
        id: 'customer-5',
        name: 'Robert Brown',
        phone: '+1 (555) 567-8901',
        email: 'robert.brown@email.com',
        address: '321 Maple Drive, City, State 12345',
      },
    }),
  ]);

  console.log('✅ Customers created');

  // Create suppliers first (using findFirst + create pattern since name is not unique)
  let techParts = await prisma.supplier.findFirst({
    where: { name: 'TechParts Inc.' },
  });
  if (!techParts) {
    techParts = await prisma.supplier.create({
      data: {
        name: 'TechParts Inc.',
        phone: '+000000000',
        email: 'sales@techparts.example',
        notes: 'Primary screen supplier.',
      },
    });
  }

  let mobileSource = await prisma.supplier.findFirst({
    where: { name: 'MobileSource' },
  });
  if (!mobileSource) {
    mobileSource = await prisma.supplier.create({
      data: {
        name: 'MobileSource',
        phone: null,
        email: null,
      },
    });
  }

  let unifiedParts = await prisma.supplier.findFirst({
    where: { name: 'UnifiedParts' },
  });
  if (!unifiedParts) {
    unifiedParts = await prisma.supplier.create({
      data: {
        name: 'UnifiedParts',
      },
    });
  }

  console.log('✅ Suppliers created');

  // Create parts referencing supplierId and supplierName for backwards compatibility
  const parts: Awaited<ReturnType<typeof prisma.part.upsert>>[] = await Promise.all([
    prisma.part.upsert({
      where: { sku: 'IPH14-SCR-001' },
      update: {},
      create: {
        name: 'iPhone 14 Screen Replacement',
        sku: 'IPH14-SCR-001',
        description: 'Original quality screen replacement for iPhone 14',
        quantity: 15,
        reorderLevel: 5,
        unitPrice: 89.99,
        supplierId: techParts.id,
        supplierName: techParts.name, // Keep supplier string for backwards compatibility
      },
    }),
    prisma.part.upsert({
      where: { sku: 'SMG-SCR-A52' },
      update: {},
      create: {
        name: 'Samsung A52 Screen',
        sku: 'SMG-SCR-A52',
        quantity: 8,
        unitPrice: 49.5,
        supplierId: mobileSource.id,
        supplierName: mobileSource.name,
      },
    }),
    prisma.part.upsert({
      where: { sku: 'GEN-BAT-18650' },
      update: {},
      create: {
        name: 'Generic Battery 18650',
        sku: 'GEN-BAT-18650',
        quantity: 40,
        unitPrice: 7.2,
        supplierId: unifiedParts.id,
        supplierName: unifiedParts.name,
      },
    }),
    prisma.part.upsert({
      where: { sku: 'IPH13-BGL-001' },
      update: {},
      create: {
        name: 'iPhone 13 Back Glass',
        sku: 'IPH13-BGL-001',
        description: 'Replacement back glass for iPhone 13',
        quantity: 20,
        reorderLevel: 5,
        unitPrice: 35.00,
        supplierId: techParts.id,
        supplierName: techParts.name,
      },
    }),
    prisma.part.upsert({
      where: { sku: 'IPH12-CAM-001' },
      update: {},
      create: {
        name: 'Camera Module iPhone 12',
        sku: 'IPH12-CAM-001',
        description: 'Rear camera module for iPhone 12',
        quantity: 2,
        reorderLevel: 5,
        unitPrice: 75.00,
        supplierId: techParts.id,
        supplierName: techParts.name,
      },
    }),
  ]);

  console.log('✅ Parts created');

  // Verify parts were created successfully
  if (parts.length === 0) {
    throw new Error('No parts were created. Cannot create tickets with parts.');
  }
  console.log(`   - ${parts.length} parts available for tickets`);

  // Clear existing data for clean seed (in correct order to respect foreign keys)
  await prisma.notification.deleteMany({});
  await prisma.ticketStatusHistory.deleteMany({});
  await prisma.ticketPart.deleteMany({});
  await prisma.ticketPriceAdjustment.deleteMany({});
  await prisma.return.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.journalEntry.deleteMany({});
  await prisma.inventoryAdjustment.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.inventoryTransaction.deleteMany({});
  // Note: Parts are not deleted here as they are upserted above and should persist

  // Create dates for mock tickets
  const now = new Date();
  const dates = {
    today: new Date(now),
    yesterday: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    threeDaysAgo: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    weekAgo: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    twoWeeksAgo: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    completedToday: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    completedYesterday: new Date(now.getTime() - 25 * 60 * 60 * 1000),
    completedWeekAgo: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
  };

  // Create mock tickets
  const tickets = await Promise.all([
    // Completed tickets (for revenue)
    prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        customerId: customers[0].id,
        assignedToId: assignee.id,
        deviceBrand: 'Apple',
        deviceModel: 'iPhone 14',
        deviceIssue: 'Screen cracked, needs replacement',
        priority: 'HIGH',
        estimatedPrice: 120.00,
        finalPrice: 115.00,
        status: 'COMPLETED',
        paid: true,
        trackingCode: generateTrackingCode(),
        completedAt: dates.completedToday,
        createdAt: dates.weekAgo,
        statusHistory: {
          create: [
            { status: 'RECEIVED', notes: 'Device received' },
            { status: 'IN_PROGRESS', notes: 'Started repair' },
            { status: 'REPAIRED', notes: 'Screen replaced successfully' },
            { status: 'COMPLETED', notes: 'Repair completed and paid' },
          ],
        },
        parts: {
          create: [
            {
              partId: parts[0].id,
              quantity: 1,
            },
          ],
        },
      },
    }),
    prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        customerId: customers[1].id,
        assignedToId: assignee.id,
        deviceBrand: 'Samsung',
        deviceModel: 'Galaxy S23',
        deviceIssue: 'Battery draining quickly',
        priority: 'MEDIUM',
        estimatedPrice: 60.00,
        finalPrice: 55.00,
        status: 'COMPLETED',
        paid: true,
        trackingCode: generateTrackingCode(),
        completedAt: dates.completedYesterday,
        createdAt: dates.weekAgo,
        statusHistory: {
          create: [
            { status: 'RECEIVED', notes: 'Device received' },
            { status: 'IN_PROGRESS', notes: 'Diagnosing battery issue' },
            { status: 'REPAIRED', notes: 'Battery replaced' },
            { status: 'COMPLETED', notes: 'Completed' },
          ],
        },
        parts: {
          create: [
            {
              partId: parts[1].id,
              quantity: 1,
            },
          ],
        },
      },
    }),
    prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        customerId: customers[2].id,
        assignedToId: admin.id,
        deviceBrand: 'Apple',
        deviceModel: 'iPhone 13',
        deviceIssue: 'Back glass shattered',
        priority: 'LOW',
        estimatedPrice: 50.00,
        finalPrice: 50.00,
        status: 'COMPLETED',
        paid: true,
        trackingCode: generateTrackingCode(),
        completedAt: dates.completedWeekAgo,
        createdAt: dates.twoWeeksAgo,
        statusHistory: {
          create: [
            { status: 'RECEIVED', notes: 'Device received' },
            { status: 'IN_PROGRESS', notes: 'Replacing back glass' },
            { status: 'COMPLETED', notes: 'Completed' },
          ],
        },
        parts: {
          create: [
            {
              partId: parts[3].id,
              quantity: 1,
            },
          ],
        },
      },
    }),
    // Active tickets
    prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        customerId: customers[0].id,
        assignedToId: assignee.id,
        deviceBrand: 'Apple',
        deviceModel: 'iPhone 12',
        deviceIssue: 'Camera not working',
        priority: 'HIGH',
        estimatedPrice: 100.00,
        status: 'IN_PROGRESS',
        paid: false,
        trackingCode: generateTrackingCode(),
        createdAt: dates.yesterday,
        statusHistory: {
          create: [
            { status: 'RECEIVED', notes: 'Device received' },
            { status: 'IN_PROGRESS', notes: 'Diagnosing camera issue' },
          ],
        },
        parts: {
          create: [
            {
              partId: parts[4].id,
              quantity: 1,
            },
          ],
        },
      },
    }),
    prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        customerId: customers[3].id,
        assignedToId: assignee.id,
        deviceBrand: 'Samsung',
        deviceModel: 'Galaxy S21',
        deviceIssue: 'Charging port damaged',
        priority: 'MEDIUM',
        estimatedPrice: 30.00,
        status: 'WAITING_FOR_PARTS',
        paid: false,
        trackingCode: generateTrackingCode(),
        createdAt: dates.threeDaysAgo,
        statusHistory: {
          create: [
            { status: 'RECEIVED', notes: 'Device received' },
            { status: 'IN_PROGRESS', notes: 'Diagnosed charging port issue' },
            { status: 'WAITING_FOR_PARTS', notes: 'Waiting for USB-C port' },
          ],
        },
      },
    }),
    prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        customerId: customers[4].id,
        deviceBrand: 'Apple',
        deviceModel: 'iPhone 14 Pro',
        deviceIssue: 'Screen replacement needed',
        priority: 'URGENT',
        estimatedPrice: 150.00,
        status: 'RECEIVED',
        paid: false,
        trackingCode: generateTrackingCode(),
        createdAt: dates.today,
        statusHistory: {
          create: [
            { status: 'RECEIVED', notes: 'Device received, urgent repair' },
          ],
        },
      },
    }),
    prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        customerId: customers[1].id,
        assignedToId: admin.id,
        deviceBrand: 'Apple',
        deviceModel: 'iPhone 13',
        deviceIssue: 'Battery replacement',
        priority: 'MEDIUM',
        estimatedPrice: 70.00,
        finalPrice: 65.00,
        status: 'REPAIRED',
        paid: false,
        trackingCode: generateTrackingCode(),
        completedAt: dates.yesterday,
        createdAt: dates.weekAgo,
        statusHistory: {
          create: [
            { status: 'RECEIVED', notes: 'Device received' },
            { status: 'IN_PROGRESS', notes: 'Replacing battery' },
            { status: 'REPAIRED', notes: 'Battery replaced, waiting for pickup' },
          ],
        },
      },
    }),
    // Additional REPAIRED tickets for returns testing
    prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        customerId: customers[2].id,
        assignedToId: assignee.id,
        deviceBrand: 'Samsung',
        deviceModel: 'Galaxy S22',
        deviceIssue: 'Screen replacement',
        priority: 'HIGH',
        estimatedPrice: 140.00,
        finalPrice: 135.00,
        status: 'REPAIRED',
        paid: true,
        trackingCode: generateTrackingCode(),
        completedAt: dates.completedWeekAgo,
        createdAt: dates.twoWeeksAgo,
        warrantyDays: 90,
        warrantyText: '90 days warranty on screen replacement',
        statusHistory: {
          create: [
            { status: 'RECEIVED', notes: 'Device received' },
            { status: 'IN_PROGRESS', notes: 'Replacing screen' },
            { status: 'REPAIRED', notes: 'Screen replaced successfully' },
          ],
        },
        parts: {
          create: [
            {
              partId: parts[0].id,
              quantity: 1,
            },
          ],
        },
      },
    }),
    prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        customerId: customers[4].id,
        assignedToId: assignee.id,
        deviceBrand: 'Apple',
        deviceModel: 'iPhone 12',
        deviceIssue: 'Charging port repair',
        priority: 'MEDIUM',
        estimatedPrice: 45.00,
        finalPrice: 40.00,
        status: 'REPAIRED',
        paid: true,
        trackingCode: generateTrackingCode(),
        completedAt: dates.completedYesterday,
        createdAt: dates.weekAgo,
        statusHistory: {
          create: [
            { status: 'RECEIVED', notes: 'Device received' },
            { status: 'IN_PROGRESS', notes: 'Repairing charging port' },
            { status: 'REPAIRED', notes: 'Charging port fixed' },
          ],
        },
        parts: {
          create: [
            {
              partId: parts[2].id,
              quantity: 1,
            },
          ],
        },
      },
    }),
    // REPAIRED ticket with return (has a return)
    prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        customerId: customers[0].id,
        assignedToId: admin.id,
        deviceBrand: 'Apple',
        deviceModel: 'iPhone 11',
        deviceIssue: 'Back glass replacement',
        priority: 'LOW',
        estimatedPrice: 55.00,
        finalPrice: 50.00,
        status: 'REPAIRED',
        paid: true,
        trackingCode: generateTrackingCode(),
        completedAt: dates.completedWeekAgo,
        createdAt: dates.twoWeeksAgo,
        statusHistory: {
          create: [
            { status: 'RECEIVED', notes: 'Device received' },
            { status: 'IN_PROGRESS', notes: 'Replacing back glass' },
            { status: 'REPAIRED', notes: 'Back glass replaced' },
          ],
        },
        parts: {
          create: [
            {
              partId: parts[3].id,
              quantity: 1,
            },
          ],
        },
      },
    }),
    // CANCELLED tickets (various scenarios)
    prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        customerId: customers[3].id,
        assignedToId: assignee.id,
        deviceBrand: 'Samsung',
        deviceModel: 'Galaxy A52',
        deviceIssue: 'Screen replacement',
        priority: 'MEDIUM',
        estimatedPrice: 80.00,
        status: 'CANCELLED',
        paid: false,
        trackingCode: generateTrackingCode(),
        createdAt: dates.weekAgo,
        statusHistory: {
          create: [
            { status: 'RECEIVED', notes: 'Device received' },
            { status: 'IN_PROGRESS', notes: 'Started diagnosis' },
            { status: 'CANCELLED', notes: 'Customer cancelled - found cheaper option elsewhere' },
          ],
        },
      },
    }),
    prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        customerId: customers[5].id,
        assignedToId: admin.id,
        deviceBrand: 'Apple',
        deviceModel: 'iPhone X',
        deviceIssue: 'Battery replacement',
        priority: 'LOW',
        estimatedPrice: 65.00,
        status: 'CANCELLED',
        paid: false,
        trackingCode: generateTrackingCode(),
        createdAt: dates.twoWeeksAgo,
        statusHistory: {
          create: [
            { status: 'RECEIVED', notes: 'Device received' },
            { status: 'CANCELLED', notes: 'Customer decided to upgrade instead of repair' },
          ],
        },
      },
    }),
    // Additional RECEIVED tickets (newly arrived)
    prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        customerId: customers[2].id,
        deviceBrand: 'Samsung',
        deviceModel: 'Galaxy Note 20',
        deviceIssue: 'Water damage repair',
        priority: 'HIGH',
        estimatedPrice: 200.00,
        status: 'RECEIVED',
        paid: false,
        trackingCode: generateTrackingCode(),
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        statusHistory: {
          create: [
            { status: 'RECEIVED', notes: 'Device received with water damage, urgent assessment needed' },
          ],
        },
      },
    }),
    // Additional IN_PROGRESS tickets
    prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        customerId: customers[1].id,
        assignedToId: admin.id,
        deviceBrand: 'Apple',
        deviceModel: 'iPhone 15',
        deviceIssue: 'Camera module replacement',
        priority: 'HIGH',
        estimatedPrice: 180.00,
        status: 'IN_PROGRESS',
        paid: false,
        trackingCode: generateTrackingCode(),
        createdAt: dates.yesterday,
        statusHistory: {
          create: [
            { status: 'RECEIVED', notes: 'Device received' },
            { status: 'IN_PROGRESS', notes: 'Replacing camera module' },
          ],
        },
        parts: {
          create: [
            {
              partId: parts[4].id,
              quantity: 1,
            },
          ],
        },
      },
    }),
  ]);

  console.log('✅ Tickets created');

  // Create returns for testing returns page
  // Find tickets by their characteristics
  const repairedPaidTickets = tickets.filter(t => t.status === 'REPAIRED' && t.paid === true);

  const returns = [];
  // Create an approved return for the first REPAIRED and paid ticket
  // This ticket was created specifically for returns testing
  if (repairedPaidTickets.length > 0) {
    const ticketForApprovedReturn = repairedPaidTickets[0];
    const refundAmount = ticketForApprovedReturn.finalPrice || ticketForApprovedReturn.estimatedPrice;

    const returnRecord = await prisma.return.create({
      data: {
        ticketId: ticketForApprovedReturn.id,
        reason: 'Customer requested full refund due to dissatisfaction with repair quality',
        refundAmount: refundAmount,
        createdBy: admin.id,
        status: 'APPROVED',
        handledAt: new Date(),
        handledBy: admin.id,
      },
    });
    returns.push(returnRecord);

    // Add status history note (ticket stays REPAIRED per API behavior)
    await prisma.ticketStatusHistory.create({
      data: {
        ticketId: ticketForApprovedReturn.id,
        status: ticketForApprovedReturn.status, // Keep REPAIRED
        notes: `Return request created. Refund amount: ${refundAmount}. Ticket remains REPAIRED.`,
      },
    });
  }

  // Create a pending return for another REPAIRED and paid ticket
  // This will test the returns creation flow
  if (repairedPaidTickets.length > 1) {
    const ticketForPendingReturn = repairedPaidTickets[1];
    const refundAmount = (ticketForPendingReturn.finalPrice || ticketForPendingReturn.estimatedPrice) * 0.8; // 80% refund

    const returnRecord = await prisma.return.create({
      data: {
        ticketId: ticketForPendingReturn.id,
        reason: 'Customer wants to return device, partial refund requested',
        refundAmount: refundAmount,
        createdBy: admin.id,
        status: 'PENDING',
      },
    });
    returns.push(returnRecord);

    // Add status history note (ticket stays REPAIRED per API behavior)
    await prisma.ticketStatusHistory.create({
      data: {
        ticketId: ticketForPendingReturn.id,
        status: ticketForPendingReturn.status, // Keep REPAIRED
        notes: `Return request created. Refund amount: ${refundAmount}. Awaiting approval.`,
      },
    });
  }

  console.log(`✅ Returns created (${returns.length})`);

  // Create inventory transactions
  await Promise.all([
    prisma.inventoryTransaction.create({
      data: {
        partId: parts[0].id,
        type: 'IN',
        quantity: 20,
        reason: 'Initial stock',
      },
    }),
    prisma.inventoryTransaction.create({
      data: {
        partId: parts[0].id,
        type: 'OUT',
        quantity: 5,
        reason: 'Used in repairs',
        ticketId: tickets[0].id,
      },
    }),
    prisma.inventoryTransaction.create({
      data: {
        partId: parts[1].id,
        type: 'IN',
        quantity: 10,
        reason: 'Initial stock',
      },
    }),
    prisma.inventoryTransaction.create({
      data: {
        partId: parts[1].id,
        type: 'OUT',
        quantity: 2,
        reason: 'Used in repairs',
        ticketId: tickets[1].id,
      },
    }),
  ]);

  console.log('✅ Inventory transactions created');

  // Create some notifications for testing
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: assignee.id,
        ticketId: tickets[3].id,
        type: 'STATUS_CHANGE',
        message: `Ticket ${tickets[3].ticketNumber} status changed to IN_PROGRESS`,
        read: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: admin.id,
        ticketId: tickets[4].id,
        type: 'STATUS_CHANGE',
        message: `Ticket ${tickets[4].ticketNumber} status changed to WAITING_FOR_PARTS`,
        read: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: assignee.id,
        ticketId: tickets[0].id,
        type: 'STATUS_CHANGE',
        message: `Ticket ${tickets[0].ticketNumber} has been completed`,
        read: true,
      },
    }),
  ]);

  console.log('✅ Notifications created');

  // Create some price adjustments for testing
  if (tickets.length > 0 && tickets[0].status === 'COMPLETED') {
    await prisma.ticketPriceAdjustment.create({
      data: {
        ticketId: tickets[0].id,
        userId: admin.id,
        oldPrice: tickets[0].estimatedPrice,
        newPrice: tickets[0].finalPrice || tickets[0].estimatedPrice,
        reason: 'Customer discount applied',
      },
    });
  }

  console.log('✅ Price adjustments created');

  // Create payments for completed tickets
  const completedTickets = tickets.filter(t => t.status === 'COMPLETED' && t.paid);

  // Generate payment numbers for seed data
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD

  const payments = await Promise.all(
    completedTickets.map((ticket, index) => {
      const sequence = (index + 1).toString().padStart(4, '0');
      const paymentNumber = `PAY-${dateStr}-${sequence}`;

      return prisma.payment.create({
        data: {
          paymentNumber,
          ticketId: ticket.id,
          amount: ticket.finalPrice || ticket.estimatedPrice,
          method: 'CASH',
          currency: 'USD',
          performedBy: admin.id,
        },
      });
    })
  );

  console.log(`✅ Payments created (${payments.length})`);

  // Create finance module: Expenses
  const expenses = await Promise.all([
    prisma.expense.create({
      data: {
        name: 'Office Supplies Purchase',
        amount: 150.00,
        type: 'SHOP',
        category: 'Office Supplies',
        notes: 'Monthly office supplies restock',
        createdById: admin.id,
      },
    }),
    prisma.expense.create({
      data: {
        name: 'Part Purchase - iPhone Screens',
        amount: 500.00,
        type: 'PURCHASE',
        category: 'Parts',
        partId: parts[0].id,
        notes: 'Bulk purchase of iPhone 14 screens',
        createdById: admin.id,
      },
    }),
    prisma.expense.create({
      data: {
        name: 'Lost Part - Battery',
        amount: 45.00,
        type: 'PART_LOSS',
        category: 'Inventory Loss',
        partId: parts[1].id,
        notes: 'Battery damaged during handling',
        createdById: assignee.id,
      },
    }),
    prisma.expense.create({
      data: {
        name: 'Miscellaneous Expense',
        amount: 75.50,
        type: 'MISC',
        category: 'Other',
        notes: 'General maintenance',
        createdById: admin.id,
      },
    }),
  ]);

  console.log(`✅ Expenses created (${expenses.length})`);

  // Create finance module: Inventory Adjustments
  const inventoryAdjustments = await Promise.all([
    prisma.inventoryAdjustment.create({
      data: {
        partId: parts[0].id,
        qtyChange: 10,
        cost: 899.90,
        costPerUnit: 89.99,
        reason: 'Bulk purchase from supplier',
        createdById: admin.id,
      },
    }),
    prisma.inventoryAdjustment.create({
      data: {
        partId: parts[2].id,
        qtyChange: -2,
        cost: 14.40,
        costPerUnit: 7.20,
        reason: 'Damaged items removed from inventory',
        createdById: assignee.id,
      },
    }),
  ]);

  console.log(`✅ Inventory adjustments created (${inventoryAdjustments.length})`);

  // Create finance module: Journal Entries
  const journalEntries = await Promise.all([
    // Revenue entries for completed tickets
    ...completedTickets.slice(0, 3).map(ticket =>
      prisma.journalEntry.create({
        data: {
          type: 'REVENUE',
          amount: ticket.finalPrice || ticket.estimatedPrice,
          description: `Revenue from ticket ${ticket.ticketNumber}`,
          referenceType: 'TICKET',
          referenceId: ticket.id,
          ticketId: ticket.id,
          createdById: admin.id,
        },
      })
    ),
    // Expense entries
    prisma.journalEntry.create({
      data: {
        type: 'EXPENSE',
        amount: expenses[1].amount,
        description: expenses[1].name,
        referenceType: 'EXPENSE',
        referenceId: expenses[1].id,
        createdById: admin.id,
      },
    }),
    // Inventory adjustment entry
    prisma.journalEntry.create({
      data: {
        type: 'INVENTORY_ADJUSTMENT',
        amount: inventoryAdjustments[0].cost,
        description: inventoryAdjustments[0].reason,
        referenceType: 'INVENTORY_ADJUSTMENT',
        referenceId: inventoryAdjustments[0].id,
        createdById: admin.id,
      },
    }),
    // Payment entries
    ...payments.slice(0, 2).map(payment =>
      prisma.journalEntry.create({
        data: {
          type: 'PAYMENT',
          amount: payment.amount,
          description: `Payment for ticket ${payment.ticketId}`,
          referenceType: 'PAYMENT',
          referenceId: payment.id,
          ticketId: payment.ticketId,
          createdById: admin.id,
        },
      })
    ),
  ]);

  console.log(`✅ Journal entries created (${journalEntries.length})`);

  console.log('🎉 Seed data created successfully!');
  console.log(`   - ${customers.length} customers`);
  console.log(`   - ${parts.length} parts`);
  console.log(`   - ${tickets.length} tickets`);
  console.log(`   - ${returns.length} returns`);
  console.log(`   - ${payments.length} payments`);
  console.log(`   - ${expenses.length} expenses`);
  console.log(`   - ${inventoryAdjustments.length} inventory adjustments`);
  console.log(`   - ${journalEntries.length} journal entries`);
  console.log(`   - Login credentials:`);
  console.log(`     Admin: username=admin, password=admin123`);
  console.log(`     Staff: username=staff, password=staff123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

