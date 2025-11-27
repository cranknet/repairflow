import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
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

  // Create mock inventory parts
  const parts = await Promise.all([
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
        supplier: 'TechParts Inc.',
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
        supplier: 'Samsung Parts Direct',
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
        supplier: 'ElectroParts Co.',
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
        supplier: 'TechParts Inc.',
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
        supplier: 'TechParts Inc.',
      },
    }),
  ]);

  console.log('✅ Parts created');

  // Clear existing tickets and related data for clean seed
  await prisma.ticketStatusHistory.deleteMany({});
  await prisma.ticketPart.deleteMany({});
  await prisma.ticketPriceAdjustment.deleteMany({});
  await prisma.return.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.inventoryTransaction.deleteMany({});

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
        createdAt: dates.yesterday,
        statusHistory: {
          create: [
            { status: 'RECEIVED', notes: 'Device received' },
            { status: 'IN_PROGRESS', notes: 'Replacing battery' },
            { status: 'REPAIRED', notes: 'Battery replaced, waiting for pickup' },
          ],
        },
      },
    }),
  ]);

  console.log('✅ Tickets created');

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

  console.log('🎉 Seed data created successfully!');
  console.log(`   - ${customers.length} customers`);
  console.log(`   - ${parts.length} parts`);
  console.log(`   - ${tickets.length} tickets`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

