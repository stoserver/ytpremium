const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.json');

// 데이터베이스 읽기
function readDB() {
    try {
        if (!fs.existsSync(dbPath)) {
            // 데이터베이스 파일이 없으면 생성
            const defaultDB = { users: {} };
            writeDB(defaultDB);
            return defaultDB;
        }
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('데이터베이스 읽기 오류:', error);
        return { users: {} };
    }
}

// 데이터베이스 쓰기
function writeDB(data) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('데이터베이스 쓰기 오류:', error);
        return false;
    }
}

// 고유 ID 생성
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 유저에게 계정 추가
function addAccount(userId, accountData) {
    const db = readDB();

    // 구매 날짜와 만료 날짜 계산
    const purchaseDate = new Date();
    const expiryDate = new Date(purchaseDate);

    // 구매상품에 따라 만료일 설정
    if (accountData.product === '6개월') {
        expiryDate.setMonth(expiryDate.getMonth() + 6);
    } else if (accountData.product === '1년') {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    const account = {
        id: generateId(),
        email: accountData.email,
        product: accountData.product,
        purchaseDate: purchaseDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        addedBy: accountData.addedBy,
        addedAt: purchaseDate.toISOString()
    };

    // 유저가 없으면 생성
    if (!db.users[userId]) {
        db.users[userId] = {
            accounts: []
        };
    }

    // 계정 추가
    db.users[userId].accounts.push(account);

    return writeDB(db) ? account : null;
}

// 유저의 모든 계정 가져오기
function getUserAccounts(userId) {
    const db = readDB();
    if (!db.users[userId]) {
        return [];
    }
    return db.users[userId].accounts || [];
}

// 특정 계정 가져오기
function getAccount(userId, accountId) {
    const accounts = getUserAccounts(userId);
    return accounts.find(acc => acc.id === accountId) || null;
}

// 계정 삭제
function deleteAccount(userId, accountId) {
    const db = readDB();
    if (!db.users[userId]) {
        return false;
    }

    const initialLength = db.users[userId].accounts.length;
    db.users[userId].accounts = db.users[userId].accounts.filter(acc => acc.id !== accountId);

    // 계정이 삭제되었는지 확인
    if (db.users[userId].accounts.length === initialLength) {
        return false;
    }

    // 모든 계정이 삭제되면 유저도 삭제
    if (db.users[userId].accounts.length === 0) {
        delete db.users[userId];
    }

    return writeDB(db);
}

// 유저 삭제
function deleteUser(userId) {
    const db = readDB();
    if (db.users[userId]) {
        delete db.users[userId];
        return writeDB(db);
    }
    return false;
}

// 모든 유저 가져오기
function getAllUsers() {
    const db = readDB();
    return db.users;
}

module.exports = {
    addAccount,
    getUserAccounts,
    getAccount,
    deleteAccount,
    deleteUser,
    getAllUsers
};
