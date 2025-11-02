const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { resetConfig } = require('../utils/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('설정초기화')
        .setDescription('봇 설정을 초기화합니다. (주의: 모든 설정이 삭제됩니다)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('⚠️ 설정 초기화 확인')
            .setDescription('**정말로 봇 설정을 초기화하시겠습니까?**\n\n모든 설정이 삭제되며, 다시 `/시작하기`를 실행해야 합니다.')
            .addFields(
                { name: '⚠️ 주의', value: '이 작업은 되돌릴 수 없습니다!' },
                { name: '✅ 확인', value: '15초 이내에 `확인`을 입력하세요.' },
                { name: '❌ 취소', value: '그 외의 입력은 취소됩니다.' }
            )
            .setTimestamp()
            .setFooter({ text: 'YouTube Premium Manager' });

        await interaction.reply({ embeds: [embed], ephemeral: true });

        // 메시지 수집기
        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 15000, max: 1 });

        collector.on('collect', async (message) => {
            if (message.content === '확인') {
                const success = resetConfig();

                if (success) {
                    const successEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('✅ 설정 초기화 완료')
                        .setDescription('봇 설정이 초기화되었습니다.')
                        .addFields(
                            { name: '🔄 다음 단계', value: '`/시작하기`를 실행하여 다시 설정하세요.' }
                        )
                        .setTimestamp()
                        .setFooter({ text: 'YouTube Premium Manager' });

                    await interaction.followUp({ embeds: [successEmbed], ephemeral: true });
                    await message.delete().catch(() => {});
                } else {
                    await interaction.followUp({ content: '❌ 설정 초기화에 실패했습니다.', ephemeral: true });
                }
            } else {
                const cancelEmbed = new EmbedBuilder()
                    .setColor(0xFFFF00)
                    .setTitle('❌ 취소됨')
                    .setDescription('설정 초기화가 취소되었습니다.')
                    .setTimestamp()
                    .setFooter({ text: 'YouTube Premium Manager' });

                await interaction.followUp({ embeds: [cancelEmbed], ephemeral: true });
                await message.delete().catch(() => {});
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time' && collected.size === 0) {
                await interaction.followUp({ content: '⏱️ 시간이 초과되어 취소되었습니다.', ephemeral: true });
            }
        });
    }
};
