// src/tribunes/scheduleTimes.js
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'scheduleTimes.json');

function ensureFile() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(FILE)) {
        const initial = {
            partTimes: {},       // { "Среда": { "1": "21:00", "2": "22:00" }, ... }
            tribuneNames: {},    // { "Среда": "Быстрые свидания", ... }
            activeDays: []       // [ "Среда", "Пятница", "Воскресенье" ]
        };
        fs.writeFileSync(FILE, JSON.stringify(initial, null, 2), 'utf-8');
    }
}

function loadStore() {
    ensureFile();
    try {
        const raw = fs.readFileSync(FILE, 'utf-8');
        const store = JSON.parse(raw);
        // страховки
        store.partTimes = store.partTimes && typeof store.partTimes === 'object' ? store.partTimes : {};
        store.tribuneNames = store.tribuneNames && typeof store.tribuneNames === 'object' ? store.tribuneNames : {};
        store.activeDays = Array.isArray(store.activeDays) ? store.activeDays : [];
        return store;
    } catch {
        return { partTimes: {}, tribuneNames: {}, activeDays: [] };
    }
}

function saveStore(store) {
    fs.writeFileSync(FILE, JSON.stringify(store, null, 2), 'utf-8');
}

// Нормализация дня к полному русскому названию
function normalizeDay(input) {
    if (!input) return null;
    const s = String(input).trim().toLowerCase();

    const mapShort = {
        'пн': 'Понедельник',
        'вт': 'Вторник',
        'ср': 'Среда',
        'чт': 'Четверг',
        'пт': 'Пятница',
        'сб': 'Суббота',
        'вс': 'Воскресенье',
    };

    if (mapShort[s]) return mapShort[s];

    const mapFull = {
        'понедельник': 'Понедельник',
        'вторник': 'Вторник',
        'среда': 'Среда',
        'четверг': 'Четверг',
        'пятница': 'Пятница',
        'суббота': 'Суббота',
        'воскресенье': 'Воскресенье',
    };

    if (mapFull[s]) return mapFull[s];

    // если пришло что-то типа "Ср" — обрежем до 2 букв и проверим
    const two = s.slice(0, 2);
    if (mapShort[two]) return mapShort[two];

    // Последняя попытка — капитализовать как есть
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// ===== API =====

// Добавить/обновить день (название трибуны + времена 1/2 части)
// Пример: addOrUpdateDay('Ср', 'Быстрые свидания', '21:00', '22:00')
function addOrUpdateDay(dayInput, tribuneName, p1, p2) {
    const day = normalizeDay(dayInput);
    if (!day) throw new Error('Bad day');

    const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!hhmm.test(p1) || !hhmm.test(p2)) throw new Error('Bad time');

    const store = loadStore();

    // Гарантируем структуры
    if (!store.partTimes[day]) store.partTimes[day] = {};
    store.partTimes[day]['1'] = p1;
    store.partTimes[day]['2'] = p2;

    store.tribuneNames[day] = tribuneName || store.tribuneNames[day] || 'Трибуна';

    if (!store.activeDays.includes(day)) store.activeDays.push(day);

    saveStore(store);
    return true;
}

// Установить время для конкретной части
function setPartTime(dayInput, part, time) {
    const day = normalizeDay(dayInput);
    const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!day || !['1', '2'].includes(String(part)) || !hhmm.test(time)) {
        throw new Error('Bad args');
    }
    const store = loadStore();
    if (!store.partTimes[day]) store.partTimes[day] = {};
    store.partTimes[day][String(part)] = time;
    saveStore(store);
    return true;
}

// Удалить день из активных (не трогаем названия/времена на будущее — можно при желании чистить)
function removeDay(dayInput) {
    const day = normalizeDay(dayInput);
    const store = loadStore();
    store.activeDays = store.activeDays.filter(d => d !== day);
    saveStore(store);
    return true;
}

// Получить список активных дней
function getActiveDays() {
    const store = loadStore();
    return store.activeDays.slice();
}

// Получить весь объект времён (для обратной совместимости)
function getPartTimes() {
    const store = loadStore();
    return store.partTimes;
}

// Удобно получать конкретное время
function getTimeForPart(dayInput, part) {
    const store = loadStore();
    const day = normalizeDay(dayInput);
    return store.partTimes?.[day]?.[String(part)] || null;
}

// Названия трибун
function getTribuneName(dayInput) {
    const store = loadStore();
    const day = normalizeDay(dayInput);
    return store.tribuneNames?.[day] || 'Трибуна';
}

module.exports = {
    addOrUpdateDay,
    setPartTime,
    removeDay,
    getActiveDays,
    getPartTimes,
    getTimeForPart,
    getTribuneName,
    // для старых мест, где импортировали как константу:
    PART_TIMES: getPartTimes()
};
