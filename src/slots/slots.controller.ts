import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { SlotsService } from './slots.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
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

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSlotDto,
  ): Promise<TimeSlot> {
    return this.slotsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.slotsService.remove(id);
  }

  @Post(':id/book')
  book(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: BookSlotDto,
  ): Promise<BookedTimeSlot> {
    return this.slotsService.book(id, dto);
  }
}
