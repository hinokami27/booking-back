import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { SlotsController } from './../src/slots/slots.controller';
import { SlotsService } from './../src/slots/slots.service';

describe('Slots (e2e)', () => {
  let app: INestApplication<App>;

  const slotsService = {
    findAll: jest.fn(),
    create: jest.fn(),
    book: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SlotsController],
      providers: [{ provide: SlotsService, useValue: slotsService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('GET /api/slots', async () => {
    slotsService.findAll.mockResolvedValue([]);

    await request(app.getHttpServer()).get('/api/slots').expect(200).expect([]);
  });

  it('POST /api/slots', async () => {
    const created = {
      id: '11111111-1111-1111-1111-111111111111',
      date: '2026-10-21',
      startTime: '14:00',
      duration: 30,
      isBooked: false,
      guestName: null,
      guestEmail: null,
      createdAt: new Date().toISOString(),
    };
    slotsService.create.mockResolvedValue(created);

    const response = await request(app.getHttpServer())
      .post('/api/slots')
      .send({ date: '2026-10-21', startTime: '14:00', duration: 30 })
      .expect(201);

    expect((response.body as { id: string }).id).toBe(created.id);
    expect(slotsService.create).toHaveBeenCalled();
  });

  it('POST /api/slots/:id/book', async () => {
    const id = '11111111-1111-1111-1111-111111111111';
    slotsService.book.mockResolvedValue({
      id,
      date: '2026-10-21',
      startTime: '14:00',
      duration: 30,
      isBooked: true,
      guestName: 'Ada',
      guestEmail: 'ada@example.com',
      createdAt: new Date().toISOString(),
      aiConfirmationMessage: 'You are booked, Ada!',
    });

    const response = await request(app.getHttpServer())
      .post(`/api/slots/${id}/book`)
      .send({ guestName: 'Ada', guestEmail: 'ada@example.com' })
      .expect(201);

    expect(
      (response.body as { aiConfirmationMessage: string })
        .aiConfirmationMessage,
    ).toBe('You are booked, Ada!');
  });
});
