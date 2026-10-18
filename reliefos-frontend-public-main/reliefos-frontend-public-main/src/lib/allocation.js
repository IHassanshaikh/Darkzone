/**
 * allocation.js — Pure ES module, no React, no browser APIs.
 * Shared by frontend and backend.
 *
 * ALLOCATION ENGINE  (see docs/ARCHITECTURE.md §7.2)
 * ─────────────────────────────────────────────────────────────────────────
 * For each camp + item with a shortage, find the nearest camp (haversine)
 * that has a surplus above its minReserve. Output is labeled "Suggested".
 * A human must click "Approve" to create a Duty.
 *
 * Seed demo: Camp D → Camp B water transfer (Camp B critical water shortage,
 * Camp D has surplus water; haversine ≈ 6.4 km).
 */

// ── Helpers ───────────────────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine distance between two lat/lng points, in kilometres.
 * @param {{ lat: number, lng: number }} a
 * @param {{ lat: number, lng: number }} b
 * @returns {number}
 */
export function haversineKm(a, b) {
  const toRad = d => (d * Math.PI) / 180;
  const dLat  = toRad(b.lat - a.lat);
  const dLng  = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const c = sinDLat * sinDLat +
            Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(c));
}

/**
 * Compute suggested transfers between camps.
 *
 * @param {object[]} camps  — each with { id, lat, lng, stock, need, minReserve, occupancy }
 * @returns {object[]}  array of suggestion objects, ordered by shortage ratio desc
 */
export function computeSuggestions(camps) {
  const items = ['food', 'water', 'medicine', 'relief'];
  const suggestions = [];
  let idCounter = 1;

  for (const toCamp of camps) {
    for (const item of items) {
      const stock  = (toCamp.stock    ?? {})[item] ?? 0;
      const need   = (toCamp.need     ?? {})[item] ?? 0;
      const minRes = (toCamp.minReserve ?? {})[item] ?? 0;

      const shortage = need - stock;
      if (shortage <= 0 || need === 0) continue; // no shortage

      const ratio = shortage / need;

      // Find nearest donor camp with surplus
      let bestDonor     = null;
      let bestSurplus   = 0;
      let bestDistKm    = Infinity;

      for (const fromCamp of camps) {
        if (fromCamp.id === toCamp.id) continue;

        const fromStock  = (fromCamp.stock     ?? {})[item] ?? 0;
        const fromMinRes = (fromCamp.minReserve ?? {})[item] ?? 0;
        const surplus    = fromStock - fromMinRes;
        if (surplus <= 0) continue; // donor has nothing to spare

        const distKm = haversineKm(
          { lat: fromCamp.lat, lng: fromCamp.lng },
          { lat: toCamp.lat,  lng: toCamp.lng  }
        );

        // Prefer closer donor; break ties by larger surplus
        if (distKm < bestDistKm || (distKm === bestDistKm && surplus > bestSurplus)) {
          bestDonor   = fromCamp;
          bestSurplus = surplus;
          bestDistKm  = distKm;
        }
      }

      if (!bestDonor) continue; // no donor found

      const quantity = Math.min(shortage, bestSurplus);

      suggestions.push({
        id:           `s-${idCounter++}`,
        toCampId:     toCamp.id,
        fromCampId:   bestDonor.id,
        item,
        shortage:     Math.round(shortage),
        surplus:      Math.round(bestSurplus),
        quantity:     Math.round(quantity),
        distanceKm:   Math.round(bestDistKm * 10) / 10,
        shortageRatio:ratio,
        // vulnerablePeopleAffected: approximate from occupancy & vulnerableShare (not in camps model yet)
        label:        'Suggested',
        status:       'Pending',
      });
    }
  }

  // Sort by shortage ratio desc (most critical first), then by shortage absolute value
  suggestions.sort((a, b) =>
    b.shortageRatio - a.shortageRatio || b.shortage - a.shortage
  );

  // Add urgency rank for the priority system
  return suggestions.map((s, i) => ({ ...s, urgencyRank: i + 1 }));
}
