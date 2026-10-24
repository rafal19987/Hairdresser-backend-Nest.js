import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { runSeeders } from './seeders';

config();

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 3000;

async function waitForDatabase(dataSource: DataSource): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await dataSource.initialize();
      console.log('Database connected.');
      return;
    } catch (err) {
      console.log(
        `Retry ${attempt}/${MAX_RETRIES} — waiting ${RETRY_DELAY_MS / 1000}s...`,
      );
      if (attempt === MAX_RETRIES) throw err;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

async function bootstrap() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT, 10),
    database: process.env.MYSQL_DATABASE,
    username: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    entities: [__dirname + '/../**/*.entity.js'],
    synchronize: false,
  });

  await waitForDatabase(dataSource);

  try {
    await runSeeders(dataSource);
  } finally {
    await dataSource.destroy();
    console.log('Database disconnected.');
  }
}

bootstrap().catch(err => {
  console.error('Data seeding error:', err);
  process.exit(1);
});
