"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CoupangAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoupangAdapter = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const crypto = __importStar(require("crypto"));
let CoupangAdapter = CoupangAdapter_1 = class CoupangAdapter {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger(CoupangAdapter_1.name);
        this.baseUrl = 'https://api-gateway.coupang.com';
    }
    generateSignature(method, path, secretKey, accessKey) {
        const datetime = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const message = `${datetime}${method}${path}`;
        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(message)
            .digest('hex');
        const authorization = `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
        return { authorization, timestamp: datetime };
    }
    getHeaders(method, path, credentials) {
        const { authorization, timestamp } = this.generateSignature(method, path, credentials.secretKey, credentials.accessKey);
        return {
            Authorization: authorization,
            'Content-Type': 'application/json;charset=UTF-8',
            'X-Reqeust-ID': crypto.randomUUID(),
            'X-Timestamp': timestamp,
        };
    }
    async testConnection(credentials) {
        try {
            const path = `/v2/providers/openapi/apis/api/v4/vendors/${credentials.vendorId}/ordersheets`;
            const headers = this.getHeaders('GET', path, credentials);
            const { data } = await this.httpService.axiosRef.get(`${this.baseUrl}${path}`, {
                headers,
                params: {
                    createdAtFrom: new Date(Date.now() - 3600000).toISOString(),
                    createdAtTo: new Date().toISOString(),
                    status: 'ACCEPT',
                },
                timeout: 10000,
            });
            this.logger.log(`쿠팡 연결 테스트 성공: vendorId=${credentials.vendorId}`);
            return data.code === '200' || data.code === 200;
        }
        catch (error) {
            this.logger.error(`쿠팡 연결 테스트 실패: ${error.message}`);
            return false;
        }
    }
    async fetchOrders(credentials, fromDate, toDate) {
        try {
            const path = `/v2/providers/openapi/apis/api/v4/vendors/${credentials.vendorId}/ordersheets`;
            const headers = this.getHeaders('GET', path, credentials);
            const { data } = await this.httpService.axiosRef.get(`${this.baseUrl}${path}`, {
                headers,
                params: {
                    createdAtFrom: fromDate.toISOString(),
                    createdAtTo: toDate.toISOString(),
                    status: 'ACCEPT',
                    maxPerPage: 50,
                },
                timeout: 30000,
            });
            if (!data.data || !Array.isArray(data.data)) {
                return [];
            }
            return data.data.map((order) => this.mapOrder(order));
        }
        catch (error) {
            this.logger.error(`쿠팡 주문 조회 실패: ${error.message}`);
            throw new Error(`쿠팡 주문 조회 실패: ${error.message}`);
        }
    }
    mapOrder(order) {
        return {
            platformOrderId: String(order.shipmentBoxId || order.orderId),
            platformOrderNo: String(order.orderId),
            orderDate: new Date(order.orderedAt || order.createdAt),
            customerName: order.receiver?.name,
            customerPhone: order.receiver?.safeNumber || order.receiver?.phone,
            shippingAddress: [
                order.receiver?.addr1,
                order.receiver?.addr2,
            ]
                .filter(Boolean)
                .join(' '),
            shippingZipCode: order.receiver?.postCode,
            shippingMethod: order.deliveryCompanyName,
            totalAmount: order.orderItems?.reduce((sum, item) => sum + (item.orderPrice || 0), 0),
            currency: 'KRW',
            items: (order.orderItems || []).map((item) => ({
                platformItemId: String(item.sellerProductItemId || ''),
                platformSku: item.externalVendorSkuCode || item.sellerProductItemId?.toString(),
                itemName: item.sellerProductName || item.productName || '',
                quantity: item.shippingCount || 1,
                unitPrice: item.orderPrice,
            })),
            rawData: order,
        };
    }
    async confirmShipment(credentials, shipment) {
        try {
            const path = `/v2/providers/openapi/apis/api/v4/vendors/${credentials.vendorId}/ordersheets/${shipment.platformOrderId}/invoices`;
            const headers = this.getHeaders('PUT', path, credentials);
            const { data } = await this.httpService.axiosRef.put(`${this.baseUrl}${path}`, {
                vendorId: credentials.vendorId,
                shipmentBoxId: shipment.platformOrderId,
                deliveryCompanyCode: shipment.carrier,
                invoiceNumber: shipment.trackingNumber,
            }, { headers, timeout: 10000 });
            const success = data.code === '200' || data.code === 200;
            this.logger.log(`쿠팡 배송확인 ${success ? '성공' : '실패'}: orderId=${shipment.platformOrderId}`);
            return success;
        }
        catch (error) {
            this.logger.error(`쿠팡 배송확인 실패: ${error.message}`);
            return false;
        }
    }
    async updateInventory(credentials, items) {
        let success = 0;
        let failed = 0;
        for (const item of items) {
            try {
                const path = `/v2/providers/seller_api/apis/api/v1/vendor/products/inventories`;
                const headers = this.getHeaders('PUT', path, credentials);
                await this.httpService.axiosRef.put(`${this.baseUrl}${path}`, {
                    sellerProductItemId: item.platformSku,
                    quantity: item.quantity,
                }, { headers, timeout: 10000 });
                success++;
            }
            catch (error) {
                this.logger.warn(`쿠팡 재고 업데이트 실패 (SKU: ${item.platformSku}): ${error.message}`);
                failed++;
            }
        }
        return { success, failed };
    }
    async fetchProducts(credentials, page = 1, limit = 50) {
        try {
            const path = `/v2/providers/seller_api/apis/api/v1/vendor/products`;
            const headers = this.getHeaders('GET', path, credentials);
            const { data } = await this.httpService.axiosRef.get(`${this.baseUrl}${path}`, {
                headers,
                params: {
                    vendorId: credentials.vendorId,
                    nextToken: page > 1 ? String(page) : undefined,
                    maxPerPage: limit,
                },
                timeout: 30000,
            });
            if (!data.data || !Array.isArray(data.data)) {
                return [];
            }
            return data.data.map((product) => ({
                platformProductId: String(product.sellerProductId),
                platformSku: product.externalVendorSku || String(product.sellerProductId),
                name: product.sellerProductName || '',
                price: product.salePrice,
                quantity: product.maximumBuyCount,
            }));
        }
        catch (error) {
            this.logger.error(`쿠팡 상품 조회 실패: ${error.message}`);
            throw new Error(`쿠팡 상품 조회 실패: ${error.message}`);
        }
    }
};
exports.CoupangAdapter = CoupangAdapter;
exports.CoupangAdapter = CoupangAdapter = CoupangAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], CoupangAdapter);
//# sourceMappingURL=coupang.adapter.js.map