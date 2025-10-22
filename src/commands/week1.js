const { getUpcomingWeekDates } = require('../utils/dates');
const { formatSchedule } = require('../tribunes/formatters');
const { saveData } = require('../services/dataStore');
const { saveStorage } = require('../services/storageStore'); // <-- ВАЖНО
const { createDayButtons } = require('../features/signup/ui');

module.exports.week1Command = async (interaction) => {
    try {
        const days = ['Среда', 'Пятница', 'Воскресенье'];
        const tribunes = getUpcomingWeekDates(new Date(), days);

        const structure = {};
        for (const { day, date } of tribunes) {
            const key = `${day} ${date.toLocaleDateString('ru-RU')}`;
            structure[key] = { parts: { '1': { 'ведущий': [], 'замена': [] }, '2': { 'ведущий': [], 'замена': [] } } };
        }

        const content = formatSchedule(structure, tribunes);
        const components = createDayButtons(tribunes);

        const msg = await interaction.channel.send({ content, components });

        saveData(structure);
        saveStorage({
            messageId: msg.id,
            lastWeek: 1,
            dates: tribunes.map(d => ({ day: d.day, date: d.date.toLocaleDateString('ru-RU') }))
        });

        await interaction.reply({ content: '✅ Расписание опубликовано!', flags: 64 });
    } catch (e) {
        console.error('week1Command error:', e);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: '❌ Не удалось опубликовать расписание.', flags: 64 }).catch(()=>{});
        } else {
            await interaction.reply({ content: '❌ Не удалось опубликовать расписание.', flags: 64 }).catch(()=>{});
        }
    }
};
