const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendPanel } = require('../utils/panel');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('패널재전송')
        .setDescription('정보 확인 패널을 재전송합니다.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // config에서 채널 ID 가져오기
        const channelId = config.panelChannelId;

        if (!channelId || channelId === '여기에_채널_ID_입력') {
            return await interaction.editReply({
                content: '❌ config.json에서 panelChannelId를 먼저 설정해주세요.',
                ephemeral: true
            });
        }

        const channel = interaction.guild.channels.cache.get(channelId);

        if (!channel) {
            return await interaction.editReply({
                content: '❌ 채널을 찾을 수 없습니다. config.json의 채널 ID를 확인해주세요.',
                ephemeral: true
            });
        }

        const success = await sendPanel(channel);

        if (success) {
            await interaction.editReply({
                content: `✅ 패널이 ${channel}에 전송되었습니다.`,
                ephemeral: true
            });
        } else {
            await interaction.editReply({
                content: '❌ 패널 전송 중 오류가 발생했습니다.',
                ephemeral: true
            });
        }
    }
};
