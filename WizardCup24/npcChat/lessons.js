// lessons.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { EmbedBuilder } = require('discord.js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getHouseTask(userRole) {
    try {
        const { data: liveTasks, error: liveError } = await supabase
            .from('Lessons')
            .select('Class, Teacher, Subject, Task')
            .eq(`${userRole[0].toLowerCase()}Status`, 1);

        if (liveError) {
            console.error('Error fetching live house tasks:', liveError.message);
            return "An error occurred while fetching live house tasks.";
        }

        if (liveTasks && liveTasks.length > 0) {
            const liveTask = liveTasks[0];
            const embed = new EmbedBuilder()
                .setTitle('Current Lesson')
                .setDescription(`Current lesson in attendance for ${userRole} House`) // Empty description
                .addFields(
                    { name: 'Class', value: liveTask.Class.toString() },
                    { name: 'Teacher', value: liveTask.Teacher.toString() },
                    { name: 'Subject', value: liveTask.Subject.toString() },
                    { name: 'Task', value: liveTask.Task.toString() || 'No task available.' }
                );
           
      
            return { embeds: [embed] };
            
            
        } else {
            const { data: allTasks, error: allError } = await supabase
                .from('Lessons')
                .select('Class, Teacher, Subject, Task')
                .or(`${userRole[0].toLowerCase()}Status.eq.0,${userRole[0].toLowerCase()}Status.is.null`);

            if (allError) {
                console.error('Error fetching all tasks:', allError.message);
                return "An error occurred while fetching all tasks.";
            }

            if (allTasks && allTasks.length > 0) {
                const randomIndex = Math.floor(Math.random() * allTasks.length);
                const randomTask = allTasks[randomIndex];
                const embed = new EmbedBuilder()
                    .setTitle('New Task')
                    .setDescription('New lesson to attend') // Empty description
                    .addFields(
                        { name: 'Class', value: randomTask.Class.toString() },
                        { name: 'Teacher', value: randomTask.Teacher.toString() },
                        { name: 'Subject', value: randomTask.Subject.toString() },
                        { name: 'Task', value: randomTask.Task.toString() || 'No task available.' }
                    );
                                
                return { embeds: [embed] };
            } else {
                console.error('No tasks found.');
                return { content: "No tasks available." };
            }
        }
    } catch (error) {
        console.error('Error in getHouseTask:', error);
        return { content: "An error occurred." };
    }
}

module.exports = { getHouseTask };
