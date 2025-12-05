import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetData() {
    console.log('🗑️  Starting data reset...');

    try {
        // Delete all data in the correct order (respecting foreign key constraints)
        // Start with most dependent models first, then work up to parent models

        // 1. Finance module - most dependent models first
        console.log('Deleting JournalEntries...');
        await prisma.journalEntry.deleteMany({});

        console.log('Deleting Returns...');
        await prisma.return.deleteMany({});

        console.log('Deleting Payments...');
        await prisma.payment.deleteMany({});

        console.log('Deleting Expenses...');
        await prisma.expense.deleteMany({});

        console.log('Deleting InventoryAdjustments...');
        await prisma.inventoryAdjustment.deleteMany({});

        // 2. User-dependent models
        console.log('Deleting NotificationPreferences...');
        await prisma.notificationPreference.deleteMany({});

        console.log('Deleting LoginLogs...');
        await prisma.loginLog.deleteMany({});

        console.log('Deleting PasswordResetTokens...');
        await prisma.passwordResetToken.deleteMany({});

        // 3. Ticket-dependent models
        console.log('Deleting TicketPriceAdjustments...');
        await prisma.ticketPriceAdjustment.deleteMany({});

        console.log('Deleting TicketParts...');
        await prisma.ticketPart.deleteMany({});

        console.log('Deleting TicketStatusHistory...');
        await prisma.ticketStatusHistory.deleteMany({});

        console.log('Deleting SatisfactionRatings...');
        await prisma.satisfactionRating.deleteMany({});

        console.log('Deleting ContactMessages...');
        await prisma.contactMessage.deleteMany({});

        console.log('Deleting Notifications...');
        await prisma.notification.deleteMany({});

        // 4. Ticket and inventory transactions
        console.log('Deleting InventoryTransactions...');
        await prisma.inventoryTransaction.deleteMany({});

        console.log('Deleting Tickets...');
        await prisma.ticket.deleteMany({});

        // 5. Customer-dependent models
        console.log('Deleting Customers...');
        await prisma.customer.deleteMany({});

        // 6. Part-dependent models (already deleted above, but Parts reference Suppliers)
        console.log('Deleting Parts...');
        await prisma.part.deleteMany({});

        console.log('Deleting Suppliers...');
        await prisma.supplier.deleteMany({});

        // 7. Configuration and templates
        console.log('Deleting SMS Templates...');
        await prisma.sMSTemplate.deleteMany({});

        console.log('Deleting EmailSettings...');
        await prisma.emailSettings.deleteMany({});

        // 8. Delete ALL users (including ADMIN) for fresh install simulation
        // Must be deleted after all dependent models
        console.log('Deleting ALL Users...');
        const deletedUsers = await prisma.user.deleteMany({});
        console.log(`Deleted ${deletedUsers.count} users.`);

        // 9. Settings (delete last, after users)
        console.log('Deleting Settings...');
        await prisma.settings.deleteMany({});

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
