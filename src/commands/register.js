const { week1Slash } = require('./week1');
const { manageSlash } = require('./manage');
const { historySlash } = require('./history');
const { leaveSlash } = require('./leave');

async function registerCommands(client) {
    try { await client.application.commands.create(week1Slash); } catch(e){ console.error('Не удалось зарегистрировать /week1', e); }
    try { await client.application.commands.create(manageSlash); } catch(e){ console.error('Не удалось зарегистрировать /manage', e); }
    try { await client.application.commands.create(historySlash); } catch(e){ console.error('Не удалось зарегистрировать /history', e); }
    try { await client.application.commands.create(leaveSlash); } catch(e){ console.error('Не удалось зарегистрировать /leave', e); }
}
module.exports = { registerCommands };
