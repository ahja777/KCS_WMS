#!/bin/bash
# KCS WMS 팀 구성 - tmux 수직분할 (팀장1 + 팀원3)

SESSION="kcs-team"
PROJECT_DIR="/Users/hur_chulwon/Project/AI_Claude/Clip/KCS_WMS"

# 기존 세션 종료
tmux kill-session -t "$SESSION" 2>/dev/null

# 새 세션 생성 (팀장 - Pane 0)
tmux new-session -d -s "$SESSION" -c "$PROJECT_DIR" -x 300 -y 50

# 팀원 3명 수직분할 추가
tmux split-window -h -t "$SESSION" -c "$PROJECT_DIR"
tmux split-window -h -t "$SESSION" -c "$PROJECT_DIR"
tmux split-window -h -t "$SESSION" -c "$PROJECT_DIR"

# 균등 분할
tmux select-layout -t "$SESSION" even-horizontal

# 각 팬에 역할별 Claude 실행
# Pane 0: 팀장 (PM/Tech Lead)
tmux send-keys -t "$SESSION:0.0" "claude -c --dangerously-skip-permissions -p '당신은 KCS WMS 프로젝트의 **팀장(Tech Lead)**입니다.
역할:
- 전체 아키텍처 설계 및 기술 의사결정
- 팀원들에게 작업 지시 및 코드 리뷰
- Backend(NestJS) + Frontend(React) 전체 통합 관리
- DB 스키마 설계 및 API 설계 총괄
- 품질 관리 및 배포 전략 수립

포트: BE=4100, FE=3200, DB=3306
현재 디렉토리의 코드를 분석하고 팀원들에게 지시할 작업을 정리해주세요.'" Enter

# Pane 1: 팀원1 (Backend Developer)
tmux send-keys -t "$SESSION:0.1" "claude -c --dangerously-skip-permissions -p '당신은 KCS WMS 프로젝트의 **팀원1(Backend Developer)**입니다.
역할:
- NestJS 기반 Backend API 개발
- TypeORM 엔티티 및 DB 마이그레이션 관리
- REST API 엔드포인트 구현 (Controller/Service/Repository)
- 인증/인가 (JWT, Guard) 구현
- 비즈니스 로직 구현 및 단위 테스트

포트: BE=4100, DB=3306
backend 디렉토리의 코드를 분석하고 현재 상태를 파악해주세요.'" Enter

# Pane 2: 팀원2 (Frontend Developer)
tmux send-keys -t "$SESSION:0.2" "claude -c --dangerously-skip-permissions -p '당신은 KCS WMS 프로젝트의 **팀원2(Frontend Developer)**입니다.
역할:
- React + TypeScript 기반 Frontend UI 개발
- Ant Design 컴포넌트 활용한 화면 구현
- API 연동 (Axios) 및 상태관리
- 라우팅 및 레이아웃 구성
- 반응형 디자인 및 UX 최적화

포트: FE=3200, BE API=4100
frontend 디렉토리의 코드를 분석하고 현재 상태를 파악해주세요.'" Enter

# Pane 3: 팀원3 (DB/Infra Engineer)
tmux send-keys -t "$SESSION:0.3" "claude -c --dangerously-skip-permissions -p '당신은 KCS WMS 프로젝트의 **팀원3(DB/Infra Engineer)**입니다.
역할:
- MySQL 데이터베이스 스키마 설계 및 최적화
- Docker 컨테이너 관리 및 인프라 구성
- DB 인덱싱, 쿼리 최적화, 백업 전략
- CI/CD 파이프라인 구성
- 환경설정 및 배포 스크립트 관리

포트: DB=3306, BE=4100, FE=3200
DB 스키마, Docker 설정, 환경설정 파일을 분석하고 현재 상태를 파악해주세요.'" Enter

# 팀장 팬으로 포커스
tmux select-pane -t "$SESSION:0.0"

# 세션 연결
tmux attach-session -t "$SESSION"
