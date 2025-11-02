const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addUser } = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('유저추가')
        .setDescription('유튜브 프리미엄 구독 유저를 추가합니다.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option =>
            option
                .setName('유저')
                .setDescription('추가할 유저를 선택하세요')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('구매상품')
                .setDescription('구매한 상품을 선택하세요')
                .setRequired(true)
                .addChoices(
                    { name: '6개월', value: '6개월' },
                    { name: '1년', value: '1년' }
                )
        )
        .addStringOption(option =>
            option
                .setName('이메일')
                .setDescription('유튜브 프리미엄 이메일 주소')
                .setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('유저');
        const product = interaction.options.getString('구매상품');
        const email = interaction.options.getString('이메일');

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return await interaction.reply({
                content: '❌ 올바른 이메일 주소를 입력해주세요.',
                ephemeral: true
            });
        }

        // 유저 추가
        const success = addUser(user.id, {
            email: email,
            product: product,
            addedBy: interaction.user.id
        });

        if (success) {
            // 만료일 계산
            const expiryDate = new Date();
            if (product === '6개월') {
                expiryDate.setMonth(expiryDate.getMonth() + 6);
            } else if (product === '1년') {
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            }

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ 유저 추가 완료')
                .setDescription(`${user} 님이 성공적으로 등록되었습니다.`)
                .addFields(
                    { name: '👤 유저', value: `${user.tag}`, inline: true },
                    { name: '📦 구매상품', value: product, inline: true },
                    { name: '📧 이메일', value: email, inline: true },
                    { name: '📅 등록일', value: new Date().toLocaleDateString('ko-KR'), inline: true },
                    { name: '⏰ 만료일', value: expiryDate.toLocaleDateString('ko-KR'), inline: true },
                    { name: '👨‍💼 등록자', value: `${interaction.user.tag}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'YouTube Premium Manager' });

            await interaction.reply({ embeds: [embed] });

            // 유저에게 DM 전송 시도
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('🎉 유튜브 프리미엄 구독 등록 완료')
                    .setDescription('유튜브 프리미엄 구독이 등록되었습니다!')
                    .addFields(
                        { name: '📦 구매상품', value: product, inline: true },
                        { name: '📧 이메일', value: email, inline: true },
                        { name: '📅 등록일', value: new Date().toLocaleDateString('ko-KR'), inline: true },
                        { name: '⏰ 만료일', value: expiryDate.toLocaleDateString('ko-KR'), inline: true }
                    )
                    .setDescription('`/내정보` 명령어로 언제든지 정보를 확인할 수 있습니다.')
                    .setTimestamp()
                    .setFooter({ text: 'YouTube Premium Manager' });

                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log(`${user.tag}에게 DM을 보낼 수 없습니다.`);
            }
        } else {
            await interaction.reply({
                content: '❌ 유저 추가 중 오류가 발생했습니다.',
                ephemeral: true
            });
        }
    }
};
