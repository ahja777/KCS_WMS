import { Controller, Get, Post, Put, Query, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * 외부 이커머스 API 테스트 컨트롤러
 * DummyJSON, FakeStore, Platzi 3개 플랫폼 연동
 */

const PLATFORMS = {
  dummyjson: { name: 'DummyJSON', baseUrl: 'https://dummyjson.com' },
  fakestore: { name: 'FakeStore', baseUrl: 'https://fakestoreapi.com' },
  platzi: { name: 'Platzi', baseUrl: 'https://api.escuelajs.co/api/v1' },
};

@ApiTags('ecommerce-test')
@Controller('ecommerce-test')
export class EcommerceTestController {
  constructor(private http: HttpService) {}

  // ─── 플랫폼 목록 ───
  @Get('platforms')
  @ApiOperation({ summary: '연동 가능 플랫폼 목록' })
  getPlatforms() {
    return Object.entries(PLATFORMS).map(([key, val]) => ({
      id: key,
      name: val.name,
      baseUrl: val.baseUrl,
    }));
  }

  // ─── 연결 테스트 ───
  @Get('ping/:platform')
  @ApiOperation({ summary: '플랫폼 연결 테스트' })
  async ping(@Param('platform') platform: string) {
    const p = PLATFORMS[platform];
    if (!p) return { success: false, error: `Unknown platform: ${platform}` };

    const start = Date.now();
    try {
      let url = p.baseUrl;
      if (platform === 'dummyjson') url += '/products?limit=1';
      else if (platform === 'fakestore') url += '/products?limit=1';
      else url += '/products?offset=0&limit=1';

      const { data, status } = await firstValueFrom(this.http.get(url, { timeout: 10000 }));
      const latency = Date.now() - start;

      return {
        success: true,
        platform: p.name,
        baseUrl: p.baseUrl,
        statusCode: status,
        latencyMs: latency,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        platform: p.name,
        error: err.message,
        latencyMs: Date.now() - start,
      };
    }
  }

  // ═════════════════════════════════════════
  // DummyJSON (메인 테스트 플랫폼)
  // ═════════════════════════════════════════

  @Get('dummyjson/products')
  @ApiOperation({ summary: 'DummyJSON 상품 목록' })
  async getDummyProducts(
    @Query('limit') limit = '10',
    @Query('skip') skip = '0',
    @Query('search') search?: string,
  ) {
    let url = `https://dummyjson.com/products`;
    if (search) url += `/search?q=${encodeURIComponent(search)}&limit=${limit}&skip=${skip}`;
    else url += `?limit=${limit}&skip=${skip}`;

    const { data } = await firstValueFrom(this.http.get(url));
    return {
      products: data.products.map(this.mapDummyProduct),
      total: data.total,
      skip: data.skip,
      limit: data.limit,
    };
  }

  @Get('dummyjson/products/:id')
  @ApiOperation({ summary: 'DummyJSON 상품 상세' })
  async getDummyProduct(@Param('id') id: string) {
    const { data } = await firstValueFrom(
      this.http.get(`https://dummyjson.com/products/${id}`),
    );
    return this.mapDummyProduct(data);
  }

  @Get('dummyjson/categories')
  @ApiOperation({ summary: 'DummyJSON 카테고리 목록' })
  async getDummyCategories() {
    const { data } = await firstValueFrom(
      this.http.get('https://dummyjson.com/products/category-list'),
    );
    return data;
  }

  @Get('dummyjson/orders')
  @ApiOperation({ summary: 'DummyJSON 주문(카트) 목록' })
  async getDummyOrders(@Query('limit') limit = '10', @Query('skip') skip = '0') {
    const { data } = await firstValueFrom(
      this.http.get(`https://dummyjson.com/carts?limit=${limit}&skip=${skip}`),
    );
    return {
      orders: data.carts.map(this.mapDummyOrder),
      total: data.total,
      skip: data.skip,
      limit: data.limit,
    };
  }

  @Get('dummyjson/orders/:id')
  @ApiOperation({ summary: 'DummyJSON 주문 상세' })
  async getDummyOrder(@Param('id') id: string) {
    const { data } = await firstValueFrom(
      this.http.get(`https://dummyjson.com/carts/${id}`),
    );
    return this.mapDummyOrder(data);
  }

  @Put('dummyjson/products/:id/stock')
  @ApiOperation({ summary: 'DummyJSON 재고 업데이트 (시뮬레이션)' })
  async updateDummyStock(@Param('id') id: string, @Body() body: { stock: number }) {
    const { data } = await firstValueFrom(
      this.http.put(`https://dummyjson.com/products/${id}`, { stock: body.stock }),
    );
    return this.mapDummyProduct(data);
  }

  @Post('dummyjson/auth')
  @ApiOperation({ summary: 'DummyJSON 인증 테스트' })
  async dummyAuth() {
    const { data } = await firstValueFrom(
      this.http.post('https://dummyjson.com/auth/login', {
        username: 'emilys',
        password: 'emilyspass',
      }),
    );
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: { id: data.id, username: data.username, email: data.email, firstName: data.firstName, lastName: data.lastName },
    };
  }

  // ═════════════════════════════════════════
  // FakeStore API
  // ═════════════════════════════════════════

  @Get('fakestore/products')
  @ApiOperation({ summary: 'FakeStore 상품 목록' })
  async getFakeProducts(@Query('limit') limit = '10') {
    const { data } = await firstValueFrom(
      this.http.get(`https://fakestoreapi.com/products?limit=${limit}`),
    );
    return { products: data.map(this.mapFakeProduct), total: data.length };
  }

  @Get('fakestore/products/:id')
  @ApiOperation({ summary: 'FakeStore 상품 상세' })
  async getFakeProduct(@Param('id') id: string) {
    const { data } = await firstValueFrom(
      this.http.get(`https://fakestoreapi.com/products/${id}`),
    );
    return this.mapFakeProduct(data);
  }

  @Get('fakestore/categories')
  @ApiOperation({ summary: 'FakeStore 카테고리 목록' })
  async getFakeCategories() {
    const { data } = await firstValueFrom(
      this.http.get('https://fakestoreapi.com/products/categories'),
    );
    return data;
  }

  @Get('fakestore/orders')
  @ApiOperation({ summary: 'FakeStore 주문(카트) 목록' })
  async getFakeOrders(@Query('limit') limit = '10') {
    const { data } = await firstValueFrom(
      this.http.get(`https://fakestoreapi.com/carts?limit=${limit}`),
    );
    return { orders: data.map(this.mapFakeOrder), total: data.length };
  }

  // ═════════════════════════════════════════
  // Platzi API
  // ═════════════════════════════════════════

  @Get('platzi/products')
  @ApiOperation({ summary: 'Platzi 상품 목록' })
  async getPlatziProducts(@Query('limit') limit = '10', @Query('offset') offset = '0') {
    const { data } = await firstValueFrom(
      this.http.get(`https://api.escuelajs.co/api/v1/products?offset=${offset}&limit=${limit}`),
    );
    return { products: data.map(this.mapPlatziProduct), total: data.length };
  }

  @Get('platzi/categories')
  @ApiOperation({ summary: 'Platzi 카테고리 목록' })
  async getPlatziCategories() {
    const { data } = await firstValueFrom(
      this.http.get('https://api.escuelajs.co/api/v1/categories'),
    );
    return data.map((c: any) => ({ id: c.id, name: c.name, image: c.image }));
  }

  // ═════════════════════════════════════════
  // WMS 연동 시뮬레이션
  // ═════════════════════════════════════════

  @Post('sync/pull-products/:platform')
  @ApiOperation({ summary: '상품 Pull (외부→WMS 동기화 시뮬레이션)' })
  async pullProducts(@Param('platform') platform: string, @Query('limit') limit = '10') {
    let products: any[] = [];

    if (platform === 'dummyjson') {
      const result = await this.getDummyProducts(limit, '0');
      products = result.products;
    } else if (platform === 'fakestore') {
      const result = await this.getFakeProducts(limit);
      products = result.products;
    } else if (platform === 'platzi') {
      const result = await this.getPlatziProducts(limit, '0');
      products = result.products;
    }

    // WMS Item 형식으로 매핑
    const wmsItems = products.map((p: any) => ({
      externalId: p.id,
      code: p.sku || `EXT-${platform.toUpperCase()}-${p.id}`,
      name: p.title,
      category: p.category || 'GENERAL',
      unitPrice: p.price,
      weight: p.weight || null,
      barcode: p.sku || null,
      stock: p.stock ?? 0,
      description: p.description,
      imageUrl: p.thumbnail || p.image || null,
      source: platform,
    }));

    return {
      platform,
      pulledCount: wmsItems.length,
      items: wmsItems,
      syncedAt: new Date().toISOString(),
    };
  }

  @Post('sync/pull-orders/:platform')
  @ApiOperation({ summary: '주문 Pull (외부→WMS 동기화 시뮬레이션)' })
  async pullOrders(@Param('platform') platform: string, @Query('limit') limit = '10') {
    let orders: any[] = [];

    if (platform === 'dummyjson') {
      const result = await this.getDummyOrders(limit, '0');
      orders = result.orders;
    } else if (platform === 'fakestore') {
      const result = await this.getFakeOrders(limit);
      orders = result.orders;
    }

    // WMS OutboundOrder 형식으로 매핑
    const wmsOrders = orders.map((o: any) => ({
      externalOrderId: o.id,
      orderNumber: `EXT-${platform.toUpperCase()}-${o.id}`,
      customerName: o.customerName || `User #${o.userId}`,
      totalAmount: o.total || o.totalAmount,
      currency: 'USD',
      itemCount: o.items?.length || o.products?.length || 0,
      items: (o.items || o.products || []).map((item: any) => ({
        externalProductId: item.id || item.productId,
        name: item.title || `Product #${item.productId}`,
        quantity: item.quantity || item.qty,
        unitPrice: item.price || item.unitPrice,
      })),
      source: platform,
    }));

    return {
      platform,
      pulledCount: wmsOrders.length,
      orders: wmsOrders,
      syncedAt: new Date().toISOString(),
    };
  }

  @Post('sync/push-stock/:platform')
  @ApiOperation({ summary: '재고 Push (WMS→외부 동기화 시뮬레이션)' })
  async pushStock(
    @Param('platform') platform: string,
    @Body() body: { items: Array<{ externalId: number; stock: number }> },
  ) {
    const results: any[] = [];

    for (const item of body.items) {
      try {
        if (platform === 'dummyjson') {
          const { data } = await firstValueFrom(
            this.http.put(`https://dummyjson.com/products/${item.externalId}`, { stock: item.stock }),
          );
          results.push({ externalId: item.externalId, newStock: data.stock, success: true });
        } else {
          results.push({ externalId: item.externalId, newStock: item.stock, success: true, simulated: true });
        }
      } catch (err: any) {
        results.push({ externalId: item.externalId, success: false, error: err.message });
      }
    }

    return {
      platform,
      pushedCount: results.filter((r) => r.success).length,
      failedCount: results.filter((r) => !r.success).length,
      results,
      syncedAt: new Date().toISOString(),
    };
  }

  // ═════════════════════════════════════════
  // Private mappers
  // ═════════════════════════════════════════

  private mapDummyProduct(p: any) {
    return {
      id: p.id,
      title: p.title,
      sku: p.sku,
      price: p.price,
      stock: p.stock,
      category: p.category,
      brand: p.brand,
      weight: p.weight,
      dimensions: p.dimensions,
      description: p.description,
      thumbnail: p.thumbnail,
      images: p.images,
      rating: p.rating,
      availabilityStatus: p.availabilityStatus,
      shippingInformation: p.shippingInformation,
      tags: p.tags,
    };
  }

  private mapDummyOrder(cart: any) {
    return {
      id: cart.id,
      userId: cart.userId,
      customerName: `User #${cart.userId}`,
      total: cart.total,
      discountedTotal: cart.discountedTotal,
      totalProducts: cart.totalProducts,
      totalQuantity: cart.totalQuantity,
      items: (cart.products || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        quantity: p.quantity,
        total: p.total,
        discountPercentage: p.discountPercentage,
        thumbnail: p.thumbnail,
      })),
    };
  }

  private mapFakeProduct(p: any) {
    return {
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category,
      description: p.description,
      image: p.image,
      rating: p.rating,
      stock: null,
      sku: null,
      weight: null,
    };
  }

  private mapFakeOrder(cart: any) {
    return {
      id: cart.id,
      userId: cart.userId,
      date: cart.date,
      products: (cart.products || []).map((p: any) => ({
        productId: p.productId,
        quantity: p.quantity,
      })),
    };
  }

  private mapPlatziProduct(p: any) {
    return {
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category?.name || 'Unknown',
      description: p.description,
      images: p.images,
      stock: null,
      sku: null,
      weight: null,
    };
  }
}
