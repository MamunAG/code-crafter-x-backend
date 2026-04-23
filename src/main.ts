/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import { JwtAuthOrPublicGuard } from './common/guards/jwt-auth-or-public.guard';

async function bootstrap() {
  console.log('🚀 Starting Rillo API server...');
  console.log('📂 Environment:', process.env.NODE_ENV);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: '*',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: '*',
    exposedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    credentials: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Register global guard for JWT or public
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthOrPublicGuard(reflector));

  // Serve uploaded files statically
  const uploadBaseDir =
    process.env.UPLOAD_BASE_DIR || join(__dirname, '..', 'uploads');
  app.useStaticAssets(uploadBaseDir, {
    prefix: '/uploads/',
    setHeaders: (res: import('express').Response, path: string) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    },
  });

  // //==Redis Socket Config===================================================
  // const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  // const redisIoAdapter = new SocketIoRedisAdapter(app);
  // await redisIoAdapter.connectToRedis(redisUrl);
  // app.useWebSocketAdapter(redisIoAdapter);
  // //==end: Redis Socket Config===================================================

  const config = new DocumentBuilder()
    .setTitle('Rillo API')
    .setDescription('Rillo API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const theme = new SwaggerTheme();
  const darkCss = theme.getBuffer(SwaggerThemeNameEnum.CLASSIC);

  console.log('🎨 Swagger theme loaded:', SwaggerThemeNameEnum.CLASSIC);
  console.log('📏 CSS length:', darkCss.length);

  SwaggerModule.setup('api/docs', app, document, {
    customCss: darkCss.toString(),
    customSiteTitle: 'Rillo API Documentation',
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      displayRequestDuration: true,
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
    },
    customfavIcon: '/favicon.ico',
  });
  //development
  console.log('App listining to port:', process.env.PORT ?? (process.env.NODE_ENV === 'development' ? 3050 : 3000));
  await app.listen(process.env.PORT ?? (process.env.NODE_ENV === 'development' ? 3050 : 3000), '0.0.0.0');


  // const shutdown = async () => {
  //   await redisIoAdapter.closeRedisConnections();
  //   await app.close();
  // };

  // process.on('SIGINT', shutdown);
  // process.on('SIGTERM', shutdown);

}
void bootstrap();

