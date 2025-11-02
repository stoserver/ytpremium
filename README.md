# YouTube Premium Manager Bot

유튜브 프리미엄 구독자를 관리하는 Discord 봇입니다.

## 주요 기능

### 사용자 기능
- **패널 시스템**: 버튼 클릭으로 정보 확인 및 티켓 생성
- **다중 계정 지원**: 한 유저가 여러 개의 YouTube Premium 계정을 등록 가능
- **내 정보 확인**: 드롭다운 메뉴로 여러 계정 중 선택하여 정보 확인
- **티켓 시스템**: 관리자와 1:1 문의 채널 생성

### 관리자 기능
- `/유저추가`: YouTube Premium 계정 추가 (여러 개 등록 가능)
- `/정보조회`: 특정 유저의 계정 정보 조회
- `/패널재전송`: 정보 확인 패널 재전송
- `/티켓닫기`: 티켓 채널 닫기
- `/업데이트`: 봇 자동 업데이트 (GitHub에서 최신 버전 다운로드)

## 빠른 시작

### 자동 설치 (권장)

```bash
# 1. 저장소 클론
git clone <repository-url>
cd ytpremium

# 2. 설치 스크립트 실행
chmod +x install.sh
./install.sh

# 3. .env 파일 편집 (봇 토큰 입력)
nano .env

# 4. config.json 파일 편집 (채널/역할 ID 입력)
nano config.json

# 5. 봇 시작 (PM2 사용, 백그라운드 실행)
./start.sh
```

### 수동 설치

1. **의존성 설치**:
```bash
npm install
```

2. **환경 변수 설정**:
`.env.example` 파일을 `.env`로 복사하고 다음 정보를 입력하세요:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
```

3. **설정 파일 구성**:
`config.example.json`을 `config.json`으로 복사하고 다음 정보를 설정하세요:
```json
{
  "panelChannelId": "패널을_전송할_채널_ID",
  "ownerRoleId": "오너_역할_ID",
  "ticketManagerRoleId": "티켓관리자_역할_ID",
  "ticketCategoryId": "티켓_카테고리_ID"
}
```

**채널/역할 ID 찾는 방법**:
1. Discord 설정 > 고급 > 개발자 모드 활성화
2. 채널/역할 우클릭 > ID 복사

4. **봇 실행**:

개발 모드 (테스트용):
```bash
npm run dev
```

일반 실행:
```bash
npm start
```

**PM2 사용 (백그라운드 실행, 자동 재시작)**:
```bash
npm run pm2:start  # 시작
npm run pm2:logs   # 로그 보기
npm run pm2:status # 상태 확인
npm run pm2:stop   # 중지
```

### 우분투 서버 배포

우분투 서버에 배포하는 방법은 [DEPLOY.md](DEPLOY.md)를 참고하세요.

## Discord 봇 설정 방법

1. [Discord Developer Portal](https://discord.com/developers/applications)에 접속
2. "New Application" 클릭하여 새 애플리케이션 생성
3. 왼쪽 메뉴에서 "Bot" 선택
4. "Add Bot" 클릭
5. "TOKEN" 섹션에서 "Reset Token" 클릭 후 토큰 복사 → `.env`의 `DISCORD_TOKEN`에 입력
6. "General Information" 메뉴에서 "APPLICATION ID" 복사 → `.env`의 `CLIENT_ID`에 입력
7. "OAuth2" → "URL Generator"에서 다음을 선택:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Administrator` (또는 필요한 권한만 선택)
8. 생성된 URL로 봇을 서버에 초대

## 명령어 사용법

### 📊 `/유저추가` (관리자 전용)
YouTube Premium 구독 계정을 추가합니다. **같은 유저에게 여러 개 추가 가능**합니다.

**파라미터:**
- `유저`: 추가할 유저를 멘션
- `구매상품`: 6개월 또는 1년 선택
- `이메일`: 유튜브 프리미엄 계정 이메일

**예시:**
```
/유저추가 유저:@사용자 구매상품:1년 이메일:example@gmail.com
```

**결과:**
- 계정 정보가 데이터베이스에 저장됩니다
- 등록 정보가 임베드로 표시됩니다
- 총 계정 수가 표시됩니다
- 해당 유저에게 DM으로 구독 정보가 전송됩니다

### 📋 `/정보조회` (관리자 전용)
특정 유저의 YouTube Premium 계정 정보를 조회합니다.

**파라미터:**
- `유저`: 조회할 유저를 멘션

**예시:**
```
/정보조회 유저:@사용자
```

**결과:**
- 계정이 1개인 경우: 바로 정보 표시
- 계정이 여러 개인 경우: 드롭다운 메뉴에서 선택

### 📢 `/패널재전송` (관리자 전용)
설정된 채널에 정보 확인 패널을 재전송합니다.

**사전 요구사항:**
- `config.json`의 `panelChannelId` 설정 필요

