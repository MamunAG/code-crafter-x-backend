import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PayrollWorkerService } from './hr-payroll/payroll/payroll.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'error', 'warn'] });
  const worker = app.get(PayrollWorkerService);
  let stopping = false;
  const shutdown = async () => { stopping = true; await app.close(); };
  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());
  await worker.recoverStalledJobs();
  while (!stopping) {
    const processed = await worker.pollOnce();
    if (!processed) await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

void bootstrap();
