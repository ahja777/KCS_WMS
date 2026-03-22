import { PrismaClient } from '@prisma/client';

/**
 * KCS WMS 전체 DB CRUD 테스트
 * 모든 35+ 테이블에 대한 Create/Read/Update/Delete 검증
 * 실행: npx jest test/db-crud-all.spec.ts --runInBand
 */

const prisma = new PrismaClient();
const s = Date.now().toString(36);

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ═══════════════════════════════════════════════════════════════
// 1. 시스템관리 (TMSYS)
// ═══════════════════════════════════════════════════════════════
describe('시스템관리', () => {
  // ── User (TMSYS030: 사용자관리) ──
  describe('User CRUD', () => {
    let userId: string;

    afterAll(async () => {
      if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    });

    it('CREATE - 사용자 생성', async () => {
      const user = await prisma.user.create({
        data: {
          email: `crud-user-${s}@kcs.com`,
          password: '$2b$10$hash',
          name: 'CRUD테스트유저',
          role: 'ADMIN',
          isActive: true,
        },
      });
      userId = user.id;
      expect(user.id).toBeDefined();
      expect(user.role).toBe('ADMIN');
    });

    it('READ - 사용자 조회', async () => {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      expect(user).not.toBeNull();
      expect(user!.name).toBe('CRUD테스트유저');
    });

    it('UPDATE - 사용자 수정', async () => {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { name: '수정된유저', role: 'MANAGER' },
      });
      expect(updated.name).toBe('수정된유저');
      expect(updated.role).toBe('MANAGER');
    });

    it('DELETE - 사용자 삭제', async () => {
      await prisma.user.delete({ where: { id: userId } });
      const found = await prisma.user.findUnique({ where: { id: userId } });
      expect(found).toBeNull();
      userId = ''; // prevent afterAll cleanup error
    });
  });

  // ── CommonCode (TMSYS010: 기준관리) ──
  describe('CommonCode CRUD', () => {
    let codeId: string;

    afterAll(async () => {
      if (codeId) await prisma.commonCode.deleteMany({ where: { id: codeId } });
    });

    it('CREATE', async () => {
      const code = await prisma.commonCode.create({
        data: {
          codeType: 'WH_TYPE',
          typeNm: '창고유형',
          code: `TP-${s}`,
          codeNm: '상온창고',
          value: 'NORMAL',
          sortOrder: 1,
        },
      });
      codeId = code.id;
      expect(code.codeType).toBe('WH_TYPE');
    });

    it('READ', async () => {
      const codes = await prisma.commonCode.findMany({
        where: { codeType: 'WH_TYPE' },
      });
      expect(codes.length).toBeGreaterThan(0);
    });

    it('UPDATE', async () => {
      const updated = await prisma.commonCode.update({
        where: { id: codeId },
        data: { codeNm: '냉동창고', value: 'FROZEN' },
      });
      expect(updated.codeNm).toBe('냉동창고');
    });

    it('DELETE', async () => {
      await prisma.commonCode.delete({ where: { id: codeId } });
      const found = await prisma.commonCode.findUnique({ where: { id: codeId } });
      expect(found).toBeNull();
      codeId = '';
    });
  });

  // ── InterfaceLog (TMSYS090: 인터페이스현황) ──
  describe('InterfaceLog CRUD', () => {
    let logId: string;

    afterAll(async () => {
      if (logId) await prisma.interfaceLog.deleteMany({ where: { id: logId } });
    });

    it('CREATE', async () => {
      const log = await prisma.interfaceLog.create({
        data: {
          interfaceType: 'ERP_ORDER_SYNC',
          direction: 'SEND',
          status: 'SUCCESS',
          requestData: '{"orderId":"test"}',
          responseData: '{"result":"ok"}',
        },
      });
      logId = log.id;
      expect(log.status).toBe('SUCCESS');
    });

    it('READ', async () => {
      const log = await prisma.interfaceLog.findUnique({ where: { id: logId } });
      expect(log).not.toBeNull();
      expect(log!.interfaceType).toBe('ERP_ORDER_SYNC');
    });

    it('UPDATE', async () => {
      const updated = await prisma.interfaceLog.update({
        where: { id: logId },
        data: { status: 'FAILED', errorMessage: '타임아웃' },
      });
      expect(updated.status).toBe('FAILED');
    });

    it('DELETE', async () => {
      await prisma.interfaceLog.delete({ where: { id: logId } });
      logId = '';
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. 기준관리 (WMSMS)
// ═══════════════════════════════════════════════════════════════
describe('기준관리', () => {
  let warehouseId: string;

  beforeAll(async () => {
    const wh = await prisma.warehouse.create({
      data: {
        code: `WH-ALL-${s}`,
        name: '전체CRUD테스트창고',
        country: 'KR',
        city: '인천',
        address: '인천시 서구',
        timezone: 'Asia/Seoul',
        temperatureType: 'COLD',
        isBonded: true,
        warehouseType: 'DC',
        warehouseClass: 'A',
      },
    });
    warehouseId = wh.id;
  });

  afterAll(async () => {
    // Clean up in dependency order
    await prisma.dock.deleteMany({ where: { warehouseId } });
    await prisma.vehicle.deleteMany({ where: { warehouseId } });
    await prisma.location.deleteMany({ where: { zone: { warehouseId } } });
    await prisma.zone.deleteMany({ where: { warehouseId } });
    await prisma.warehouse.deleteMany({ where: { id: warehouseId } });
  });

  // ── Warehouse (WMSMS030: 물류센터정보) ──
  describe('Warehouse CRUD', () => {
    it('READ - 창고 조회 + ERD 필드 확인', async () => {
      const wh = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
      expect(wh).not.toBeNull();
      expect(wh!.temperatureType).toBe('COLD');
      expect(wh!.isBonded).toBe(true);
      expect(wh!.warehouseType).toBe('DC');
      expect(wh!.warehouseClass).toBe('A');
    });

    it('UPDATE - 창고 수정', async () => {
      const updated = await prisma.warehouse.update({
        where: { id: warehouseId },
        data: {
          name: '수정된 창고',
          status: 'MAINTENANCE',
          contactName: '김관리',
          contactPhone: '010-1234-5678',
          latitude: 37.4563,
          longitude: 126.7052,
        },
      });
      expect(updated.status).toBe('MAINTENANCE');
      expect(updated.latitude).toBeCloseTo(37.4563);
    });
  });

  // ── Zone (WMSMS081: ZONE정보관리) ──
  describe('Zone CRUD', () => {
    let zoneId: string;

    afterAll(async () => {
      if (zoneId) {
        await prisma.location.deleteMany({ where: { zoneId } });
        await prisma.zone.deleteMany({ where: { id: zoneId } });
      }
    });

    it('CREATE', async () => {
      const zone = await prisma.zone.create({
        data: {
          warehouseId,
          code: `Z-CRUD-${s}`,
          name: '입고존',
          type: 'RECEIVING',
          description: '입고용 존',
        },
      });
      zoneId = zone.id;
      expect(zone.type).toBe('RECEIVING');
    });

    it('READ', async () => {
      const zone = await prisma.zone.findUnique({
        where: { id: zoneId },
        include: { warehouse: true },
      });
      expect(zone!.warehouse.id).toBe(warehouseId);
    });

    it('UPDATE', async () => {
      const updated = await prisma.zone.update({
        where: { id: zoneId },
        data: { type: 'STORAGE', name: '보관존으로변경' },
      });
      expect(updated.type).toBe('STORAGE');
    });
  });

  // ── Location (WMSMS080: 로케이션정보관리) ──
  describe('Location CRUD', () => {
    let zoneId: string;
    let locationId: string;

    beforeAll(async () => {
      const zone = await prisma.zone.create({
        data: { warehouseId, code: `Z-LOC-${s}`, name: 'LOC Zone' },
      });
      zoneId = zone.id;
    });

    afterAll(async () => {
      if (locationId) await prisma.location.deleteMany({ where: { id: locationId } });
      if (zoneId) await prisma.zone.deleteMany({ where: { id: zoneId } });
    });

    it('CREATE - 화면설계서 Slide 48 필드 포함', async () => {
      const loc = await prisma.location.create({
        data: {
          zoneId,
          code: `A-01-01-01-${s}`,
          aisle: 'A',
          rack: '01',
          level: '01',
          bin: '01',
          maxWeight: 1000,
          maxVolume: 50.5,
          locationType: 'RACK',
          capacity: 500,
          isRestricted: false,
        },
      });
      locationId = loc.id;
      expect(loc.status).toBe('AVAILABLE');
      expect(loc.locationType).toBe('RACK');
      expect(loc.capacity).toBe(500);
    });

    it('UPDATE', async () => {
      const updated = await prisma.location.update({
        where: { id: locationId },
        data: { status: 'BLOCKED', isRestricted: true },
      });
      expect(updated.status).toBe('BLOCKED');
      expect(updated.isRestricted).toBe(true);
    });
  });

  // ── Dock (WMSMS120: 도크장정보관리) ──
  describe('Dock CRUD', () => {
    let dockId: string;

    afterAll(async () => {
      if (dockId) await prisma.dock.deleteMany({ where: { id: dockId } });
    });

    it('CREATE', async () => {
      const dock = await prisma.dock.create({
        data: {
          warehouseId,
          code: `DK-${s}`,
          name: '1번 도크',
          sortOrder: 1,
          maxTonnage: 5.0,
          vehiclePlate: '12가3456',
        },
      });
      dockId = dock.id;
      expect(dock.maxTonnage).toBe(5.0);
    });

    it('READ', async () => {
      const dock = await prisma.dock.findUnique({ where: { id: dockId } });
      expect(dock!.code).toBe(`DK-${s}`);
    });

    it('UPDATE', async () => {
      const updated = await prisma.dock.update({
        where: { id: dockId },
        data: { name: '수정된 도크', vehiclePlate: '34나5678' },
      });
      expect(updated.vehiclePlate).toBe('34나5678');
    });

    it('DELETE', async () => {
      await prisma.dock.delete({ where: { id: dockId } });
      dockId = '';
    });
  });

  // ── Vehicle (WMSMS050: 차량관리) ──
  describe('Vehicle CRUD', () => {
    let vehicleId: string;

    afterAll(async () => {
      if (vehicleId) await prisma.vehicle.deleteMany({ where: { id: vehicleId } });
    });

    it('CREATE', async () => {
      const vehicle = await prisma.vehicle.create({
        data: {
          plateNo: `PL-${s}`,
          tonnage: 3.5,
          driverName: '김기사',
          driverPhone: '010-9999-0000',
          warehouseId,
        },
      });
      vehicleId = vehicle.id;
      expect(vehicle.tonnage).toBe(3.5);
    });

    it('UPDATE', async () => {
      const updated = await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { driverName: '이기사', isActive: false },
      });
      expect(updated.driverName).toBe('이기사');
      expect(updated.isActive).toBe(false);
    });
  });

  // ── UomMaster (WMSMS100: UOM정보관리) ──
  describe('UomMaster CRUD', () => {
    let uomId: string;

    afterAll(async () => {
      if (uomId) await prisma.uomMaster.deleteMany({ where: { id: uomId } });
    });

    it('CREATE', async () => {
      const uom = await prisma.uomMaster.create({
        data: { code: `UOM-${s}`, name: '팔레트' },
      });
      uomId = uom.id;
      expect(uom.code).toBe(`UOM-${s}`);
    });

    it('UPDATE', async () => {
      const updated = await prisma.uomMaster.update({
        where: { id: uomId },
        data: { name: '수정된 UOM' },
      });
      expect(updated.name).toBe('수정된 UOM');
    });
  });

  // ── UomConversion (WMSMS101: UOM환산) ──
  describe('UomConversion CRUD', () => {
    let fromUomId: string;
    let toUomId: string;
    let convId: string;

    beforeAll(async () => {
      const from = await prisma.uomMaster.create({ data: { code: `UF-${s}`, name: 'EA' } });
      const to = await prisma.uomMaster.create({ data: { code: `UT-${s}`, name: 'BOX' } });
      fromUomId = from.id;
      toUomId = to.id;
    });

    afterAll(async () => {
      if (convId) await prisma.uomConversion.deleteMany({ where: { id: convId } });
      await prisma.uomMaster.deleteMany({ where: { id: { in: [fromUomId, toUomId] } } });
    });

    it('CREATE', async () => {
      const conv = await prisma.uomConversion.create({
        data: {
          fromUomId,
          toUomId,
          convQty: 24,
          startDate: new Date('2025-01-01'),
        },
      });
      convId = conv.id;
      expect(conv.convQty).toBe(24);
    });

    it('UPDATE', async () => {
      const updated = await prisma.uomConversion.update({
        where: { id: convId },
        data: { convQty: 30, endDate: new Date('2026-12-31') },
      });
      expect(updated.convQty).toBe(30);
    });
  });

  // ── ItemGroup (WMSMS094: 상품군관리) ──
  describe('ItemGroup CRUD', () => {
    let groupId: string;

    afterAll(async () => {
      if (groupId) await prisma.itemGroup.deleteMany({ where: { id: groupId } });
    });

    it('CREATE', async () => {
      const group = await prisma.itemGroup.create({
        data: {
          code: `GRP-${s}`,
          name: '신선식품군',
          groupType: 'FOOD',
          inboundZone: 'COLD',
        },
      });
      groupId = group.id;
      expect(group.groupType).toBe('FOOD');
    });

    it('UPDATE', async () => {
      const updated = await prisma.itemGroup.update({
        where: { id: groupId },
        data: { name: '냉동식품군' },
      });
      expect(updated.name).toBe('냉동식품군');
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// 3. 상품관리 (WMSMS090)
// ═══════════════════════════════════════════════════════════════
describe('상품관리', () => {
  // ── Item (WMSMS090: 상품정보관리) ──
  describe('Item CRUD', () => {
    let itemId: string;
    let groupId: string;

    beforeAll(async () => {
      const group = await prisma.itemGroup.create({
        data: { code: `IG-IT-${s}`, name: '테스트상품군' },
      });
      groupId = group.id;
    });

    afterAll(async () => {
      if (itemId) await prisma.item.deleteMany({ where: { id: itemId } });
      if (groupId) await prisma.itemGroup.deleteMany({ where: { id: groupId } });
    });

    it('CREATE - ERD + 화면설계서 전체 필드', async () => {
      const item = await prisma.item.create({
        data: {
          code: `ITEM-CRUD-${s}`,
          name: '테스트 라면',
          description: '매운라면',
          barcode: `BC-${s}`,
          category: 'FOOD',
          uom: 'BOX',
          weight: 0.5,
          length: 20,
          width: 10,
          height: 5,
          minStock: 100,
          maxStock: 5000,
          temperatureType: 'NORMAL',
          lotControl: true,
          expiryControl: true,
          expiryDays: 365,
          storageType: 'NORMAL',
          itemGroupId: groupId,
          unitPrice: 1200,
          inboundZone: 'A-ZONE',
        },
      });
      itemId = item.id;
      expect(item.lotControl).toBe(true);
      expect(item.expiryControl).toBe(true);
      expect(item.unitPrice).toBe(1200);
      expect(item.itemGroupId).toBe(groupId);
    });

    it('READ with relation', async () => {
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        include: { itemGroup: true },
      });
      expect(item!.itemGroup).not.toBeNull();
      expect(item!.itemGroup!.code).toBe(`IG-IT-${s}`);
    });

    it('UPDATE', async () => {
      const updated = await prisma.item.update({
        where: { id: itemId },
        data: { name: '수정된라면', unitPrice: 1500, isActive: false },
      });
      expect(updated.unitPrice).toBe(1500);
      expect(updated.isActive).toBe(false);
    });
  });

  // ── Partner (WMSMS010/011: 화주/거래처정보관리) ──
  describe('Partner CRUD', () => {
    let partnerId: string;

    afterAll(async () => {
      if (partnerId) await prisma.partner.deleteMany({ where: { id: partnerId } });
    });

    it('CREATE - 화면설계서 Slide 49-50 필드', async () => {
      const partner = await prisma.partner.create({
        data: {
          code: `PTR-CRUD-${s}`,
          name: '(주)테스트물류',
          type: 'SUPPLIER',
          contactName: '박대표',
          contactPhone: '02-1234-5678',
          contactEmail: 'test@partner.com',
          country: 'KR',
          city: '서울',
          address: '서울시 강남구',
          businessNo: '123-45-67890',
          president: '박대표',
          faxNumber: '02-1234-5679',
          website: 'https://partner.com',
          businessType: '제조업',
          businessKind: '식품',
          creditRating: 'A',
          shipControl: false,
        },
      });
      partnerId = partner.id;
      expect(partner.businessNo).toBe('123-45-67890');
      expect(partner.creditRating).toBe('A');
    });

    it('UPDATE', async () => {
      const updated = await prisma.partner.update({
        where: { id: partnerId },
        data: { creditRating: 'B', shipControl: true },
      });
      expect(updated.shipControl).toBe(true);
    });
  });

  // ── SetItem (WMSMS092: 세트상품구성정보) ──
  describe('SetItem CRUD', () => {
    let setItemId: string;
    let parentItemId: string;
    let childItemId: string;

    beforeAll(async () => {
      const parent = await prisma.item.create({
        data: { code: `SET-P-${s}`, name: '세트상품' },
      });
      const child = await prisma.item.create({
        data: { code: `SET-C-${s}`, name: '구성품목' },
      });
      parentItemId = parent.id;
      childItemId = child.id;
    });

    afterAll(async () => {
      if (setItemId) await prisma.setItem.deleteMany({ where: { id: setItemId } });
      await prisma.item.deleteMany({ where: { id: { in: [parentItemId, childItemId] } } });
    });

    it('CREATE', async () => {
      const set = await prisma.setItem.create({
        data: { parentItemId, childItemId, quantity: 3 },
      });
      setItemId = set.id;
      expect(set.quantity).toBe(3);
    });

    it('UPDATE', async () => {
      const updated = await prisma.setItem.update({
        where: { id: setItemId },
        data: { quantity: 5 },
      });
      expect(updated.quantity).toBe(5);
    });
  });

  // ── PartnerProduct (WMSMS095: 화주별거래처상품관리) ──
  describe('PartnerProduct CRUD', () => {
    let ppId: string;

    afterAll(async () => {
      if (ppId) await prisma.partnerProduct.deleteMany({ where: { id: ppId } });
    });

    it('CREATE', async () => {
      const pp = await prisma.partnerProduct.create({
        data: {
          partnerId: 'test-partner-id',
          customerPartnerId: 'test-customer-id',
          expiryControl: true,
        },
      });
      ppId = pp.id;
      expect(pp.expiryControl).toBe(true);
    });

    it('UPDATE', async () => {
      const updated = await prisma.partnerProduct.update({
        where: { id: ppId },
        data: { expiryControl: false },
      });
      expect(updated.expiryControl).toBe(false);
    });
  });

  // ── LocationProduct (WMSMS101: LOC별입고상품관리) ──
  describe('LocationProduct CRUD', () => {
    let lpId: string;

    afterAll(async () => {
      if (lpId) await prisma.locationProduct.deleteMany({ where: { id: lpId } });
    });

    it('CREATE', async () => {
      const lp = await prisma.locationProduct.create({
        data: {
          locationCode: 'A-01-01-01',
          itemId: 'test-item-id',
          centerId: 'test-center',
        },
      });
      lpId = lp.id;
      expect(lp.locationCode).toBe('A-01-01-01');
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. 운영관리 (WMSOP)
// ═══════════════════════════════════════════════════════════════
describe('운영관리', () => {
  let warehouseId: string;
  let itemId: string;
  let partnerId: string;

  beforeAll(async () => {
    const wh = await prisma.warehouse.create({
      data: {
        code: `WH-OP-${s}`, name: 'OP테스트창고',
        country: 'KR', city: '부산', address: '부산시',
      },
    });
    warehouseId = wh.id;

    const item = await prisma.item.create({
      data: { code: `ITEM-OP-${s}`, name: 'OP테스트상품', minStock: 10 },
    });
    itemId = item.id;

    const partner = await prisma.partner.create({
      data: { code: `PTR-OP-${s}`, name: 'OP테스트거래처', type: 'SUPPLIER' },
    });
    partnerId = partner.id;
  });

  afterAll(async () => {
    await prisma.inventoryTransaction.deleteMany({ where: { warehouseId } });
    await prisma.inventory.deleteMany({ where: { warehouseId } });
    await prisma.inboundReceipt.deleteMany({ where: { inboundOrder: { warehouseId } } });
    await prisma.inboundOrderItem.deleteMany({ where: { inboundOrder: { warehouseId } } });
    await prisma.inboundOrder.deleteMany({ where: { warehouseId } });
    await prisma.outboundShipment.deleteMany({ where: { outboundOrder: { warehouseId } } });
    await prisma.outboundOrderItem.deleteMany({ where: { outboundOrder: { warehouseId } } });
    await prisma.outboundOrder.deleteMany({ where: { warehouseId } });
    await prisma.dispatchItem.deleteMany({ where: { dispatch: { warehouseId } } });
    await prisma.dispatch.deleteMany({ where: { warehouseId } });
    await prisma.workOrderItem.deleteMany({ where: { workOrder: { warehouseId } } });
    await prisma.workOrder.deleteMany({ where: { warehouseId } });
    await prisma.partner.deleteMany({ where: { id: partnerId } });
    await prisma.item.deleteMany({ where: { id: itemId } });
    await prisma.warehouse.deleteMany({ where: { id: warehouseId } });
  });

  // ── InboundOrder (WMSOP010/020: 입고관리) ──
  describe('InboundOrder CRUD', () => {
    let orderId: string;

    it('CREATE - 입고오더 + 아이템 + BL번호', async () => {
      const order = await prisma.inboundOrder.create({
        data: {
          orderNumber: `IB-CRUD-${s}`,
          partnerId,
          warehouseId,
          orderType: 'PURCHASE',
          expectedDate: new Date('2026-04-01'),
          blNo: 'BL20260401-001',
          status: 'DRAFT',
          items: {
            create: {
              itemId,
              expectedQty: 500,
              lotNo: 'LOT-2026-001',
              expiryDate: new Date('2027-04-01'),
            },
          },
        },
        include: { items: true },
      });
      orderId = order.id;
      expect(order.orderType).toBe('PURCHASE');
      expect(order.blNo).toBe('BL20260401-001');
      expect(order.items).toHaveLength(1);
      expect(order.items[0].expectedQty).toBe(500);
      expect(order.items[0].lotNo).toBe('LOT-2026-001');
    });

    it('UPDATE - 상태 변경', async () => {
      const updated = await prisma.inboundOrder.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMED',
          arrivedDate: new Date(),
        },
      });
      expect(updated.status).toBe('CONFIRMED');
    });

    it('InboundReceipt 생성', async () => {
      const receipt = await prisma.inboundReceipt.create({
        data: {
          inboundOrderId: orderId,
          receivedBy: 'test-user-id',
          lotNo: 'LOT-2026-001',
          locationCode: 'A-01-01-01',
        },
      });
      expect(receipt.lotNo).toBe('LOT-2026-001');
    });
  });

  // ── OutboundOrder (WMSOP030: 출고관리) ──
  describe('OutboundOrder CRUD', () => {
    let orderId: string;

    it('CREATE - 출고오더 + 화면설계서 Slide 23 필드', async () => {
      const order = await prisma.outboundOrder.create({
        data: {
          orderNumber: `OB-CRUD-${s}`,
          partnerId,
          warehouseId,
          orderType: 'SALES',
          status: 'DRAFT',
          blNo: 'BL-OUT-001',
          isUrgent: true,
          shippingMethod: 'TRUCK',
          items: {
            create: {
              itemId,
              orderedQty: 100,
              lotNo: 'LOT-2026-001',
            },
          },
        },
        include: { items: true },
      });
      orderId = order.id;
      expect(order.isUrgent).toBe(true);
      expect(order.blNo).toBe('BL-OUT-001');
      expect(order.items[0].orderedQty).toBe(100);
    });

    it('UPDATE - 피킹/패킹 수량 업데이트', async () => {
      const order = await prisma.outboundOrder.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      const updated = await prisma.outboundOrderItem.update({
        where: { id: order!.items[0].id },
        data: { pickedQty: 100, packedQty: 100 },
      });
      expect(updated.pickedQty).toBe(100);
      expect(updated.packedQty).toBe(100);
    });

    it('OutboundShipment 생성', async () => {
      const shipment = await prisma.outboundShipment.create({
        data: {
          outboundOrderId: orderId,
          shippedBy: 'test-user-id',
          carrier: 'CJ대한통운',
          trackingNumber: 'TR123456789',
          weight: 25.5,
        },
      });
      expect(shipment.carrier).toBe('CJ대한통운');
    });
  });

  // ── OrderHistory (WMSOP013: 주문이력) ──
  describe('OrderHistory CRUD', () => {
    let historyId: string;

    afterAll(async () => {
      if (historyId) await prisma.orderHistory.deleteMany({ where: { id: historyId } });
    });

    it('CREATE', async () => {
      const history = await prisma.orderHistory.create({
        data: {
          orderType: 'INBOUND',
          orderId: 'some-order-id',
          action: 'STATUS_CHANGE',
          beforeData: '{"status":"DRAFT"}',
          afterData: '{"status":"CONFIRMED"}',
          performedBy: 'admin-user',
        },
      });
      historyId = history.id;
      expect(history.action).toBe('STATUS_CHANGE');
    });
  });

  // ── Dispatch (WMSOP050: 배차작업) ──
  describe('Dispatch CRUD', () => {
    let dispatchId: string;

    it('CREATE', async () => {
      const dispatch = await prisma.dispatch.create({
        data: {
          warehouseId,
          dispatchDate: new Date(),
          dispatchSeq: 1,
          status: 'PLANNED',
          items: {
            create: {
              itemCode: `ITEM-OP-${s}`,
              itemName: 'OP테스트상품',
              orderedQty: 200,
            },
          },
        },
        include: { items: true },
      });
      dispatchId = dispatch.id;
      expect(dispatch.status).toBe('PLANNED');
      expect(dispatch.items).toHaveLength(1);
    });

    it('UPDATE - 상태 진행', async () => {
      const updated = await prisma.dispatch.update({
        where: { id: dispatchId },
        data: { status: 'IN_PROGRESS' },
      });
      expect(updated.status).toBe('IN_PROGRESS');
    });
  });

  // ── WorkOrder (WMSST020: 작업지시서) ──
  describe('WorkOrder CRUD', () => {
    let workOrderId: string;

    it('CREATE - 피킹 작업지시', async () => {
      const wo = await prisma.workOrder.create({
        data: {
          warehouseId,
          workType: 'PICKING',
          status: 'CREATED',
          referenceType: 'OUTBOUND_ORDER',
          referenceId: 'some-outbound-id',
          items: {
            create: {
              itemCode: `ITEM-OP-${s}`,
              itemName: 'OP테스트상품',
              fromLocation: 'A-01-01-01',
              toLocation: 'B-01-01-01',
              lotNo: 'LOT-001',
              plannedQty: 50,
            },
          },
        },
        include: { items: true },
      });
      workOrderId = wo.id;
      expect(wo.workType).toBe('PICKING');
      expect(wo.items[0].plannedQty).toBe(50);
    });

    it('UPDATE - 작업완료', async () => {
      const updated = await prisma.workOrder.update({
        where: { id: workOrderId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
      expect(updated.status).toBe('COMPLETED');

      // WorkOrderItem actualQty 업데이트
      const items = await prisma.workOrderItem.findMany({
        where: { workOrderId },
      });
      const updatedItem = await prisma.workOrderItem.update({
        where: { id: items[0].id },
        data: { actualQty: 50 },
      });
      expect(updatedItem.actualQty).toBe(50);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. 재고관리 (WMSST)
// ═══════════════════════════════════════════════════════════════
describe('재고관리', () => {
  let warehouseId: string;
  let itemId: string;

  beforeAll(async () => {
    const wh = await prisma.warehouse.create({
      data: {
        code: `WH-ST-${s}`, name: 'ST테스트창고',
        country: 'KR', city: '대구', address: '대구시',
      },
    });
    warehouseId = wh.id;
    const item = await prisma.item.create({
      data: { code: `ITEM-ST-${s}`, name: 'ST테스트상품' },
    });
    itemId = item.id;
  });

  afterAll(async () => {
    await prisma.inventoryTransaction.deleteMany({ where: { warehouseId } });
    await prisma.inventory.deleteMany({ where: { warehouseId } });
    await prisma.stockAdjustment.deleteMany({ where: { warehouseId } });
    await prisma.cycleCount.deleteMany({ where: { warehouseId } });
    await prisma.item.deleteMany({ where: { id: itemId } });
    await prisma.warehouse.deleteMany({ where: { id: warehouseId } });
  });

  // ── Inventory (WMSST010: 현재고조회) ──
  describe('Inventory CRUD', () => {
    let inventoryId: string;

    it('CREATE - ERD 필드 포함', async () => {
      const inv = await prisma.inventory.create({
        data: {
          itemId,
          warehouseId,
          lotNo: `LOT-ST-${s}`,
          quantity: 1000,
          reservedQty: 100,
          availableQty: 900,
          expiryDate: new Date('2027-06-01'),
          inboundDate: new Date(),
        },
      });
      inventoryId = inv.id;
      expect(inv.quantity).toBe(1000);
      expect(inv.availableQty).toBe(900);
      expect(inv.expiryDate).toBeDefined();
    });

    it('UPDATE - 재고 증감', async () => {
      const updated = await prisma.inventory.update({
        where: { id: inventoryId },
        data: { quantity: 1200, availableQty: 1100 },
      });
      expect(updated.quantity).toBe(1200);
    });
  });

  // ── InventoryTransaction (WMSST020: 재고입출고내역) ──
  describe('InventoryTransaction CRUD', () => {
    let txId: string;

    it('CREATE', async () => {
      const tx = await prisma.inventoryTransaction.create({
        data: {
          itemId,
          warehouseId,
          lotNo: `LOT-ST-${s}`,
          txType: 'INBOUND',
          quantity: 1000,
          referenceType: 'INBOUND_ORDER',
          referenceId: 'test-ref',
          performedBy: 'test-user',
        },
      });
      txId = tx.id;
      expect(tx.txType).toBe('INBOUND');
    });

    it('다양한 트랜잭션 유형 생성', async () => {
      const types: Array<{ type: any; qty: number }> = [
        { type: 'OUTBOUND', qty: -50 },
        { type: 'ADJUSTMENT_IN', qty: 10 },
        { type: 'ADJUSTMENT_OUT', qty: -5 },
        { type: 'TRANSFER', qty: 0 },
        { type: 'CYCLE_COUNT', qty: 3 },
        { type: 'RETURN', qty: 20 },
      ];

      for (const t of types) {
        const tx = await prisma.inventoryTransaction.create({
          data: {
            itemId,
            warehouseId,
            txType: t.type,
            quantity: t.qty,
          },
        });
        expect(tx.txType).toBe(t.type);
      }
    });
  });

  // ── StockAdjustment (WMSST050: 재고조정) ──
  describe('StockAdjustment CRUD', () => {
    let adjustId: string;

    it('CREATE', async () => {
      const adj = await prisma.stockAdjustment.create({
        data: {
          warehouseId,
          itemCode: `ITEM-ST-${s}`,
          locationCode: 'A-01-01-01',
          lotNo: 'LOT-ADJ-001',
          adjustQty: -10,
          reason: 'DAMAGE',
          notes: '파손 발견',
          performedBy: 'test-user',
        },
      });
      adjustId = adj.id;
      expect(adj.reason).toBe('DAMAGE');
      expect(adj.adjustQty).toBe(-10);
    });

    it('UPDATE - 승인', async () => {
      const updated = await prisma.stockAdjustment.update({
        where: { id: adjustId },
        data: { approvedBy: 'manager-user' },
      });
      expect(updated.approvedBy).toBe('manager-user');
    });
  });

  // ── CycleCount (재고실사/순환재고조사) ──
  describe('CycleCount CRUD', () => {
    let countId: string;

    it('CREATE', async () => {
      const count = await prisma.cycleCount.create({
        data: {
          warehouseId,
          locationCode: 'A-01-01-01',
          itemCode: `ITEM-ST-${s}`,
          systemQty: 100,
          status: 'PLANNED',
        },
      });
      countId = count.id;
      expect(count.status).toBe('PLANNED');
    });

    it('UPDATE - 실사완료', async () => {
      const updated = await prisma.cycleCount.update({
        where: { id: countId },
        data: {
          countedQty: 98,
          variance: -2,
          status: 'COMPLETED',
          countedBy: 'test-user',
          countedDate: new Date(),
        },
      });
      expect(updated.variance).toBe(-2);
      expect(updated.status).toBe('COMPLETED');
    });
  });

  // ── InventoryMovement (WMSST030/040: 재고이동) ──
  describe('InventoryMovement CRUD', () => {
    let movementId: string;

    afterAll(async () => {
      if (movementId) {
        await prisma.inventoryMovementItem.deleteMany({ where: { movementId } });
        await prisma.inventoryMovement.deleteMany({ where: { id: movementId } });
      }
    });

    it('CREATE', async () => {
      const movement = await prisma.inventoryMovement.create({
        data: {
          warehouseId,
          status: 'DRAFT',
          performedBy: 'test-user',
          items: {
            create: {
              itemCode: `ITEM-ST-${s}`,
              itemName: 'ST테스트상품',
              fromLocation: 'A-01-01-01',
              toLocation: 'B-01-01-01',
              lotNo: 'LOT-MV-001',
              stockQty: 100,
              moveQty: 50,
              uom: 'BOX',
            },
          },
        },
        include: { items: true },
      });
      movementId = movement.id;
      expect(movement.items).toHaveLength(1);
      expect(movement.items[0].moveQty).toBe(50);
    });

    it('UPDATE - 이동완료', async () => {
      const updated = await prisma.inventoryMovement.update({
        where: { id: movementId },
        data: { status: 'COMPLETED' },
      });
      expect(updated.status).toBe('COMPLETED');
    });
  });

  // ── StockTransfer (WMSST040: 재고이동현황) ──
  describe('StockTransfer CRUD', () => {
    let transferId: string;

    afterAll(async () => {
      if (transferId) await prisma.stockTransfer.deleteMany({ where: { id: transferId } });
    });

    it('CREATE', async () => {
      const transfer = await prisma.stockTransfer.create({
        data: {
          warehouseId,
          itemId,
          fromLocationCode: 'A-01-01-01',
          toLocationCode: 'B-01-01-01',
          quantity: 30,
          status: 'PENDING',
        },
      });
      transferId = transfer.id;
      expect(transfer.quantity).toBe(30);
    });

    it('UPDATE', async () => {
      const updated = await prisma.stockTransfer.update({
        where: { id: transferId },
        data: { status: 'COMPLETED', workDateTime: new Date() },
      });
      expect(updated.status).toBe('COMPLETED');
    });
  });

  // ── OwnershipTransfer (WMSST100: 명의변경) ──
  describe('OwnershipTransfer CRUD', () => {
    let transferId: string;

    afterAll(async () => {
      if (transferId) await prisma.ownershipTransfer.deleteMany({ where: { id: transferId } });
    });

    it('CREATE', async () => {
      const transfer = await prisma.ownershipTransfer.create({
        data: {
          workNumber: `OT-${s}`,
          status: 'PENDING',
          workDate: new Date(),
          fromPartnerId: 'from-partner',
          fromItemId: 'from-item',
          fromQuantity: 100,
          fromUom: 'BOX',
          toPartnerId: 'to-partner',
          toItemId: 'to-item',
          toQuantity: 100,
          toUom: 'BOX',
        },
      });
      transferId = transfer.id;
      expect(transfer.fromQuantity).toBe(100);
    });

    it('UPDATE', async () => {
      const updated = await prisma.ownershipTransfer.update({
        where: { id: transferId },
        data: { status: 'COMPLETED' },
      });
      expect(updated.status).toBe('COMPLETED');
    });
  });

  // ── Assembly (WMSST070: 임가공/조립) ──
  describe('Assembly CRUD', () => {
    let assemblyId: string;

    afterAll(async () => {
      if (assemblyId) {
        await prisma.assemblyItem.deleteMany({ where: { assemblyId } });
        await prisma.assembly.deleteMany({ where: { id: assemblyId } });
      }
    });

    it('CREATE', async () => {
      const assembly = await prisma.assembly.create({
        data: {
          workNumber: `ASM-${s}`,
          status: 'PENDING',
          warehouseId,
          workDate: new Date(),
          items: {
            create: [
              {
                itemId,
                quantity: 10,
                uom: 'EA',
                type: 'INPUT',
                locationCode: 'A-01-01-01',
              },
              {
                itemId,
                quantity: 5,
                uom: 'BOX',
                type: 'OUTPUT',
                locationCode: 'B-01-01-01',
              },
            ],
          },
        },
        include: { items: true },
      });
      assemblyId = assembly.id;
      expect(assembly.items).toHaveLength(2);
      expect(assembly.items.filter(i => i.type === 'INPUT')).toHaveLength(1);
      expect(assembly.items.filter(i => i.type === 'OUTPUT')).toHaveLength(1);
    });

    it('UPDATE', async () => {
      const updated = await prisma.assembly.update({
        where: { id: assemblyId },
        data: { status: 'COMPLETED' },
      });
      expect(updated.status).toBe('COMPLETED');
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. 물류용기 (WMSPL)
// ═══════════════════════════════════════════════════════════════
describe('물류용기관리', () => {
  // ── ContainerGroup (WMSPL020: 물류용기군관리) ──
  describe('ContainerGroup CRUD', () => {
    let groupId: string;

    afterAll(async () => {
      if (groupId) await prisma.containerGroup.deleteMany({ where: { id: groupId } });
    });

    it('CREATE - 화면설계서 Slide 61 필드', async () => {
      const group = await prisma.containerGroup.create({
        data: {
          groupCode: `CG-${s}`,
          groupName: '파레트용기군',
          centerId: 'center-001',
          zoneId: 'zone-001',
        },
      });
      groupId = group.id;
      expect(group.groupName).toBe('파레트용기군');
    });

    it('UPDATE', async () => {
      const updated = await prisma.containerGroup.update({
        where: { id: groupId },
        data: { groupName: '수정된용기군' },
      });
      expect(updated.groupName).toBe('수정된용기군');
    });
  });

  // ── Container (WMSPL010: 물류용기관리) ──
  describe('Container CRUD', () => {
    let containerId: string;

    afterAll(async () => {
      if (containerId) await prisma.container.deleteMany({ where: { id: containerId } });
    });

    it('CREATE - 화면설계서 Slide 60 전체필드', async () => {
      const container = await prisma.container.create({
        data: {
          containerCode: `CT-${s}`,
          containerName: 'P110 파레트',
          inboundWarehouseCode: 'WH-001',
          inboundZone: 'A-ZONE',
          shelfLife: 12,
          shelfLifeDays: 365,
          weight: 25.5,
          size: 'LARGE',
          optimalStock: 100,
          stockUnit: 'EA',
          optimalStockDays: 30,
          expiryDays: 365,
          unitPrice: 50000,
          assetType: 'FIXED',
          tagPrefix: 'PLT',
          companyEpcCode: 'EPC001',
          barcode: `BC-CT-${s}`,
          weightToleranceKg: 0.5,
        },
      });
      containerId = container.id;
      expect(container.weight).toBe(25.5);
      expect(container.unitPrice).toBe(50000);
      expect(container.weightToleranceKg).toBe(0.5);
    });

    it('UPDATE', async () => {
      const updated = await prisma.container.update({
        where: { id: containerId },
        data: { isActive: false, optimalStock: 200 },
      });
      expect(updated.isActive).toBe(false);
      expect(updated.optimalStock).toBe(200);
    });
  });

  // ── ContainerInventory (WMSST011: 용기재고조회) ──
  describe('ContainerInventory CRUD', () => {
    let ciId: string;

    afterAll(async () => {
      if (ciId) await prisma.containerInventory.deleteMany({ where: { id: ciId } });
    });

    it('CREATE - 화면설계서 Slide 32 필드', async () => {
      const ci = await prisma.containerInventory.create({
        data: {
          containerCode: `CT-${s}`,
          containerName: 'P110 파레트',
          containerGroup: 'PLT-GROUP',
          normalStock: 80,
          stockUnit: 'EA',
          optimalStock: 100,
          locationCode: 'A-01-01',
          workDate: new Date(),
        },
      });
      ciId = ci.id;
      expect(ci.normalStock).toBe(80);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// 7. 정산관리 (WMSAC)
// ═══════════════════════════════════════════════════════════════
describe('정산관리', () => {
  let warehouseId: string;
  let settlementId: string;

  beforeAll(async () => {
    const wh = await prisma.warehouse.create({
      data: {
        code: `WH-AC-${s}`, name: 'AC테스트창고',
        country: 'KR', city: '광주', address: '광주시',
      },
    });
    warehouseId = wh.id;
  });

  afterAll(async () => {
    if (settlementId) {
      await prisma.settlementDetail.deleteMany({ where: { settlementId } });
      await prisma.settlement.deleteMany({ where: { id: settlementId } });
    }
    await prisma.warehouse.deleteMany({ where: { id: warehouseId } });
  });

  // ── Settlement (WMSAC010/020: 정산단가/정산산출) ──
  describe('Settlement CRUD', () => {
    it('CREATE - 정산 헤더 + 상세', async () => {
      const settlement = await prisma.settlement.create({
        data: {
          warehouseId,
          periodStart: new Date('2026-03-01'),
          periodEnd: new Date('2026-03-31'),
          status: 'DRAFT',
          inboundFee: 500000,
          outboundFee: 700000,
          storageFee: 300000,
          handlingFee: 200000,
          totalAmount: 1700000,
          details: {
            create: [
              {
                workDate: new Date('2026-03-15'),
                itemCode: 'ITEM-001',
                itemName: '테스트상품',
                inboundQty: 500,
                outboundQty: 300,
                stockQty: 200,
                inboundFee: 250000,
                outboundFee: 350000,
                storageFee: 150000,
              },
              {
                workDate: new Date('2026-03-20'),
                itemCode: 'ITEM-002',
                itemName: '테스트상품2',
                inboundQty: 250,
                outboundQty: 400,
                stockQty: 350,
                inboundFee: 250000,
                outboundFee: 350000,
                storageFee: 150000,
              },
            ],
          },
        },
        include: { details: true },
      });
      settlementId = settlement.id;
      expect(settlement.totalAmount).toBe(1700000);
      expect(settlement.details).toHaveLength(2);
    });

    it('UPDATE - 정산확정', async () => {
      const updated = await prisma.settlement.update({
        where: { id: settlementId },
        data: { status: 'CONFIRMED' },
      });
      expect(updated.status).toBe('CONFIRMED');
    });
  });

  // ── PeriodClose (WMSMS130: 마감관리) ──
  describe('PeriodClose CRUD', () => {
    let closeId: string;

    afterAll(async () => {
      if (closeId) await prisma.periodClose.deleteMany({ where: { id: closeId } });
    });

    it('CREATE', async () => {
      const close = await prisma.periodClose.create({
        data: {
          periodType: 'MONTHLY',
          periodDate: new Date('2026-03-31'),
          warehouseId,
          status: 'OPEN',
        },
      });
      closeId = close.id;
      expect(close.periodType).toBe('MONTHLY');
    });

    it('UPDATE - 마감처리', async () => {
      const updated = await prisma.periodClose.update({
        where: { id: closeId },
        data: {
          status: 'CLOSED',
          closedBy: 'admin-user',
          closedAt: new Date(),
        },
      });
      expect(updated.status).toBe('CLOSED');
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// 8. 채널연동 (SalesChannel, ChannelOrder 등)
// ═══════════════════════════════════════════════════════════════
describe('채널연동', () => {
  let warehouseId: string;
  let channelId: string;
  let itemId: string;

  beforeAll(async () => {
    const wh = await prisma.warehouse.create({
      data: {
        code: `WH-CH2-${s}`, name: 'CH테스트창고',
        country: 'KR', city: '서울', address: '서울시',
      },
    });
    warehouseId = wh.id;
    const item = await prisma.item.create({
      data: { code: `ITEM-CH2-${s}`, name: 'CH테스트상품' },
    });
    itemId = item.id;
  });

  afterAll(async () => {
    if (channelId) {
      await prisma.channelSyncLog.deleteMany({ where: { channelId } });
      await prisma.channelProduct.deleteMany({ where: { channelId } });
      await prisma.channelOrderItem.deleteMany({ where: { channelOrder: { channelId } } });
      await prisma.channelOrder.deleteMany({ where: { channelId } });
      await prisma.salesChannel.deleteMany({ where: { id: channelId } });
    }
    await prisma.item.deleteMany({ where: { id: itemId } });
    await prisma.warehouse.deleteMany({ where: { id: warehouseId } });
  });

  describe('SalesChannel CRUD', () => {
    it('CREATE - 다양한 플랫폼', async () => {
      const channel = await prisma.salesChannel.create({
        data: {
          name: '아마존 US',
          platform: 'AMAZON',
          sellerId: `amz-${s}`,
          warehouseId,
          credentials: { accessKey: 'AK', secretKey: 'SK', region: 'us-east-1' },
          syncEnabled: true,
          syncInterval: 5,
        },
      });
      channelId = channel.id;
      expect(channel.platform).toBe('AMAZON');
      expect(channel.syncInterval).toBe(5);
    });

    it('UPDATE - 동기화상태 업데이트', async () => {
      const updated = await prisma.salesChannel.update({
        where: { id: channelId },
        data: {
          status: 'ACTIVE',
          lastSyncAt: new Date(),
        },
      });
      expect(updated.status).toBe('ACTIVE');
    });
  });

  describe('ChannelProduct CRUD', () => {
    it('CREATE', async () => {
      const cp = await prisma.channelProduct.create({
        data: {
          channelId,
          itemId,
          platformProductId: 'ASIN-B001',
          platformSku: `AMZ-SKU-${s}`,
        },
      });
      expect(cp.isLinked).toBe(true);
    });
  });

  describe('ChannelOrder + Items CRUD', () => {
    let orderId: string;

    it('CREATE', async () => {
      const order = await prisma.channelOrder.create({
        data: {
          channelId,
          platformOrderId: `AMZ-ORD-${s}`,
          platformOrderNo: '111-2222222-3333333',
          orderDate: new Date(),
          customerName: 'John Doe',
          customerPhone: '+1-555-0123',
          shippingAddress: '123 Main St, Seattle, WA 98101',
          shippingZipCode: '98101',
          totalAmount: 59.99,
          currency: 'USD',
          items: {
            create: {
              platformItemId: 'ASIN-B001',
              platformSku: `AMZ-SKU-${s}`,
              itemName: 'Test Product',
              quantity: 3,
              unitPrice: 19.99,
              itemId,
            },
          },
        },
        include: { items: true },
      });
      orderId = order.id;
      expect(order.status).toBe('NEW');
      expect(order.items).toHaveLength(1);
    });

    it('UPDATE - 상태 변경', async () => {
      const updated = await prisma.channelOrder.update({
        where: { id: orderId },
        data: {
          status: 'SHIPPED',
          carrier: 'USPS',
          trackingNumber: '9400111899223100123456',
          shippedAt: new Date(),
        },
      });
      expect(updated.status).toBe('SHIPPED');
    });
  });

  describe('ChannelSyncLog CRUD', () => {
    it('CREATE - 다양한 동기화 유형', async () => {
      const types: Array<{ syncType: any; direction: any }> = [
        { syncType: 'ORDER_PULL', direction: 'INBOUND' },
        { syncType: 'INVENTORY_PUSH', direction: 'OUTBOUND' },
        { syncType: 'PRODUCT_SYNC', direction: 'BOTH' },
        { syncType: 'SHIPMENT_PUSH', direction: 'OUTBOUND' },
        { syncType: 'RETURN_PULL', direction: 'INBOUND' },
      ];

      for (const t of types) {
        const log = await prisma.channelSyncLog.create({
          data: {
            channelId,
            syncType: t.syncType,
            direction: t.direction,
            status: 'SUCCESS',
            recordCount: 10,
          },
        });
        expect(log.syncType).toBe(t.syncType);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// 9. 관계 무결성 + Cascade 테스트
// ═══════════════════════════════════════════════════════════════
describe('관계 무결성', () => {
  it('Warehouse 삭제 → Zone → Location Cascade', async () => {
    const wh = await prisma.warehouse.create({
      data: {
        code: `WH-CAS-${s}`, name: 'Cascade테스트', country: 'KR', city: '서울', address: '서울시',
        zones: {
          create: {
            code: `Z-CAS-${s}`, name: 'Cascade존',
            locations: { create: { code: `L-CAS-${s}`, aisle: 'A', rack: '01', level: '01', bin: '01' } },
          },
        },
      },
      include: { zones: { include: { locations: true } } },
    });

    await prisma.warehouse.delete({ where: { id: wh.id } });

    const zones = await prisma.zone.findMany({ where: { warehouseId: wh.id } });
    expect(zones).toHaveLength(0);
    const locs = await prisma.location.findMany({ where: { zoneId: wh.zones[0].id } });
    expect(locs).toHaveLength(0);
  });

  it('InboundOrder 삭제 → Items + Receipts Cascade', async () => {
    const wh = await prisma.warehouse.create({
      data: { code: `WH-CIB2-${s}`, name: 'IB-Cascade', country: 'KR', city: '서울', address: '서울시' },
    });
    const item = await prisma.item.create({ data: { code: `I-CIB2-${s}`, name: 'CAS상품' } });
    const ptr = await prisma.partner.create({ data: { code: `P-CIB2-${s}`, name: 'CAS거래처', type: 'SUPPLIER' } });

    const order = await prisma.inboundOrder.create({
      data: {
        orderNumber: `IB-CAS2-${s}`, partnerId: ptr.id, warehouseId: wh.id,
        expectedDate: new Date(),
        items: { create: { itemId: item.id, expectedQty: 10 } },
        receipts: { create: { receivedBy: 'test' } },
      },
    });

    await prisma.inboundOrder.delete({ where: { id: order.id } });
    expect(await prisma.inboundOrderItem.count({ where: { inboundOrderId: order.id } })).toBe(0);
    expect(await prisma.inboundReceipt.count({ where: { inboundOrderId: order.id } })).toBe(0);

    await prisma.partner.delete({ where: { id: ptr.id } });
    await prisma.item.delete({ where: { id: item.id } });
    await prisma.warehouse.delete({ where: { id: wh.id } });
  });

  it('OutboundOrder 삭제 → Items + Shipments Cascade', async () => {
    const wh = await prisma.warehouse.create({
      data: { code: `WH-COB-${s}`, name: 'OB-Cascade', country: 'KR', city: '서울', address: '서울시' },
    });
    const item = await prisma.item.create({ data: { code: `I-COB-${s}`, name: 'OB상품' } });
    const ptr = await prisma.partner.create({ data: { code: `P-COB-${s}`, name: 'OB거래처', type: 'CUSTOMER' } });

    const order = await prisma.outboundOrder.create({
      data: {
        orderNumber: `OB-CAS-${s}`, partnerId: ptr.id, warehouseId: wh.id,
        items: { create: { itemId: item.id, orderedQty: 10 } },
        shipments: { create: { shippedBy: 'test', carrier: 'CJ' } },
      },
    });

    await prisma.outboundOrder.delete({ where: { id: order.id } });
    expect(await prisma.outboundOrderItem.count({ where: { outboundOrderId: order.id } })).toBe(0);
    expect(await prisma.outboundShipment.count({ where: { outboundOrderId: order.id } })).toBe(0);

    await prisma.partner.delete({ where: { id: ptr.id } });
    await prisma.item.delete({ where: { id: item.id } });
    await prisma.warehouse.delete({ where: { id: wh.id } });
  });

  it('WorkOrder 삭제 → Items Cascade', async () => {
    const wh = await prisma.warehouse.create({
      data: { code: `WH-CWO-${s}`, name: 'WO-Cascade', country: 'KR', city: '서울', address: '서울시' },
    });

    const wo = await prisma.workOrder.create({
      data: {
        warehouseId: wh.id, workType: 'PICKING',
        items: { create: { itemCode: 'TEST', itemName: '테스트', plannedQty: 10 } },
      },
    });

    await prisma.workOrder.delete({ where: { id: wo.id } });
    expect(await prisma.workOrderItem.count({ where: { workOrderId: wo.id } })).toBe(0);

    await prisma.warehouse.delete({ where: { id: wh.id } });
  });

  it('SalesChannel 삭제 → Orders + Products + SyncLogs Cascade', async () => {
    const wh = await prisma.warehouse.create({
      data: { code: `WH-CCH-${s}`, name: 'CH-Cascade', country: 'KR', city: '서울', address: '서울시' },
    });
    const item = await prisma.item.create({ data: { code: `I-CCH-${s}`, name: 'CH상품' } });

    const ch = await prisma.salesChannel.create({
      data: {
        name: 'Cascade채널', platform: 'NAVER', sellerId: `nv-${s}`,
        warehouseId: wh.id, credentials: {},
        channelProducts: { create: { itemId: item.id, platformSku: `NV-${s}` } },
        channelOrders: {
          create: {
            platformOrderId: `NV-ORD-${s}`, orderDate: new Date(),
            items: { create: { itemName: '테스트', quantity: 1 } },
          },
        },
        syncLogs: { create: { syncType: 'ORDER_PULL', direction: 'INBOUND', status: 'SUCCESS' } },
      },
    });

    await prisma.salesChannel.delete({ where: { id: ch.id } });
    expect(await prisma.channelProduct.count({ where: { channelId: ch.id } })).toBe(0);
    expect(await prisma.channelOrder.count({ where: { channelId: ch.id } })).toBe(0);
    expect(await prisma.channelSyncLog.count({ where: { channelId: ch.id } })).toBe(0);

    await prisma.item.delete({ where: { id: item.id } });
    await prisma.warehouse.delete({ where: { id: wh.id } });
  });
});

// ═══════════════════════════════════════════════════════════════
// 10. UNIQUE 제약조건 검증
// ═══════════════════════════════════════════════════════════════
describe('UNIQUE 제약조건', () => {
  it('User.email UNIQUE', async () => {
    const email = `unq2-${s}@kcs.com`;
    const u = await prisma.user.create({ data: { email, password: 'x', name: 'x' } });
    await expect(prisma.user.create({ data: { email, password: 'y', name: 'y' } })).rejects.toThrow();
    await prisma.user.delete({ where: { id: u.id } });
  });

  it('Warehouse.code UNIQUE', async () => {
    const code = `WH-UNQ2-${s}`;
    const w = await prisma.warehouse.create({
      data: { code, name: 'UNQ', country: 'KR', city: 'S', address: 'A' },
    });
    await expect(
      prisma.warehouse.create({ data: { code, name: 'UNQ2', country: 'KR', city: 'S', address: 'A' } }),
    ).rejects.toThrow();
    await prisma.warehouse.delete({ where: { id: w.id } });
  });

  it('Item.code UNIQUE', async () => {
    const code = `I-UNQ2-${s}`;
    const i = await prisma.item.create({ data: { code, name: 'UNQ' } });
    await expect(prisma.item.create({ data: { code, name: 'UNQ2' } })).rejects.toThrow();
    await prisma.item.delete({ where: { id: i.id } });
  });

  it('Partner.code UNIQUE', async () => {
    const code = `P-UNQ2-${s}`;
    const p = await prisma.partner.create({ data: { code, name: 'UNQ', type: 'SUPPLIER' } });
    await expect(prisma.partner.create({ data: { code, name: 'UNQ2', type: 'SUPPLIER' } })).rejects.toThrow();
    await prisma.partner.delete({ where: { id: p.id } });
  });

  it('Zone [warehouseId, code] 복합 UNIQUE', async () => {
    const wh = await prisma.warehouse.create({
      data: { code: `WH-ZU-${s}`, name: 'ZU', country: 'KR', city: 'S', address: 'A' },
    });
    const z = await prisma.zone.create({
      data: { warehouseId: wh.id, code: `ZU-${s}`, name: 'Zone1' },
    });
    await expect(
      prisma.zone.create({ data: { warehouseId: wh.id, code: `ZU-${s}`, name: 'Zone2' } }),
    ).rejects.toThrow();
    // 다른 warehouse면 같은 code OK
    const wh2 = await prisma.warehouse.create({
      data: { code: `WH-ZU2-${s}`, name: 'ZU2', country: 'KR', city: 'S', address: 'A' },
    });
    const z2 = await prisma.zone.create({
      data: { warehouseId: wh2.id, code: `ZU-${s}`, name: 'Zone2-OK' },
    });
    expect(z2).toBeDefined();

    await prisma.zone.deleteMany({ where: { id: { in: [z.id, z2.id] } } });
    await prisma.warehouse.deleteMany({ where: { id: { in: [wh.id, wh2.id] } } });
  });

  it('CommonCode [codeType, code] 복합 UNIQUE', async () => {
    const c = await prisma.commonCode.create({
      data: { codeType: 'TEST', typeNm: 'T', code: `CC-${s}`, codeNm: 'C1' },
    });
    await expect(
      prisma.commonCode.create({ data: { codeType: 'TEST', typeNm: 'T', code: `CC-${s}`, codeNm: 'C2' } }),
    ).rejects.toThrow();
    await prisma.commonCode.delete({ where: { id: c.id } });
  });
});
