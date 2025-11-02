const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { readConfig, updateConfig } = require('../utils/config');

// 설정 세션 저장
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
            step: 'welcome',
            data: {},
            interaction: interaction
        });

        await showWelcome(interaction);
    }
};

async function showWelcome(interaction) {
    const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🎬 환영합니다!')
        .setDescription('YouTube Premium Manager Bot 초기 설정을 시작합니다.\n\n아래 **다음** 버튼을 클릭하여 시작하세요!')
        .addFields(
            { name: '📋 설정 항목', value: '• 구매자 역할\n• 로그 채널\n• 오너 역할\n• 티켓 관리자 역할\n• 티켓 카테고리\n• 패널 채널' },
            { name: '⏱️ 제한 시간', value: '각 단계마다 5분의 제한 시간이 있습니다.' }
        )
        .setTimestamp()
        .setFooter({ text: 'YouTube Premium Manager' });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('setup_next_welcome')
                .setLabel('다음')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('▶️')
        );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

// 버튼 핸들러를 exports에 추가
module.exports.handleSetupButton = async function(interaction) {
    const userId = interaction.user.id;
    const session = setupSessions.get(userId);

    if (!session) {
        return await interaction.reply({
            content: '⚠️ 설정 세션이 만료되었습니다. `/시작하기`를 다시 실행해주세요.',
            ephemeral: true
        });
    }

    const customId = interaction.customId;

    // Welcome 단계
    if (customId === 'setup_next_welcome') {
        await showBuyerRoleStep(interaction, session);
    }
    // 구매자 역할 단계
    else if (customId === 'setup_buyer_role_create') {
        await createBuyerRole(interaction, session);
    }
    else if (customId === 'setup_buyer_role_existing') {
        await askBuyerRoleId(interaction, session);
    }
    // 로그 채널 단계
    else if (customId === 'setup_log_channel_create') {
        await createLogChannel(interaction, session);
    }
    else if (customId === 'setup_log_channel_existing') {
        await askLogChannelId(interaction, session);
    }
    // 오너 역할 단계
    else if (customId === 'setup_owner_role_next') {
        await askOwnerRoleId(interaction, session);
    }
    // 티켓 관리자 역할 단계
    else if (customId === 'setup_ticket_manager_next') {
        await askTicketManagerRoleId(interaction, session);
    }
    // 티켓 카테고리 단계
    else if (customId === 'setup_ticket_category_create') {
        await createTicketCategory(interaction, session);
    }
    else if (customId === 'setup_ticket_category_existing') {
        await askTicketCategoryId(interaction, session);
    }
    else if (customId === 'setup_ticket_category_none') {
        session.data.ticketCategoryId = null;
        await showPanelChannelStep(interaction, session);
    }
    // 패널 채널 단계
    else if (customId === 'setup_panel_channel_create') {
        await createPanelChannel(interaction, session);
    }
    else if (customId === 'setup_panel_channel_existing') {
        await askPanelChannelId(interaction, session);
    }
};

async function showBuyerRoleStep(interaction, session) {
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('1️⃣ 구매자 역할 설정')
        .setDescription('YouTube Premium을 구매한 유저에게 부여할 역할을 설정합니다.')
        .addFields(
            { name: '📌 새로 만들기', value: '자동으로 "YouTube Premium 구매자" 역할을 생성합니다.' },
            { name: '📌 기존 사용', value: '기존 역할을 사용하려면 역할 ID를 입력해야 합니다.' }
        )
        .setFooter({ text: '원하는 옵션을 선택하세요.' });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('setup_buyer_role_create')
                .setLabel('새로 만들기')
                .setStyle(ButtonStyle.Success)
                .setEmoji('➕'),
            new ButtonBuilder()
                .setCustomId('setup_buyer_role_existing')
                .setLabel('기존 역할 사용')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔗')
        );

    await interaction.update({ embeds: [embed], components: [row] });
}

async function createBuyerRole(interaction, session) {
    await interaction.deferUpdate();

    try {
        const role = await interaction.guild.roles.create({
            name: 'YouTube Premium 구매자',
            color: 0xFF0000,
            reason: '봇 초기 설정 - 구매자 역할'
        });

        session.data.buyerRoleId = role.id;

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ 구매자 역할 생성 완료')
            .setDescription(`역할이 생성되었습니다: ${role}`)
            .setFooter({ text: '다음 단계로 진행합니다.' });

        await interaction.editReply({ embeds: [embed], components: [] });

        setTimeout(() => {
            showLogChannelStep(interaction, session);
        }, 1500);

    } catch (error) {
        console.error('역할 생성 오류:', error);
        await interaction.editReply({
            content: '❌ 역할 생성에 실패했습니다. 봇에게 역할 관리 권한이 있는지 확인해주세요.',
            embeds: [],
            components: []
        });
    }
}

