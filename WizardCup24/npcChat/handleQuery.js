// handleQuery.js

require('dotenv').config();
const { getHogwartsHouseRole } = require('./utilities.js');  // Ensure correct import
const { getHouseTask } = require('./lessons.js'); // Import the getHouseTask function
const OpenAI = require("openai");
const { EmbedBuilder } = require('discord.js');
const openai = new OpenAI(process.env.OPENAI_API_KEY);


const faqs = [
    { question: "How does the event work", answer: "The Wizard Cup will be a week long competition for Green Bandits. Players are sorted into Houses at the start and must complete challenges to each Housepoints. The House with the most points wins the Cup!"},
    { question: "When does the event run from / to", answer: "The competition will run from 1st November to 9th Novemeber"},
    { question:  "Will there be any non-PvM tasks? Skilling? Minigames? Clue Scrolls?", answer: "Yes. The majority of the tasks will be PvM oriented, but expect more variety in activities compared to The Hunt, Bingo or other events." },
    { question: "Can I choose my house?", answer: "Just as the wand chooses the wizard, the Sorting Hat chooses your house. So no." },
    { question: "How can I prepare for the Wizard cup?", answer: "Stack Slayer Points, Stack Clues of Every Type, Prepare time bound activities such as Hespori or Tears of Guthix, Ensure you have adequate supplies and consuambles. You may also want to prepare a Barrows Chest and Lunar Chest" }
];

async function handleQuery(message) {
    const query = message.content.slice(5).trim();
    // Retrieve the user's Hogwarts house role
    try {
        
        const userRole = getHogwartsHouseRole(message.member.roles.cache);
    
    if (!userRole) {
        message.channel.send("You don't belong to any house.");
        return;
    }


        // Check if the query is specifically for the !lesson command
        if (query.toLowerCase() === 'lesson') {
                 

            // Call the getHouseTask function to get the current lesson
            const lessonEmbed = await getHouseTask(userRole);
            message.channel.send({ embeds: [lessonEmbed] });
        } else {
            let houseMaster;
            let thumbnailUrl;

            // Determine the house master and set the appropriate thumbnail
            if (userRole === 'Gryffindor') {
                houseMaster = 'McGonagall';
                thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/6/65/ProfessorMcGonagall-HBP.jpg/revision/latest?cb=20100612114856';
            } else if (userRole === 'Hufflepuff') {
                houseMaster = 'Sprout';
                thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/7/71/PSprout.png/revision/latest?cb=20110109155242';
            } else if (userRole === 'Ravenclaw') {
                houseMaster = 'Flitwick';
                thumbnailUrl = 'https://static.wikia.nocookie.net/p__/images/f/f3/Copia_de_uhpfilius9it%282%29.jpg/revision/latest?cb=20170904093206&path-prefix=protagonist';
            } else if (userRole === 'Slytherin') {
                houseMaster = 'Snape';
                thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/9/92/SeverusSnape.jpg/revision/latest?cb=20071006032924';
            } else {
                message.channel.send("You don't belong to any house.");
                return;
            }

            const faqText = faqs.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n');
            const prompt = `Here are some frequently asked questions about the event:\n\n${faqText}\n\nUser's house: ${userRole}\n\nUser question: ${query}\n\nRespond in the tone of ${houseMaster} from the Harry Potter series in 300 characters or less.`;

            const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a helpful assistant with knowledge about a Harry Potter themed event." },
                    { role: "user", content: prompt }
                ],
                model: "gpt-3.5-turbo",
                max_tokens: 800,
                temperature: 0.7,
            });

            const response = completion.choices[0].message.content.trim();
            const exampleEmbed = new EmbedBuilder()
                .setTitle(`Professor ${houseMaster}`)
                .setDescription(`*Head of ${userRole} House*`)
                .setThumbnail(thumbnailUrl)
                .addFields(
                    { name: 'Response:', value: response }
                )
                .setTimestamp();

            message.channel.send({ embeds: [exampleEmbed] });
        }
        
    } catch (error) {
        console.error("Failed to handle query:", error);
        message.channel.send('Error processing request. Please try again later.');
    }
}




module.exports = { handleQuery };
