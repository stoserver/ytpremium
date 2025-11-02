const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { readConfig, updateConfig, validateConfig } = require('../utils/config');

// 설정 단계
const SETUP_STEPS = {
    WELCOME: 'welcome',
    BUYER_ROLE: 'buyer_role',
    LOG_CHANNEL: 'log_channel',
    OWNER_ROLE: 'owner_role',
    TICKET_MANAGER_ROLE: 'ticket_manager_role',
    TICKET_CATEGORY: 'ticket_category',
    PANEL_CHANNEL: 'panel_channel',
    COMPLETE: 'complete'
};

// 진행 중인 설정 세션 저장
const setupSessions = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('시작하기')
        .setDescription('봇 초기 설정을 시작합니다.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const config = readConfig();

        // 이미 설정이 완료된 경우
        if (config.setupCompleted) {
            const embed = new EmbedBuilder()
                .setColor(0xFFFF00)
                .setTitle('⚠️ 이미 설정 완료됨')
                .setDescription('봇 설정이 이미 완료되었습니다.')
                .addFields(
                    { name: '🔧 재설정', value: '재설정이 필요하면 `/설정초기화` 명령어를 먼저 실행하세요.' }
                )
                .setTimestamp()
                .setFooter({ text: 'YouTube Premium Manager' });

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // 설정 세션 시작
        const userId = interaction.user.id;
        setupSessions.set(userId, {
            step: SETUP_STEPS.WELCOME,
            data: {},
            channelId: interaction.channelId
        });

        await startSetup(interaction);
    }
};

async function startSetup(interaction) {
    const welcomeEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🎬 YouTube Premium Manager Bot 초기 설정')
        .setDescription('봇을 사용하기 위한 초기 설정을 시작합니다.\n아래 단계를 따라 필요한 정보를 입력해주세요.')
        .addFields(
            { name: '📋 설정 항목', value: '1️⃣ 구매자 역할\n2️⃣ 로그 채널\n3️⃣ 오너 역할\n4️⃣ 티켓 관리자 역할\n5️⃣ 티켓 카테고리\n6️⃣ 패널 채널' },
            { name: '⏱️ 제한 시간', value: '각 단계마다 5분의 제한 시간이 있습니다.' },
            { name: '🔄 시작', value: '아래 메시지에서 요청하는 정보를 입력해주세요.' }
        )
        .setTimestamp()
        .setFooter({ text: 'YouTube Premium Manager' });

    await interaction.reply({ embeds: [welcomeEmbed], ephemeral: true });

    // 1단계: 구매자 역할 생성/선택
    await askBuyerRole(interaction);
}

async function askBuyerRole(interaction) {
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('1️⃣ 구매자 역할 설정')
        .setDescription('YouTube Premium을 구매한 유저에게 부여할 역할을 설정합니다.')
        .addFields(
            { name: '📌 방법 1', value: '기존 역할을 사용하려면 역할을 **멘션**하거나 **역할 ID**를 입력하세요.' },
            { name: '📌 방법 2', value: '`새로만들기`를 입력하면 자동으로 역할을 생성합니다.' }
        )
        .setFooter({ text: '5분 이내에 응답해주세요.' });

    await interaction.followUp({ embeds: [embed], ephemeral: true });

    // 메시지 수집기 생성
    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 300000, max: 1 });

    collector.on('collect', async (message) => {
        const content = message.content.trim();

        let roleId = null;

        if (content === '새로만들기') {
            // 새 역할 생성
            try {
                const role = await interaction.guild.roles.create({
                    name: 'YouTube Premium 구매자',
                    color: 0xFF0000,
                    reason: '봇 초기 설정 - 구매자 역할'
                });
                roleId = role.id;

                await message.reply(`✅ 새로운 역할이 생성되었습니다: ${role}`);
            } catch (error) {
                console.error('역할 생성 오류:', error);
                await message.reply('❌ 역할 생성에 실패했습니다. 봇에게 역할 관리 권한이 있는지 확인해주세요.');
                return;
            }
        } else {
            // 기존 역할 사용
            const roleMatch = content.match(/^<@&(\d+)>$/) || content.match(/^(\d+)$/);
            if (roleMatch) {
                roleId = roleMatch[1];
                const role = interaction.guild.roles.cache.get(roleId);
                if (!role) {
                    await message.reply('❌ 해당 역할을 찾을 수 없습니다. 다시 시도해주세요.');
                    return;
                }
                await message.reply(`✅ 구매자 역할: ${role}`);
            } else {
                await message.reply('❌ 올바른 형식이 아닙니다. 역할을 멘션하거나 ID를 입력하거나 `새로만들기`를 입력하세요.');
                return;
            }
        }

        // 세션 업데이트
        const session = setupSessions.get(interaction.user.id);
        session.data.buyerRoleId = roleId;

        // 다음 단계
        await askLogChannel(interaction, message);
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            await interaction.followUp({ content: '⏱️ 시간이 초과되었습니다. `/시작하기`를 다시 실행해주세요.', ephemeral: true });
            setupSessions.delete(interaction.user.id);
        }
    });
}

