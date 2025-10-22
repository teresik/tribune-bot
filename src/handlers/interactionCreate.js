const { week1Command } = require('../commands/week1');
const { manageCommand } = require('../commands/manage');
const { historyCommand } = require('../commands/history');

const { handlePanelButtons, handlePanelSelects, handlePanelModals } = require('../features/panel/handlers');
const { handleManageButtons, handleManageSelects } = require('../features/manage/handlers');
const { handleSignupButtons } = require('../features/signup/handlers');

const { makeErrorEmbed, makeSuccessEmbed } = require('../utils/embeds');
const { loadData, saveData } = require('../services/dataStore');
const { updateMainMessage } = require('./updateMessage');
const { appendHistory } = require('../services/historyStore');

module.exports.handleInteractionCreate = async (client, interaction) => {
    try {
        // единственная slash-команда — панель
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'panel') {
                return handlePanelButtons(interaction, true); // открыть корень панели
            }
        }

        // панель
        if (interaction.isButton()) {
            if (await handlePanelButtons(interaction, false)) return;
        }
        if (interaction.isStringSelectMenu()) {
            if (await handlePanelSelects(interaction)) return;
        }
        if (interaction.isModalSubmit()) {
            if (await handlePanelModals(interaction)) return;
        }

        // manage
        if (interaction.isButton()) {
            if (await handleManageButtons(interaction)) return;
        }
        if (interaction.isStringSelectMenu()) {
            if (await handleManageSelects(interaction)) return;
        }

        // пользовательская запись
        if (interaction.isButton()) {
            const [step] = interaction.customId.split('|');
            if (['day','part','role','unreg'].includes(step)) {
                if (step === 'unreg') {
                    const [_, day, part, role, targetId] = interaction.customId.split('|');
                    if (targetId !== interaction.user.id) return interaction.reply({ embeds: [makeErrorEmbed('❌ Вы можете отменить только свою запись.')], flags: 64 });
                    const data = loadData();
                    if (!data[day] || !data[day].parts?.[part]?.[role]) return interaction.reply({ embeds: [makeErrorEmbed('❌ Неверные данные.')], flags: 64 });

                    data[day].parts[part][role] = data[day].parts[part][role].filter(id => id !== targetId);
                    appendHistory({ action: 'unregister', actorId: targetId, targetId, day, part, role });
                    saveData(data);
                    await updateMainMessage(client);
                    return interaction.reply({ embeds: [makeSuccessEmbed('✅ Вы успешно отписались.')], flags: 64 });
                }
                return handleSignupButtons(interaction);
            }
        }
    } catch (error) {
        console.error('Ошибка в обработчике взаимодействий:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: '❌ Произошла ошибка при обработке вашего действия.', flags: 64 }).catch(() => {});
        } else {
            await interaction.reply({ content: '❌ Произошла ошибка при обработке вашего действия.', flags: 64 }).catch(() => {});
        }
        return;
    }

    // фолбэк, чтобы не было “приложение не отвечает”
    if ((interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit())
        && !interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '⚠️ Действие устарело или не распознано. Откройте /panel заново.', flags: 64 }).catch(() => {});
    }
};
