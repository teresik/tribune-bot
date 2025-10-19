const { SlashCommandBuilder } = require('discord.js');
const { slashManage } = require('../features/manage/handlers');
const { hasBroadcasterPerm } = require('../utils/roles');

module.exports = {
    manageSlash: new SlashCommandBuilder().setName('manage').setDescription('Управление записями (только Broadcaster)').toJSON(),
    manageCommand: (interaction) => slashManage(interaction, hasBroadcasterPerm)
};
