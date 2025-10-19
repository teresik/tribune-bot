const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { SCHEDULE_BY_WEEK } = require('../constants');
const { getUpcomingWeekDates } = require('../utils/dates');
const { formatSchedule } = require('../tribunes/formatters');
const { loadData, saveData } = require('../services/dataStore');
const { saveStorage } = require('../services/storageStore');

function createDayButtons(tribunes) {
    const BUTTONS_PER_ROW = 5;
    const buttons = tribunes.map(d => new ButtonBuilder()
        .setCustomId(`day|${d.day} ${d.date.toLocaleDateString('ru-RU')}`)
        .setLabel(`${d.day} ${d.date.toLocaleDateString('ru-RU')}`)
        .setStyle(ButtonStyle.Primary));
    const rows = [];
    for (let i = 0; i < buttons.length; i += BUTTONS_PER_ROW) rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + BUTTONS_PER_ROW)));
    return rows;
}

async function week1Command(interaction) {
    const days = SCHEDULE_BY_WEEK[1];
    const tribunes = getUpcomingWeekDates(new Date(), days);
    const structure = {};
    for (const { day, date } of tribunes) {
        const key = `${day} ${date.toLocaleDateString('ru-RU')}`;
        structure[key] = {
            parts: {
                '1': { ведущий: [], замена: [] },
                '2': { ведущий: [], замена: [] }
            }
        };
    }
    const content = formatSchedule(structure, tribunes);
    const buttons = createDayButtons(tribunes);

    const msg = await interaction.channel.send({ content, components: buttons }).catch(() => null);
    if (!msg) return interaction.reply({ content: '❌ Не удалось отправить расписание.', flags: 64 });

    saveData(structure);
    saveStorage({ messageId: msg.id, lastWeek: 1, dates: tribunes.map(d => ({ day: d.day, date: d.date.toLocaleDateString('ru-RU') })) });
    return interaction.reply({ content: '✅ Расписание успешно опубликовано!', flags: 64 });
}

module.exports = { week1Slash: new SlashCommandBuilder().setName('week1').setDescription('Опубликовать расписание недели типа 1').toJSON(), week1Command };
