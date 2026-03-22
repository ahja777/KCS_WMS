import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;
const results: string[] = [];

function log(msg: string) {
  console.log(msg);
  results.push(msg);
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    log(`✅ PASS: ${name}`);
  } catch (e: any) {
    failed++;
    log(`❌ FAIL: ${name} - ${e.message}`);
  }
}

async function main() {
  log('=== KCS WMS CRUD Test Suite ===');
  log(`Started: ${new Date().toISOString()}\n`);

  // 1. ContainerGroup CRUD
  let cgId = '';
  await test('ContainerGroup - Create', async () => {
    const cg = await prisma.containerGroup.create({
      data: { groupCode: 'TEST-CG-01', groupName: '테스트 용기군' },
    });
    cgId = cg.id;
    if (!cg.id) throw new Error('No ID returned');
  });

  await test('ContainerGroup - Read', async () => {
    const cg = await prisma.containerGroup.findUnique({ where: { id: cgId } });
    if (!cg || cg.groupName !== '테스트 용기군') throw new Error('Read mismatch');
  });

  await test('ContainerGroup - Update', async () => {
    const cg = await prisma.containerGroup.update({
      where: { id: cgId },
      data: { groupName: '수정된 용기군' },
    });
    if (cg.groupName !== '수정된 용기군') throw new Error('Update mismatch');
  });

  // 2. Container CRUD
  let containerId = '';
  await test('Container - Create', async () => {
    const c = await prisma.container.create({
      data: {
        containerCode: 'TEST-C-01',
        containerName: '테스트 용기',
        containerGroupId: cgId,
        weight: 10.5,
        unitPrice: 25000,
        isActive: true,
        stockUnit: 'EA',
      },
    });
    containerId = c.id;
    if (!c.id) throw new Error('No ID returned');
  });

  await test('Container - Read with relation', async () => {
    const c = await prisma.container.findUnique({
      where: { id: containerId },
      include: { containerGroup: true },
    });
    if (!c || !c.containerGroup) throw new Error('Relation missing');
  });

  await test('Container - Update', async () => {
    const c = await prisma.container.update({
      where: { id: containerId },
      data: { containerName: '수정된 용기', weightToleranceKg: 0.5 },
    });
    if (c.containerName !== '수정된 용기') throw new Error('Update mismatch');
  });

  // 3. ContainerInventory CRUD
  let ciId = '';
  await test('ContainerInventory - Create', async () => {
    const ci = await prisma.containerInventory.create({
      data: {
        containerCode: 'TEST-C-01',
        containerName: '테스트 용기',
        normalStock: 100,
        stockUnit: 'EA',
        optimalStock: 150,
      },
    });
    ciId = ci.id;
    if (!ci.id) throw new Error('No ID returned');
  });

  await test('ContainerInventory - Read', async () => {
    const ci = await prisma.containerInventory.findUnique({ where: { id: ciId } });
    if (!ci || ci.normalStock !== 100) throw new Error('Read mismatch');
  });

  // 4. StockTransfer CRUD
  let stId = '';
  await test('StockTransfer - Create', async () => {
    const st = await prisma.stockTransfer.create({
      data: {
        status: 'PENDING',
        fromLocationCode: 'LOC-A01',
        toLocationCode: 'LOC-B01',
        quantity: 50,
      },
    });
    stId = st.id;
    if (!st.id) throw new Error('No ID returned');
  });

  await test('StockTransfer - Update status', async () => {
    const st = await prisma.stockTransfer.update({
      where: { id: stId },
      data: { status: 'COMPLETED' },
    });
    if (st.status !== 'COMPLETED') throw new Error('Status update failed');
  });

  // 5. OwnershipTransfer CRUD
  let otId = '';
  await test('OwnershipTransfer - Create', async () => {
    const ot = await prisma.ownershipTransfer.create({
      data: {
        workNumber: 'OT-TEST-001',
        workDate: new Date(),
        fromPartnerId: '00000000-0000-0000-0000-000000000001',
        fromItemId: '00000000-0000-0000-0000-000000000001',
        fromQuantity: 10,
        fromUom: 'EA',
        toPartnerId: '00000000-0000-0000-0000-000000000002',
        toItemId: '00000000-0000-0000-0000-000000000002',
        toQuantity: 10,
        toUom: 'EA',
      },
    });
    otId = ot.id;
    if (!ot.id) throw new Error('No ID returned');
  });

  // 6. Assembly + AssemblyItem CRUD
  let asmId = '';
  await test('Assembly - Create with items', async () => {
    const asm = await prisma.assembly.create({
      data: {
        workNumber: 'ASM-TEST-001',
        workDate: new Date(),
        notes: '테스트 임가공',
        items: {
          create: [
            { itemId: '00000000-0000-0000-0000-000000000001', quantity: 5, uom: 'EA', type: 'INPUT' },
            { itemId: '00000000-0000-0000-0000-000000000002', quantity: 1, uom: 'EA', type: 'OUTPUT' },
          ],
        },
      },
      include: { items: true },
    });
    asmId = asm.id;
    if (asm.items.length !== 2) throw new Error('Items count mismatch');
  });

  await test('Assembly - Read with items', async () => {
    const asm = await prisma.assembly.findUnique({
      where: { id: asmId },
      include: { items: true },
    });
    if (!asm || asm.items.length !== 2) throw new Error('Read failed');
  });

  // 7. PeriodClose CRUD
  let pcId = '';
  await test('PeriodClose - Create', async () => {
    const pc = await prisma.periodClose.create({
      data: {
        periodType: 'MONTHLY',
        periodDate: new Date(),
        status: 'OPEN',
      },
    });
    pcId = pc.id;
    if (!pc.id) throw new Error('No ID returned');
  });

  await test('PeriodClose - Close period', async () => {
    const pc = await prisma.periodClose.update({
      where: { id: pcId },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
    if (pc.status !== 'CLOSED') throw new Error('Close failed');
  });

  // 8. LocationProduct CRUD
  let lpId = '';
  await test('LocationProduct - Create', async () => {
    const lp = await prisma.locationProduct.create({
      data: {
        locationCode: 'LOC-TEST-01',
        itemId: '00000000-0000-0000-0000-000000000001',
      },
    });
    lpId = lp.id;
    if (!lp.id) throw new Error('No ID returned');
  });

  // 9. PartnerProduct CRUD
  let ppId = '';
  await test('PartnerProduct - Create', async () => {
    const pp = await prisma.partnerProduct.create({
      data: {
        partnerId: '00000000-0000-0000-0000-000000000001',
        customerPartnerId: '00000000-0000-0000-0000-000000000002',
        expiryControl: true,
      },
    });
    ppId = pp.id;
    if (!pp.id) throw new Error('No ID returned');
  });

  // 10. SetItem CRUD
  let siId = '';
  await test('SetItem - Create', async () => {
    const si = await prisma.setItem.create({
      data: {
        parentItemId: '00000000-0000-0000-0000-000000000001',
        childItemId: '00000000-0000-0000-0000-000000000002',
        quantity: 3,
      },
    });
    siId = si.id;
    if (!si.id) throw new Error('No ID returned');
  });

  // 11. OrderHistory CRUD
  let ohId = '';
  await test('OrderHistory - Create', async () => {
    const oh = await prisma.orderHistory.create({
      data: {
        orderType: 'INBOUND',
        orderId: '00000000-0000-0000-0000-000000000001',
        action: 'STATUS_CHANGE',
        beforeData: JSON.stringify({ status: 'DRAFT' }),
        afterData: JSON.stringify({ status: 'CONFIRMED' }),
      },
    });
    ohId = oh.id;
    if (!oh.id) throw new Error('No ID returned');
  });

  // 12. InterfaceLog CRUD
  let ilId = '';
  await test('InterfaceLog - Create', async () => {
    const il = await prisma.interfaceLog.create({
      data: {
        interfaceType: 'ORDER_SYNC',
        direction: 'RECEIVE',
        status: 'SUCCESS',
        requestData: '{"test": true}',
        processedAt: new Date(),
      },
    });
    ilId = il.id;
    if (!il.id) throw new Error('No ID returned');
  });

  // === Cleanup (DELETE tests) ===
  log('\n--- Delete Tests ---');

  await test('InterfaceLog - Delete', async () => {
    await prisma.interfaceLog.delete({ where: { id: ilId } });
    const check = await prisma.interfaceLog.findUnique({ where: { id: ilId } });
    if (check) throw new Error('Not deleted');
  });

  await test('OrderHistory - Delete', async () => {
    await prisma.orderHistory.delete({ where: { id: ohId } });
  });

  await test('SetItem - Delete', async () => {
    await prisma.setItem.delete({ where: { id: siId } });
  });

  await test('PartnerProduct - Delete', async () => {
    await prisma.partnerProduct.delete({ where: { id: ppId } });
  });

  await test('LocationProduct - Delete', async () => {
    await prisma.locationProduct.delete({ where: { id: lpId } });
  });

  await test('PeriodClose - Delete', async () => {
    await prisma.periodClose.delete({ where: { id: pcId } });
  });

  await test('Assembly - Cascade Delete', async () => {
    await prisma.assembly.delete({ where: { id: asmId } });
    const items = await prisma.assemblyItem.findMany({ where: { assemblyId: asmId } });
    if (items.length > 0) throw new Error('Cascade delete failed');
  });

  await test('OwnershipTransfer - Delete', async () => {
    await prisma.ownershipTransfer.delete({ where: { id: otId } });
  });

  await test('StockTransfer - Delete', async () => {
    await prisma.stockTransfer.delete({ where: { id: stId } });
  });

  await test('ContainerInventory - Delete', async () => {
    await prisma.containerInventory.delete({ where: { id: ciId } });
  });

  await test('Container - Delete', async () => {
    await prisma.container.delete({ where: { id: containerId } });
  });

  await test('ContainerGroup - Delete', async () => {
    await prisma.containerGroup.delete({ where: { id: cgId } });
  });

  // === Summary ===
  log(`\n=== Test Summary ===`);
  log(`Total: ${passed + failed}`);
  log(`Passed: ${passed}`);
  log(`Failed: ${failed}`);
  log(`Completed: ${new Date().toISOString()}`);

  // Write results
  const fs = require('fs');
  fs.writeFileSync(
    '/Users/hur_chulwon/Project/AI_Claude/Clip/KCS_WMS/backend/scripts/crud-test-results.md',
    `# CRUD Test Results\n\n${results.join('\n')}\n`
  );
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
