/**
 * darkZone.js — Pure ES module, no React, no browser APIs.
 * Shared by frontend and backend (teammates may import this file directly).
 *
 * DARK ZONE ENGINE  (see docs/ARCHITECTURE.md §6)
 * ─────────────────────────────────────────────────────────────────────────
 * Weights & config live here so they are easy to find and change.
 * IMPORTANT: These are our assumptions, NOT validated. UI must always
 * show the footer: "Weights are our assumptions, not validated."
 */

// ── Config ────────────────────────────────────────────────────────────────
const CONFIG = {
  // Fraction of the vulnerable population expected to generate a report
  // under normal connectivity. Source: team assumption.
  baselineRate: 0.16,

  // Weights for the 0-100 composite score. Must sum to 1.00.
  weights: {
    hazardSeverity: 0.30,
    vulnNorm:       0.25,
    networkFailure: 0.20,
    silenceRatio:   0.25,
  },

  // Flag thresholds — ALL three conditions must be true simultaneously.
  flag: {
    minSilenceRatio:    0.60,
    minHazardSeverity:  0.60,
    // Either of the following is enough for the third condition:
    minVulnerableShare: 0.25,
    minNetworkFailure:  0.50,
  },
};

/**
 * Assess a single area for Dark Zone status.
 *
 * @param {object} area
 *   area.population        {number}  total population
 *   area.vulnerableShare   {number}  0-1 fraction of vulnerable people
 *   area.hazardSeverity    {number}  0-1
 *   area.networkFailure    {number}  0-1
 *   area.actualReports     {number}  count of received reports
 *   area.dataQuality       {string}  "ok" | "partial" | "missing"
 *
 * @returns {{ score: number, isDarkZone: boolean, confidence: string, reasons: string[] }}
 */
export function assessArea(area) {
  const reasons = [];

  // ── Guard: missing / invalid inputs ────────────────────────────────────
  const required = ['population', 'vulnerableShare', 'hazardSeverity', 'networkFailure', 'actualReports'];
  for (const field of required) {
    if (area[field] == null || typeof area[field] !== 'number') {
      return {
        score:       0,
        isDarkZone:  false,
        confidence:  'low',
        reasons:     [`Missing input: ${field}`],
      };
    }
  }

  const { population, vulnerableShare, hazardSeverity, networkFailure, actualReports, dataQuality } = area;

  // ── Derived quantities ──────────────────────────────────────────────────
  // expectedReports = population × vulnerableShare × hazardSeverity × baselineRate
  const expectedReports = population * vulnerableShare * hazardSeverity * CONFIG.baselineRate;

  if (expectedReports === 0) {
    return {
      score:      0,
      isDarkZone: false,
      confidence: 'low',
      reasons:    ['expectedReports is 0 — population, vulnerableShare or hazardSeverity may be 0'],
    };
  }

  // silenceRatio: 0 = area is loud, 1 = complete silence
  const silenceRatio = Math.max(0, 1 - actualReports / expectedReports);

  // vulnNorm: normalised at 0.5 share (our calibration point)
  const vulnNorm = Math.min(1, vulnerableShare / 0.5);

  // ── Composite score (0-100) ─────────────────────────────────────────────
  const score = Math.round(
    100 * (
      CONFIG.weights.hazardSeverity * hazardSeverity +
      CONFIG.weights.vulnNorm       * vulnNorm       +
      CONFIG.weights.networkFailure * networkFailure  +
      CONFIG.weights.silenceRatio   * silenceRatio
    )
  );

  // ── Flag conditions (ALL must pass) ────────────────────────────────────
  const silenceOk  = silenceRatio   >= CONFIG.flag.minSilenceRatio;
  const hazardOk   = hazardSeverity >= CONFIG.flag.minHazardSeverity;
  const vulnOk     = vulnerableShare >= CONFIG.flag.minVulnerableShare ||
                     networkFailure  >= CONFIG.flag.minNetworkFailure;

  const isDarkZone = silenceOk && hazardOk && vulnOk;

  // ── Human-readable reasons ─────────────────────────────────────────────
  reasons.push(`Flood severity ${hazardSeverity >= 0.7 ? 'high' : 'moderate'} (${hazardSeverity})`);
  if (networkFailure >= 0.5) reasons.push('Network down');
  reasons.push(
    `${actualReports} report${actualReports !== 1 ? 's' : ''} vs about ${Math.round(expectedReports)} expected`
  );
  if (vulnerableShare >= CONFIG.flag.minVulnerableShare) {
    reasons.push(`Vulnerable share ${Math.round(vulnerableShare * 100)}%`);
  }

  // ── Confidence ─────────────────────────────────────────────────────────
  let confidence = 'high';
  if (dataQuality === 'partial') {
    confidence = 'medium';
    reasons.push('Low confidence: field check recommended (partial data)');
  } else if (dataQuality === 'missing') {
    confidence = 'low';
    reasons.push('Low confidence: field check recommended (missing data)');
  }

  return { score, isDarkZone, confidence, reasons };
}

/**
 * Batch-assess an array of areas. Returns the same array with an
 * `assessment` field attached to each area object (non-mutating).
 *
 * @param {object[]} areas
 * @returns {object[]}
 */
export function assessAreas(areas) {
  return areas.map(area => ({
    ...area,
    assessment: assessArea(area),
  }));
}

// Named re-export of config so UI can show it in the Limits screen.
export { CONFIG as darkZoneConfig };
