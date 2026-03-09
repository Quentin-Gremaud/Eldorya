import { Test, TestingModule } from '@nestjs/testing';
import { KurrentDbService } from './kurrentdb.service';

describe('KurrentDbService', () => {
  let service: KurrentDbService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KurrentDbService],
    }).compile();

    service = module.get<KurrentDbService>(KurrentDbService);
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should write and read a test event', async () => {
    const streamName = `smoke-test-${Date.now()}`;
    const eventType = 'SmokeTestEvent';
    const data = { message: 'smoke test', timestamp: new Date().toISOString() };

    await service.appendToStream(streamName, eventType, data);

    const events = await service.readStream(streamName);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe(eventType);
    expect(events[0].data).toMatchObject({ message: 'smoke test' });
  });

  it('should pass health check', async () => {
    const healthy = await service.healthCheck();
    expect(healthy).toBe(true);
  });
});
