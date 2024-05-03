// handleQuery.js

require('dotenv').config();
const { userHasHouseRole, main } = require('./utilities.js'); // Import utilities
const { getHouseTask } = require('./lessons.js'); // Import the getHouseTask function
const OpenAI = require("openai");
const openai = new OpenAI(process.env.OPENAI_API_KEY);

async function handleQuery(message) {
    const query = message.content.slice(5).trim();
    try {
        // Check if the query is specifically for the !lesson command
        if (query.toLowerCase() === 'lesson') {
            // Retrieve the user's Hogwarts house role
            const userRole = getHogwartsHouseRole(message.member.roles.cache);

            // Call the getHouseTask function to get the current lesson
            const lessonEmbed = await getHouseTask(userRole);
            message.channel.send({ embeds: [lessonEmbed] });
        } else {
            // Proceed with the existing logic for handling queries based on house roles
            if (userHasHouseRole(message.author, 'Gryffindor', message)) {
                await main(query, message, 'Gryffindor');
            } else if (userHasHouseRole(message.author, 'Hufflepuff', message)) {
                await main(query, message, 'Hufflepuff');
            } else if (userHasHouseRole(message.author, 'Ravenclaw', message)) {
                await main(query, message, 'Ravenclaw');
            } else if (userHasHouseRole(message.author, 'Slytherin', message)) {
                await main(query, message, 'Slytherin');
            }
        }
    } catch (error) {
        console.error("Failed to handle query:", error);
        message.channel.send('Error processing request. Please try again later.');
    }
}




module.exports = { handleQuery };
