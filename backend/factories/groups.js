class groups {
    constructor(aqi) {
        this.aqi = aqi;
    }
    getGroups() {
        return ["No specific vulnerable groups available."];
    }
}

class GoodAirQualityGroups extends groups {
    getGroups() {
        return [
            "no vulnerable groups for good AQI."
        ];
    }
}

class ModerateAirQualityGroups extends groups {
    getGroups() {
        return [
            "no vulnerable groups for moderate AQI."
        ];
    }
}

class UnhealthyAirQualityGroups extends groups {
    getGroups() {
        return [
            "children, the elderly, and those with respiratory conditions for unhealthy AQI."
        ];
    }
}

class HazardousAirQualityGroups extends groups {
    getGroups() {
        return [
            "children, the elderly, and those with respiratory conditions for hazardous AQI."
        ];
    }
}

module.exports = { GoodAirQualityGroups, ModerateAirQualityGroups, UnhealthyAirQualityGroups, HazardousAirQualityGroups };


