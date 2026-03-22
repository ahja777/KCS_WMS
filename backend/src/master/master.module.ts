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
import { ContainerController } from './container.controller';
import { ContainerService } from './container.service';
import { ContainerGroupController } from './container-group.controller';
import { ContainerGroupService } from './container-group.service';
import {
  RoleController,
  ProgramController,
  RoleProgramController,
  MultilingualController,
  TemplateController,
  WorkPolicyController,
  HelpdeskController,
  SettlementRateController,
} from './new-master.controller';

@Module({
  controllers: [
    CommonCodeController,
    VehicleController,
    DockController,
    ItemGroupController,
    UomController,
    ContainerController,
    ContainerGroupController,
    RoleController,
    ProgramController,
    RoleProgramController,
    MultilingualController,
    TemplateController,
    WorkPolicyController,
    HelpdeskController,
    SettlementRateController,
  ],
  providers: [
    CommonCodeService,
    VehicleService,
    DockService,
    ItemGroupService,
    UomService,
    ContainerService,
    ContainerGroupService,
  ],
  exports: [
    CommonCodeService,
    VehicleService,
    DockService,
    ItemGroupService,
    UomService,
    ContainerService,
    ContainerGroupService,
  ],
})
export class MasterModule {}
