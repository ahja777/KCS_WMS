import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { ItemModule } from './item/item.module';
import { PartnerModule } from './partner/partner.module';
import { InboundModule } from './inbound/inbound.module';
import { OutboundModule } from './outbound/outbound.module';
import { InventoryModule } from './inventory/inventory.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExportModule } from './common/export.module';
import { ExternalModule } from './external/external.module';
import { MasterModule } from './master/master.module';
import { SettlementModule } from './settlement/settlement.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { WorkOrderModule } from './work-order/work-order.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Cache (Redis)
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        store: 'memory',
        ttl: 300,
      }),
      inject: [ConfigService],
    }),

    // Core modules
    PrismaModule,
    AuthModule,
    WarehouseModule,
    ItemModule,
    PartnerModule,
    InboundModule,
    OutboundModule,
    InventoryModule,
    DashboardModule,
    ExportModule,
    ExternalModule,
    MasterModule,
    SettlementModule,
    DispatchModule,
    WorkOrderModule,
  ],
})
export class AppModule {}
