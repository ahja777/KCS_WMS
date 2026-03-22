# KCS WMS 포트 설정 (고정 - 변경 금지)

| 서비스 | 포트 | 설정 위치 |
|--------|------|-----------|
| **Frontend (Next.js)** | `3200` | `frontend/package.json` → `dev: next dev -p 3200` |
| **Backend (NestJS)** | `4100` | `backend/src/main.ts` → `BACKEND_PORT = 4100` |
| **API Tester** | `3300` | `python3 -m http.server 3300` |
| **MariaDB** | `3306` | Docker `kcs-wms-mariadb` |
| **Redis** | `6379` | Docker `clip-redis` |
| **MinIO** | `9000` | Docker `clip-minio` |
| **Swagger Docs** | `4100/api/docs` | Backend 내장 |

## 포트 고정 위치

- `backend/src/main.ts` → `BACKEND_PORT = 4100`, `FRONTEND_URL = 'http://localhost:3200'`
- `frontend/src/lib/api.ts` → `API_BASE_URL = 'http://localhost:4100/api'`
- `frontend/package.json` → `"dev": "next dev -p 3200"`, `"start": "next start -p 3200"`
- `backend/.env` → `PORT=4100` (참조용, main.ts에서 하드코딩)

## 실행 명령

```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev

# API Tester
cd api-tester && python3 -m http.server 3300
```
