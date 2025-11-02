#!/bin/bash

echo "🔄 YouTube Premium Manager Bot 업데이트 시작..."
echo ""

# Git 저장소 URL
REPO_URL="https://github.com/stoserver/ytpremium.git"

# Git 설치 확인
if ! command -v git &> /dev/null; then
    echo "❌ Git이 설치되어 있지 않습니다."
    echo "Git을 먼저 설치해주세요: sudo apt-get install git"
    exit 1
fi

# Git 저장소인지 확인
if [ ! -d .git ]; then
    echo "⚠️  현재 디렉토리가 Git 저장소가 아닙니다."
    echo "Git 저장소를 초기화합니다..."
    git init
    git remote add origin $REPO_URL
fi

# 현재 브랜치 확인
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
if [ -z "$CURRENT_BRANCH" ]; then
    CURRENT_BRANCH="main"
fi

echo "📍 현재 브랜치: $CURRENT_BRANCH"
echo ""

# 변경사항 백업
echo "💾 현재 설정 파일 백업 중..."
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# 중요 파일 백업
if [ -f .env ]; then
    cp .env $BACKUP_DIR/.env
    echo "✅ .env 백업 완료"
fi

if [ -f config.json ]; then
    cp config.json $BACKUP_DIR/config.json
    echo "✅ config.json 백업 완료"
fi

if [ -f database.json ]; then
    cp database.json $BACKUP_DIR/database.json
    echo "✅ database.json 백업 완료"
fi

echo ""
echo "🔄 최신 코드 가져오는 중..."

# Stash 현재 변경사항
git stash push -m "Auto-stash before update $(date +%Y%m%d_%H%M%S)"

# 원격 저장소에서 최신 코드 가져오기
git fetch origin

# 현재 브랜치를 최신으로 업데이트
if git pull origin $CURRENT_BRANCH; then
    echo "✅ 코드 업데이트 완료"
else
    echo "⚠️  Pull 실패. main 브랜치로 시도합니다..."
    if git pull origin main; then
        echo "✅ 코드 업데이트 완료 (main 브랜치)"
    else
        echo "❌ 코드 업데이트 실패"
        echo "수동으로 해결이 필요합니다."
        exit 1
    fi
fi

echo ""
echo "📦 의존성 업데이트 중..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 의존성 설치 실패"
    exit 1
fi

echo "✅ 의존성 업데이트 완료"

# 설정 파일 복원
echo ""
echo "🔧 설정 파일 복원 중..."

if [ -f $BACKUP_DIR/.env ]; then
    cp $BACKUP_DIR/.env .env
    echo "✅ .env 복원 완료"
fi

if [ -f $BACKUP_DIR/config.json ]; then
    cp $BACKUP_DIR/config.json config.json
    echo "✅ config.json 복원 완료"
fi

if [ -f $BACKUP_DIR/database.json ]; then
    cp $BACKUP_DIR/database.json database.json
    echo "✅ database.json 복원 완료"
fi

# PM2로 실행 중인지 확인
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "youtube-premium-bot"; then
        echo ""
        echo "🔄 봇 재시작 중..."
        npm run pm2:restart

        if [ $? -eq 0 ]; then
            echo "✅ 봇 재시작 완료"
        else
            echo "⚠️  봇 재시작 실패. 수동으로 재시작해주세요."
        fi
    else
        echo ""
        echo "⚠️  봇이 PM2로 실행 중이 아닙니다."
        echo "봇을 시작하려면 ./start.sh를 실행하세요."
    fi
fi

echo ""
echo "✅ 업데이트 완료!"
echo ""
echo "백업 위치: $BACKUP_DIR"
echo ""
echo "상태 확인: npm run pm2:status"
echo "로그 확인: npm run pm2:logs"
echo ""
