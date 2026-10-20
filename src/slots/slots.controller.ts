import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { SlotsService } from './slots.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { BookSlotDto } from './dto/book-slot.dto';
import { BookedTimeSlot, TimeSlot } from './types/time-slot';

@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  findAll(): Promise<TimeSlot[]> {
    return this.slotsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateSlotDto): Promise<TimeSlot> {
    return this.slotsService.create(dto);
  }

  @Post(':id/book')
  book(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: BookSlotDto,
  ): Promise<BookedTimeSlot> {
    return this.slotsService.book(id, dto);
  }
}
