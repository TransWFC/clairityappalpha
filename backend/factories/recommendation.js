class Recommendation {
    constructor(aqi) {
      this.aqi = aqi;
    }
  
    getRecommendations() {
      return ["No specific recommendations available."];
    }
  }
  
  class GoodAirQuality extends Recommendation {
    getRecommendations() {
      return [
        "Enjoy outdoor activities.",
        "Keep indoor spaces ventilated.",
        "Exercise outside to take advantage of fresh air.",
        "Open windows to allow air circulation.",
        "Engage in recreational activities like jogging, cycling, or picnicking."
      ];
    }
  }
  
  class ModerateAirQuality extends Recommendation {
    getRecommendations() {
      return [
        "Sensitive groups should limit outdoor activities.",
        "Keep windows closed if needed.",
        "Consider using an air purifier indoors.",
        "Engage in light outdoor activities but avoid prolonged exposure.",
        "Stay hydrated and monitor any respiratory symptoms."
      ];
    }
  }
  
  class UnhealthyAirQuality extends Recommendation {
    getRecommendations() {
      return [
        "Avoid outdoor activities.",
        "Use a mask outdoors.",
        "Use air purifiers indoors.",
        "Keep windows and doors closed.",
        "Limit strenuous activities, even indoors.",
        "Monitor children, the elderly, and those with respiratory conditions."
      ];
    }
  }
  
  class HazardousAirQuality extends Recommendation {
    getRecommendations() {
      return [
        "Stay indoors as much as possible.",
        "Use high-quality air filters and masks.",
        "Avoid unnecessary outdoor exposure.",
        "Seek medical attention if you experience breathing difficulties.",
        "Keep emergency medications available if you have asthma or other respiratory conditions.",
        "Limit physical exertion, even indoors."
      ];
    }
  }
  
  module.exports = { Recommendation, GoodAirQuality, ModerateAirQuality, UnhealthyAirQuality, HazardousAirQuality };
  