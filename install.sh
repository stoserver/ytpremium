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
    echo "⚠️  .env 파일을 열어서 DISCORD_TOKEN과 CLIENT_ID를 입력해주세요!"
else
    echo ""
    echo "✅ .env 파일이 이미 존재합니다."
fi

# config.json 파일 확인
if [ ! -f config.json ]; then
    echo ""
    echo "📝 config.json 파일 생성 중..."
    cp config.example.json config.json
    echo "✅ config.json 파일이 생성되었습니다."
    echo "⚠️  config.json 파일을 열어서 채널 ID와 역할 ID를 입력해주세요!"
else
    echo ""
    echo "✅ config.json 파일이 이미 존재합니다."
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
echo "1. .env 파일을 열어서 봇 토큰과 클라이언트 ID를 입력하세요"
echo "2. config.json 파일을 열어서 채널 ID와 역할 ID를 입력하세요"
echo "3. 봇을 시작하려면 다음 명령어를 실행하세요:"
echo ""
echo "   개발 모드:  npm run dev"
echo "   일반 실행:  npm start"
echo "   PM2 사용:   npm run pm2:start"
echo ""
