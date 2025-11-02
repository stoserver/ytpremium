const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getUserAccounts } = require('../utils/database');
const { readConfig } = require('../utils/config');

async function handleCheckInfo(interaction) {
    const userId = interaction.user.id;
    const accounts = getUserAccounts(userId);

    if (accounts.length === 0) {
        return await interaction.reply({
            content: '❌ 등록된 계정이 없습니다. 관리자에게 문의해주세요.',
            ephemeral: true
        });
    }

    // 계정이 1개인 경우 바로 표시
    if (accounts.length === 1) {
        const account = accounts[0];
        const embed = createAccountEmbed(interaction.user, account);
        return await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }

    // 계정이 여러 개인 경우 드롭다운 표시
    const selectMenu = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_account')
                .setPlaceholder('확인할 계정을 선택하세요')
                .addOptions(
                    accounts.map((account, index) => ({
                        label: `${account.email}`,
                        description: `${account.product} - 만료일: ${new Date(account.expiryDate).toLocaleDateString('ko-KR')}`,
                        value: account.id,
                        emoji: '📧'
                    }))
                )
        );

    await interaction.reply({
        content: '📋 확인할 계정을 선택해주세요:',
        components: [selectMenu],
        ephemeral: true
    });
}

async function handleCreateTicket(interaction) {
    const guild = interaction.guild;
    const member = interaction.member;
    const config = readConfig();

    // 이미 티켓이 있는지 확인
    const existingTicket = guild.channels.cache.find(
        ch => ch.name === `ticket-${member.user.username.toLowerCase()}` && ch.type === ChannelType.GuildText
    );

    if (existingTicket) {
        return await interaction.reply({
            content: `❌ 이미 티켓이 존재합니다: ${existingTicket}`,
            ephemeral: true
        });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
        // 티켓 채널 생성
        const ticketChannel = await guild.channels.create({
            name: `ticket-${member.user.username}`,
            type: ChannelType.GuildText,
            parent: config.ticketCategoryId || null,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: member.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles
                    ]
                },
                {
                    id: config.ownerRoleId,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageChannels
                    ]
                },
                {
                    id: config.ticketManagerRoleId,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                }
            ]
        });

        // 티켓 환영 메시지
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎫 티켓 생성 완료')
            .setDescription(`${member} 님의 티켓이 생성되었습니다.`)
            .addFields(
                { name: '📝 안내', value: '관리자가 곧 응답할 예정입니다. 문의사항을 자유롭게 남겨주세요.' },
                { name: '🔒 티켓 닫기', value: '`/티켓닫기` 명령어를 사용하여 티켓을 닫을 수 있습니다.' }
            )
            .setTimestamp()
            .setFooter({ text: 'YouTube Premium Manager' });

        const ownerRole = guild.roles.cache.get(config.ownerRoleId);
        const ticketManagerRole = guild.roles.cache.get(config.ticketManagerRoleId);

        let mentionText = `${member}`;
        if (ownerRole) mentionText += ` ${ownerRole}`;
        if (ticketManagerRole) mentionText += ` ${ticketManagerRole}`;

        await ticketChannel.send({
            content: mentionText,
            embeds: [embed]
        });

        await interaction.editReply({
            content: `✅ 티켓이 생성되었습니다: ${ticketChannel}`
        });

        // 로그 채널에 기록
        if (config.logChannelId) {
            const logChannel = guild.channels.cache.get(config.logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🎫 티켓 생성 로그')
                    .setDescription(`새로운 티켓이 생성되었습니다.`)
                    .addFields(
                        { name: '👤 생성자', value: `${member.user.tag} (${member.id})`, inline: true },
                        { name: '🔗 티켓 채널', value: `${ticketChannel}`, inline: true },
                        { name: '⏰ 생성 시간', value: new Date().toLocaleString('ko-KR'), inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'YouTube Premium Manager' });

                try {
                    await logChannel.send({ embeds: [logEmbed] });
                } catch (error) {
                    console.error('로그 채널 전송 오류:', error);
                }
            }
        }

    } catch (error) {
        console.error('티켓 생성 오류:', error);
        await interaction.editReply({
            content: '❌ 티켓 생성 중 오류가 발생했습니다. 관리자에게 문의해주세요.'
        });
    }
}

function createAccountEmbed(user, account) {
    const purchaseDate = new Date(account.purchaseDate);
    const expiryDate = new Date(account.expiryDate);
    const now = new Date();

    // 남은 일수 계산
    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    const isExpired = daysLeft < 0;

    // 상태 결정
    let statusEmoji = '✅';
    let statusText = '활성';
    let statusColor = 0x00FF00; // 초록색

    if (isExpired) {
        statusEmoji = '❌';
        statusText = '만료됨';
        statusColor = 0xFF0000; // 빨간색
    } else if (daysLeft <= 7) {
        statusEmoji = '⚠️';
        statusText = '곧 만료';
        statusColor = 0xFFA500; // 주황색
    } else if (daysLeft <= 30) {
        statusEmoji = '⏰';
        statusText = '활성 (만료 임박)';
        statusColor = 0xFFFF00; // 노란색
    }

    const embed = new EmbedBuilder()
        .setColor(statusColor)
        .setTitle('📊 YouTube Premium 계정 정보')
        .setThumbnail(user.displayAvatarURL())
        .addFields(
            { name: '👤 유저', value: `${user.tag}`, inline: true },
            { name: '📧 이메일', value: account.email, inline: true },
            { name: '📦 구매상품', value: account.product, inline: true },
            { name: '📅 구매일', value: purchaseDate.toLocaleDateString('ko-KR'), inline: true },
            { name: '⏰ 만료일', value: expiryDate.toLocaleDateString('ko-KR'), inline: true },
            { name: `${statusEmoji} 상태`, value: statusText, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'YouTube Premium Manager' });

    // 남은 일수 표시 (만료되지 않은 경우)
    if (!isExpired) {
        embed.addFields({
            name: '⏳ 남은 기간',
            value: `${daysLeft}일`,
            inline: true
        });
    }

    // 만료 경고 메시지
    if (daysLeft <= 7 && !isExpired) {
        embed.setDescription('⚠️ **구독이 곧 만료됩니다!** 관리자에게 연장을 문의해주세요.');
    } else if (isExpired) {
        embed.setDescription('❌ **구독이 만료되었습니다.** 관리자에게 연장을 문의해주세요.');
    }

    return embed;
}

module.exports = {
    handleCheckInfo,
    handleCreateTicket,
    createAccountEmbed
};
