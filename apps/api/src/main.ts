import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule, mcp } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    //bodyParser: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const corsOrigins = process.env.APP_URL
    ? process.env.APP_URL.split(',')
    : ['http://localhost:4000'];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Intel View API')
    .setDescription('The Intel View API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Mounts the MCP Streamable HTTP transport (defaults to `/mcp`) onto the
  // same HTTP server/port as the REST API. Must be connected and started
  // before `app.listen()` so its routes are registered in time.
  mcp.setHttpAdapter(app.getHttpAdapter());
  app.connectMicroservice({ strategy: mcp });
  await app.startAllMicroservices();

  await app.listen(process.env.PORT ?? 4010);
}
void bootstrap();
