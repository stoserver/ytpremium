const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser } = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('내정보')
        .setDescription('내 유튜브 프리미엄 구독 정보를 확인합니다.'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const userData = getUser(userId);

        if (!userData) {
            return await interaction.reply({
                content: '❌ 등록된 정보가 없습니다. 관리자에게 문의해주세요.',
                ephemeral: true
            });
        }

        const purchaseDate = new Date(userData.purchaseDate);
        const expiryDate = new Date(userData.expiryDate);
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
            .setTitle('📊 내 유튜브 프리미엄 정보')
            .setThumbnail(interaction.user.displayAvatarURL())
            .addFields(
                { name: '👤 유저', value: `${interaction.user.tag}`, inline: true },
                { name: '📧 이메일', value: userData.email, inline: true },
                { name: '📦 구매상품', value: userData.product, inline: true },
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

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
