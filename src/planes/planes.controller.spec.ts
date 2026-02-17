import { Test, TestingModule } from '@nestjs/testing';
import { PlanesController } from './planes.controller';

describe('PlanesController', () => {
  let controller: PlanesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanesController],
    }).compile();

    controller = module.get<PlanesController>(PlanesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
