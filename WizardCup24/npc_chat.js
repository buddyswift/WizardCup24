require('dotenv').config();
console.log('API Key:', process.env.OPENAI_API_KEY);

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const OpenAI = require("openai");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const openai = new OpenAI();

client.once('ready', () => {
    console.log('Bot is ready!');
});

client.on('messageCreate', async message => {
    if (message.author.bot) return; // Ignore messages from bots

    console.log('Received message:', message.content);

    

    if (message.content.startsWith('!ask')) {
        try {
            console.log('Processing !ask command');
            const query = message.content.slice(5).trim();
            
            if (userHasHouseRole(message.author, 'Gryffindor', message)) {
                await main(query, message, 'Gryffindor');
            } else if (userHasHouseRole(message.author, 'Hufflepuff', message)) {
                await main(query, message, 'Hufflepuff');
            } else if (userHasHouseRole(message.author, 'Ravenclaw', message)) {
                await main(query, message, 'Ravenclaw');
            } else if (userHasHouseRole(message.author, 'Slytherin', message)) {
                await main(query, message, 'Slytherin');
            }

                    } catch (error) {
            console.error("Failed to fetch response:", error);
            message.channel.send('Error fetching response. Please try again later.');
        }
    }
});


async function main(userMessage, message, rolename) {
    try {
        let houseMaster;
        let thumbnailUrl;

        // Determine the house master and set the appropriate thumbnail
        if (userHasHouseRole(message.author, 'Gryffindor', message)) {
            houseMaster = 'McGonagall';
            thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/6/65/ProfessorMcGonagall-HBP.jpg/revision/latest?cb=20100612114856';
        } else if (userHasHouseRole(message.author, 'Hufflepuff', message)) {
            houseMaster = 'Sprout';
            thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/7/71/PSprout.png/revision/latest?cb=20110109155242';
        } else if (userHasHouseRole(message.author, 'Ravenclaw', message)) {
            houseMaster = 'Flitwick';
            thumbnailUrl = 'https://static.wikia.nocookie.net/p__/images/f/f3/Copia_de_uhpfilius9it%282%29.jpg/revision/latest?cb=20170904093206&path-prefix=protagonist';
        } else if (userHasHouseRole(message.author, 'Slytherin', message)) {
            houseMaster = 'Snape';
            thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/a/a3/Severus_Snape.jpg/revision/latest?cb=20150307193047';
        } else {
            // User doesn't belong to any house
            throw new Error("User doesn't belong to any house.");
        }

        // Prompt to instruct OpenAI to respond in the tone of the house master
        const prompt = `User: ${userMessage}\nAI: Respond in the tone of ${houseMaster} from the Harry Potter series in 200 characters or less:`;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "user", content: userMessage },
                { role: "assistant", content: prompt } // Include the prompt for the house master's tone
            ],
            model: "gpt-3.5-turbo",
            max_tokens: 100, // Limit the maximum number of tokens to keep the response short
            temperature: 0.7, // Adjust the temperature to control the randomness of the response
        });

        const response = completion.choices[0].message.content.trim(); // Trim any extra whitespace
        const houseMasterResponse = `${response}`; // Prefix the response with the house master's name

        console.log('OpenAI response:', response);

        const exampleEmbed = new EmbedBuilder()
            .setTitle(`Professor ${houseMaster}`)
            .setDescription(`*Head of ${rolename} House*`)
            .setThumbnail(thumbnailUrl) // Set the appropriate thumbnail
            .addFields(
                { name: ' ', value: houseMasterResponse }
            )
            .setTimestamp();

        message.channel.send({ embeds: [exampleEmbed] }); // Use message.channel.send instead of channel.send

    } catch (error) {
        console.error('Error contacting OpenAI:', error);
        message.channel.send('Error contacting OpenAI. Please try again later.');
    }
}


// Function to check if the user has a specific house role
function userHasHouseRole(user, rolename, message) {
    // Check if the user is a member of a guild where the message was sent
    const guildMember = message.guild.members.cache.get(user.id);
    if (!guildMember) return false; // User is not a member of the guild

    // Check if the user has the specified role
    return guildMember.roles.cache.some(role => role.name === rolename);
}

client.login(process.env.DISCORD_TOKEN);