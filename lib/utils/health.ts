export function getHealthStatus(score: number) {
  if (score >= 90)
    return {
      label: "Excellent",
      color: "green",
    };

  if (score >= 75)
    return {
      label: "Good",
      color: "yellow",
    };

  return {
    label: "Poor",
    color: "red",
  };
}