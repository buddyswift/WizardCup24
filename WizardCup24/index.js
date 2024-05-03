require('dotenv').config();
const { Client, GatewayIntentBits} = require('discord.js');
const queryCharacter = require('./npcChat/characterQuery.js');
const { getHouseTask, completeLesson, getHousePoints } = require('./npcChat/lessons.js');
const  { handleQuery } = require('./npcChat/handlequery.js');
const {getHogwartsHouseRole} = require('./npcChat/utilities.js');
const { EmbedBuilder } = require('discord.js');




// Define the commands list outside of the event handler
const commandsList = [
    { name: '!ask', description: 'Ask a question of your Housemaster.' },
    { name: '!housepoints', description: 'Check the current Housepoints for your House.' },
    { name: '!lesson', description: 'Get the current lesson for your House.' },
    { name: '!lessoncomplete', description: 'Mark the current lesson as complete (Prefect role only).' },
    { name: '!malfoy', description: 'Interact with Draco Malfoy.' },
    { name: '!dumbledore', description: 'Interact with Albus Dumbledore.' },
    { name: '!hagrid', description: 'Interact with Rubeus Hagrid.' },
    { name: '!dobby', description: 'Interact with Dobby the House Elf.' },
    { name: '!filch', description: 'Interact with Argus Filch.' },
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

// Inside the messageCreate event handler
// Inside the messageCreate event handler
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const [command, ...args] = message.content.trim().split(/\s+/);

    // Identify if it's a known command first
    const matchingCommand = commandsList.find(cmd => cmd.name.toLowerCase() === command.toLowerCase());
    
    if (matchingCommand) {
        const userMessage = args.join(' '); // Join the arguments as the user message
        
        // Apply the user message check only for !ask and character interaction commands
        if (['!ask', '!malfoy', '!dumbledore', '!hagrid', '!dobby', '!filch', '!nick', '!lockhart', '!mcgonagall', '!snape', '!sprout', '!flitwick'].includes(command.toLowerCase())) {
            if (!userMessage) {
                message.channel.send('Please provide a message.');
                return;
            }
        }
        // Retrieve the user's Hogwarts house role       
        const userRole = getHogwartsHouseRole(message.member.roles.cache);
        
        switch (command.toLowerCase()) {
            case '!ask':
                // Call the handleQuery function with the user message and the message object
                await handleQuery(message, userMessage);
                break;
            case '!lessoncomplete':
                const isPrefect = message.member.roles.cache.some(role => role.name === 'Prefect');
                if (!isPrefect) {
                    message.channel.send('You need to be a Prefect to complete a lesson.');
                    return;
                }
                const completionResponse = await completeLesson(message.member.roles.cache);
                message.channel.send(completionResponse);
                break;
            case '!lesson':
                
                // Call the getHouseTask function with the user's role
                const lessonEmbedResponse = await getHouseTask(userRole);
                // Access the first embed in the array
                const lessonEmbed = lessonEmbedResponse.embeds[0];
                // Send the lesson embed to the channel
                if (lessonEmbed) {
                    message.channel.send({ embeds: [lessonEmbed] });
                } else {
                    throw new Error('Embed is undefined or not formatted correctly.');
                }
                break;
            case '!housepoints':
                    
                    if (!userRole) {
                        message.channel.send('You must be part of a Hogwarts house to use this command.');
                        return;
                    }
                    const pointsResult = await getHousePoints(userRole);
                    if (pointsResult.error) {
                        message.channel.send(pointsResult.error);
                        return;
                    }
                
                    // Define thumbnails for each house
                    const houseThumbnails = {
                        Gryffindor: 'https://static.wikia.nocookie.net/harrypotter/images/b/b1/Gryffindor_ClearBG.png/revision/latest?cb=20190222162949',
                        Slytherin: 'https://static.wikia.nocookie.net/harrypotter/images/0/00/Slytherin_ClearBG.png/revision/latest?cb=20161020182557',
                        Ravenclaw: 'https://static.wikia.nocookie.net/harrypotter/images/7/71/Ravenclaw_ClearBG.png/revision/latest?cb=20161020182442',
                        Hufflepuff: 'https://static.wikia.nocookie.net/harrypotter/images/0/06/Hufflepuff_ClearBG.png/revision/latest?cb=20161020182518'
                    };
                
                    const embed = new EmbedBuilder()
                        .setColor('#0099ff') // You can customize the color per house if desired
                        .setTitle(`${pointsResult.house} House Points`)
                        .setDescription(`The ${pointsResult.house} House currently has ${pointsResult.points} points.`)
                        .setThumbnail(houseThumbnails[pointsResult.house])
                        .setTimestamp();
                
                    message.channel.send({ embeds: [embed] });
                break;
              
            default:
                // Call the queryCharacter function with the command, user message, and message object
                await queryCharacter(matchingCommand.name.slice(1), userMessage, message); // Pass matchingCommand.name.slice(1) to remove the prefix
                break;
        }
    } else if (command.toLowerCase() === '!commands') {
        // Format and send the commands list
        const formattedCommands = commandsList.map(cmd => `${cmd.name}: ${cmd.description}`).join('\n');
        message.channel.send('List of available commands:\n' + formattedCommands);
    } else if (message.content.startsWith("!")) {
        // Handle recognized commands
        message.channel.send("Command not recognized. Use `!commands` to see the list of available commands.");
    } else {
        // Handle unrecognized commands
        
    }
});



client.login(process.env.DISCORD_TOKEN);
