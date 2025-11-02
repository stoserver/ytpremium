const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addAccount, getUserAccounts } = require('../utils/database');
const { readConfig } = require('../utils/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('유저추가')
        .setDescription('유튜브 프리미엄 구독 계정을 추가합니다.')
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

        // 계정 추가
        const account = addAccount(user.id, {
            email: email,
            product: product,
            addedBy: interaction.user.id
        });

        if (account) {
            const purchaseDate = new Date(account.purchaseDate);
            const expiryDate = new Date(account.expiryDate);
            const accountCount = getUserAccounts(user.id).length;
            const config = readConfig();

            // 구매자 역할 부여
            try {
                const member = await interaction.guild.members.fetch(user.id);
                if (config.buyerRoleId) {
                    const buyerRole = interaction.guild.roles.cache.get(config.buyerRoleId);
                    if (buyerRole && !member.roles.cache.has(config.buyerRoleId)) {
                        await member.roles.add(buyerRole);
                        console.log(`✅ ${user.tag}에게 구매자 역할 부여 완료`);
                    }
                }
            } catch (error) {
                console.error('역할 부여 중 오류:', error);
            }

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ 계정 추가 완료')
                .setDescription(`${user} 님에게 YouTube Premium 계정이 추가되었습니다.`)
                .addFields(
                    { name: '👤 유저', value: `${user.tag}`, inline: true },
                    { name: '📦 구매상품', value: product, inline: true },
                    { name: '📧 이메일', value: email, inline: true },
                    { name: '📅 등록일', value: purchaseDate.toLocaleDateString('ko-KR'), inline: true },
                    { name: '⏰ 만료일', value: expiryDate.toLocaleDateString('ko-KR'), inline: true },
                    { name: '👨‍💼 등록자', value: `${interaction.user.tag}`, inline: true },
                    { name: '📊 총 계정 수', value: `${accountCount}개`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'YouTube Premium Manager' });

            await interaction.reply({ embeds: [embed] });

            // 로그 채널에 기록
            if (config.logChannelId) {
                const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('📝 계정 추가 로그')
                        .setDescription(`새로운 YouTube Premium 계정이 추가되었습니다.`)
                        .addFields(
                            { name: '👤 대상 유저', value: `${user.tag} (${user.id})`, inline: false },
                            { name: '📦 구매상품', value: product, inline: true },
                            { name: '📧 이메일', value: email, inline: true },
                            { name: '📅 등록일', value: purchaseDate.toLocaleDateString('ko-KR'), inline: true },
                            { name: '⏰ 만료일', value: expiryDate.toLocaleDateString('ko-KR'), inline: true },
                            { name: '👨‍💼 등록자', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false },
                            { name: '📊 총 계정 수', value: `${accountCount}개`, inline: true }
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

            // 유저에게 DM 전송 시도
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('🎉 유튜브 프리미엄 계정 등록 완료')
                    .setDescription('새로운 YouTube Premium 계정이 등록되었습니다!')
                    .addFields(
                        { name: '📦 구매상품', value: product, inline: true },
                        { name: '📧 이메일', value: email, inline: true },
                        { name: '📅 등록일', value: purchaseDate.toLocaleDateString('ko-KR'), inline: true },
                        { name: '⏰ 만료일', value: expiryDate.toLocaleDateString('ko-KR'), inline: true },
                        { name: '📊 총 계정 수', value: `${accountCount}개`, inline: true }
                    )
                    .addFields({
                        name: '📋 정보 확인',
                        value: '패널의 `📊 내 정보 확인` 버튼을 클릭하여 언제든지 정보를 확인할 수 있습니다.'
                    })
                    .setTimestamp()
                    .setFooter({ text: 'YouTube Premium Manager' });

                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log(`${user.tag}에게 DM을 보낼 수 없습니다.`);
            }
        } else {
            await interaction.reply({
                content: '❌ 계정 추가 중 오류가 발생했습니다.',
                ephemeral: true
            });
        }
    }
};
