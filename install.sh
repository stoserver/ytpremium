#!/bin/bash

echo "🎬 YouTube Premium Manager Bot 설치 시작..."
echo ""

# Node.js 버전 확인
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되어 있지 않습니다."
    echo "Node.js를 먼저 설치해주세요: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js 버전: $NODE_VERSION"

# npm 의존성 설치
echo ""
echo "📦 의존성 설치 중..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 의존성 설치 실패"
    exit 1
fi

echo "✅ 의존성 설치 완료"

# .env 파일 생성
if [ ! -f .env ]; then
    echo ""
    echo "📝 .env 파일 생성 중..."
    cp .env.example .env
    echo "✅ .env 파일이 생성되었습니다."
    echo "⚠️  .env 파일을 열어서 DISCORD_TOKEN, CLIENT_ID, GUILD_ID를 입력해주세요!"
else
    echo ""
    echo "✅ .env 파일이 이미 존재합니다."
fi

# logs 디렉토리 생성
if [ ! -d logs ]; then
    mkdir logs
    echo ""
    echo "✅ logs 디렉토리 생성 완료"
fi

echo ""
echo "✅ 설치 완료!"
echo ""
echo "다음 단계:"
echo "1. .env 파일을 열어서 DISCORD_TOKEN, CLIENT_ID, GUILD_ID를 입력하세요"
echo "2. 봇을 시작하려면 다음 명령어를 실행하세요:"
echo ""
echo "   개발 모드:  npm run dev"
echo "   일반 실행:  npm start"
echo "   PM2 사용:   npm run pm2:start"
echo ""
echo "3. 봇이 시작되면 Discord에서 /시작하기 명령어를 실행하여 초기 설정을 완료하세요"
echo ""
