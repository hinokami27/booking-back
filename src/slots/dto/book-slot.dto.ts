import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class BookSlotDto {
  @IsString()
  @IsNotEmpty()
  guestName!: string;

  @IsEmail()
  guestEmail!: string;
}
