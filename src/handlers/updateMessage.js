const config = require('../config');
const { loadStorage, saveStorage } = require('../services/storageStore');
const { loadData } = require('../services/dataStore');
const { getUpcomingWeekDates, parseRuDate } = require('../utils/dates');
const { SCHEDULE_BY_WEEK } = require('../constants');
const { formatSchedule } = require('../tribunes/formatters');

async function updateMainMessage(client) {
    const storage = loadStorage();
    try {
        const data = loadData();
        if (!storage?.messageId) return;

        let dates = [];
        if (Array.isArray(storage.dates) && storage.dates.length) {
            dates = storage.dates.map(d => ({ day: d.day, date: parseRuDate(d.date) }));
        } else {
            const days = SCHEDULE_BY_WEEK[1];
            dates = getUpcomingWeekDates(new Date(), days);
        }
        const content = formatSchedule(data, dates);

        const channel = await client.channels.fetch(config.channelId).catch(() => null);
        if (!channel) return;

        let msg = await channel.messages.fetch(storage.messageId).catch(() => null);
        if (msg) {
            await msg.edit({ content }).catch(() => {});
        } else {
            const newMsg = await channel.send({ content }).catch(() => null);
            if (!newMsg) return;
            saveStorage({ ...storage, messageId: newMsg.id, dates: dates.map(d => ({ day: d.day, date: d.date.toLocaleDateString('ru-RU') })) });
        }
    } catch (e) { console.error('Ошибка при обновлении сообщения:', e); }
}
module.exports = { updateMainMessage };
