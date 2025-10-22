const {
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle
} = require('discord.js');

const { week1Command } = require('../../commands/week1');
const { manageCommand } = require('../../commands/manage');
const { historyCommand } = require('../../commands/history');

const { makePromptEmbed, makeErrorEmbed, makeSuccessEmbed } = require('../../utils/embeds');
const { hasBroadcasterPerm } = require('../../utils/roles');
const { listDays, setPartTime, addOrUpdateDay, removeDay } = require('../../tribunes/scheduleTimes');

// корневая панель (кнопки week1/manage/history/config)
function makePanelRoot() {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('panel|week').setLabel('📅 Опубликовать неделю (тип 1)').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('panel|manage').setLabel('🛠 Manage').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('panel|history').setLabel('📜 History').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('panel|config').setLabel('⚙️ Настройки').setStyle(ButtonStyle.Success),
        ),
    ];
}

function makeConfigRoot() {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('config|set-time').setLabel('🕒 Задать время части').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('config|add-day').setLabel('➕ Добавить день').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('config|remove-day').setLabel('🗑 Удалить день').setStyle(ButtonStyle.Danger),
        ),
    ];
}

function makeDaySelect(customId, placeholder) {
    const days = listDays(); // существующие дни из конфигурации времени
    const opts = days.length ? days.map(d => ({ label: d, value: d })) : [{ label: 'Нет дней', value: 'none' }];
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(placeholder)
            .setMinValues(1).setMaxValues(1)
            .addOptions(opts.slice(0,25))
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
    const modal = new ModalBuilder().setCustomId('config_add_day_modal').setTitle('Добавить день');
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('day').setLabel('День недели (напр. Четверг)').setStyle(TextInputStyle.Short).setRequired(true)
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

// открытие корня панели
async function handlePanelButtons(interaction, openRoot = false) {
    const [prefix, action, a2, a3] = (interaction.customId || 'panel|root').split('|');

    if (openRoot) {
        // проверяем роль для панели
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!hasBroadcasterPerm(member)) {
            return interaction.reply({ embeds: [makeErrorEmbed('❌ Только для Broadcaster.')], flags: 64 });
        }
        return interaction.reply({ embeds: [makePromptEmbed('Панель', 'Выберите действие:')], components: makePanelRoot(), flags: 64 });
    }

    if (prefix === 'panel') {
        if (action === 'week') return week1Command(interaction);
        if (action === 'manage') return manageCommand(interaction);
        if (action === 'history') return historyCommand(interaction);
        if (action === 'config') {
            const member = await interaction.guild.members.fetch(interaction.user.id);
            if (!hasBroadcasterPerm(member)) {
                return interaction.reply({ embeds: [makeErrorEmbed('❌ Только для Broadcaster.')], flags: 64 });
            }
            return interaction.reply({ embeds: [makePromptEmbed('Настройки расписания', 'Выберите опцию:')], components: makeConfigRoot(), flags: 64 });
        }
    }

    if (prefix === 'config') {
        if (action === 'set-time') {
            return interaction.reply({
                embeds: [makePromptEmbed('Время части', 'Выберите день:')],
                components: [makeDaySelect('cfg_day_for_time', 'День')],
                flags: 64
            });
        }
        if (action === 'add-day') {
            return interaction.showModal(makeAddDayModal());
        }
        if (action === 'remove-day') {
            return interaction.reply({
                embeds: [makePromptEmbed('Удалить день', 'Выберите день для удаления:')],
                components: [makeDaySelect('cfg_day_for_remove', 'День')],
                flags: 64
            });
        }
    }

    // кнопки выбора части для set-time
    if (prefix === 'cfg' && action === 'settime') {
        const day = a2;
        const part = a3;
        return interaction.showModal(makeTimeModal(day, part));
    }

    return false;
}

async function handlePanelSelects(interaction) {
    if (interaction.customId === 'cfg_day_for_time') {
        const day = interaction.values[0];
        if (day === 'none') return interaction.reply({ embeds: [makeErrorEmbed('Нет доступных дней.')], flags: 64 });
        return interaction.reply({
            embeds: [makePromptEmbed('Время части', `День: **${day}**\nВыберите часть:`)],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`cfg|settime|${day}|1`).setLabel('Часть 1').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`cfg|settime|${day}|2`).setLabel('Часть 2').setStyle(ButtonStyle.Secondary),
                ),
            ],
            flags: 64
        });
    }

    if (interaction.customId === 'cfg_day_for_remove') {
        const day = interaction.values[0];
        if (day === 'none') return interaction.reply({ embeds: [makeErrorEmbed('Нет доступных дней.')], flags: 64 });
        try {
            removeDay(day);
            return interaction.reply({ embeds: [makeSuccessEmbed(`✅ День **${day}** удалён из расписания.`)], flags: 64 });
        } catch (e) {
            return interaction.reply({ embeds: [makeErrorEmbed('❌ Не удалось удалить день.')], flags: 64 });
        }
    }

    return false;
}

async function handlePanelModals(interaction) {
    if (interaction.customId.startsWith('config_time_modal|')) {
        const [, day, part] = interaction.customId.split('|');
        const time = interaction.fields.getTextInputValue('time').trim();
        try {
            setPartTime(day, part, time);
            return interaction.reply({ embeds: [makeSuccessEmbed(`✅ Время для **${day}**, ч.${part}: **${time}**`)], flags: 64 });
        } catch {
            return interaction.reply({ embeds: [makeErrorEmbed('❌ Неверное время. Формат HH:MM.')], flags: 64 });
        }
    }

    if (interaction.customId === 'config_add_day_modal') {
        const day  = interaction.fields.getTextInputValue('day').trim();
        const name = interaction.fields.getTextInputValue('name').trim();
        const p1   = interaction.fields.getTextInputValue('p1').trim();
        const p2   = interaction.fields.getTextInputValue('p2').trim();
        try {
            addOrUpdateDay(day, { '1': p1, '2': p2 }, name);
            return interaction.reply({ embeds: [makeSuccessEmbed(`✅ Добавлен **${day}** — «${name}»: ч1 ${p1}, ч2 ${p2}`)], flags: 64 });
        } catch {
            return interaction.reply({ embeds: [makeErrorEmbed('❌ Проверьте данные. Формат времени HH:MM.')], flags: 64 });
        }
    }

    return false;
}

module.exports = {
    handlePanelButtons,
    handlePanelSelects,
    handlePanelModals,
};
