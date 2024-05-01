function userHasHouseRole(user, rolename, message) {
    const guildMember = message.guild.members.cache.get(user.id);
    if (!guildMember) return false;
    return guildMember.roles.cache.some(role => role.name === rolename);
}

async function main(userMessage, message, rolename) {
    // Implementation for main function handling NPC chat logic
}

module.exports = {
    userHasHouseRole,
    main
};
