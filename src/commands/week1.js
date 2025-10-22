// src/commands/week1.js
const { getUpcomingWeekDates } = require('../utils/dates');
const { loadData, saveData } = require('../services/dataStore');
const { formatSchedule } = require('../tribunes/formatters');
const { getActiveDays } = require('../tribunes/scheduleTimes');

async function week1Command(interaction) {
    try {
        const days = getActiveDays(); // <-- динамический список
        if (!Array.isArray(days) || !days.length) {
            return interaction.reply({ content: '❌ Не настроены активные дни.', flags: 64 });
        }

        const tribunes = getUpcomingWeekDates(new Date(), days);
        if (!Array.isArray(tribunes) || !tribunes.length) {
            return interaction.reply({ content: '❌ Не удалось создать расписание.', flags: 64 });
        }

        const structure = {};
        for (const { day, date } of tribunes) {
            const key = `${day} ${date.toLocaleDateString('ru-RU')}`;
            structure[key] = { parts: { '1': { ведущий: [], замена: [] }, '2': { ведущий: [], замена: [] } } };
        }

        const content = formatSchedule(structure, tribunes);
        const msg = await interaction.channel.send({ content }).catch(() => null);
        if (!msg) return interaction.reply({ content: '❌ Не удалось отправить расписание.', flags: 64 });

        saveData(structure);
        await interaction.reply({ content: '✅ Расписание опубликовано!', flags: 64 });
    } catch (e) {
        console.error('week1 error:', e);
        return interaction.reply({ content: '❌ Ошибка при создании расписания.', flags: 64 });
    }
}

module.exports = { week1Command };
