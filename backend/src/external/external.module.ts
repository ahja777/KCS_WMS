import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ExternalController } from './external.controller';
import { ChannelService } from './services/channel.service';
import { ChannelSyncService } from './services/channel-sync.service';
import { CoupangAdapter } from './adapters/coupang.adapter';
import { NaverAdapter } from './adapters/naver.adapter';
import { AmazonAdapter } from './adapters/amazon.adapter';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 3,
    }),
  ],
  controllers: [ExternalController],
  providers: [
    ChannelService,
    ChannelSyncService,
    CoupangAdapter,
    NaverAdapter,
    AmazonAdapter,
  ],
  exports: [ChannelService, ChannelSyncService],
})
export class ExternalModule {}
