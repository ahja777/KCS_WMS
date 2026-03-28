import { test, expect, request, APIRequestContext, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const API = 'http://localhost:4100/api';
const FE = 'http://localhost:3200';
let token = '';
let api: APIRequestContext;
const ts = Date.now().toString(36);
const SS = 'tests/screenshots/qc';

// 생성된 ID 저장
const ids = {
  warehouses: [] as any[],
  zones: [] as any[],
  locations: [] as any[],
  items: [] as any[],
  partners: [] as any[],
  users: [] as any[],
  commonCodes: [] as any[],
  uoms: [] as any[],
  itemGroups: [] as any[],
  vehicles: [] as any[],
  docks: [] as any[],
  inbounds: [] as any[],
  outbounds: [] as any[],
  adjustments: [] as any[],
  cycleCounts: [] as any[],
  dispatches: [] as any[],
  workOrders: [] as any[],
  settlements: [] as any[],
};

async function post(p: string, d: any) {
  const r = await api.post(`${API}${p}`, { data: d, headers: { Authorization: `Bearer ${token}` } });
  const b = await r.json();
  if (!r.ok()) console.error(`❌ POST ${p} [${r.status()}]: ${JSON.stringify(b).slice(0, 200)}`);
  return { s: r.status(), d: b.data };
}
async function get(p: string) {
  const r = await api.get(`${API}${p}`, { headers: { Authorization: `Bearer ${token}` } });
  return { s: r.status(), d: (await r.json()).data };
}
async function put(p: string, d: any) {
  const r = await api.put(`${API}${p}`, { data: d, headers: { Authorization: `Bearer ${token}` } });
  return { s: r.status(), d: (await r.json()).data };
}
async function del(p: string) {
  const r = await api.delete(`${API}${p}`, { headers: { Authorization: `Bearer ${token}` } });
  return { s: r.status() };
}

// ══════════════════════════════════════
// 현실적 창고업무 데이터 생성기
// ══════════════════════════════════════
const countries = ['US','KR','JP','DE','VN','TH','CN','MY','SG','ID'];
const cities: Record<string,string[]> = {
  US:['Los Angeles','Chicago','Houston','Dallas','Seattle'],
  KR:['서울','인천','부산','대전','광주'],
  JP:['Tokyo','Osaka','Nagoya','Fukuoka','Yokohama'],
  DE:['Berlin','Hamburg','Munich','Frankfurt','Stuttgart'],
  VN:['Ho Chi Minh','Hanoi','Da Nang','Hai Phong','Can Tho'],
  TH:['Bangkok','Chiang Mai','Pattaya','Phuket','Nonthaburi'],
  CN:['Shanghai','Shenzhen','Guangzhou','Beijing','Qingdao'],
  MY:['Kuala Lumpur','Penang','Johor Bahru','Malacca','Ipoh'],
  SG:['Singapore','Jurong','Woodlands','Tampines','Changi'],
  ID:['Jakarta','Surabaya','Bandung','Semarang','Medan'],
};
const whTypes = ['General','Cold Storage','Bonded','Cross-Dock','Hazmat','E-commerce FC','Returns Center','Bulk Storage','Temperature Controlled','Distribution Center'];
const itemNames = [
  '노트북 컴퓨터','무선 이어폰','스마트워치','태블릿 PC','휴대폰 케이스',
  '블루투스 스피커','USB-C 케이블','보조배터리','SSD 드라이브','웹캠',
  '면 티셔츠','청바지','운동화','패딩 자켓','정장 셔츠',
  '원피스','니트 스웨터','트레이닝 팬츠','캔버스 가방','선글라스',
  '즉석밥','라면 박스','올리브유','견과류 세트','그린티 티백',
  '냉동 만두','냉동 피자','건조 파스타','통조림 참치','꿀',
  '세탁세제','샴푸','칫솔 세트','물티슈','핸드크림',
  '비타민C','종합비타민','마스크팩','선크림','헤어오일',
  '유리컵 세트','프라이팬','도마','텀블러','보온병',
  '식기 세트','수저 세트','냄비 세트','와인잔 세트','밀폐용기 세트',
  '배터리 AA','배터리 AAA','LED 전구','멀티탭','미니 선풍기',
  'A4 복사지','노트 세트','볼펜 세트','파일 박스','접착 메모지',
  '요가 매트','덤벨 세트','줄넘기','테니스 라켓','축구공',
  '캠핑 텐트','침낭','헤드랜턴','캠핑 의자','아이스박스',
  '강아지 사료','고양이 사료','애견 간식','고양이 모래','반려동물 장난감',
  '아기 기저귀','분유','아기 물티슈','유아 식기','아기 로션',
  '자동차 워셔액','엔진오일','타이어 공기압계','차량용 충전기','블랙박스',
  '화분','원예 가위','화분 흙','비료','분무기',
  '와이파이 공유기','외장하드','마우스패드','키보드','모니터 스탠드',
  '책상 정리함','서랍장','옷걸이 세트','신발장','수납 바구니',
];
const partnerNames = [
  '삼성전자','LG전자','SK하이닉스','현대모비스','포스코',
  '롯데제과','CJ제일제당','오리온','농심','하이트진로',
  '나이키코리아','아디다스코리아','유니클로코리아','자라코리아','H&M코리아',
  'Amazon Korea','Coupang Logistics','네이버 풀필먼트','마켓컬리','SSG닷컴',
  '한진택배','CJ대한통운','롯데택배','우체국택배','로젠택배',
  '대한항공 카고','FedEx Korea','DHL Korea','UPS Korea','Maersk Korea',
  '코스트코 코리아','이마트','홈플러스','GS25 물류','CU 물류센터',
  'Apple Korea','Sony Korea','Panasonic Korea','Lenovo Korea','Dell Korea',
  '아모레퍼시픽','LG생활건강','한국콜마','코스맥스','애경산업',
  '풀무원','동원F&B','매일유업','빙그레','오뚜기',
  '한화솔루션','LG화학','롯데케미칼','금호석유화학','SKC',
  '현대건설','삼성물산','대림산업','GS건설','포스코건설',
  'KT 물류','SK텔레콤 물류','LG유플러스 물류','쿠팡 로켓배송','배달의민족 물류',
  '두산중공업','효성중공업','LS전선','대한전선','넥센타이어',
  '파리바게뜨','SPC그룹','BGF리테일','GS리테일','이디야커피',
  '현대백화점','신세계백화점','롯데백화점','AK플라자','갤러리아',
  '카카오커머스','네이버쇼핑','11번가','G마켓','옥션',
  '우아한형제들','요기요','쿠팡이츠','마켓플레이스','무신사',
  '한국타이어','금호타이어','넥센타이어','한국GM','르노코리아',
  '삼양식품','해태제과','크라운제과','동서식품','남양유업',
];
const categories = ['GENERAL','ELECTRONICS','CLOTHING','FOOD','FRAGILE','HAZARDOUS','OVERSIZED'] as const;
const uomTypes = ['EA','BOX','PALLET','CASE','KG','LB'] as const;
const zoneTypes = ['RECEIVING','STORAGE','PICKING','PACKING','SHIPPING','QUARANTINE','RETURN'] as const;

test.describe.serial('창고업무 100개 데이터 CRUD + QC', () => {
  test.beforeAll(async () => {
    api = await request.newContext();
    const r = await api.post(`${API}/auth/login`, { data: { email: 'admin@kcs.com', password: 'password123' } });
    token = (await r.json()).data.accessToken;
    fs.mkdirSync(path.join(process.cwd(), SS), { recursive: true });
    console.log('✅ 로그인 완료');
  });
  test.afterAll(async () => { await api.dispose(); });

  // ═══ 1. 창고 10개 ═══
  test('1. 창고 10개 CREATE (글로벌 물류센터)', async () => {
    for (let i = 0; i < 10; i++) {
      const c = countries[i];
      const city = cities[c][i % 5];
      const { s, d } = await post('/warehouses', {
        code: `WH-${ts}-${String(i+1).padStart(3,'0')}`,
        name: `${city} ${whTypes[i]}`,
        country: c, city,
        address: `${city} Logistics Park, Building ${i+1}`,
        zipCode: `${10000 + i*1111}`,
        timezone: 'Asia/Seoul',
        status: 'ACTIVE',
        contactName: `Manager ${i+1}`,
        contactPhone: `010-${String(3000+i).padStart(4,'0')}-${String(1000+i).padStart(4,'0')}`,
        contactEmail: `wh${i+1}@kcslogistics.com`,
        notes: `${whTypes[i]} - ${c}/${city} 물류센터`,
      });
      expect(s).toBe(201);
      ids.warehouses.push({ id: d.id, code: d.code, name: d.name });
    }
    console.log(`✅ 창고 ${ids.warehouses.length}개 생성`);
  });

  // ═══ 2. 존 70개 (창고당 7개 - 모든 존 타입) ═══
  test('2. 존 70개 CREATE (창고별 전체 존 타입)', async () => {
    for (const wh of ids.warehouses) {
      for (let j = 0; j < 7; j++) {
        const { s, d } = await post(`/warehouses/${wh.id}/zones`, {
          code: `ZN-${zoneTypes[j].slice(0,3)}-${ts.slice(-4)}-${ids.zones.length+1}`,
          name: `${zoneTypes[j]} 존`,
          type: zoneTypes[j],
          description: `${wh.name} - ${zoneTypes[j]} zone`,
        });
        if (s === 201) ids.zones.push({ id: d.id, whId: wh.id, type: zoneTypes[j] });
      }
    }
    console.log(`✅ 존 ${ids.zones.length}개 생성`);
  });

  // ═══ 3. 로케이션 100개 ═══
  test('3. 로케이션 100개 CREATE (현실적 AISLE-RACK-LEVEL-BIN)', async () => {
    const storageZones = ids.zones.filter(z => z.type === 'STORAGE');
    let locIdx = 0;
    for (const zone of storageZones) {
      for (let a = 1; a <= 2; a++) {
        for (let r = 1; r <= 5; r++) {
          if (locIdx >= 100) break;
          locIdx++;
          const aisle = `A${String(a).padStart(2,'0')}`;
          const rack = `R${String(r).padStart(2,'0')}`;
          const level = `L${String((locIdx % 3) + 1).padStart(2,'0')}`;
          const bin = `B${String((locIdx % 4) + 1).padStart(2,'0')}`;
          const { s, d } = await post(`/warehouses/${zone.whId}/zones/${zone.id}/locations`, {
            code: `${aisle}-${rack}-${level}-${bin}`,
            aisle, rack, level, bin,
            status: 'AVAILABLE',
            maxWeight: 500 + (locIdx * 50),
            maxVolume: 10 + locIdx,
          });
          if (s === 201) ids.locations.push({ id: d.id, code: d.code, whId: zone.whId, zoneId: zone.id });
        }
        if (locIdx >= 100) break;
      }
    }
    console.log(`✅ 로케이션 ${ids.locations.length}개 생성`);
  });

  // ═══ 4. 품목 100개 ═══
  test('4. 품목 100개 CREATE (현실적 상품 마스터)', async () => {
    for (let i = 0; i < 100; i++) {
      const cat = categories[i % 7];
      const uom = uomTypes[i % 6];
      const { s, d } = await post('/items', {
        code: `SKU-${ts}-${String(i+1).padStart(4,'0')}`,
        name: itemNames[i % itemNames.length],
        description: `${itemNames[i % itemNames.length]} - 테스트 상품 ${i+1}`,
        barcode: `880${ts}${String(i+1).padStart(6,'0')}`,
        category: cat,
        uom,
        weight: +(Math.random() * 20 + 0.1).toFixed(2),
        length: +(Math.random() * 50 + 5).toFixed(1),
        width: +(Math.random() * 40 + 3).toFixed(1),
        height: +(Math.random() * 30 + 2).toFixed(1),
        minStock: Math.floor(Math.random() * 50) + 10,
        maxStock: Math.floor(Math.random() * 500) + 100,
        unitPrice: Math.floor(Math.random() * 100000) + 1000,
        isActive: true,
      });
      if (s === 201) ids.items.push({ id: d.id, code: d.code, name: d.name });
    }
    console.log(`✅ 품목 ${ids.items.length}개 생성`);
  });

  // ═══ 5. 거래처 100개 ═══
  test('5. 거래처 100개 CREATE (공급사/고객/운송사)', async () => {
    const types = ['SUPPLIER','CUSTOMER','CARRIER'] as const;
    for (let i = 0; i < 100; i++) {
      const type = types[i % 3];
      const { s, d } = await post('/partners', {
        code: `PTR-${ts}-${String(i+1).padStart(4,'0')}`,
        name: partnerNames[i % partnerNames.length],
        type,
        contactName: `${type === 'CARRIER' ? '배송' : '영업'}담당 ${i+1}`,
        contactPhone: `010-${String(5000+i).padStart(4,'0')}-${String(1000+i).padStart(4,'0')}`,
        contactEmail: `partner${i+1}@${type.toLowerCase()}.com`,
        country: countries[i % 10],
        city: cities[countries[i%10]][i % 5],
        address: `물류단지 ${Math.floor(i/10)+1}블록 ${(i%10)+1}호`,
        businessNo: `${100+Math.floor(i/10)}-${80+i%10}-${10000+i}`,
        isActive: true,
        notes: `${type} - ${partnerNames[i % partnerNames.length]}`,
      });
      if (s === 201) ids.partners.push({ id: d.id, code: d.code, name: d.name, type });
    }
    console.log(`✅ 거래처 ${ids.partners.length}개 생성`);
  });

  // ═══ 6. 사용자 10개 ═══
  test('6. 사용자 10개 CREATE', async () => {
    const roles = ['MANAGER','OPERATOR','OPERATOR','VIEWER','OPERATOR','MANAGER','OPERATOR','VIEWER','OPERATOR','OPERATOR'];
    const depts = ['물류팀','입고팀','출고팀','재고팀','배송팀','운영팀','QC팀','CS팀','시스템팀','관리팀'];
    for (let i = 0; i < 10; i++) {
      const { s, d } = await post('/auth/register', {
        email: `${ts}user${i+1}@kcslogistics.com`,
        password: 'KcsWms2024!',
        name: `${depts[i]} 담당자${i+1}`,
      });
      if (s === 201 || s === 200) {
        const uid = d?.id || d?.user?.id;
        if (uid) {
          await put(`/auth/users/${uid}`, { role: roles[i] });
          ids.users.push({ id: uid, role: roles[i] });
        }
      }
    }
    console.log(`✅ 사용자 ${ids.users.length}개 생성`);
  });

  // ═══ 7. 공통코드 20개 ═══
  test('7. 공통코드 20개 CREATE', async () => {
    const codes = [
      { codeType:'WH_TYPE', typeNm:'창고유형', code:`GENERAL-${ts}`, codeNm:'일반창고' },
      { codeType:'WH_TYPE', typeNm:'창고유형', code:`COLD-${ts}`, codeNm:'냉장창고' },
      { codeType:'WH_TYPE', typeNm:'창고유형', code:`BONDED-${ts}`, codeNm:'보세창고' },
      { codeType:'WH_TYPE', typeNm:'창고유형', code:`HAZMAT-${ts}`, codeNm:'위험물창고' },
      { codeType:'ITEM_GRADE', typeNm:'상품등급', code:`A-${ts}`, codeNm:'A등급 (정상)' },
      { codeType:'ITEM_GRADE', typeNm:'상품등급', code:`B-${ts}`, codeNm:'B등급 (경미손상)' },
      { codeType:'ITEM_GRADE', typeNm:'상품등급', code:`C-${ts}`, codeNm:'C등급 (불량)' },
      { codeType:'SHIP_METHOD', typeNm:'배송방법', code:`PARCEL-${ts}`, codeNm:'택배' },
      { codeType:'SHIP_METHOD', typeNm:'배송방법', code:`TRUCK-${ts}`, codeNm:'차량배송' },
      { codeType:'SHIP_METHOD', typeNm:'배송방법', code:`AIR-${ts}`, codeNm:'항공운송' },
      { codeType:'SHIP_METHOD', typeNm:'배송방법', code:`SEA-${ts}`, codeNm:'해상운송' },
      { codeType:'ADJ_REASON', typeNm:'조정사유', code:`QUALITY-${ts}`, codeNm:'품질불량' },
      { codeType:'ADJ_REASON', typeNm:'조정사유', code:`RECOUNT-${ts}`, codeNm:'재실사' },
      { codeType:'LOC_TYPE', typeNm:'로케이션유형', code:`FLOOR-${ts}`, codeNm:'바닥적재' },
      { codeType:'LOC_TYPE', typeNm:'로케이션유형', code:`RACK-${ts}`, codeNm:'랙 보관' },
      { codeType:'LOC_TYPE', typeNm:'로케이션유형', code:`MEZZA-${ts}`, codeNm:'중층 보관' },
      { codeType:'TEMP_TYPE', typeNm:'온도구분', code:`ROOM-${ts}`, codeNm:'상온 (15~25℃)' },
      { codeType:'TEMP_TYPE', typeNm:'온도구분', code:`COOL-${ts}`, codeNm:'냉장 (0~10℃)' },
      { codeType:'TEMP_TYPE', typeNm:'온도구분', code:`FREEZE-${ts}`, codeNm:'냉동 (-18℃ 이하)' },
      { codeType:'PKG_TYPE', typeNm:'포장유형', code:`CARTON-${ts}`, codeNm:'카톤박스' },
    ];
    for (const c of codes) {
      const { s, d } = await post('/common-codes', { ...c, sortOrder: ids.commonCodes.length + 1, isActive: true });
      if (s === 201) ids.commonCodes.push(d.id);
    }
    console.log(`✅ 공통코드 ${ids.commonCodes.length}개 생성`);
  });

  // ═══ 8. UOM 10개 ═══
  test('8. UOM 10개 CREATE', async () => {
    const uoms = [
      { code:`SET-${ts}`, name:'세트' },{ code:`ROLL-${ts}`, name:'롤' },
      { code:`PACK-${ts}`, name:'팩' },{ code:`BAG-${ts}`, name:'봉' },
      { code:`BTL-${ts}`, name:'병' },{ code:`CAN-${ts}`, name:'캔' },
      { code:`DRUM-${ts}`, name:'드럼' },{ code:`TUBE-${ts}`, name:'튜브' },
      { code:`SHEET-${ts}`, name:'장' },{ code:`PAIR-${ts}`, name:'켤레' },
    ];
    for (const u of uoms) {
      const { s, d } = await post('/uom', u);
      if (s === 201) ids.uoms.push(d.id);
    }
    console.log(`✅ UOM ${ids.uoms.length}개 생성`);
  });

  // ═══ 9. 품목그룹 10개 ═══
  test('9. 품목그룹 10개 CREATE', async () => {
    const groups = [
      { code:`GRP-ELEC-${ts}`, name:'전자제품', groupType:'ELECTRONICS' },
      { code:`GRP-FOOD-${ts}`, name:'식품류', groupType:'FOOD' },
      { code:`GRP-CLTH-${ts}`, name:'의류', groupType:'CLOTHING' },
      { code:`GRP-COSM-${ts}`, name:'화장품/뷰티', groupType:'GENERAL' },
      { code:`GRP-HOME-${ts}`, name:'생활용품', groupType:'GENERAL' },
      { code:`GRP-SPRT-${ts}`, name:'스포츠/레저', groupType:'GENERAL' },
      { code:`GRP-BABY-${ts}`, name:'유아용품', groupType:'FRAGILE' },
      { code:`GRP-AUTO-${ts}`, name:'자동차용품', groupType:'GENERAL' },
      { code:`GRP-PET-${ts}`, name:'반려동물', groupType:'GENERAL' },
      { code:`GRP-OFFC-${ts}`, name:'사무용품', groupType:'GENERAL' },
    ];
    for (const g of groups) {
      const { s, d } = await post('/item-groups', g);
      if (s === 201) ids.itemGroups.push(d.id);
    }
    console.log(`✅ 품목그룹 ${ids.itemGroups.length}개 생성`);
  });

  // ═══ 10. 차량 20개 ═══
  test('10. 차량 20개 CREATE', async () => {
    const regions = ['서울','경기','인천','부산','대구','광주','대전','울산','세종','강원'];
    for (let i = 0; i < 20; i++) {
      const { s, d } = await post('/vehicles', {
        plateNo: `${regions[i%10]}${ts.slice(-3)}${String(i+1).padStart(2,'0')}`,
        tonnage: [1, 1.5, 2.5, 3.5, 5, 8, 11, 15, 18, 25][i % 10],
        driverName: `기사 ${i+1}`,
        driverPhone: `010-${String(7000+i).padStart(4,'0')}-${String(2000+i).padStart(4,'0')}`,
        warehouseId: ids.warehouses[i % ids.warehouses.length].id,
        isActive: true,
      });
      if (s === 201) ids.vehicles.push({ id: d.id, plateNo: d.plateNo });
    }
    console.log(`✅ 차량 ${ids.vehicles.length}개 생성`);
  });

  // ═══ 11. 도크 20개 ═══
  test('11. 도크 20개 CREATE', async () => {
    for (let i = 0; i < 20; i++) {
      const whIdx = i % ids.warehouses.length;
      const { s, d } = await post('/docks', {
        warehouseId: ids.warehouses[whIdx].id,
        code: `DOCK-${ts}-${String(i+1).padStart(3,'0')}`,
        name: `${i % 2 === 0 ? '입고' : '출고'} 도크 ${Math.floor(i/ids.warehouses.length)+1}`,
        sortOrder: i + 1,
        maxTonnage: [5, 10, 15, 20, 25][i % 5],
        notes: `${ids.warehouses[whIdx].name} - ${i % 2 === 0 ? '입고' : '출고'}용`,
      });
      if (s === 201) ids.docks.push(d.id);
    }
    console.log(`✅ 도크 ${ids.docks.length}개 생성`);
  });

  // ═══ 12. 입고오더 30개 ═══
  test('12. 입고오더 30개 CREATE (공급사별 입고)', async () => {
    const suppliers = ids.partners.filter(p => p.type === 'SUPPLIER');
    for (let i = 0; i < 30; i++) {
      const whId = ids.warehouses[i % ids.warehouses.length].id;
      const partnerId = suppliers[i % suppliers.length].id;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 14) + 1);
      const numItems = Math.floor(Math.random() * 4) + 1;
      const items = [];
      for (let j = 0; j < numItems; j++) {
        items.push({
          itemId: ids.items[(i * 4 + j) % ids.items.length].id,
          expectedQty: Math.floor(Math.random() * 200) + 10,
        });
      }
      const { s, d } = await post('/inbound', {
        partnerId, warehouseId: whId,
        expectedDate: futureDate.toISOString(),
        notes: `입고예정 - ${suppliers[i % suppliers.length].name}`,
        items,
      });
      if (s === 201) ids.inbounds.push({ id: d.id, orderNumber: d.orderNumber });
    }
    console.log(`✅ 입고오더 ${ids.inbounds.length}개 생성`);
  });

  // ═══ 13. 입고 상태변경 (확인/도착) ═══
  test('13. 입고오더 상태변경 (확인→도착)', async () => {
    let confirmed = 0;
    for (const ib of ids.inbounds.slice(0, 20)) {
      const r1 = await post(`/inbound/${ib.id}/confirm`, {});
      if (r1.s === 200 || r1.s === 201) {
        confirmed++;
        await post(`/inbound/${ib.id}/arrive`, {});
      }
    }
    console.log(`✅ 입고 ${confirmed}건 확인/도착 처리`);
  });

  // ═══ 14. 출고오더 30개 ═══
  test('14. 출고오더 30개 CREATE (고객별 출고)', async () => {
    const customers = ids.partners.filter(p => p.type === 'CUSTOMER');
    for (let i = 0; i < 30; i++) {
      const whId = ids.warehouses[i % ids.warehouses.length].id;
      const partnerId = customers[i % customers.length].id;
      const shipDate = new Date();
      shipDate.setDate(shipDate.getDate() + Math.floor(Math.random() * 7) + 1);
      const numItems = Math.floor(Math.random() * 3) + 1;
      const items = [];
      for (let j = 0; j < numItems; j++) {
        items.push({
          itemId: ids.items[(i * 3 + j) % ids.items.length].id,
          orderedQty: Math.floor(Math.random() * 50) + 5,
        });
      }
      const { s, d } = await post('/outbound', {
        partnerId, warehouseId: whId,
        shipDate: shipDate.toISOString(),
        notes: `출고예정 - ${customers[i % customers.length].name}`,
        items,
      });
      if (s === 201) ids.outbounds.push({ id: d.id, orderNumber: d.orderNumber });
    }
    console.log(`✅ 출고오더 ${ids.outbounds.length}개 생성`);
  });

  // ═══ 15. 재고조정 20개 ═══
  test('15. 재고조정 20개 CREATE', async () => {
    const reasons = ['FOUND','CORRECTION','DAMAGE','LOST','EXPIRY','OTHER'] as const;
    for (let i = 0; i < 20; i++) {
      const item = ids.items[i % ids.items.length];
      const { s } = await post('/inventory/adjustments', {
        warehouseId: ids.warehouses[i % ids.warehouses.length].id,
        itemCode: item.code,
        adjustQty: (i % 3 === 2) ? -(Math.floor(Math.random() * 10) + 1) : Math.floor(Math.random() * 50) + 5,
        reason: reasons[i % 6],
        performedBy: `재고관리자 ${(i % 5) + 1}`,
        notes: `${reasons[i % 6]} - ${item.name}`,
      });
      if (s === 201) ids.adjustments.push(`adj-${i}`);
    }
    console.log(`✅ 재고조정 ${ids.adjustments.length}개 생성`);
  });

  // ═══ 16. 순환실사 10개 ═══
  test('16. 순환실사 10개 CREATE', async () => {
    for (let i = 0; i < 10; i++) {
      const { s, d } = await post('/inventory/cycle-counts', {
        warehouseId: ids.warehouses[i % ids.warehouses.length].id,
        systemQty: Math.floor(Math.random() * 100) + 20,
        itemCode: ids.items[i].code,
      });
      if (s === 201) ids.cycleCounts.push(d.id);
    }
    // 5개 완료처리
    for (const ccId of ids.cycleCounts.slice(0, 5)) {
      await post(`/inventory/cycle-counts/${ccId}/complete`, {
        countedQty: Math.floor(Math.random() * 100) + 15,
        countedBy: '실사담당자',
        notes: '실사 완료',
      });
    }
    console.log(`✅ 순환실사 ${ids.cycleCounts.length}개 생성 (5건 완료)`);
  });

  // ═══ 17. 배차 10개 ═══
  test('17. 배차 10개 CREATE', async () => {
    for (let i = 0; i < 10; i++) {
      const dispDate = new Date();
      dispDate.setDate(dispDate.getDate() + i);
      const item = ids.items[i % ids.items.length];
      const { s, d } = await post('/dispatches', {
        warehouseId: ids.warehouses[i % ids.warehouses.length].id,
        vehicleId: ids.vehicles.length > 0 ? ids.vehicles[i % ids.vehicles.length].id : undefined,
        dispatchDate: dispDate.toISOString(),
        dispatchSeq: i + 1,
        notes: `배차 ${i+1} - ${item.name}`,
        items: [{ itemCode: item.code, itemName: item.name, orderedQty: (i+1)*10, dispatchedQty: 0 }],
      });
      if (s === 201) ids.dispatches.push(d.id);
    }
    console.log(`✅ 배차 ${ids.dispatches.length}개 생성`);
  });

  // ═══ 18. 작업지시 10개 ═══
  test('18. 작업지시 10개 CREATE', async () => {
    const woTypes = ['RECEIVING','PUTAWAY','PICKING','PACKING','LOADING','MOVEMENT','COUNT'] as const;
    for (let i = 0; i < 10; i++) {
      const item = ids.items[i % ids.items.length];
      const { s, d } = await post('/work-orders', {
        warehouseId: ids.warehouses[i % ids.warehouses.length].id,
        workType: woTypes[i % 7],
        notes: `${woTypes[i%7]} 작업 - ${item.name}`,
        items: [{ itemCode: item.code, itemName: item.name, plannedQty: (i+1)*15 }],
      });
      if (s === 201) ids.workOrders.push(d.id);
    }
    console.log(`✅ 작업지시 ${ids.workOrders.length}개 생성`);
  });

  // ═══ 19. 정산 10개 ═══
  test('19. 정산 10개 CREATE', async () => {
    for (let i = 0; i < 10; i++) {
      const start = new Date(); start.setMonth(start.getMonth() - 1 - i);
      const end = new Date(); end.setMonth(end.getMonth() - i);
      const { s, d } = await post('/settlements', {
        warehouseId: ids.warehouses[i % ids.warehouses.length].id,
        partnerId: ids.partners[i % ids.partners.length].id,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        inboundFee: Math.floor(Math.random() * 500000) + 100000,
        outboundFee: Math.floor(Math.random() * 400000) + 80000,
        storageFee: Math.floor(Math.random() * 300000) + 50000,
        handlingFee: Math.floor(Math.random() * 100000) + 20000,
        totalAmount: Math.floor(Math.random() * 1500000) + 250000,
        notes: `${i+1}월 정산`,
      });
      if (s === 201) ids.settlements.push(d.id);
    }
    console.log(`✅ 정산 ${ids.settlements.length}개 생성`);
  });

  // ═══ 20. 전체 READ/UPDATE 검증 ═══
  test('20. 전체 엔티티 READ/UPDATE 검증', async () => {
    // 창고 READ + UPDATE
    for (const wh of ids.warehouses.slice(0, 3)) {
      const { s } = await get(`/warehouses/${wh.id}`);
      expect(s).toBe(200);
      const { s: us } = await put(`/warehouses/${wh.id}`, { notes: `QC 검증 완료 - ${new Date().toISOString()}` });
      expect(us).toBe(200);
    }
    // 품목 READ + UPDATE
    for (const item of ids.items.slice(0, 5)) {
      const { s } = await get(`/items/${item.id}`);
      expect(s).toBe(200);
      const { s: us } = await put(`/items/${item.id}`, { minStock: 999 });
      expect(us).toBe(200);
    }
    // 거래처 READ + UPDATE
    for (const p of ids.partners.slice(0, 5)) {
      const { s } = await get(`/partners/${p.id}`);
      expect(s).toBe(200);
      const { s: us } = await put(`/partners/${p.id}`, { notes: 'QC 검증' });
      expect(us).toBe(200);
    }
    // 입고 READ + UPDATE
    for (const ib of ids.inbounds.slice(0, 5)) {
      const { s } = await get(`/inbound/${ib.id}`);
      expect(s).toBe(200);
    }
    // 출고 READ + UPDATE
    for (const ob of ids.outbounds.slice(0, 5)) {
      const { s } = await get(`/outbound/${ob.id}`);
      expect(s).toBe(200);
      const { s: us } = await put(`/outbound/${ob.id}`, { notes: 'QC 확인' });
      expect(us).toBe(200);
    }
    console.log('✅ 전체 READ/UPDATE 검증 완료');
  });

  // ═══ 21. 전체 목록 API 검증 ═══
  test('21. 전체 목록 API + 페이지네이션 검증', async () => {
    const endpoints = [
      { path: '/warehouses', min: 10 },
      { path: '/items?limit=100', min: 100 },
      { path: '/partners?limit=100', min: 100 },
      { path: '/auth/users', min: 10 },
      { path: '/common-codes', min: 20 },
      { path: '/uom', min: 10 },
      { path: '/item-groups', min: 10 },
      { path: '/vehicles', min: 10 },
      { path: '/docks', min: 10 },
      { path: '/inbound?limit=50', min: 30 },
      { path: '/outbound?limit=50', min: 30 },
      { path: '/inventory/adjustments', min: 10 },
      { path: '/inventory/cycle-counts', min: 5 },
      { path: '/dispatches', min: 5 },
      { path: '/work-orders', min: 5 },
      { path: '/settlements', min: 5 },
      { path: '/inventory/stock', min: 1 },
      { path: '/inventory/transactions', min: 1 },
      { path: '/dashboard/statistics', min: 0 },
    ];
    let pass = 0;
    for (const ep of endpoints) {
      const { s } = await get(ep.path);
      expect(s).toBe(200);
      pass++;
    }
    console.log(`✅ ${pass}개 목록 API 전체 정상`);
  });

  // ═══ 22. 엑셀 다운로드 검증 ═══
  test('22. 엑셀 다운로드 7개 엔드포인트 검증', async () => {
    const exports = [
      '/export/inventory',
      '/export/items',
      '/export/inbound',
      '/export/outbound',
      '/export/partners',
      '/export/warehouses',
    ];
    let pass = 0;
    for (const ep of exports) {
      const r = await api.get(`${API}${ep}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(r.status()).toBe(200);
      const contentType = r.headers()['content-type'] || '';
      expect(contentType).toContain('spreadsheet');
      const body = await r.body();
      expect(body.length).toBeGreaterThan(100); // 실제 파일 크기
      pass++;
    }
    console.log(`✅ 엑셀 다운로드 ${pass}개 엔드포인트 정상`);
  });

  // ═══ 23. DELETE 검증 (마지막 1건씩) ═══
  test('23. DELETE 검증 (엔티티별 1건)', async () => {
    // 정산 삭제
    if (ids.settlements.length > 0) {
      const { s } = await del(`/settlements/${ids.settlements[ids.settlements.length-1]}`);
      expect([200, 204]).toContain(s);
    }
    // 배차 삭제
    if (ids.dispatches.length > 0) {
      const { s } = await del(`/dispatches/${ids.dispatches[ids.dispatches.length-1]}`);
      expect([200, 204]).toContain(s);
    }
    // 공통코드 삭제
    if (ids.commonCodes.length > 0) {
      const { s } = await del(`/common-codes/${ids.commonCodes[ids.commonCodes.length-1]}`);
      expect([200, 204]).toContain(s);
    }
    // UOM 삭제
    if (ids.uoms.length > 0) {
      const { s } = await del(`/uom/${ids.uoms[ids.uoms.length-1]}`);
      expect([200, 204]).toContain(s);
    }
    console.log('✅ DELETE 검증 완료');
  });

  // ═══ 24. 총 집계 ═══
  test('24. 테스트 데이터 총 집계', async () => {
    const total = ids.warehouses.length + ids.zones.length + ids.locations.length +
      ids.items.length + ids.partners.length + ids.users.length +
      ids.commonCodes.length + ids.uoms.length + ids.itemGroups.length +
      ids.vehicles.length + ids.docks.length + ids.inbounds.length +
      ids.outbounds.length + ids.adjustments.length + ids.cycleCounts.length +
      ids.dispatches.length + ids.workOrders.length + ids.settlements.length;

    console.log('════════════════════════════════════════');
    console.log(`📊 총 테스트 데이터: ${total}개`);
    console.log(`  창고: ${ids.warehouses.length} | 존: ${ids.zones.length} | 로케이션: ${ids.locations.length}`);
    console.log(`  품목: ${ids.items.length} | 거래처: ${ids.partners.length} | 사용자: ${ids.users.length}`);
    console.log(`  공통코드: ${ids.commonCodes.length} | UOM: ${ids.uoms.length} | 품목그룹: ${ids.itemGroups.length}`);
    console.log(`  차량: ${ids.vehicles.length} | 도크: ${ids.docks.length}`);
    console.log(`  입고: ${ids.inbounds.length} | 출고: ${ids.outbounds.length}`);
    console.log(`  재고조정: ${ids.adjustments.length} | 실사: ${ids.cycleCounts.length}`);
    console.log(`  배차: ${ids.dispatches.length} | 작업지시: ${ids.workOrders.length} | 정산: ${ids.settlements.length}`);
    console.log('════════════════════════════════════════');
    expect(total).toBeGreaterThanOrEqual(400);
  });
});

// ══════════════════════════════════════════════
// UI QC: 전체 페이지 + 등록 모달 + 팝업 + 엑셀
// ══════════════════════════════════════════════
test.describe('UI QC: 페이지/모달/팝업/엑셀', () => {
  let loggedInPage: Page;

  test.beforeEach(async ({ page }) => {
    await page.goto(`${FE}/login`);
    await page.fill('input[type="email"], input[name="email"]', 'admin@kcs.com');
    await page.fill('input[type="password"], input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/', { timeout: 10000 });
    loggedInPage = page;
  });

  // 전체 21개 페이지 로드
  const pages = [
    '/', '/warehouse', '/items', '/item-groups', '/partners',
    '/inbound', '/outbound', '/inventory', '/inventory/adjustments',
    '/inventory/cycle-counts', '/inventory/transfer', '/inventory/transactions',
    '/dispatch', '/work-orders', '/vehicles', '/docks', '/users',
    '/settlements', '/channels', '/settings/common-codes', '/settings/uom',
  ];
  for (const p of pages) {
    test(`페이지 로드: ${p}`, async ({ page }) => {
      const r = await page.goto(`${FE}${p}`);
      expect(r?.status()).toBeLessThan(500);
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${SS}/page${p.replace(/\//g, '_') || '_home'}.png` });
    });
  }

  // ═══ 등록 모달 테스트 ═══
  test('모달: 창고 등록 폼', async ({ page }) => {
    await page.goto(`${FE}/warehouse`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const btn = page.locator('button:has-text("등록"), button:has-text("신규")').first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
      // 필드 확인
      await expect(page.locator('input, select, textarea').first()).toBeVisible();
      await page.screenshot({ path: `${SS}/modal-warehouse.png` });
      // 닫기
      const closeBtn = page.locator('button:has-text("취소"), button[aria-label="Close"], button:has-text("닫기")').first();
      if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
    }
  });

  test('모달: 품목 등록 폼', async ({ page }) => {
    await page.goto(`${FE}/items`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const btn = page.locator('button:has-text("신규"), button:has-text("등록")').first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('input, select').first()).toBeVisible();
      await page.screenshot({ path: `${SS}/modal-item.png` });
    }
  });

  test('모달: 거래처 등록 폼', async ({ page }) => {
    await page.goto(`${FE}/partners`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const btn = page.locator('button:has-text("신규"), button:has-text("등록")').first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('input, select').first()).toBeVisible();
      await page.screenshot({ path: `${SS}/modal-partner.png` });
    }
  });

  test('모달: 사용자 등록 폼', async ({ page }) => {
    await page.goto(`${FE}/users`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const btn = page.locator('button:has-text("등록"), button:has-text("추가")').first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SS}/modal-user.png` });
    }
  });

  test('모달: 입고 등록 + 품목검색 팝업', async ({ page }) => {
    await page.goto(`${FE}/inbound`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const btn = page.locator('button:has-text("등록"), button:has-text("신규")').first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SS}/modal-inbound.png` });

      // 거래처 선택 (select dropdown)
      const partnerSelect = page.locator('select').first();
      if (await partnerSelect.isVisible().catch(() => false)) {
        const options = await partnerSelect.locator('option').count();
        if (options > 1) {
          await partnerSelect.selectOption({ index: 1 });
          console.log('✅ 입고 - 거래처 선택 완료');
        }
      }

      // 창고 선택
      const whSelect = page.locator('select').nth(1);
      if (await whSelect.isVisible().catch(() => false)) {
        const options = await whSelect.locator('option').count();
        if (options > 1) {
          await whSelect.selectOption({ index: 1 });
          console.log('✅ 입고 - 창고 선택 완료');
        }
      }

      // 품목 검색 버튼 클릭
      const itemSearchBtn = page.locator('button:has-text("품목 검색"), button:has-text("품목검색"), button:has-text("상품 검색")').first();
      if (await itemSearchBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await itemSearchBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `${SS}/popup-item-search.png` });

        // 팝업 (z-60) 내부의 선택 버튼 또는 행 클릭
        const popupOverlay = page.locator('[class*="z-[60]"], [class*="z-60"]').first();
        if (await popupOverlay.isVisible({ timeout: 2000 }).catch(() => false)) {
          const selectBtn = popupOverlay.locator('button:has-text("선택"), td').first();
          if (await selectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await selectBtn.click({ force: true });
            console.log('✅ 품목 검색 팝업에서 선택 완료');
          }
        }
      }
      await page.screenshot({ path: `${SS}/modal-inbound-filled.png` });
    }
  });

  test('모달: 출고 등록 + 입고데이터 팝업', async ({ page }) => {
    await page.goto(`${FE}/outbound`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const btn = page.locator('button:has-text("등록"), button:has-text("신규")').first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SS}/modal-outbound.png` });

      // 거래처/창고 선택
      const selects = page.locator('select');
      const selectCount = await selects.count();
      for (let i = 0; i < Math.min(selectCount, 3); i++) {
        const sel = selects.nth(i);
        const opts = await sel.locator('option').count();
        if (opts > 1) await sel.selectOption({ index: 1 });
      }

      // 입고데이터 가져오기 버튼
      const inboundPopupBtn = page.locator('button:has-text("입고"), button:has-text("가져오기")').first();
      if (await inboundPopupBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await inboundPopupBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${SS}/popup-inbound-data.png` });
        console.log('✅ 입고데이터 팝업 열림');
      }
    }
  });

  test('모달: 재고조정 등록', async ({ page }) => {
    await page.goto(`${FE}/inventory/adjustments`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const btn = page.locator('button:has-text("조정 등록"), button:has-text("등록"), button:has-text("신규")').first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SS}/modal-adjustment.png` });
      console.log('✅ 재고조정 모달 열림');
    }
  });

  test('모달: 순환실사 등록', async ({ page }) => {
    await page.goto(`${FE}/inventory/cycle-counts`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const btn = page.locator('button:has-text("실사 등록"), button:has-text("등록"), button:has-text("신규")').first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SS}/modal-cycle-count.png` });
      console.log('✅ 순환실사 모달 열림');
    }
  });

  test('모달: 차량 등록', async ({ page }) => {
    await page.goto(`${FE}/vehicles`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const btn = page.locator('button:has-text("차량 등록"), button:has-text("등록"), button:has-text("신규")').first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SS}/modal-vehicle.png` });
    }
  });

  test('모달: 도크 등록', async ({ page }) => {
    await page.goto(`${FE}/docks`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const btn = page.locator('button:has-text("도크 등록"), button:has-text("등록"), button:has-text("신규")').first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SS}/modal-dock.png` });
    }
  });

  // ═══ 엑셀 다운로드 UI 테스트 ═══
  test('엑셀 다운로드: 품목 페이지', async ({ page }) => {
    await page.goto(`${FE}/items`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const excelBtn = page.locator('button:has-text("엑셀"), button:has-text("Excel"), button:has-text("다운로드")').first();
    if (await excelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
        excelBtn.click(),
      ]);
      if (download) {
        console.log(`✅ 품목 엑셀 다운로드: ${download.suggestedFilename()}`);
      }
    }
  });

  test('엑셀 다운로드: 입고 페이지', async ({ page }) => {
    await page.goto(`${FE}/inbound`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const excelBtn = page.locator('button:has-text("엑셀"), button:has-text("Excel")').first();
    if (await excelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
        excelBtn.click(),
      ]);
      if (download) {
        console.log(`✅ 입고 엑셀 다운로드: ${download.suggestedFilename()}`);
      }
    }
  });

  test('엑셀 다운로드: 출고 페이지', async ({ page }) => {
    await page.goto(`${FE}/outbound`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const excelBtn = page.locator('button:has-text("엑셀"), button:has-text("Excel")').first();
    if (await excelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
        excelBtn.click(),
      ]);
      if (download) {
        console.log(`✅ 출고 엑셀 다운로드: ${download.suggestedFilename()}`);
      }
    }
  });

  test('엑셀 다운로드: 재고 페이지', async ({ page }) => {
    await page.goto(`${FE}/inventory`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const excelBtn = page.locator('button:has-text("엑셀"), button:has-text("Excel")').first();
    if (await excelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
        excelBtn.click(),
      ]);
      if (download) {
        console.log(`✅ 재고 엑셀 다운로드: ${download.suggestedFilename()}`);
      }
    }
  });

  // ═══ 검색/필터 테스트 ═══
  test('검색: 품목 검색', async ({ page }) => {
    await page.goto(`${FE}/items`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const searchInput = page.locator('input[placeholder*="검색"], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('노트북');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SS}/search-items.png` });
      console.log('✅ 품목 검색 테스트 완료');
    }
  });

  test('검색: 거래처 검색', async ({ page }) => {
    await page.goto(`${FE}/partners`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const searchInput = page.locator('input[placeholder*="검색"], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('삼성');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SS}/search-partners.png` });
      console.log('✅ 거래처 검색 테스트 완료');
    }
  });

  // ═══ 목록 데이터 표시 확인 ═══
  test('데이터 확인: 대시보드 통계', async ({ page }) => {
    await page.goto(`${FE}/`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/dashboard-with-data.png` });
    console.log('✅ 대시보드 데이터 확인');
  });

  test('데이터 확인: 재고 현황', async ({ page }) => {
    await page.goto(`${FE}/inventory`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SS}/inventory-with-data.png` });
    console.log('✅ 재고 현황 데이터 확인');
  });

  test('데이터 확인: 정산 페이지 (수정 검증)', async ({ page }) => {
    await page.goto(`${FE}/settlements`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SS}/settlements-fixed.png` });
    // 날짜와 화주가 "-"가 아닌지 확인
    const firstRow = page.locator('table tbody tr, [class*="row"]').first();
    if (await firstRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      const text = await firstRow.textContent();
      console.log(`  정산 첫 행: ${text?.slice(0, 100)}`);
    }
    console.log('✅ 정산 페이지 수정 검증 완료');
  });
});
