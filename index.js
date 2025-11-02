require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { handleCheckInfo, handleCreateTicket } = require('./handlers/buttonHandler');
const { handleSelectAccount, handleAdminSelectAccount } = require('./handlers/selectMenuHandler');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

client.commands = new Collection();

// 명령어 파일 로드
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`✅ 명령어 로드: ${command.data.name}`);
    } else {
        console.log(`⚠️ ${filePath} 명령어가 올바르지 않습니다.`);
    }
}

// 봇 준비 이벤트
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} 봇이 준비되었습니다!`);

    // 슬래시 명령어 등록
    const commands = [];
    for (const command of client.commands.values()) {
        commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('🔄 슬래시 명령어 등록 중...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log('✅ 슬래시 명령어 등록 완료!');
    } catch (error) {
        console.error('❌ 명령어 등록 실패:', error);
    }
});

// 인터랙션 처리
client.on('interactionCreate', async interaction => {
    // 슬래시 명령어 처리
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`${interaction.commandName} 명령어를 찾을 수 없습니다.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('명령어 실행 중 오류:', error);
            const errorMessage = { content: '명령어 실행 중 오류가 발생했습니다!', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }

    // 버튼 처리
    if (interaction.isButton()) {
        try {
            if (interaction.customId === 'check_info') {
                await handleCheckInfo(interaction);
            } else if (interaction.customId === 'create_ticket') {
                await handleCreateTicket(interaction);
            }
        } catch (error) {
            console.error('버튼 처리 중 오류:', error);
            const errorMessage = { content: '처리 중 오류가 발생했습니다!', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }

    // 셀렉트 메뉴 처리
    if (interaction.isStringSelectMenu()) {
        try {
            if (interaction.customId === 'select_account') {
                await handleSelectAccount(interaction);
            } else if (interaction.customId.startsWith('admin_select_account_')) {
                // admin_select_account_{userId} 형식에서 userId 추출
                const targetUserId = interaction.customId.replace('admin_select_account_', '');
                await handleAdminSelectAccount(interaction, targetUserId);
            }
        } catch (error) {
            console.error('셀렉트 메뉴 처리 중 오류:', error);
            const errorMessage = { content: '처리 중 오류가 발생했습니다!', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
});

// 봇 로그인
client.login(process.env.DISCORD_TOKEN);
