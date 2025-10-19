const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config.json');

const commands = [
    new SlashCommandBuilder()
        .setName('week1')
        .setDescription('Опубликовать расписание для недели 1 (пн, ср, пт, вс)'),
    new SlashCommandBuilder()
        .setName('history')
        .setDescription('Просмотреть историю записей'),
    new SlashCommandBuilder()
        .setName('manage')
        .setDescription('Управление участниками трибуны (только для модераторов)')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        console.log('⏳ Регистрирую команды...');
        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands }
        );
        console.log('✅ Команды зарегистрированы.');
    } catch (error) {
        console.error(error);
    }
})();