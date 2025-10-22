/*const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ROLES } = require('../../constants');

async function buildRoleUserOptions(guild, roleId, limit = 25) {
    if (!roleId) return [];
    const role = guild.roles.cache.get(roleId) || await guild.roles.fetch(roleId).catch(() => null);
    if (!role) return [];
    const opts = [];
    for (const [uid, m] of role.members) {
        opts.push({ label: m.displayName.slice(0, 100), value: uid });
        if (opts.length >= limit) break;
    }
    return opts;
}
async function buildDualRoleUserOptions(guild, roleId1, roleId2, limit = 25) {
    if (!roleId1 || !roleId2) return [];
    const r1 = guild.roles.cache.get(roleId1) || await guild.roles.fetch(roleId1).catch(() => null);
    const r2 = guild.roles.cache.get(roleId2) || await guild.roles.fetch(roleId2).catch(() => null);
    if (!r1 || !r2) return [];
    const ids2 = new Set(r2.members.keys());
    const opts = [];
    for (const [uid, m] of r1.members) {
        if (!ids2.has(uid)) continue;
        opts.push({ label: m.displayName.slice(0, 100), value: uid });
        if (opts.length >= limit) break;
    }
    return opts;
}

async function makeLeaveAssignRowsFiltered(guild) {
    const bcasterOpts = await buildRoleUserOptions(guild, ROLES.BROADCASTER_ROLE_ID);
    const secureOpts = await buildDualRoleUserOptions(guild, ROLES.SECURE_ROLE_ID, ROLES.BROADCASTER_ROLE_ID);

    const rows = [];

    rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('leave_pick_bcaster_ids')
            .setPlaceholder('Ответственные Broadcaster (выбрать)')
            .setMinValues(1)
            .setMaxValues(Math.min(5, bcasterOpts.length || 1))
            .addOptions(bcasterOpts.length ? bcasterOpts : [{ label: 'Нет доступных', value: 'none', default: true }])
    ));

    rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('leave_pick_secure_ids')
            .setPlaceholder('Ответственные Security (с ролью Broadcaster)')
            .setMinValues(1)
            .setMaxValues(Math.min(5, secureOpts.length || 1))
            .addOptions(secureOpts.length ? secureOpts : [{ label: 'Нет доступных', value: 'none', default: true }])
    ));

    rows.push(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('leave_reason_open').setLabel('Указать причину').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('leave_submit').setLabel('Отправить заявку').setStyle(ButtonStyle.Success)
    ));

    return rows;
}

module.exports = { makeLeaveAssignRowsFiltered, buildRoleUserOptions, buildDualRoleUserOptions };
*/