import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 기존 배차 데이터 삭제
  await prisma.dispatchItem.deleteMany();
  await prisma.dispatch.deleteMany();

  const warehouses = await prisma.warehouse.findMany({ take: 4 });
  const vehicles = await prisma.vehicle.findMany({ take: 4 });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const wh0 = warehouses[0].id;
  const wh1 = warehouses[1].id;
  const vh0 = vehicles[0]?.id;
  const vh1 = vehicles[1]?.id;
  const vh2 = vehicles[2]?.id;
  const vh3 = vehicles[3]?.id;

  // 1. COMPLETED - 서울 강남구 배송완료
  await prisma.dispatch.create({
    data: {
      warehouseId: wh0,
      vehicleId: vh0,
      dispatchDate: today,
      status: 'COMPLETED',
      notes: '서울 강남구 역삼동 배송',
      items: {
        create: [
          { itemCode: 'ELEC-001', itemName: '무선 이어폰', orderedQty: 50, dispatchedQty: 50 },
          { itemCode: 'ELEC-002', itemName: '스마트워치', orderedQty: 30, dispatchedQty: 30 },
        ],
      },
    },
  });

  // 2. COMPLETED - 부산 해운대 배송완료
  await prisma.dispatch.create({
    data: {
      warehouseId: wh1,
      vehicleId: vh1,
      dispatchDate: today,
      status: 'COMPLETED',
      notes: '부산 해운대구 우동 배송',
      items: {
        create: [
          { itemCode: 'COSM-001', itemName: '선크림 SPF50+', orderedQty: 80, dispatchedQty: 80 },
          { itemCode: 'COSM-002', itemName: '수분로션', orderedQty: 60, dispatchedQty: 60 },
        ],
      },
    },
  });

  // 3. IN_PROGRESS - 경기 성남시 배송중
  await prisma.dispatch.create({
    data: {
      warehouseId: wh0,
      vehicleId: vh2,
      dispatchDate: today,
      status: 'IN_PROGRESS',
      notes: '경기 성남시 분당구 배송',
      items: {
        create: [
          { itemCode: 'CLTH-001', itemName: '티셔츠 (L)', orderedQty: 100, dispatchedQty: 60 },
          { itemCode: 'CLTH-004', itemName: '운동화 270mm', orderedQty: 40, dispatchedQty: 20 },
        ],
      },
    },
  });

  // 4. ASSIGNED - 인천 남동구 배차완료
  await prisma.dispatch.create({
    data: {
      warehouseId: wh1,
      vehicleId: vh3,
      dispatchDate: today,
      status: 'ASSIGNED',
      notes: '인천 남동구 논현동 배송',
      items: {
        create: [
          { itemCode: 'FOOD-001', itemName: '프로틴바 (박스)', orderedQty: 200, dispatchedQty: 0 },
        ],
      },
    },
  });

  // 5. PLANNED - 대전 유성구 대기
  await prisma.dispatch.create({
    data: {
      warehouseId: wh0,
      dispatchDate: today,
      status: 'PLANNED',
      notes: '대전 유성구 봉명동 배송',
      items: {
        create: [
          { itemCode: 'COSM-003', itemName: '샴푸 500ml', orderedQty: 40, dispatchedQty: 0 },
          { itemCode: 'COSM-004', itemName: '바디워시 1L', orderedQty: 60, dispatchedQty: 0 },
        ],
      },
    },
  });

  // 6. CANCELLED - 주문취소
  await prisma.dispatch.create({
    data: {
      warehouseId: wh0,
      dispatchDate: today,
      status: 'CANCELLED',
      notes: '광주 서구 배송 (고객 취소)',
      items: {
        create: [
          { itemCode: 'ELEC-003', itemName: '보조배터리 20000mAh', orderedQty: 25, dispatchedQty: 0 },
        ],
      },
    },
  });

  console.log('배송 테스트 데이터 생성 완료!');
  console.log('  COMPLETED:   2건 (서울 강남, 부산 해운대)');
  console.log('  IN_PROGRESS: 1건 (경기 성남)');
  console.log('  ASSIGNED:    1건 (인천 남동)');
  console.log('  PLANNED:     1건 (대전 유성)');
  console.log('  CANCELLED:   1건 (광주 서구)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
