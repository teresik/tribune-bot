const { SlashCommandBuilder } = require('discord.js');
const { slashLeave } = require('../features/leave/handlers');
const { hasBroadcasterPerm } = require('../utils/roles');

module.exports = {
    leaveSlash: new SlashCommandBuilder().setName('leave').setDescription('Оформить отгул/отпуск (только Broadcaster)').toJSON(),
    leaveCommand: (interaction) => slashLeave(interaction, hasBroadcasterPerm)
};
