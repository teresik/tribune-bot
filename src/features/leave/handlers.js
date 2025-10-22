/*const { makePromptEmbed, makeSuccessEmbed, makeErrorEmbed } = require('../../utils/embeds');
const { makeDateSelect, makeLeaveTypeRow } = require('./ui');
const { makeLeaveAssignRowsFiltered } = require('./lists');
const { makeLeaveReasonModal } = require('./modals');
const { getUserSession, createUserSession, removeUserSession } = require('../../state');
const { parseRuDate } = require('../../utils/dates');
const { CHANNELS, ROLES } = require('../../constants');
const { EmbedBuilder } = require('discord.js');
const { clip } = require('../../utils/text');

async function slashLeave(interaction, hasBroadcasterPerm) {
    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (!hasBroadcasterPerm(member)) {
        return interaction.reply({ embeds: [makeErrorEmbed('❌ Команда доступна только для Broadcaster.')], flags: 64 });
    }
    createUserSession(interaction.user.id, { leave: { type: null, date: null, from: null, to: null, bcasterIds: [], secureIds: [], reason: '' } });
    return interaction.reply({ embeds: [makePromptEmbed('Отгул / Отпуск', 'Выберите тип заявки:')], components: [makeLeaveTypeRow()], flags: 64 });
}

async function handleLeaveButtons(interaction, hasBroadcasterPerm) {
    if (!interaction.customId.startsWith('leave_type|') && interaction.customId !== 'leave_reason_open' && interaction.customId !== 'leave_submit') return false;

    if (interaction.customId.startsWith('leave_type|')) {
        const [, type] = interaction.customId.split('|');
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (!hasBroadcasterPerm(member)) {
            await interaction.reply({ embeds: [makeErrorEmbed('❌ Недостаточно прав.')], flags: 64 });
            return true;
        }
        const sess = getUserSession(interaction.user.id) || {};
        sess.leave = sess.leave || {};
        sess.leave.type = type;
        createUserSession(interaction.user.id, sess);

        if (type === 'day') {
            await interaction.reply({ embeds: [makePromptEmbed('Отгул (1 день)', 'Выберите дату:')], components: [makeDateSelect('leave_day_select', 'Выберите дату')], flags: 64 });
        } else {
            await interaction.reply({ embeds: [makePromptEmbed('Отпуск (период)', 'Выберите дату начала:')], components: [makeDateSelect('leave_range_from', 'С (дата начала)')], flags: 64 });
        }
        return true;
    }

    if (interaction.customId === 'leave_reason_open') {
        const sess = getUserSession(interaction.user.id);
        if (!sess?.leave) { await interaction.reply({ embeds: [makeErrorEmbed('Сессия не найдена.')], flags: 64 }); return true; }
        await interaction.showModal(makeLeaveReasonModal());
        return true;
    }

    if (interaction.customId === 'leave_submit') {
        const sess = getUserSession(interaction.user.id);
        const L = sess?.leave;
        if (!L) { await interaction.reply({ embeds: [makeErrorEmbed('Сессия не найдена.')], flags: 64 }); return true; }
        if (!CHANNELS.LEAVE_CHANNEL_ID) { await interaction.reply({ embeds: [makeErrorEmbed('❌ Не задан канал для заявок (leaveChannelId).')], flags: 64 }); return true; }

        if (L.type === 'day' && !L.date) return await interaction.reply({ embeds: [makeErrorEmbed('Выберите дату отгула.')], flags: 64 });
        if (L.type === 'range' && (!L.from || !L.to)) return await interaction.reply({ embeds: [makeErrorEmbed('Выберите период отпуска (С/По).')], flags: 64 });
        if (!Array.isArray(L.bcasterIds) || !L.bcasterIds.length) return await interaction.reply({ embeds: [makeErrorEmbed('Выберите ответственных Broadcaster.')], flags: 64 });
        if (!Array.isArray(L.secureIds) || !L.secureIds.length) return await interaction.reply({ embeds: [makeErrorEmbed('Выберите ответственных Admin.')], flags: 64 });
        if (!L.reason?.trim()) return await interaction.reply({ embeds: [makeErrorEmbed('Укажите причину.')], flags: 64 });

        const periodText = L.type === 'day' ? `День: **${L.date}**` : `Период: **${L.from} — ${L.to}**`;
        const leaveEmbed = new EmbedBuilder()
            .setTitle(L.type === 'day' ? 'Заявка на отгул' : 'Заявка на отпуск')
            .setColor(L.type === 'day' ? 0xFAA61A : 0x0099FF)
            .addFields(
                { name: 'Автор', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Тип', value: L.type === 'day' ? 'Отгул (1 день)' : 'Отпуск (период)', inline: true },
                { name: 'Период', value: periodText, inline: false },
                { name: 'Ответственные — Broadcaster', value: L.bcasterIds.map(id => `<@${id}>`).join(', '), inline: false },
                { name: 'Ответственные — Admin', value: L.secureIds.map(id => `<@${id}>`).join(', '), inline: false },
                { name: 'Причина', value: clip(L.reason) }
            )
            .setTimestamp(new Date());

        const leaveChannel = await interaction.client.channels.fetch(CHANNELS.LEAVE_CHANNEL_ID).catch(() => null);
        if (!leaveChannel) { await interaction.reply({ embeds: [makeErrorEmbed('❌ Канал для заявок не найден (leaveChannelId).')], flags: 64 }); return true; }

        const contentPing = [...new Set([...L.bcasterIds, ...L.secureIds])].map(id => `<@${id}>`).join(' ');
        await leaveChannel.send({ content: contentPing || undefined, embeds: [leaveEmbed] });
        removeUserSession(interaction.user.id);
        await interaction.reply({ embeds: [makeSuccessEmbed('✅ Заявка отправлена в канал.')], flags: 64 });
        return true;
    }

    return false;
}

async function handleLeaveSelects(interaction) {
    if (!['leave_day_select','leave_range_from','leave_range_to','leave_pick_bcaster_ids','leave_pick_secure_ids'].includes(interaction.customId)) return false;

    const sess = getUserSession(interaction.user.id);
    if (!sess?.leave) { await interaction.reply({ embeds: [makeErrorEmbed('Сессия не найдена.')], flags: 64 }); return true; }

    if (interaction.customId === 'leave_day_select') {
        sess.leave.date = interaction.values[0];
        createUserSession(interaction.user.id, sess);
        const rows = await makeLeaveAssignRowsFiltered(interaction.guild);
        await interaction.reply({ embeds: [makePromptEmbed('Ответственные и причина', `Дата: **${sess.leave.date}**\nВыберите ответственных и укажите причину:`)], components: rows, flags: 64 });
        return true;
    }

    if (interaction.customId === 'leave_range_from') {
        sess.leave.from = interaction.values[0];
        createUserSession(interaction.user.id, sess);
        const fromDate = parseRuDate(sess.leave.from);
        await interaction.reply({ embeds: [makePromptEmbed('Отпуск (период)', `Начало: **${sess.leave.from}**\nТеперь выберите дату окончания:`)], components: [require('./ui').makeDateSelect('leave_range_to', 'По (дата окончания)', fromDate)], flags: 64 });
        return true;
    }

    if (interaction.customId === 'leave_range_to') {
        if (!sess.leave.from) { await interaction.reply({ embeds: [makeErrorEmbed('Сначала выберите дату начала.')], flags: 64 }); return true; }
        sess.leave.to = interaction.values[0];
        if (parseRuDate(sess.leave.to) < parseRuDate(sess.leave.from)) {
            await interaction.reply({ embeds: [makeErrorEmbed('Дата окончания не может быть раньше даты начала.')], flags: 64 });
            return true;
        }
        createUserSession(interaction.user.id, sess);
        const rows = await makeLeaveAssignRowsFiltered(interaction.guild);
        await interaction.reply({ embeds: [makePromptEmbed('Ответственные и причина', `Период: **${sess.leave.from} — ${sess.leave.to}**\nВыберите ответственных и укажите причину:`)], components: rows, flags: 64 });
        return true;
    }

    if (interaction.customId === 'leave_pick_bcaster_ids') {
        if (interaction.values.includes('none')) { await interaction.reply({ embeds: [makeErrorEmbed('Нет доступных Broadcaster для выбора.')], flags: 64 }); return true; }
        // ревалидация
        const bad = [];
        for (const uid of interaction.values) {
            const m = await interaction.guild.members.fetch(uid).catch(() => null);
            if (!m || !m.roles.cache.has(ROLES.BROADCASTER_ROLE_ID)) bad.push(uid);
        }
        if (bad.length) {
            await interaction.reply({ embeds: [makeErrorEmbed(`❌ Эти пользователи больше не имеют роли Broadcaster: ${bad.map(id => `<@${id}>`).join(', ')}`)], flags: 64 });
            return true;
        }
        sess.leave.bcasterIds = interaction.values;
        createUserSession(interaction.user.id, sess);
        await interaction.reply({ embeds: [makeSuccessEmbed('✅ Broadcaster сохранены.')], flags: 64 });
        return true;
    }

    if (interaction.customId === 'leave_pick_secure_ids') {
        if (interaction.values.includes('none')) { await interaction.reply({ embeds: [makeErrorEmbed('Нет доступных Admin для выбора.')], flags: 64 }); return true; }
        const bad = [];
        for (const uid of interaction.values) {
            const m = await interaction.guild.members.fetch(uid).catch(() => null);
            const ok = m && m.roles.cache.has(ROLES.SECURE_ROLE_ID) && m.roles.cache.has(ROLES.BROADCASTER_ROLE_ID);
            if (!ok) bad.push(uid);
        }
        if (bad.length) {
            await interaction.reply({ embeds: [makeErrorEmbed(`❌ Эти пользователи не удовлетворяют требованиям (Admin + Broadcaster): ${bad.map(id => `<@${id}>`).join(', ')}`)], flags: 64 });
            return true;
        }
        sess.leave.secureIds = interaction.values;
        createUserSession(interaction.user.id, sess);
        await interaction.reply({ embeds: [makeSuccessEmbed('✅ Admins сохранены.')], flags: 64 });
        return true;
    }

    return false;
}

async function handleLeaveModals(interaction) {
    if (interaction.customId !== 'leave_reason_modal') return false;
    const sess = getUserSession(interaction.user.id);
    if (!sess?.leave) { await interaction.reply({ embeds: [makeErrorEmbed('Сессия не найдена.')], flags: 64 }); return true; }
    const reason = interaction.fields.getTextInputValue('reason').trim();
    if (!reason) { await interaction.reply({ embeds: [makeErrorEmbed('❌ Укажите причину.')], flags: 64 }); return true; }
    sess.leave.reason = reason;
    createUserSession(interaction.user.id, sess);
    await interaction.reply({ embeds: [makeSuccessEmbed('✅ Причина сохранена.')], flags: 64 });
    return true;
}

module.exports = { slashLeave, handleLeaveButtons, handleLeaveSelects, handleLeaveModals };
*/