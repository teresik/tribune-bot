const fs = require('fs');
const path = require('path');

// Кандидаты, где может лежать config.json
const candidates = [
    path.join(process.cwd(), 'config.json'),           // где запущен процесс (идеально, если запускаете из корня)
    path.join(__dirname, '..', 'config.json'),         // корень проекта относительно src/
    path.join(__dirname, '..', '..', 'config.json')    // ещё на уровень выше (на случай иной структуры)
];

let cfgPath = null;
for (const p of candidates) {
    if (fs.existsSync(p)) { cfgPath = p; break; }
}

if (!cfgPath) {
    throw new Error(
        'config.json not found. Looked in:\n' +
        candidates.map(p => ` - ${p}`).join('\n')
    );
}

module.exports = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
