/**
 * priority.js — Pure ES module, no React, no browser APIs.
 * Shared by frontend and backend.
 *
 * UNIFIED PRIORITY ENGINE  (see docs/ARCHITECTURE.md §7.1)
 * ─────────────────────────────────────────────────────────────────────────
 * NOTE: These urgency rules are PROPOSALS to be confirmed by the team lead.
 * Config is kept here so weights are easy to adjust.
 */

// ── Config ────────────────────────────────────────────────────────────────
const CONFIG = {
  // Dark Zone entries get this flat boost on top of their score (0-100).
  // Ensures Silent Risk entries sort before Reported entries by default.
  // Proposed assumption — see ARCHITECTURE.md §13.
  darkZoneBoost: 20,

  // Additional boost when a field team has confirmed the Dark Zone.
  confirmedBoost: 15,

  // Weights for reported-area urgency: 0.5 hazard + 0.3 vulnNorm + 0.2 density
  reportedAreaWeights: {
    hazardSeverity: 0.50,
    vulnNorm:       0.30,
    reportDensity:  0.20,
  },
};

/**
 * Build a unified priority list from areas (with assessments) and camps.
 *
 * @param {object[]} areas   — each area should have .assessment from darkZone.assessArea()
 *                             and .verification: "none"|"team_sent"|"confirmed"|"rejected"|"verified_safe"
 * @param {object[]} camps   — each camp should have .shortages[] computed externally
 *                             (or this function will compute basic shortages from stock/need)
 * @returns {object[]}  sorted array of priority entries, rank 1 = highest urgency
 */
export function buildPriorityList(areas, camps) {
  const entries = [];

  // ── Silent Risk entries (Dark Zones) ──────────────────────────────────
  for (const area of areas) {
    const a = area.assessment;
    if (!a) continue;

    // Rejected or verified_safe areas drop out of Silent Risk
    if (area.verification === 'rejected' || area.verification === 'verified_safe') continue;

    if (a.isDarkZone) {
      let urgency = a.score + CONFIG.darkZoneBoost;
      if (area.verification === 'confirmed') urgency += CONFIG.confirmedBoost;
      urgency = Math.min(100, urgency);

      entries.push({
        id:      area.id,
        kind:    'area',
        tag:     'Silent Risk',
        urgency: Math.round(urgency),
        reasons: ['Potential Dark Zone', ...a.reasons],
        label:   'Suggested',
      });
    }
  }

  // ── Reported camp shortages ───────────────────────────────────────────
  for (const camp of camps) {
    const shortages = camp.shortages ?? computeShortages(camp);
    if (!shortages.length) continue;

    // worst shortage ratio among all items
    const worstRatio = Math.max(...shortages.map(s => s.ratio));

    entries.push({
      id:      camp.id,
      kind:    'camp',
      tag:     'Reported',
      urgency: Math.round(100 * worstRatio),
      reasons: shortages.map(s => `${capitalize(s.item)} shortage ${Math.round(s.ratio * 100)}% of need`),
      label:   'Suggested',
    });
  }

  // ── Reported areas (not Dark Zones) ──────────────────────────────────
  for (const area of areas) {
    const a = area.assessment;
    if (a?.isDarkZone) continue; // already in Silent Risk list above

    if ((area.actualReports ?? 0) > 0) {
      const vulnNorm       = Math.min(1, (area.vulnerableShare ?? 0) / 0.5);
      // Report density: a simple ratio capped at 1
      const reportDensity  = Math.min(1, (area.actualReports ?? 0) / 10);
      const hazardSeverity = area.hazardSeverity ?? 0;

      const urgency = Math.round(
        100 * (
          CONFIG.reportedAreaWeights.hazardSeverity * hazardSeverity +
          CONFIG.reportedAreaWeights.vulnNorm       * vulnNorm       +
          CONFIG.reportedAreaWeights.reportDensity  * reportDensity
        )
      );

      entries.push({
        id:      area.id,
        kind:    'area',
        tag:     'Reported',
        urgency,
        reasons: [`${area.actualReports} report(s) received`, `Hazard severity ${hazardSeverity}`],
        label:   'Suggested',
      });
    }
  }

  // ── Sort descending and add rank ──────────────────────────────────────
  entries.sort((a, b) => b.urgency - a.urgency);
  return entries.map((e, i) => ({ rank: i + 1, ...e }));
}

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Compute shortages for a camp from its stock, need, and minReserve.
 * Only returns items where shortage > 0 (stock < need).
 */
function computeShortages(camp) {
  const items = ['food', 'water', 'medicine', 'relief'];
  const shortages = [];
  for (const item of items) {
    const stock    = (camp.stock    ?? {})[item] ?? 0;
    const need     = (camp.need     ?? {})[item] ?? 0;
    const minRes   = (camp.minReserve ?? {})[item] ?? 0;
    const shortage = need - stock;
    if (shortage > 0 && need > 0) {
      const ratio    = shortage / need;
      const severity = ratio >= 0.7 ? 'critical' : ratio >= 0.4 ? 'high' : 'moderate';
      shortages.push({ item, shortage, ratio, severity, minReserve: minRes });
    }
  }
  return shortages;
}

function capitalize(str) {
  return str ? str[0].toUpperCase() + str.slice(1) : str;
}

// Named re-export of config so callers and tests can inspect defaults.
export { CONFIG as priorityConfig };
