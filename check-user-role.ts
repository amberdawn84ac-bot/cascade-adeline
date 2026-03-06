import prisma from './src/lib/db';

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'amberdawn.84.ac@gmail.com' },
      select: {
        email: true,
        name: true,
        role: true,
        gradeLevel: true,
        age: true,
      },
    });

    if (user) {
      console.log('\n✅ User found:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Grade Level: ${user.gradeLevel || 'Not set'}`);
      console.log(`   Age: ${user.age || 'Not set'}`);
      console.log(`\n📋 Account Type: ${user.role === 'PARENT' ? 'PARENT ACCOUNT' : 'STUDENT ACCOUNT'}`);
    } else {
      console.log('\n❌ User not found in database');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
