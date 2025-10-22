// src/commands/register.js
const { SlashCommandBuilder } = require('discord.js');
const config = require('../config');

module.exports.registerCommands = async (client) => {
    // Собираем определения команд здесь, НЕ используем week1CommandDef и т.п.
    const commands = [
        new SlashCommandBuilder()
            .setName('week1')
            .setDescription('Опубликовать расписание на неделю типа 1'),

        new SlashCommandBuilder()
            .setName('history')
            .setDescription('Показать историю действий (30 дней)'),

        new SlashCommandBuilder()
            .setName('manage')
            .setDescription('Управление участниками (только Broadcaster)'),

        /*new SlashCommandBuilder()
            .setName('leave')
            .setDescription('Оформить отгул/отпуск (только Broadcaster)'),*/

        // Ручная настройка расписания
        new SlashCommandBuilder()
            .setName('config')
            .setDescription('Ручная настройка расписания')
            .addSubcommand(sc =>
                sc.setName('set-time')
                    .setDescription('Задать время части для дня')
                    .addStringOption(o => o.setName('day').setDescription('День недели (например: Пятница)').setRequired(true))
                    .addIntegerOption(o => o.setName('part').setDescription('Часть (1|2)').setRequired(true).setMinValue(1).setMaxValue(2))
                    .addStringOption(o => o.setName('time').setDescription('Время HH:MM').setRequired(true))
            )
            .addSubcommand(sc =>
                sc.setName('add-day')
                    .setDescription('Добавить день в расписание')
                    .addStringOption(o => o.setName('day').setDescription('День недели').setRequired(true))
                    .addStringOption(o => o.setName('part1').setDescription('Время 1-й части HH:MM').setRequired(true))
                    .addStringOption(o => o.setName('part2').setDescription('Время 2-й части HH:MM').setRequired(true))
            )
            .addSubcommand(sc =>
                sc.setName('remove-day')
                    .setDescription('Убрать день из расписания')
                    .addStringOption(o => o.setName('day').setDescription('День недели').setRequired(true))
            ),
    ].map(c => c.toJSON());

    // Регистрируем как ГИЛЬДЕЙСКИЕ команды — обновляется мгновенно
    const guild = await client.guilds.fetch(config.guildId);
    await guild.commands.set(commands);
    console.log('✅ Slash-команды (guild) перерегистрированы.');
};
