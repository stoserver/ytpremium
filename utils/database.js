const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.json');

// 데이터베이스 읽기
function readDB() {
    try {
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

// 유저 추가
function addUser(userId, userData) {
    const db = readDB();

    // 구매 날짜와 만료 날짜 계산
    const purchaseDate = new Date();
    const expiryDate = new Date(purchaseDate);

    // 구매상품에 따라 만료일 설정
    if (userData.product === '6개월') {
        expiryDate.setMonth(expiryDate.getMonth() + 6);
    } else if (userData.product === '1년') {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    db.users[userId] = {
        email: userData.email,
        product: userData.product,
        purchaseDate: purchaseDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        addedBy: userData.addedBy,
        addedAt: purchaseDate.toISOString()
    };

    return writeDB(db);
}

// 유저 정보 가져오기
function getUser(userId) {
    const db = readDB();
    return db.users[userId] || null;
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
    addUser,
    getUser,
    deleteUser,
    getAllUsers
};
