/**
 * ReliefOS + DARK ZONE: Pure ES Module for Dark Zone Assessment
 * Used identically on Frontend and Backend
 */

export const DARK_ZONE_CONFIG = {
  silenceThreshold: 0.6,
  hazardThreshold: 0.6,
  vulnerableThreshold: 0.25,
  networkFailureThreshold: 0.5,
  weights: {
    silence: 0.35,
    hazard: 0.35,
    vulnerable: 0.10,
    network: 0.20
  },
  expectedReportRate: 0.05, // ~5% of population expected to report under emergency
  disclaimer: "Weights are our assumptions, not validated."
};

/**
 * Evaluates whether an area is a Potential Dark Zone and computes its risk score
 * @param {Object} area 
 * @returns {Object} assessment
 */
export function evaluateDarkZone(area) {
  if (!area) {
    return {
      isDarkZone: false,
      score: 0,
      confidence: 'low',
      reasons: ['No area data provided'],
      passedConditions: { silence: false, hazard: false, vulnerabilityOrNetwork: false },
      label: 'Suggested'
    };
  }

  const {
    population = 0,
    actualReports = 0,
    vulnerableShare,
    hazardSeverity,
    networkFailure,
    dataQuality = 'ok',
    verification = 'none'
  } = area;

  // Check for missing / partial data
  const missingInputs = [];
  if (vulnerableShare === null || vulnerableShare === undefined) missingInputs.push('vulnerable share');
  if (hazardSeverity === null || hazardSeverity === undefined) missingInputs.push('hazard severity');
  if (networkFailure === null || networkFailure === undefined) missingInputs.push('network failure');
  if (!population || population <= 0) missingInputs.push('population');

  const isPartialOrMissing = dataQuality === 'partial' || dataQuality === 'missing' || missingInputs.length > 0;
  const confidence = isPartialOrMissing ? 'low' : 'high';

  // Calculate expected reports (minimum 1 if population > 0)
  const expectedReports = Math.max(1, Math.round((population || 0) * DARK_ZONE_CONFIG.expectedReportRate));
  
  // Calculate silence ratio: (expected - actual) / expected, clamped [0, 1]
  const rawSilence = (expectedReports - (actualReports || 0)) / expectedReports;
  const silenceRatio = Math.max(0, Math.min(1, rawSilence));

  const safeHazard = hazardSeverity !== null && hazardSeverity !== undefined ? Number(hazardSeverity) : 0;
  const safeVuln = vulnerableShare !== null && vulnerableShare !== undefined ? Number(vulnerableShare) : 0;
  const safeNetwork = networkFailure !== null && networkFailure !== undefined ? Number(networkFailure) : 0;

  // Condition checks
  const condSilence = silenceRatio >= DARK_ZONE_CONFIG.silenceThreshold;
  const condHazard = safeHazard >= DARK_ZONE_CONFIG.hazardThreshold;
  const condVulnOrNet = (safeVuln >= DARK_ZONE_CONFIG.vulnerableThreshold) || (safeNetwork >= DARK_ZONE_CONFIG.networkFailureThreshold);

  // If rejected or verified_safe, it is explicitly not a Dark Zone
  const isExcludedByVerification = verification === 'rejected' || verification === 'verified_safe';

  // Area is flagged only if all 3 conditions hold and not verified safe
  const isDarkZone = !isExcludedByVerification && condSilence && condHazard && condVulnOrNet;

  // Calculate weighted score (0 - 100)
  const { weights } = DARK_ZONE_CONFIG;
  const weightedSum = (
    weights.silence * silenceRatio +
    weights.hazard * safeHazard +
    weights.vulnerable * safeVuln +
    weights.network * safeNetwork
  );
  
  let score = Math.round(100 * weightedSum);
  if (isExcludedByVerification) {
    score = Math.min(score, 35);
  }

  // Construct human-readable reasons
  const reasons = [];
  if (missingInputs.length > 0) {
    reasons.push(`Missing data input(s): ${missingInputs.join(', ')}.`);
  }
  if (isPartialOrMissing) {
    reasons.push('Low confidence: field check recommended due to incomplete sensor/telemetry data.');
  }

  if (condSilence) {
    reasons.push(`High silence ratio (${Math.round(silenceRatio * 100)}%): received only ${actualReports} report(s) vs ~${expectedReports} expected.`);
  } else {
    reasons.push(`Normal reporting rate (${actualReports} report(s) received vs ~${expectedReports} expected).`);
  }

  if (condHazard) {
    reasons.push(`Severe hazard threat level (${safeHazard.toFixed(1)}/1.0).`);
  } else {
    reasons.push(`Hazard level is moderate or low (${safeHazard.toFixed(1)}/1.0).`);
  }

  if (safeVuln >= DARK_ZONE_CONFIG.vulnerableThreshold) {
    reasons.push(`High vulnerable demographic share (${Math.round(safeVuln * 100)}% elderly/infant/mobility impaired).`);
  }
  if (safeNetwork >= DARK_ZONE_CONFIG.networkFailureThreshold) {
    reasons.push(`Severe communication infrastructure outage (${Math.round(safeNetwork * 100)}% tower failure).`);
  }

  if (verification === 'team_sent') {
    reasons.push('Field team deployed: awaiting on-ground assessment report.');
  } else if (verification === 'confirmed') {
    reasons.push('Confirmed on ground by field team: priority elevated for immediate relief.');
  } else if (verification === 'verified_safe') {
    reasons.push('Verified safe by field inspection: area de-escalated.');
  } else if (verification === 'rejected') {
    reasons.push('False alarm rejected by rescue coordinator.');
  }

  return {
    isDarkZone,
    score,
    confidence,
    expectedReports,
    actualReports,
    silenceRatio,
    reasons,
    passedConditions: {
      silence: condSilence,
      hazard: condHazard,
      vulnerabilityOrNetwork: condVulnOrNet
    },
    verification,
    label: 'Suggested',
    disclaimer: DARK_ZONE_CONFIG.disclaimer
  };
}
