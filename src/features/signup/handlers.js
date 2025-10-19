const { makePromptEmbed, makeSuccessEmbed, makeErrorEmbed } = require('../../utils/embeds');
const { createUserSession, getUserSession } = require('../../state');
const { loadData, saveData } = require('../../services/dataStore');
const { updateMainMessage } = require('../../handlers/updateMessage');
const { hasGenderRole } = require('../../utils/roles');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { PART_TIMES } = require('../../tribunes/scheduleTimes');

function createPartButtons() {
    // только 1 и 2 часть, без запасной
    const buttons = ['1', '2'].map(p =>
        new ButtonBuilder()
            .setCustomId(`part|${p}`)
            .setLabel(`${p} часть`)
            .setStyle(ButtonStyle.Secondary)
    );
    return [new ActionRowBuilder().addComponents(buttons)];
}

function createUnregisterButton(day, part, role, userId) {
    try {
        const dayName = day.split(' ')[0];
        const dateParts = day.split(' ')[1].split('.');
        const dateStr = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        const timeStr = PART_TIMES[dayName]?.[part] || '00:00';
        const date = new Date(`${dateStr}T${timeStr}:00`);
        const now = new Date();
        const diffMs = date - now;
        if (diffMs < 10800000) return [];
        return [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`unreg|${day}|${part}|${role}|${userId}`)
                    .setLabel('Отписаться')
                    .setStyle(ButtonStyle.Secondary)
            )
        ];
    } catch {
        return [];
    }
}

async function handleSignupButtons(interaction) {
    const [step, value] = interaction.customId.split('|');
    const userId = interaction.user.id;

    if (step === 'day') {
        createUserSession(userId, { day: value });
        return interaction.reply({
            embeds: [makePromptEmbed('Запись на трибуну', `День: **${value}**\nВыберите часть:`)],
            components: createPartButtons(),
            flags: 64
        });
    }

    if (step === 'part') {
        const session = getUserSession(userId);
        if (!session?.day) {
            return interaction.reply({ embeds: [makeErrorEmbed('Сначала выберите день.')], flags: 64 });
        }
        // на всякий случай отсекаем «3»
        if (!['1','2'].includes(value)) {
            return interaction.reply({ embeds: [makeErrorEmbed('Доступны только 1 и 2 части.')], flags: 64 });
        }
        session.part = value;
        return interaction.reply({
            embeds: [makePromptEmbed('Запись на трибуну', `День: **${session.day}**\nЧасть: **${value}**\nВыберите роль:`)],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('role|ведущий').setLabel('Ведущий').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('role|замена').setLabel('Замена').setStyle(ButtonStyle.Primary)
                )
            ],
            flags: 64
        });
    }

    if (step === 'role') {
        const session = getUserSession(userId);
        if (!session?.day || !session?.part) {
            return interaction.reply({ embeds: [makeErrorEmbed('Сначала выберите день и часть.')], flags: 64 });
        }
        if (!['1','2'].includes(session.part)) {
            return interaction.reply({ embeds: [makeErrorEmbed('Доступны только 1 и 2 части.')], flags: 64 });
        }

        const data = loadData();
        const { day, part } = session;
        const role = value;

        if (!data[day]) {
            return interaction.reply({ embeds: [makeErrorEmbed('❌ Неверная дата.')], flags: 64 });
        }
        if (!data[day].parts[part]) data[day].parts[part] = { ведущий: [], замена: [] };
        if (!Array.isArray(data[day].parts[part][role])) data[day].parts[part][role] = [];

        const maxSlots = role === 'ведущий' ? 2 : 3;
        const already = data[day].parts[part][role];

        if (already.includes(userId)) {
            return interaction.reply({ embeds: [makeErrorEmbed('⚠️ Вы уже зарегистрированы на эту роль.')], flags: 64 });
        }
        if (already.length >= maxSlots) {
            return interaction.reply({ embeds: [makeErrorEmbed('❌ Все места заняты.')], flags: 64 });
        }

        const member = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!member) {
            return interaction.reply({ embeds: [makeErrorEmbed('❌ Не удалось получить информацию о вас.')], flags: 64 });
        }

        const isMale = hasGenderRole(member, 'мужская');
        const isFemale = hasGenderRole(member, 'женская');
        if (!isMale && !isFemale) {
            return interaction.reply({ embeds: [makeErrorEmbed('❌ У вас должна быть роль с «мужская» или «женская».')], flags: 64 });
        }

        // симметричная проверка пола для "ведущий"
        if (role === 'ведущий') {
            const currentUsers = already.map(id => interaction.guild.members.cache.get(id)).filter(Boolean);
            const hasMale = currentUsers.some(m => hasGenderRole(m, 'мужская'));
            const hasFemale = currentUsers.some(m => hasGenderRole(m, 'женская'));
            if (hasFemale && isFemale) {
                return interaction.reply({
                    embeds: [makeErrorEmbed('❌ На роль ведущего нельзя регистрироваться, если уже есть участник того же пола.')],
                    flags: 64
                });
            }
        }

        already.push(userId);
        saveData(data);
        await updateMainMessage(interaction.client);

        const unregisterBtn = createUnregisterButton(day, part, role, userId);
        return interaction.reply({
            embeds: [makeSuccessEmbed(`✅ Вы записаны: **${day}**, часть **${part}**, роль **${role}**.`)],
            components: unregisterBtn,
            flags: 64
        });
    }

    return false;
}

module.exports = { handleSignupButtons, createUnregisterButton };
