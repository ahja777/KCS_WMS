import { PrismaClient } from '@prisma/client';

/**
 * KCS WMS 신규 테이블 CRUD 테스트
 * ERD 재구성으로 추가된 테이블 검증
 * 실행: npx jest --config '{"rootDir":".","testEnvironment":"node","testRegex":"test/db-crud-new-tables\\.spec\\.ts$","transform":{"^.+\\.(t|j)s$":"ts-jest"}}' --runInBand --forceExit
 */

const prisma = new PrismaClient();
const s = Date.now().toString(36);

beforeAll(async () => { await prisma.$connect(); });
afterAll(async () => { await prisma.$disconnect(); });

// ═══════════════════════════════════════════════════════════════
// 1. User 확장 필드 테스트
// ═══════════════════════════════════════════════════════════════
describe('User 확장 필드 (TMSYS030)', () => {
  let userId: string;

  afterAll(async () => {
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
  });

  it('CREATE - company, duty, phone, mobile 필드', async () => {
    const user = await prisma.user.create({
      data: {
        email: `ext-user-${s}@kcs.com`,
        password: '$2b$10$hash',
        name: '확장필드테스트',
        role: 'OPERATOR',
        company: '(주)KCS물류',
        duty: '물류팀장',
        phone: '02-1234-5678',
        mobile: '010-9876-5432',
      },
    });
    userId = user.id;
    expect(user.company).toBe('(주)KCS물류');
    expect(user.duty).toBe('물류팀장');
    expect(user.phone).toBe('02-1234-5678');
    expect(user.mobile).toBe('010-9876-5432');
  });

  it('UPDATE', async () => {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { company: '(주)수정물류', duty: '센터장' },
    });
    expect(updated.company).toBe('(주)수정물류');
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. Role (TMSYS020/050: 권한관리)
// ═══════════════════════════════════════════════════════════════
describe('Role CRUD (TMSYS050)', () => {
  let roleId: string;

  afterAll(async () => {
    if (roleId) await prisma.role.deleteMany({ where: { id: roleId } });
  });

  it('CREATE', async () => {
    const role = await prisma.role.create({
      data: {
        code: `ROLE-${s}`,
        name: '창고관리자',
        description: '창고 입출고 관리 권한',
        permissions: { warehouse: true, inbound: true, outbound: true, inventory: true },
      },
    });
    roleId = role.id;
    expect(role.name).toBe('창고관리자');
  });

  it('READ', async () => {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    expect(role!.permissions).toBeDefined();
  });

  it('UPDATE', async () => {
    const updated = await prisma.role.update({
      where: { id: roleId },
      data: { name: '수정된역할', isActive: false },
    });
    expect(updated.isActive).toBe(false);
  });

  it('DELETE', async () => {
    await prisma.role.delete({ where: { id: roleId } });
    const found = await prisma.role.findUnique({ where: { id: roleId } });
    expect(found).toBeNull();
    roleId = '';
  });
});

// ═══════════════════════════════════════════════════════════════
// 3. Program (TMSYS040: 프로그램/메뉴관리)
// ═══════════════════════════════════════════════════════════════
describe('Program CRUD (TMSYS040)', () => {
  let parentId: string;
  let childId: string;

  afterAll(async () => {
    if (childId) await prisma.program.deleteMany({ where: { id: childId } });
    if (parentId) await prisma.program.deleteMany({ where: { id: parentId } });
  });

  it('CREATE - 부모/자식 메뉴', async () => {
    const parent = await prisma.program.create({
      data: {
        code: `PGM-P-${s}`,
        name: '운영관리',
        menuLevel: 1,
        sortOrder: 1,
        icon: 'Settings',
      },
    });
    parentId = parent.id;

    const child = await prisma.program.create({
      data: {
        code: `PGM-C-${s}`,
        name: '입고관리',
        programUrl: '/inbound',
        parentId: parent.id,
        menuLevel: 2,
        sortOrder: 1,
      },
    });
    childId = child.id;
    expect(child.parentId).toBe(parent.id);
  });

  it('READ - 트리 구조', async () => {
    const parent = await prisma.program.findUnique({
      where: { id: parentId },
      include: { children: true },
    });
    expect(parent!.children).toHaveLength(1);
    expect(parent!.children[0].name).toBe('입고관리');
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. RoleProgram (권한-프로그램 매핑)
// ═══════════════════════════════════════════════════════════════
describe('RoleProgram CRUD', () => {
  let roleId: string;
  let programId: string;
  let rpId: string;

  beforeAll(async () => {
    const role = await prisma.role.create({
      data: { code: `RP-R-${s}`, name: 'RP테스트역할' },
    });
    roleId = role.id;
    const pgm = await prisma.program.create({
      data: { code: `RP-P-${s}`, name: 'RP테스트프로그램' },
    });
    programId = pgm.id;
  });

  afterAll(async () => {
    if (rpId) await prisma.roleProgram.deleteMany({ where: { id: rpId } });
    await prisma.program.deleteMany({ where: { id: programId } });
    await prisma.role.deleteMany({ where: { id: roleId } });
  });

  it('CREATE', async () => {
    const rp = await prisma.roleProgram.create({
      data: {
        roleId,
        programId,
        canRead: true,
        canWrite: true,
        canDelete: false,
        canExport: true,
      },
    });
    rpId = rp.id;
    expect(rp.canWrite).toBe(true);
    expect(rp.canDelete).toBe(false);
  });

  it('Cascade 삭제 - Role 삭제 시 RoleProgram도 삭제', async () => {
    await prisma.role.delete({ where: { id: roleId } });
    const count = await prisma.roleProgram.count({ where: { roleId } });
    expect(count).toBe(0);
    roleId = '';
    rpId = '';
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. Multilingual (WMSYS020: 다국어관리)
// ═══════════════════════════════════════════════════════════════
describe('Multilingual CRUD (WMSYS020)', () => {
  let mlId: string;

  afterAll(async () => {
    if (mlId) await prisma.multilingual.deleteMany({ where: { id: mlId } });
  });

  it('CREATE', async () => {
    const ml = await prisma.multilingual.create({
      data: {
        langCode: 'ko',
        msgKey: `test.greeting.${s}`,
        msgValue: '안녕하세요',
        module: 'common',
      },
    });
    mlId = ml.id;
    expect(ml.langCode).toBe('ko');
  });

  it('UNIQUE 제약 - 동일 langCode+msgKey 중복 불가', async () => {
    await expect(
      prisma.multilingual.create({
        data: {
          langCode: 'ko',
          msgKey: `test.greeting.${s}`,
          msgValue: '중복',
          module: 'common',
        },
      }),
    ).rejects.toThrow();
  });

  it('UPDATE', async () => {
    const updated = await prisma.multilingual.update({
      where: { id: mlId },
      data: { msgValue: '반갑습니다' },
    });
    expect(updated.msgValue).toBe('반갑습니다');
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. Template (WMSTP010-040: 템플릿관리)
// ═══════════════════════════════════════════════════════════════
describe('Template CRUD (WMSTP010-040)', () => {
  let templateId: string;
  let ownerTemplateId: string;

  afterAll(async () => {
    if (templateId) {
      await prisma.ownerTemplateColumn.deleteMany({ where: { ownerTemplate: { templateId } } });
      await prisma.ownerTemplate.deleteMany({ where: { templateId } });
      await prisma.templateColumn.deleteMany({ where: { templateId } });
      await prisma.template.deleteMany({ where: { id: templateId } });
    }
  });

  it('CREATE - Template + Columns', async () => {
    const template = await prisma.template.create({
      data: {
        code: `TPL-${s}`,
        name: '입고 템플릿',
        templateType: 'INBOUND',
        startRow: 2,
        columns: {
          create: [
            { colSeq: 1, colName: '주문번호', isMandatory: true, colType: 'STRING', colWidth: 150 },
            { colSeq: 2, colName: '상품코드', isMandatory: true, colType: 'STRING', colWidth: 120 },
            { colSeq: 3, colName: '수량', isMandatory: true, colType: 'NUMBER', colWidth: 80 },
            { colSeq: 4, colName: 'LOT번호', colType: 'STRING', colWidth: 120 },
          ],
        },
      },
      include: { columns: true },
    });
    templateId = template.id;
    expect(template.columns).toHaveLength(4);
    expect(template.columns[0].isMandatory).toBe(true);
  });

  it('CREATE - OwnerTemplate + Columns', async () => {
    const ot = await prisma.ownerTemplate.create({
      data: {
        templateId,
        partnerId: 'test-partner-id',
        startRow: 3,
        notes: '화주 전용 설정',
        columns: {
          create: [
            { colSeq: 1, colName: '주문번호', isUsed: true, useSeq: 1, viewSeq: 1 },
            { colSeq: 2, colName: '상품코드', isUsed: true, useSeq: 2, viewSeq: 2 },
            { colSeq: 3, colName: '수량', isUsed: true, useSeq: 3, viewSeq: 3 },
            { colSeq: 4, colName: 'LOT번호', isUsed: false },
          ],
        },
      },
      include: { columns: true },
    });
    ownerTemplateId = ot.id;
    expect(ot.columns).toHaveLength(4);
    expect(ot.columns.filter(c => c.isUsed)).toHaveLength(3);
  });

  it('Cascade 삭제 - Template 삭제 시 모두 삭제', async () => {
    await prisma.template.delete({ where: { id: templateId } });
    expect(await prisma.templateColumn.count({ where: { templateId } })).toBe(0);
    expect(await prisma.ownerTemplate.count({ where: { templateId } })).toBe(0);
    templateId = '';
  });
});

// ═══════════════════════════════════════════════════════════════
// 7. WorkPolicy (WMSMS020: 센터별작업정책)
// ═══════════════════════════════════════════════════════════════
describe('WorkPolicy CRUD (WMSMS020)', () => {
  let policyId: string;

  afterAll(async () => {
    if (policyId) await prisma.workPolicy.deleteMany({ where: { id: policyId } });
  });

  it('CREATE', async () => {
    const policy = await prisma.workPolicy.create({
      data: {
        warehouseId: 'test-wh-id',
        policyType: 'OUTBOUND',
        policyName: '출고 FIFO 정책',
        outboundPickRule: 'FIFO',
        fifoEnabled: true,
        fefoEnabled: false,
        negativeStockAllow: false,
        autoReplenish: true,
        replenishThreshold: 50,
      },
    });
    policyId = policy.id;
    expect(policy.fifoEnabled).toBe(true);
    expect(policy.replenishThreshold).toBe(50);
  });

  it('UPDATE', async () => {
    const updated = await prisma.workPolicy.update({
      where: { id: policyId },
      data: { fefoEnabled: true, notes: 'FEFO도 적용' },
    });
    expect(updated.fefoEnabled).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// 8. Helpdesk (TMSYS130)
// ═══════════════════════════════════════════════════════════════
describe('Helpdesk CRUD (TMSYS130)', () => {
  let ticketId: string;

  afterAll(async () => {
    if (ticketId) await prisma.helpdesk.deleteMany({ where: { id: ticketId } });
  });

  it('CREATE', async () => {
    const ticket = await prisma.helpdesk.create({
      data: {
        ticketNo: `HD-${s}`,
        title: '바코드 스캐너 오류',
        content: '입고 시 바코드 스캔이 안됩니다.',
        category: 'EQUIPMENT',
        priority: 'HIGH',
        status: 'OPEN',
        requesterId: 'user-001',
      },
    });
    ticketId = ticket.id;
    expect(ticket.priority).toBe('HIGH');
    expect(ticket.status).toBe('OPEN');
  });

  it('UPDATE - 해결처리', async () => {
    const updated = await prisma.helpdesk.update({
      where: { id: ticketId },
      data: {
        status: 'RESOLVED',
        assigneeId: 'admin-001',
        resolvedAt: new Date(),
        resolution: '바코드 스캐너 드라이버 재설치 완료',
      },
    });
    expect(updated.status).toBe('RESOLVED');
    expect(updated.resolution).toContain('드라이버');
  });
});

// ═══════════════════════════════════════════════════════════════
// 9. SettlementRate (WMSAC010: 정산단가관리)
// ═══════════════════════════════════════════════════════════════
describe('SettlementRate CRUD (WMSAC010)', () => {
  let rateId: string;

  afterAll(async () => {
    if (rateId) await prisma.settlementRate.deleteMany({ where: { id: rateId } });
  });

  it('CREATE', async () => {
    const rate = await prisma.settlementRate.create({
      data: {
        warehouseId: 'test-wh-id',
        partnerId: 'test-partner-id',
        rateType: 'INBOUND',
        rateName: '입고 팔레트당 단가',
        unitPrice: 3500,
        currency: 'KRW',
        effectiveFrom: new Date('2026-01-01'),
        effectiveTo: new Date('2026-12-31'),
      },
    });
    rateId = rate.id;
    expect(rate.unitPrice).toBe(3500);
    expect(rate.currency).toBe('KRW');
  });

  it('UPDATE', async () => {
    const updated = await prisma.settlementRate.update({
      where: { id: rateId },
      data: { unitPrice: 4000 },
    });
    expect(updated.unitPrice).toBe(4000);
  });
});

// ═══════════════════════════════════════════════════════════════
// 10. OutboundOrder 확장 필드 테스트
// ═══════════════════════════════════════════════════════════════
describe('OutboundOrder 확장 필드', () => {
  let warehouseId: string;
  let partnerId: string;
  let itemId: string;
  let orderId: string;

  beforeAll(async () => {
    const wh = await prisma.warehouse.create({
      data: { code: `WH-OBX-${s}`, name: 'OBX', country: 'KR', city: '서울', address: '서울시' },
    });
    warehouseId = wh.id;
    const ptr = await prisma.partner.create({
      data: { code: `P-OBX-${s}`, name: 'OBX거래처', type: 'CUSTOMER' },
    });
    partnerId = ptr.id;
    const item = await prisma.item.create({
      data: { code: `I-OBX-${s}`, name: 'OBX상품' },
    });
    itemId = item.id;
  });

  afterAll(async () => {
    if (orderId) {
      await prisma.outboundOrderItem.deleteMany({ where: { outboundOrderId: orderId } });
      await prisma.outboundOrder.deleteMany({ where: { id: orderId } });
    }
    await prisma.item.deleteMany({ where: { id: itemId } });
    await prisma.partner.deleteMany({ where: { id: partnerId } });
    await prisma.warehouse.deleteMany({ where: { id: warehouseId } });
  });

  it('CREATE - orderSeq, deliveryTo, defectiveQty', async () => {
    const order = await prisma.outboundOrder.create({
      data: {
        orderNumber: `OB-EXT-${s}`,
        partnerId,
        warehouseId,
        orderSeq: 1,
        deliveryTo: '서울시 강남구 역삼동 123-45',
        items: {
          create: {
            itemId,
            orderedQty: 200,
            defectiveQty: 5,
          },
        },
      },
      include: { items: true },
    });
    orderId = order.id;
    expect(order.orderSeq).toBe(1);
    expect(order.deliveryTo).toBe('서울시 강남구 역삼동 123-45');
    expect(order.items[0].defectiveQty).toBe(5);
  });
});

// ═══════════════════════════════════════════════════════════════
// 11. ItemGroup 확장 필드 테스트
// ═══════════════════════════════════════════════════════════════
describe('ItemGroup 확장 필드 (WMSMS094)', () => {
  let groupId: string;

  afterAll(async () => {
    if (groupId) await prisma.itemGroup.deleteMany({ where: { id: groupId } });
  });

  it('CREATE - weightToleranceRate, minShelfLife', async () => {
    const group = await prisma.itemGroup.create({
      data: {
        code: `IGX-${s}`,
        name: '냉동식품군',
        groupType: 'FROZEN',
        weightToleranceRate: 2.5,
        minShelfLife: 30,
        minShelfLifeUnit: 'DAY',
      },
    });
    groupId = group.id;
    expect(group.weightToleranceRate).toBe(2.5);
    expect(group.minShelfLife).toBe(30);
    expect(group.minShelfLifeUnit).toBe('DAY');
  });
});

// ═══════════════════════════════════════════════════════════════
// 12. PartnerProduct 확장 필드 테스트
// ═══════════════════════════════════════════════════════════════
describe('PartnerProduct 확장 필드 (WMSMS095)', () => {
  let ppId: string;

  afterAll(async () => {
    if (ppId) await prisma.partnerProduct.deleteMany({ where: { id: ppId } });
  });

  it('CREATE - itemId, outMinShelfLife, weightToleranceKg', async () => {
    const pp = await prisma.partnerProduct.create({
      data: {
        partnerId: 'test-partner',
        customerPartnerId: 'test-customer',
        itemId: 'test-item',
        expiryControl: true,
        outMinShelfLife: 14,
        outMinShelfLifeUnit: 'DAY',
        weightToleranceKg: 0.3,
      },
    });
    ppId = pp.id;
    expect(pp.itemId).toBe('test-item');
    expect(pp.outMinShelfLife).toBe(14);
    expect(pp.weightToleranceKg).toBe(0.3);
  });
});
