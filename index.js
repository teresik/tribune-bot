const {
    Client, GatewayIntentBits, Partials, Events,
    ButtonBuilder, ActionRowBuilder, ButtonStyle, MessageContent
} = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
const schedule = require('node-schedule');

// Константы
const DATA_PATH = './data.json';
const STORAGE_PATH = './storage.json';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 минут
const BUTTONS_PER_ROW = 5;
const TRIBUNE_START_TIME = '21:00';
const REQUIRED_PLAYERS = {
    boys: 2,
    girls: 2
};
const PART_TIMES = {
    '1': '21:00–22:00',
    '2': '22:00–23:00',
    '3': '23:00–00:00'
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

const userSessions = {};

const scheduleByWeek = {
    1: ['Понедельник', 'Среда', 'Пятница', 'Воскресенье'],
    2: ['Вторник', 'Четверг', 'Суббота']
};

/**
 * Переводит первую букву строки в верхний регистр
 * @param {string} str - Исходная строка
 * @returns {string} Строка с заглавной первой буквой
 */
function capitalize(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Получает предстоящие даты для указанных дней недели
 * @param {Date} baseDate - Базовая дата для отсчета
 * @param {Array} daysNeeded - Массив с названиями дней недели
 * @returns {Array} Массив объектов с датами и названиями дней
 */
function getUpcomingWeekDates(baseDate, daysNeeded) {
    const result = [];
    const used = new Set();
    
    // Проверка входных параметров
    if (!(baseDate instanceof Date) || !Array.isArray(daysNeeded)) {
        console.error('Неверные аргументы для getUpcomingWeekDates');
        return result;
    }

    for (let i = 0; result.length < daysNeeded.length && i < 14; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);
        const dayName = capitalize(d.toLocaleDateString('ru-RU', { weekday: 'long' }));
        if (daysNeeded.includes(dayName) && !used.has(dayName)) {
            result.push({ date: d, day: dayName });
            used.add(dayName);
        }
    }
    return result;
}

/**
 * Создает сессию пользователя и устанавливает таймер для ее удаления
 * @param {string} userId - ID пользователя
 * @param {Object} data - Данные сессии
 */
function createUserSession(userId, data) {
    // Удаляем существующий таймер, если он есть
    if (userSessions[userId] && userSessions[userId].timer) {
        clearTimeout(userSessions[userId].timer);
    }
    
    // Создаем таймер для удаления сессии
    const timer = setTimeout(() => {
        delete userSessions[userId];
    }, SESSION_TIMEOUT);
    
    // Сохраняем сессию с таймером
    userSessions[userId] = {
        ...data,
        timer,
        createdAt: Date.now()
    };
}

/**
 * Получает сессию пользователя
 * @param {string} userId - ID пользователя
 * @returns {Object|null} Данные сессии или null
 */
function getUserSession(userId) {
    const session = userSessions[userId];
    if (!session) return null;
    
    // Обновляем таймер при обращении к сессии
    if (session.timer) {
        clearTimeout(session.timer);
        session.timer = setTimeout(() => {
            delete userSessions[userId];
        }, SESSION_TIMEOUT);
    }
    
    return session;
}

/**
 * Удаляет сессию пользователя
 * @param {string} userId - ID пользователя
 */
function removeUserSession(userId) {
    if (userSessions[userId] && userSessions[userId].timer) {
        clearTimeout(userSessions[userId].timer);
    }
    delete userSessions[userId];
}

/**
 * Загружает данные из файла
 * @returns {Object} Загруженные данные
 */
function loadData() {
    try {
        if (!fs.existsSync(DATA_PATH)) {
            fs.writeFileSync(DATA_PATH, '{}', 'utf-8');
        }
        const rawData = fs.readFileSync(DATA_PATH, 'utf-8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        return {};
    }
}

/**
 * Сохраняет данные в файл
 * @param {Object} data - Данные для сохранения
 */
function saveData(data) {
    try {
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('Ошибка при сохранении данных:', error);
    }
}

/**
 * Загружает хранилище из файла
 * @returns {Object} Загруженное хранилище
 */
function loadStorage() {
    try {
        if (!fs.existsSync(STORAGE_PATH)) {
            fs.writeFileSync(STORAGE_PATH, '{}', 'utf-8');
        }
        const rawData = fs.readFileSync(STORAGE_PATH, 'utf-8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error('Ошибка при загрузке хранилища:', error);
        return {};
    }
}

/**
 * Сохраняет хранилище в файл
 * @param {Object} data - Данные для сохранения
 */
function saveStorage(data) {
    try {
        fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('Ошибка при сохранении хранилища:', error);
    }
}

/**
 * Форматирует отдельную трибуну для отображения
 * @param {Object} dateObj - Объект с информацией о дате
 * @param {Object} entry - Данные трибуны
 * @returns {string} Отформатированная трибуна
 */
function formatTribune(dateObj, entry) {
    const dateStr = dateObj.date.toLocaleDateString('ru-RU');
    const key = `${dateObj.day} ${dateStr}`;
    const lines = [];

    lines.push(`**Трибуна: ${dateObj.day}, ${dateStr} в ${TRIBUNE_START_TIME}**`);
    lines.push(`Требуется: ${REQUIRED_PLAYERS.boys} мальчика и ${REQUIRED_PLAYERS.girls} девочки на 2 части`);
    lines.push('');

    for (const part of ['1', '2', '3']) {
        const isBackup = part === '3';
        const timeStr = PART_TIMES[part];
        const title = isBackup 
            ? `**${part} часть (ЗАПАСНАЯ) ${timeStr}**` 
            : `**${part} часть ${timeStr}**`;
        
        lines.push(title);

        for (const role of ['ведущий', 'замена']) {
            const ids = entry.parts?.[part]?.[role] || [];
            const mentions = ids.length > 0 ? ids.map(id => `<@${id}>`).join(', ') : '—';
            lines.push(`• ${capitalize(role)}: ${mentions}`);
        }
        lines.push('');
    }

    lines.push('📝 Выберите ниже кто на какую часть может');
    lines.push('');
    lines.push('❗ **Важно:**');
    lines.push('• Мальчик+мальчик или девочка+девочка — **НЕЛЬЗЯ** (только в исключительных случаях)');
    lines.push('• Расписание публикуется каждое воскресенье');

    return lines.join('\n');
}

/**
 * Форматирует расписание трибун для отображения
 * @param {Object} schedule - Объект с данными расписания
 * @param {Array} dates - Массив с датами для отображения
 * @returns {string} Отформатированное расписание
 */
function formatSchedule(schedule, dates) {
    return dates
        .filter(d => schedule.hasOwnProperty(`${d.day} ${d.date.toLocaleDateString('ru-RU')}`))
        .map(d => formatTribune(d, schedule[`${d.day} ${d.date.toLocaleDateString('ru-RU')}`]))
        .join('\n\n');
}

/**
 * Создает кнопки выбора дня
 * @param {Array} dates - Массив дат для кнопок
 * @returns {Array} Массив с рядами кнопок
 */
function createDayButtons(dates) {
    if (!Array.isArray(dates)) return [];
    
    const buttons = dates.map(d => new ButtonBuilder()
        .setCustomId(`day|${d.day} ${d.date.toLocaleDateString('ru-RU')}`)
        .setLabel(`${d.day} ${d.date.toLocaleDateString('ru-RU')}`)
        .setStyle(ButtonStyle.Primary)
    );
    
    const rows = [];
    for (let i = 0; i < buttons.length; i += BUTTONS_PER_ROW) {
        rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + BUTTONS_PER_ROW)));
    }
    return rows;
}

