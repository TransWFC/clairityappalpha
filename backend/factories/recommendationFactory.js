const { GoodAirQuality, ModerateAirQuality, UnhealthyAirQuality, HazardousAirQuality } = require("./recommendation");

class RecommendationFactory {
  static getRecommendation(aqi) {
    if (aqi <= 50) return new GoodAirQuality(aqi);       // Good
    if (aqi <= 100) return new ModerateAirQuality(aqi);  // Moderate
    if (aqi <= 150) return new UnhealthyAirQuality(aqi); // Unhealthy
    return new HazardousAirQuality(aqi);                 // Hazardous
  }
}

module.exports = RecommendationFactory;
