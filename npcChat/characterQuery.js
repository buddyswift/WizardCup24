const OpenAI = require("openai");
const { EmbedBuilder } = require('discord.js');
const openai = new OpenAI();

// Centralized character data for modularity
const characters = {
    malfoy: {
        thumbnailUrl: 'https://static.wikia.nocookie.net/harrypotter/images/8/84/Draco_Malfoy_%28HBP_promo%29.jpg/revision/latest/scale-to-width-down/1000?cb=20140623200347',
        fullName: 'Draco Malfoy'
    },
    dumbledore: {
        thumbnailUrl: 'https://static.wikia.nocookie.net/harrypotter/images/7/75/Albus_Dumbledore_%28HBPF_promo%29.jpg/revision/latest/scale-to-width-down/1000?cb=20150822232849',
        fullName: 'Albus Dumbledore'
    },
    hagrid: {
        thumbnailUrl: 'https://static.wikia.nocookie.net/harrypotter/images/f/fe/Rubeus_Hagrid.png/revision/latest?cb=20221014184333',
        fullName: 'Rubeus Hagrid'
    },
    dobby: {
        thumbnailUrl: 'https://static.wikia.nocookie.net/harrypotter/images/8/82/Dobby.jpg/revision/latest?cb=20230712061949',
        fullName: 'Dobby the Free Elf'
    },
    luna: {
        thumbnailUrl: 'https://static.wikia.nocookie.net/harrypotter/images/3/30/Harry-potter-and-the-half--blood-prince-Luna.jpg/revision/latest?cb=20140521113232',
        fullName: 'Luna Lovegood'
    },
    filch: {
        thumbnailUrl: 'https://static.wikia.nocookie.net/harrypotter/images/c/c8/Mainfulcd.jpg/revision/latest?cb=20200413210532',
        fullName: 'Argus Filch'
    },
    nick: {
        thumbnailUrl: 'https://static.wikia.nocookie.net/harrypotter/images/6/6d/Nicholas_de_Mimsy-Porpington.png/revision/latest?cb=20200515191831',
        fullName: 'Nearly Headless Nick'
    },
    lockhart: {
        thumbnailUrl: 'https://static.wikia.nocookie.net/harrypotter/images/7/7b/Gilderoy_Lockhart_promotional_image_COSF.jpg/revision/latest?cb=20221104114009',
        fullName: 'Gilderoy Lockhart'
    },
    mcgonagall: {
        thumbnailUrl: 'https://static.wikia.nocookie.net/harrypotter/images/6/65/ProfessorMcGonagall-HBP.jpg/revision/latest?cb=20100612114856',
        fullName: 'Minerva McGonagall'
    },
    snape: {
        thumbnailUrl: 'https://static.wikia.nocookie.net/harrypotter/images/9/92/SeverusSnape.jpg/revision/latest?cb=20071006032924',
        fullName: 'Severus Snape'
    },
    sprout: {
        thumbnailUrl: 'https://static.wikia.nocookie.net/harrypotter/images/7/71/PSprout.png/revision/latest?cb=20110109155242',
        fullName: 'Pomona Sprout'
    },
    flitwick: {
        thumbnailUrl: 'https://static.wikia.nocookie.net/p__/images/f/f3/Copia_de_uhpfilius9it%282%29.jpg/revision/latest?cb=20170904093206&path-prefix=protagonist',
        fullName: 'Filius Flitwick'
    }
};

async function queryCharacter(character, userMessage, message) {
    try {
        // Normalize input character
        const characterData = characters[character.toLowerCase()];

        // If character is not recognized
        if (!characterData) {
            return message.channel.send("Character not recognized. Please use a valid character.");
        }

        const { fullName, thumbnailUrl } = characterData;

        // Construct the prompt for OpenAI
        const prompt = `User: ${userMessage}\nAI: Respond in the voice of ${fullName} from the Harry Potter series in 200 characters or less:`;

        // Call OpenAI API to generate the response
        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: userMessage }, { role: 'assistant', content: prompt }],
            model: 'gpt-3.5-turbo',
            max_tokens: 100,
            temperature: 0.7
        });

        const response = completion.choices[0].message.content.trim();

        // Send the response as an embed
        const embed = new EmbedBuilder()
            .setTitle(fullName)
            .setThumbnail(thumbnailUrl)
            .addFields({ name: 'Response:', value: response })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });

    } catch (error) {
        console.error("Error contacting OpenAI:", error);
        message.channel.send('An error occurred while processing your request. Please try again later.');
    }
}

module.exports = queryCharacter;
