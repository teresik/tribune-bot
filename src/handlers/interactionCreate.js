// src/handlers/interactionCreate.js
const { panelCommand } = require('../commands/panel');
const { handlePanelButtons, handlePanelSelects, handlePanelModals } = require('../features/panel/handlers');

const { week1Command } = require('../commands/week1');
const { manageCommand } = require('../commands/manage');
const { historyCommand } = require('../commands/history');
const { leaveCommand } = require('../commands/leave');

const { handleLeaveButtons, handleLeaveSelects, handleLeaveModals } = require('../features/leave/handlers');
const { handleManageButtons, handleManageSelects } = require('../features/manage/handlers');
const { handleSignupButtons } = require('../features/signup/handlers');

const { makeErrorEmbed, makeSuccessEmbed } = require('../utils/embeds');
const { loadData, saveData } = require('../services/dataStore');
const { updateMainMessage } = require('./updateMessage');
const { appendHistory } = require('../services/historyStore');

module.exports.handleInteractionCreate = async (client, interaction) => {
    try {
        // одна команда
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'panel') return panelCommand(interaction);
        }

        // Панель
        if (interaction.isButton()) {
            if (await handlePanelButtons(interaction)) return;
        }
        if (interaction.isStringSelectMenu()) {
            if (await handlePanelSelects(interaction)) return;
        }
        if (interaction.isModalSubmit()) {
            if (await handlePanelModals(interaction)) return;
        }

        // LEAVE
        if (interaction.isButton()) {
            if (await handleLeaveButtons(interaction, require('../utils/roles').hasBroadcasterPerm)) return;
        }
        if (interaction.isStringSelectMenu()) {
            if (await handleLeaveSelects(interaction)) return;
        }
        if (interaction.isModalSubmit()) {
            if (await handleLeaveModals(interaction)) return;
        }

        // MANAGE
        if (interaction.isButton()) {
            if (await handleManageButtons(interaction)) return;
        }
        if (interaction.isStringSelectMenu()) {
            if (await handleManageSelects(interaction)) return;
        }

        // SIGNUP (user flow)
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
                return await require('../features/signup/handlers').handleSignupButtons(interaction);
            }
        }
    } catch (error) {
        console.error('Ошибка в обработчике взаимодействий:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: '❌ Произошла ошибка при обработке вашего действия.' }).catch(() => {});
        } else {
            await interaction.reply({ content: '❌ Произошла ошибка при обработке вашего действия.' }).catch(() => {});
        }
    }
};
