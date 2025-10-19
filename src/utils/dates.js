function parseRuDate(str) {
    const [dd, mm, yyyy] = str.split('.').map(Number);
    return new Date(yyyy, mm - 1, dd);
}
function formatRuDate(d) {
    if (!(d instanceof Date) || isNaN(d)) return '—';
    return d.toLocaleDateString('ru-RU');
}
function fmtLocal(date = new Date()) {
    return new Date(date).toLocaleString('ru-RU', { hour12: false });
}
function fmtUTC(date = new Date()) {
    return new Date(date).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}
function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}
function getUpcomingWeekDates(baseDate, daysNeeded) {
    const result = [];
    const used = new Set();
    for (let i = 0; result.length < daysNeeded.length && i < 14; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);
        const dayName = capitalize(d.toLocaleDateString('ru-RU', { weekday: 'long' }));
        if (daysNeeded.includes(dayName) && !used.has(dayName)) {
            result.push({ date: d, day: dayName });
            used.add(dayName);
        }
    }
    return result;
}
module.exports = { parseRuDate, formatRuDate, fmtLocal, fmtUTC, capitalize, getUpcomingWeekDates };
