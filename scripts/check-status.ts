
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSettings() {
    try {
        const isInstalled = await prisma.settings.findUnique({
            where: { key: "is_installed" },
        });
        console.log('is_installed:', isInstalled);

        const users = await prisma.user.findMany();
        console.log('Users found:', users.length);
        users.forEach(u => console.log(`- ${u.username} (${u.email})`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSettings();
