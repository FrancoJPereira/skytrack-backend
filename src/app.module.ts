import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { FlightsModule } from './flights/flights.module';
import { PlanesModule } from './planes/planes.module';
import { CrewModule } from './crew/crew.module';


@Module({
  imports: [PrismaModule, AuthModule, FlightsModule, PlanesModule, CrewModule],

})
export class AppModule { }
