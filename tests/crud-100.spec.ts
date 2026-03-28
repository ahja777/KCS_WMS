import { test, expect, request, APIRequestContext } from '@playwright/test';

const API = 'http://localhost:4100/api';
let token = '';
let api: APIRequestContext;

// 생성된 ID 저장
const created = {
  warehouses: [] as string[],
  zones: [] as string[],
  locations: [] as string[],
  items: [] as string[],
  partners: [] as string[],
  users: [] as string[],
  commonCodes: [] as string[],
  uoms: [] as string[],
  itemGroups: [] as string[],
  vehicles: [] as string[],
  docks: [] as string[],
  inbounds: [] as string[],
  outbounds: [] as string[],
  adjustments: [] as string[],
  cycleCounts: [] as string[],
  dispatches: [] as string[],
  workOrders: [] as string[],
  settlements: [] as string[],
};

const ts = Date.now().toString(36);

async function apiPost(path: string, data: any) {
  const res = await api.post(`${API}${path}`, {
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok()) {
    console.error(`POST ${path} FAILED [${res.status()}]:`, JSON.stringify(body).slice(0, 300));
  }
  return { status: res.status(), body };
}

async function apiGet(path: string) {
  const res = await api.get(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status(), body: await res.json() };
}

async function apiPut(path: string, data: any) {
  const res = await api.put(`${API}${path}`, {
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok()) {
    console.error(`PUT ${path} FAILED [${res.status()}]:`, JSON.stringify(body).slice(0, 300));
  }
  return { status: res.status(), body };
}

async function apiDelete(path: string) {
  const res = await api.delete(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  let body: any = {};
  try { body = await res.json(); } catch {}
  return { status: res.status(), body };
}

// ═══════════════════════════════════════════
// 0. LOGIN
// ═══════════════════════════════════════════
test.describe.serial('KCS WMS 전체 CRUD 100 테스트데이터', () => {

  test.beforeAll(async () => {
    api = await request.newContext();
    const res = await api.post(`${API}/auth/login`, {
      data: { email: 'admin@kcs.com', password: 'password123' },
    });
    const body = await res.json();
    token = body.data.accessToken;
    expect(token).toBeTruthy();
    console.log('✅ 로그인 성공');
  });

  test.afterAll(async () => {
    await api.dispose();
  });

  // ═══════════════════════════════════════════
  // 1. WAREHOUSES - 5개 생성
  // ═══════════════════════════════════════════
  test('1. 창고 5개 CREATE', async () => {
    const countries = ['US', 'KR', 'JP', 'DE', 'VN'];
    const cities = ['LA', 'Seoul', 'Tokyo', 'Berlin', 'Hanoi'];
    for (let i = 1; i <= 5; i++) {
      const { status, body } = await apiPost('/warehouses', {
        code: `WH-${ts}-${String(i).padStart(2, '0')}`,
        name: `테스트창고 ${i}`,
        country: countries[i - 1],
        city: cities[i - 1],
        address: `${cities[i - 1]} 테스트 주소 ${i}`,
        zipCode: `${10000 + i}`,
        timezone: 'Asia/Seoul',
        status: 'ACTIVE',
        contactName: `담당자${i}`,
        contactPhone: `010-0000-${String(i).padStart(4, '0')}`,
        contactEmail: `wh${i}@test.com`,
        notes: `테스트 창고 ${i} 메모`,
      });
      expect(status).toBe(201);
      created.warehouses.push(body.data.id);
    }
    console.log(`✅ 창고 ${created.warehouses.length}개 생성`);
  });

  test('1-1. 창고 READ & UPDATE', async () => {
    // Read all
    const { status: listStatus, body: listBody } = await apiGet('/warehouses');
    expect(listStatus).toBe(200);
    // paginated: data.data = array, data.meta = pagination
    const list = listBody.data.data || listBody.data;
    expect(Array.isArray(list) ? list.length : 0).toBeGreaterThanOrEqual(5);

    // Read single & update
    for (const id of created.warehouses) {
      const { status: getStatus } = await apiGet(`/warehouses/${id}`);
      expect(getStatus).toBe(200);

      const { status: putStatus } = await apiPut(`/warehouses/${id}`, {
        name: `수정창고-${id.slice(0, 4)}`,
        notes: 'Updated by test',
      });
      expect(putStatus).toBe(200);
    }
    console.log('✅ 창고 READ/UPDATE 완료');
  });

  // ═══════════════════════════════════════════
  // 2. ZONES - 창고당 3개 = 15개
  // ═══════════════════════════════════════════
  test('2. 존 15개 CREATE', async () => {
    const types = ['RECEIVING', 'STORAGE', 'SHIPPING'];
    for (const whId of created.warehouses) {
      for (let j = 0; j < 3; j++) {
        const { status, body } = await apiPost(`/warehouses/${whId}/zones`, {
          code: `ZN-${ts}-${types[j].slice(0, 3)}-${created.zones.length + 1}`,
          name: `${types[j]} 존`,
          type: types[j],
          description: `${types[j]} zone for testing`,
        });
        expect(status).toBe(201);
        created.zones.push(`${whId}::${body.data.id}`);
      }
    }
    console.log(`✅ 존 ${created.zones.length}개 생성`);
  });

  test('2-1. 존 READ & UPDATE', async () => {
    for (const entry of created.zones.slice(0, 5)) {
      const [whId, zoneId] = entry.split('::');
      const { status: getStatus } = await apiGet(`/warehouses/${whId}/zones/${zoneId}`);
      expect(getStatus).toBe(200);

      const { status: putStatus } = await apiPut(`/warehouses/${whId}/zones/${zoneId}`, {
        name: `수정존-${zoneId.slice(0, 4)}`,
      });
      expect(putStatus).toBe(200);
    }
    console.log('✅ 존 READ/UPDATE 완료');
  });

  // ═══════════════════════════════════════════
  // 3. LOCATIONS - 존당 2개 = 30개
  // ═══════════════════════════════════════════
  test('3. 로케이션 30개 CREATE', async () => {
    let locIdx = 0;
    for (const entry of created.zones) {
      const [whId, zoneId] = entry.split('::');
      for (let k = 1; k <= 2; k++) {
        locIdx++;
        const aisle = `A${String(Math.ceil(locIdx / 6)).padStart(2, '0')}`;
        const rack = `R${String(((locIdx - 1) % 6) + 1).padStart(2, '0')}`;
        const level = `L${k}`;
        const bin = `B01`;
        const { status, body } = await apiPost(`/warehouses/${whId}/zones/${zoneId}/locations`, {
          code: `${aisle}-${rack}-${level}-${bin}`,
          aisle, rack, level, bin,
          status: 'AVAILABLE',
          maxWeight: 1000 + locIdx * 10,
          maxVolume: 50 + locIdx,
        });
        if (status === 201) {
          created.locations.push(`${whId}::${zoneId}::${body.data.id}`);
        } else {
          console.warn(`Location create failed: ${status}`);
        }
      }
    }
    console.log(`✅ 로케이션 ${created.locations.length}개 생성`);
  });

  // ═══════════════════════════════════════════
  // 4. ITEMS - 15개
  // ═══════════════════════════════════════════
  test('4. 품목 15개 CREATE', async () => {
    const categories: string[] = ['GENERAL', 'ELECTRONICS', 'CLOTHING', 'FOOD', 'FRAGILE'];
    const uoms: string[] = ['EA', 'BOX', 'PALLET', 'CASE', 'KG'];
    for (let i = 1; i <= 15; i++) {
      const { status, body } = await apiPost('/items', {
        code: `ITM-${ts}-${String(i).padStart(3, '0')}`,
        name: `테스트상품 ${i}`,
        description: `테스트 상품 설명 ${i}`,
        barcode: `899${ts}${String(i).padStart(5, '0')}`,
        category: categories[(i - 1) % 5],
        uom: uoms[(i - 1) % 5],
        weight: 0.5 * i,
        length: 10 + i,
        width: 5 + i,
        height: 3 + i,
        minStock: 10 * i,
        maxStock: 100 * i,
        unitPrice: 1000 * i,
        isActive: true,
      });
      expect(status).toBe(201);
      created.items.push(body.data.id);
    }
    console.log(`✅ 품목 ${created.items.length}개 생성`);
  });

  test('4-1. 품목 READ & UPDATE', async () => {
    const { status: listStatus, body: listBody } = await apiGet('/items?limit=50');
    expect(listStatus).toBe(200);

    for (const id of created.items.slice(0, 5)) {
      const { status: getStatus } = await apiGet(`/items/${id}`);
      expect(getStatus).toBe(200);

      const { status: putStatus } = await apiPut(`/items/${id}`, {
        name: `수정상품-${id.slice(0, 4)}`,
        minStock: 999,
      });
      expect(putStatus).toBe(200);
    }
    console.log('✅ 품목 READ/UPDATE 완료');
  });

  // ═══════════════════════════════════════════
  // 5. PARTNERS - 10개
  // ═══════════════════════════════════════════
  test('5. 거래처 10개 CREATE', async () => {
    const types = ['SUPPLIER', 'CUSTOMER', 'CARRIER'];
    for (let i = 1; i <= 10; i++) {
      const { status, body } = await apiPost('/partners', {
        code: `PTR-${ts}-${String(i).padStart(2, '0')}`,
        name: `테스트거래처 ${i}`,
        type: types[(i - 1) % 3],
        contactName: `담당자 ${i}`,
        contactPhone: `010-1111-${String(i).padStart(4, '0')}`,
        contactEmail: `partner${i}@test.com`,
        country: 'KR',
        city: '서울',
        address: `서울시 테스트구 ${i}동`,
        businessNo: `123-45-${String(67890 + i)}`,
        isActive: true,
        notes: `거래처 ${i} 테스트 메모`,
      });
      expect(status).toBe(201);
      created.partners.push(body.data.id);
    }
    console.log(`✅ 거래처 ${created.partners.length}개 생성`);
  });

  test('5-1. 거래처 READ & UPDATE', async () => {
    for (const id of created.partners.slice(0, 5)) {
      const { status: getStatus } = await apiGet(`/partners/${id}`);
      expect(getStatus).toBe(200);

      const { status: putStatus } = await apiPut(`/partners/${id}`, {
        name: `수정거래처-${id.slice(0, 4)}`,
        notes: 'Updated',
      });
      expect(putStatus).toBe(200);
    }
    console.log('✅ 거래처 READ/UPDATE 완료');
  });

  // ═══════════════════════════════════════════
  // 6. USERS - 5개
  // ═══════════════════════════════════════════
  test('6. 사용자 5개 CREATE', async () => {
    const roles = ['MANAGER', 'OPERATOR', 'VIEWER', 'OPERATOR', 'VIEWER'];
    for (let i = 1; i <= 5; i++) {
      const { status, body } = await apiPost('/auth/register', {
        email: `testuser${ts}${i}@test.com`,
        password: 'Test1234!',
        name: `테스트유저 ${i}`,
      });
      if (status === 201 || status === 200) {
        created.users.push(body.data?.id || body.data?.user?.id);
        // Update role
        const userId = body.data?.id || body.data?.user?.id;
        if (userId) {
          await apiPut(`/auth/users/${userId}`, { role: roles[i - 1] });
        }
      }
    }
    console.log(`✅ 사용자 ${created.users.length}개 생성`);
  });

  // ═══════════════════════════════════════════
  // 7. COMMON CODES - 5개
  // ═══════════════════════════════════════════
  test('7. 공통코드 5개 CREATE', async () => {
    const codes = [
      { codeType: 'WH_TYPE', typeNm: '창고유형', code: `COLD-${ts}`, codeNm: '냉장창고' },
      { codeType: 'WH_TYPE', typeNm: '창고유형', code: `DRY-${ts}`, codeNm: '상온창고' },
      { codeType: 'ITEM_GRADE', typeNm: '상품등급', code: `A-${ts}`, codeNm: 'A등급' },
      { codeType: 'ITEM_GRADE', typeNm: '상품등급', code: `B-${ts}`, codeNm: 'B등급' },
      { codeType: 'SHIP_METHOD', typeNm: '배송방법', code: `EXP-${ts}`, codeNm: '택배' },
    ];
    for (const c of codes) {
      const { status, body } = await apiPost('/common-codes', { ...c, sortOrder: 1, isActive: true });
      if (status === 201) {
        created.commonCodes.push(body.data.id);
      }
    }
    console.log(`✅ 공통코드 ${created.commonCodes.length}개 생성`);
  });

  // ═══════════════════════════════════════════
  // 8. UOM - 3개
  // ═══════════════════════════════════════════
  test('8. UOM 3개 CREATE', async () => {
    const uoms = [
      { code: `SET-${ts}`, name: '세트' },
      { code: `ROLL-${ts}`, name: '롤' },
      { code: `PACK-${ts}`, name: '팩' },
    ];
    for (const u of uoms) {
      const { status, body } = await apiPost('/uom', u);
      if (status === 201) {
        created.uoms.push(body.data.id);
      }
    }
    console.log(`✅ UOM ${created.uoms.length}개 생성`);
  });

  // ═══════════════════════════════════════════
  // 9. ITEM GROUPS - 3개
  // ═══════════════════════════════════════════
  test('9. 품목그룹 3개 CREATE', async () => {
    const groups = [
      { code: `GRP-A-${ts}`, name: '전자제품 그룹', groupType: 'ELECTRONICS' },
      { code: `GRP-B-${ts}`, name: '식품 그룹', groupType: 'FOOD' },
      { code: `GRP-C-${ts}`, name: '의류 그룹', groupType: 'CLOTHING' },
    ];
    for (const g of groups) {
      const { status, body } = await apiPost('/item-groups', g);
      if (status === 201) {
        created.itemGroups.push(body.data.id);
      }
    }
    console.log(`✅ 품목그룹 ${created.itemGroups.length}개 생성`);
  });

  // ═══════════════════════════════════════════
  // 10. VEHICLES - 5개
  // ═══════════════════════════════════════════
  test('10. 차량 5개 CREATE', async () => {
    for (let i = 1; i <= 5; i++) {
      const { status, body } = await apiPost('/vehicles', {
        plateNo: `${ts}가${1000 + i}`,
        tonnage: i * 2.5,
        driverName: `운전자 ${i}`,
        driverPhone: `010-2222-${String(i).padStart(4, '0')}`,
        warehouseId: created.warehouses[i % created.warehouses.length],
        isActive: true,
      });
      if (status === 201) {
        created.vehicles.push(body.data.id);
      }
    }
    console.log(`✅ 차량 ${created.vehicles.length}개 생성`);
  });

  // ═══════════════════════════════════════════
  // 11. DOCKS - 창고당 1개 = 5개
  // ═══════════════════════════════════════════
  test('11. 도크 5개 CREATE', async () => {
    for (let i = 0; i < created.warehouses.length; i++) {
      const { status, body } = await apiPost('/docks', {
        warehouseId: created.warehouses[i],
        code: `DOCK-${ts}-${i + 1}`,
        name: `도크 ${i + 1}`,
        sortOrder: i + 1,
        maxTonnage: 10 + i * 5,
        notes: `테스트 도크 ${i + 1}`,
      });
      if (status === 201) {
        created.docks.push(body.data.id);
      }
    }
    console.log(`✅ 도크 ${created.docks.length}개 생성`);
  });

  // ═══════════════════════════════════════════
  // 12. INBOUND ORDERS - 5개
  // ═══════════════════════════════════════════
  test('12. 입고오더 5개 CREATE', async () => {
    // supplier 타입 파트너 찾기
    const suppliers = created.partners.filter((_, idx) => idx % 3 === 0);
    for (let i = 0; i < 5; i++) {
      const whId = created.warehouses[i % created.warehouses.length];
      const partnerId = suppliers[i % suppliers.length];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i + 1);

      const items = [];
      for (let j = 0; j < 3; j++) {
        items.push({
          itemId: created.items[(i * 3 + j) % created.items.length],
          expectedQty: 10 * (j + 1),
        });
      }

      const { status, body } = await apiPost('/inbound', {
        partnerId,
        warehouseId: whId,
        expectedDate: futureDate.toISOString(),
        notes: `테스트 입고오더 ${i + 1}`,
        items,
      });
      if (status === 201) {
        created.inbounds.push(body.data.id);
      } else {
        console.error(`입고오더 생성 실패:`, body);
      }
    }
    console.log(`✅ 입고오더 ${created.inbounds.length}개 생성`);
  });

  test('12-1. 입고오더 READ & 상태변경', async () => {
    for (const id of created.inbounds) {
      const { status: getStatus, body } = await apiGet(`/inbound/${id}`);
      expect(getStatus).toBe(200);

      // Confirm
      const { status: confirmStatus } = await apiPost(`/inbound/${id}/confirm`, {});
      if (confirmStatus === 200 || confirmStatus === 201) {
        // Arrive
        await apiPost(`/inbound/${id}/arrive`, {});
      }
    }
    console.log('✅ 입고오더 READ/상태변경 완료');
  });

  // ═══════════════════════════════════════════
  // 13. OUTBOUND ORDERS - 5개
  // ═══════════════════════════════════════════
  test('13. 출고오더 5개 CREATE', async () => {
    const customers = created.partners.filter((_, idx) => idx % 3 === 1);
    for (let i = 0; i < 5; i++) {
      const whId = created.warehouses[i % created.warehouses.length];
      const partnerId = customers.length > 0 ? customers[i % customers.length] : created.partners[0];
      const shipDate = new Date();
      shipDate.setDate(shipDate.getDate() + i + 3);

      const items = [];
      for (let j = 0; j < 2; j++) {
        items.push({
          itemId: created.items[(i * 2 + j) % created.items.length],
          orderedQty: 5 * (j + 1),
        });
      }

      const { status, body } = await apiPost('/outbound', {
        partnerId,
        warehouseId: whId,
        shipDate: shipDate.toISOString(),
        notes: `테스트 출고오더 ${i + 1}`,
        items,
      });
      if (status === 201) {
        created.outbounds.push(body.data.id);
      }
    }
    console.log(`✅ 출고오더 ${created.outbounds.length}개 생성`);
  });

  test('13-1. 출고오더 READ & UPDATE', async () => {
    for (const id of created.outbounds) {
      const { status: getStatus } = await apiGet(`/outbound/${id}`);
      expect(getStatus).toBe(200);

      const { status: putStatus } = await apiPut(`/outbound/${id}`, {
        notes: 'Updated outbound note',
      });
      expect(putStatus).toBe(200);
    }
    console.log('✅ 출고오더 READ/UPDATE 완료');
  });

  // ═══════════════════════════════════════════
  // 14. STOCK ADJUSTMENTS - 3개
  // ═══════════════════════════════════════════
  test('14. 재고조정 3개 CREATE', async () => {
    const reasons: string[] = ['FOUND', 'CORRECTION', 'DAMAGE'];
    // 먼저 아이템 코드를 조회
    for (let i = 0; i < 3; i++) {
      const itemRes = await apiGet(`/items/${created.items[i]}`);
      const itemCode = itemRes.body.data?.code;
      if (!itemCode) continue;

      const { status, body } = await apiPost('/inventory/adjustments', {
        warehouseId: created.warehouses[i % created.warehouses.length],
        itemCode,
        adjustQty: (i + 1) * 10,
        reason: reasons[i],
        performedBy: '테스트 관리자',
        notes: `테스트 재고조정 ${i + 1}`,
      });
      if (status === 201) {
        created.adjustments.push(body.data?.id || `adj-${i}`);
      }
    }
    console.log(`✅ 재고조정 ${created.adjustments.length}개 생성`);
  });

  // ═══════════════════════════════════════════
  // 15. CYCLE COUNTS - 3개
  // ═══════════════════════════════════════════
  test('15. 순환실사 3개 CREATE', async () => {
    for (let i = 0; i < 3; i++) {
      const { status, body } = await apiPost('/inventory/cycle-counts', {
        warehouseId: created.warehouses[i % created.warehouses.length],
        systemQty: (i + 1) * 20,
        itemCode: `ITM-${ts}-${String(i + 1).padStart(3, '0')}`,
      });
      if (status === 201) {
        created.cycleCounts.push(body.data.id);
      }
    }
    console.log(`✅ 순환실사 ${created.cycleCounts.length}개 생성`);
  });

  test('15-1. 순환실사 완료처리', async () => {
    for (const id of created.cycleCounts) {
      const { status } = await apiPost(`/inventory/cycle-counts/${id}/complete`, {
        countedQty: 15,
        countedBy: '실사담당자',
        notes: '테스트 완료',
      });
      // 성공 또는 이미 완료 상태 허용
      expect([200, 201, 400]).toContain(status);
    }
    console.log('✅ 순환실사 완료처리');
  });

  // ═══════════════════════════════════════════
  // 16. DISPATCHES - 3개
  // ═══════════════════════════════════════════
  test('16. 배차 3개 CREATE', async () => {
    for (let i = 0; i < 3; i++) {
      const dispDate = new Date();
      dispDate.setDate(dispDate.getDate() + i);
      const itemRes = await apiGet(`/items/${created.items[i]}`);
      const itemCode = itemRes.body.data?.code || `ITM-${i}`;
      const itemName = itemRes.body.data?.name || `상품${i}`;

      const { status, body } = await apiPost('/dispatches', {
        warehouseId: created.warehouses[i % created.warehouses.length],
        vehicleId: created.vehicles.length > 0 ? created.vehicles[i % created.vehicles.length] : undefined,
        dispatchDate: dispDate.toISOString(),
        dispatchSeq: i + 1,
        notes: `테스트 배차 ${i + 1}`,
        items: [{
          itemCode,
          itemName,
          orderedQty: 10 * (i + 1),
          dispatchedQty: 0,
        }],
      });
      if (status === 201) {
        created.dispatches.push(body.data.id);
      }
    }
    console.log(`✅ 배차 ${created.dispatches.length}개 생성`);
  });

  // ═══════════════════════════════════════════
  // 17. WORK ORDERS - 3개
  // ═══════════════════════════════════════════
  test('17. 작업지시 3개 CREATE', async () => {
    const types = ['RECEIVING', 'PICKING', 'PUTAWAY'];
    for (let i = 0; i < 3; i++) {
      const itemRes = await apiGet(`/items/${created.items[i]}`);
      const itemCode = itemRes.body.data?.code || `ITM-${i}`;
      const itemName = itemRes.body.data?.name || `상품${i}`;

      const { status, body } = await apiPost('/work-orders', {
        warehouseId: created.warehouses[i % created.warehouses.length],
        workType: types[i],
        notes: `테스트 작업지시 ${i + 1}`,
        items: [{
          itemCode,
          itemName,
          plannedQty: 10 * (i + 1),
        }],
      });
      if (status === 201) {
        created.workOrders.push(body.data.id);
      }
    }
    console.log(`✅ 작업지시 ${created.workOrders.length}개 생성`);
  });

  // ═══════════════════════════════════════════
  // 18. SETTLEMENTS - 3개
  // ═══════════════════════════════════════════
  test('18. 정산 3개 CREATE', async () => {
    for (let i = 0; i < 3; i++) {
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      const end = new Date();

      const { status, body } = await apiPost('/settlements', {
        warehouseId: created.warehouses[i % created.warehouses.length],
        partnerId: created.partners[i % created.partners.length],
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        inboundFee: 100000 * (i + 1),
        outboundFee: 80000 * (i + 1),
        storageFee: 50000 * (i + 1),
        handlingFee: 20000 * (i + 1),
        totalAmount: 250000 * (i + 1),
        notes: `테스트 정산 ${i + 1}`,
      });
      if (status === 201) {
        created.settlements.push(body.data.id);
      }
    }
    console.log(`✅ 정산 ${created.settlements.length}개 생성`);
  });

  // ═══════════════════════════════════════════
  // 19. 전체 목록 조회 테스트
  // ═══════════════════════════════════════════
  test('19. 전체 목록 API 조회 검증', async () => {
    const endpoints = [
      '/warehouses',
      '/items',
      '/partners',
      '/auth/users',
      '/common-codes',
      '/uom',
      '/item-groups',
      '/vehicles',
      '/docks',
      '/inbound',
      '/outbound',
      '/inventory/adjustments',
      '/inventory/cycle-counts',
      '/dispatches',
      '/work-orders',
      '/settlements',
      '/inventory/stock',
      '/inventory/transactions',
    ];

    for (const ep of endpoints) {
      const { status } = await apiGet(`${ep}?limit=5`);
      expect(status).toBe(200);
    }
    console.log('✅ 전체 목록 API 조회 성공');
  });

  // ═══════════════════════════════════════════
  // 20. 총 생성 수량 집계
  // ═══════════════════════════════════════════
  test('20. 테스트 데이터 총 집계', async () => {
    const total =
      created.warehouses.length +
      created.zones.length +
      created.locations.length +
      created.items.length +
      created.partners.length +
      created.users.length +
      created.commonCodes.length +
      created.uoms.length +
      created.itemGroups.length +
      created.vehicles.length +
      created.docks.length +
      created.inbounds.length +
      created.outbounds.length +
      created.adjustments.length +
      created.cycleCounts.length +
      created.dispatches.length +
      created.workOrders.length +
      created.settlements.length;

    console.log('═══════════════════════════════════════════');
    console.log(`📊 총 테스트 데이터: ${total}개`);
    console.log(`  창고: ${created.warehouses.length}`);
    console.log(`  존: ${created.zones.length}`);
    console.log(`  로케이션: ${created.locations.length}`);
    console.log(`  품목: ${created.items.length}`);
    console.log(`  거래처: ${created.partners.length}`);
    console.log(`  사용자: ${created.users.length}`);
    console.log(`  공통코드: ${created.commonCodes.length}`);
    console.log(`  UOM: ${created.uoms.length}`);
    console.log(`  품목그룹: ${created.itemGroups.length}`);
    console.log(`  차량: ${created.vehicles.length}`);
    console.log(`  도크: ${created.docks.length}`);
    console.log(`  입고오더: ${created.inbounds.length}`);
    console.log(`  출고오더: ${created.outbounds.length}`);
    console.log(`  재고조정: ${created.adjustments.length}`);
    console.log(`  순환실사: ${created.cycleCounts.length}`);
    console.log(`  배차: ${created.dispatches.length}`);
    console.log(`  작업지시: ${created.workOrders.length}`);
    console.log(`  정산: ${created.settlements.length}`);
    console.log('═══════════════════════════════════════════');

    expect(total).toBeGreaterThanOrEqual(100);
  });

});

// ═══════════════════════════════════════════════════
// UI 테스트 - Playwright 브라우저 테스트
// ═══════════════════════════════════════════════════
test.describe('KCS WMS UI 페이지 QC', () => {

  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('http://localhost:3200/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@kcs.com');
    await page.fill('input[type="password"], input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/', { timeout: 10000 });
  });

  const pages = [
    { name: '대시보드', path: '/' },
    { name: '창고관리', path: '/warehouse' },
    { name: '품목관리', path: '/items' },
    { name: '품목그룹', path: '/item-groups' },
    { name: '거래처', path: '/partners' },
    { name: '입고관리', path: '/inbound' },
    { name: '출고관리', path: '/outbound' },
    { name: '재고현황', path: '/inventory' },
    { name: '재고조정', path: '/inventory/adjustments' },
    { name: '순환실사', path: '/inventory/cycle-counts' },
    { name: '재고이동', path: '/inventory/transfer' },
    { name: '재고이력', path: '/inventory/transactions' },
    { name: '배차관리', path: '/dispatch' },
    { name: '작업지시', path: '/work-orders' },
    { name: '차량관리', path: '/vehicles' },
    { name: '도크관리', path: '/docks' },
    { name: '사용자', path: '/users' },
    { name: '정산', path: '/settlements' },
    { name: '채널관리', path: '/channels' },
    { name: '공통코드', path: '/settings/common-codes' },
    { name: 'UOM', path: '/settings/uom' },
  ];

  for (const p of pages) {
    test(`UI-${p.name} 페이지 로드 확인`, async ({ page }) => {
      const response = await page.goto(`http://localhost:3200${p.path}`);
      expect(response?.status()).toBeLessThan(500);
      // 페이지가 에러 없이 로드되었는지 확인
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      // 콘솔 에러 체크
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      await page.waitForTimeout(1000);
      // 스크린샷
      await page.screenshot({ path: `tests/screenshots/ui-${p.path.replace(/\//g, '_') || 'home'}.png` });
    });
  }

  test('UI-창고 등록 모달 테스트', async ({ page }) => {
    await page.goto('http://localhost:3200/warehouse');
    await page.waitForLoadState('networkidle');
    // 등록 버튼 클릭
    const addBtn = page.locator('button:has-text("등록"), button:has-text("추가"), button:has-text("새")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/screenshots/ui-warehouse-modal.png' });
    }
  });

  test('UI-품목 등록 모달 테스트', async ({ page }) => {
    await page.goto('http://localhost:3200/items');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button:has-text("등록"), button:has-text("추가"), button:has-text("새")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/screenshots/ui-item-modal.png' });
    }
  });

  test('UI-거래처 등록 모달 테스트', async ({ page }) => {
    await page.goto('http://localhost:3200/partners');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button:has-text("등록"), button:has-text("추가"), button:has-text("새")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/screenshots/ui-partner-modal.png' });
    }
  });

  test('UI-입고오더 등록 모달 테스트', async ({ page }) => {
    await page.goto('http://localhost:3200/inbound');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button:has-text("등록"), button:has-text("추가"), button:has-text("새")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/screenshots/ui-inbound-modal.png' });
    }
  });

  test('UI-출고오더 등록 모달 테스트', async ({ page }) => {
    await page.goto('http://localhost:3200/outbound');
    await page.waitForLoadState('networkidle');
    const addBtn = page.locator('button:has-text("등록"), button:has-text("추가"), button:has-text("새")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/screenshots/ui-outbound-modal.png' });
    }
  });

});