async function askLogChannel(interaction, previousMessage) {
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('2️⃣ 로그 채널 설정')
        .setDescription('봇의 활동 로그를 기록할 채널을 설정합니다.')
        .addFields(
            { name: '📌 방법 1', value: '기존 채널을 사용하려면 채널을 **멘션**하거나 **채널 ID**를 입력하세요.' },
            { name: '📌 방법 2', value: '`새로만들기`를 입력하면 자동으로 채널을 생성합니다.' }
        )
        .setFooter({ text: '5분 이내에 응답해주세요.' });

    await previousMessage.reply({ embeds: [embed] });

    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 300000, max: 1 });

    collector.on('collect', async (message) => {
        const content = message.content.trim();
        let channelId = null;

        if (content === '새로만들기') {
            try {
                const channel = await interaction.guild.channels.create({
                    name: 'ytpremium-로그',
                    type: ChannelType.GuildText,
                    reason: '봇 초기 설정 - 로그 채널'
                });
                channelId = channel.id;
                await message.reply(`✅ 새로운 채널이 생성되었습니다: ${channel}`);
            } catch (error) {
                console.error('채널 생성 오류:', error);
                await message.reply('❌ 채널 생성에 실패했습니다.');
                return;
            }
        } else {
            const channelMatch = content.match(/^<#(\d+)>$/) || content.match(/^(\d+)$/);
            if (channelMatch) {
                channelId = channelMatch[1];
                const channel = interaction.guild.channels.cache.get(channelId);
                if (!channel) {
                    await message.reply('❌ 해당 채널을 찾을 수 없습니다.');
                    return;
                }
                await message.reply(`✅ 로그 채널: ${channel}`);
            } else {
                await message.reply('❌ 올바른 형식이 아닙니다.');
                return;
            }
        }

        const session = setupSessions.get(interaction.user.id);
        session.data.logChannelId = channelId;

        await askOwnerRole(interaction, message);
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            await interaction.followUp({ content: '⏱️ 시간이 초과되었습니다.', ephemeral: true });
            setupSessions.delete(interaction.user.id);
        }
    });
}

async function askOwnerRole(interaction, previousMessage) {
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('3️⃣ 오너 역할 설정')
        .setDescription('봇의 오너 역할을 설정합니다. (티켓에서 멘션됩니다)')
        .addFields(
            { name: '📌 입력', value: '오너 역할을 **멘션**하거나 **역할 ID**를 입력하세요.' }
        )
        .setFooter({ text: '5분 이내에 응답해주세요.' });

    await previousMessage.reply({ embeds: [embed] });

    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 300000, max: 1 });

    collector.on('collect', async (message) => {
        const roleMatch = message.content.match(/^<@&(\d+)>$/) || message.content.match(/^(\d+)$/);
        if (!roleMatch) {
            await message.reply('❌ 올바른 형식이 아닙니다.');
            return;
        }

        const roleId = roleMatch[1];
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) {
            await message.reply('❌ 해당 역할을 찾을 수 없습니다.');
            return;
        }

        await message.reply(`✅ 오너 역할: ${role}`);

        const session = setupSessions.get(interaction.user.id);
        session.data.ownerRoleId = roleId;

        await askTicketManagerRole(interaction, message);
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            await interaction.followUp({ content: '⏱️ 시간이 초과되었습니다.', ephemeral: true });
            setupSessions.delete(interaction.user.id);
        }
    });
}

