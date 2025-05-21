import * as dotenv from 'dotenv';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const envPath = path.resolve(process.cwd(), '.env');
console.log('Ścieżka do pliku .env:', envPath);

dotenv.config({ path: envPath });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get('NODE_ENV');
  const port = configService.get('PORT');

  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin:
      nodeEnv === 'production'
        ? ['https://your-production-domain.com']
        : 'http://localhost:4200',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Hairdresser API')
    .setDescription('API documentation for Hairdresser Backend')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port, () => {
    console.log(`Running API in MODE: ${nodeEnv} on Port: ${port}`);
    console.log(
      ` Swagger documentation available at: http://localhost:${port}/api/docs`,
    );
  });
}

bootstrap().catch(error => {
  console.error('Błąd podczas uruchamiania aplikacji:', error);
  process.exit(1);
});
