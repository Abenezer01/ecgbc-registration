const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking available Prisma models...');
  
  // List all available models (excluding internal ones)
  const models = Object.keys(prisma).filter(
    key => !key.startsWith('$') && !key.startsWith('_')
  );
  
  console.log('Available models:');
  models.forEach(model => console.log('- ' + model));
  
  // Check if specific models exist
  const modelsToCheck = ['church', 'ministry', 'institution'];
  for (const modelName of modelsToCheck) {
    if (models.includes(modelName)) {
      try {
        const count = await prisma[modelName].count();
        console.log(`\n${modelName} table exists with ${count} entries`);
      } catch (e) {
        console.log(`\n${modelName} table exists but error counting: ${e.message}`);
      }
    } else {
      console.log(`\n${modelName} table does not exist`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
