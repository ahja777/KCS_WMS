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
var AmazonAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmazonAdapter = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const crypto = __importStar(require("crypto"));
let AmazonAdapter = AmazonAdapter_1 = class AmazonAdapter {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger(AmazonAdapter_1.name);
        this.tokenUrl = 'https://api.amazon.com/auth/o2/token';
        this.regionEndpoints = {
            na: 'https://sellingpartnerapi-na.amazon.com',
            eu: 'https://sellingpartnerapi-eu.amazon.com',
            fe: 'https://sellingpartnerapi-fe.amazon.com',
        };
    }
    getBaseUrl(credentials) {
        const region = (credentials.region || 'na').toLowerCase();
        return this.regionEndpoints[region] || this.regionEndpoints.na;
    }
    async getAccessToken(credentials) {
        const { data } = await this.httpService.axiosRef.post(this.tokenUrl, new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: credentials.refreshToken,
            client_id: credentials.clientId,
            client_secret: credentials.clientSecret,
        }).toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 10000,
        });
        return data.access_token;
    }
    signRequest(method, url, headers, body, credentials) {
        const now = new Date();
        const dateStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const shortDate = dateStamp.slice(0, 8);
        const region = credentials.awsRegion || 'us-east-1';
        const service = 'execute-api';
        const parsedUrl = new URL(url);
        const canonicalUri = parsedUrl.pathname;
        const canonicalQuerystring = parsedUrl.searchParams.toString();
        headers['x-amz-date'] = dateStamp;
        headers['host'] = parsedUrl.host;
        const signedHeaders = Object.keys(headers)
            .map((k) => k.toLowerCase())
            .sort()
            .join(';');
        const canonicalHeaders = Object.keys(headers)
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
            .map((k) => `${k.toLowerCase()}:${headers[k].trim()}`)
            .join('\n') + '\n';
        const payloadHash = crypto
            .createHash('sha256')
            .update(body || '')
            .digest('hex');
        const canonicalRequest = [
            method.toUpperCase(),
            canonicalUri,
            canonicalQuerystring,
            canonicalHeaders,
            signedHeaders,
            payloadHash,
        ].join('\n');
        const credentialScope = `${shortDate}/${region}/${service}/aws4_request`;
        const stringToSign = [
            'AWS4-HMAC-SHA256',
            dateStamp,
            credentialScope,
            crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
        ].join('\n');
        const signingKey = this.getSignatureKey(credentials.secretAccessKey, shortDate, region, service);
        const signature = crypto
            .createHmac('sha256', signingKey)
            .update(stringToSign)
            .digest('hex');
        headers['Authorization'] = `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
        return headers;
    }
    getSignatureKey(key, dateStamp, region, service) {
        const kDate = crypto
            .createHmac('sha256', `AWS4${key}`)
            .update(dateStamp)
            .digest();
        const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
        const kService = crypto
            .createHmac('sha256', kRegion)
            .update(service)
            .digest();
        return crypto
            .createHmac('sha256', kService)
            .update('aws4_request')
            .digest();
    }
    async getAuthHeaders(method, url, credentials, body = '') {
        const accessToken = await this.getAccessToken(credentials);
        let headers = {
            'x-amz-access-token': accessToken,
            'Content-Type': 'application/json',
        };
        headers = this.signRequest(method, url, headers, body, credentials);
        return headers;
    }
    async testConnection(credentials) {
        try {
            await this.getAccessToken(credentials);
            this.logger.log('아마존 연결 테스트 성공');
            return true;
        }
        catch (error) {
            this.logger.error(`아마존 연결 테스트 실패: ${error.message}`);
            return false;
        }
    }
    async fetchOrders(credentials, fromDate, toDate) {
        try {
            const baseUrl = this.getBaseUrl(credentials);
            const marketplaceIds = credentials.marketplaceId || 'ATVPDKIKX0DER';
            const path = `/orders/v0/orders`;
            const params = new URLSearchParams({
                MarketplaceIds: marketplaceIds,
                CreatedAfter: fromDate.toISOString(),
                CreatedBefore: toDate.toISOString(),
                OrderStatuses: 'Unshipped',
            });
            const url = `${baseUrl}${path}?${params}`;
            const headers = await this.getAuthHeaders('GET', url, credentials);
            const { data } = await this.httpService.axiosRef.get(url, {
                headers,
                timeout: 30000,
            });
            const orders = data.payload?.Orders || [];
            const results = [];
            for (const order of orders) {
                const itemsUrl = `${baseUrl}/orders/v0/orders/${order.AmazonOrderId}/orderItems`;
                const itemHeaders = await this.getAuthHeaders('GET', itemsUrl, credentials);
                const { data: itemsData } = await this.httpService.axiosRef.get(itemsUrl, { headers: itemHeaders, timeout: 15000 });
                const orderItems = itemsData.payload?.OrderItems || [];
                results.push(this.mapOrder(order, orderItems));
            }
            return results;
        }
        catch (error) {
            this.logger.error(`아마존 주문 조회 실패: ${error.message}`);
            throw new Error(`아마존 주문 조회 실패: ${error.message}`);
        }
    }
    mapOrder(order, orderItems) {
        const shipping = order.ShippingAddress || {};
        return {
            platformOrderId: order.AmazonOrderId,
            platformOrderNo: order.AmazonOrderId,
            orderDate: new Date(order.PurchaseDate),
            customerName: shipping.Name,
            customerPhone: shipping.Phone,
            shippingAddress: [
                shipping.AddressLine1,
                shipping.AddressLine2,
                shipping.City,
                shipping.StateOrRegion,
                shipping.CountryCode,
            ]
                .filter(Boolean)
                .join(', '),
            shippingZipCode: shipping.PostalCode,
            shippingMethod: order.ShipmentServiceLevelCategory,
            totalAmount: parseFloat(order.OrderTotal?.Amount || '0'),
            currency: order.OrderTotal?.CurrencyCode || 'USD',
            items: orderItems.map((item) => ({
                platformItemId: item.ASIN,
                platformSku: item.SellerSKU,
                itemName: item.Title || '',
                quantity: item.QuantityOrdered || 1,
                unitPrice: parseFloat(item.ItemPrice?.Amount || '0'),
            })),
            rawData: { order, orderItems },
        };
    }
    async confirmShipment(credentials, shipment) {
        try {
            const baseUrl = this.getBaseUrl(credentials);
            const url = `${baseUrl}/orders/v0/orders/${shipment.platformOrderId}/shipmentConfirmation`;
            const body = JSON.stringify({
                marketplaceId: credentials.marketplaceId || 'ATVPDKIKX0DER',
                shipmentStatus: 'ReadyForPickup',
                shippingSettings: {
                    carrierName: shipment.carrier,
                    trackingNumber: shipment.trackingNumber,
                },
            });
            const headers = await this.getAuthHeaders('POST', url, credentials, body);
            await this.httpService.axiosRef.post(url, body, {
                headers,
                timeout: 10000,
            });
            this.logger.log(`아마존 배송확인 성공: orderId=${shipment.platformOrderId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`아마존 배송확인 실패: ${error.message}`);
            return false;
        }
    }
    async updateInventory(credentials, items) {
        let success = 0;
        let failed = 0;
        const baseUrl = this.getBaseUrl(credentials);
        for (const item of items) {
            try {
                const sellerId = credentials.sellerId || '';
                const url = `${baseUrl}/listings/2021-08-01/items/${sellerId}/${encodeURIComponent(item.platformSku)}`;
                const body = JSON.stringify({
                    productType: 'PRODUCT',
                    patches: [
                        {
                            op: 'replace',
                            path: '/attributes/fulfillment_availability',
                            value: [
                                {
                                    fulfillment_channel_code: 'DEFAULT',
                                    quantity: item.quantity,
                                },
                            ],
                        },
                    ],
                });
                const headers = await this.getAuthHeaders('PATCH', url, credentials, body);
                await this.httpService.axiosRef.patch(url, body, {
                    headers,
                    params: {
                        marketplaceIds: credentials.marketplaceId || 'ATVPDKIKX0DER',
                    },
                    timeout: 10000,
                });
                success++;
            }
            catch (error) {
                this.logger.warn(`아마존 재고 업데이트 실패 (SKU: ${item.platformSku}): ${error.message}`);
                failed++;
            }
        }
        return { success, failed };
    }
    async fetchProducts(credentials, page = 1, limit = 50) {
        try {
            const baseUrl = this.getBaseUrl(credentials);
            const sellerId = credentials.sellerId || '';
            const url = `${baseUrl}/listings/2021-08-01/items/${sellerId}`;
            const headers = await this.getAuthHeaders('GET', url, credentials);
            const { data } = await this.httpService.axiosRef.get(url, {
                headers,
                params: {
                    marketplaceIds: credentials.marketplaceId || 'ATVPDKIKX0DER',
                    pageSize: limit,
                    pageToken: page > 1 ? String(page) : undefined,
                },
                timeout: 30000,
            });
            const items = data.items || [];
            return items.map((item) => ({
                platformProductId: item.asin || '',
                platformSku: item.sku,
                name: item.summaries?.[0]?.itemName || '',
                price: item.summaries?.[0]?.mainImage?.price?.amount,
                quantity: item.fulfillmentAvailability?.[0]?.quantity,
            }));
        }
        catch (error) {
            this.logger.error(`아마존 상품 조회 실패: ${error.message}`);
            throw new Error(`아마존 상품 조회 실패: ${error.message}`);
        }
    }
};
exports.AmazonAdapter = AmazonAdapter;
exports.AmazonAdapter = AmazonAdapter = AmazonAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], AmazonAdapter);
//# sourceMappingURL=amazon.adapter.js.map