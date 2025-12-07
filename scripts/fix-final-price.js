const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixFinalPrices() {
    console.log('Finding tickets with NULL finalPrice...');

    // Get all tickets that need finalPrice
    const ticketsToFix = await prisma.ticket.findMany({
        where: {
            OR: [
                { status: 'COMPLETED' },
                { status: 'REPAIRED', paid: true },
            ],
            finalPrice: null,
        },
        select: {
            id: true,
            ticketNumber: true,
            estimatedPrice: true,
            status: true,
        },
    });

    console.log(`Found ${ticketsToFix.length} tickets to fix`);

    for (const ticket of ticketsToFix) {
        if (ticket.estimatedPrice !== null) {
            await prisma.ticket.update({
                where: { id: ticket.id },
                data: { finalPrice: ticket.estimatedPrice },
            });
            console.log(`Fixed ticket ${ticket.ticketNumber} (${ticket.status}): set finalPrice = ${ticket.estimatedPrice}`);
        } else {
            console.log(`Skipped ticket ${ticket.ticketNumber}: no estimatedPrice set`);
        }
    }

    console.log('Done!');
}

fixFinalPrices()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
