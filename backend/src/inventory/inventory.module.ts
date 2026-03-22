import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryMovementController } from './inventory-movement.controller';
import { InventoryMovementService } from './inventory-movement.service';

@Module({
  controllers: [InventoryController, InventoryMovementController],
  providers: [InventoryService, InventoryMovementService],
  exports: [InventoryService, InventoryMovementService],
})
export class InventoryModule {}
