
const { createClient } = require('@supabase/supabase-js');
const { EmbedBuilder } = require('discord.js');
const { getHogwartsHouseRole } = require('./utilities.js');

const fetch = require('node-fetch');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, { fetch });

console.log("Connecting to Supabase...");
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key Loaded:", !!supabaseKey);

async function getHouseTask(userRole) {
    if (!userRole) {
        console.error("User role not found.");
        return { embeds: [], content: "You must belong to a Hogwarts house to view lessons." };
    }

    const houseColors = {
        Gryffindor: '#740001',
        Slytherin: '#1a472a',
        Ravenclaw: '#222f5b',
        Hufflepuff: '#f0c75e'
    };

    try {
        // Fetch active lessons where status = 1 (active)
        const { data: activeTasks, error: activeError } = await supabase
            .from('Lessons')
            .select('*')
            .eq(`${userRole[0].toLowerCase()}Status`, 1)  // Filter for active tasks (status = 1)
            .limit(1);  // Limit to only the first active task

        if (activeError) {
            console.error("Error fetching active tasks:", activeError);
            return { embeds: [], content: "An error occurred while checking task limits." };
        }

        if (activeTasks && activeTasks.length > 0) {
            const activeTask = activeTasks[0];

            // Fetch the image URL for the task dynamically from Supabase (if available in the 'Image' field)
            const taskImage = activeTask.Image || 'https://example.com/default-task-image.png'; // Fallback image if none exists

            // Create the embed with the associated color based on the house
            const embed = new EmbedBuilder()
                .setColor(houseColors[userRole]) // Use the color based on the house
                .setTitle(`${userRole} House - Current Lesson`)
                .setDescription(`The current lesson for ${userRole} House is as follows`)
                .setThumbnail(taskImage) // Set the lesson image dynamically from Supabase
                .addFields(
                    { name: 'Class', value: activeTask.Class || 'N/A', inline: true },
                    { name: 'Teacher', value: activeTask.Teacher || 'N/A', inline: true },
                    { name: 'Subject', value: activeTask.Subject || 'N/A', inline: true },
                    { name: 'Task', value: activeTask.Task || 'N/A', inline: false }
                )
                .setTimestamp();

            return { embeds: [embed] };
        }

        // If no active task found, check for available tasks
        const houseKey = `${userRole[0].toLowerCase()}Status`;
        const { data: allTasks, error: allError } = await supabase
            .from('Lessons')
            .select('*')
            .or(`${houseKey}.eq.0,${houseKey}.is.null`);

        if (allError) {
            console.error("Error fetching available tasks:", allError);
            return { embeds: [], content: "An error occurred while fetching tasks." };
        }

        if (allTasks && allTasks.length > 0) {
            const randomTask = allTasks[Math.floor(Math.random() * allTasks.length)];

            // Fetch the image URL for the task dynamically from Supabase
            const taskImage = randomTask.Image || 'https://example.com/default-task-image.png'; // Fallback image if none exists

            // Assign the task to the house (status = 1)
            const { error: updateError } = await supabase
                .from('Lessons')
                .update({ [`${userRole[0].toLowerCase()}Status`]: 1 })  // Mark as active (status = 1)
                .eq('Key', randomTask.Key);

            if (updateError) {
                console.error("Error updating task status:", updateError);
                return { embeds: [], content: "Failed to assign new task." };
            }

            // Log task assignment and return task details
            const embed = new EmbedBuilder()
                .setColor(houseColors[userRole])
                .setTitle(`${userRole} House - New Lesson`)
                .setDescription(`A new lesson is available for ${userRole} House: ${randomTask.Subject}`)
                .setThumbnail(taskImage) // Set the lesson image dynamically from Supabase
                .addFields(
                    { name: 'Class', value: randomTask.Class || 'N/A', inline: true },
                    { name: 'Teacher', value: randomTask.Teacher || 'N/A', inline: true },
                    { name: 'Subject', value: randomTask.Subject || 'N/A', inline: true },
                    { name: 'Task', value: randomTask.Task || 'N/A', inline: false }
                )
                .setTimestamp();

            return { embeds: [embed] };
        }

        return { embeds: [], content: "No tasks are available." };

    } catch (error) {
        console.error("Error in getHouseTask:", error);
        return { embeds: [], content: "An error occurred while fetching tasks." };
    }
}







async function completeLesson(roles) {
    try {
        const userRole = getHogwartsHouseRole(roles);
        if (!userRole) {
            console.error("User role not found.");
            return "You must belong to a Hogwarts house to complete a lesson.";
        }

        const houseKey = `${userRole[0].toLowerCase()}Status`;

        // Fetch the active lesson
        const { data: activeLesson, error: activeError } = await supabase
            .from('Lessons')
            .select('*')
            .eq(houseKey, 1)  // Look for active tasks where status = 1
            .single();

        if (activeError || !activeLesson) {
            console.error('No active lesson found:', activeError);
            return 'No active lesson available to complete. Please check if a task has been assigned.';
        }

        // Check if the lesson is already completed (status = 2)
        if (activeLesson[houseKey] === 2) {
            return 'This lesson has already been completed.';
        }

        console.log("Active lesson to complete:", activeLesson);

        // Mark the lesson as completed (status = 2)
        const { error: updateError } = await supabase
            .from('Lessons')
            .update({ [houseKey]: 2 })  // Update the status to completed (2)
            .eq('Key', activeLesson.Key);

        if (updateError) {
            console.error('Error completing lesson:', updateError);
            return 'Failed to complete the lesson.';
        }

        // Update house points (if applicable)
        const { data: pointsData, error: pointsError } = await supabase
            .from('HousePoints')
            .select('Housepoints')
            .eq('House', userRole)
            .single();

        if (pointsError || !pointsData) {
            console.error('Error fetching house points:', pointsError);
            return 'Failed to fetch house points.';
        }

        const newPoints = pointsData.Housepoints + 10;

        const { error: updatePointsError } = await supabase
            .from('HousePoints')
            .update({ Housepoints: newPoints })
            .eq('House', userRole);

        if (updatePointsError) {
            console.error('Error updating house points:', updatePointsError);
            return 'Failed to update house points.';
        }

        console.log(`Lesson completed for ${userRole}:`, activeLesson);
        return 'Lesson marked as complete and points added!';

    } catch (error) {
        console.error('Error in completeLesson:', error);
        return 'An error occurred while completing the lesson.';
    }
}




async function getHouseProgress(userRole) {
    try {
        if (!userRole) {
            return { error: "You must belong to a Hogwarts house to check progress." };
        }

        // Determine the correct column for the house status field
        const houseKey = `${userRole[0].toLowerCase()}Status`; // This will be `gStatus`, `rStatus`, etc.

        // Fetch the total number of lessons and the number of completed lessons for the house
        const { data: lessons, error } = await supabase
            .from('Lessons')
            .select('*');

        if (error) {
            console.error("Error fetching lessons:", error);
            return { error: "An error occurred while fetching lesson progress." };
        }

        const totalLessons = lessons.length;  // Total lessons available
        const completedLessons = lessons.filter(lesson => lesson[houseKey] === 2).length;  // Lessons with status = 1 (completed)
        
        // Calculate percentage
        const percentageCompleted = totalLessons > 0 ? ((completedLessons / totalLessons) * 100).toFixed(1) : '0.0';

        return { completedLessons, totalLessons, percentageCompleted };
        
    } catch (error) {
        console.error("Error in getHouseProgress:", error);
        return { error: "An error occurred while fetching progress." };
    }
}




module.exports = { getHouseTask, completeLesson, getHouseProgress };
