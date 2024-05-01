require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const npcChat = require('./npcchat/npcchat'); // Import NPC chat module

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log('Bot is ready!');
});

client.on('messageCreate', async message => {
    if (message.author.bot) return; // Ignore messages from bots
    if (message.content.startsWith('!ask')) {
        npcChat.handleQuery(message); // Delegate to the npcChat module
    }
    // Additional handlers for other commands can be added here
});

client.login(process.env.DISCORD_TOKEN);
