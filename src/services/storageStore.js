const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const STORAGE_PATH = path.join(DATA_DIR, 'storage.json');

function ensureFile() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(STORAGE_PATH)) fs.writeFileSync(STORAGE_PATH, '{}', 'utf-8');
}

function loadStorage() {
    try {
        ensureFile();
        return JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf-8'));
    } catch {
        return {};
    }
}

function saveStorage(obj) {
    try {
        ensureFile();
        fs.writeFileSync(STORAGE_PATH, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (e) {
        console.error('saveStorage error:', e);
    }
}

module.exports = { loadStorage, saveStorage, STORAGE_PATH };