async function askBuyerRoleId(interaction, session) {
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('1️⃣ 구매자 역할 ID 입력')
        .setDescription('사용할 역할의 **역할 ID**를 입력해주세요.\n\n**역할 ID 찾는 방법:**\n1. Discord 설정 > 고급 > 개발자 모드 활성화\n2. 역할 우클릭 > ID 복사')
        .setFooter({ text: '5분 이내에 역할 ID를 입력하세요.' });

    await interaction.update({ embeds: [embed], components: [] });

    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 300000, max: 1 });

    collector.on('collect', async (message) => {
        const roleId = message.content.trim();
        const role = interaction.guild.roles.cache.get(roleId);

        if (!role) {
            await message.reply('❌ 해당 역할을 찾을 수 없습니다. `/시작하기`를 다시 실행해주세요.');
            setupSessions.delete(interaction.user.id);
            return;
        }

        session.data.buyerRoleId = roleId;
        await message.reply(`✅ 구매자 역할: ${role}`);
        await message.channel.send('다음 단계로 진행합니다...');

        setTimeout(() => {
            showLogChannelStep(interaction, session);
        }, 1500);
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
            interaction.followUp({ content: '⏱️ 시간이 초과되었습니다. `/시작하기`를 다시 실행해주세요.', ephemeral: true });
            setupSessions.delete(interaction.user.id);
        }
    });
}

async function showLogChannelStep(interaction, session) {
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('2️⃣ 로그 채널 설정')
        .setDescription('봇의 활동 로그를 기록할 채널을 설정합니다.')
        .addFields(
            { name: '📌 새로 만들기', value: '자동으로 "ytpremium-로그" 채널을 생성합니다.' },
            { name: '📌 기존 사용', value: '기존 채널을 사용하려면 채널 ID를 입력해야 합니다.' }
        )
        .setFooter({ text: '원하는 옵션을 선택하세요.' });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('setup_log_channel_create')
                .setLabel('새로 만들기')
                .setStyle(ButtonStyle.Success)
                .setEmoji('➕'),
            new ButtonBuilder()
                .setCustomId('setup_log_channel_existing')
                .setLabel('기존 채널 사용')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔗')
        );

    await interaction.followUp({ embeds: [embed], components: [row], ephemeral: true });
}

async function createLogChannel(interaction, session) {
    await interaction.deferUpdate();

    try {
        const channel = await interaction.guild.channels.create({
            name: 'ytpremium-로그',
            type: ChannelType.GuildText,
            reason: '봇 초기 설정 - 로그 채널'
        });

        session.data.logChannelId = channel.id;

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ 로그 채널 생성 완료')
            .setDescription(`채널이 생성되었습니다: ${channel}`)
            .setFooter({ text: '다음 단계로 진행합니다.' });

        await interaction.editReply({ embeds: [embed], components: [] });

        setTimeout(() => {
            showOwnerRoleStep(interaction, session);
        }, 1500);

    } catch (error) {
        console.error('채널 생성 오류:', error);
        await interaction.editReply({
            content: '❌ 채널 생성에 실패했습니다.',
            embeds: [],
            components: []
        });
    }
}

async function askLogChannelId(interaction, session) {
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('2️⃣ 로그 채널 ID 입력')
        .setDescription('사용할 채널의 **채널 ID**를 입력해주세요.')
        .setFooter({ text: '5분 이내에 채널 ID를 입력하세요.' });

    await interaction.update({ embeds: [embed], components: [] });

    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 300000, max: 1 });

    collector.on('collect', async (message) => {
        const channelId = message.content.trim();
        const channel = interaction.guild.channels.cache.get(channelId);

        if (!channel) {
            await message.reply('❌ 해당 채널을 찾을 수 없습니다. `/시작하기`를 다시 실행해주세요.');
            setupSessions.delete(interaction.user.id);
            return;
        }

        session.data.logChannelId = channelId;
        await message.reply(`✅ 로그 채널: ${channel}`);
        await message.channel.send('다음 단계로 진행합니다...');

        setTimeout(() => {
            showOwnerRoleStep(interaction, session);
        }, 1500);
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
            interaction.followUp({ content: '⏱️ 시간이 초과되었습니다.', ephemeral: true });
            setupSessions.delete(interaction.user.id);
        }
    });
}

async function showOwnerRoleStep(interaction, session) {
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('3️⃣ 오너 역할 설정')
        .setDescription('봇의 오너 역할을 설정합니다. (티켓에서 멘션됩니다)\n\n**역할 ID**를 입력해주세요.')
        .setFooter({ text: '5분 이내에 역할 ID를 입력하세요.' });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('setup_owner_role_next')
                .setLabel('역할 ID 입력하기')
                .setStyle(ButtonStyle.Primary)
        );

    await interaction.followUp({ embeds: [embed], components: [row], ephemeral: true });
}

