import { Test, TestingModule } from '@nestjs/testing';
import { SizeService } from './size.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Size } from './entity/size.entity';

describe('SizeService', () => {
  let service: SizeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SizeService, { provide: getRepositoryToken(Size), useValue: {} }],
    }).compile();

    service = module.get<SizeService>(SizeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
