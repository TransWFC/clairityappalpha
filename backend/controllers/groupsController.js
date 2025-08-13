const groupsFactory = require("../factories/groupsFactory");

const getGroups = (req, res) => {
    const aqi = parseInt(req.query.aqi, 10) || 0;
    const groups = groupsFactory.getGroups(aqi);
    res.json({ AQI: aqi, groups: groups.getGroups() });
};

module.exports = { getGroups };
