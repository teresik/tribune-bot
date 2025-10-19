const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

function makeLeaveReasonModal() {
    const modal = new ModalBuilder().setCustomId('leave_reason_modal').setTitle('Причина (обязательно)');
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('reason').setLabel('Причина').setStyle(TextInputStyle.Paragraph).setRequired(true)
        )
    );
    return modal;
}

module.exports = { makeLeaveReasonModal };
