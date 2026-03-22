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
var NaverAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NaverAdapter = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
let NaverAdapter = NaverAdapter_1 = class NaverAdapter {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger(NaverAdapter_1.name);
        this.baseUrl = 'https://api.commerce.naver.com/external';
        this.tokenUrl = 'https://api.commerce.naver.com/external/v1/oauth2/token';
    }
    async getAccessToken(credentials) {
        const timestamp = Date.now();
        const { createHmac } = await Promise.resolve().then(() => __importStar(require('crypto')));
        const clientSecretSign = createHmac('sha256', credentials.clientSecret)
            .update(`${credentials.clientId}_${timestamp}`)
            .digest('base64');
        const params = new URLSearchParams();
        params.append('client_id', credentials.clientId);
        params.append('timestamp', String(timestamp));
        params.append('client_secret_sign', clientSecretSign);
        params.append('grant_type', 'client_credentials');
        params.append('type', 'SELF');
        const { data } = await this.httpService.axiosRef.post(this.tokenUrl, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 10000,
        });
        return data.access_token;
    }
    async getHeaders(credentials) {
        const token = await this.getAccessToken(credentials);
        return {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }
    async testConnection(credentials) {
        try {
            await this.getAccessToken(credentials);
            this.logger.log('네이버 연결 테스트 성공');
            return true;
        }
        catch (error) {
            this.logger.error(`네이버 연결 테스트 실패: ${error.message}`);
            return false;
        }
    }
    async fetchOrders(credentials, fromDate, toDate) {
        try {
            const headers = await this.getHeaders(credentials);
            const { data: statusData } = await this.httpService.axiosRef.get(`${this.baseUrl}/v1/pay-order/seller/product-orders/last-changed-statuses`, {
                headers,
                params: {
                    lastChangedFrom: fromDate.toISOString(),
                    lastChangedTo: toDate.toISOString(),
                    lastChangedType: 'PAYED',
                },
                timeout: 30000,
            });
            const productOrderIds = statusData.data?.lastChangeStatuses?.map((s) => s.productOrderId) || [];
            if (productOrderIds.length === 0)
                return [];
            const results = [];
            const chunks = this.chunkArray(productOrderIds, 50);
            for (const chunk of chunks) {
                const { data: detailData } = await this.httpService.axiosRef.post(`${this.baseUrl}/v1/pay-order/seller/product-orders/query`, { productOrderIds: chunk }, { headers, timeout: 30000 });
                const orders = detailData.data?.productOrders || [];
                for (const order of orders) {
                    results.push(this.mapOrder(order));
                }
            }
            return this.groupOrdersByOrderNo(results);
        }
        catch (error) {
            this.logger.error(`네이버 주문 조회 실패: ${error.message}`);
            throw new Error(`네이버 주문 조회 실패: ${error.message}`);
        }
    }
    mapOrder(order) {
        const shipping = order.shippingAddress || {};
        return {
            platformOrderId: order.productOrderId,
            platformOrderNo: order.orderId,
            orderDate: new Date(order.paymentDate || order.orderDate),
            customerName: shipping.name || order.ordererName,
            customerPhone: shipping.tel1 || shipping.tel2,
            shippingAddress: [shipping.baseAddress, shipping.detailAddress]
                .filter(Boolean)
                .join(' '),
            shippingZipCode: shipping.zipCode,
            shippingMethod: order.deliveryMethod,
            totalAmount: order.totalPaymentAmount || order.unitPrice * order.quantity,
            currency: 'KRW',
            items: [
                {
                    platformItemId: String(order.productId || ''),
                    platformSku: order.sellerProductCode || String(order.productId),
                    itemName: order.productName || '',
                    quantity: order.quantity || 1,
                    unitPrice: order.unitPrice,
                },
            ],
            rawData: order,
        };
    }
    groupOrdersByOrderNo(orders) {
        const grouped = new Map();
        for (const order of orders) {
            const key = order.platformOrderNo || order.platformOrderId;
            if (grouped.has(key)) {
                const existing = grouped.get(key);
                existing.items.push(...order.items);
                existing.totalAmount =
                    (existing.totalAmount || 0) + (order.totalAmount || 0);
            }
            else {
                grouped.set(key, { ...order });
            }
        }
        return Array.from(grouped.values());
    }
    async confirmShipment(credentials, shipment) {
        try {
            const headers = await this.getHeaders(credentials);
            const { data } = await this.httpService.axiosRef.post(`${this.baseUrl}/v1/pay-order/seller/product-orders/dispatch`, {
                dispatchProductOrders: [
                    {
                        productOrderId: shipment.platformOrderId,
                        deliveryMethod: 'DELIVERY',
                        deliveryCompanyCode: shipment.carrier,
                        trackingNumber: shipment.trackingNumber,
                        dispatchDate: new Date().toISOString(),
                    },
                ],
            }, { headers, timeout: 10000 });
            const success = data.data?.successProductOrderIds?.length > 0;
            this.logger.log(`네이버 배송확인 ${success ? '성공' : '실패'}: orderId=${shipment.platformOrderId}`);
            return success;
        }
        catch (error) {
            this.logger.error(`네이버 배송확인 실패: ${error.message}`);
            return false;
        }
    }
    async updateInventory(credentials, items) {
        let success = 0;
        let failed = 0;
        const headers = await this.getHeaders(credentials);
        for (const item of items) {
            try {
                await this.httpService.axiosRef.put(`${this.baseUrl}/v2/products/channel-products/origin-products/${item.platformSku}`, {
                    stockQuantity: item.quantity,
                }, { headers, timeout: 10000 });
                success++;
            }
            catch (error) {
                this.logger.warn(`네이버 재고 업데이트 실패 (SKU: ${item.platformSku}): ${error.message}`);
                failed++;
            }
        }
        return { success, failed };
    }
    async fetchProducts(credentials, page = 1, limit = 50) {
        try {
            const headers = await this.getHeaders(credentials);
            const { data } = await this.httpService.axiosRef.get(`${this.baseUrl}/v2/products`, {
                headers,
                params: {
                    page,
                    size: limit,
                },
                timeout: 30000,
            });
            const products = data.data?.contents || [];
            return products.map((p) => ({
                platformProductId: String(p.originProductNo),
                platformSku: p.sellerManagementCode || String(p.originProductNo),
                name: p.name || '',
                price: p.salePrice,
                quantity: p.stockQuantity,
            }));
        }
        catch (error) {
            this.logger.error(`네이버 상품 조회 실패: ${error.message}`);
            throw new Error(`네이버 상품 조회 실패: ${error.message}`);
        }
    }
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
};
exports.NaverAdapter = NaverAdapter;
exports.NaverAdapter = NaverAdapter = NaverAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], NaverAdapter);
//# sourceMappingURL=naver.adapter.js.map