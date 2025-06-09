const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config.json');

const commands = [
    new SlashCommandBuilder()
        .setName('reg')
        .setDescription('Подать заявку на трибуну'),
    new SlashCommandBuilder()
        .setName('week1')
        .setDescription('Опубликовать расписание для недели 1 (пн, ср, пт, вс)'),
    new SlashCommandBuilder()
        .setName('week2')
        .setDescription('Опубликовать расписание для недели 2 (вт, чт, сб)')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        console.log('⏳ Регистрирую команды...');
        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands }
        );
        console.log('✅ Команды зарегистрированы.');
    } catch (error) {
        console.error(error);
    }
})();
