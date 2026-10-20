import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { OpenRouterModule } from './openrouter/openrouter.module';
import { SlotsModule } from './slots/slots.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    OpenRouterModule,
    SlotsModule,
  ],
})
export class AppModule {}
