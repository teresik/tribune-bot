// scripts/clear-commands.js
const { REST, Routes } = require('discord.js');
const config = require('../src/config'); // или './config.json' если у тебя json

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        // Очистить команды для конкретной гильдии (быстро применится)
        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: [] }
        );
        console.log('✅ Guild commands cleared');

        // Очистить ГЛОБАЛЬНЫЕ команды (распространение может занять до часа)
        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: [] }
        );
        console.log('✅ Global commands cleared');
    } catch (e) {
        console.error('❌ Failed to clear commands:', e);
    }
})();
