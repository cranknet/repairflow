import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetData() {
    console.log('🗑️  Starting data reset...');

    try {
        // 1. Delete all transactional and operational data
        console.log('Deleting Notifications...');
        await prisma.notification.deleteMany({});

        console.log('Deleting LoginLogs...');
        await prisma.loginLog.deleteMany({});

        console.log('Deleting PasswordResetTokens...');
        await prisma.passwordResetToken.deleteMany({});

        console.log('Deleting InventoryTransactions...');
        await prisma.inventoryTransaction.deleteMany({});

        console.log('Deleting TicketParts...');
        await prisma.ticketPart.deleteMany({});

        console.log('Deleting TicketStatusHistory...');
        await prisma.ticketStatusHistory.deleteMany({});

        console.log('Deleting TicketPriceAdjustments...');
        await prisma.ticketPriceAdjustment.deleteMany({});

        console.log('Deleting Returns...');
        await prisma.return.deleteMany({});

        console.log('Deleting Tickets...');
        await prisma.ticket.deleteMany({});

        console.log('Deleting Customers...');
        await prisma.customer.deleteMany({});

        console.log('Deleting Parts...');
        await prisma.part.deleteMany({});

        console.log('Deleting SMS Templates...');
        await prisma.sMSTemplate.deleteMany({});

        console.log('Deleting Settings...');
        await prisma.settings.deleteMany({});

        // 2. Delete ALL users (including ADMIN) for fresh install simulation
        console.log('Deleting ALL Users...');
        // Delete all users except potentially system users if any (but for fresh install we want NONE)
        const deletedUsers = await prisma.user.deleteMany({});
        console.log(`Deleted ${deletedUsers.count} users.`);

        // Ensure is_installed setting is removed or set to false
        console.log('Ensuring is_installed setting is removed...');
        await prisma.settings.deleteMany({
            where: { key: 'is_installed' }
        });

        // 3. Create Default Walking Customer
        console.log('👤 Creating default walking customer...');
        await prisma.customer.upsert({
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
        });

        console.log('🎉 Data reset complete! Ready for fresh install.');

    } catch (error) {
        console.error('❌ Error resetting data:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

resetData();
