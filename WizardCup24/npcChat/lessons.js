require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { EmbedBuilder } = require('discord.js');
const { getHogwartsHouseRole } = require('./utilities.js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getHouseTask(userRole) {
    try {
        // First, attempt to fetch active tasks
        const { data: liveTasks, error: liveError } = await supabase
            .from('Lessons')
            .select('*')
            .eq(`${userRole[0].toLowerCase()}Status`, 1);

        if (liveError) {
            console.error('Error fetching live house tasks:', liveError.message);
            return "An error occurred while fetching live house tasks.";
        }

        // If there are active tasks, return the first one
        if (liveTasks && liveTasks.length > 0) {
            return createEmbed(liveTasks[0], `${userRole} House`);
        }

        // No active tasks, find available tasks
        const { data: allTasks, error: allError } = await supabase
            .from('Lessons')
            .select('*')
            .or(`${userRole[0].toLowerCase()}Status.eq.0,${userRole[0].toLowerCase()}Status.is.null`);

        if (allError) {
            console.error('Error fetching all tasks:', allError.message);
            return "An error occurred while fetching all tasks.";
        }

        if (allTasks && allTasks.length > 0) {
            // Select a random task
            const randomIndex = Math.floor(Math.random() * allTasks.length);
            const randomTask = allTasks[randomIndex];

            // Update the status of the selected random task to 1
            const { error: updateError } = await supabase
                .from('Lessons')
                .update({ [`${userRole[0].toLowerCase()}Status`]: 1 })
                .eq('Key', randomTask.Key);

            if (updateError) {
                console.error('Error updating task status:', updateError.message);
                return { content: "Failed to update task status." };
            }

            // Return the updated task
            return createEmbed(randomTask, `${userRole} House`);
        } else {
            console.error('No tasks found.');
            return { content: "No tasks available." };
        }
    } catch (error) {
        console.error('Error in getHouseTask:', error);
        return { content: "An error occurred." };
    }
}

function createEmbed(task, houseDescription) {
    const embed = new EmbedBuilder()
        .setTitle('Task Information')
        .setDescription(`Task details for ${houseDescription}`)
        .setThumbnail(task.Image)
        .addFields(
            { name: 'Class', value: task.Class || 'N/A', inline: true },
            { name: 'Teacher', value: task.Teacher || 'N/A', inline: true },
            { name: 'Subject', value: task.Subject || 'N/A', inline: false },
            { name: 'Task', value: task.Task || 'No task available.', inline: false }
        );
    return { embeds: [embed] };
}

async function completeLesson(roles) {
    const userRole = getHogwartsHouseRole(roles);
    try {
        const { error } = await supabase
            .from('Lessons')
            .update({ [`${userRole[0].toLowerCase()}Status`]: 2 }) // This dynamically targets the status field based on the userRole
            .eq ( [`${userRole[0].toLowerCase()}Status`] ,1 );  // Only update rows where the current status is 1
        if (error) {
            console.error('Error completing lesson:', error.message);
            return 'Failed to complete the lesson.';
        }
        return 'Lesson marked as complete!';
    } catch (error) {
        console.error('Error in completeLesson:', error);
        return 'An error occurred while completing the lesson.';
    }
}

module.exports = { getHouseTask, completeLesson };
