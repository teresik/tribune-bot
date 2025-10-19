const { EmbedBuilder } = require('discord.js');

const makePromptEmbed = (title, description) =>
    new EmbedBuilder().setTitle(title).setDescription(description).setColor(0x5865F2);
const makeSuccessEmbed = (description) =>
    new EmbedBuilder().setDescription(description).setColor(0x43B581);
const makeErrorEmbed = (description) =>
    new EmbedBuilder().setDescription(description).setColor(0xED4245);

module.exports = { makePromptEmbed, makeSuccessEmbed, makeErrorEmbed };
