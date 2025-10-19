const fs = require('fs');
const { FILES } = require('../constants');

function ensure(file, def) {
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(def), 'utf-8');
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function loadData() {
    try { return ensure(FILES.DATA, {}); } catch { return {}; }
}
function saveData(data) {
    try { fs.writeFileSync(FILES.DATA, JSON.stringify(data, null, 2), 'utf-8'); } catch {}
}

module.exports = { loadData, saveData };
