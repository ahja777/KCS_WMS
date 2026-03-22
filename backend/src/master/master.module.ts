import { Module } from '@nestjs/common';
import { CommonCodeController } from './common-code.controller';
import { CommonCodeService } from './common-code.service';
import { VehicleController } from './vehicle.controller';
import { VehicleService } from './vehicle.service';
import { DockController } from './dock.controller';
import { DockService } from './dock.service';
import { ItemGroupController } from './item-group.controller';
import { ItemGroupService } from './item-group.service';
import { UomController } from './uom.controller';
import { UomService } from './uom.service';

@Module({
  controllers: [
    CommonCodeController,
    VehicleController,
    DockController,
    ItemGroupController,
    UomController,
  ],
  providers: [
    CommonCodeService,
    VehicleService,
    DockService,
    ItemGroupService,
    UomService,
  ],
  exports: [
    CommonCodeService,
    VehicleService,
    DockService,
    ItemGroupService,
    UomService,
  ],
})
export class MasterModule {}
