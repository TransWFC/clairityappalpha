const RecommendationFactory = require("../factories/recommendationFactory");

const getRecommendations = (req, res) => {
    const aqi = parseInt(req.query.aqi, 10) || 0;
    const recommendation = RecommendationFactory.getRecommendation(aqi);
    res.json({ AQI: aqi, recommendations: recommendation.getRecommendations() });
};

module.exports = { getRecommendations };
