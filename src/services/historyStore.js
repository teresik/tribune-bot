const fs = require('fs');
const { FILES, HISTORY_TTL_MS } = require('../constants');

function loadHistory() {
    try {
        if (!fs.existsSync(FILES.HISTORY)) fs.writeFileSync(FILES.HISTORY, '[]', 'utf-8');
        return JSON.parse(fs.readFileSync(FILES.HISTORY, 'utf-8'));
    } catch { return []; }
}
function saveHistory(arr) {
    try { fs.writeFileSync(FILES.HISTORY, JSON.stringify(arr, null, 2), 'utf-8'); } catch {}
}
function purgeHistory() {
    const now = Date.now();
    const history = loadHistory();
    const filtered = history.filter(ev => now - (ev.ts || 0) <= HISTORY_TTL_MS);
    if (filtered.length !== history.length) saveHistory(filtered);
    return filtered;
}
function appendHistory(event) {
    const h = purgeHistory();
    h.push({ ts: Date.now(), ...event });
    saveHistory(h);
}
module.exports = { loadHistory, purgeHistory, appendHistory };
