// src/tribunes/formatters.js
const { REQUIRED_PLAYERS } = require('../constants');
const { capitalize } = require('../utils/dates');
const { getTimeForPart, getTribuneName } = require('./scheduleTimes');

function formatTribune(dateObj, entry) {
    const dateStr = dateObj.date.toLocaleDateString('ru-RU');
    const day = dateObj.day;

    const name = getTribuneName(day) || 'Трибуна';
    const firstTime = getTimeForPart(day, '1') || '21:00';

    const lines = [];
    lines.push(`**${name} — ${day}, ${dateStr} в ${firstTime}**`);
    lines.push(`Требуется: ${REQUIRED_PLAYERS.boys} мальчика и ${REQUIRED_PLAYERS.girls} девочки на 2 части`);
    lines.push('');

    for (const part of ['1', '2']) {
        const timeStr = getTimeForPart(day, part) || '??:??';
        lines.push(`**${part} часть ${timeStr}**`);

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
    lines.push('• Мальчик+мальчик или девочка+девочка — **НЕЛЬЗЯ** (только в исключительных случаях)');
    lines.push('• Расписание публикуется каждое воскресенье');
    return lines.join('\n');
}

function formatSchedule(schedule, dates) {
    return dates
        .filter(d => schedule.hasOwnProperty(`${d.day} ${d.date.toLocaleDateString('ru-RU')}`))
        .map(d => formatTribune(d, schedule[`${d.day} ${d.date.toLocaleDateString('ru-RU')}`]))
        .join('\n\n');
}

module.exports = { formatTribune, formatSchedule };
