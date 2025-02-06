
const { EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');

// Retrieve environment variables       
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Create a Supabase client instance
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { persistSession: false });
//added line to redeploy
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Function to fetch tasks from Supabase based on scheduled date and time
async function fetchTasks() {
    try {
        console.log('Fetching tasks...');
        const { data: tasks, error } = await supabase
            .from('Tasks') // Replace with your actual table name
            .select('*')
            .gte('Date', new Date().toLocaleDateString('en-US')) // Ensure we only fetch future tasks
            .order('Date', { ascending: true }); // Order by date

        if (error) {
            console.error('Error fetching tasks:', error.message);
            return [];
        }

        console.log('Fetched tasks:', tasks); // Log tasks to see what is returned
        return tasks;
    } catch (error) {
        console.error('Error in fetchTasks:', error);
        return [];
    }
}

// Function to create and send an embed for each task
async function postTaskToDiscord(client, task) {
    console.log('Task being processed:', task);

    const embed = new EmbedBuilder()
        .setTitle(`**${task.Title || 'No Title'}**`)
        .addFields(
            { name: '**🎯 Task**', value: `*${task['Short Description'] || 'No description available.'}*` },
            { name: '**💰 Reward**', value: '1st: 50 pts\n2nd: 40 pts\n3rd: 30 pts\n4th: 20 pts' },
            { name: '**📝 Submission Type**', value: task['Submission Type'] || 'No description available.' },
        );

    // Add additional information to the embed if available
    if (task['More Information'] && typeof task['More Information'] === 'string') {
        embed.addFields({ name: '**💡 Additional Information**', value: task['More Information'] });
    }

    // Ensure the thumbnail exists and is a valid string URL
    if (task['Image'] && typeof task['Image'] === 'string') {
        embed.setThumbnail(task['Image']);
    }

    // Get the channel to post the embed (make sure the channel exists)
    const channel = client.channels.cache.get(process.env.TASK_CHANNEL); // Replace with your channel ID
    if (channel) {
        await channel.send({ embeds: [embed] });
    } else {
        console.error('Channel not found.');
    }
}

// Function to schedule tasks
async function scheduleTasks(client) {
    const tasks = await fetchTasks();

    // If no tasks, exit
    if (!tasks.length) {
        console.log('No tasks available');
        return;
    }

    const channel = client.channels.cache.get(process.env.TASK_CHANNEL); // Replace with your channel ID
    if (channel) {
        
        // Post tasks based on their specific schedule
        tasks.forEach(task => {
            // Ensure the task.Date and task.Time are in the correct format
            const taskDate = new Date(`${task.Date}T${task.Time.trim()}Z`); // Trim any whitespace from time

            // Check if the taskDate is valid
            if (isNaN(taskDate)) {
                console.error('Invalid date or time for task:', task);
                return; // Skip invalid tasks
            }

            const minutes = taskDate.getUTCMinutes();
            const hours = taskDate.getUTCHours();
            const dayOfMonth = taskDate.getUTCDate();
            const month = taskDate.getUTCMonth() + 1; // Months are zero-based in JavaScript

            // Debugging: Log the cron expression and task details
            const cronExpression = `${minutes} ${hours} ${dayOfMonth} ${month} *`;
            console.log(`Generated Cron Expression: ${cronExpression} for task: ${task.Title}`);

            // Create a cron schedule for each task based on its date/time
            try {
                cron.schedule(cronExpression, () => {
                    postTaskToDiscord(client, task);
                    console.log(`Task posted: ${task.Title} at ${taskDate}`);
                });
            } catch (error) {
                console.error('Invalid cron expression for task:', task, error);
            }
        });
    } else {
        console.error('Channel not found.');
    }
}


// Export functions so they can be imported in index.js
module.exports = { scheduleTasks, fetchTasks, postTaskToDiscord };
