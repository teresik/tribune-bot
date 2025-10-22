// src/commands/register.js
const { SlashCommandBuilder } = require('discord.js');
const config = require('../config');

module.exports.registerCommands = async (client) => {
    // Оставляем ровно одну команду /panel
    const panelDef = new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Служебная панель управления')
        .setDMPermission(false)           // запрет в ЛС
        .setDefaultMemberPermissions(0n); // по умолчанию никому (доступ проверяем в хендлере по роли)

    // Устанавливаем команды ТОЛЬКО в гильдии
    await client.application.commands.set([panelDef], config.guildId);

    // На всякий пожарный — очищаем глобальные команды (если когда-то публиковались)
    await client.application.commands.set([]);

    console.log('✅ Slash-команды перерегистрированы: /panel');
};
