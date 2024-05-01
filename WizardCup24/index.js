require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const handleQuery = require('./npcChat/handleQuery.js');
const queryCharacter = require('./npcChat/characterQuery.js');

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
    
    // Check for specific character commands
    if (command.toLowerCase() === '!ask') {
        const userMessage = args.join(' '); // Join the arguments as the user message
        if (!userMessage) {
            message.channel.send('Please provide a message.');
            return;
        }
        // Call the handleQuery function with the user message and the message object
        await handleQuery(message, userMessage);
    } else if (command.startsWith('!')) {
        // Extract the character command from the message
        const characterCommand = command.toLowerCase().slice(1); // Remove the '!' prefix
        const userMessage = args.join(' '); // Join the arguments as the user message
        if (!userMessage) {
            message.channel.send('Please provide a message.');
            return;
        }
        // Call the queryCharacter function with the character command, user message, and message object
        await queryCharacter(characterCommand, userMessage, message);
    }
});

client.login(process.env.DISCORD_TOKEN);
