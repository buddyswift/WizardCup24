// utilities.js
const OpenAI = require("openai");
const { EmbedBuilder } = require('discord.js');
const openai = new OpenAI();

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

module.exports = {
    userHasHouseRole,
    main
};
