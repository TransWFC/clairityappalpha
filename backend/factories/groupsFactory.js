const { GoodAirQualityGroups, ModerateAirQualityGroups, UnhealthyAirQualityGroups, HazardousAirQualityGroups } = require("./groups");

class groupsFactory {
    static getGroups(aqi) {
        if (aqi <= 50) return new GoodAirQualityGroups(aqi);
        if (aqi <= 100) return new ModerateAirQualityGroups(aqi);
        if (aqi <= 150) return new UnhealthyAirQualityGroups(aqi);
        return new HazardousAirQualityGroups(aqi);
    }
}

module.exports = groupsFactory;