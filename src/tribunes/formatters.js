const { TRIBUNE_NAMES, REQUIRED_PLAYERS } = require('../constants');
const { PART_TIMES } = require('./scheduleTimes');
const { capitalize } = require('../utils/dates');

function formatTribune(dateObj, entry) {
    const dateStr = dateObj.date.toLocaleDateString('ru-RU');
    const lines = [];

    const name = TRIBUNE_NAMES[dateObj.day] || 'Трибуна';
    const firstTime = PART_TIMES[dateObj.day]?.['1'] || '20:00';
    lines.push(`**${name} — ${dateObj.day}, ${dateStr} в ${firstTime}**`);
    lines.push(`Требуется: ${REQUIRED_PLAYERS.boys} мальчика и ${REQUIRED_PLAYERS.girls} девочки на 2 части`);
    lines.push('');

    // только 1 и 2 часть
    for (const part of ['1', '2']) {
        const timeStr = PART_TIMES[dateObj.day]?.[part] || '??:??';
        const title = `**${part} часть ${timeStr}**`;
        lines.push(title);

        for (const role of ['ведущий', 'замена']) {
            const ids = entry.parts?.[part]?.[role] || [];
            const mentions = ids.length ? ids.map(id => `<@${id}>`).join(', ') : '—';
            lines.push(`• ${capitalize(role)}: ${mentions}`);
        }
        lines.push('');
    }

    lines.push('📝 Выберите ниже кто на какую часть может');
    lines.push('');
    lines.push('❗ **Важно:**');
    lines.push('• Девочка+девочка — **НЕЛЬЗЯ** (только в исключительных случаях)');
    lines.push('• Расписание публикуется каждое воскресенье');
    lines.push('• По вопросам, ошибкам, предложениям обращаться к <@683002556473016321>');
    return lines.join('\n');
}

function formatSchedule(schedule, dates) {
    return dates
        .filter(d => schedule.hasOwnProperty(`${d.day} ${d.date.toLocaleDateString('ru-RU')}`))
        .map(d => formatTribune(d, schedule[`${d.day} ${d.date.toLocaleDateString('ru-RU')}`]))
        .join('\n\n');
}

module.exports = { formatTribune, formatSchedule };
