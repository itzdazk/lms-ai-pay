// Script to restore ADMIN role for user ID = 1
// Usage: node scripts/fix-admin-role.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAdminRole() {
    try {
        console.log('Fixing admin role for user ID = 1...');

        const user = await prisma.user.update({
            where: { id: 1 },
            data: { role: 'ADMIN' },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
            },
        });

        console.log('✅ Admin role restored successfully!');
        console.log('User:', user);
    } catch (error) {
        console.error('❌ Error fixing admin role:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

fixAdminRole();


