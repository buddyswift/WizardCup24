const handleQuery = require('./handleQuery.js');
const userHasHouseRole = require('./utilities.js').userHasHouseRole;

module.exports = {
    handleQuery,
    userHasHouseRole // Exporting for potential external use
};