"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cache_manager_1 = require("@nestjs/cache-manager");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const warehouse_module_1 = require("./warehouse/warehouse.module");
const item_module_1 = require("./item/item.module");
const partner_module_1 = require("./partner/partner.module");
const inbound_module_1 = require("./inbound/inbound.module");
const outbound_module_1 = require("./outbound/outbound.module");
const inventory_module_1 = require("./inventory/inventory.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const export_module_1 = require("./common/export.module");
const external_module_1 = require("./external/external.module");
const master_module_1 = require("./master/master.module");
const settlement_module_1 = require("./settlement/settlement.module");
const dispatch_module_1 = require("./dispatch/dispatch.module");
const work_order_module_1 = require("./work-order/work-order.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            cache_manager_1.CacheModule.registerAsync({
                isGlobal: true,
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    store: 'memory',
                    ttl: 300,
                }),
                inject: [config_1.ConfigService],
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            warehouse_module_1.WarehouseModule,
            item_module_1.ItemModule,
            partner_module_1.PartnerModule,
            inbound_module_1.InboundModule,
            outbound_module_1.OutboundModule,
            inventory_module_1.InventoryModule,
            dashboard_module_1.DashboardModule,
            export_module_1.ExportModule,
            external_module_1.ExternalModule,
            master_module_1.MasterModule,
            settlement_module_1.SettlementModule,
            dispatch_module_1.DispatchModule,
            work_order_module_1.WorkOrderModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map