async function askTicketManagerRole(interaction, previousMessage) {
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('4️⃣ 티켓 관리자 역할 설정')
        .setDescription('티켓을 관리할 역할을 설정합니다.')
        .addFields(
            { name: '📌 입력', value: '티켓 관리자 역할을 **멘션**하거나 **역할 ID**를 입력하세요.' }
        )
        .setFooter({ text: '5분 이내에 응답해주세요.' });

    await previousMessage.reply({ embeds: [embed] });

    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 300000, max: 1 });

    collector.on('collect', async (message) => {
        const roleMatch = message.content.match(/^<@&(\d+)>$/) || message.content.match(/^(\d+)$/);
        if (!roleMatch) {
            await message.reply('❌ 올바른 형식이 아닙니다.');
            return;
        }

        const roleId = roleMatch[1];
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) {
            await message.reply('❌ 해당 역할을 찾을 수 없습니다.');
            return;
        }

        await message.reply(`✅ 티켓 관리자 역할: ${role}`);

        const session = setupSessions.get(interaction.user.id);
        session.data.ticketManagerRoleId = roleId;

        await askTicketCategory(interaction, message);
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            await interaction.followUp({ content: '⏱️ 시간이 초과되었습니다.', ephemeral: true });
            setupSessions.delete(interaction.user.id);
        }
    });
}

async function askTicketCategory(interaction, previousMessage) {
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('5️⃣ 티켓 카테고리 설정')
        .setDescription('티켓 채널이 생성될 카테고리를 설정합니다.')
        .addFields(
            { name: '📌 방법 1', value: '기존 카테고리 **ID**를 입력하세요.' },
            { name: '📌 방법 2', value: '`새로만들기`를 입력하면 자동으로 카테고리를 생성합니다.' },
            { name: '📌 방법 3', value: '`없음`을 입력하면 카테고리 없이 티켓을 생성합니다.' }
        )
        .setFooter({ text: '5분 이내에 응답해주세요.' });

    await previousMessage.reply({ embeds: [embed] });

    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 300000, max: 1 });

    collector.on('collect', async (message) => {
        const content = message.content.trim();
        let categoryId = null;

        if (content === '새로만들기') {
            try {
                const category = await interaction.guild.channels.create({
                    name: '티켓',
                    type: ChannelType.GuildCategory,
                    reason: '봇 초기 설정 - 티켓 카테고리'
                });
                categoryId = category.id;
                await message.reply(`✅ 새로운 카테고리가 생성되었습니다: ${category.name}`);
            } catch (error) {
                console.error('카테고리 생성 오류:', error);
                await message.reply('❌ 카테고리 생성에 실패했습니다.');
                return;
            }
        } else if (content === '없음') {
            categoryId = null;
            await message.reply('✅ 티켓 카테고리: 없음');
        } else {
            const categoryMatch = content.match(/^(\d+)$/);
            if (categoryMatch) {
                categoryId = categoryMatch[1];
                const category = interaction.guild.channels.cache.get(categoryId);
                if (!category || category.type !== ChannelType.GuildCategory) {
                    await message.reply('❌ 올바른 카테고리를 찾을 수 없습니다.');
                    return;
                }
                await message.reply(`✅ 티켓 카테고리: ${category.name}`);
            } else {
                await message.reply('❌ 올바른 형식이 아닙니다.');
                return;
            }
        }

        const session = setupSessions.get(interaction.user.id);
        session.data.ticketCategoryId = categoryId;

        await askPanelChannel(interaction, message);
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            await interaction.followUp({ content: '⏱️ 시간이 초과되었습니다.', ephemeral: true });
            setupSessions.delete(interaction.user.id);
        }
    });
}

