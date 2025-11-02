const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { getUserAccounts } = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('정보조회')
        .setDescription('특정 유저의 YouTube Premium 정보를 조회합니다.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option =>
            option
                .setName('유저')
                .setDescription('조회할 유저를 선택하세요')
                .setRequired(true)
        ),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('유저');
        const accounts = getUserAccounts(targetUser.id);

        if (accounts.length === 0) {
            return await interaction.reply({
                content: `❌ ${targetUser} 님은 등록된 계정이 없습니다.`,
                ephemeral: true
            });
        }

        // 계정이 1개인 경우 바로 표시
        if (accounts.length === 1) {
            const account = accounts[0];
            const embed = createAdminAccountEmbed(targetUser, account);
            return await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        // 계정이 여러 개인 경우 드롭다운 표시
        const selectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`admin_select_account_${targetUser.id}`)
                    .setPlaceholder('조회할 계정을 선택하세요')
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
            content: `📋 ${targetUser} 님의 계정을 선택해주세요:`,
            components: [selectMenu],
            ephemeral: true
        });
    }
};

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
