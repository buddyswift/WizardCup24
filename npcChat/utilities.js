require('dotenv').config();
const { EmbedBuilder } = require('discord.js');
const OpenAI = require("openai");
const openai = new OpenAI(process.env.OPENAI_API_KEY);

function userHasHouseRole(user, roleName, message) {
    const guildMember = message.guild.members.cache.get(user.id);
    if (!guildMember) return false;
    return guildMember.roles.cache.some(role => role.name === roleName);
}

async function main(userMessage, message, roleName) {
    try {
        let houseMaster;
        let thumbnailUrl;
        let houseColor;

        // Define house colors
        const houseColors = {
            Gryffindor: '#740001', // Deep red for Gryffindor
            Slytherin: '#1a472a',  // Dark green for Slytherin
            Ravenclaw: '#222f5b',  // Blue for Ravenclaw
            Hufflepuff: '#f0c75e'  // Yellow for Hufflepuff
        };

        // Check which house the user belongs to and set houseMaster, thumbnailUrl, and color
        if (userHasHouseRole(message.author, 'Gryffindor', message)) {
            houseMaster = 'McGonagall';
            thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/6/65/ProfessorMcGonagall-HBP.jpg/revision/latest?cb=20100612114856';
            houseColor = houseColors.Gryffindor;
        } else if (userHasHouseRole(message.author, 'Hufflepuff', message)) {
            houseMaster = 'Sprout';
            thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/7/71/PSprout.png/revision/latest?cb=20110109155242';
            houseColor = houseColors.Hufflepuff;
        } else if (userHasHouseRole(message.author, 'Ravenclaw', message)) {
            houseMaster = 'Flitwick';
            thumbnailUrl = 'https://static.wikia.nocookie.net/p__/images/f/f3/Copia_de_uhpfilius9it%282%29.jpg/revision/latest?cb=20170904093206&path-prefix=protagonist';
            houseColor = houseColors.Ravenclaw;
        } else if (userHasHouseRole(message.author, 'Slytherin', message)) {
            houseMaster = 'Snape';
            thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/9/92/SeverusSnape.jpg/revision/latest?cb=20071006032924';
            houseColor = houseColors.Slytherin;
        } else {
            throw new Error("User doesn't belong to any house.");
        }

        const prompt = `User: ${userMessage}\nAI: Respond in the tone of ${houseMaster} from the Harry Potter series in 200 characters or less:`;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "user", content: userMessage },
                { role: "assistant", content: prompt }
            ],
            model: "gpt-3.5-turbo",
            max_tokens: 100,
            temperature: 0.7
        });

        const response = completion.choices[0].message.content.trim();

        const exampleEmbed = new EmbedBuilder()
            .setTitle(`Professor ${houseMaster}`)
            .setDescription(`*Head of ${roleName} House*`)
            .setThumbnail(thumbnailUrl)
            .addFields(
                { name: 'Response:', value: response }
            )
            .setColor(houseColor) // Apply the relevant house color
            .setTimestamp();

        await message.channel.send({ embeds: [exampleEmbed] });
    } catch (error) {
        console.error('Error contacting OpenAI:', error);
        message.channel.send('Error contacting OpenAI. Please try again later.');
    }
}

function getHogwartsHouseRole(rolesCache) {
    for (const [, role] of rolesCache) {
        const roleName = role.name;
        if (['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin'].includes(roleName)) {
            return roleName;
        }
    }
    return null;
}

module.exports = {
    userHasHouseRole,
    main,
    getHogwartsHouseRole
};
