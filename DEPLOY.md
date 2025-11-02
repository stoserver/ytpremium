# 우분투 서버 배포 가이드

이 가이드는 우분투 서버에서 YouTube Premium Manager Bot을 배포하는 방법을 설명합니다.

## 사전 요구사항

### 1. Node.js 설치

```bash
# Node.js 20.x LTS 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 버전 확인
node -v
npm -v
```

### 2. Git 설치 (선택사항)

```bash
sudo apt-get update
sudo apt-get install git
```

## 설치 방법

### 옵션 1: Git Clone (권장)

```bash
# 저장소 클론
git clone <repository-url>
cd ytpremium

# 설치 스크립트 실행
chmod +x install.sh
./install.sh
```

### 옵션 2: 직접 파일 업로드

1. 프로젝트 파일을 서버에 업로드
2. 프로젝트 디렉토리로 이동
3. 설치 스크립트 실행:

```bash
chmod +x install.sh
./install.sh
```

## 설정

### 1. Discord Bot 토큰 설정

`.env` 파일을 편집:

```bash
nano .env
```

다음 내용을 입력:

```env
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_client_id_here
```

저장: `Ctrl + O`, `Enter`, `Ctrl + X`

### 2. 봇 설정

`config.json` 파일을 편집:

```bash
nano config.json
```

다음 내용을 입력:

```json
{
  "panelChannelId": "1234567890123456789",
  "ownerRoleId": "1234567890123456789",
  "ticketManagerRoleId": "1234567890123456789",
  "ticketCategoryId": "1234567890123456789"
}
```

**ID 찾는 방법:**
1. Discord 설정 → 고급 → 개발자 모드 활성화
2. 채널/역할 우클릭 → ID 복사

저장: `Ctrl + O`, `Enter`, `Ctrl + X`

## 봇 실행

### PM2를 사용한 실행 (권장)

PM2는 프로세스 관리자로, 봇이 자동으로 재시작되고 백그라운드에서 실행됩니다.

```bash
# 봇 시작
./start.sh

# 또는
npm run pm2:start
```

### 유용한 PM2 명령어

```bash
# 봇 상태 확인
npm run pm2:status

# 로그 실시간 보기
npm run pm2:logs

# 봇 재시작
npm run pm2:restart

# 봇 중지
npm run pm2:stop
# 또는
./stop.sh

# 봇 완전 삭제 (PM2에서)
npm run pm2:delete
```

### 일반 실행 (테스트용)

```bash
# 개발 모드 (자동 재시작)
npm run dev

# 일반 실행
npm start
```

## 서버 재부팅 시 자동 시작 설정

서버가 재부팅되어도 봇이 자동으로 시작되도록 설정:

```bash
# PM2 startup 설정
pm2 startup

# 위 명령어가 출력하는 명령어를 복사해서 실행 (sudo로 시작)
# 예: sudo env PATH=$PATH:/usr/bin...

# 현재 실행 중인 프로세스 저장
pm2 save
```

이제 서버가 재부팅되어도 봇이 자동으로 시작됩니다!

## 업데이트 방법

### 자동 업데이트 (권장)

**방법 1: Discord 명령어 사용**

Discord에서 `/업데이트` 명령어를 실행하면 자동으로 업데이트됩니다:
- GitHub에서 최신 코드 자동 다운로드
- 의존성 자동 업데이트
- 설정 파일 자동 백업 및 복원
- 봇 자동 재시작

**방법 2: 서버에서 직접 실행**

```bash
# 자동 업데이트 스크립트 실행
./update.sh
```

업데이트 스크립트가 자동으로:
1. 현재 설정 파일 백업 (.env, config.json, database.json)
2. GitHub에서 최신 코드 가져오기
3. npm 의존성 업데이트
4. 설정 파일 복원
5. PM2로 봇 재시작

### 수동 업데이트

Git을 직접 사용하여 업데이트:

```bash
# 최신 코드 가져오기
git pull origin main

# 의존성 업데이트
npm install

# 봇 재시작
npm run pm2:restart
```

