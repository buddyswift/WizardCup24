const { EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');

// Supabase setup
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

async function fetchSnitchTask() {
    try {
        // Fetch tasks with Status = 0
        const { data: tasks, error } = await supabase
            .from('Snitch')
            .select('*')
            .eq('Status', 0);

        if (error) {
            console.error('Error fetching Snitch task:', error.message);
            return null;
        }

        if (tasks && tasks.length > 0) {
            // Randomize tasks by picking a random task
            const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
            console.log('Fetched Snitch task:', randomTask);
            return randomTask;
        } else {
            console.log('No Snitch task found.');
            return null;
        }
    } catch (error) {
        console.error('Error in fetchSnitchTask:', error);
        return null;
    }
}

// Function to update Snitch task status to 1
async function updateSnitchStatus(taskId) {
    try {
        const { error } = await supabase
            .from('Snitch')
            .update({ Status: 1 })  // Set Status to 1 after posting
            .eq('id', taskId);

        if (error) {
            console.error('Error updating Snitch task status:', error.message);
        } else {
            console.log('Snitch task status updated to 1.');
        }
    } catch (error) {
        console.error('Error in updateSnitchStatus:', error);
    }
}

// Function to post Snitch task
async function postSnitchToDiscord(client) {
    // Check if current date is before 31st January 2025
    const currentDate = new Date();
    const restrictionDate = new Date('2025-01-31T00:00:00Z'); // 31st January 2025, 00:00:00 UTC

    if (currentDate < restrictionDate) {
        console.log('Snitch task posting is restricted until 29th January 2025.');
        return; // Skip posting the Snitch task
    }

    const task = await fetchSnitchTask();
    if (!task) {
        console.log('No task to post.');
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(task['Title'])
        .setThumbnail(task['Image'])
        .addFields({ name: 'Task:', value: `${task['Task Name']}`, inline: false })
        .addFields({ name: 'Additional Information:', value: `${task['Additional Information']}`, inline: true })
        .addFields({ name: 'Password', value: `${task['Password']}`, inline: true }); 

    // Get the channel where the Snitch task should be posted
    const channel = client.channels.cache.get(process.env.SNITCH_CHANNEL_ID); 

    if (channel) {
        await channel.send({ embeds: [embed] });
        console.log('Snitch task posted:', task['Task Name']);

        // Update Snitch task status to 1 after posting
        await updateSnitchStatus(task.id);
    } else {
        console.error('Channel not found.');
    }
}

// Schedule the Snitch task to post at 10 PM daily
function scheduleSnitchTask(client) {
    // Ensure it's only scheduled once, not multiple times
    console.log('Scheduling Snitch task for 10 PM daily...');
    cron.schedule('4 22 * * *', () => {
        console.log('Snitch task cron job triggered at 10 PM.');
        postSnitchToDiscord(client);  // Pass the client to postSnitchToDiscord
    });
}

module.exports = { scheduleSnitchTask };
