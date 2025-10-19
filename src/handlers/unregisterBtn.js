const { PART_TIMES } = require('../tribunes/scheduleTimes');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function createUnregisterButton(day, part, role, userId) {
    try {
        const dayName = day.split(' ')[0];
        const dateParts = day.split(' ')[1].split('.');
        const dateStr = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        const timeStr = PART_TIMES[dayName]?.[part] || '00:00';
        const date = new Date(`${dateStr}T${timeStr}:00`);
        const now = new Date();
        if (date - now < 10800000) return [];
        return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`unreg|${day}|${part}|${role}|${userId}`).setLabel('Отписаться').setStyle(ButtonStyle.Secondary))];
    } catch { return []; }
}
module.exports = { createUnregisterButton };
