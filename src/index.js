const { Client, GatewayIntentBits, SlashCommandBuilder, Events } = require('discord.js');
const schedule = require('node-schedule');
const { logNextRun } = require('./services/logging');
const { registerCommands } = require('./commands/register');
const { handleInteractionCreate } = require('./handlers/interactionCreate');
const { autoJobFactory } = require('./jobs/autoRepublish');
const config = require('./config');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    await registerCommands(client);
    const autoJob = autoJobFactory(schedule, client);
    logNextRun(autoJob);
});

client.on(Events.InteractionCreate, (i) => handleInteractionCreate(client, i));

client.login(config.token);
