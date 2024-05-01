const handleQuery = require('./handleQuery');
const userHasHouseRole = require('./utilities').userHasHouseRole;

module.exports = {
    handleQuery,
    userHasHouseRole // Exporting for potential external use
};