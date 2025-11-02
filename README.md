# YouTube Premium Manager Bot

유튜브 프리미엄 구독자를 관리하는 Discord 봇입니다.

## 기능

- `/유저추가`: 유튜브 프리미엄 구독 유저 추가 (관리자 전용)
- `/내정보`: 자신의 구독 정보 확인

## 설치 방법

1. 의존성 설치:
```bash
npm install
```

2. 환경 변수 설정:
`.env.example` 파일을 `.env`로 복사하고 다음 정보를 입력하세요:
```
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
```

3. 봇 실행:
```bash
npm start
```

개발 모드 (nodemon):
```bash
npm run dev
```

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

### `/유저추가` (관리자 전용)
유튜브 프리미엄 구독 유저를 추가합니다.

**파라미터:**
- `유저`: 추가할 유저를 멘션
- `구매상품`: 6개월 또는 1년 선택
- `이메일`: 유튜브 프리미엄 계정 이메일

**예시:**
```
/유저추가 유저:@사용자 구매상품:1년 이메일:example@gmail.com
```

**결과:**
- 유저 정보가 데이터베이스에 저장됩니다
- 등록 정보가 임베드로 표시됩니다
- 해당 유저에게 DM으로 구독 정보가 전송됩니다 (가능한 경우)

### `/내정보`
자신의 유튜브 프리미엄 구독 정보를 확인합니다.

**표시 정보:**
- 유저명
- 등록된 이메일
- 구매 상품
- 구매일
- 만료일
- 구독 상태 (활성/만료 임박/만료됨)
- 남은 기간

**상태 표시:**
- ✅ 활성: 만료까지 30일 이상 남음
- ⏰ 활성 (만료 임박): 만료까지 8~30일 남음
- ⚠️ 곧 만료: 만료까지 7일 이하 남음
- ❌ 만료됨: 구독이 만료됨

## 프로젝트 구조

```
ytpremium/
├── commands/           # 슬래시 명령어 파일
│   ├── 유저추가.js
│   └── 내정보.js
├── utils/             # 유틸리티 함수
│   └── database.js    # 데이터베이스 관리
├── index.js           # 메인 봇 파일
├── database.json      # 유저 데이터 저장
├── package.json       # 프로젝트 설정
├── .env              # 환경 변수 (생성 필요)
├── .env.example      # 환경 변수 예시
└── README.md         # 문서
```

## 데이터베이스 구조

```json
{
  "users": {
    "discord_user_id": {
      "email": "user@example.com",
      "product": "1년",
      "purchaseDate": "2024-01-01T00:00:00.000Z",
      "expiryDate": "2025-01-01T00:00:00.000Z",
      "addedBy": "admin_discord_id",
      "addedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## 라이센스

MIT
