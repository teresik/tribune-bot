const config = require('./config');

module.exports = {
    FILES: {
        DATA: './data.json',
        STORAGE: './storage.json',
        HISTORY: './history.json'
    },
    HISTORY_TTL_MS: 30 * 24 * 60 * 60 * 1000,
    SESSION_TIMEOUT: 30 * 60 * 1000,
    BUTTONS_PER_ROW: 5,
    REQUIRED_PLAYERS: { boys: 2, girls: 2 },
    ROLES: {
        BROADCASTER_ROLE_ID: config.broadcasterRoleId || null,
        SECURE_ROLE_ID: config.secureRoleId || null
    },
    CHANNELS: {
        LEAVE_CHANNEL_ID: config.leaveChannelId || null,
        SCHEDULE_CHANNEL_ID: config.channelId
    },
    SCHEDULE_BY_WEEK: {
        1: ['Среда', 'Пятница', 'Воскресенье']
    },
    TRIBUNE_NAMES: {
        'Среда': 'Синяя кнопка',
        'Пятница': 'Быстрые свидания',
        'Воскресенье': '?|Голос чата'
    }
};
