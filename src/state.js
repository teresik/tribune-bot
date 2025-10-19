const { SESSION_TIMEOUT } = require('./constants');
const userSessions = {};

function createUserSession(userId, data) {
    if (userSessions[userId]?.timer) clearTimeout(userSessions[userId].timer);
    const timer = setTimeout(() => { delete userSessions[userId]; }, SESSION_TIMEOUT);
    userSessions[userId] = { ...data, timer, createdAt: Date.now() };
}
function getUserSession(userId) {
    const s = userSessions[userId];
    if (!s) return null;
    clearTimeout(s.timer);
    s.timer = setTimeout(() => { delete userSessions[userId]; }, SESSION_TIMEOUT);
    return s;
}
function removeUserSession(userId) {
    if (userSessions[userId]?.timer) clearTimeout(userSessions[userId].timer);
    delete userSessions[userId];
}

module.exports = { createUserSession, getUserSession, removeUserSession };