async function askOwnerRoleId(interaction, session) {
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('3️⃣ 오너 역할 ID 입력')
        .setDescription('오너 역할의 **역할 ID**를 입력해주세요.')
        .setFooter({ text: '5분 이내에 역할 ID를 입력하세요.' });

    await interaction.update({ embeds: [embed], components: [] });

    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 300000, max: 1 });

    collector.on('collect', async (message) => {
        const roleId = message.content.trim();
        const role = interaction.guild.roles.cache.get(roleId);

        if (!role) {
            await message.reply('❌ 해당 역할을 찾을 수 없습니다. `/시작하기`를 다시 실행해주세요.');
            setupSessions.delete(interaction.user.id);
            return;
        }

        session.data.ownerRoleId = roleId;
        await message.reply(`✅ 오너 역할: ${role}`);
        await message.channel.send('다음 단계로 진행합니다...');

        setTimeout(() => {
            showTicketManagerStep(interaction, session);
        }, 1500);
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
            interaction.followUp({ content: '⏱️ 시간이 초과되었습니다.', ephemeral: true });
            setupSessions.delete(interaction.user.id);
        }
    });
}

async function showTicketManagerStep(interaction, session) {
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('4️⃣ 티켓 관리자 역할 설정')
        .setDescription('티켓을 관리할 역할을 설정합니다.\n\n**역할 ID**를 입력해주세요.')
        .setFooter({ text: '5분 이내에 역할 ID를 입력하세요.' });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('setup_ticket_manager_next')
                .setLabel('역할 ID 입력하기')
                .setStyle(ButtonStyle.Primary)
        );

    await interaction.followUp({ embeds: [embed], components: [row], ephemeral: true });
}

async function askTicketManagerRoleId(interaction, session) {
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('4️⃣ 티켓 관리자 역할 ID 입력')
        .setDescription('티켓 관리자 역할의 **역할 ID**를 입력해주세요.')
        .setFooter({ text: '5분 이내에 역할 ID를 입력하세요.' });

    await interaction.update({ embeds: [embed], components: [] });

    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 300000, max: 1 });

    collector.on('collect', async (message) => {
        const roleId = message.content.trim();
        const role = interaction.guild.roles.cache.get(roleId);

        if (!role) {
            await message.reply('❌ 해당 역할을 찾을 수 없습니다. `/시작하기`를 다시 실행해주세요.');
            setupSessions.delete(interaction.user.id);
            return;
        }

        session.data.ticketManagerRoleId = roleId;
        await message.reply(`✅ 티켓 관리자 역할: ${role}`);
        await message.channel.send('다음 단계로 진행합니다...');

        setTimeout(() => {
            showTicketCategoryStep(interaction, session);
        }, 1500);
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
            interaction.followUp({ content: '⏱️ 시간이 초과되었습니다.', ephemeral: true });
            setupSessions.delete(interaction.user.id);
        }
    });
}

async function showTicketCategoryStep(interaction, session) {
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('5️⃣ 티켓 카테고리 설정')
        .setDescription('티켓 채널이 생성될 카테고리를 설정합니다.')
        .addFields(
            { name: '📌 새로 만들기', value: '자동으로 "티켓" 카테고리를 생성합니다.' },
            { name: '📌 기존 사용', value: '기존 카테고리를 사용하려면 카테고리 ID를 입력해야 합니다.' },
            { name: '📌 없음', value: '카테고리 없이 티켓을 생성합니다.' }
        )
        .setFooter({ text: '원하는 옵션을 선택하세요.' });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('setup_ticket_category_create')
                .setLabel('새로 만들기')
                .setStyle(ButtonStyle.Success)
                .setEmoji('➕'),
            new ButtonBuilder()
                .setCustomId('setup_ticket_category_existing')
                .setLabel('기존 사용')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔗'),
            new ButtonBuilder()
                .setCustomId('setup_ticket_category_none')
                .setLabel('없음')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('❌')
        );

    await interaction.followUp({ embeds: [embed], components: [row], ephemeral: true });
}

async function createTicketCategory(interaction, session) {
    await interaction.deferUpdate();

    try {
        const category = await interaction.guild.channels.create({
            name: '티켓',
            type: ChannelType.GuildCategory,
            reason: '봇 초기 설정 - 티켓 카테고리'
        });

        session.data.ticketCategoryId = category.id;

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ 티켓 카테고리 생성 완료')
            .setDescription(`카테고리가 생성되었습니다: ${category.name}`)
            .setFooter({ text: '다음 단계로 진행합니다.' });

        await interaction.editReply({ embeds: [embed], components: [] });

        setTimeout(() => {
            showPanelChannelStep(interaction, session);
        }, 1500);

    } catch (error) {
        console.error('카테고리 생성 오류:', error);
        await interaction.editReply({
            content: '❌ 카테고리 생성에 실패했습니다.',
            embeds: [],
            components: []
        });
    }
}

