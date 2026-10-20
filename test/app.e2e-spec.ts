import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { SlotsController } from './../src/slots/slots.controller';
import { SlotsService } from './../src/slots/slots.service';

describe('Slots (e2e)', () => {
  let app: INestApplication<App>;

  const slotsService = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
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

  it('PATCH /api/slots/:id', async () => {
    const id = '11111111-1111-1111-1111-111111111111';
    slotsService.update.mockResolvedValue({
      id,
      date: '2026-10-22',
      startTime: '15:00',
      duration: 45,
      isBooked: false,
      guestName: null,
      guestEmail: null,
      createdAt: new Date().toISOString(),
    });

    const response = await request(app.getHttpServer())
      .patch(`/api/slots/${id}`)
      .send({ date: '2026-10-22', duration: 45 })
      .expect(200);

    expect((response.body as { date: string }).date).toBe('2026-10-22');
    expect(slotsService.update).toHaveBeenCalledWith(id, {
      date: '2026-10-22',
      duration: 45,
    });
  });

  it('PATCH /api/slots/:id rejects a malformed date with 400', async () => {
    const id = '11111111-1111-1111-1111-111111111111';

    await request(app.getHttpServer())
      .patch(`/api/slots/${id}`)
      .send({ date: 'tomorrow' })
      .expect(400);

    expect(slotsService.update).not.toHaveBeenCalled();
  });

  it('PATCH /api/slots/:id maps missing slot to 404', async () => {
    const id = '22222222-2222-2222-2222-222222222222';
    slotsService.update.mockRejectedValue(
      new NotFoundException(`Time slot ${id} was not found.`),
    );

    await request(app.getHttpServer())
      .patch(`/api/slots/${id}`)
      .send({ duration: 45 })
      .expect(404);
  });

  it('DELETE /api/slots/:id returns 204 with no body', async () => {
    const id = '11111111-1111-1111-1111-111111111111';
    slotsService.remove.mockResolvedValue(undefined);

    const response = await request(app.getHttpServer())
      .delete(`/api/slots/${id}`)
      .expect(204);

    expect(response.text).toBe('');
    expect(slotsService.remove).toHaveBeenCalledWith(id);
  });

  it('DELETE /api/slots/:id maps missing slot to 404', async () => {
    const id = '22222222-2222-2222-2222-222222222222';
    slotsService.remove.mockRejectedValue(
      new NotFoundException(`Time slot ${id} was not found.`),
    );

    await request(app.getHttpServer()).delete(`/api/slots/${id}`).expect(404);
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
