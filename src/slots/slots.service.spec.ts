import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { PrismaService } from '../prisma/prisma.service';
import { OpenRouterService } from '../openrouter/openrouter.service';

describe('SlotsService', () => {
  let service: SlotsService;
  let prisma: {
    timeSlot: {
      findMany: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      delete: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
  };
  let openRouter: { generateBookingConfirmation: jest.Mock };

  beforeEach(() => {
    prisma = {
      timeSlot: {
        findMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
    };
    openRouter = {
      generateBookingConfirmation: jest.fn(),
    };
    service = new SlotsService(
      prisma as unknown as PrismaService,
      openRouter as unknown as OpenRouterService,
    );
  });

  it('returns all slots', async () => {
    const slots = [{ id: '1' }];
    prisma.timeSlot.findMany.mockResolvedValue(slots);

    await expect(service.findAll()).resolves.toEqual(slots);
    expect(prisma.timeSlot.findMany).toHaveBeenCalled();
  });

  it('creates a slot with default booking fields', async () => {
    const created = {
      id: 'slot-1',
      date: '2026-10-21',
      startTime: '14:00',
      duration: 30,
      isBooked: false,
      guestName: null,
      guestEmail: null,
      createdAt: new Date(),
    };
    prisma.timeSlot.create.mockResolvedValue(created);

    await expect(
      service.create({
        date: '2026-10-21',
        startTime: '14:00',
        duration: 30,
      }),
    ).resolves.toEqual(created);
  });

  it('updates a slot with only the provided fields', async () => {
    prisma.timeSlot.findUnique.mockResolvedValue({ id: 'slot-1', isBooked: false });
    prisma.timeSlot.update.mockResolvedValue({
      id: 'slot-1',
      date: '2026-10-22',
      startTime: '14:00',
      duration: 30,
      isBooked: false,
      guestName: null,
      guestEmail: null,
      createdAt: new Date(),
    });

    await expect(service.update('slot-1', { date: '2026-10-22' })).resolves.toMatchObject({
      date: '2026-10-22',
    });
    expect(prisma.timeSlot.update).toHaveBeenCalledWith({
      where: { id: 'slot-1' },
      data: { date: '2026-10-22' },
    });
  });

  it('updates a booked slot without restrictions', async () => {
    prisma.timeSlot.findUnique.mockResolvedValue({
      id: 'slot-1',
      isBooked: true,
    });
    prisma.timeSlot.update.mockResolvedValue({ id: 'slot-1', duration: 45, isBooked: true });

    await expect(service.update('slot-1', { duration: 45 })).resolves.toMatchObject({
      duration: 45,
    });
  });

  it('rejects updating a missing slot', async () => {
    prisma.timeSlot.findUnique.mockResolvedValue(null);

    await expect(service.update('missing', { duration: 45 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.timeSlot.update).not.toHaveBeenCalled();
  });

  it('deletes an existing slot', async () => {
    prisma.timeSlot.findUnique.mockResolvedValue({ id: 'slot-1' });
    prisma.timeSlot.delete.mockResolvedValue({ id: 'slot-1' });

    await expect(service.remove('slot-1')).resolves.toBeUndefined();
    expect(prisma.timeSlot.delete).toHaveBeenCalledWith({ where: { id: 'slot-1' } });
  });

  it('rejects deleting a missing slot', async () => {
    prisma.timeSlot.findUnique.mockResolvedValue(null);

    await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.timeSlot.delete).not.toHaveBeenCalled();
  });

  it('rejects booking a missing slot', async () => {
    prisma.timeSlot.findUnique.mockResolvedValue(null);

    await expect(
      service.book('missing', {
        guestName: 'Ada',
        guestEmail: 'ada@example.com',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects double-booking', async () => {
    prisma.timeSlot.findUnique.mockResolvedValue({
      id: 'slot-1',
      isBooked: true,
    });

    await expect(
      service.book('slot-1', {
        guestName: 'Ada',
        guestEmail: 'ada@example.com',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('books a slot and includes the OpenRouter confirmation', async () => {
    const slot = {
      id: 'slot-1',
      date: '2026-10-21',
      startTime: '14:00',
      duration: 30,
      isBooked: false,
      guestName: null,
      guestEmail: null,
      createdAt: new Date(),
    };
    const booked = {
      ...slot,
      isBooked: true,
      guestName: 'Ada',
      guestEmail: 'ada@example.com',
    };

    prisma.timeSlot.findUnique.mockResolvedValue(slot);
    prisma.timeSlot.updateMany.mockResolvedValue({ count: 1 });
    prisma.timeSlot.findUniqueOrThrow.mockResolvedValue(booked);
    openRouter.generateBookingConfirmation.mockResolvedValue(
      "You're in, Ada! See you at 14:00.",
    );

    await expect(
      service.book(slot.id, {
        guestName: 'Ada',
        guestEmail: 'ada@example.com',
      }),
    ).resolves.toEqual({
      ...booked,
      aiConfirmationMessage: "You're in, Ada! See you at 14:00.",
    });
  });
});
