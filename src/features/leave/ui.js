/*const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ROLES } = require('../../constants');

// calendar
function buildDateOptions(startDate = new Date(), days = 90) {
    const opts = [];
    const base = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    for (let i = 0; i < days; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        const label = d.toLocaleDateString('ru-RU', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
        const value = d.toLocaleDateString('ru-RU');
        opts.push({ label: label.slice(0, 100), value });
    }
    return opts.slice(0, 25);
}
function makeDateSelect(customId, placeholder, startDate = new Date(), days = 90) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(placeholder)
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(buildDateOptions(startDate, days))
    );
}
function makeLeaveTypeRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('leave_type|day').setLabel('Отгул (день)').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('leave_type|range').setLabel('Отпуск (период)').setStyle(ButtonStyle.Secondary)
    );
}
module.exports = { makeDateSelect, makeLeaveTypeRow, buildDateOptions };
*/