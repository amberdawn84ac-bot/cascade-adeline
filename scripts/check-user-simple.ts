import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DIRECT_DATABASE_URL,
});

async function checkUser() {
  try {
    const result = await pool.query(
      `SELECT id, email, name, role, grade_level, "parentId" 
       FROM "User" 
       WHERE email = $1`,
      ['amberdawn.84.ac@gmail.com']
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('\n✅ User found:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Grade Level: ${user.grade_level || 'Not set'}`);
      console.log(`   Parent ID: ${user.parentId || 'None (top-level account)'}`);
      console.log(`\n📋 Account Type: ${user.role === 'PARENT' ? '👨‍👩‍👧 PARENT ACCOUNT' : '👶 STUDENT ACCOUNT'}\n`);
    } else {
      console.log('\n❌ User not found in database\n');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkUser();
