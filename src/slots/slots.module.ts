import { Module } from '@nestjs/common';
import { OpenRouterModule } from '../openrouter/openrouter.module';
import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';

@Module({
  imports: [OpenRouterModule],
  controllers: [SlotsController],
  providers: [SlotsService],
})
export class SlotsModule {}
