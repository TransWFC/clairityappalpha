const recommendationFactory = require("../factories/recommendationFactory");

const getRecommendations = (req, res) => {
    try {
      const aqi = parseInt(req.query.aqi, 10) || 0;
      const recommendation = recommendationFactory.getRecommendation(aqi);
  
      if (!recommendation) {
        return res.status(400).json({ error: "Invalid AQI value" });
      }
  
      res.json({ AQI: aqi, recommendations: recommendation.getRecommendations() });
    } catch (error) {
      console.error("Error in getRecommendations:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  

module.exports = { getRecommendations };
