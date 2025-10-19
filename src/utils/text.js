function clip(s, max = 1024) {
    return String(s || '').slice(0, max);
}
module.exports = { clip };
