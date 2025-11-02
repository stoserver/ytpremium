const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function createPanelEmbed() {
    return new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🎬 YouTube Premium 정보 패널')
        .setDescription('아래 버튼을 클릭하여 기능을 사용하세요!')
        .addFields(
            {
                name: '📊 내 정보 확인',
                value: '`내 정보 확인` 버튼을 클릭하여 등록된 YouTube Premium 정보를 확인할 수 있습니다.',
                inline: false
            },
            {
                name: '🎫 티켓 생성',
                value: '`티켓 생성` 버튼을 클릭하여 관리자와 1:1 문의를 할 수 있습니다.',
                inline: false
            }
        )
        .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/2560px-YouTube_full-color_icon_%282017%29.svg.png')
        .setTimestamp()
        .setFooter({ text: 'YouTube Premium Manager' });
}

function createPanelButtons() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('check_info')
                .setLabel('📊 내 정보 확인')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel('🎫 티켓 생성')
                .setStyle(ButtonStyle.Success)
        );
}

async function sendPanel(channel) {
    const embed = createPanelEmbed();
    const buttons = createPanelButtons();

    try {
        await channel.send({
            embeds: [embed],
            components: [buttons]
        });
        return true;
    } catch (error) {
        console.error('패널 전송 오류:', error);
        return false;
    }
}

module.exports = {
    createPanelEmbed,
    createPanelButtons,
    sendPanel
};
