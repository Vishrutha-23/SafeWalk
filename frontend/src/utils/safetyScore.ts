// Safety score calculation utilities

export const calculateSafetyScore = (
  crimeData: any[],
  lightingData: any,
  trafficData: any,
  weatherData: any
): number => {
  // TODO: Implement comprehensive safety scoring algorithm
  // Factors to consider:
  // - Crime statistics (weight: 40%)
  // - Lighting conditions (weight: 20%)
  // - Traffic safety (weight: 20%)
  // - Weather conditions (weight: 10%)
  // - Time of day (weight: 10%)

  // Placeholder calculation
  return Math.floor(Math.random() * 30) + 70; // Returns 70-100
};

export const getSafetyLevel = (score: number): "high" | "medium" | "low" => {
  if (score >= 85) return "high";
  if (score >= 70) return "medium";
  return "low";
};

export const getSafetyRecommendation = (score: number): string => {
  if (score >= 85) return "This route is considered safe";
  if (score >= 70) return "Exercise normal caution on this route";
  return "Consider an alternative route or travel with others";
};
