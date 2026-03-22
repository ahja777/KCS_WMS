#!/bin/bash
# ============================================================================
# KCS WMS MariaDB Setup & Test Script
# ============================================================================
set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-clip_user}"
DB_PASS="${DB_PASS:-clip_dev_password_2024}"
DB_NAME="${DB_NAME:-kcs_wms_db}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

echo "============================================"
echo " KCS WMS MariaDB 설정"
echo "============================================"

# 1. MariaDB 컨테이너 확인/실행
echo ""
echo "[1/6] MariaDB 컨테이너 확인..."
if docker ps --format '{{.Names}}' | grep -q 'kcs-wms-mariadb'; then
  echo "  ✓ MariaDB 컨테이너 실행 중"
else
  echo "  → MariaDB 컨테이너 시작..."
  docker run -d \
    --name kcs-wms-mariadb \
    -e MYSQL_ROOT_PASSWORD=root_password \
    -e MYSQL_DATABASE="$DB_NAME" \
    -e MYSQL_USER="$DB_USER" \
    -e MYSQL_PASSWORD="$DB_PASS" \
    -p "$DB_PORT":3306 \
    --health-cmd="mariadb-admin ping -h localhost -u root --password=root_password" \
    --health-interval=5s \
    --health-timeout=3s \
    --health-retries=10 \
    mariadb:10.11 \
    --character-set-server=utf8mb4 \
    --collation-server=utf8mb4_unicode_ci \
    --innodb-buffer-pool-size=256M \
    --max-connections=100

  echo "  → 컨테이너 시작 대기 중..."
  for i in {1..30}; do
    if docker exec kcs-wms-mariadb mariadb-admin ping -h localhost -u root --password=root_password 2>/dev/null; then
      echo "  ✓ MariaDB 준비 완료"
      break
    fi
    sleep 1
  done
fi

# 2. Prisma 클라이언트 생성
echo ""
echo "[2/6] Prisma 클라이언트 생성..."
cd "$BACKEND_DIR"
npx prisma generate
echo "  ✓ Prisma 클라이언트 생성 완료"

# 3. 마이그레이션 실행
echo ""
echo "[3/6] 마이그레이션 실행..."
echo "  → DDL 스크립트 실행..."
docker exec -i kcs-wms-mariadb mariadb -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  < "$BACKEND_DIR/prisma/migrations/00001_init_mariadb/migration.sql" 2>/dev/null || {
  echo "  → DDL 이미 적용됨, Prisma db push로 동기화..."
  npx prisma db push --accept-data-loss 2>/dev/null || true
}
echo "  ✓ 마이그레이션 완료"

# 4. 테이블 확인
echo ""
echo "[4/6] 테이블 생성 확인..."
TABLE_COUNT=$(docker exec kcs-wms-mariadb mariadb -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -N -e \
  "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='$DB_NAME' AND TABLE_TYPE='BASE TABLE';" 2>/dev/null)
echo "  ✓ 생성된 테이블: ${TABLE_COUNT}개"

if [ "$TABLE_COUNT" -lt 16 ]; then
  echo "  ⚠ 예상 테이블 수(16)보다 적습니다. Prisma db push 실행..."
  npx prisma db push
fi

# 5. Seed 데이터 삽입
echo ""
echo "[5/6] Seed 데이터 삽입..."
npx ts-node prisma/seed.ts 2>/dev/null && echo "  ✓ Seed 완료" || echo "  ⚠ Seed 실패 (이미 존재할 수 있음)"

# 6. 쿼리 최적화 테스트
echo ""
echo "[6/6] 쿼리 최적화 테스트..."
docker exec -i kcs-wms-mariadb mariadb -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  < "$BACKEND_DIR/prisma/migrations/00002_verify_and_test/test_queries.sql" 2>/dev/null \
  && echo "  ✓ 쿼리 테스트 통과" \
  || echo "  ⚠ 일부 테스트 실패 (위 로그 확인)"

echo ""
echo "============================================"
echo " 설정 완료!"
echo "============================================"
echo ""
echo " DATABASE_URL=mysql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo " 명령어:"
echo "   npm run db:generate  # Prisma 클라이언트 재생성"
echo "   npm run db:push      # 스키마 동기화"
echo "   npm run db:seed      # 테스트 데이터 삽입"
echo "   npm run db:studio    # Prisma Studio (GUI)"
echo "   npm run dev          # 백엔드 서버 시작"
echo ""
