// Seed script for initial data
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lmsaipay.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@lmsaipay.com',
      passwordHash: adminPassword,
      fullName: 'Administrator',
      role: 'admin',
      status: 'active',
      emailVerified: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create sample categories
  const categories = [
    {
      name: 'Lập trình',
      slug: 'lap-trinh',
      description: 'Khóa học về lập trình và phát triển phần mềm',
      isActive: true,
    },
    {
      name: 'Thiết kế',
      slug: 'thiet-ke',
      description: 'Khóa học về thiết kế đồ họa và UI/UX',
      isActive: true,
    },
    {
      name: 'Marketing',
      slug: 'marketing',
      description: 'Khóa học về marketing và quảng cáo',
      isActive: true,
    },
  ];

  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    console.log('✅ Category created:', created.name);
  }

  // Create sample tags
  const tags = [
    { name: 'JavaScript', slug: 'javascript' },
    { name: 'React', slug: 'react' },
    { name: 'Node.js', slug: 'nodejs' },
    { name: 'TypeScript', slug: 'typescript' },
    { name: 'Python', slug: 'python' },
    { name: 'UI/UX', slug: 'ui-ux' },
  ];

  for (const tag of tags) {
    const created = await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
    console.log('✅ Tag created:', created.name);
  }

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

