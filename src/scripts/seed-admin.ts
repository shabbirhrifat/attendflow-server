import 'dotenv/config';
import prisma from '../app/config/prisma';
import bcrypt from 'bcrypt';

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@attendflow.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminName = process.env.ADMIN_NAME || 'System Admin';

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password: hashedPassword,
            name: adminName,
            role: 'ADMIN',
            status: 'ACTIVE',
        },
        create: {
            email: adminEmail,
            password: hashedPassword,
            name: adminName,
            role: 'ADMIN',
            status: 'ACTIVE',
        },
    });

    console.log('Admin user created/updated:', admin.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
