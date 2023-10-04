const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const BOT_TOKEN = process.env.BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { persistSession: false });

let LastPostedKey2 = 0; // Initialize with default value

client.once('ready', async () => {
    LastPostedKey2 = await getLastPostedKey2();  // Get the Last posted key from the database
    console.log(`Last posted key retrieved: ${LastPostedKey2}`);

    console.log('Bot is ready!');
    await fetchAndPost();
    client.destroy(); // End the client session after the task is done
});

client.login(BOT_TOKEN);

async function getLastPostedKey2() {
    let { data, error } = await supabase.from('StateTable2').select('LastPostedKey2').limit(1);
    if (error) {
        console.error("Error fetching LastPostedKey2:", error.message);
        throw error;
    }
    return data[0]?.LastPostedKey2 || 0;
}

async function setLastPostedKey2(key) {
    // Fetch the first row to determine if a row exists
    const { data, error: fetchError } = await supabase.from('StateTable2').select('LastPostedKey2').limit(1);
    
    if (fetchError) {
        console.error("Error fetching from StateTable2:", fetchError.message);
        throw fetchError;
    }

    if (data && data.length > 0) {
        // If a row exists, update it
        const { error: updateError } = await supabase.from('StateTable2')
            .update({ LastPostedKey2: key })
            .eq('LastPostedKey2', data[0].LastPostedKey2);
        
        if (updateError) {
            console.error("Error updating LastPostedKey2:", updateError.message);
            throw updateError;
        }
    } else {
        // If no row exists, insert one
        const { error: insertError } = await supabase.from('StateTable2')
            .insert([{ LastPostedKey2: key }]);
        
        if (insertError) {
            console.error("Error inserting LastPostedKey2:", insertError.message);
            throw insertError;
        }
    }
}

async function fetchAndPost() {
    try {
        let { data: tasks, error } = await supabase
            .from('Snitch')
            .select('*')
            .order('Key', { ascending: true })  // <-- Add this line to sort results by the Key
            .limit(1)
            .gt('Key', LastPostedKey2);


        if (error) {
            console.error('Error fetching data:', error.message);
            return;
        }

        if (tasks.length === 0) {
            console.log('No new tasks retrieved from Supabase.');
            return;
        }

        const channel = client.channels.cache.find(ch => ch.name === 'bot-test');
        if (!channel) {
            console.log('Channel not found.');
            return;
        }

        for (const task of tasks) {
            console.log(`Processing task with Key: ${task.Key}`);
            LastPostedKey2 = task.Key;

            const embed = new EmbedBuilder();
            embed.setTitle(`**${task['Title']}**`);
            embed.addFields(
                { name: `**📌 Activity Type**`, value: "*Golden Snitch - 24 Hours to Obtain!*"},
                { name: `**📝 Description**`, value: `*${task['Short Description']}*` }                
            );

            if (task['More Information']) {
                embed.addFields({ name: '**Additional Information**', value: `*${task['More Information']}*` });
            }

            if (task['Image']) {
                embed.setThumbnail(task['Image']);
            }

            channel.send({ embeds: [embed] });

            console.log(`Task with Key: ${task.Key} posted. Last posted key is now: ${LastPostedKey2}`);
        }

        if (tasks && tasks.length > 0) {
            const newLastPostedKey2 = tasks[tasks.length - 1].Key;
            await setLastPostedKey2(newLastPostedKey2);
        }

    } catch (error) {
        console.error('An error occurred:', error);
    }
}