async function askPanelChannel(interaction, previousMessage) {
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('6️⃣ 패널 채널 설정')
        .setDescription('정보 확인 패널을 전송할 채널을 설정합니다.')
        .addFields(
            { name: '📌 방법 1', value: '기존 채널을 사용하려면 채널을 **멘션**하거나 **채널 ID**를 입력하세요.' },
            { name: '📌 방법 2', value: '`새로만들기`를 입력하면 자동으로 채널을 생성합니다.' }
        )
        .setFooter({ text: '5분 이내에 응답해주세요.' });

    await previousMessage.reply({ embeds: [embed] });

    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 300000, max: 1 });

    collector.on('collect', async (message) => {
        const content = message.content.trim();
        let channelId = null;

        if (content === '새로만들기') {
            try {
                const channel = await interaction.guild.channels.create({
                    name: 'ytpremium-정보',
                    type: ChannelType.GuildText,
                    reason: '봇 초기 설정 - 패널 채널'
                });
                channelId = channel.id;
                await message.reply(`✅ 새로운 채널이 생성되었습니다: ${channel}`);
            } catch (error) {
                console.error('채널 생성 오류:', error);
                await message.reply('❌ 채널 생성에 실패했습니다.');
                return;
            }
        } else {
            const channelMatch = content.match(/^<#(\d+)>$/) || content.match(/^(\d+)$/);
            if (channelMatch) {
                channelId = channelMatch[1];
                const channel = interaction.guild.channels.cache.get(channelId);
                if (!channel) {
                    await message.reply('❌ 해당 채널을 찾을 수 없습니다.');
                    return;
                }
                await message.reply(`✅ 패널 채널: ${channel}`);
            } else {
                await message.reply('❌ 올바른 형식이 아닙니다.');
                return;
            }
        }

        const session = setupSessions.get(interaction.user.id);
        session.data.panelChannelId = channelId;

        await completeSetup(interaction, message);
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            await interaction.followUp({ content: '⏱️ 시간이 초과되었습니다.', ephemeral: true });
            setupSessions.delete(interaction.user.id);
        }
    });
}

async function completeSetup(interaction, previousMessage) {
    const session = setupSessions.get(interaction.user.id);
    const data = session.data;

    // 설정 저장
    const success = updateConfig({
        setupCompleted: true,
        panelChannelId: data.panelChannelId,
        logChannelId: data.logChannelId,
        ownerRoleId: data.ownerRoleId,
        ticketManagerRoleId: data.ticketManagerRoleId,
        ticketCategoryId: data.ticketCategoryId,
        buyerRoleId: data.buyerRoleId
    });

    if (success) {
        // 패널 자동 전송
        const { sendPanel } = require('../utils/panel');
        const panelChannel = interaction.guild.channels.cache.get(data.panelChannelId);

        if (panelChannel) {
            await sendPanel(panelChannel);
        }

        const completeEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ 초기 설정 완료!')
            .setDescription('봇 설정이 완료되었습니다. 이제 모든 기능을 사용할 수 있습니다!')
            .addFields(
                { name: '🎯 구매자 역할', value: `<@&${data.buyerRoleId}>`, inline: true },
                { name: '📝 로그 채널', value: `<#${data.logChannelId}>`, inline: true },
                { name: '👑 오너 역할', value: `<@&${data.ownerRoleId}>`, inline: true },
                { name: '🎫 티켓 관리자', value: `<@&${data.ticketManagerRoleId}>`, inline: true },
                { name: '📁 티켓 카테고리', value: data.ticketCategoryId ? `<#${data.ticketCategoryId}>` : '없음', inline: true },
                { name: '📢 패널 채널', value: `<#${data.panelChannelId}>`, inline: true }
            )
            .addFields(
                { name: '🚀 다음 단계', value: '• `/유저추가`로 구독자 추가\n• `/정보조회`로 유저 정보 확인\n• 패널 채널에서 유저가 정보 확인 가능' }
            )
            .setTimestamp()
            .setFooter({ text: 'YouTube Premium Manager' });

        await previousMessage.reply({ embeds: [completeEmbed] });

        // 로그 채널에도 알림
        const logChannel = interaction.guild.channels.cache.get(data.logChannelId);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎉 봇 초기 설정 완료')
                .setDescription(`${interaction.user}님이 봇 초기 설정을 완료했습니다.`)
                .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] });
        }
    } else {
        await previousMessage.reply('❌ 설정 저장에 실패했습니다. 다시 시도해주세요.');
    }

    // 세션 종료
    setupSessions.delete(interaction.user.id);
}
