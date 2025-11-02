require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { handleCheckInfo, handleCreateTicket } = require('./handlers/buttonHandler');
const { handleSelectAccount, handleAdminSelectAccount } = require('./handlers/selectMenuHandler');
const { handleSetupButton } = require('./commands/시작하기');
const { isSetupCompleted } = require('./utils/config');

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

    // 지정된 서버 확인
    const allowedGuildId = process.env.GUILD_ID;
    if (allowedGuildId) {
        const guilds = client.guilds.cache;

        // 지정된 서버가 아닌 서버에서 나가기
        for (const [guildId, guild] of guilds) {
            if (guildId !== allowedGuildId) {
                console.log(`⚠️ 허용되지 않은 서버에서 나갑니다: ${guild.name} (${guildId})`);
                try {
                    await guild.leave();
                    console.log(`✅ ${guild.name} 서버에서 나갔습니다.`);
                } catch (error) {
                    console.error(`❌ 서버 나가기 실패:`, error);
                }
            }
        }

        // 지정된 서버가 있는지 확인
        const targetGuild = guilds.get(allowedGuildId);
        if (targetGuild) {
            console.log(`✅ 지정된 서버: ${targetGuild.name} (${allowedGuildId})`);
        } else {
            console.log(`⚠️ 지정된 서버 ID를 찾을 수 없습니다: ${allowedGuildId}`);
        }
    } else {
        console.log('⚠️ GUILD_ID가 설정되지 않았습니다. 모든 서버에서 작동합니다.');
    }

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

    // 설정 완료 여부 확인
    if (!isSetupCompleted()) {
        console.log('⚠️ 봇 설정이 완료되지 않았습니다. /시작하기를 실행하세요.');
    } else {
        console.log('✅ 봇 설정 완료됨');
    }
});

// 서버 입장 시 확인
client.on('guildCreate', async (guild) => {
    const allowedGuildId = process.env.GUILD_ID;

    if (allowedGuildId && guild.id !== allowedGuildId) {
        console.log(`⚠️ 허용되지 않은 서버에 입장했습니다: ${guild.name} (${guild.id}). 나갑니다.`);
        try {
            await guild.leave();
            console.log(`✅ ${guild.name} 서버에서 나갔습니다.`);
        } catch (error) {
            console.error(`❌ 서버 나가기 실패:`, error);
        }
    } else {
        console.log(`✅ 서버 입장: ${guild.name} (${guild.id})`);
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

        // 설정이 필요한 명령어인지 확인 (시작하기, 설정초기화 제외)
        const noSetupRequired = ['시작하기', '설정초기화'];
        if (!noSetupRequired.includes(interaction.commandName) && !isSetupCompleted()) {
            const setupEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('⚠️ 초기 설정 필요')
                .setDescription('봇을 사용하기 전에 초기 설정이 필요합니다.')
                .addFields(
                    { name: '🔧 설정 방법', value: '`/시작하기` 명령어를 실행하여 봇을 설정해주세요.' }
                )
                .setTimestamp()
                .setFooter({ text: 'YouTube Premium Manager' });

            return await interaction.reply({ embeds: [setupEmbed], ephemeral: true });
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
        // 설정 버튼은 설정 완료 여부와 관계없이 처리
        if (interaction.customId.startsWith('setup_')) {
            try {
                await handleSetupButton(interaction);
            } catch (error) {
                console.error('설정 버튼 처리 중 오류:', error);
                const errorMessage = { content: '처리 중 오류가 발생했습니다!', ephemeral: true };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
            return;
        }

        // 일반 버튼은 설정 확인
        if (!isSetupCompleted()) {
            const setupEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('⚠️ 초기 설정 필요')
                .setDescription('봇을 사용하기 전에 초기 설정이 필요합니다.')
                .addFields(
                    { name: '🔧 설정 방법', value: '관리자에게 `/시작하기` 명령어를 실행하도록 요청하세요.' }
                )
                .setTimestamp()
                .setFooter({ text: 'YouTube Premium Manager' });

            return await interaction.reply({ embeds: [setupEmbed], ephemeral: true });
        }

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
