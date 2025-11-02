#!/bin/bash

echo "🛑 YouTube Premium Manager Bot 중지..."
echo ""

npm run pm2:stop

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 봇이 중지되었습니다."
    echo ""
    echo "다시 시작하려면: ./start.sh 또는 npm run pm2:start"
    echo "완전히 삭제하려면: npm run pm2:delete"
else
    echo ""
    echo "❌ 봇 중지 실패 (이미 중지되었을 수 있습니다)"
fi
