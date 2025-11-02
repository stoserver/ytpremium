const { getAccount } = require('../utils/database');
const { createAccountEmbed } = require('./buttonHandler');
const { EmbedBuilder } = require('discord.js');

async function handleSelectAccount(interaction) {
    const accountId = interaction.values[0];
    const userId = interaction.user.id;

    const account = getAccount(userId, accountId);

    if (!account) {
        return await interaction.update({
            content: '❌ 계정을 찾을 수 없습니다.',
            components: [],
            ephemeral: true
        });
    }

    const embed = createAccountEmbed(interaction.user, account);

    await interaction.update({
        content: null,
        embeds: [embed],
        components: [],
        ephemeral: true
    });
}

async function handleAdminSelectAccount(interaction, targetUserId) {
    const accountId = interaction.values[0];

    const account = getAccount(targetUserId, accountId);

    if (!account) {
        return await interaction.update({
            content: '❌ 계정을 찾을 수 없습니다.',
            components: [],
            ephemeral: true
        });
    }

    // 대상 유저 정보 가져오기
    const targetUser = await interaction.client.users.fetch(targetUserId);
    const embed = createAdminAccountEmbed(targetUser, account);

    await interaction.update({
        content: null,
        embeds: [embed],
        components: [],
        ephemeral: true
    });
}

function createAdminAccountEmbed(user, account) {
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
        .setTitle('📊 YouTube Premium 계정 정보 (관리자 조회)')
        .setThumbnail(user.displayAvatarURL())
        .addFields(
            { name: '👤 유저', value: `${user.tag} (${user.id})`, inline: false },
            { name: '📧 이메일', value: account.email, inline: true },
            { name: '📦 구매상품', value: account.product, inline: true },
            { name: '🆔 계정 ID', value: account.id, inline: true },
            { name: '📅 구매일', value: purchaseDate.toLocaleDateString('ko-KR'), inline: true },
            { name: '⏰ 만료일', value: expiryDate.toLocaleDateString('ko-KR'), inline: true },
            { name: `${statusEmoji} 상태`, value: statusText, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'YouTube Premium Manager' });

    // 남은 일수 표시
    if (!isExpired) {
        embed.addFields({
            name: '⏳ 남은 기간',
            value: `${daysLeft}일`,
            inline: true
        });
    }

    return embed;
}

module.exports = {
    handleSelectAccount,
    handleAdminSelectAccount
};
