import { Module } from '@nestjs/common';
import { InventoryExtController } from './inventory-ext.controller';
import { InventoryExtService } from './inventory-ext.service';

@Module({
  controllers: [InventoryExtController],
  providers: [InventoryExtService],
  exports: [InventoryExtService],
})
export class InventoryExtModule {}
