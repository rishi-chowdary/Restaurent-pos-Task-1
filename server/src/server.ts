import { createApp } from './app';
import { connectDatabase } from './config/db';
import { env } from './config/env';
import { seedDatabase } from './utils/seed';

async function bootstrap() {
  await connectDatabase();
  await seedDatabase();

  const app = createApp();

  app.listen(env.port, () => {
    process.stdout.write(`[server] POS API running on port ${env.port} (${env.nodeEnv})\n`);
  });
}

bootstrap().catch((error) => {
  process.stderr.write(`[fatal] Server startup failed: ${error.message}\n`);
  process.exit(1);
});
