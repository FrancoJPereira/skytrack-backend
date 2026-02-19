import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //Activa validaciones para todos los endpoints
  app.enableCors({
    origin: "http://localhost:5173",
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // borra campos extra que no están en el DTO
      forbidNonWhitelisted: true, // si mandan campos extra → error
      transform: true, // convierte tipos cuando puede
    })
  );
  await app.listen(3000);
}
bootstrap();
