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

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@repairshop.com',
      password: adminPassword,
      role: 'ADMIN',
      name: 'Administrator',
    },
  });

  // Create staff user
  const staffPassword = await bcrypt.hash('staff123', 10);
  const staff = await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      username: 'staff',
      email: 'staff@repairshop.com',
      password: staffPassword,
      role: 'STAFF',
      name: 'Staff Member',
    },
  });

  console.log('✅ Users created');

  // Create default settings
  await prisma.settings.upsert({
    where: { key: 'company_name' },
    update: {},
    create: {
      key: 'company_name',
      value: 'RepairShop',
      description: 'Company name',
    },
  });

  await prisma.settings.upsert({
    where: { key: 'company_email' },
    update: {},
    create: {
      key: 'company_email',
      value: 'info@repairshop.com',
      description: 'Company email',
    },
  });

  await prisma.settings.upsert({
    where: { key: 'company_phone' },
    update: {},
    create: {
      key: 'company_phone',
      value: '+1 (555) 123-4567',
      description: 'Company phone',
    },
  });

  await prisma.settings.upsert({
    where: { key: 'company_address' },
    update: {},
    create: {
      key: 'company_address',
      value: '123 Main St, City, State 12345',
      description: 'Company address',
    },
  });

  await prisma.settings.upsert({
    where: { key: 'currency' },
    update: {},
    create: {
      key: 'currency',
      value: 'USD',
      description: 'Default currency',
    },
  });

  await prisma.settings.upsert({
    where: { key: 'country' },
    update: {},
    create: {
      key: 'country',
      value: 'US',
      description: 'Default country',
    },
  });

  await prisma.settings.upsert({
    where: { key: 'language' },
    update: {},
    create: {
      key: 'language',
      value: 'en',
      description: 'Default language',
    },
  });

  await prisma.settings.upsert({
    where: { key: 'is_installed' },
    update: {},
    create: {
      key: 'is_installed',
      value: 'true',
      description: 'Installation status',
    },
  });

  console.log('✅ Settings created');

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
  let supplier1 = await prisma.supplier.findFirst({
    where: { name: 'TechParts Inc.' },
  });
  if (!supplier1) {
    supplier1 = await prisma.supplier.create({
      data: {
        name: 'TechParts Inc.',
        contactPerson: 'John Smith',
        email: 'orders@techparts.com',
        phone: '+1 (555) 123-4567',
      },
    });
  }

  let supplier2 = await prisma.supplier.findFirst({
    where: { name: 'Samsung Parts Direct' },
  });
  if (!supplier2) {
    supplier2 = await prisma.supplier.create({
      data: {
        name: 'Samsung Parts Direct',
        contactPerson: 'Sarah Johnson',
        email: 'parts@samsungdirect.com',
        phone: '+1 (555) 234-5678',
      },
    });
  }

  let supplier3 = await prisma.supplier.findFirst({
    where: { name: 'ElectroParts Co.' },
  });
  if (!supplier3) {
    supplier3 = await prisma.supplier.create({
      data: {
        name: 'ElectroParts Co.',
        contactPerson: 'Mike Davis',
        email: 'sales@electroparts.com',
        phone: '+1 (555) 345-6789',
      },
    });
  }

  console.log('✅ Suppliers created');

  // Create mock inventory parts
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
        supplierId: supplier1.id,
      },
    }),
    prisma.part.upsert({
      where: { sku: 'SGS23-BAT-001' },
      update: {},
      create: {
        name: 'Samsung Galaxy S23 Battery',
        sku: 'SGS23-BAT-001',
        description: 'Genuine Samsung battery for Galaxy S23',
        quantity: 8,
        reorderLevel: 5,
        unitPrice: 45.00,
        supplierId: supplier2.id,
      },
    }),
    prisma.part.upsert({
      where: { sku: 'USBC-PORT-001' },
      update: {},
      create: {
        name: 'USB-C Charging Port',
        sku: 'USBC-PORT-001',
        description: 'Universal USB-C charging port replacement',
        quantity: 3,
        reorderLevel: 5,
        unitPrice: 12.50,
        supplierId: supplier3.id,
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
        supplierId: supplier1.id,
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
        supplierId: supplier1.id,
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
        assignedToId: staff.id,
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
        assignedToId: staff.id,
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
        assignedToId: staff.id,
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
        assignedToId: staff.id,
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
        assignedToId: staff.id,
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
        assignedToId: staff.id,
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
    // RETURNED ticket (has a return)
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
        status: 'RETURNED',
        paid: true,
        trackingCode: generateTrackingCode(),
        completedAt: dates.completedWeekAgo,
        createdAt: dates.twoWeeksAgo,
        statusHistory: {
          create: [
            { status: 'RECEIVED', notes: 'Device received' },
            { status: 'IN_PROGRESS', notes: 'Replacing back glass' },
            { status: 'REPAIRED', notes: 'Back glass replaced' },
            { status: 'RETURNED', notes: 'Ticket returned. Refund amount: 50.00' },
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
        assignedToId: staff.id,
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
  const returnedTicket = tickets.find(t => t.status === 'RETURNED');
  const repairedPaidTickets = tickets.filter(t => t.status === 'REPAIRED' && t.paid === true);

  const returns = [];
  
  // Create a return for the RETURNED ticket (this ticket was created with RETURNED status)
  if (returnedTicket) {
    const returnRecord = await prisma.return.create({
      data: {
        ticketId: returnedTicket.id,
        reason: 'Customer requested full refund due to dissatisfaction with repair quality',
        refundAmount: returnedTicket.finalPrice || returnedTicket.estimatedPrice,
        createdBy: admin.id,
        status: 'APPROVED',
        handledAt: new Date(),
        handledBy: admin.id,
      },
    });
    returns.push(returnRecord);
  }

  // Create a pending return for a REPAIRED and paid ticket
  // This will test the returns creation flow
  if (repairedPaidTickets.length > 0) {
    const ticketForReturn = repairedPaidTickets[0];
    const refundAmount = (ticketForReturn.finalPrice || ticketForReturn.estimatedPrice) * 0.8; // 80% refund
    
    const returnRecord = await prisma.return.create({
      data: {
        ticketId: ticketForReturn.id,
        reason: 'Customer wants to return device, partial refund requested',
        refundAmount: refundAmount,
        createdBy: admin.id,
        status: 'PENDING',
      },
    });
    returns.push(returnRecord);
    
    // Update ticket status to RETURNED (matching the API behavior)
    await prisma.ticket.update({
      where: { id: ticketForReturn.id },
      data: {
        status: 'RETURNED',
        statusHistory: {
          create: {
            status: 'RETURNED',
            notes: `Ticket returned. Refund amount: ${refundAmount}`,
          },
        },
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
        userId: staff.id,
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
        userId: staff.id,
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

  console.log('🎉 Seed data created successfully!');
  console.log(`   - ${customers.length} customers`);
  console.log(`   - ${parts.length} parts`);
  console.log(`   - ${tickets.length} tickets`);
  console.log(`   - ${returns.length} returns`);
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

