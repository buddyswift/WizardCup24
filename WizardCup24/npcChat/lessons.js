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
        // First, check if there is an active lesson
        const { data: activeLesson, error: activeError } = await supabase
            .from('Lessons')
            .select('*')
            .eq(`${userRole[0].toLowerCase()}Status`, 1)
            .single();  // Assuming each house should only have one active lesson at a time

        if (activeError) {
            console.error('Error checking active lesson:', activeError.message);
            return 'No active lesson available to complete.';
        }

        if (!activeLesson) {
            return 'No active lesson available to complete.';
        }
        // Proceed to mark the lesson as complete by setting the status to 2
        const { error } = await supabase
            .from('Lessons')
            .update({ [`${userRole[0].toLowerCase()}Status`]: 2 }) // This dynamically targets the status field based on the userRole
            .eq ( [`${userRole[0].toLowerCase()}Status`] ,1 );  // Only update rows where the current status is 1
        if (error) {
            console.error('Error completing lesson:', error.message);
            return 'Failed to complete the lesson.';
        }
        // Fetch current house points
        const { data: pointsData, error: pointsError } = await supabase
            .from('HousePoints')
            .select('Housepoints')
            .eq('House', userRole);

        if (pointsError) {
            console.error('Error fetching house points:', pointsError.message);
            return 'Failed to fetch house points.';
        }

        if (pointsData.length > 0) {
            const currentPoints = pointsData[0].Housepoints;
            const newPoints = currentPoints + 50;
        
            // Update the house points
            const { error: updateError } = await supabase
                .from('HousePoints')
                .update({ Housepoints: newPoints })
                .eq('House', userRole);
        
            if (updateError) {
                console.error('Error updating house points:', updateError.message);
                return 'Failed to update house points.';
            }
        } else {
            console.error('No points data found for the house.');
            // Optionally, initialize points for the house if none exist
            const { error: initError } = await supabase
                .from('HousePoints')
                .insert({ House: userRole, Housepoints: 50 });
        
            if (initError) {
                console.error('Error initializing house points:', initError.message);
                return 'Failed to initialize house points.';
            }
            return 'House points initialized with the first 50 points.';
        }
        

        return 'Lesson marked as complete and points added!';
    } catch (error) {
        console.error('Error in completeLesson:', error);
        return 'An error occurred while completing the lesson.';
    }
}

async function getHousePoints(userRole) {
    try {
        const { data, error } = await supabase
            .from('HousePoints')
            .select('Housepoints')
            .eq('House', userRole)
            .single();

        if (error) {
            console.error('Error fetching house points:', error.message);
            return `Failed to fetch points for ${userRole}.`;
        }

        if (data) {
            return { house: userRole, points: data.Housepoints };
        } else {
            return { error: `No points data found for ${userRole}.` };
        }
    } catch (error) {
        console.error('Error in getHousePoints:', error);
        return { error: 'An error occurred while fetching house points.' };
    }
}

module.exports = { getHouseTask, completeLesson ,getHousePoints };
