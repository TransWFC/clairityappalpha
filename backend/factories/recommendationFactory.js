const { GoodAirQuality, ModerateAirQuality, UnhealthyAirQuality, HazardousAirQuality } = require("./recommendation");

class recommendationFactory {
    static getRecommendations(aqi) {
        if (aqi <= 50) return new GoodAirQuality(aqi);
        if (aqi <= 100) return new ModerateAirQuality(aqi);
        if (aqi <= 150) return new UnhealthyAirQuality(aqi);
        return new HazardousAirQuality(aqi);
    }
}

module.exports = recommendationFactory;
