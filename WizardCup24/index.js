require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const handleQuery = require('./npcChat/handleQuery.js');
const queryCharacter = require('./npcChat/characterQuery.js');

// Define the commands list outside of the event handler
const commandsList = [
    { name: '!ask', description: 'Ask a question of your housemaster.' },
    { name: '!malfoy', description: 'Interact with Draco Malfoy.' },
    { name: '!dumbledore', description: 'Interact with Albus Dumbledore.' },
    { name: '!hagrid', description: 'Interact with Rubeus Hagrid.' },
    { name: '!dobby', description: 'Interact with Dobby the House Elf.' },
    { name: '!filch', description: 'Interact with Argus Filch.' },
    { name: '!baron', description: 'Interact with the Bloody Baron.' },
    { name: '!nick', description: 'Interact with Nearly Headless Nick.' },
    { name: '!lockhart', description: 'Interact with Gilderoy Lockhart.' },
    { name: '!mcgonagall', description: 'Interact with Minerva McGonagall.' },
    { name: '!snape', description: 'Interact with Severus Snape.' },
    { name: '!sprout', description: 'Interact with Pomona Sprout.' },
    { name: '!flitwick', description: 'Interact with Filius Flitwick.' }
];

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

    // Check if the command is a known character command
    const characterCommand = commandsList.find(cmd => cmd.name === command.toLowerCase());
    if (characterCommand) {
        const userMessage = args.join(' '); // Join the arguments as the user message
        if (!userMessage) {
            message.channel.send('Please provide a message.');
            return;
        }
        // Call the queryCharacter function with the character command, user message, and message object
        await queryCharacter(characterCommand.name.slice(1), userMessage, message); // Remove the '!' prefix from the command name
    } else if (command.toLowerCase() === '!ask') {
        const userMessage = args.join(' '); // Join the arguments as the user message
        if (!userMessage) {
            message.channel.send('Please provide a message.');
            return;
        }
        // Call the handleQuery function with the user message and the message object
        await handleQuery(message, userMessage);
    } else if (command.toLowerCase() === '!commands') {
        // Format the commands list
        const formattedCommands = commandsList.map(cmd => `${cmd.name}: ${cmd.description}`).join('\n');

        // Send the list of commands to the user
        message.channel.send('List of available commands:\n' + formattedCommands);
    } else {
        // Handle unrecognized commands
        message.channel.send("Command not recognized. Use `!commands` to see the list of available commands.");
    }
});

client.login(process.env.DISCORD_TOKEN);
