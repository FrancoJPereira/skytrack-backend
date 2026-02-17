import { Module } from '@nestjs/common';
import { PlanesService } from './planes.service';
import { PlanesController } from './planes.controller';

@Module({
  providers: [PlanesService],
  controllers: [PlanesController],
})
export class PlanesModule { }
