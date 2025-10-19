const { SlashCommandBuilder } = require('discord.js');
const { purgeHistory } = require('../services/historyStore');

async function historyCommand(interaction) {
    const history = purgeHistory();
    const last = history.slice(-30);
    if (!last.length) return interaction.reply({ content: 'История пуста за последний месяц.' });
    const lines = last.map(ev => {
        const when = new Date(ev.ts).toLocaleString('ru-RU');
        switch (ev.action) {
            case 'register':   return `🟢 [${when}] <@${ev.targetId}> записался: ${ev.day}, часть ${ev.part}, роль ${ev.role}`;
            case 'unregister': return `⚪ [${when}] <@${ev.targetId}> отписался: ${ev.day}, часть ${ev.part}, роль ${ev.role}`;
            case 'remove':     return `🗑 [${when}] <@${ev.actorId}> удалил <@${ev.targetId}>: ${ev.day}, часть ${ev.part}, роль ${ev.role}`;
            case 'move':       return `📦 [${when}] <@${ev.actorId}> перенёс <@${ev.targetId}>: ${ev.fromDay} ч.${ev.fromPart}/${ev.fromRole} → ${ev.toDay} ч.${ev.toPart}/${ev.toRole}`;
            default:           return `ℹ️ [${when}] ${JSON.stringify(ev)}`;
        }
    });
    return interaction.reply({ content: lines.join('\n').slice(0, 1900) });
}

module.exports = { historySlash: new SlashCommandBuilder().setName('history').setDescription('Показать историю (30 дней)').toJSON(), historyCommand };
