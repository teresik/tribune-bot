// src/features/panel/handlers.js
const {
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle
} = require('discord.js');

const { week1Command } = require('../../commands/week1');
const { manageCommand } = require('../../commands/manage');
const { historyCommand } = require('../../commands/history');
// const { leaveCommand } = require('../../commands/leave'); // если понадобится — раскомментируй

const { makePromptEmbed, makeErrorEmbed, makeSuccessEmbed } = require('../../utils/embeds');
const { hasBroadcasterPerm } = require('../../utils/roles');
const {
    getActiveDays, setPartTime, addOrUpdateDay, removeDay
} = require('../../tribunes/scheduleTimes');

/* ---------- UI ---------- */
function makeConfigRoot() {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('config|set-time').setLabel('🕒 Задать время части').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('cfg|add-day-open').setLabel('➕ Добавить день').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('config|remove-day').setLabel('🗑 Удалить день').setStyle(ButtonStyle.Danger),
        ),
    ];
}

function makeDaySelect(customId, placeholder) {
    const days = getActiveDays();
    const opts = (days && days.length)
        ? days.map(d => ({ label: d, value: d }))
        : [{ label: 'Нет дней', value: 'none' }];

    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(placeholder)
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(opts.slice(0, 25))
    );
}

function makePartButtons(prefix, day) {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`${prefix}|${day}|1`).setLabel('Часть 1').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`${prefix}|${day}|2`).setLabel('Часть 2').setStyle(ButtonStyle.Secondary),
        ),
    ];
}

function makeTimeModal(day, part) {
    const modal = new ModalBuilder().setCustomId(`config_time_modal|${day}|${part}`).setTitle(`Время: ${day} ч.${part}`);
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('time').setLabel('Время (HH:MM)').setStyle(TextInputStyle.Short).setRequired(true)
        )
    );
    return modal;
}

function makeAddDayModal() {
    const modal = new ModalBuilder().setCustomId('cfg_modal_add_day').setTitle('Добавить день');
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('day').setLabel('День недели (например: Четверг)').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('name').setLabel('Название трибуны').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('p1').setLabel('Время 1-й части (HH:MM)').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('p2').setLabel('Время 2-й части (HH:MM)').setStyle(TextInputStyle.Short).setRequired(true)
        ),
    );
    return modal;
}

/* ---------- HANDLERS ---------- */
async function handlePanelButtons(interaction) {
    const [prefix, action, a2, a3] = interaction.customId.split('|');
    if (prefix !== 'panel' && prefix !== 'config' && prefix !== 'cfg') return false;

    // корневая панель
    if (prefix === 'panel') {
        if (action === 'week')  return week1Command(interaction);
        if (action === 'manage') return manageCommand(interaction);
        if (action === 'history') return historyCommand(interaction);
        // if (action === 'leave') return leaveCommand(interaction);

        if (action === 'config') {
            const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
            if (!member || !hasBroadcasterPerm(member)) {
                return interaction.reply({ embeds: [makeErrorEmbed('❌ Только для Broadcaster.')], flags: 64 });
            }
            return interaction.reply({
                embeds: [makePromptEmbed('Настройки расписания', 'Выберите опцию:')],
                components: makeConfigRoot(),
                flags: 64
            });
        }
    }

    // конфиг: кнопки
    if (prefix === 'config') {
        if (action === 'set-time') {
            return interaction.reply({
                embeds: [makePromptEmbed('Время части', 'Выберите день:')],
                components: [makeDaySelect('cfg_day_for_time', 'День')],
                flags: 64
            });
        }

        if (action === 'remove-day') {
            return interaction.reply({
                embeds: [makePromptEmbed('Удалить день', 'Выберите день для удаления:')],
                components: [makeDaySelect('cfg_day_for_remove', 'День')],
                flags: 64
            });
        }
    }

    // открыть модалку добавления дня (с названием)
    if (prefix === 'cfg' && action === 'add-day-open') {
        return interaction.showModal(makeAddDayModal());
    }

    // выбор части (после выбора дня) — кнопки cfg_settime|<day>|<part>
    if (prefix === 'cfg' && action === 'settime') {
        const day = a2;
        const part = a3;
        if (!day || !['1', '2'].includes(part)) {
            return interaction.reply({ embeds: [makeErrorEmbed('❌ Некорректные данные.')], flags: 64 });
        }
        return interaction.showModal(makeTimeModal(day, part));
    }

    return false;
}

async function handlePanelSelects(interaction) {
    // выбрали день для установки времени → выбрать часть
    if (interaction.customId === 'cfg_day_for_time') {
        const day = interaction.values[0];
        if (day === 'none') return interaction.reply({ embeds: [makeErrorEmbed('Нет доступных дней.')], flags: 64 });
        return interaction.reply({
            embeds: [makePromptEmbed('Время части', `День: **${day}**\nВыберите часть:`)],
            components: makePartButtons('cfg|settime', day),
            flags: 64
        });
    }

    // выбрали день для удаления
    if (interaction.customId === 'cfg_day_for_remove') {
        const day = interaction.values[0];
        if (day === 'none') return interaction.reply({ embeds: [makeErrorEmbed('Нет доступных дней.')], flags: 64 });
        try {
            removeDay(day);
            return interaction.reply({ embeds: [makeSuccessEmbed(`✅ День **${day}** удалён из активных.`)], flags: 64 });
        } catch (e) {
            console.error(e);
            return interaction.reply({ embeds: [makeErrorEmbed('❌ Не удалось удалить день.')], flags: 64 });
        }
    }

    return false;
}

async function handlePanelModals(interaction) {
    // модалка: задать время части
    if (interaction.customId.startsWith('config_time_modal|')) {
        const [, day, part] = interaction.customId.split('|');
        const time = interaction.fields.getTextInputValue('time').trim();
        const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

        if (!day || !['1', '2'].includes(part) || !HHMM.test(time)) {
            return interaction.reply({ embeds: [makeErrorEmbed('❌ Неверные данные. Формат времени HH:MM.')], flags: 64 });
        }
        try {
            setPartTime(day, part, time);
            return interaction.reply({ embeds: [makeSuccessEmbed(`✅ Время для **${day}**, часть ${part}: **${time}**`)], flags: 64 });
        } catch (e) {
            console.error(e);
            return interaction.reply({ embeds: [makeErrorEmbed('❌ Не удалось сохранить время.')], flags: 64 });
        }
    }

    // модалка: добавить день (с названием)
    if (interaction.customId === 'cfg_modal_add_day') {
        const day  = interaction.fields.getTextInputValue('day').trim();
        const name = interaction.fields.getTextInputValue('name').trim();
        const p1   = interaction.fields.getTextInputValue('p1').trim();
        const p2   = interaction.fields.getTextInputValue('p2').trim();
        const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

        if (!day || !name || !HHMM.test(p1) || !HHMM.test(p2)) {
            return interaction.reply({ embeds: [makeErrorEmbed('❌ Укажите день, название и время в формате HH:MM.')], flags: 64 });
        }
        try {
            addOrUpdateDay(day, name, p1, p2); // добавит в ACTIVE_DAYS и проставит имя
            return interaction.reply({
                embeds: [makeSuccessEmbed(`✅ Добавлен день **${day}** с названием «${name}». Время: ${p1} / ${p2}. Он появится в следующем расписании.`)],
                flags: 64
            });
        } catch (e) {
            console.error(e);
            return interaction.reply({ embeds: [makeErrorEmbed('❌ Не удалось добавить день.')], flags: 64 });
        }
    }

    return false;
}

module.exports = {
    handlePanelButtons,
    handlePanelSelects,
    handlePanelModals,
};
