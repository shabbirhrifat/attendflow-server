import 'dotenv/config';
import mongoose from '../app/config/mongoose';
import { User } from '../app/modules/user/user.schema';
import bcrypt from 'bcrypt';

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@attendflow.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminName = process.env.ADMIN_NAME || 'System Admin';

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
        // Update existing admin
        await User.findByIdAndUpdate(existingAdmin._id, {
            password: hashedPassword,
            name: adminName,
            role: 'ADMIN',
            status: 'ACTIVE',
        });
        console.log('Admin user updated:', adminEmail);
    } else {
        // Create new admin
        await User.create({
            email: adminEmail,
            password: hashedPassword,
            name: adminName,
            role: 'ADMIN',
            status: 'ACTIVE',
        });
        console.log('Admin user created:', adminEmail);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await mongoose.close();
    });
