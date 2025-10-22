const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { makeErrorEmbed, makeSuccessEmbed, makePromptEmbed } = require('../utils/embeds');
const { hasBroadcasterPerm } = require('../utils/roles');
const {
    PART_TIMES, setPartTime, addDay, removeDay, getActiveDays, setActiveDays
} = require('../tribunes/scheduleTimes');

const DAY_CHOICES = [
    { name: 'Понедельник',  value: 'Понедельник' },
    { name: 'Вторник',      value: 'Вторник' },
    { name: 'Среда',        value: 'Среда' },
    { name: 'Четверг',      value: 'Четверг' },
    { name: 'Пятница',      value: 'Пятница' },
    { name: 'Суббота',      value: 'Суббота' },
    { name: 'Воскресенье',  value: 'Воскресенье' },
];

function isHHMM(s) { return /^\d{2}:\d{2}$/.test(s); }

const scheduleCommandDef = new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Ручная настройка расписания (только Broadcaster)')
    // set-time
    .addSubcommand(sc =>
        sc.setName('set-time')
            .setDescription('Поменять время части для дня')
            .addStringOption(o => o.setName('day').setDescription('День недели').setRequired(true).addChoices(...DAY_CHOICES))
            .addIntegerOption(o => o.setName('part').setDescription('Часть (1 или 2)').setRequired(true).addChoices(
                { name: '1', value: 1 }, { name: '2', value: 2 }
            ))
            .addStringOption(o => o.setName('time').setDescription('Время HH:MM').setRequired(true))
    )
    // add-day
    .addSubcommand(sc =>
        sc.setName('add-day')
            .setDescription('Добавить день с временем двух частей')
            .addStringOption(o => o.setName('day').setDescription('День недели').setRequired(true).addChoices(...DAY_CHOICES))
            .addStringOption(o => o.setName('part1').setDescription('Часть 1 (HH:MM)').setRequired(true))
            .addStringOption(o => o.setName('part2').setDescription('Часть 2 (HH:MM)').setRequired(true))
    )
    // remove-day
    .addSubcommand(sc =>
        sc.setName('remove-day')
            .setDescription('Удалить день из расписания')
            .addStringOption(o => o.setName('day').setDescription('День недели').setRequired(true).addChoices(...DAY_CHOICES))
    )
    // list
    .addSubcommand(sc =>
        sc.setName('list').setDescription('Показать текущие активные дни и время частей')
    )
    // set-days
    .addSubcommand(sc =>
        sc.setName('set-days')
            .setDescription('Задать активные дни (используются в /week1)')
            .addStringOption(o =>
                o.setName('days')
                    .setDescription('Через запятую: напр. "Среда, Пятница, Воскресенье"')
                    .setRequired(true)
            )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages) // реальный доступ проверяем сами

const scheduleCommand = async (interaction) => {
    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (!hasBroadcasterPerm(member)) {
        return interaction.reply({ embeds: [makeErrorEmbed('❌ Команда доступна только Broadcaster.')], flags: 64 });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'set-time') {
        const day  = interaction.options.getString('day');
        const part = interaction.options.getInteger('part');
        const time = interaction.options.getString('time');

        if (!isHHMM(time)) return interaction.reply({ embeds: [makeErrorEmbed('❌ Время должно быть в формате HH:MM')], flags: 64 });
        setPartTime(day, part, time);
        return interaction.reply({ embeds: [makeSuccessEmbed(`✅ Время обновлено: **${day}**, часть **${part}** → **${time}**`)], flags: 64 });
    }

    if (sub === 'add-day') {
        const day   = interaction.options.getString('day');
        const p1    = interaction.options.getString('part1');
        const p2    = interaction.options.getString('part2');
        if (!isHHMM(p1) || !isHHMM(p2)) return interaction.reply({ embeds: [makeErrorEmbed('❌ Время частей — формат HH:MM')], flags: 64 });
        addDay(day, p1, p2);
        return interaction.reply({ embeds: [makeSuccessEmbed(`✅ День добавлен: **${day}** — 1 ч. **${p1}**, 2 ч. **${p2}**`)], flags: 64 });
    }

    if (sub === 'remove-day') {
        const day = interaction.options.getString('day');
        if (!PART_TIMES[day]) return interaction.reply({ embeds: [makeErrorEmbed('❌ Такого дня нет в расписании')], flags: 64 });
        removeDay(day);
        return interaction.reply({ embeds: [makeSuccessEmbed(`✅ День удалён: **${day}**`)], flags: 64 });
    }

    if (sub === 'list') {
        const lines = [];
        const act = getActiveDays();
        for (const d of Object.keys(PART_TIMES)) {
            const t = PART_TIMES[d];
            const mark = act.includes(d) ? '✅' : '—';
            lines.push(`${mark} **${d}**: 1 ч. **${t['1']||'—'}**, 2 ч. **${t['2']||'—'}**`);
        }
        if (!lines.length) lines.push('_пусто_');
        return interaction.reply({ embeds: [makePromptEmbed('Текущее расписание', lines.join('\n'))], flags: 64 });
    }

    if (sub === 'set-days') {
        const raw = interaction.options.getString('days');
        const days = raw.split(',').map(s => s.trim()).filter(Boolean);
        if (!days.length) return interaction.reply({ embeds: [makeErrorEmbed('❌ Укажи хотя бы один день')], flags: 64 });
        setActiveDays(days);
        return interaction.reply({ embeds: [makeSuccessEmbed(`✅ Активные дни: ${days.map(d => `**${d}**`).join(', ')}`)], flags: 64 });
    }
};

module.exports = { scheduleCommandDef, scheduleCommand };
