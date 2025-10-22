// src/commands/panel.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { makePromptEmbed } = require('../utils/embeds');

function makeRootPanel() {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('panel|week').setLabel('📅 Опубликовать расписание').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('panel|manage').setLabel('🛠 Управление').setStyle(ButtonStyle.Secondary),
        ),
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('panel|history').setLabel('🧾 История').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('panel|leave').setLabel('🏖 Отпуск/Отгул').setStyle(ButtonStyle.Success),
        ),
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('panel|config').setLabel('⚙ Настройки расписания').setStyle(ButtonStyle.Secondary),
        ),
    ];
}

async function panelCommand(interaction) {
    return interaction.reply({
        embeds: [makePromptEmbed('Панель управления', 'Выберите действие:')],
        components: makeRootPanel(),
        flags: 64, // ephemeral
    });
}

module.exports = { panelCommand };