**예시:**
```
/패널재전송
```

### 🔒 `/티켓닫기`
현재 티켓 채널을 닫습니다. (티켓 채널에서만 사용 가능)

**예시:**
```
/티켓닫기
```

### 🔄 `/업데이트` (관리자 전용)
봇을 최신 버전으로 자동 업데이트합니다.

**기능:**
- GitHub에서 최신 코드 자동 다운로드
- 의존성 자동 업데이트
- 설정 파일 자동 백업 및 복원
- 봇 자동 재시작

**예시:**
```
/업데이트
```

**참고:**
- 업데이트 중 설정 파일(.env, config.json, database.json)은 자동으로 백업됩니다
- 업데이트 완료 후 봇이 자동으로 재시작됩니다
- 또는 서버에서 직접: `./update.sh`

## 패널 사용법 (일반 유저)

### 📊 내 정보 확인
1. 패널에서 `📊 내 정보 확인` 버튼 클릭
2. 계정이 1개인 경우: 바로 정보 표시
3. 계정이 여러 개인 경우: 드롭다운에서 확인할 계정 선택

**표시 정보:**
- 유저명
- 이메일
- 구매 상품
- 구매일
- 만료일
- 구독 상태
- 남은 기간

**상태 표시:**
- ✅ 활성: 만료까지 30일 이상
- ⏰ 활성 (만료 임박): 만료까지 8~30일
- ⚠️ 곧 만료: 만료까지 7일 이하
- ❌ 만료됨: 구독 만료

### 🎫 티켓 생성
1. 패널에서 `🎫 티켓 생성` 버튼 클릭
2. 자동으로 개인 티켓 채널 생성
3. 오너 및 티켓 관리자가 자동으로 멘션됨
4. 문의사항 작성
5. 완료 후 `/티켓닫기` 명령어로 종료

## 프로젝트 구조

```
ytpremium/
├── commands/              # 슬래시 명령어
│   ├── 유저추가.js
│   ├── 정보조회.js
│   ├── 패널재전송.js
│   ├── 티켓닫기.js
│   └── 업데이트.js
├── handlers/              # 인터랙션 핸들러
│   ├── buttonHandler.js   # 버튼 처리
│   └── selectMenuHandler.js  # 드롭다운 처리
├── utils/                 # 유틸리티
│   ├── database.js        # 데이터베이스 관리
│   └── panel.js           # 패널 생성
├── index.js               # 메인 봇 파일
├── config.json            # 봇 설정 (채널 ID, 역할 ID)
├── database.json          # 유저 데이터 저장
├── package.json           # 프로젝트 설정
├── .env                   # 환경 변수
├── .env.example           # 환경 변수 예시
└── README.md              # 문서
```

## 데이터베이스 구조

```json
{
  "users": {
    "discord_user_id": {
      "accounts": [
        {
          "id": "unique_account_id",
          "email": "user@example.com",
          "product": "1년",
          "purchaseDate": "2024-01-01T00:00:00.000Z",
          "expiryDate": "2025-01-01T00:00:00.000Z",
          "addedBy": "admin_discord_id",
          "addedAt": "2024-01-01T00:00:00.000Z"
        },
        {
          "id": "another_unique_id",
          "email": "user2@example.com",
          "product": "6개월",
          "purchaseDate": "2024-06-01T00:00:00.000Z",
          "expiryDate": "2024-12-01T00:00:00.000Z",
          "addedBy": "admin_discord_id",
          "addedAt": "2024-06-01T00:00:00.000Z"
        }
      ]
    }
  }
}
```

## Config 구조

```json
{
  "panelChannelId": "1234567890123456789",
  "ownerRoleId": "1234567890123456789",
  "ticketManagerRoleId": "1234567890123456789",
  "ticketCategoryId": "1234567890123456789"
}
```

**설정 항목:**
- `panelChannelId`: 패널을 전송할 채널 ID
- `ownerRoleId`: 오너 역할 ID (티켓에서 멘션됨)
- `ticketManagerRoleId`: 티켓 관리자 역할 ID (티켓에서 멘션됨)
- `ticketCategoryId`: 티켓이 생성될 카테고리 ID

## 주요 특징

### ✨ 다중 계정 지원
- 한 유저가 여러 YouTube Premium 계정 등록 가능
- 드롭다운 메뉴로 계정 선택하여 정보 확인
- 각 계정별로 독립적인 만료일 관리

### 🎨 직관적인 UI
- 버튼 기반 패널 시스템
- 색상으로 구분되는 상태 표시
- 임베드로 깔끔한 정보 표시

### 🔐 권한 관리
- 관리자 전용 명령어
- 티켓별 개별 권한 설정
- 안전한 개인정보 처리 (ephemeral 메시지)

### 📱 알림 시스템
- 계정 추가 시 DM 알림
- 만료 임박 경고
- 티켓 생성 시 관리자 멘션

## 라이센스

MIT
