import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './infrastructure/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  Logger.log(`Backend running on http://localhost:${port}`, 'Bootstrap');
}
void bootstrap();
