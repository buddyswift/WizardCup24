const { EmbedBuilder } = require('discord.js');
const OpenAI = require("openai");
const openai = new OpenAI();
const { userHasHouseRole, main } = require('./utilities.js'); // Import utilities

async function handleQuery(message) {
    const query = message.content.slice(5).trim();
    try {
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
        console.error("Failed to handle query:", error);
        message.channel.send('Error processing request. Please try again later.');
    }
}

module.exports = handleQuery;
