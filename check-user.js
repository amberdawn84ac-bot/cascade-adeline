const { PrismaClient } = require('./src/generated/prisma');
const p = new PrismaClient();
p.user.findUnique({
  where: { email: 'amberdawn.84.ac@gmail.com' },
  select: { id: true, email: true, role: true, name: true, gradeLevel: true }
}).then(u => {
  console.log(JSON.stringify(u, null, 2));
  return p.$disconnect();
});
