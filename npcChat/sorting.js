require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Sorting function that will be called from index.js
async function sortUser(message) {
    try {
        console.log(`Looking for sorting data for user: ${message.author.id}`);

        const { data, error } = await supabase
            .from('Sorting')
            .select('house, sorting_message')
            .eq('discord_handle', message.author.id);

        if (error || !data || data.length === 0) {
            return message.channel.send("Could not find sorting data for this user.");
        }

        const { house, sorting_message } = data[0];

        const userNickname = message.member.nickname || message.author.username;

        if (!sorting_message || typeof sorting_message !== 'string' || sorting_message.trim() === '') {
            return message.channel.send("There was an issue with your sorting message. Please try again later.");
        }

        const houseColors = {
            Gryffindor: '#740001',
            Slytherin: '#1a472a',
            Ravenclaw: '#222f5b',
            Hufflepuff: '#f0c75e'
        };

        const houseColor = houseColors[house] || '#FFD700';

        const embed = new EmbedBuilder()
            .setTitle(`${userNickname} has been sorted into ${house}!`)
            .setThumbnail('https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/a6b3cb51-5dcb-491d-9f16-f1a4b711b55c/d9o0iou-bd687bf0-dab0-47a9-8bce-a22cf1a3f46d.png/v1/fill/w_1009,h_792/the_sorting_hat_by_pilimagination_d9o0iou-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9ODA0IiwicGF0aCI6IlwvZlwvYTZiM2NiNTEtNWRjYi00OTFkLTlmMTYtZjFhNGI3MTFiNTVjXC9kOW8waW91LWJkNjg3YmYwLWRhYjAtNDdhOS04YmNlLWEyMmNmMWEzZjQ2ZC5wbmciLCJ3aWR0aCI6Ijw9MTAyNCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.Siguqa-NZlsE0oIXZ8vcfqfG4LGUvXZX_u207fhwmkI')
            .setDescription(`${sorting_message}\n\n <@${message.author.id}>`)
            .setColor(houseColor)
            .setTimestamp();

        message.channel.send({ embeds: [embed] });

        const houseRole = message.guild.roles.cache.find(role => role.name === house);
        if (houseRole) {
            if (!message.member.roles.cache.has(houseRole.id)) {
                await message.member.roles.add(houseRole);
                console.log(`${message.author.username} has been assigned the ${house} role.`);
            } else {
                console.log(`${message.author.username} already has the ${house} role.`);
            }
        } else {
            console.error(`House role "${house}" not found in the server.`);
        }

    } catch (error) {
        console.error('Error in sortUser:', error);
        message.channel.send('An error occurred while fetching your sorting data. Please try again later.');
    }
}

// Cooldown mechanism
const cooldown = new Set();

async function handleSortingCooldown(message) {
    const allowedChannelId = process.env.ALLOWED_CHANNEL_ID;

    const [command] = message.content.trim().split(/\s+/);
    const normalizedCommand = command.toLowerCase();

    if (normalizedCommand === '!sortme') {
        if (message.channel.id !== allowedChannelId) {
            return message.channel.send(`<@${message.author.id}>, please make your way to the Great Hall (<#${allowedChannelId}>) to be sorted by the Sorting Hat.`);
        }

        if (cooldown.has(message.author.id)) {
            return message.channel.send(`<@${message.author.id}>, one at a time! The Sorting Hat cannot rush its decisions. Patience is a virtue, after all. Wait for your turn!`);
        }

        try {
            await sortUser(message);

            cooldown.add(message.author.id);

            setTimeout(() => {
                cooldown.delete(message.author.id);
            }, 100);
        } catch (error) {
            console.error('Error handling command:', error);
            message.channel.send('An error occurred while processing your command. Please try again later.');
        }
    }
}

module.exports = { sortUser, handleSortingCooldown };
