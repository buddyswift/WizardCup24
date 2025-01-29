
const { getHogwartsHouseRole } = require('./utilities.js');
const { getHouseTask } = require('./lessons.js');
const OpenAI = require("openai");
const { EmbedBuilder } = require('discord.js');
const openai = new OpenAI(process.env.OPENAI_API_KEY);

const faqs = [
    { question: "How does the event work?", answer: "The Wizard Cup is a week-long competition where players are sorted into Houses and compete in tasks to earn points. The House with the most points wins the Cup." },
    { question: "When does the event run?", answer: "The competition runs from 31st January to 9th February 2025." },
    { question: "Can I choose my house?", answer: "The Sorting Hat chooses your house. You cannot pick your own house." },
    { question: "How can I prepare for the Wizard's Cup?", answer: "Stack Slayer Points. Have Hespori and Tears of Guthix ready to go. Ensure you have enough supplies. Have a Barrows, Moons and Gauntlet chest ready to loot. No restrictions on clue stacking or minigame rewards this time, so go wild!" },
    { question: "What plugins do I need?", answer: "Make sure to have the 'Clan Events' Runelite plugin for timestamps and passwords. If you play on mobile, join your friends chat and change the chat name to the event password." },
    { question: "What is the event password?", answer: "The event password will be released at the start of the event." },
    { question: "What if I fail trial during the Wizards Cup?", answer: "Trialists who haven't passed by the 30-day mark will remain in the clan as trialists for the duration of the competition and can still earn votes from their housemates." },
    { question: "What if I have to pull out during the competition?", answer: "Inform your house leader or prefects ASAP. Unfortunately, we cannot offer refunds on buy-ins." },
    { question: "Will there be non-PvM tasks?", answer: "Yes, there will be variety. While most tasks are PvM-oriented, we’ve balanced them with activities for all players, including Skilling, mini-games, team activities, and Lessons." },
    { question: "Can I play on an unranked account?", answer: "Yes, as long as you have an account in the clan chat. Inform us beforehand if you plan to play on a different account. Trialists must play on their ranked account." },
    { question: "How is the winner decided?", answer: "The House with the most points at the end of the competition wins. Points are earned by completing tasks, catching Golden Snitches, and participating in Lessons." },
    { question: "How do you prevent cheating?", answer: "Task submissions are reviewed by House Prefects and verified by Dumbledore. Any doctored screenshots will result in removal from the event and being hung by your thumbs in the dungeon." },
    { question: "How is fairness maintained if some members are unlucky with drops?", answer: "Participation and effort are valued just as much as task completion. Even if drops are unlucky, your consistent involvement will be noted." },
    { question: "What are lessons?", answer: "Lessons are a random sequence of smaller tasks, obtained with the !lesson command, and can only be issued 2 hours after the last. You must complete your lesson to move onto the next! Only prefects may mark lessons as complete." }
];     
      

async function handleQuery(message) {
    const query = message.content.slice(5).trim();  // Get the query after the command
    try {
        const userRole = getHogwartsHouseRole(message.member.roles.cache);

        if (!userRole) {
            message.channel.send("You don't belong to any house.");
            return;
        }

        // Construct the prompt to send to OpenAI
        const faqText = faqs.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n');
        const prompt = `
            You are a wizard or witch acting as a Hogwarts Housemaster for the Wizard Cup event. 
            Below are some frequently asked questions and their answers:

            ${faqText}

            User's house: ${userRole}

            User's question: ${query}

            Respond in the voice of the housemaster of ${userRole} House, in character as if they are speaking directly to the user. 
            Keep the response concise and under 1524 characters while still providing all necessary details.
        `;

        // Request to OpenAI for a response
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a wizard or witch acting as a Hogwarts Housemaster for the Wizard Cup event." },
                { role: "user", content: prompt }
            ],
            model: "gpt-3.5-turbo",
            max_tokens: 600,
            temperature: 0.7
        });

        const response = completion.choices[0].message.content.trim();

        // Define the house master and thumbnail based on the user's house
        let houseMaster;
        let thumbnailUrl;
        let houseColour;

        switch (userRole) {
            case 'Gryffindor':
                houseMaster = 'McGonagall';
                thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/6/65/ProfessorMcGonagall-HBP.jpg/revision/latest?cb=20100612114856';
                houseColour = '#740001'; // Gryffindor red
                break;
            case 'Hufflepuff':
                houseMaster = 'Sprout';
                thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/7/71/PSprout.png/revision/latest?cb=20110109155242';
                houseColour = '#f0c75e'; // Hufflepuff yellow
                break;
            case 'Ravenclaw':
                houseMaster = 'Flitwick';
                thumbnailUrl = 'https://static.wikia.nocookie.net/p__/images/f/f3/Copia_de_uhpfilius9it%282%29.jpg/revision/latest?cb=20170904093206&path-prefix=protagonist';
                houseColour = '#222f5b'; // Ravenclaw blue
                break;
            case 'Slytherin':
                houseMaster = 'Snape';
                thumbnailUrl = 'https://static.wikia.nocookie.net/harrypotter/images/9/92/SeverusSnape.jpg/revision/latest?cb=20071006032924';
                houseColour = '#1a472a'; // Slytherin green
                break;
            default:
                message.channel.send("You don't belong to any house.");
                return;
        }

        // Ensure the response doesn't exceed 1024 characters per field in the embed
        const maxLength = 1024;
        let remainingResponse = response;
        let splitResponse = [];

        // Split response if it exceeds the max length
        while (remainingResponse.length > maxLength) {
            splitResponse.push(remainingResponse.slice(0, maxLength));
            remainingResponse = remainingResponse.slice(maxLength);
        }
        splitResponse.push(remainingResponse);

        // Send multiple messages if necessary
        for (let i = 0; i < splitResponse.length; i++) {
            const exampleEmbed = new EmbedBuilder()
                .setTitle(`Professor ${houseMaster}`)
                .setDescription(`*Head of ${userRole} House*`)
                .setThumbnail(thumbnailUrl)
                .addFields({ name: 'Response:', value: splitResponse[i] })
                .setTimestamp()
                .setColor(houseColour); // Set the house colour

            await message.channel.send({ embeds: [exampleEmbed] });
        }

    } catch (error) {
        console.error("Failed to handle query:", error);
        message.channel.send('Error processing request. Please try again later.');
    }
}




module.exports = { handleQuery };