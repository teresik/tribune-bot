// src/handlers/interactionCreate.js
const { makeErrorEmbed, makeSuccessEmbed } = require('../utils/embeds');
const { week1Command } = require('../commands/week1');
const { manageCommand } = require('../commands/manage');
const { historyCommand } = require('../commands/history');
const { leaveCommand } = require('../commands/leave');

const { handleLeaveButtons, handleLeaveSelects, handleLeaveModals } = require('../features/leave/handlers');
const { handleManageButtons, handleManageSelects } = require('../features/manage/handlers');
const { handleSignupButtons } = require('../features/signup/handlers');

const { loadData, saveData } = require('../services/dataStore');
const { updateMainMessage } = require('./updateMessage');
const { appendHistory } = require('../services/historyStore');

async function safeAcknowledge(interaction) {
    if (!interaction.deferred && !interaction.replied) {
        try { await interaction.deferUpdate(); } catch {}
    }
}

module.exports.handleInteractionCreate = async (client, interaction) => {
    try {
        // ---- SLASH ----
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === 'week1')  return await week1Command(interaction);
            if (interaction.commandName === 'manage') return await manageCommand(interaction);
            if (interaction.commandName === 'history')return await historyCommand(interaction);
            if (interaction.commandName === 'leave')  return await leaveCommand(interaction);
            return;
        }

        // ---- SELECTS: ВАЖНО! и StringSelect, и UserSelect ----
        if (interaction.isStringSelectMenu() || interaction.isUserSelectMenu()) {
            // leave-selects (если что-то использует селекты)
            if (await handleLeaveSelects(interaction)) return;

            // manage-selects: тут обрабатывается и StringSelect, и UserSelect (manage_add_pick)
            if (await handleManageSelects(interaction)) return;

            // ничего не обработали — хотя бы acknowledge, чтобы не словить таймаут
            return await safeAcknowledge(interaction);
        }

        // ---- BUTTONS ----
        if (interaction.isButton()) {
            // LEAVE
            if (await handleLeaveButtons(interaction, require('../utils/roles').hasBroadcasterPerm)) return;

            // MANAGE
            if (await handleManageButtons(interaction)) return;

            // SIGNUP (day|part|role|unreg)
            const [step] = interaction.customId.split('|');
            if (['day','part','role','unreg'].includes(step)) {
                if (step === 'unreg') {
                    const [_, day, part, role, targetId] = interaction.customId.split('|');
                    if (targetId !== interaction.user.id) {
                        return interaction.reply({ embeds: [makeErrorEmbed('❌ Вы можете отменить только свою запись.')], flags: 64 });
                    }
                    const data = loadData();
                    if (!data[day] || !data[day].parts?.[part]?.[role]) {
                        return interaction.reply({ embeds: [makeErrorEmbed('❌ Неверные данные.')], flags: 64 });
                    }
                    data[day].parts[part][role] = data[day].parts[part][role].filter(id => id !== targetId);
                    appendHistory({ action: 'unregister', actorId: targetId, targetId, day, part, role });
                    saveData(data);
                    await updateMainMessage(client);
                    return interaction.reply({ embeds: [makeSuccessEmbed('✅ Вы успешно отписались.')], flags: 64 });
                }
                return await handleSignupButtons(interaction);
            }

            // кнопка не распознана — безопасно acknowledge
            return await safeAcknowledge(interaction);
        }

        // ---- MODALS ----
        if (interaction.isModalSubmit()) {
            if (await handleLeaveModals(interaction)) return;
            // если есть другие модалки — добавь сюда
            if (!interaction.replied && !interaction.deferred) {
                try { await interaction.reply({ content: '👍', flags: 64 }); } catch {}
            }
            return;
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
