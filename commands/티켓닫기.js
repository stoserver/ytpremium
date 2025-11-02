const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { readConfig } = require('../utils/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('티켓닫기')
        .setDescription('현재 티켓을 닫습니다.'),

    async execute(interaction) {
        const channel = interaction.channel;
        const config = readConfig();

        // 티켓 채널인지 확인
        if (!channel.name.startsWith('ticket-')) {
            return await interaction.reply({
                content: '❌ 이 명령어는 티켓 채널에서만 사용할 수 있습니다.',
                ephemeral: true
            });
        }

        await interaction.reply({
            content: '🔒 5초 후에 티켓이 닫힙니다...',
            ephemeral: false
        });

        const closeEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🔒 티켓 종료')
            .setDescription(`티켓이 ${interaction.user}에 의해 종료되었습니다.`)
            .setTimestamp()
            .setFooter({ text: 'YouTube Premium Manager' });

        await channel.send({ embeds: [closeEmbed] });

        // 로그 채널에 기록
        if (config.logChannelId) {
            const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('🔒 티켓 종료 로그')
                    .setDescription(`티켓이 종료되었습니다.`)
                    .addFields(
                        { name: '🔗 티켓 채널', value: channel.name, inline: true },
                        { name: '👤 종료자', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                        { name: '⏰ 종료 시간', value: new Date().toLocaleString('ko-KR'), inline: true }
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

        // 5초 후 채널 삭제
        setTimeout(async () => {
            try {
                await channel.delete();
            } catch (error) {
                console.error('티켓 채널 삭제 오류:', error);
            }
        }, 5000);
    }
};
