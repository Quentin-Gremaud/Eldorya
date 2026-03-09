import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    await service.onModuleInit();
  });

  afterAll(async () => {
    await service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should connect to PostgreSQL and execute a query', async () => {
    const result = await service.$queryRaw<
      Array<{ db: string }>
    >`SELECT current_database() as db`;
    expect(result).toHaveLength(1);
    expect(result[0].db).toBe('eldorya');
  });
});
