import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { FlightsModule } from './flights/flights.module';

@Module({
  imports: [PrismaModule, AuthModule, FlightsModule],
})
export class AppModule { }
