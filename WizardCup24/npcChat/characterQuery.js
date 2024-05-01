const OpenAI = require("openai");
const { EmbedBuilder } = require('discord.js');
const openai = new OpenAI();

async function queryCharacter(character, userMessage, message) {
    try {
        let thumbnailUrl;
        let characterFullName;

        // Determine the thumbnail URL and full name based on the character
        switch (character.toLowerCase()) {
            case 'malfoy':
                thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/8/84/Draco_Malfoy_%28HBP_promo%29.jpg/revision/latest/scale-to-width-down/1000?cb=20140623200347';
                characterFullName = 'Draco Malfoy';
                break;
            case 'dumbledore':
                thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/4/40/Albus_Dumbledore_%28HBP_promo%29_3.jpg/revision/latest?cb=20150822232849';
                characterFullName = 'Albus Dumbledore';
                break;
            case 'hagrid':
                thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/f/fe/Rubeus_Hagrid.png/revision/latest?cb=20221014184333';
                characterFullName = 'Rubeus Hagrid';
                break;
            case 'dobby':
                thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/8/82/Dobby.jpg/revision/latest?cb=20230712061949';
                characterFullName = 'Dobby';
                break;
            case 'filch':
                thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/c/c8/Mainfulcd.jpg/revision/latest?cb=20200413210532';
                characterFullName = 'Argus Filch';
                break;
            case 'baron':
                thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/5/55/Bloody_Baron.jpg/revision/latest?cb=20100408172210';
                characterFullName = 'Bloody Baron';
                break;
            case 'nick':
                thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/6/6d/Nicholas_de_Mimsy-Porpington.png/revision/latest?cb=20200515191831';
                characterFullName = 'Nearly Headless Nick';
                break;
            case 'lockhart':
                thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/7/7b/Gilderoy_Lockhart_promotional_image_COSF.jpg/revision/latest?cb=20221104114009';
                characterFullName = 'Gilderoy Lockhart';
                break;
            case 'mcgonagall':
                thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/6/65/ProfessorMcGonagall-HBP.jpg/revision/latest?cb=20100612114856';
                characterFullName = 'Minerva McGonagall';
                break;
            case 'snape':
                thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/9/92/SeverusSnape.jpg/revision/latest?cb=20071006032924';
                characterFullName = 'Severus Snape';
                break;
            case 'sprout':
                thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/7/71/PSprout.png/revision/latest?cb=20110109155242';
                characterFullName = 'Pomona Sprout';
                break;
            case 'flitwick':
                thumbnailUrl = 'https://static.wikia.nocookie.net/p__/images/f/f3/Copia_de_uhpfilius9it%282%29.jpg/revision/latest?cb=20170904093206&path-prefix=protagonist';
                characterFullName = 'Filius Flitwick';
                break;
            default:
                throw new Error("Character not recognized.");
        }

        // Prompt to instruct OpenAI to respond in the voice of the specified character
        const prompt = `User: ${userMessage}\nAI: Respond in the voice of ${characterFullName} from the Harry Potter series in 200 characters or less:`;

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

        // Construct an embed with the character's full name and response
        const exampleEmbed = new EmbedBuilder()
            .setTitle(`${characterFullName}`)
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

module.exports = queryCharacter;
