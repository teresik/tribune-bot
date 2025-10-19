const { makePromptEmbed, makeSuccessEmbed, makeErrorEmbed } = require('../../utils/embeds');
const { loadData, saveData } = require('../../services/dataStore');
const { updateMainMessage } = require('../../handlers/updateMessage');
const { hasBroadcasterPerm, hasGenderRole } = require('../../utils/roles');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, UserSelectMenuBuilder } = require('discord.js');
const { ComponentType } = require('discord.js');

function createDayButtonsFromData(data, prefix) {
    const days = Object.keys(data);
    if (!days.length) return [];
    const btns = days.map(d => new ButtonBuilder().setCustomId(`${prefix}_day|${d}`).setLabel(d).setStyle(ButtonStyle.Secondary));
    const rows = [];
    for (let i = 0; i < btns.length; i += 5) rows.push(new ActionRowBuilder().addComponents(btns.slice(i, i + 5)));
    return rows;
}
function createPartButtonsManage(prefix, day) {
    const btns = ['1','2'].map(p =>
        new ButtonBuilder()
            .setCustomId(`${prefix}_part|${day}|${p}`)
            .setLabel(`${p} часть`)
            .setStyle(ButtonStyle.Secondary)
    );
    return [new ActionRowBuilder().addComponents(btns)];
}
function createRoleButtonsManage(prefix, day, part) {
    const btns = ['ведущий','замена'].map(role => new ButtonBuilder().setCustomId(`${prefix}_role|${day}|${part}|${role}`).setLabel(role).setStyle(role==='ведущий'?ButtonStyle.Success:ButtonStyle.Primary));
    return [new ActionRowBuilder().addComponents(btns)];
}
function makeRegisteredUsersSelect(data, day, part, role, customId) {
    const users = data?.[day]?.parts?.[part]?.[role] || [];
    if (!users.length) return null;
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId(customId).setPlaceholder('Выберите участника')
            .addOptions(users.slice(0,25).map(uid => ({ label: `ID:${uid}`.slice(0,25), value: uid })))
    );
}

async function slashManage(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!hasBroadcasterPerm(member)) {
        return interaction.reply({ embeds: [makeErrorEmbed('❌ У вас нет прав для управления записями.')], flags: 64 });
    }
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('manage_start|remove').setLabel('🗑 Удалить участника').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('manage_start|add').setLabel('➕ Записать участника').setStyle(ButtonStyle.Success)
    );
    return interaction.reply({ embeds: [makePromptEmbed('Управление трибунами', 'Выберите режим управления:')], components: [row], flags: 64 });
}

/* ниже — обработчики кнопок/селектов manage (взяты из твоего файла, без функциональных изменений) */
async function handleManageButtons(interaction) {
    const [step, value] = interaction.customId.split('|');

    if (step === 'manage_start') {
        const mode = value;
        const data = loadData();
        const rows = createDayButtonsFromData(data, `manage_${mode}`);
        if (!rows.length) return interaction.reply({ embeds: [makeErrorEmbed('❌ Нет доступных дней.')], flags: 64 });
        return interaction.reply({ embeds: [makePromptEmbed('Управление трибунами', `Режим: **${mode==='remove'?'Удаление':'Запись'}**\nВыберите день:`)], components: rows, flags: 64 });
    }
    if (step === 'manage_remove_day') {
        const selectedDay = value;
        return interaction.reply({ embeds: [makePromptEmbed('Удаление участника', `День: **${selectedDay}**\nВыберите часть:`)], components: createPartButtonsManage('manage_remove', selectedDay), flags: 64 });
    }
    if (step === 'manage_remove_part') {
        const [_, day, part] = interaction.customId.split('|');
        return interaction.reply({ embeds: [makePromptEmbed('Удаление участника', `День: **${day}**, часть: **${part}**\nВыберите роль:`)], components: createRoleButtonsManage('manage_remove', day, part), flags: 64 });
    }
    if (step === 'manage_remove_role') {
        const [_, day, part, role] = interaction.customId.split('|');
        const data = loadData();
        const sel = makeRegisteredUsersSelect(data, day, part, role, `manage_remove_pick|${day}|${part}|${role}`);
        if (!sel) return interaction.reply({ embeds: [makeErrorEmbed('❌ В этой позиции нет участников.')], flags: 64 });
        return interaction.reply({ embeds: [makePromptEmbed('Удаление участника', `Выберите участника для удаления\n${day}, ч.${part}, ${role}`)], components: [sel], flags: 64 });
    }

    if (step === 'manage_add_day') {
        const selectedDay = value;
        return interaction.reply({ embeds: [makePromptEmbed('Запись участника', `День: **${selectedDay}**\nВыберите часть:`)], components: createPartButtonsManage('manage_add', selectedDay), flags: 64 });
    }
    if (step === 'manage_add_part') {
        const [_, day, part] = interaction.customId.split('|');
        return interaction.reply({ embeds: [makePromptEmbed('Запись участника', `День: **${day}**, часть: **${part}**\nВыберите роль:`)], components: createRoleButtonsManage('manage_add', day, part), flags: 64 });
    }
    if (step === 'manage_add_role') {
        const { UserSelectMenuBuilder } = require('discord.js');
        const [_, day, part, role] = interaction.customId.split('|');
        const picker = new ActionRowBuilder().addComponents(new UserSelectMenuBuilder().setCustomId(`manage_add_pick|${day}|${part}|${role}`).setPlaceholder('Выберите пользователя').setMaxValues(1).setMinValues(1));
        return interaction.reply({ embeds: [makePromptEmbed('Запись участника', `День: **${day}**, часть: **${part}**, роль: **${role}**\nВыберите пользователя:`)], components: [picker], flags: 64 });
    }

    if (step === 'manage' && value === 'open') {
        // legacy ветка — можно оставить как есть или удалить
        return interaction.reply({ content: 'Legacy панель скрыта в модульной версии.', flags: 64 });
    }

    return false;
}

