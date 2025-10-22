const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function createDayButtons(tribunes) {
    // по одному набору кнопок для всех дней (до 5 в ряд)
    const btns = tribunes.map(({ day, date }) => {
        const dStr = date.toLocaleDateString('ru-RU');
        return new ButtonBuilder()
            .setCustomId(`day|${day} ${dStr}`)
            .setLabel(`${day} ${dStr}`)
            .setStyle(ButtonStyle.Primary);
    });
    const rows = [];
    for (let i = 0; i < btns.length; i += 5) {
        rows.push(new ActionRowBuilder().addComponents(btns.slice(i, i + 5)));
    }
    return rows;
}

module.exports = { createDayButtons };