/**
 * Создает кнопки выбора части трибуны
 * @returns {Array} Массив с рядами кнопок
 */
function createPartButtons() {
    const buttons = Object.keys(PART_TIMES).map(p => {
        const isBackup = p === '3';
        return new ButtonBuilder()
            .setCustomId(`part|${p}`)
            .setLabel(`${p} часть ${isBackup ? '(запасная)' : ''}`)
            .setStyle(isBackup ? ButtonStyle.Danger : ButtonStyle.Secondary);
    });
    
    return [new ActionRowBuilder().addComponents(buttons)];
}

/**
 * Создает кнопки выбора роли
 * @returns {Array} Массив с рядами кнопок
 */
function createRoleButtons() {
    const roleStyles = {
        'ведущий': ButtonStyle.Success,
        'замена': ButtonStyle.Primary
    };
    
    const buttons = Object.keys(roleStyles).map(r => 
        new ButtonBuilder()
            .setCustomId(`role|${r}`)
            .setLabel(capitalize(r))
            .setStyle(roleStyles[r])
    );
    
    return [new ActionRowBuilder().addComponents(buttons)];
}

/**
 * Создает кнопку отмены выбора
 * @returns {Array} Массив с рядом кнопок
 */
function createCancelButton() {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('Отмена')
                .setStyle(ButtonStyle.Danger)
        )
    ];
}

/**
 * Обновляет основное сообщение с расписанием
 * @param {Client} client - Клиент Discord
 * @returns {Promise<void>}
 */
