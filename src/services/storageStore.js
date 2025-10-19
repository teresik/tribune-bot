const fs = require('fs');
const { FILES } = require('../constants');

function loadStorage() {
    try {
        if (!fs.existsSync(FILES.STORAGE)) fs.writeFileSync(FILES.STORAGE, '{}', 'utf-8');
        return JSON.parse(fs.readFileSync(FILES.STORAGE, 'utf-8'));
    } catch { return {}; }
}
function saveStorage(data) {
    try { fs.writeFileSync(FILES.STORAGE, JSON.stringify(data, null, 2), 'utf-8'); } catch {}
}

module.exports = { loadStorage, saveStorage };
