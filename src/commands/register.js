// src/commands/register.js
const { SlashCommandBuilder } = require('discord.js');
const config = require('../config');

module.exports.registerCommands = async (client) => {
    const commands = [
        new SlashCommandBuilder()
            .setName('panel')
            .setDescription('Открыть панель управления ботом'),
    ].map(c => c.toJSON());

    const guild = await client.guilds.fetch(config.guildId);
    await guild.commands.set(commands);
    console.log('✅ Slash-команды перерегистрированы: /panel');
};
