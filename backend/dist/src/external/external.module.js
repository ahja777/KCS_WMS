"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const external_controller_1 = require("./external.controller");
const channel_service_1 = require("./services/channel.service");
const channel_sync_service_1 = require("./services/channel-sync.service");
const coupang_adapter_1 = require("./adapters/coupang.adapter");
const naver_adapter_1 = require("./adapters/naver.adapter");
const amazon_adapter_1 = require("./adapters/amazon.adapter");
let ExternalModule = class ExternalModule {
};
exports.ExternalModule = ExternalModule;
exports.ExternalModule = ExternalModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule.register({
                timeout: 30000,
                maxRedirects: 3,
            }),
        ],
        controllers: [external_controller_1.ExternalController],
        providers: [
            channel_service_1.ChannelService,
            channel_sync_service_1.ChannelSyncService,
            coupang_adapter_1.CoupangAdapter,
            naver_adapter_1.NaverAdapter,
            amazon_adapter_1.AmazonAdapter,
        ],
        exports: [channel_service_1.ChannelService, channel_sync_service_1.ChannelSyncService],
    })
], ExternalModule);
//# sourceMappingURL=external.module.js.map