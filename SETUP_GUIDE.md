# KCS WMS 프로젝트 - 집에서 개발환경 설정 가이드

> GitHub ID: ahja777
> Repository: https://github.com/ahja777/KCS_WMS

---

## 목차

1. [사전 준비 (필수 설치 프로그램)](#1-사전-준비-필수-설치-프로그램)
2. [GitHub 저장소 클론](#2-github-저장소-클론)
3. [Docker 컨테이너 실행 (DB, Redis)](#3-docker-컨테이너-실행-db-redis)
4. [환경변수 파일 생성](#4-환경변수-파일-생성)
5. [Backend 설정 및 실행](#5-backend-설정-및-실행)
6. [Frontend 설정 및 실행](#6-frontend-설정-및-실행)
7. [실행 확인](#7-실행-확인)
8. [일일 작업 루틴](#8-일일-작업-루틴)
9. [포트 정보 (고정)](#9-포트-정보-고정)
10. [문제 해결](#10-문제-해결)

---

## 1. 사전 준비 (필수 설치 프로그램)

아래 프로그램이 설치되어 있어야 합니다.

### 1-1. Node.js (v24 이상)

- 다운로드: https://nodejs.org
- LTS 버전 권장
- 설치 확인:

```bash
node -v    # v24.12.0 이상
npm -v     # 11.x 이상
```

### 1-2. Git

- 다운로드: https://git-scm.com/downloads
- 설치 시 "Git Bash" 포함 선택
- 설치 확인:

```bash
git --version
```

### 1-3. Docker Desktop

- 다운로드: https://www.docker.com/products/docker-desktop
- 설치 후 Docker Desktop 실행 (트레이에 아이콘 확인)
- 설치 확인:

```bash
docker --version
docker compose version
```

---

## 2. GitHub 저장소 클론

### 2-1. 작업 폴더 생성 및 이동

```bash
# 원하는 위치에 폴더 생성 (예시)
mkdir C:/Claude_AI
cd C:/Claude_AI
```

### 2-2. 저장소 클론

```bash
git clone https://github.com/ahja777/KCS_WMS.git
```

### 2-3. 프로젝트 폴더로 이동

```bash
cd KCS_WMS
```

### 2-4. Git 사용자 설정 (최초 1회)

```bash
git config user.name "ahja777"
git config user.email "your-email@example.com"
```

---

## 3. Docker 컨테이너 실행 (DB, Redis)

프로젝트 루트에서 실행합니다.

```bash
cd C:/Claude_AI/KCS_WMS
docker compose up -d
```

실행되는 컨테이너:

| 컨테이너 | 이미지 | 포트 |
|-----------|--------|------|
| kcs-wms-mariadb | mariadb:10.11 | 3306 |
| kcs-wms-redis | redis:7-alpine | 6379 |

### 컨테이너 상태 확인

```bash
docker ps
```

두 컨테이너 모두 `Up` 상태인지 확인합니다.

### DB 접속 정보

| 항목 | 값 |
|------|-----|
| Host | localhost |
| Port | 3306 |
| Database | kcs_wms_db |
| User | clip_user |
| Password | clip_dev_password_2024 |
| Root Password | root |

---

## 4. 환경변수 파일 생성

> .env 파일은 Git에 포함되지 않으므로 수동으로 생성해야 합니다.

### 4-1. Backend 환경변수

`backend/.env` 파일을 생성합니다:

```bash
cat > backend/.env << 'EOF'
# ─── 포트 고정 (변경 금지) ──────────────────────────
# Backend: 4100 | Frontend: 3200 | API Tester: 3300
# DB: 3306 | Redis: 6379 | MinIO: 9000
# ─────────────────────────────────────────────────────

# Database (MariaDB)
DATABASE_URL=mysql://clip_user:clip_dev_password_2024@localhost:3306/kcs_wms_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=kcs-wms-dev-secret-key
JWT_EXPIRES_IN=7d

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=kcs-wms

# Application (포트 고정 - main.ts에서 하드코딩됨)
PORT=4100
NODE_ENV=development
EOF
```

### 4-2. Frontend 환경변수

`frontend/.env.local` 파일을 생성합니다:

```bash
cat > frontend/.env.local << 'EOF'
# ─── 포트 고정 (변경 금지) ──────────────────────────
# Frontend: 3200 | Backend API: 4100
# ─────────────────────────────────────────────────────

# API URL은 lib/api.ts에서 하드코딩됨 (http://localhost:4100/api)
# 아래 변수는 참조용 (실제 사용하지 않음)
NEXT_PUBLIC_API_URL=http://localhost:4100/api
EOF
```

---

## 5. Backend 설정 및 실행

### 5-1. 패키지 설치

```bash
cd C:/Claude_AI/KCS_WMS/backend
npm install
```

### 5-2. Prisma 클라이언트 생성

```bash
npx prisma generate
```

### 5-3. DB 마이그레이션 (테이블 생성)

```bash
npx prisma migrate dev
```

> 마이그레이션 이름을 묻는 경우 Enter로 넘어가면 됩니다.

### 5-4. 시드 데이터 입력 (선택)

```bash
npm run db:seed
```

### 5-5. Backend 서버 실행

```bash
npm run dev
```

정상 실행 시 출력:

```
[Nest] ... LOG [NestApplication] Nest application successfully started
Backend running on http://localhost:4100
```

---

## 6. Frontend 설정 및 실행

> 새 터미널을 열어서 실행합니다.

### 6-1. 패키지 설치

```bash
cd C:/Claude_AI/KCS_WMS/frontend
npm install
```

### 6-2. Frontend 서버 실행

```bash
npm run dev
```

정상 실행 시 출력:

```
  ▲ Next.js 15.1.0
  - Local: http://localhost:3200
```

---

## 7. 실행 확인

모든 설정이 완료되면 브라우저에서 확인합니다:

| 서비스 | URL |
|--------|-----|
| Frontend (메인 화면) | http://localhost:3200 |
| Backend API | http://localhost:4100/api |
| Swagger API 문서 | http://localhost:4100/api/docs |

---

## 8. 일일 작업 루틴

### 아침 (작업 시작)

```bash
# 1. Docker 컨테이너 확인/시작
docker compose up -d

# 2. 최신 코드 받기
cd C:/Claude_AI/KCS_WMS
git pull origin main

# 3. 패키지 변경 있으면 재설치
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 4. Backend 실행 (터미널 1)
cd C:/Claude_AI/KCS_WMS/backend
npm run dev

# 5. Frontend 실행 (터미널 2)
cd C:/Claude_AI/KCS_WMS/frontend
npm run dev
```

### 저녁 (작업 종료)

```bash
# 변경사항 커밋 & 푸시
cd C:/Claude_AI/KCS_WMS
git add .
git commit -m "작업 내용 설명"
git push origin main
```

---

## 9. 포트 정보 (고정 - 변경 금지)

| 서비스 | 포트 | 설정 위치 |
|--------|------|-----------|
| Frontend (Next.js) | 3200 | `frontend/package.json` |
| Backend (NestJS) | 4100 | `backend/src/main.ts` |
| API Tester | 3300 | `python3 -m http.server 3300` |
| MariaDB | 3306 | `docker-compose.yml` |
| Redis | 6379 | `docker-compose.yml` |
| MinIO | 9000 | Docker |
| Swagger Docs | 4100/api/docs | Backend 내장 |

---

## 10. 문제 해결

### Docker 관련

```bash
# 컨테이너 로그 확인
docker logs kcs-wms-mariadb
docker logs kcs-wms-redis

# 컨테이너 재시작
docker compose down
docker compose up -d

# 데이터 초기화 (주의: DB 데이터 삭제됨)
docker compose down -v
docker compose up -d
```

### DB 관련

```bash
# Prisma Studio (DB 데이터 브라우저)
cd backend
npx prisma studio
# → http://localhost:5555 에서 데이터 확인

# DB 스키마 변경 후 마이그레이션
npx prisma migrate dev --name 변경설명

# DB 완전 초기화 (주의: 모든 데이터 삭제)
npx prisma migrate reset
```

### 포트 충돌

해당 포트를 사용중인 프로세스 확인 및 종료:

```bash
# Windows (PowerShell에서)
netstat -ano | findstr :3200
netstat -ano | findstr :4100
taskkill /PID <PID번호> /F
```

### npm install 에러

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

---

## 전체 명령어 요약 (처음부터 끝까지)

```bash
# 1. 클론
mkdir C:/Claude_AI && cd C:/Claude_AI
git clone https://github.com/ahja777/KCS_WMS.git
cd KCS_WMS

# 2. Docker 실행
docker compose up -d

# 3. Backend 환경변수 생성
cat > backend/.env << 'EOF'
DATABASE_URL=mysql://clip_user:clip_dev_password_2024@localhost:3306/kcs_wms_db
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=kcs-wms-dev-secret-key
JWT_EXPIRES_IN=7d
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=kcs-wms
PORT=4100
NODE_ENV=development
EOF

# 4. Frontend 환경변수 생성
cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:4100/api
EOF

# 5. Backend 설치 및 실행
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev

# 6. Frontend 설치 및 실행 (새 터미널)
cd C:/Claude_AI/KCS_WMS/frontend
npm install
npm run dev
```
