import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenRouterService } from '../openrouter/openrouter.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { BookSlotDto } from './dto/book-slot.dto';
import { BookedTimeSlot, TimeSlot } from './types/time-slot';

@Injectable()
export class SlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openRouterService: OpenRouterService,
  ) {}

  async findAll(): Promise<TimeSlot[]> {
    return this.prisma.timeSlot.findMany({
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async create(dto: CreateSlotDto): Promise<TimeSlot> {
    return this.prisma.timeSlot.create({
      data: {
        date: dto.date,
        startTime: dto.startTime,
        duration: dto.duration,
      },
    });
  }

  async update(id: string, dto: UpdateSlotDto): Promise<TimeSlot> {
    const existing = await this.prisma.timeSlot.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Time slot ${id} was not found.`);
    }

    return this.prisma.timeSlot.update({
      where: { id },
      data: {
        ...(dto.date !== undefined && { date: dto.date }),
        ...(dto.startTime !== undefined && { startTime: dto.startTime }),
        ...(dto.duration !== undefined && { duration: dto.duration }),
      },
    });
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.timeSlot.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Time slot ${id} was not found.`);
    }

    await this.prisma.timeSlot.delete({ where: { id } });
  }

  async book(id: string, dto: BookSlotDto): Promise<BookedTimeSlot> {
    const existing = await this.prisma.timeSlot.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Time slot ${id} was not found.`);
    }

    if (existing.isBooked) {
      throw new BadRequestException('This time slot is already booked.');
    }

    const updated = await this.prisma.timeSlot.updateMany({
      where: { id, isBooked: false },
      data: {
        isBooked: true,
        guestName: dto.guestName,
        guestEmail: dto.guestEmail,
      },
    });

    if (updated.count === 0) {
      throw new BadRequestException('This time slot is already booked.');
    }

    const slot = await this.prisma.timeSlot.findUniqueOrThrow({
      where: { id },
    });

    const aiConfirmationMessage =
      await this.openRouterService.generateBookingConfirmation({
        guestName: dto.guestName,
        date: slot.date,
        startTime: slot.startTime,
      });

    return {
      ...slot,
      aiConfirmationMessage,
    };
  }
}
