import { PrismaClient } from '@prisma/client';

/**
 * KCS WMS DB 검증 테스트
 * 실행: npx jest test/db-migration.spec.ts --runInBand
 */

const prisma = new PrismaClient();
const s = Date.now().toString(36); // 테스트 간 충돌 방지용 고유 접미사

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('KCS WMS DB 검증', () => {
  // ─── 1. CRUD 동작 테스트 ───────────────────────────────
  describe('1. CRUD 동작', () => {
    const testIds = {
      userId: '',
      warehouseId: '',
      zoneId: '',
      locationId: '',
      itemId: '',
      partnerId: '',
    };

    afterAll(async () => {
      await prisma.$transaction([
        prisma.location.deleteMany({ where: { zoneId: testIds.zoneId } }),
        prisma.zone.deleteMany({ where: { warehouseId: testIds.warehouseId } }),
      ]);
      await prisma.warehouse.deleteMany({ where: { id: testIds.warehouseId } });
      await prisma.item.deleteMany({ where: { id: testIds.itemId } });
      await prisma.partner.deleteMany({ where: { id: testIds.partnerId } });
      await prisma.user.deleteMany({ where: { id: testIds.userId } });
    });

    it('User 생성/조회', async () => {
      const user = await prisma.user.create({
        data: {
          email: `dbtest-${s}@kcs.com`,
          password: '$2b$10$test_hash',
          name: 'DB테스트',
          role: 'OPERATOR',
        },
      });
      testIds.userId = user.id;
      expect(user.id).toBeDefined();
      expect(user.role).toBe('OPERATOR');
    });

    it('Warehouse 생성', async () => {
      const wh = await prisma.warehouse.create({
        data: {
          code: `WH-MIG-${s}`,
          name: '테스트 창고',
          country: 'KR',
          city: '인천',
          address: '인천시 중구',
          timezone: 'Asia/Seoul',
          status: 'ACTIVE',
        },
      });
      testIds.warehouseId = wh.id;
      expect(wh.status).toBe('ACTIVE');
      expect(wh.timezone).toBe('Asia/Seoul');
    });

    it('Zone + Location 계층 생성', async () => {
      const zone = await prisma.zone.create({
        data: {
          warehouseId: testIds.warehouseId,
          code: `Z-STG-${s}`,
          name: '보관 존',
          type: 'STORAGE',
        },
      });
      testIds.zoneId = zone.id;

      const loc = await prisma.location.create({
        data: {
          zoneId: zone.id,
          code: `A-01-${s}`,
          aisle: 'A',
          rack: '01',
          level: '02',
          bin: '03',
        },
      });
      testIds.locationId = loc.id;
      expect(loc.status).toBe('AVAILABLE');
    });

    it('Item 생성', async () => {
      const item = await prisma.item.create({
        data: {
          code: `ITEM-MIG-${s}`,
          name: '테스트 상품',
          category: 'FOOD',
          uom: 'BOX',
          minStock: 50,
        },
      });
      testIds.itemId = item.id;
      expect(item.category).toBe('FOOD');
      expect(item.minStock).toBe(50);
    });

    it('Partner 생성', async () => {
      const partner = await prisma.partner.create({
        data: {
          code: `PTR-MIG-${s}`,
          name: '테스트 거래처',
          type: 'SUPPLIER',
          country: 'KR',
          city: '서울',
        },
      });
      testIds.partnerId = partner.id;
      expect(partner.type).toBe('SUPPLIER');
    });
  });

  // ─── 2. 입출고 흐름 테스트 ─────────────────────────────
  describe('2. 입출고 프로세스', () => {
    let warehouseId: string;
    let itemId: string;
    let partnerId: string;
    let inboundOrderId: string;

    beforeAll(async () => {
      const wh = await prisma.warehouse.create({
        data: {
          code: `WH-FLW-${s}`,
          name: '프로세스 테스트 창고',
          country: 'KR',
          city: '부산',
          address: '부산시',
        },
      });
      warehouseId = wh.id;

      const item = await prisma.item.create({
        data: {
          code: `ITEM-FLW-${s}`,
          name: '프로세스 테스트 상품',
          minStock: 10,
        },
      });
      itemId = item.id;

      const partner = await prisma.partner.create({
        data: {
          code: `PTR-FLW-${s}`,
          name: '프로세스 테스트 공급사',
          type: 'SUPPLIER',
        },
      });
      partnerId = partner.id;
    });

    afterAll(async () => {
      await prisma.inventoryTransaction.deleteMany({ where: { warehouseId } });
      await prisma.inventory.deleteMany({ where: { warehouseId } });
      await prisma.inboundReceipt.deleteMany({
        where: { inboundOrderId },
      });
      await prisma.inboundOrderItem.deleteMany({
        where: { inboundOrderId },
      });
      await prisma.inboundOrder.deleteMany({ where: { id: inboundOrderId } });
      await prisma.partner.deleteMany({ where: { id: partnerId } });
      await prisma.item.deleteMany({ where: { id: itemId } });
      await prisma.warehouse.deleteMany({ where: { id: warehouseId } });
    });

    it('입고 오더 생성 → 아이템 포함', async () => {
      const order = await prisma.inboundOrder.create({
        data: {
          orderNumber: `IB-FLW-${s}`,
          partnerId,
          warehouseId,
          expectedDate: new Date(),
          items: {
            create: [{ itemId, expectedQty: 100 }],
          },
        },
        include: { items: true },
      });
      inboundOrderId = order.id;
      expect(order.items).toHaveLength(1);
      expect(order.status).toBe('DRAFT');
    });

    it('재고 생성 + 트랜잭션 기록', async () => {
      const inv = await prisma.inventory.create({
        data: {
          itemId,
          warehouseId,
          lotNo: `LOT-FLW-${s}`,
          quantity: 100,
          availableQty: 100,
          reservedQty: 0,
        },
      });
      expect(inv.quantity).toBe(100);

      const tx = await prisma.inventoryTransaction.create({
        data: {
          itemId,
          warehouseId,
          lotNo: `LOT-FLW-${s}`,
          txType: 'INBOUND',
          quantity: 100,
          referenceType: 'INBOUND_ORDER',
          referenceId: inboundOrderId,
        },
      });
      expect(tx.txType).toBe('INBOUND');
    });
  });

  // ─── 3. UNIQUE 제약조건 테스트 ─────────────────────────
  describe('3. UNIQUE 제약조건', () => {
    it('동일 email User 생성 시 실패해야 한다', async () => {
      const email = `unq-${s}@kcs.com`;
      await prisma.user.create({
        data: { email, password: 'test', name: 'test', role: 'VIEWER' },
      });

      await expect(
        prisma.user.create({
          data: { email, password: 'test2', name: 'test2', role: 'VIEWER' },
        }),
      ).rejects.toThrow();

      await prisma.user.deleteMany({ where: { email } });
    });

    it('Inventory 복합 UNIQUE (item+warehouse+location+lot) 확인', async () => {
      const wh = await prisma.warehouse.create({
        data: {
          code: `WH-UNQ-${s}`,
          name: 'UNIQUE 테스트',
          country: 'KR',
          city: '서울',
          address: '서울시',
          zones: {
            create: {
              code: `Z-UNQ-${s}`,
              name: 'UNIQUE Zone',
              locations: {
                create: {
                  code: `L-UNQ-${s}`,
                  aisle: 'A',
                  rack: '01',
                  level: '01',
                  bin: '01',
                },
              },
            },
          },
        },
        include: { zones: { include: { locations: true } } },
      });
      const locId = wh.zones[0].locations[0].id;
      const item = await prisma.item.create({
        data: { code: `ITEM-UNQ-${s}`, name: 'UNIQUE 테스트' },
      });

      // locationId 포함 → MariaDB에서 NULL 없이 UNIQUE 정상 작동
      await prisma.inventory.create({
        data: {
          itemId: item.id,
          warehouseId: wh.id,
          locationId: locId,
          lotNo: 'LOT-001',
          quantity: 10,
          availableQty: 10,
        },
      });

      // 동일 조합 생성 시도 → 실패
      await expect(
        prisma.inventory.create({
          data: {
            itemId: item.id,
            warehouseId: wh.id,
            locationId: locId,
            lotNo: 'LOT-001',
            quantity: 5,
            availableQty: 5,
          },
        }),
      ).rejects.toThrow();

      // 다른 LOT은 성공
      const inv2 = await prisma.inventory.create({
        data: {
          itemId: item.id,
          warehouseId: wh.id,
          locationId: locId,
          lotNo: 'LOT-002',
          quantity: 5,
          availableQty: 5,
        },
      });
      expect(inv2.lotNo).toBe('LOT-002');

      // 정리
      await prisma.inventory.deleteMany({ where: { warehouseId: wh.id } });
      await prisma.item.deleteMany({ where: { id: item.id } });
      await prisma.warehouse.deleteMany({ where: { id: wh.id } });
    });
  });

  // ─── 4. Cascade 삭제 테스트 ────────────────────────────
  describe('4. Cascade 삭제', () => {
    it('Warehouse 삭제 시 Zone/Location이 함께 삭제되어야 한다', async () => {
      const wh = await prisma.warehouse.create({
        data: {
          code: `WH-CSC-${s}`,
          name: 'Cascade 테스트',
          country: 'KR',
          city: '대전',
          address: '대전시',
          zones: {
            create: {
              code: `Z-CSC-${s}`,
              name: 'Cascade Zone',
              locations: {
                create: {
                  code: `L-CSC-${s}`,
                  aisle: 'A',
                  rack: '01',
                  level: '01',
                  bin: '01',
                },
              },
            },
          },
        },
        include: { zones: { include: { locations: true } } },
      });

      expect(wh.zones).toHaveLength(1);
      expect(wh.zones[0].locations).toHaveLength(1);

      await prisma.warehouse.delete({ where: { id: wh.id } });

      const zones = await prisma.zone.findMany({
        where: { warehouseId: wh.id },
      });
      const locations = await prisma.location.findMany({
        where: { zoneId: wh.zones[0].id },
      });
      expect(zones).toHaveLength(0);
      expect(locations).toHaveLength(0);
    });

    it('InboundOrder 삭제 시 Items/Receipts가 함께 삭제되어야 한다', async () => {
      const wh = await prisma.warehouse.create({
        data: {
          code: `WH-CIB-${s}`,
          name: 'IB Cascade',
          country: 'KR',
          city: '서울',
          address: '서울시',
        },
      });
      const item = await prisma.item.create({
        data: { code: `ITEM-CIB-${s}`, name: 'IB Cascade Item' },
      });
      const partner = await prisma.partner.create({
        data: {
          code: `PTR-CIB-${s}`,
          name: 'IB Cascade Partner',
          type: 'SUPPLIER',
        },
      });

      const order = await prisma.inboundOrder.create({
        data: {
          orderNumber: `IB-CSC-${s}`,
          partnerId: partner.id,
          warehouseId: wh.id,
          expectedDate: new Date(),
          items: {
            create: { itemId: item.id, expectedQty: 10 },
          },
          receipts: {
            create: { receivedBy: 'test-user' },
          },
        },
      });

      await prisma.inboundOrder.delete({ where: { id: order.id } });

      const items = await prisma.inboundOrderItem.findMany({
        where: { inboundOrderId: order.id },
      });
      const receipts = await prisma.inboundReceipt.findMany({
        where: { inboundOrderId: order.id },
      });
      expect(items).toHaveLength(0);
      expect(receipts).toHaveLength(0);

      await prisma.partner.delete({ where: { id: partner.id } });
      await prisma.item.delete({ where: { id: item.id } });
      await prisma.warehouse.delete({ where: { id: wh.id } });
    });
  });

  // ─── 5. 채널 연동 테스트 ──────────────────────────────
  describe('5. 채널 연동 CRUD', () => {
    let warehouseId: string;
    let channelId: string;
    let itemId: string;

    beforeAll(async () => {
      const wh = await prisma.warehouse.create({
        data: {
          code: `WH-CH-${s}`,
          name: '채널 테스트 창고',
          country: 'KR',
          city: '서울',
          address: '서울시',
        },
      });
      warehouseId = wh.id;

      const item = await prisma.item.create({
        data: { code: `ITEM-CH-${s}`, name: '채널 테스트 상품' },
      });
      itemId = item.id;
    });

    afterAll(async () => {
      await prisma.channelSyncLog.deleteMany({
        where: { channelId: channelId || '' },
      });
      await prisma.channelProduct.deleteMany({
        where: { channelId: channelId || '' },
      });
      await prisma.channelOrderItem.deleteMany({
        where: { channelOrder: { channelId: channelId || '' } },
      });
      await prisma.channelOrder.deleteMany({
        where: { channelId: channelId || '' },
      });
      await prisma.salesChannel.deleteMany({ where: { id: channelId || '' } });
      await prisma.item.deleteMany({ where: { id: itemId } });
      await prisma.warehouse.deleteMany({ where: { id: warehouseId } });
    });

    it('SalesChannel 생성', async () => {
      const channel = await prisma.salesChannel.create({
        data: {
          name: '쿠팡 테스트',
          platform: 'COUPANG',
          sellerId: `seller-${s}`,
          warehouseId,
          credentials: { apiKey: 'test-key', secretKey: 'test-secret' },
          syncInterval: 15,
        },
      });
      channelId = channel.id;
      expect(channel.platform).toBe('COUPANG');
      expect(channel.status).toBe('PENDING');
      expect(channel.syncInterval).toBe(15);
    });

    it('ChannelProduct 매핑', async () => {
      const cp = await prisma.channelProduct.create({
        data: {
          channelId,
          itemId,
          platformProductId: 'CPNG-12345',
          platformSku: `SKU-${s}`,
        },
      });
      expect(cp.isLinked).toBe(true);
    });

    it('ChannelOrder + Items 생성', async () => {
      const order = await prisma.channelOrder.create({
        data: {
          channelId,
          platformOrderId: `ORD-${s}`,
          platformOrderNo: `2026032100001`,
          orderDate: new Date(),
          customerName: '테스트 고객',
          totalAmount: 35000,
          currency: 'KRW',
          items: {
            create: {
              itemName: '채널 상품 A',
              quantity: 2,
              unitPrice: 17500,
              itemId,
            },
          },
        },
        include: { items: true },
      });
      expect(order.status).toBe('NEW');
      expect(order.items).toHaveLength(1);
      expect(order.items[0].quantity).toBe(2);
    });

    it('ChannelSyncLog 기록', async () => {
      const log = await prisma.channelSyncLog.create({
        data: {
          channelId,
          syncType: 'ORDER_PULL',
          direction: 'INBOUND',
          status: 'SUCCESS',
          recordCount: 5,
        },
      });
      expect(log.status).toBe('SUCCESS');
      expect(log.recordCount).toBe(5);
    });
  });
});
