// characterQuery.js
const OpenAI = require("openai");
const { EmbedBuilder } = require('discord.js');
const openai = new OpenAI();

async function queryCharacter(character, userMessage, message) {
    try {
        let thumbnailUrl;

        // Determine the thumbnail URL based on the character
        switch (character.toLowerCase()) {
            case 'malfoy':
                thumbnailUrl = 'URL_TO_MALFOY_THUMBNAIL';
                break;
            case 'dumbledore':
                thumbnailUrl = 'URL_TO_DUMBLEDORE_THUMBNAIL';
                break;
            case 'hagrid':
                thumbnailUrl = 'URL_TO_HAGRID_THUMBNAIL';
                break;
            case 'dobby':
                thumbnailUrl = 'URL_TO_DOBBY_THUMBNAIL';
                break;
            case 'filch':
                thumbnailUrl = 'URL_TO_FILCH_THUMBNAIL';
                break;
            case 'baron':
                thumbnailUrl = 'URL_TO_BARON_THUMBNAIL';
                break;
            case 'nick':
                thumbnailUrl = 'URL_TO_NICK_THUMBNAIL';
                break;
            case 'lockhart':
                thumbnailUrl = 'URL_TO_LOCKHART_THUMBNAIL';
                break;
            case 'mcgonagall':
                thumbnailUrl = 'URL_TO_MCGONAGALL_THUMBNAIL';
                break;
            case 'snape':
                thumbnailUrl = 'URL_TO_SNAPE_THUMBNAIL';
                break;
            case 'sprout':
                thumbnailUrl = 'URL_TO_SPROUT_THUMBNAIL';
                break;
            case 'flitwick':
                thumbnailUrl = 'URL_TO_FLITWICK_THUMBNAIL';
                break;
            default:
                throw new Error("Character not recognized.");
        }

        // Prompt to instruct OpenAI to respond in the voice of the specified character
        const prompt = `User: ${userMessage}\nAI: Respond in the voice of ${character} from the Harry Potter series:`;

        // Send completion request to OpenAI
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "user", content: userMessage },
                { role: "assistant", content: prompt } // Include the prompt for the character's voice
            ],
            model: "gpt-3.5-turbo",
            max_tokens: 100, // Limit the maximum number of tokens to keep the response short
            temperature: 0.7, // Adjust the temperature to control the randomness of the response
        });

        const response = completion.choices[0].message.content.trim(); // Trim any extra whitespace
        const characterResponse = `${response}`; // Prefix the response with the character's name

        console.log('OpenAI response:', response);

        // Construct an embed with the character's name and response
        const exampleEmbed = new EmbedBuilder()
            .setTitle(`${character}`)
            .setThumbnail(thumbnailUrl) // Set the appropriate thumbnail
            .addFields(
                { name: ' ', value: characterResponse }
            )
            .setTimestamp();

        // Send the embed as a message in the channel
        message.channel.send({ embeds: [exampleEmbed] });

    } catch (error) {
        console.error('Error contacting OpenAI:', error);
        message.channel.send('Error contacting OpenAI. Please try again later.');
    }
}

module.exports = {
    queryCharacter
};
