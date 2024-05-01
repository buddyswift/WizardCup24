// index.js
const { Client, GatewayIntentBits } = require('discord.js');
const { handleQuery } = require('./npcChat/handleQuery');
const { queryCharacter } = require('./npcChat/characterQuery');

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

    const [command, ...args] = message.content.trim().split(/\s+/); // Split message into command and arguments
    if (command.toLowerCase() === '!ask') {
        const userMessage = args.join(' '); // Join the arguments as the user message
        if (!userMessage) {
            message.channel.send('Please provide a message.');
            return;
        }
        // Call the handleQuery function with the user message
        await handleQuery(userMessage, message);
    } else {
        const characterCommand = command.toLowerCase(); // Extract the command as the character name
        const userMessage = args.join(' '); // Join the arguments as the user message
        if (!characterCommand || !userMessage) {
            message.channel.send('Please provide a character name and a message.');
            return;
        }
        // Call the queryCharacter function with the character command and user message
        await queryCharacter(characterCommand, userMessage, message);
    }
});

client.login('DISCORD_TOKEN');
