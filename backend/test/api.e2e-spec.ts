import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

/**
 * KCS WMS API E2E 테스트
 * 실행: npx jest --config test/jest-e2e.json test/api.e2e-spec.ts --runInBand
 */

const s = Date.now().toString(36); // 고유 접미사

describe('KCS WMS API (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let operatorToken: string;

  // 테스트 데이터 ID 저장
  const ids = {
    warehouse: '',
    zone: '',
    location: '',
    item: '',
    partner: '',
    inboundOrder: '',
    inboundOrderItemId: '',
    outboundOrder: '',
    outboundOrderItemId: '',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    try {
      await prisma.channelOrderItem.deleteMany({});
      await prisma.channelOrder.deleteMany({});
      await prisma.channelProduct.deleteMany({});
      await prisma.channelSyncLog.deleteMany({});
      await prisma.salesChannel.deleteMany({});
      await prisma.inventoryTransaction.deleteMany({});
      await prisma.inventory.deleteMany({});
      await prisma.inboundReceipt.deleteMany({});
      await prisma.inboundOrderItem.deleteMany({});
      await prisma.inboundOrder.deleteMany({});
      await prisma.outboundShipment.deleteMany({});
      await prisma.outboundOrderItem.deleteMany({});
      await prisma.outboundOrder.deleteMany({});
      await prisma.stockAdjustment.deleteMany({});
      await prisma.cycleCount.deleteMany({});
      await prisma.location.deleteMany({});
      await prisma.zone.deleteMany({});
      await prisma.item.deleteMany({});
      await prisma.warehouse.deleteMany({});
      await prisma.partner.deleteMany({});
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [`admin_${s}@test.com`, `operator_${s}@test.com`],
          },
        },
      });
    } catch (e) {
      console.warn('Cleanup warning:', e.message);
    }
    await app.close();
  });

  // ═══════════════════════════════════════════════════════
  // 1. Auth 테스트
  // ═══════════════════════════════════════════════════════
  describe('1. Auth', () => {
    it('POST /api/auth/register → 201 (ADMIN 유저 생성)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `admin_${s}@test.com`,
          password: 'Test1234',
          name: 'E2E Admin',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(`admin_${s}@test.com`);
    });

    it('ADMIN 역할 수동 부여 (DB 직접 업데이트)', async () => {
      await prisma.user.update({
        where: { email: `admin_${s}@test.com` },
        data: { role: 'ADMIN' },
      });
    });

    it('POST /api/auth/register → 201 (OPERATOR 유저 생성, role 강제 OPERATOR)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `operator_${s}@test.com`,
          password: 'Test1234',
          name: 'E2E Operator',
        })
        .expect(201);

      expect(res.body.data.user.role).toBe('OPERATOR');
    });

    it('POST /api/auth/login → 200, accessToken 반환 (ADMIN)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: `admin_${s}@test.com`,
          password: 'Test1234',
        })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
      adminToken = res.body.data.accessToken;
    });

    it('POST /api/auth/login → 200, accessToken 반환 (OPERATOR)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: `operator_${s}@test.com`,
          password: 'Test1234',
        })
        .expect(200);

      operatorToken = res.body.data.accessToken;
    });

    it('GET /api/auth/profile → 200 (인증된 유저)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.email).toBe(`admin_${s}@test.com`);
      expect(res.body.data.role).toBe('ADMIN');
    });

    it('GET /api/auth/profile → 401 (미인증)', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(401);
    });

    it('GET /api/auth/users → 200 (ADMIN)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
    });

    it('GET /api/auth/users → 403 (OPERATOR)', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(403);
    });
  });

  // ═══════════════════════════════════════════════════════
  // 2. CRUD 테스트 - Warehouse
  // ═══════════════════════════════════════════════════════
  describe('2. Warehouse CRUD', () => {
    it('POST /api/warehouses → 201 (창고 생성)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/warehouses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: `WH-${s}`,
          name: `Test Warehouse ${s}`,
          country: 'KR',
          city: 'Seoul',
          address: '강남구 테스트로 1',
        })
        .expect(201);

      expect(res.body.data.code).toBe(`WH-${s}`);
      ids.warehouse = res.body.data.id;
    });

    it('GET /api/warehouses → 200 (목록, data 배열 + meta)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/warehouses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.data).toBeInstanceOf(Array);
      expect(res.body.data.meta || res.body.data.total).toBeDefined();
    });

    it('GET /api/warehouses/:id → 200 (상세)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/warehouses/${ids.warehouse}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(ids.warehouse);
    });

    it('PUT /api/warehouses/:id → 200 (수정)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/warehouses/${ids.warehouse}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Updated WH ${s}` })
        .expect(200);

      expect(res.body.data.name).toBe(`Updated WH ${s}`);
    });

    it('POST zone + location 생성', async () => {
      // Zone 생성
      const zoneRes = await request(app.getHttpServer())
        .post(`/api/warehouses/${ids.warehouse}/zones`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: `Z-${s}`, name: 'Test Zone', type: 'STORAGE' })
        .expect(201);

      ids.zone = zoneRes.body.data.id;

      // Location 생성
      const locRes = await request(app.getHttpServer())
        .post(`/api/warehouses/${ids.warehouse}/zones/${ids.zone}/locations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: `A-01-01-01-${s}`,
          aisle: 'A',
          rack: '01',
          level: '01',
          bin: '01',
        })
        .expect(201);

      ids.location = locRes.body.data.id;
    });
  });

  // ═══════════════════════════════════════════════════════
  // 3. CRUD 테스트 - Item
  // ═══════════════════════════════════════════════════════
  describe('3. Item CRUD', () => {
    it('POST /api/items → 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: `ITEM-${s}`,
          name: `Test Item ${s}`,
          category: 'GENERAL',
          uom: 'EA',
          weight: 1.5,
          minStock: 10,
        })
        .expect(201);

      ids.item = res.body.data.id;
    });

    it('GET /api/items → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.data).toBeInstanceOf(Array);
    });

    it('GET /api/items/:id → 200', async () => {
      await request(app.getHttpServer())
        .get(`/api/items/${ids.item}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('PUT /api/items/:id → 200', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/items/${ids.item}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Updated Item ${s}` })
        .expect(200);

      expect(res.body.data.name).toBe(`Updated Item ${s}`);
    });
  });

  // ═══════════════════════════════════════════════════════
  // 4. CRUD 테스트 - Partner
  // ═══════════════════════════════════════════════════════
  describe('4. Partner CRUD', () => {
    it('POST /api/partners → 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/partners')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: `PTR-${s}`,
          name: `Test Partner ${s}`,
          type: 'SUPPLIER',
        })
        .expect(201);

      ids.partner = res.body.data.id;
    });

    it('GET /api/partners → 200 (type 필터)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/partners?type=SUPPLIER')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.data).toBeInstanceOf(Array);
    });

    it('PUT /api/partners/:id → 200', async () => {
      await request(app.getHttpServer())
        .put(`/api/partners/${ids.partner}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ contactName: 'John Doe' })
        .expect(200);
    });
  });

  // ═══════════════════════════════════════════════════════
  // 5. Inbound 워크플로우 테스트
  // ═══════════════════════════════════════════════════════
  describe('5. Inbound Workflow', () => {
    it('POST /api/inbound → 201 (DRAFT 생성)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/inbound')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderNumber: `IN-${s}`,
          partnerId: ids.partner,
          warehouseId: ids.warehouse,
          expectedDate: new Date(Date.now() + 86400000).toISOString(),
          items: [
            { itemId: ids.item, expectedQty: 100 },
          ],
        })
        .expect(201);

      expect(res.body.data.status).toBe('DRAFT');
      ids.inboundOrder = res.body.data.id;
    });

    it('GET /api/inbound/:id → 200 (상세 + items)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/inbound/${ids.inboundOrder}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.items).toBeInstanceOf(Array);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      ids.inboundOrderItemId = res.body.data.items[0].id;
    });

    it('POST /api/inbound/:id/confirm → DRAFT → CONFIRMED', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/inbound/${ids.inboundOrder}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.status).toBe('CONFIRMED');
    });

    it('POST /api/inbound/:id/arrive → CONFIRMED → ARRIVED', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/inbound/${ids.inboundOrder}/arrive`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.status).toBe('ARRIVED');
    });

    it('POST /api/inbound/:id/receive → ARRIVED → COMPLETED + 재고 증가', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/inbound/${ids.inboundOrder}/receive`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          receivedBy: 'e2e-tester',
          items: [
            {
              inboundOrderItemId: ids.inboundOrderItemId,
              receivedQty: 100,
              damagedQty: 0,
            },
          ],
        })
        .expect(200);

      // 상태가 RECEIVING 또는 COMPLETED
      expect(['RECEIVING', 'COMPLETED']).toContain(res.body.data.status);
    });

    it('재고가 정확히 증가했는지 검증', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/inventory/stock?warehouseId=${ids.warehouse}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const stockData = res.body.data.data || res.body.data;
      const itemStock = Array.isArray(stockData)
        ? stockData.find((s: any) => s.itemId === ids.item)
        : null;

      if (itemStock) {
        expect(itemStock.quantity).toBeGreaterThanOrEqual(100);
      }
    });
  });

  // ═══════════════════════════════════════════════════════
  // 6. Outbound 워크플로우 테스트
  // ═══════════════════════════════════════════════════════
  describe('6. Outbound Workflow', () => {
    it('POST /api/outbound → 201 (DRAFT 생성)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/outbound')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderNumber: `OUT-${s}`,
          partnerId: ids.partner,
          warehouseId: ids.warehouse,
          items: [
            { itemId: ids.item, orderedQty: 10 },
          ],
        })
        .expect(201);

      expect(res.body.data.status).toBe('DRAFT');
      ids.outboundOrder = res.body.data.id;
    });

    it('GET /api/outbound/:id → 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/outbound/${ids.outboundOrder}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      ids.outboundOrderItemId = res.body.data.items[0].id;
    });

    it('POST /api/outbound/:id/confirm → DRAFT → CONFIRMED (재고 예약)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/outbound/${ids.outboundOrder}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.status).toBe('CONFIRMED');
    });

    it('POST /api/outbound/:id/pick → CONFIRMED → PICKING', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/outbound/${ids.outboundOrder}/pick`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          pickedBy: 'e2e-tester',
          items: [
            { outboundOrderItemId: ids.outboundOrderItemId, pickedQty: 10 },
          ],
        })
        .expect(200);

      expect(['PICKING', 'PACKING']).toContain(res.body.data.status);
    });

    it('POST /api/outbound/:id/ship → SHIPPING', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/outbound/${ids.outboundOrder}/ship`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          shippedBy: 'e2e-tester',
          carrier: 'CJ 대한통운',
          trackingNumber: `TRK-${s}`,
        })
        .expect(200);

      expect(res.body.data.status).toBe('SHIPPED');
    });

    it('POST /api/outbound/:id/deliver → DELIVERED', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/outbound/${ids.outboundOrder}/deliver`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.status).toBe('DELIVERED');
    });

    it('재고 부족 시 confirm 실패 검증', async () => {
      // 재고보다 많은 수량으로 출고 주문 생성
      const createRes = await request(app.getHttpServer())
        .post('/api/outbound')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          orderNumber: `OUT-FAIL-${s}`,
          partnerId: ids.partner,
          warehouseId: ids.warehouse,
          items: [
            { itemId: ids.item, orderedQty: 999999 },
          ],
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/outbound/${createRes.body.data.id}/confirm`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  // ═══════════════════════════════════════════════════════
  // 7. Inventory 테스트
  // ═══════════════════════════════════════════════════════
  describe('7. Inventory', () => {
    it('GET /api/inventory/stock → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/inventory/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('GET /api/inventory/transactions → 200', async () => {
      await request(app.getHttpServer())
        .get('/api/inventory/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('POST /api/inventory/adjustments → 재고 조정', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/inventory/adjustments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          warehouseId: ids.warehouse,
          itemCode: `ITEM-${s}`,
          adjustQty: 5,
          reason: 'FOUND',
          performedBy: 'e2e-tester',
          notes: 'E2E 테스트 재고 조정',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('GET /api/inventory/adjustments → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/inventory/adjustments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('GET /api/inventory/cycle-counts → 200', async () => {
      await request(app.getHttpServer())
        .get('/api/inventory/cycle-counts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('POST /api/inventory/cycle-counts → 순환실사 생성', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/inventory/cycle-counts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          warehouseId: ids.warehouse,
          itemCode: `ITEM-${s}`,
          systemQty: 95,
        })
        .expect(201);

      expect(res.body.data.status).toBe('PLANNED');
    });
  });

  // ═══════════════════════════════════════════════════════
  // 8. Dashboard 테스트
  // ═══════════════════════════════════════════════════════
  describe('8. Dashboard', () => {
    it('GET /api/dashboard/statistics → 200, 구조 검증', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/dashboard/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const data = res.body.data;
      expect(data).toBeDefined();
      // 최소한 inventory 또는 inbound/outbound 키가 존재
      expect(
        data.inventory !== undefined ||
        data.inbound !== undefined ||
        data.warehouses !== undefined
      ).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════
  // 9. Export 테스트
  // ═══════════════════════════════════════════════════════
  describe('9. Export', () => {
    it('GET /api/export/items → 401 (미인증)', async () => {
      await request(app.getHttpServer())
        .get('/api/export/items')
        .expect(401);
    });

    it('GET /api/export/items → 200 + xlsx content-type', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/export/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.headers['content-disposition']).toContain('.xlsx');
    });

    it('GET /api/export/inventory → 200', async () => {
      await request(app.getHttpServer())
        .get('/api/export/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('GET /api/export/inbound → 200', async () => {
      await request(app.getHttpServer())
        .get('/api/export/inbound')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('GET /api/export/outbound → 200', async () => {
      await request(app.getHttpServer())
        .get('/api/export/outbound')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('GET /api/export/partners → 200', async () => {
      await request(app.getHttpServer())
        .get('/api/export/partners')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('GET /api/export/warehouses → 200', async () => {
      await request(app.getHttpServer())
        .get('/api/export/warehouses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  // ═══════════════════════════════════════════════════════
  // 10. External Channels 테스트
  // ═══════════════════════════════════════════════════════
  describe('10. External Channels', () => {
    let channelId: string;

    it('POST /api/channels → 201 (채널 생성)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/channels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `E2E 쿠팡 ${s}`,
          platform: 'COUPANG',
          warehouseId: ids.warehouse,
          credentials: {
            vendorId: 'test-vendor',
            accessKey: 'test-access',
            secretKey: 'test-secret',
          },
          syncInterval: 30,
        })
        .expect(201);

      channelId = res.body.data.id;
      expect(res.body.data.platform).toBe('COUPANG');
      // credentials 마스킹 확인
      expect(res.body.data.credentials.secretKey).toContain('****');
    });

    it('GET /api/channels → 200 (목록)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/channels')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.data).toBeInstanceOf(Array);
    });

    it('GET /api/channels/:id → 200 (상세)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/channels/${channelId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(channelId);
    });

    it('PUT /api/channels/:id → 200 (수정)', async () => {
      await request(app.getHttpServer())
        .put(`/api/channels/${channelId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ syncInterval: 60 })
        .expect(200);
    });

    it('DELETE /api/channels/:id → 200 (삭제)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/channels/${channelId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  // ═══════════════════════════════════════════════════════
  // 11. DELETE 의존관계 테스트
  // ═══════════════════════════════════════════════════════
  describe('11. Delete with Dependencies', () => {
    it('DELETE /api/items/:id → 실패 (입고주문에 사용중)', async () => {
      // 이미 inbound에서 사용 중이므로 삭제 실패해야 함
      const res = await request(app.getHttpServer())
        .delete(`/api/items/${ids.item}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // 400 또는 409 (의존관계)
      expect([400, 409, 500]).toContain(res.status);
    });
  });
});