async function updateMainMessage(client) {
    try {
        const data = loadData();
        const storage = loadStorage();
        
        if (!storage.messageId || !storage.lastWeek) {
            console.error('Отсутствует информация о сообщении для обновления');
            return;
        }
        
        const { messageId, lastWeek } = storage;
        const days = scheduleByWeek[lastWeek];
        
        if (!days) {
            console.error(`Неверный тип недели: ${lastWeek}`);
            return;
        }
        
        const dates = getUpcomingWeekDates(new Date(), days);
        const content = formatSchedule(data, dates);
        
        // Получаем канал и сообщение
        const channel = await client.channels.fetch(config.channelId)
            .catch(err => {
                console.error('Ошибка получения канала:', err);
                return null;
            });
            
        if (!channel) return;
        
        const msg = await channel.messages.fetch(messageId)
            .catch(err => {
                console.error('Ошибка получения сообщения:', err);
                return null;
            });
            
        if (!msg) return;
        
        // Обновляем сообщение
        await msg.edit({ content })
            .catch(err => console.error('Ошибка редактирования сообщения:', err));
            
    } catch (error) {
        console.error('Ошибка при обновлении сообщения:', error);
    }
}

/**
 * Обрабатывает команду создания расписания
 * @param {Interaction} interaction - Объект взаимодействия
 * @param {number} weekType - Тип недели (1 или 2)
 * @returns {Promise<void>}
 */
async function handleScheduleCommand(interaction, weekType) {
    try {
        // Проверяем тип недели
        if (!scheduleByWeek[weekType]) {
            await interaction.reply({ 
                content: '❌ Неверный тип недели. Используйте 1 или 2.', 
                ephemeral: true 
            });
            return;
        }
        
        const days = scheduleByWeek[weekType];
        const tribunes = getUpcomingWeekDates(new Date(), days);
        
        if (tribunes.length === 0) {
            await interaction.reply({ 
                content: '❌ Не удалось создать расписание для указанных дней.', 
                ephemeral: true 
            });
            return;
        }

        // Создаем структуру данных
        const structure = {};
        for (const { day, date } of tribunes) {
            const key = `${day} ${date.toLocaleDateString('ru-RU')}`;
            structure[key] = {
                parts: {
                    "1": { ведущий: [], замена: []},
                    "2": { ведущий: [], замена: [] },
                    "3": { ведущий: [], замена: [] }
                }
            };
        }

        // Отправляем сообщение с расписанием
        const content = formatSchedule(structure, tribunes);
        const buttons = createDayButtons(tribunes);
        
        const msg = await interaction.channel.send({ 
            content,
            components: buttons
        }).catch(err => {
            console.error('Ошибка отправки сообщения:', err);
            return null;
        });
        
        if (!msg) {
            await interaction.reply({ 
                content: '❌ Не удалось отправить расписание.', 
                ephemeral: true 
            });
            return;
        }
        
        // Сохраняем данные
        saveData(structure);
        saveStorage({ messageId: msg.id, lastWeek: weekType });

        await interaction.reply({ 
            content: '✅ Расписание успешно опубликовано!', 
            ephemeral: true 
        });
        
    } catch (error) {
        console.error('Ошибка при обработке команды расписания:', error);
        await interaction.reply({ 
            content: '❌ Произошла ошибка при создании расписания.', 
            ephemeral: true 
        }).catch(() => {});
    }
}

client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'week1') await handleScheduleCommand(interaction, 1);
        if (interaction.commandName === 'week2') await handleScheduleCommand(interaction, 2);
    }

    if (interaction.isButton()) {
        const [step, value] = interaction.customId.split('|');
        const userId = interaction.user.id;

        if (step === 'day') {
            userSessions[userId] = { day: value };
            return interaction.reply({ content: 'Выберите часть трибуны:', components: createPartButtons(), ephemeral: true });
        }

        if (step === 'part') {
            if (!userSessions[userId] || !userSessions[userId].day) return interaction.reply({ content: 'Сначала выберите день.', ephemeral: true });
            userSessions[userId].part = value;
            return interaction.reply({ content: 'Выберите роль:', components: createRoleButtons(), ephemeral: true });
        }

        if (step === 'role') {
            const session = userSessions[userId];
            if (!session || !session.day || !session.part) return interaction.reply({ content: 'Сначала выберите день и часть.', ephemeral: true });

            const data = loadData();
            const { day, part } = session;
            const role = value;

            if (!data[day]) return interaction.reply({ content: '❌ Неверная дата.', ephemeral: true });
            if (!Array.isArray(data[day].parts[part][role])) {
                data[day].parts[part][role] = [];
            }

            const maxSlots = role === 'ведущий' ? 2 : 3;
            const already = data[day].parts[part][role];

            if (already.includes(userId)) {
                return interaction.reply({ content: '⚠️ Вы уже зарегистрированы на эту роль.', ephemeral: true });
            }

            if (already.length >= maxSlots) {
                return interaction.reply({ content: '❌ Все места заняты.', ephemeral: true });
            }

            already.push(userId);

            saveData(data);

            await updateMainMessage(client);
            return interaction.reply({ content: `✅ Вы записаны на ${day}, часть ${part}, как ${role}.`, ephemeral: true });
        }
    }
});

client.login(config.token);