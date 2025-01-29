const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const queryCharacter = require('./npcChat/characterQuery.js');
const { getHouseTask, completeLesson, getHouseProgress } = require('./npcChat/lessons.js');
const { handleQuery } = require('./npcChat/handleQuery.js');
const { getHogwartsHouseRole } = require('./npcChat/utilities.js');
const { addPoints, removePoints } = require('./npcChat/adminPoints');
const { sortUser, handleSortingCooldown } = require('./npcChat/sorting.js');
const { duel } = require('./npcChat/duel.js');
const { scheduleSnitchTask } = require('./npcChat/snitch');
const { scheduleTasks } = require('./npcChat/Tasks');

const commandsList = [
    { name: '!ask', description: 'Ask a question about the Wizard Cup.' },
    { name: '!sortme', description: 'Get sorted into a house by the Sorting Hat.' },
    { name: '!duel', description: 'Start a duel between two people, separated by a comma' },
    { name: '!progress', description: 'Check the current Lessons progress for your House.' },
    { name: '!addpoints', description: 'Award points to a House (Event Admin Only).' },
    { name: '!removepoints', description: 'Deduct points from a House (Event Admin Only).' },
    { name: '!lesson', description: 'Get the current lesson for your House.' },
    { name: '!lessoncomplete', description: 'Mark the current lesson as complete (Prefect role only).' },
    { name: '!malfoy', description: 'Interact with Draco Malfoy.' },
    { name: '!dumbledore', description: 'Interact with Albus Dumbledore.' },
    { name: '!hagrid', description: 'Interact with Rubeus Hagrid.' },
    { name: '!dobby', description: 'Interact with Dobby the House Elf.' },
    { name: '!filch', description: 'Interact with Argus Filch.' },
    { name: '!nick', description: 'Interact with Nearly Headless Nick.' },
    { name: '!luna', description: 'Interact with Luna Lovegood.' },
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

// Fetch the allowed guild ID from environment variables
const allowedGuildId = process.env.GUILD_ID;

// Define the date and time after which the commands should be available (31st Jan 2025, 5 PM GMT)
const restrictedDate = new Date('2025-01-21T17:00:00Z'); // 5 PM GMT on 31st January 2025

// Get the channel IDs from environment variables
const houseChannels = {
    gryffindor: process.env.GRYFFINDOR_CHANNEL,
    slytherin: process.env.SLYTHERIN_CHANNEL,
    ravenclaw: process.env.RAVENCLAW_CHANNEL,
    hufflepuff: process.env.HUFFLEPUFF_CHANNEL
};

client.once('ready', async () => {
    console.log('Bot is ready!');
    scheduleSnitchTask(client); // Initialize the Snitch task
    scheduleTasks(client);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Check if the message is coming from the allowed guild by comparing guild.id
    if (message.guild && message.guild.id !== allowedGuildId) {
        return; // Ignore commands from other guilds
    }

    // Ensure the command is being used in the correct channel and by a member with the house role
    const channelId = message.channel.id;
    const userRole = getHogwartsHouseRole(message.member.roles.cache);

    // Check if the command is restricted
    const currentTime = new Date();
    if (currentTime < restrictedDate) {
        // If before 31st Jan 2025, 5 PM GMT, send the custom message for certain commands
        if (['!lesson', '!lessoncomplete', '!progress'].includes(message.content.toLowerCase())) {
            return message.channel.send("The third-floor corridor on the right-hand side is out of bounds to everyone who does not wish to die a very painful death.");
        }
    }

    if (!message.content.startsWith('!')) return;

    const [command, ...args] = message.content.trim().split(/\s+/);
    const normalizedCommand = command.toLowerCase();

    const validCommands = [
        '!commands', '!ask', '!progress', '!addpoints', '!removepoints', 
        '!lesson', '!lessoncomplete', '!snape', '!malfoy', '!dumbledore', 
        '!hagrid', '!dobby', '!filch', '!nick', '!luna', '!lockhart', 
        '!mcgonagall', '!sprout', '!flitwick', '!sortme', '!duel'
    ];

    if (!validCommands.includes(normalizedCommand)) {
        return message.channel.send("Command not recognized. Use `!commands` to see the list of available commands.");
    }

    try {
        // Ensure the user is part of a house role and in the correct channel
        if (['!lesson', '!lessoncomplete'].includes(normalizedCommand)) {
            if (!userRole) {
                return message.channel.send('You must be part of a Hogwarts house to use this command.');
            }

            // Check if the user is in the correct channel based on their house role
            const houseChannelId = houseChannels[userRole.toLowerCase()];
            if (channelId !== houseChannelId) {
                const channelLink = `https://discord.com/channels/${message.guild.id}/${houseChannelId}`;
                return message.channel.send(`You can only use this command in your house channel: [${userRole} Channel](${channelLink}).`);
            }
        }

        switch (normalizedCommand) {
            case '!ask':
                await handleQuery(message);
                break;

            case '!duel':
                await duel(message);  // Call duel function from duel.js
                break;

            case '!lessoncomplete':
                // Check if the user has a role containing "prefect" or "leader"
                if (!message.member.roles.cache.some(role => role.name.toLowerCase().includes('prefect') || role.name.toLowerCase().includes('leader'))) {
                    return message.channel.send('You need to be a Prefect or House Leader to complete a lesson.');
                }
                const completionResponse = await completeLesson(message.member.roles.cache);
                message.channel.send(completionResponse);
                break;

            case '!lesson':
                const lessonEmbedResponse = await getHouseTask(userRole);
                if (lessonEmbedResponse.content) {
                    await message.channel.send(lessonEmbedResponse.content);
                } else if (lessonEmbedResponse.embeds && lessonEmbedResponse.embeds.length > 0) {
                    await message.channel.send({ embeds: lessonEmbedResponse.embeds });
                } else {
                    message.channel.send("An error occurred or no lessons are available.");
                }
                break;

            case '!progress':
                if (!userRole) {
                    return message.channel.send('You must be part of a Hogwarts house to use this command.');
                }

                const progressResult = await getHouseProgress(userRole);

                if (progressResult.error) {
                    return message.channel.send(progressResult.error);
                }
                const houseColors = {
                    Gryffindor: '#740001',
                    Slytherin: '#1a472a',
                    Ravenclaw: '#222f5b',
                    Hufflepuff: '#f0c75e'
                };
                const houseThumbnails = {
                    Gryffindor: 'https://static.wikia.nocookie.net/harrypotter/images/b/b1/Gryffindor_ClearBG.png/revision/latest?cb=20190222162949',
                    Slytherin: 'https://static.wikia.nocookie.net/harrypotter/images/0/00/Slytherin_ClearBG.png/revision/latest?cb=20161020182557',
                    Ravenclaw: 'https://static.wikia.nocookie.net/harrypotter/images/7/71/Ravenclaw_ClearBG.png/revision/latest?cb=20161020182442',
                    Hufflepuff: 'https://static.wikia.nocookie.net/harrypotter/images/0/06/Hufflepuff_ClearBG.png/revision/latest?cb=20161020182518'
                };

                const embed = new EmbedBuilder()
                    .setColor(houseColors[userRole])
                    .setTitle(`${userRole} House Lessons progress`)
                    .setDescription(`The ${userRole} House has completed ${progressResult.completedLessons}/${progressResult.totalLessons} lessons (${progressResult.percentageCompleted}%).`)
                    .setThumbnail(houseThumbnails[userRole])
                    .setTimestamp();

                message.channel.send({ embeds: [embed] });
                break;

            case '!addpoints':
                if (args.length < 2) {
                    return message.channel.send('Please provide the number of points and the house.');
                }
                const pointsToAdd = parseInt(args[0], 10);
                const houseToAddPoints = args[1];
                if (isNaN(pointsToAdd)) {
                    return message.channel.send('Please provide a valid number of points.');
                }
                await addPoints(message, pointsToAdd, houseToAddPoints);
                break;

            case '!removepoints':
                if (args.length < 2) {
                    return message.channel.send('Please provide the number of points and the house.');
                }
                const pointsToRemove = parseInt(args[0], 10);
                const houseToRemovePoints = args[1];
                if (isNaN(pointsToRemove)) {
                    return message.channel.send('Please provide a valid number of points.');
                }
                await removePoints(message, pointsToRemove, houseToRemovePoints);
                break;

            case '!commands':
                const commandList = commandsList.map(cmd => `**${cmd.name}**: ${cmd.description}`).join('\n');
                const commandListEmbed = new EmbedBuilder()
                    .setTitle('List of Available Commands')
                    .setDescription(commandList)
                    .setColor('#FFD700') 
                    .setTimestamp();
                message.channel.send({ embeds: [commandListEmbed] });
                break;

            case '!sortme':
                await handleSortingCooldown(message);
                break;

            case '!snape':
            case '!malfoy':
            case '!dumbledore':
            case '!hagrid':
            case '!dobby':
            case '!filch':
            case '!nick':
            case '!luna':
            case '!lockhart':
            case '!mcgonagall':
            case '!sprout':
            case '!flitwick':
                await queryCharacter(normalizedCommand.slice(1), args.join(' '), message);
                break;
                
            default:
                message.channel.send("Command not recognized.");
                break;
        }
    } catch (error) {
        console.error('Error handling command:', error);
        message.channel.send('An error occurred while processing your command. Please try again later.');
    }
});


client.login(process.env.DISCORD_TOKEN);
