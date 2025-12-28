import 'dotenv/config';
import app from './app';
import config from './app/config';
import prisma from './app/config/prisma';

const main = async () => {
  
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Connected To Database Successfully');

    app.listen(config.port, () => {
      console.log(`Example app listening on port ${config.port}`);
    });
  } catch (error) {
    console.log('Failed to connect to database:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

main();