async function askTicketCategoryId(interaction, session) {
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('5️⃣ 티켓 카테고리 ID 입력')
        .setDescription('사용할 카테고리의 **카테고리 ID**를 입력해주세요.')
        .setFooter({ text: '5분 이내에 카테고리 ID를 입력하세요.' });

    await interaction.update({ embeds: [embed], components: [] });

    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 300000, max: 1 });

    collector.on('collect', async (message) => {
        const categoryId = message.content.trim();
        const category = interaction.guild.channels.cache.get(categoryId);

        if (!category || category.type !== ChannelType.GuildCategory) {
            await message.reply('❌ 올바른 카테고리를 찾을 수 없습니다. `/시작하기`를 다시 실행해주세요.');
            setupSessions.delete(interaction.user.id);
            return;
        }

        session.data.ticketCategoryId = categoryId;
        await message.reply(`✅ 티켓 카테고리: ${category.name}`);
        await message.channel.send('다음 단계로 진행합니다...');

        setTimeout(() => {
            showPanelChannelStep(interaction, session);
        }, 1500);
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
            interaction.followUp({ content: '⏱️ 시간이 초과되었습니다.', ephemeral: true });
            setupSessions.delete(interaction.user.id);
        }
    });
}

async function showPanelChannelStep(interaction, session) {
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('6️⃣ 패널 채널 설정')
        .setDescription('정보 확인 패널을 전송할 채널을 설정합니다.')
        .addFields(
            { name: '📌 새로 만들기', value: '자동으로 "ytpremium-정보" 채널을 생성합니다.' },
            { name: '📌 기존 사용', value: '기존 채널을 사용하려면 채널 ID를 입력해야 합니다.' }
        )
        .setFooter({ text: '원하는 옵션을 선택하세요.' });

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('setup_panel_channel_create')
                .setLabel('새로 만들기')
                .setStyle(ButtonStyle.Success)
                .setEmoji('➕'),
            new ButtonBuilder()
                .setCustomId('setup_panel_channel_existing')
                .setLabel('기존 채널 사용')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔗')
        );

    await interaction.followUp({ embeds: [embed], components: [row], ephemeral: true });
}

async function createPanelChannel(interaction, session) {
    await interaction.deferUpdate();

    try {
        const channel = await interaction.guild.channels.create({
            name: 'ytpremium-정보',
            type: ChannelType.GuildText,
            reason: '봇 초기 설정 - 패널 채널'
        });

        session.data.panelChannelId = channel.id;

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ 패널 채널 생성 완료')
            .setDescription(`채널이 생성되었습니다: ${channel}`)
            .setFooter({ text: '설정을 완료합니다...' });

        await interaction.editReply({ embeds: [embed], components: [] });

        setTimeout(() => {
            completeSetup(interaction, session);
        }, 1500);

    } catch (error) {
        console.error('채널 생성 오류:', error);
        await interaction.editReply({
            content: '❌ 채널 생성에 실패했습니다.',
            embeds: [],
            components: []
        });
    }
}

async function askPanelChannelId(interaction, session) {
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('6️⃣ 패널 채널 ID 입력')
        .setDescription('사용할 채널의 **채널 ID**를 입력해주세요.')
        .setFooter({ text: '5분 이내에 채널 ID를 입력하세요.' });

    await interaction.update({ embeds: [embed], components: [] });

    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 300000, max: 1 });

    collector.on('collect', async (message) => {
        const channelId = message.content.trim();
        const channel = interaction.guild.channels.cache.get(channelId);

        if (!channel) {
            await message.reply('❌ 해당 채널을 찾을 수 없습니다. `/시작하기`를 다시 실행해주세요.');
            setupSessions.delete(interaction.user.id);
            return;
        }

        session.data.panelChannelId = channelId;
        await message.reply(`✅ 패널 채널: ${channel}`);
        await message.channel.send('설정을 완료합니다...');

        setTimeout(() => {
            completeSetup(interaction, session);
        }, 1500);
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
            interaction.followUp({ content: '⏱️ 시간이 초과되었습니다.', ephemeral: true });
            setupSessions.delete(interaction.user.id);
        }
    });
}

async function completeSetup(interaction, session) {
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

        await interaction.followUp({ embeds: [completeEmbed], ephemeral: true });

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
        await interaction.followUp({ content: '❌ 설정 저장에 실패했습니다. 다시 시도해주세요.', ephemeral: true });
    }

    // 세션 종료
    setupSessions.delete(interaction.user.id);
}