### 파일 업로드 방식

1. 새 파일을 서버에 업로드
2. 의존성 설치: `npm install`
3. 봇 재시작: `npm run pm2:restart`

## 로그 확인

### PM2 로그

```bash
# 실시간 로그 보기
npm run pm2:logs

# 에러 로그만 보기
pm2 logs youtube-premium-bot --err

# 출력 로그만 보기
pm2 logs youtube-premium-bot --out
```

### 파일 로그

로그 파일 위치:
- `logs/out.log` - 일반 출력
- `logs/error.log` - 에러 로그
- `logs/combined.log` - 통합 로그

```bash
# 로그 보기
tail -f logs/combined.log

# 에러 로그만 보기
tail -f logs/error.log
```

## 문제 해결

### 봇이 시작되지 않는 경우

1. 로그 확인:
```bash
npm run pm2:logs
```

2. 토큰과 설정 확인:
```bash
cat .env
cat config.json
```

3. PM2 프로세스 완전 삭제 후 재시작:
```bash
npm run pm2:delete
npm run pm2:start
```

### 권한 문제

```bash
# 스크립트 실행 권한 부여
chmod +x *.sh

# Node.js 권한 문제 시
sudo chown -R $USER:$USER .
```

### 포트 충돌

Discord 봇은 포트를 사용하지 않으므로 포트 충돌은 발생하지 않습니다.

### 메모리 부족

`ecosystem.config.js`에서 메모리 제한 조정:

```javascript
max_memory_restart: '1G'  // 필요에 따라 조정
```

## 보안

### 1. .env 파일 보호

```bash
# .env 파일 권한 제한
chmod 600 .env
```

### 2. 방화벽 설정 (선택사항)

Discord 봇은 아웃바운드 연결만 사용하므로 방화벽 설정이 필요하지 않지만, 서버 보안을 위해 SSH만 허용하는 것을 권장:

```bash
# UFW 방화벽 설치 (우분투)
sudo apt-get install ufw

# SSH 허용
sudo ufw allow ssh

# 방화벽 활성화
sudo ufw enable

# 상태 확인
sudo ufw status
```

## 모니터링

### PM2 Monitoring

```bash
# PM2 웹 대시보드 (선택사항)
pm2 install pm2-server-monit
```

### 시스템 리소스 확인

```bash
# CPU/메모리 사용량
htop

# 또는
top

# 디스크 사용량
df -h
```

## 백업

### 데이터베이스 백업

```bash
# 백업 스크립트 생성
nano backup.sh
```

다음 내용 추가:

```bash
#!/bin/bash
BACKUP_DIR="backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp database.json $BACKUP_DIR/database_$DATE.json

echo "백업 완료: $BACKUP_DIR/database_$DATE.json"
```

실행 권한 부여 및 실행:

```bash
chmod +x backup.sh
./backup.sh
```

### Cron을 사용한 자동 백업

```bash
# crontab 편집
crontab -e

# 매일 새벽 3시에 백업 (마지막 줄에 추가)
0 3 * * * /home/user/ytpremium/backup.sh
```

## 시스템 요구사항

- **OS**: Ubuntu 20.04 LTS 이상 권장
- **Node.js**: 18.x 이상
- **RAM**: 최소 512MB, 권장 1GB
- **디스크**: 최소 1GB 여유 공간
- **네트워크**: 안정적인 인터넷 연결

## 추가 도움말

### Screen 사용 (PM2 대신)

PM2를 사용하지 않고 screen을 사용하려면:

```bash
# screen 설치
sudo apt-get install screen

# 새 screen 세션 시작
screen -S ytbot

# 봇 실행
npm start

# screen에서 나가기 (봇은 계속 실행)
Ctrl + A, D

# screen 세션 다시 접속
screen -r ytbot

# screen 세션 목록
screen -ls

# screen 세션 종료
screen -X -S ytbot quit
```

하지만 **PM2 사용을 강력히 권장**합니다!

## 문의

문제가 발생하면 로그를 확인하고 GitHub Issues에 문의하세요.
