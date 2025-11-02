const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { exec } = require('child_process');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('업데이트')
        .setDescription('봇을 최신 버전으로 업데이트합니다.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const updateEmbed = new EmbedBuilder()
            .setColor(0xFFFF00)
            .setTitle('🔄 업데이트 진행 중')
            .setDescription('GitHub에서 최신 코드를 가져오는 중입니다...\n잠시만 기다려주세요.')
            .setTimestamp()
            .setFooter({ text: 'YouTube Premium Manager' });

        await interaction.editReply({ embeds: [updateEmbed] });

        // update.sh 스크립트 실행
        const scriptPath = path.join(__dirname, '../update.sh');

        exec(`bash ${scriptPath}`, { timeout: 120000 }, async (error, stdout, stderr) => {
            let resultEmbed;

            if (error) {
                console.error('업데이트 오류:', error);
                console.error('stderr:', stderr);

                resultEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ 업데이트 실패')
                    .setDescription('업데이트 중 오류가 발생했습니다.')
                    .addFields(
                        { name: '오류 내용', value: `\`\`\`${error.message.substring(0, 1000)}\`\`\`` }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'YouTube Premium Manager' });

                try {
                    await interaction.editReply({ embeds: [resultEmbed] });
                } catch (err) {
                    console.error('메시지 전송 실패:', err);
                }
                return;
            }

            // 성공
            const output = stdout.substring(0, 1800); // Discord 필드 제한

            resultEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ 업데이트 완료')
                .setDescription('봇이 최신 버전으로 업데이트되었습니다!')
                .addFields(
                    { name: '📋 업데이트 로그', value: `\`\`\`${output}\`\`\`` }
                )
                .addFields(
                    { name: '⚠️ 안내', value: '봇이 자동으로 재시작되었습니다.\n변경사항이 즉시 적용됩니다.' }
                )
                .setTimestamp()
                .setFooter({ text: 'YouTube Premium Manager' });

            try {
                await interaction.editReply({ embeds: [resultEmbed] });
            } catch (err) {
                console.error('메시지 전송 실패:', err);
            }
        });
    }
};
