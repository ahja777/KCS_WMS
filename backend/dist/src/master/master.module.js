"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterModule = void 0;
const common_1 = require("@nestjs/common");
const common_code_controller_1 = require("./common-code.controller");
const common_code_service_1 = require("./common-code.service");
const vehicle_controller_1 = require("./vehicle.controller");
const vehicle_service_1 = require("./vehicle.service");
const dock_controller_1 = require("./dock.controller");
const dock_service_1 = require("./dock.service");
const item_group_controller_1 = require("./item-group.controller");
const item_group_service_1 = require("./item-group.service");
const uom_controller_1 = require("./uom.controller");
const uom_service_1 = require("./uom.service");
let MasterModule = class MasterModule {
};
exports.MasterModule = MasterModule;
exports.MasterModule = MasterModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            common_code_controller_1.CommonCodeController,
            vehicle_controller_1.VehicleController,
            dock_controller_1.DockController,
            item_group_controller_1.ItemGroupController,
            uom_controller_1.UomController,
        ],
        providers: [
            common_code_service_1.CommonCodeService,
            vehicle_service_1.VehicleService,
            dock_service_1.DockService,
            item_group_service_1.ItemGroupService,
            uom_service_1.UomService,
        ],
        exports: [
            common_code_service_1.CommonCodeService,
            vehicle_service_1.VehicleService,
            dock_service_1.DockService,
            item_group_service_1.ItemGroupService,
            uom_service_1.UomService,
        ],
    })
], MasterModule);
//# sourceMappingURL=master.module.js.map