async function handleManageSelects(interaction) {
    // remove pick
    if (interaction.customId.startsWith('manage_remove_pick')) {
        const [_, day, part, role] = interaction.customId.split('|');
        const pickedUserId = interaction.values[0];
        const { appendHistory } = require('../../services/historyStore');
        const data = loadData();
        if (!data?.[day]?.parts?.[part]?.[role]) return interaction.reply({ embeds: [makeErrorEmbed('❌ Неверные данные.')], flags: 64 });
        data[day].parts[part][role] = data[day].parts[part][role].filter(id => id !== pickedUserId);
        saveData(data);
        await require('../../handlers/updateMessage').updateMainMessage(interaction.client);
        appendHistory({ action: 'remove', actorId: interaction.user.id, targetId: pickedUserId, day, part, role });
        return interaction.reply({ embeds: [makeSuccessEmbed(`✅ Удалён <@${pickedUserId}> из ${day}, ч.${part}, ${role}.`)], flags: 64 });
    }

    // main list (legacy)
    if (interaction.customId === 'manage_select') {
        const [day, part, role, userId] = interaction.values[0].split('|');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`manage_action|move|${day}|${part}|${role}|${userId}`).setLabel('📦 Перенести').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`manage_action|remove|${day}|${part}|${role}|${userId}`).setLabel('🗑 Удалить').setStyle(ButtonStyle.Danger)
        );
        return interaction.reply({ content: `Выберите действие для <@${userId}> — ${day}, часть ${part}, роль: ${role}`, components: [row] });
    }

    // add pick (user select)
    // add pick (user select) — фикс «Ошибка взаимодействия»
    if (
        interaction.componentType === ComponentType.UserSelect &&
        interaction.customId.startsWith('manage_add_pick')
    ) {
        await interaction.deferReply({ flags: 64 }); // даём боту больше 3 сек.

        const [_, day, part, role] = interaction.customId.split('|');
        const pickedUserId = interaction.values[0];
        const data = loadData();

        if (!data[day]) data[day] = { parts: { '1': { ведущий: [], замена: [] }, '2': { ведущий: [], замена: [] }, '3': { ведущий: [], замена: [] } } };
        if (!data[day].parts[part]) data[day].parts[part] = { ведущий: [], замена: [] };
        if (!Array.isArray(data[day].parts[part][role])) data[day].parts[part][role] = [];

        const already = data[day].parts[part][role];
        const maxSlots = role === 'ведущий' ? 2 : 3;

        if (already.includes(pickedUserId)) {
            return interaction.editReply({ embeds: [makeErrorEmbed('⚠️ Этот пользователь уже записан на эту позицию.')] });
        }
        if (already.length >= maxSlots) {
            return interaction.editReply({ embeds: [makeErrorEmbed('❌ Места заняты.')] });
        }

        const member = await interaction.guild.members.fetch(pickedUserId).catch(() => null);
        if (!member) {
            return interaction.editReply({ embeds: [makeErrorEmbed('❌ Не удалось получить участника.')] });
        }

        const isMale = hasGenderRole(member, 'мужская');
        const isFemale = hasGenderRole(member, 'женская');
        if (!isMale && !isFemale) {
            return interaction.editReply({ embeds: [makeErrorEmbed('❌ У пользователя должна быть роль с «мужская» или «женская».')] });
        }

        if (role === 'ведущий') {
            const currentMembers = already
                .map(id => interaction.guild.members.cache.get(id))
                .filter(Boolean);
            const hasMale = currentMembers.some(m => hasGenderRole(m, 'мужская'));
            const hasFemale = currentMembers.some(m => hasGenderRole(m, 'женская'));
            if ((hasMale && isMale) || (hasFemale && isFemale)) {
                return interaction.editReply({ embeds: [makeErrorEmbed('❌ На ведущего нельзя добавить участника того же пола, если уже есть такой.')] });
            }
        }

        already.push(pickedUserId);
        saveData(data);
        await updateMainMessage(interaction.client);

        const { appendHistory } = require('../../services/historyStore');
        appendHistory({ action: 'register', actorId: interaction.user.id, targetId: pickedUserId, day, part, role });

        const { createUnregisterButton } = require('../../handlers/unregisterBtn');
        const unregisterBtn = createUnregisterButton(day, part, role, pickedUserId);

        return interaction.editReply({
            embeds: [makeSuccessEmbed(`✅ Добавлен <@${pickedUserId}> в ${day}, ч.${part}, ${role}.`)],
            components: unregisterBtn
        });
    }


    return false;
}

module.exports = { slashManage, handleManageButtons, handleManageSelects };
