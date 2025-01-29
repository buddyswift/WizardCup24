const { EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Map house names to their respective colors
const houseColors = {
    Gryffindor: '#740001',
    Slytherin: '#1a472a',
    Ravenclaw: '#222f5b',
    Hufflepuff: '#f0c75e'
};

// Function to check if the user has the "Event Admin" role
function isEventAdmin(message) {
    return message.member.roles.cache.some(role => role.name === 'GB Staff');
}

// Generic function to update house points
async function updateHousePoints(message, points, house, action) {
    try {
        if (!isEventAdmin(message)) {
            return message.channel.send("You don't have permission to modify points.");
        }

        // Fetch current points for the house
        const { data: currentPoints, error } = await supabase
            .from('HousePoints')
            .select('Housepoints')
            .eq('House', house)
            .single();

        if (error || !currentPoints) {
            console.error("Error fetching house points:", error);
            return message.channel.send(`Failed to fetch points for ${house}.`);
        }

        // Update the points
        const newPoints = currentPoints.Housepoints + points;

        // Update the database
        const { error: updateError } = await supabase
            .from('HousePoints')
            .update({ Housepoints: newPoints })
            .eq('House', house);

        if (updateError) {
            console.error("Error updating house points:", updateError);
            return message.channel.send('Failed to update house points.');
        }

        // Construct the message content
        const pointAction = points < 0
            ? `${Math.abs(points)} points will be deducted from ${house}, no questions!`
            : `${Math.abs(points)} points ${action} ${house}!`;

        message.channel.send(pointAction);

        // Create an embed for the updated points with the house's color
        const embed = new EmbedBuilder()
            .setColor(houseColors[house] || '#FFD700') // Default gold if house color is not found
            .setTitle(`${house} House Points Updated`)
            .setDescription(`The ${house} House has been given ${points} points.`)
            .setTimestamp();

        message.channel.send({ embeds: [embed] });

    } catch (error) {
        console.error('Error in updating house points:', error);
        message.channel.send('An error occurred while updating the house points.');
    }
}

// Function to add points
async function addPoints(message, points, house) {
    return updateHousePoints(message, points, house, 'to');
}

// Function to remove points
async function removePoints(message, points, house) {
    return updateHousePoints(message, -points, house, 'will be deducted from');
}

module.exports = { addPoints, removePoints };
