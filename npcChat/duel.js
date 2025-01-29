const { EmbedBuilder } = require('discord.js');
const OpenAI = require("openai");
const openai = new OpenAI(process.env.OPENAI_API_KEY);

async function duel(message) {
    const duelArgs = message.content.slice(6).trim();  // Get the names after the command
    const players = duelArgs.split(',');

    if (players.length !== 2) {
        return message.channel.send("Please provide two player names separated by a comma.");
    }

    const [player1, player2] = players.map(p => p.replace(/^\s+|\s+$/g, ''));

    try {
        // Construct the prompt for OpenAI to generate a duel result
        const prompt = `Write a paragraph describing a magical duel between two wizards: ${player1} and ${player2} in 300 chracters or less. Include details on the spells they used, the outcome of the duel, and who won. Use at least one unusual spell. Keep it exciting and in the style of a Harry Potter match.`;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a magical duel announcer in the world of Harry Potter." },
                { role: "user", content: prompt }
            ],
            model: "gpt-3.5-turbo",
            max_tokens: 300,
            temperature: 0.7
        });

        const duelOutcome = completion.choices[0].message.content.trim();

        // Create the embed for the duel result
        const duelEmbed = new EmbedBuilder()
            .setTitle('Magical Duel Results')
            .setDescription(duelOutcome)
            .setThumbnail('https://static.wikia.nocookie.net/harrypotter/images/4/44/LeeJordan.jpg/revision/latest?cb=20240416013149')
            .setTimestamp();

        message.channel.send({ embeds: [duelEmbed] });
    } catch (error) {
        console.error('Error in duel:', error);
        message.channel.send('An error occurred while processing the duel. Please try again later.');
    }
}

module.exports = { duel };
