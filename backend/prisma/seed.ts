import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding KCS WMS database...\n');

  // ─── Cleanup (reverse FK order) ──────────────────────────
  console.log('Cleaning existing data...');
  await prisma.$transaction([
    prisma.settlementDetail.deleteMany(),
    prisma.settlement.deleteMany(),
    prisma.inventoryMovementItem.deleteMany(),
    prisma.inventoryMovement.deleteMany(),
    prisma.workOrderItem.deleteMany(),
    prisma.workOrder.deleteMany(),
    prisma.dispatchItem.deleteMany(),
    prisma.dispatch.deleteMany(),
    prisma.channelSyncLog.deleteMany(),
    prisma.channelOrderItem.deleteMany(),
    prisma.channelOrder.deleteMany(),
    prisma.channelProduct.deleteMany(),
    prisma.salesChannel.deleteMany(),
    prisma.cycleCount.deleteMany(),
    prisma.stockAdjustment.deleteMany(),
    prisma.inventoryTransaction.deleteMany(),
    prisma.inventory.deleteMany(),
    prisma.outboundShipment.deleteMany(),
    prisma.outboundOrderItem.deleteMany(),
    prisma.outboundOrder.deleteMany(),
    prisma.inboundReceipt.deleteMany(),
    prisma.inboundOrderItem.deleteMany(),
    prisma.inboundOrder.deleteMany(),
    prisma.uomConversion.deleteMany(),
    prisma.uomMaster.deleteMany(),
    prisma.dock.deleteMany(),
    prisma.vehicle.deleteMany(),
    prisma.partner.deleteMany(),
    prisma.item.deleteMany(),
    prisma.itemGroup.deleteMany(),
    prisma.commonCode.deleteMany(),
    prisma.location.deleteMany(),
    prisma.zone.deleteMany(),
    prisma.warehouse.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  console.log('Cleanup complete.\n');

  // ─── Users ───────────────────────────────────────────────
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const [admin, manager, operator1, viewer, operator2, manager2] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@kcs.com',
        password: hashedPassword,
        name: '관리자',
        role: 'ADMIN',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'manager@kcs.com',
        password: hashedPassword,
        name: '김매니저',
        role: 'MANAGER',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'operator1@kcs.com',
        password: hashedPassword,
        name: '이작업자',
        role: 'OPERATOR',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'viewer@kcs.com',
        password: hashedPassword,
        name: '박뷰어',
        role: 'VIEWER',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'operator2@kcs.com',
        password: hashedPassword,
        name: '최운영',
        role: 'OPERATOR',
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'manager2@kcs.com',
        password: hashedPassword,
        name: '박매니저',
        role: 'MANAGER',
        isActive: true,
      },
    }),
  ]);
  console.log('  Created 6 users.');

  // ─── Warehouses ──────────────────────────────────────────
  console.log('Creating warehouses...');

  const whLA = await prisma.warehouse.create({
    data: {
      code: 'WH-LA',
      name: 'LA물류센터',
      country: 'USA',
      city: 'Los Angeles',
      address: '1234 Commerce Dr, Los Angeles, CA 90001',
      zipCode: '90001',
      timezone: 'America/Los_Angeles',
      status: 'ACTIVE',
      contactName: 'John Smith',
      contactPhone: '+1-310-555-0100',
      contactEmail: 'la-ops@kcs.com',
    },
  });

  const whNJ = await prisma.warehouse.create({
    data: {
      code: 'WH-NJ',
      name: '뉴저지물류센터',
      country: 'USA',
      city: 'Newark',
      address: '567 Port Ave, Newark, NJ 07102',
      zipCode: '07102',
      timezone: 'America/New_York',
      status: 'ACTIVE',
      contactName: 'Mike Johnson',
      contactPhone: '+1-973-555-0200',
      contactEmail: 'nj-ops@kcs.com',
    },
  });

  const whHH = await prisma.warehouse.create({
    data: {
      code: 'WH-HH',
      name: '함부르크물류센터',
      country: 'Germany',
      city: 'Hamburg',
      address: 'Hafenstrasse 45, 20457 Hamburg',
      zipCode: '20457',
      timezone: 'Europe/Berlin',
      status: 'ACTIVE',
      contactName: 'Hans Mueller',
      contactPhone: '+49-40-555-0300',
      contactEmail: 'hh-ops@kcs.com',
    },
  });

  const whTK = await prisma.warehouse.create({
    data: {
      code: 'WH-TK',
      name: '도쿄물류센터',
      country: 'Japan',
      city: 'Tokyo',
      address: '2-3-1 Shibaura, Minato-ku, Tokyo 108-0023',
      zipCode: '108-0023',
      timezone: 'Asia/Tokyo',
      status: 'MAINTENANCE',
      contactName: 'Tanaka Yuki',
      contactPhone: '+81-3-555-0400',
      contactEmail: 'tk-ops@kcs.com',
      notes: '시설 보수 공사 중 (2026-04 완료 예정)',
    },
  });
  console.log('  Created 4 warehouses.');

  // ─── Zones & Locations ───────────────────────────────────
  console.log('Creating zones and locations...');

  interface ZoneDef {
    code: string;
    name: string;
    type: 'RECEIVING' | 'STORAGE' | 'PICKING' | 'SHIPPING';
    locations: { aisle: string; rack: string; level: string; bin: string }[];
  }

  async function createZonesAndLocations(
    warehouseId: string,
    zoneDefs: ZoneDef[],
  ) {
    const createdZones: Record<string, string> = {};
    const createdLocations: Record<string, string> = {};

    for (const zd of zoneDefs) {
      const zone = await prisma.zone.create({
        data: {
          warehouseId,
          code: zd.code,
          name: zd.name,
          type: zd.type,
        },
      });
      createdZones[zd.code] = zone.id;

      for (const loc of zd.locations) {
        const locCode = `${loc.aisle}-${loc.rack}-${loc.level}-${loc.bin}`;
        const location = await prisma.location.create({
          data: {
            zoneId: zone.id,
            code: locCode,
            aisle: loc.aisle,
            rack: loc.rack,
            level: loc.level,
            bin: loc.bin,
            status: 'AVAILABLE',
            maxWeight: 500,
            maxVolume: 10,
          },
        });
        createdLocations[locCode] = location.id;
      }
    }
    return { zones: createdZones, locations: createdLocations };
  }

  // WH-LA zones
  const laResult = await createZonesAndLocations(whLA.id, [
    {
      code: 'RCV-01',
      name: '입고구역',
      type: 'RECEIVING',
      locations: [
        { aisle: 'A', rack: '01', level: '01', bin: '01' },
        { aisle: 'A', rack: '01', level: '01', bin: '02' },
        { aisle: 'A', rack: '01', level: '01', bin: '03' },
      ],
    },
    {
      code: 'STR-01',
      name: '보관구역A',
      type: 'STORAGE',
      locations: [
        { aisle: 'B', rack: '01', level: '01', bin: '01' },
        { aisle: 'B', rack: '01', level: '02', bin: '01' },
        { aisle: 'B', rack: '02', level: '01', bin: '01' },
        { aisle: 'B', rack: '02', level: '02', bin: '01' },
      ],
    },
    {
      code: 'STR-02',
      name: '보관구역B',
      type: 'STORAGE',
      locations: [
        { aisle: 'C', rack: '01', level: '01', bin: '01' },
        { aisle: 'C', rack: '01', level: '02', bin: '01' },
        { aisle: 'C', rack: '02', level: '01', bin: '01' },
      ],
    },
    {
      code: 'PCK-01',
      name: '피킹구역',
      type: 'PICKING',
      locations: [
        { aisle: 'D', rack: '01', level: '01', bin: '01' },
        { aisle: 'D', rack: '01', level: '01', bin: '02' },
        { aisle: 'D', rack: '01', level: '01', bin: '03' },
      ],
    },
    {
      code: 'SHP-01',
      name: '출하구역',
      type: 'SHIPPING',
      locations: [
        { aisle: 'E', rack: '01', level: '01', bin: '01' },
        { aisle: 'E', rack: '01', level: '01', bin: '02' },
        { aisle: 'E', rack: '01', level: '01', bin: '03' },
      ],
    },
  ]);

  // WH-NJ zones
  const njResult = await createZonesAndLocations(whNJ.id, [
    {
      code: 'RCV-01',
      name: '입고구역',
      type: 'RECEIVING',
      locations: [
        { aisle: 'A', rack: '01', level: '01', bin: '01' },
        { aisle: 'A', rack: '01', level: '01', bin: '02' },
        { aisle: 'A', rack: '01', level: '01', bin: '03' },
      ],
    },
    {
      code: 'STR-01',
      name: '보관구역',
      type: 'STORAGE',
      locations: [
        { aisle: 'B', rack: '01', level: '01', bin: '01' },
        { aisle: 'B', rack: '01', level: '02', bin: '01' },
        { aisle: 'B', rack: '02', level: '01', bin: '01' },
        { aisle: 'B', rack: '02', level: '02', bin: '01' },
      ],
    },
    {
      code: 'PCK-01',
      name: '피킹구역',
      type: 'PICKING',
      locations: [
        { aisle: 'C', rack: '01', level: '01', bin: '01' },
        { aisle: 'C', rack: '01', level: '01', bin: '02' },
        { aisle: 'C', rack: '01', level: '01', bin: '03' },
      ],
    },
    {
      code: 'SHP-01',
      name: '출하구역',
      type: 'SHIPPING',
      locations: [
        { aisle: 'D', rack: '01', level: '01', bin: '01' },
        { aisle: 'D', rack: '01', level: '01', bin: '02' },
        { aisle: 'D', rack: '01', level: '01', bin: '03' },
      ],
    },
  ]);

  // WH-HH zones
  const hhResult = await createZonesAndLocations(whHH.id, [
    {
      code: 'RCV-01',
      name: '입고구역',
      type: 'RECEIVING',
      locations: [
        { aisle: 'A', rack: '01', level: '01', bin: '01' },
        { aisle: 'A', rack: '01', level: '01', bin: '02' },
        { aisle: 'A', rack: '01', level: '01', bin: '03' },
      ],
    },
    {
      code: 'STR-01',
      name: '보관구역A',
      type: 'STORAGE',
      locations: [
        { aisle: 'B', rack: '01', level: '01', bin: '01' },
        { aisle: 'B', rack: '01', level: '02', bin: '01' },
        { aisle: 'B', rack: '02', level: '01', bin: '01' },
        { aisle: 'B', rack: '02', level: '02', bin: '01' },
      ],
    },
    {
      code: 'STR-02',
      name: '보관구역B',
      type: 'STORAGE',
      locations: [
        { aisle: 'C', rack: '01', level: '01', bin: '01' },
        { aisle: 'C', rack: '01', level: '02', bin: '01' },
        { aisle: 'C', rack: '02', level: '01', bin: '01' },
      ],
    },
    {
      code: 'PCK-01',
      name: '피킹구역',
      type: 'PICKING',
      locations: [
        { aisle: 'D', rack: '01', level: '01', bin: '01' },
        { aisle: 'D', rack: '01', level: '01', bin: '02' },
        { aisle: 'D', rack: '01', level: '01', bin: '03' },
      ],
    },
    {
      code: 'SHP-01',
      name: '출하구역',
      type: 'SHIPPING',
      locations: [
        { aisle: 'E', rack: '01', level: '01', bin: '01' },
        { aisle: 'E', rack: '01', level: '01', bin: '02' },
        { aisle: 'E', rack: '01', level: '01', bin: '03' },
      ],
    },
  ]);

  // WH-TK zones
  const tkResult = await createZonesAndLocations(whTK.id, [
    {
      code: 'RCV-01',
      name: '입고구역',
      type: 'RECEIVING',
      locations: [
        { aisle: 'A', rack: '01', level: '01', bin: '01' },
        { aisle: 'A', rack: '01', level: '01', bin: '02' },
      ],
    },
    {
      code: 'STR-01',
      name: '보관구역',
      type: 'STORAGE',
      locations: [
        { aisle: 'B', rack: '01', level: '01', bin: '01' },
        { aisle: 'B', rack: '01', level: '02', bin: '01' },
        { aisle: 'B', rack: '02', level: '01', bin: '01' },
      ],
    },
    {
      code: 'PCK-01',
      name: '피킹구역',
      type: 'PICKING',
      locations: [
        { aisle: 'C', rack: '01', level: '01', bin: '01' },
        { aisle: 'C', rack: '01', level: '01', bin: '02' },
      ],
    },
  ]);

  console.log('  Created zones and locations for all warehouses.');

  // ─── Items ───────────────────────────────────────────────
  console.log('Creating items...');

  const itemsData = [
    // Electronics
    { code: 'ELEC-001', name: '노트북', description: '15.6인치 비즈니스 노트북', barcode: '8801234560001', category: 'ELECTRONICS' as const, uom: 'EA' as const, weight: 2.1, length: 36, width: 25, height: 2.5, minStock: 10, maxStock: 200 },
    { code: 'ELEC-002', name: '태블릿', description: '10.5인치 태블릿 PC', barcode: '8801234560002', category: 'ELECTRONICS' as const, uom: 'EA' as const, weight: 0.5, length: 25, width: 17, height: 0.7, minStock: 20, maxStock: 300 },
    { code: 'ELEC-003', name: '스마트폰', description: '최신형 스마트폰', barcode: '8801234560003', category: 'ELECTRONICS' as const, uom: 'EA' as const, weight: 0.2, length: 16, width: 7.5, height: 0.8, minStock: 50, maxStock: 500 },
    { code: 'ELEC-004', name: '이어폰', description: '무선 블루투스 이어폰', barcode: '8801234560004', category: 'ELECTRONICS' as const, uom: 'EA' as const, weight: 0.05, length: 8, width: 8, height: 3, minStock: 100, maxStock: 1000 },
    { code: 'ELEC-005', name: '충전기', description: '고속 충전기 65W', barcode: '8801234560005', category: 'ELECTRONICS' as const, uom: 'EA' as const, weight: 0.15, length: 6, width: 6, height: 3, minStock: 100, maxStock: 800 },
    // Clothing
    { code: 'CLTH-001', name: '티셔츠', description: '면 100% 라운드 티셔츠', barcode: '8801234560006', category: 'CLOTHING' as const, uom: 'EA' as const, weight: 0.2, length: 30, width: 25, height: 3, minStock: 50, maxStock: 500 },
    { code: 'CLTH-002', name: '자켓', description: '방수 바람막이 자켓', barcode: '8801234560007', category: 'CLOTHING' as const, uom: 'EA' as const, weight: 0.6, length: 40, width: 30, height: 5, minStock: 30, maxStock: 300 },
    { code: 'CLTH-003', name: '청바지', description: '슬림핏 데님 청바지', barcode: '8801234560008', category: 'CLOTHING' as const, uom: 'EA' as const, weight: 0.7, length: 35, width: 30, height: 5, minStock: 30, maxStock: 300 },
    { code: 'CLTH-004', name: '운동화', description: '런닝 운동화', barcode: '8801234560009', category: 'CLOTHING' as const, uom: 'EA' as const, weight: 0.8, length: 32, width: 20, height: 12, minStock: 20, maxStock: 200 },
    { code: 'CLTH-005', name: '모자', description: '캐주얼 볼캡 모자', barcode: '8801234560010', category: 'CLOTHING' as const, uom: 'EA' as const, weight: 0.1, length: 20, width: 15, height: 10, minStock: 50, maxStock: 400 },
    // General
    { code: 'GENR-001', name: 'USB케이블', description: 'USB-C 고속 충전 케이블 1m', barcode: '8801234560011', category: 'GENERAL' as const, uom: 'EA' as const, weight: 0.03, length: 15, width: 5, height: 2, minStock: 200, maxStock: 2000 },
    { code: 'GENR-002', name: '보조배터리', description: '20000mAh 보조배터리', barcode: '8801234560012', category: 'GENERAL' as const, uom: 'EA' as const, weight: 0.35, length: 14, width: 7, height: 2.5, minStock: 50, maxStock: 500 },
    { code: 'GENR-003', name: '마우스', description: '무선 인체공학 마우스', barcode: '8801234560013', category: 'GENERAL' as const, uom: 'EA' as const, weight: 0.1, length: 12, width: 7, height: 4, minStock: 50, maxStock: 400 },
    { code: 'GENR-004', name: '키보드', description: '기계식 무선 키보드', barcode: '8801234560014', category: 'GENERAL' as const, uom: 'EA' as const, weight: 0.8, length: 44, width: 14, height: 4, minStock: 30, maxStock: 300 },
    { code: 'GENR-005', name: '모니터', description: '27인치 4K UHD 모니터', barcode: '8801234560015', category: 'GENERAL' as const, uom: 'EA' as const, weight: 5.5, length: 62, width: 20, height: 45, minStock: 5, maxStock: 100 },
    // Food
    { code: 'FOOD-001', name: '라면박스', description: '신라면 40개입 박스', barcode: '8801234560016', category: 'FOOD' as const, uom: 'BOX' as const, weight: 4.8, length: 40, width: 30, height: 25, minStock: 30, maxStock: 500 },
    { code: 'FOOD-002', name: '김세트', description: '프리미엄 조미김 선물세트', barcode: '8801234560017', category: 'FOOD' as const, uom: 'BOX' as const, weight: 1.2, length: 30, width: 20, height: 10, minStock: 50, maxStock: 600 },
    { code: 'FOOD-003', name: '고추장', description: '태양초 고추장 1kg', barcode: '8801234560018', category: 'FOOD' as const, uom: 'EA' as const, weight: 1.1, length: 12, width: 12, height: 15, minStock: 40, maxStock: 400 },
    { code: 'FOOD-004', name: '참기름', description: '순수 참기름 500ml', barcode: '8801234560019', category: 'FOOD' as const, uom: 'EA' as const, weight: 0.55, length: 7, width: 7, height: 20, minStock: 40, maxStock: 400 },
    { code: 'FOOD-005', name: '김치', description: '전통 포기김치 5kg', barcode: '8801234560020', category: 'FOOD' as const, uom: 'EA' as const, weight: 5.2, length: 30, width: 20, height: 15, minStock: 20, maxStock: 200 },
  ];

  const items: Record<string, { id: string; code: string }> = {};
  for (const data of itemsData) {
    const item = await prisma.item.create({ data });
    items[data.code] = { id: item.id, code: item.code };
  }
  console.log(`  Created ${itemsData.length} items.`);

  // ─── Partners ────────────────────────────────────────────
  console.log('Creating partners...');

  const partnersData = [
    { code: 'SUP-SAMSUNG', name: '삼성전자', type: 'SUPPLIER' as const, contactName: '이수진', contactPhone: '+82-2-2255-0100', contactEmail: 'supply@samsung-sample.com', country: 'Korea', city: 'Seoul', address: '서울시 서초구 서초대로 74길 11' },
    { code: 'SUP-LG', name: 'LG전자', type: 'SUPPLIER' as const, contactName: '박정호', contactPhone: '+82-2-3777-0200', contactEmail: 'supply@lg-sample.com', country: 'Korea', city: 'Seoul', address: '서울시 영등포구 여의대로 128' },
    { code: 'SUP-KFOOD', name: '한국식품', type: 'SUPPLIER' as const, contactName: '최민수', contactPhone: '+82-2-1234-5678', contactEmail: 'export@kfood-sample.com', country: 'Korea', city: 'Busan', address: '부산시 해운대구 센텀중앙로 48' },
    { code: 'CUS-AMAZON', name: 'Amazon US', type: 'CUSTOMER' as const, contactName: 'Sarah Williams', contactPhone: '+1-206-555-0100', contactEmail: 'vendor@amazon-sample.com', country: 'USA', city: 'Seattle', address: '410 Terry Ave N, Seattle, WA 98109' },
    { code: 'CUS-WALMART', name: 'Walmart', type: 'CUSTOMER' as const, contactName: 'James Brown', contactPhone: '+1-479-555-0200', contactEmail: 'supply@walmart-sample.com', country: 'USA', city: 'Bentonville', address: '702 SW 8th St, Bentonville, AR 72716' },
    { code: 'CUS-MEDIAMARKT', name: 'MediaMarkt', type: 'CUSTOMER' as const, contactName: 'Klaus Weber', contactPhone: '+49-841-555-0300', contactEmail: 'einkauf@mediamarkt-sample.com', country: 'Germany', city: 'Ingolstadt', address: 'Wankelstrasse 5, 85046 Ingolstadt' },
    { code: 'CAR-FEDEX', name: 'FedEx', type: 'CARRIER' as const, contactName: 'Tom Davis', contactPhone: '+1-800-463-3339', contactEmail: 'ops@fedex-sample.com', country: 'USA', city: 'Memphis', address: '942 S Shady Grove Rd, Memphis, TN 38120' },
    { code: 'CAR-DHL', name: 'DHL', type: 'CARRIER' as const, contactName: 'Anna Schmidt', contactPhone: '+49-228-555-0400', contactEmail: 'ops@dhl-sample.com', country: 'Germany', city: 'Bonn', address: 'Charles-de-Gaulle-Strasse 20, 53113 Bonn' },
  ];

  const partners: Record<string, { id: string; code: string }> = {};
  for (const data of partnersData) {
    const partner = await prisma.partner.create({ data });
    partners[data.code] = { id: partner.id, code: partner.code };
  }
  console.log(`  Created ${partnersData.length} partners.`);

  // ─── Inbound Orders ──────────────────────────────────────
  console.log('Creating inbound orders...');

  // IB-001: COMPLETED - Samsung electronics to LA
  const ib001 = await prisma.inboundOrder.create({
    data: {
      orderNumber: 'IB-2026-001',
      partnerId: partners['SUP-SAMSUNG'].id,
      warehouseId: whLA.id,
      expectedDate: new Date('2026-02-10'),
      arrivedDate: new Date('2026-02-12'),
      completedDate: new Date('2026-02-13'),
      status: 'COMPLETED',
      notes: '삼성전자 1차 입고 (전자제품)',
      items: {
        create: [
          { itemId: items['ELEC-001'].id, expectedQty: 50, receivedQty: 48, damagedQty: 2 },
          { itemId: items['ELEC-003'].id, expectedQty: 100, receivedQty: 100 },
          { itemId: items['ELEC-004'].id, expectedQty: 200, receivedQty: 200 },
        ],
      },
      receipts: {
        create: [
          { receivedBy: operator1.name, receivedDate: new Date('2026-02-13'), lotNo: 'LOT-LA-2026-001', locationCode: 'B-01-01-01', notes: '노트북 2개 파손 확인' },
          { receivedBy: operator1.name, receivedDate: new Date('2026-02-13'), lotNo: 'LOT-LA-2026-002', locationCode: 'B-01-02-01' },
        ],
      },
    },
  });

  // IB-002: COMPLETED - Korean food to NJ
  const ib002 = await prisma.inboundOrder.create({
    data: {
      orderNumber: 'IB-2026-002',
      partnerId: partners['SUP-KFOOD'].id,
      warehouseId: whNJ.id,
      expectedDate: new Date('2026-02-15'),
      arrivedDate: new Date('2026-02-16'),
      completedDate: new Date('2026-02-17'),
      status: 'COMPLETED',
      notes: '한국식품 수출 입고 (식품류)',
      items: {
        create: [
          { itemId: items['FOOD-001'].id, expectedQty: 100, receivedQty: 100 },
          { itemId: items['FOOD-002'].id, expectedQty: 150, receivedQty: 148, damagedQty: 2 },
          { itemId: items['FOOD-003'].id, expectedQty: 80, receivedQty: 80 },
          { itemId: items['FOOD-004'].id, expectedQty: 60, receivedQty: 60 },
        ],
      },
      receipts: {
        create: [
          { receivedBy: operator1.name, receivedDate: new Date('2026-02-17'), lotNo: 'LOT-NJ-2026-001', locationCode: 'B-01-01-01' },
        ],
      },
    },
  });

  // IB-003: ARRIVED - LG electronics to Hamburg
  const ib003 = await prisma.inboundOrder.create({
    data: {
      orderNumber: 'IB-2026-003',
      partnerId: partners['SUP-LG'].id,
      warehouseId: whHH.id,
      expectedDate: new Date('2026-03-15'),
      arrivedDate: new Date('2026-03-18'),
      status: 'ARRIVED',
      notes: 'LG전자 유럽 입고건',
      items: {
        create: [
          { itemId: items['GENR-005'].id, expectedQty: 30 },
          { itemId: items['GENR-003'].id, expectedQty: 100 },
          { itemId: items['GENR-004'].id, expectedQty: 80 },
        ],
      },
    },
  });

  // IB-004: CONFIRMED - Clothing to LA
  await prisma.inboundOrder.create({
    data: {
      orderNumber: 'IB-2026-004',
      partnerId: partners['SUP-SAMSUNG'].id,
      warehouseId: whLA.id,
      expectedDate: new Date('2026-03-25'),
      status: 'CONFIRMED',
      notes: '의류 입고 예정',
      items: {
        create: [
          { itemId: items['CLTH-001'].id, expectedQty: 200 },
          { itemId: items['CLTH-002'].id, expectedQty: 100 },
        ],
      },
    },
  });

  // IB-005: DRAFT - Mixed items to NJ
  await prisma.inboundOrder.create({
    data: {
      orderNumber: 'IB-2026-005',
      partnerId: partners['SUP-LG'].id,
      warehouseId: whNJ.id,
      expectedDate: new Date('2026-04-01'),
      status: 'DRAFT',
      notes: 'LG전자 2분기 입고 계획',
      items: {
        create: [
          { itemId: items['ELEC-002'].id, expectedQty: 150 },
          { itemId: items['ELEC-005'].id, expectedQty: 300 },
          { itemId: items['GENR-001'].id, expectedQty: 500 },
          { itemId: items['GENR-002'].id, expectedQty: 200 },
        ],
      },
    },
  });

  // IB-006: CANCELLED
  await prisma.inboundOrder.create({
    data: {
      orderNumber: 'IB-2026-006',
      partnerId: partners['SUP-KFOOD'].id,
      warehouseId: whHH.id,
      expectedDate: new Date('2026-03-01'),
      status: 'CANCELLED',
      notes: '취소 - 공급업체 사정으로 선적 취소',
      items: {
        create: [
          { itemId: items['FOOD-005'].id, expectedQty: 50 },
          { itemId: items['FOOD-001'].id, expectedQty: 80 },
        ],
      },
    },
  });

  console.log('  Created 6 inbound orders.');

  // ─── Outbound Orders ─────────────────────────────────────
  console.log('Creating outbound orders...');

  // OB-001: DELIVERED - Amazon order from LA
  const ob001 = await prisma.outboundOrder.create({
    data: {
      orderNumber: 'OB-2026-001',
      partnerId: partners['CUS-AMAZON'].id,
      warehouseId: whLA.id,
      shipDate: new Date('2026-02-20'),
      deliveryDate: new Date('2026-02-23'),
      completedDate: new Date('2026-02-23'),
      status: 'DELIVERED',
      shippingMethod: 'Ground',
      trackingNumber: 'FX-9876543210',
      notes: 'Amazon FBA 납품',
      items: {
        create: [
          { itemId: items['ELEC-003'].id, orderedQty: 30, pickedQty: 30, packedQty: 30, shippedQty: 30 },
          { itemId: items['ELEC-004'].id, orderedQty: 50, pickedQty: 50, packedQty: 50, shippedQty: 50 },
        ],
      },
      shipments: {
        create: [
          {
            shippedBy: operator1.name,
            shippedDate: new Date('2026-02-20'),
            carrier: 'FedEx',
            trackingNumber: 'FX-9876543210',
            weight: 12.5,
            notes: '정상 출하 완료',
          },
        ],
      },
    },
  });

  // OB-002: SHIPPED - Walmart order from NJ
  const ob002 = await prisma.outboundOrder.create({
    data: {
      orderNumber: 'OB-2026-002',
      partnerId: partners['CUS-WALMART'].id,
      warehouseId: whNJ.id,
      shipDate: new Date('2026-03-15'),
      status: 'SHIPPED',
      shippingMethod: 'Express',
      trackingNumber: 'FX-1234567890',
      notes: 'Walmart 식품 주문',
      items: {
        create: [
          { itemId: items['FOOD-001'].id, orderedQty: 40, pickedQty: 40, packedQty: 40, shippedQty: 40 },
          { itemId: items['FOOD-002'].id, orderedQty: 60, pickedQty: 60, packedQty: 60, shippedQty: 60 },
          { itemId: items['FOOD-003'].id, orderedQty: 30, pickedQty: 30, packedQty: 30, shippedQty: 30 },
        ],
      },
      shipments: {
        create: [
          {
            shippedBy: operator1.name,
            shippedDate: new Date('2026-03-15'),
            carrier: 'FedEx',
            trackingNumber: 'FX-1234567890',
            weight: 285.0,
            notes: '식품 - 상온 배송',
          },
        ],
      },
    },
  });

  // OB-003: PICKING - MediaMarkt order from Hamburg
  await prisma.outboundOrder.create({
    data: {
      orderNumber: 'OB-2026-003',
      partnerId: partners['CUS-MEDIAMARKT'].id,
      warehouseId: whHH.id,
      status: 'PICKING',
      notes: 'MediaMarkt 전자제품 주문 - 피킹 진행 중',
      items: {
        create: [
          { itemId: items['ELEC-001'].id, orderedQty: 20, pickedQty: 12 },
          { itemId: items['GENR-003'].id, orderedQty: 40, pickedQty: 25 },
          { itemId: items['GENR-004'].id, orderedQty: 30, pickedQty: 10 },
        ],
      },
    },
  });

  // OB-004: CONFIRMED - Amazon order from LA
  await prisma.outboundOrder.create({
    data: {
      orderNumber: 'OB-2026-004',
      partnerId: partners['CUS-AMAZON'].id,
      warehouseId: whLA.id,
      status: 'CONFIRMED',
      notes: 'Amazon 2차 주문 확정',
      items: {
        create: [
          { itemId: items['CLTH-001'].id, orderedQty: 80 },
          { itemId: items['CLTH-004'].id, orderedQty: 40 },
        ],
      },
    },
  });

  // OB-005: DRAFT - Walmart order
  await prisma.outboundOrder.create({
    data: {
      orderNumber: 'OB-2026-005',
      partnerId: partners['CUS-WALMART'].id,
      warehouseId: whNJ.id,
      status: 'DRAFT',
      notes: 'Walmart 추가 주문 검토 중',
      items: {
        create: [
          { itemId: items['FOOD-004'].id, orderedQty: 50 },
          { itemId: items['FOOD-005'].id, orderedQty: 30 },
        ],
      },
    },
  });

  // OB-006: PACKING - Amazon accessories from LA (all picked, ready to ship)
  await prisma.outboundOrder.create({
    data: {
      orderNumber: 'OB-2026-006',
      partnerId: partners['CUS-AMAZON'].id,
      warehouseId: whLA.id,
      status: 'PACKING',
      notes: 'Amazon 악세서리 주문 - 패킹 대기중',
      items: {
        create: [
          { itemId: items['ELEC-005'].id, orderedQty: 30, pickedQty: 30, packedQty: 0 },
          { itemId: items['GENR-001'].id, orderedQty: 100, pickedQty: 100, packedQty: 0 },
        ],
      },
    },
  });

  // OB-007: CANCELLED - Walmart cancelled order
  await prisma.outboundOrder.create({
    data: {
      orderNumber: 'OB-2026-007',
      partnerId: partners['CUS-WALMART'].id,
      warehouseId: whNJ.id,
      status: 'CANCELLED',
      notes: '취소 - 고객 요청으로 주문 취소',
      items: {
        create: [
          { itemId: items['FOOD-002'].id, orderedQty: 40 },
          { itemId: items['FOOD-005'].id, orderedQty: 20 },
        ],
      },
    },
  });

  console.log('  Created 7 outbound orders.');

  // ─── Inventory ───────────────────────────────────────────
  console.log('Creating inventory records...');

  const inventoryData = [
    // WH-LA: from completed IB-001 + initial stock
    { itemId: items['ELEC-001'].id, warehouseId: whLA.id, locationId: laResult.locations['B-01-01-01'], lotNo: 'LOT-LA-2026-001', quantity: 18, reservedQty: 0, availableQty: 18 },
    { itemId: items['ELEC-003'].id, warehouseId: whLA.id, locationId: laResult.locations['B-01-02-01'], lotNo: 'LOT-LA-2026-002', quantity: 70, reservedQty: 0, availableQty: 70 },
    { itemId: items['ELEC-004'].id, warehouseId: whLA.id, locationId: laResult.locations['B-02-01-01'], lotNo: 'LOT-LA-2026-002', quantity: 150, reservedQty: 0, availableQty: 150 },
    { itemId: items['ELEC-005'].id, warehouseId: whLA.id, locationId: laResult.locations['C-01-01-01'], lotNo: 'LOT-LA-2025-010', quantity: 120, reservedQty: 0, availableQty: 120 },
    { itemId: items['CLTH-001'].id, warehouseId: whLA.id, locationId: laResult.locations['C-01-02-01'], lotNo: 'LOT-LA-2025-011', quantity: 180, reservedQty: 80, availableQty: 100 },
    { itemId: items['CLTH-004'].id, warehouseId: whLA.id, locationId: laResult.locations['C-02-01-01'], lotNo: 'LOT-LA-2025-012', quantity: 60, reservedQty: 40, availableQty: 20 },
    // WH-NJ: from completed IB-002 + initial stock
    { itemId: items['FOOD-001'].id, warehouseId: whNJ.id, locationId: njResult.locations['B-01-01-01'], lotNo: 'LOT-NJ-2026-001', quantity: 60, reservedQty: 0, availableQty: 60 },
    { itemId: items['FOOD-002'].id, warehouseId: whNJ.id, locationId: njResult.locations['B-01-02-01'], lotNo: 'LOT-NJ-2026-001', quantity: 88, reservedQty: 0, availableQty: 88 },
    { itemId: items['FOOD-003'].id, warehouseId: whNJ.id, locationId: njResult.locations['B-02-01-01'], lotNo: 'LOT-NJ-2026-001', quantity: 50, reservedQty: 0, availableQty: 50 },
    { itemId: items['FOOD-004'].id, warehouseId: whNJ.id, locationId: njResult.locations['B-02-02-01'], lotNo: 'LOT-NJ-2026-001', quantity: 60, reservedQty: 50, availableQty: 10 },
    { itemId: items['FOOD-005'].id, warehouseId: whNJ.id, locationId: njResult.locations['B-01-01-01'], lotNo: 'LOT-NJ-2025-005', quantity: 35, reservedQty: 30, availableQty: 5 },
    { itemId: items['GENR-001'].id, warehouseId: whNJ.id, locationId: njResult.locations['B-02-01-01'], lotNo: 'LOT-NJ-2025-006', quantity: 400, reservedQty: 0, availableQty: 400 },
    // WH-HH: initial stock (pre-existing)
    { itemId: items['ELEC-001'].id, warehouseId: whHH.id, locationId: hhResult.locations['B-01-01-01'], lotNo: 'LOT-HH-2025-001', quantity: 25, reservedQty: 20, availableQty: 5 },
    { itemId: items['GENR-003'].id, warehouseId: whHH.id, locationId: hhResult.locations['B-01-02-01'], lotNo: 'LOT-HH-2025-002', quantity: 60, reservedQty: 40, availableQty: 20 },
    { itemId: items['GENR-004'].id, warehouseId: whHH.id, locationId: hhResult.locations['B-02-01-01'], lotNo: 'LOT-HH-2025-003', quantity: 45, reservedQty: 30, availableQty: 15 },
    { itemId: items['GENR-005'].id, warehouseId: whHH.id, locationId: hhResult.locations['B-02-02-01'], lotNo: 'LOT-HH-2025-004', quantity: 15, reservedQty: 0, availableQty: 15 },
    // WH-TK: minimal stock (under maintenance)
    { itemId: items['ELEC-002'].id, warehouseId: whTK.id, locationId: tkResult.locations['B-01-01-01'], lotNo: 'LOT-TK-2025-001', quantity: 30, reservedQty: 0, availableQty: 30 },
    { itemId: items['GENR-002'].id, warehouseId: whTK.id, locationId: tkResult.locations['B-01-02-01'], lotNo: 'LOT-TK-2025-002', quantity: 80, reservedQty: 0, availableQty: 80 },
  ];

  for (const data of inventoryData) {
    await prisma.inventory.create({ data });
  }
  console.log(`  Created ${inventoryData.length} inventory records.`);

  // ─── Inventory Transactions ──────────────────────────────
  console.log('Creating inventory transactions...');

  const txData = [
    // Inbound from IB-001 (LA)
    { itemId: items['ELEC-001'].id, warehouseId: whLA.id, locationCode: 'B-01-01-01', lotNo: 'LOT-LA-2026-001', txType: 'INBOUND' as const, quantity: 48, referenceType: 'INBOUND_ORDER', referenceId: ib001.id, performedBy: operator1.name, createdAt: new Date('2026-02-13') },
    { itemId: items['ELEC-003'].id, warehouseId: whLA.id, locationCode: 'B-01-02-01', lotNo: 'LOT-LA-2026-002', txType: 'INBOUND' as const, quantity: 100, referenceType: 'INBOUND_ORDER', referenceId: ib001.id, performedBy: operator1.name, createdAt: new Date('2026-02-13') },
    { itemId: items['ELEC-004'].id, warehouseId: whLA.id, locationCode: 'B-02-01-01', lotNo: 'LOT-LA-2026-002', txType: 'INBOUND' as const, quantity: 200, referenceType: 'INBOUND_ORDER', referenceId: ib001.id, performedBy: operator1.name, createdAt: new Date('2026-02-13') },
    // Outbound from OB-001 (LA)
    { itemId: items['ELEC-003'].id, warehouseId: whLA.id, locationCode: 'B-01-02-01', lotNo: 'LOT-LA-2026-002', txType: 'OUTBOUND' as const, quantity: -30, referenceType: 'OUTBOUND_ORDER', referenceId: ob001.id, performedBy: operator1.name, createdAt: new Date('2026-02-20') },
    { itemId: items['ELEC-004'].id, warehouseId: whLA.id, locationCode: 'B-02-01-01', lotNo: 'LOT-LA-2026-002', txType: 'OUTBOUND' as const, quantity: -50, referenceType: 'OUTBOUND_ORDER', referenceId: ob001.id, performedBy: operator1.name, createdAt: new Date('2026-02-20') },
    // Inbound from IB-002 (NJ)
    { itemId: items['FOOD-001'].id, warehouseId: whNJ.id, locationCode: 'B-01-01-01', lotNo: 'LOT-NJ-2026-001', txType: 'INBOUND' as const, quantity: 100, referenceType: 'INBOUND_ORDER', referenceId: ib002.id, performedBy: operator1.name, createdAt: new Date('2026-02-17') },
    { itemId: items['FOOD-002'].id, warehouseId: whNJ.id, locationCode: 'B-01-02-01', lotNo: 'LOT-NJ-2026-001', txType: 'INBOUND' as const, quantity: 148, referenceType: 'INBOUND_ORDER', referenceId: ib002.id, performedBy: operator1.name, createdAt: new Date('2026-02-17') },
    { itemId: items['FOOD-003'].id, warehouseId: whNJ.id, locationCode: 'B-02-01-01', lotNo: 'LOT-NJ-2026-001', txType: 'INBOUND' as const, quantity: 80, referenceType: 'INBOUND_ORDER', referenceId: ib002.id, performedBy: operator1.name, createdAt: new Date('2026-02-17') },
    { itemId: items['FOOD-004'].id, warehouseId: whNJ.id, locationCode: 'B-02-02-01', lotNo: 'LOT-NJ-2026-001', txType: 'INBOUND' as const, quantity: 60, referenceType: 'INBOUND_ORDER', referenceId: ib002.id, performedBy: operator1.name, createdAt: new Date('2026-02-17') },
    // Outbound from OB-002 (NJ)
    { itemId: items['FOOD-001'].id, warehouseId: whNJ.id, locationCode: 'B-01-01-01', lotNo: 'LOT-NJ-2026-001', txType: 'OUTBOUND' as const, quantity: -40, referenceType: 'OUTBOUND_ORDER', referenceId: ob002.id, performedBy: operator1.name, createdAt: new Date('2026-03-15') },
    { itemId: items['FOOD-002'].id, warehouseId: whNJ.id, locationCode: 'B-01-02-01', lotNo: 'LOT-NJ-2026-001', txType: 'OUTBOUND' as const, quantity: -60, referenceType: 'OUTBOUND_ORDER', referenceId: ob002.id, performedBy: operator1.name, createdAt: new Date('2026-03-15') },
    { itemId: items['FOOD-003'].id, warehouseId: whNJ.id, locationCode: 'B-02-01-01', lotNo: 'LOT-NJ-2026-001', txType: 'OUTBOUND' as const, quantity: -30, referenceType: 'OUTBOUND_ORDER', referenceId: ob002.id, performedBy: operator1.name, createdAt: new Date('2026-03-15') },
    // Damage adjustment (LA - ELEC-001 from IB-001)
    { itemId: items['ELEC-001'].id, warehouseId: whLA.id, locationCode: 'B-01-01-01', lotNo: 'LOT-LA-2026-001', txType: 'ADJUSTMENT_OUT' as const, quantity: -2, referenceType: 'STOCK_ADJUSTMENT', notes: '입고 시 파손 처리 (노트북 2개)', performedBy: manager.name, createdAt: new Date('2026-02-14') },
    // Correction adjustment (NJ - FOOD-002 from IB-002)
    { itemId: items['FOOD-002'].id, warehouseId: whNJ.id, locationCode: 'B-01-02-01', lotNo: 'LOT-NJ-2026-001', txType: 'ADJUSTMENT_OUT' as const, quantity: -2, referenceType: 'STOCK_ADJUSTMENT', notes: '입고 시 파손 처리 (김세트 2개)', performedBy: manager.name, createdAt: new Date('2026-02-18') },
    // Initial stock transactions
    { itemId: items['ELEC-005'].id, warehouseId: whLA.id, locationCode: 'C-01-01-01', lotNo: 'LOT-LA-2025-010', txType: 'INBOUND' as const, quantity: 120, referenceType: 'INITIAL_STOCK', performedBy: manager.name, createdAt: new Date('2025-12-15') },
    { itemId: items['CLTH-001'].id, warehouseId: whLA.id, locationCode: 'C-01-02-01', lotNo: 'LOT-LA-2025-011', txType: 'INBOUND' as const, quantity: 180, referenceType: 'INITIAL_STOCK', performedBy: manager.name, createdAt: new Date('2025-12-20') },
    { itemId: items['CLTH-004'].id, warehouseId: whLA.id, locationCode: 'C-02-01-01', lotNo: 'LOT-LA-2025-012', txType: 'INBOUND' as const, quantity: 60, referenceType: 'INITIAL_STOCK', performedBy: manager.name, createdAt: new Date('2025-12-20') },
    // Transfer transactions (LA warehouse: B-01-01-01 → D-01-01-01)
    { itemId: items['ELEC-001'].id, warehouseId: whLA.id, locationCode: 'B-01-01-01', lotNo: 'LOT-LA-2026-001', txType: 'TRANSFER' as const, quantity: -5, referenceType: 'TRANSFER', performedBy: operator2.name, createdAt: new Date('2026-03-10'), notes: '피킹 구역으로 이동 [FROM B-01-01-01 TO D-01-01-01]' },
    { itemId: items['ELEC-001'].id, warehouseId: whLA.id, locationCode: 'D-01-01-01', lotNo: 'LOT-LA-2026-001', txType: 'TRANSFER' as const, quantity: 5, referenceType: 'TRANSFER', performedBy: operator2.name, createdAt: new Date('2026-03-10'), notes: '피킹 구역으로 이동 [FROM B-01-01-01 TO D-01-01-01]' },
    // NJ initial stock
    { itemId: items['GENR-001'].id, warehouseId: whNJ.id, locationCode: 'B-02-01-01', lotNo: 'LOT-NJ-2025-006', txType: 'INBOUND' as const, quantity: 400, referenceType: 'INITIAL_STOCK', performedBy: manager.name, createdAt: new Date('2025-11-30') },
    { itemId: items['FOOD-005'].id, warehouseId: whNJ.id, locationCode: 'B-01-01-01', lotNo: 'LOT-NJ-2025-005', txType: 'INBOUND' as const, quantity: 35, referenceType: 'INITIAL_STOCK', performedBy: manager.name, createdAt: new Date('2025-12-10') },
    // HH initial stock
    { itemId: items['ELEC-001'].id, warehouseId: whHH.id, locationCode: 'B-01-01-01', lotNo: 'LOT-HH-2025-001', txType: 'INBOUND' as const, quantity: 25, referenceType: 'INITIAL_STOCK', performedBy: manager2.name, createdAt: new Date('2025-11-20') },
    { itemId: items['GENR-003'].id, warehouseId: whHH.id, locationCode: 'B-01-02-01', lotNo: 'LOT-HH-2025-002', txType: 'INBOUND' as const, quantity: 60, referenceType: 'INITIAL_STOCK', performedBy: manager2.name, createdAt: new Date('2025-11-20') },
    { itemId: items['GENR-004'].id, warehouseId: whHH.id, locationCode: 'B-02-01-01', lotNo: 'LOT-HH-2025-003', txType: 'INBOUND' as const, quantity: 45, referenceType: 'INITIAL_STOCK', performedBy: manager2.name, createdAt: new Date('2025-11-20') },
    { itemId: items['GENR-005'].id, warehouseId: whHH.id, locationCode: 'B-02-02-01', lotNo: 'LOT-HH-2025-004', txType: 'INBOUND' as const, quantity: 15, referenceType: 'INITIAL_STOCK', performedBy: manager2.name, createdAt: new Date('2025-11-20') },
    // TK initial stock
    { itemId: items['ELEC-002'].id, warehouseId: whTK.id, locationCode: 'B-01-01-01', lotNo: 'LOT-TK-2025-001', txType: 'INBOUND' as const, quantity: 30, referenceType: 'INITIAL_STOCK', performedBy: manager.name, createdAt: new Date('2025-10-15') },
    { itemId: items['GENR-002'].id, warehouseId: whTK.id, locationCode: 'B-01-02-01', lotNo: 'LOT-TK-2025-002', txType: 'INBOUND' as const, quantity: 80, referenceType: 'INITIAL_STOCK', performedBy: manager.name, createdAt: new Date('2025-10-15') },
  ];

  for (const data of txData) {
    await prisma.inventoryTransaction.create({ data });
  }
  console.log(`  Created ${txData.length} inventory transactions.`);

  // ─── Stock Adjustments ───────────────────────────────────
  console.log('Creating stock adjustments...');

  await prisma.stockAdjustment.createMany({
    data: [
      {
        warehouseId: whLA.id,
        itemCode: 'ELEC-001',
        locationCode: 'B-01-01-01',
        lotNo: 'LOT-LA-2026-001',
        adjustQty: -2,
        reason: 'DAMAGE',
        notes: '입고 시 운송 중 파손 확인 - 노트북 화면 균열',
        performedBy: operator1.name,
        approvedBy: manager.name,
      },
      {
        warehouseId: whNJ.id,
        itemCode: 'FOOD-001',
        locationCode: 'B-01-01-01',
        lotNo: 'LOT-NJ-2026-001',
        adjustQty: 3,
        reason: 'CORRECTION',
        notes: '재고 실사 후 수량 보정 - 실제 수량 확인',
        performedBy: operator1.name,
        approvedBy: manager.name,
      },
      {
        warehouseId: whHH.id,
        itemCode: 'GENR-003',
        locationCode: 'B-01-02-01',
        lotNo: 'LOT-HH-2025-002',
        adjustQty: 5,
        reason: 'FOUND',
        notes: '인접 로케이션에서 미등록 재고 발견',
        performedBy: operator1.name,
        approvedBy: admin.name,
      },
    ],
  });
  console.log('  Created 3 stock adjustments.');

  // ─── Cycle Counts ────────────────────────────────────────
  console.log('Creating cycle counts...');

  await prisma.cycleCount.createMany({
    data: [
      {
        warehouseId: whLA.id,
        locationCode: 'B-01-01-01',
        itemCode: 'ELEC-001',
        systemQty: 20,
        countedQty: 18,
        variance: -2,
        status: 'COMPLETED',
        countedBy: operator1.name,
        countedDate: new Date('2026-03-01'),
        notes: '분기 정기 실사 - 파손 재고 2개 확인, 재고 조정 완료',
      },
      {
        warehouseId: whNJ.id,
        locationCode: 'B-01-01-01',
        itemCode: 'FOOD-001',
        systemQty: 60,
        countedQty: null,
        variance: null,
        status: 'PLANNED',
        countedBy: null,
        countedDate: null,
        notes: '2026년 3월 정기 실사 예정',
      },
      {
        warehouseId: whHH.id,
        locationCode: 'B-01-02-01',
        itemCode: 'GENR-003',
        systemQty: 60,
        countedQty: null,
        variance: null,
        status: 'IN_PROGRESS',
        countedBy: operator2.name,
        countedDate: null,
        notes: '함부르크 창고 실사 진행 중',
      },
      {
        warehouseId: whLA.id,
        locationCode: 'C-01-01-01',
        itemCode: 'ELEC-005',
        systemQty: 120,
        countedQty: null,
        variance: null,
        status: 'PLANNED',
        countedBy: null,
        countedDate: null,
        notes: 'LA 보관구역B 정기 실사 예정',
      },
    ],
  });
  console.log('  Created 4 cycle counts.');

  // ─── Common Codes (공통코드) ────────────────────────────
  console.log('Creating common codes...');
  const commonCodes = [
    { codeType: 'WH_TYPE', typeNm: '창고유형', code: 'GENERAL', codeNm: '일반창고', sortOrder: 1 },
    { codeType: 'WH_TYPE', typeNm: '창고유형', code: 'COLD', codeNm: '냉장창고', sortOrder: 2 },
    { codeType: 'WH_TYPE', typeNm: '창고유형', code: 'FROZEN', codeNm: '냉동창고', sortOrder: 3 },
    { codeType: 'WH_TYPE', typeNm: '창고유형', code: 'BONDED', codeNm: '보세창고', sortOrder: 4 },
    { codeType: 'WH_CLASS', typeNm: '창고구분', code: 'OWN', codeNm: '자사', sortOrder: 1 },
    { codeType: 'WH_CLASS', typeNm: '창고구분', code: 'RENT', codeNm: '임대', sortOrder: 2 },
    { codeType: 'LOC_TYPE', typeNm: 'LOC구분', code: 'FLOOR', codeNm: '평치', sortOrder: 1 },
    { codeType: 'LOC_TYPE', typeNm: 'LOC구분', code: 'RACK', codeNm: '랙', sortOrder: 2 },
    { codeType: 'LOC_TYPE', typeNm: 'LOC구분', code: 'MEZZANINE', codeNm: '중층', sortOrder: 3 },
    { codeType: 'CREDIT', typeNm: '신용등급', code: 'A', codeNm: 'A등급', sortOrder: 1 },
    { codeType: 'CREDIT', typeNm: '신용등급', code: 'B', codeNm: 'B등급', sortOrder: 2 },
    { codeType: 'CREDIT', typeNm: '신용등급', code: 'C', codeNm: 'C등급', sortOrder: 3 },
    { codeType: 'ORDER_CLASS', typeNm: '주문구분', code: 'NORMAL', codeNm: '일반', sortOrder: 1 },
    { codeType: 'ORDER_CLASS', typeNm: '주문구분', code: 'RETURN', codeNm: '반품', sortOrder: 2 },
    { codeType: 'ORDER_CLASS', typeNm: '주문구분', code: 'TRANSFER', codeNm: '이동', sortOrder: 3 },
    { codeType: 'ITEM_GRADE', typeNm: '출하등급', code: 'A', codeNm: 'A등급(정상)', sortOrder: 1 },
    { codeType: 'ITEM_GRADE', typeNm: '출하등급', code: 'B', codeNm: 'B등급(불량)', sortOrder: 2 },
    { codeType: 'ITEM_GRADE', typeNm: '출하등급', code: 'AS', codeNm: 'AS재고', sortOrder: 3 },
  ];
  for (const cc of commonCodes) {
    await prisma.commonCode.create({ data: cc });
  }
  console.log(`  Created ${commonCodes.length} common codes.`);

  // ─── Item Groups (상품군) ─────────────────────────────
  console.log('Creating item groups...');
  const itemGroups = await Promise.all([
    prisma.itemGroup.create({ data: { code: 'GRP-GEN', name: '일반상품', groupType: 'GENERAL' } }),
    prisma.itemGroup.create({ data: { code: 'GRP-ELEC', name: '전자제품', groupType: 'ELECTRONICS' } }),
    prisma.itemGroup.create({ data: { code: 'GRP-FOOD', name: '식품류', groupType: 'FOOD', inboundZone: 'COLD' } }),
    prisma.itemGroup.create({ data: { code: 'GRP-FRAG', name: '파손주의', groupType: 'FRAGILE' } }),
  ]);
  console.log(`  Created ${itemGroups.length} item groups.`);

  // ─── UOM Masters ──────────────────────────────────────
  console.log('Creating UOM masters...');
  const uomMasters = await Promise.all([
    prisma.uomMaster.create({ data: { code: 'EA', name: '개' } }),
    prisma.uomMaster.create({ data: { code: 'BOX', name: '박스' } }),
    prisma.uomMaster.create({ data: { code: 'PLT', name: '파렛트' } }),
    prisma.uomMaster.create({ data: { code: 'CASE', name: '케이스' } }),
    prisma.uomMaster.create({ data: { code: 'KG', name: '킬로그램' } }),
    prisma.uomMaster.create({ data: { code: 'LB', name: '파운드' } }),
  ]);
  // UOM 환산
  await prisma.uomConversion.create({
    data: { fromUomId: uomMasters[1].id, toUomId: uomMasters[0].id, convQty: 24 },
  });
  await prisma.uomConversion.create({
    data: { fromUomId: uomMasters[2].id, toUomId: uomMasters[1].id, convQty: 40 },
  });
  await prisma.uomConversion.create({
    data: { fromUomId: uomMasters[4].id, toUomId: uomMasters[5].id, convQty: 2.205 },
  });
  console.log(`  Created ${uomMasters.length} UOM masters + 3 conversions.`);

  // ─── Vehicles (차량) ──────────────────────────────────
  console.log('Creating vehicles...');
  const vehicles = await Promise.all([
    prisma.vehicle.create({ data: { plateNo: '서울12가3456', tonnage: 1, driverName: '박기사', driverPhone: '010-1111-2222' } }),
    prisma.vehicle.create({ data: { plateNo: '인천34나5678', tonnage: 2.5, driverName: '김기사', driverPhone: '010-3333-4444' } }),
    prisma.vehicle.create({ data: { plateNo: '부산56다7890', tonnage: 5, driverName: '이기사', driverPhone: '010-5555-6666' } }),
    prisma.vehicle.create({ data: { plateNo: '대전78라1234', tonnage: 11, driverName: '최기사', driverPhone: '010-7777-8888' } }),
  ]);
  console.log(`  Created ${vehicles.length} vehicles.`);

  // ─── Docks (도크장) ───────────────────────────────────
  console.log('Creating docks...');
  // warehouses[0]에 도크 생성 (첫번째 warehouse의 id를 가져와야 함)
  const allWarehouses = await prisma.warehouse.findMany({ take: 2 });
  if (allWarehouses.length > 0) {
    await prisma.dock.createMany({
      data: [
        { warehouseId: allWarehouses[0].id, code: 'DOCK-01', name: '도크 1번', sortOrder: 1, maxTonnage: 5 },
        { warehouseId: allWarehouses[0].id, code: 'DOCK-02', name: '도크 2번', sortOrder: 2, maxTonnage: 11 },
        { warehouseId: allWarehouses[0].id, code: 'DOCK-03', name: '도크 3번', sortOrder: 3, maxTonnage: 25 },
      ],
    });
    if (allWarehouses.length > 1) {
      await prisma.dock.createMany({
        data: [
          { warehouseId: allWarehouses[1].id, code: 'DOCK-01', name: '도크 A', sortOrder: 1, maxTonnage: 5 },
          { warehouseId: allWarehouses[1].id, code: 'DOCK-02', name: '도크 B', sortOrder: 2, maxTonnage: 11 },
        ],
      });
    }
  }
  console.log('  Created 5 docks.');

  // ─── Summary ─────────────────────────────────────────────
  console.log('\n========================================');
  console.log('  KCS WMS Seed Data Complete!');
  console.log('========================================');
  console.log('  Users:                6');
  console.log(`  Warehouses:           4`);
  console.log(`  Items:                ${itemsData.length}`);
  console.log(`  Partners:             ${partnersData.length}`);
  console.log('  Inbound Orders:       6');
  console.log('  Outbound Orders:      7');
  console.log(`  Inventory Records:    ${inventoryData.length}`);
  console.log(`  Inventory Txns:       ${txData.length}`);
  console.log('  Stock Adjustments:    3');
  console.log('  Cycle Counts:         4');
  console.log(`  Common Codes:         ${commonCodes.length}`);
  console.log(`  Item Groups:          ${itemGroups.length}`);
  console.log(`  UOM Masters:          ${uomMasters.length} + 3 conversions`);
  console.log(`  Vehicles:             ${vehicles.length}`);
  console.log('  Docks:                5');
  console.log('========================================\n');
  console.log('Login credentials:');
  console.log('  admin@kcs.com     / password123 (ADMIN)');
  console.log('  manager@kcs.com   / password123 (MANAGER)');
  console.log('  manager2@kcs.com  / password123 (MANAGER)');
  console.log('  operator1@kcs.com / password123 (OPERATOR)');
  console.log('  operator2@kcs.com / password123 (OPERATOR)');
  console.log('  viewer@kcs.com    / password123 (VIEWER)');
  console.log('');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
