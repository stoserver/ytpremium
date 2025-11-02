const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config.json');

// 기본 설정 구조
const defaultConfig = {
    setupCompleted: false,
    panelChannelId: null,
    logChannelId: null,
    ownerRoleId: null,
    ticketManagerRoleId: null,
    ticketCategoryId: null,
    buyerRoleId: null
};

// 설정 파일 읽기
function readConfig() {
    try {
        if (!fs.existsSync(configPath)) {
            // 설정 파일이 없으면 기본 설정 생성
            writeConfig(defaultConfig);
            return defaultConfig;
        }
        const data = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('설정 파일 읽기 오류:', error);
        return defaultConfig;
    }
}

// 설정 파일 쓰기
function writeConfig(config) {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('설정 파일 쓰기 오류:', error);
        return false;
    }
}

// 설정 완료 여부 확인
function isSetupCompleted() {
    const config = readConfig();
    return config.setupCompleted === true;
}

// 설정 업데이트
function updateConfig(updates) {
    const config = readConfig();
    const newConfig = { ...config, ...updates };
    return writeConfig(newConfig);
}

// 설정 초기화
function resetConfig() {
    return writeConfig(defaultConfig);
}

// 필수 설정 확인
function validateConfig(config) {
    const required = ['panelChannelId', 'logChannelId', 'ownerRoleId', 'ticketManagerRoleId', 'ticketCategoryId', 'buyerRoleId'];
    const missing = [];

    for (const field of required) {
        if (!config[field]) {
            missing.push(field);
        }
    }

    return {
        isValid: missing.length === 0,
        missing: missing
    };
}

module.exports = {
    readConfig,
    writeConfig,
    isSetupCompleted,
    updateConfig,
    resetConfig,
    validateConfig,
    defaultConfig
};
