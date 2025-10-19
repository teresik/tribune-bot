const { fmtLocal, fmtUTC } = require('../utils/dates');
const { loadStorage } = require('../services/storageStore');
const { SCHEDULE_BY_WEEK } = require('../constants');
const { week1Command } = require('../commands/week1');
const config = require('../config');

function autoJobFactory(schedule, client) {
    return schedule.scheduleJob('0 0 * * 1', async function (fireDate) {
        const startedAt = new Date();
        console.log('🚀 [AUTO] Запуск перезаписи расписания');
        console.log(`   ▶ fireDate:   ${fmtLocal(fireDate)}  (${fmtUTC(fireDate)})`);
        console.log(`   ▶ startedAt:  ${fmtLocal(startedAt)}  (${fmtUTC(startedAt)})`);

        try {
            const guild = await client.guilds.fetch(config.guildId);
            const channel = await client.channels.fetch(config.channelId);

            const fakeInteraction = {
                guild, channel,
                reply: async () => {},
                isChatInputCommand: () => true,
                commandName: 'week1',
                channel: channel
            };

            await week1Command(fakeInteraction);
            console.log('✅ [AUTO] Перезапись завершена успешно');
        } catch (error) {
            console.error('❌ [AUTO] Ошибка автоматической перезаписи:', error);
        }
    });
}

module.exports = { autoJobFactory };
