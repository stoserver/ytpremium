#!/bin/bash

echo "🚀 YouTube Premium Manager Bot 시작..."
echo ""

# .env 파일 확인
if [ ! -f .env ]; then
    echo "❌ .env 파일이 없습니다!"
    echo "install.sh를 먼저 실행하거나 .env 파일을 생성해주세요."
    exit 1
fi

# config.json 파일 확인
if [ ! -f config.json ]; then
    echo "❌ config.json 파일이 없습니다!"
    echo "install.sh를 먼저 실행하거나 config.json 파일을 생성해주세요."
    exit 1
fi

# PM2 설치 확인
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2가 설치되어 있지 않습니다. npm으로 설치합니다..."
    npm install
fi

# PM2로 봇 시작
echo "🔄 PM2로 봇 시작 중..."
npm run pm2:start

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 봇이 성공적으로 시작되었습니다!"
    echo ""
    echo "유용한 명령어:"
    echo "  상태 확인:  npm run pm2:status"
    echo "  로그 보기:  npm run pm2:logs"
    echo "  재시작:     npm run pm2:restart"
    echo "  중지:       npm run pm2:stop"
    echo "  삭제:       npm run pm2:delete"
    echo ""
    echo "로그 보기를 시작합니다..."
    sleep 2
    npm run pm2:logs
else
    echo ""
    echo "❌ 봇 시작 실패"
    exit 1
fi
