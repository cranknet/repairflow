import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  const newPassword = process.argv[2] || 'admin123';
  const username = process.argv[3] || 'admin';

  try {
    // Find the admin user
    let user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      console.log(`User with username "${username}" not found.`);
      console.log('Listing all users:');
      const allUsers = await prisma.user.findMany({
        select: { username: true, role: true, email: true },
      });
      allUsers.forEach((u) => {
        console.log(`  - ${u.username} (${u.role}) ${u.email || ''}`);
      });

      // Ask if we should create the admin user
      console.log(`\nCreating admin user "${username}" with password "${newPassword}"...`);
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          role: 'ADMIN',
          name: 'Administrator',
          email: 'admin@repairshop.com',
        },
      });
      console.log(`✅ Admin user created successfully!`);
    } else {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the password
      await prisma.user.update({
        where: { username },
        data: { password: hashedPassword },
      });

      console.log(`✅ Password reset successfully for user "${username}"`);
    }

    console.log(`\nLogin credentials:`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${newPassword}`);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();

