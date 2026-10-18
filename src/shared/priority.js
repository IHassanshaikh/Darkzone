/**
 * ReliefOS + DARK ZONE: Pure ES Module for Priority Ranking
 * Computes unified priority rank between Silent Risk areas and Reported camp shortages
 */

import { evaluateDarkZone } from './darkZone.js';

export const PRIORITY_CONFIG = {
  confirmedBoost: 15,
  darkZoneWeight: 1.2,
  criticalShortageWeight: 1.0
};

/**
 * Generates unified priority queue
 * @param {Array} areas 
 * @param {Array} camps 
 * @param {Array} campItems 
 * @returns {Array} ranked list
 */
export function computePriorityList(areas = [], camps = [], campItems = []) {
  const list = [];

  // 1. Process Areas (Potential Dark Zones & High Risk)
  for (const area of areas) {
    const assessment = evaluateDarkZone(area);
    let priorityScore = Math.round(assessment.score * PRIORITY_CONFIG.darkZoneWeight);

    if (area.verification === 'confirmed') {
      priorityScore += PRIORITY_CONFIG.confirmedBoost;
    }

    if (assessment.isDarkZone) {
      list.push({
        id: `area-${area.id}`,
        refId: area.id,
        type: 'area',
        title: `${area.name} (Silent Risk Area)`,
        tag: 'Silent Risk',
        tagColor: 'purple',
        urgency: priorityScore >= 80 ? 'critical' : 'high',
        priorityScore,
        location: { lat: area.lat, lng: area.lng },
        population: area.population,
        reason: assessment.reasons[0] || 'High risk and low reporting disparity detected',
        secondaryReason: `${Math.round(assessment.silenceRatio * 100)}% silence ratio | Hazard: ${area.hazardSeverity} | Net: ${Math.round(area.networkFailure * 100)}% fail`,
        details: {
          score: assessment.score,
          isDarkZone: assessment.isDarkZone,
          verification: area.verification || 'none',
          confidence: assessment.confidence
        },
        actionNeeded: area.verification === 'none' ? 'Send Field Team' : (area.verification === 'team_sent' ? 'Awaiting Verification' : 'Dispatch Relief'),
        label: 'Suggested'
      });
    } else if (assessment.score >= 50 && area.verification !== 'rejected' && area.verification !== 'verified_safe') {
      list.push({
        id: `area-${area.id}`,
        refId: area.id,
        type: 'area',
        title: `${area.name} (Monitored Area)`,
        tag: 'High Risk',
        tagColor: 'red',
        urgency: 'medium',
        priorityScore,
        location: { lat: area.lat, lng: area.lng },
        population: area.population,
        reason: `Elevated hazard (${area.hazardSeverity}) or vulnerable concentration (${Math.round((area.vulnerableShare || 0) * 100)}%)`,
        secondaryReason: `Reports: ${area.actualReports || 0} received.`,
        details: {
          score: assessment.score,
          isDarkZone: false,
          verification: area.verification || 'none'
        },
        actionNeeded: 'Monitor Activity',
        label: 'Suggested'
      });
    }
  }

  // 2. Process Camp Shortages (Reported Needs)
  // Group camp_items by camp
  const itemsByCamp = {};
  for (const item of campItems) {
    if (!itemsByCamp[item.camp_id || item.campId]) {
      itemsByCamp[item.camp_id || item.campId] = [];
    }
    itemsByCamp[item.camp_id || item.campId].push(item);
  }

  for (const camp of camps) {
    const items = itemsByCamp[camp.id] || camp.items || [];
    for (const item of items) {
      const stock = item.stock || 0;
      const need = item.need || 0;
      const itemName = (item.item || '').toLowerCase();

      if (need > stock) {
        const shortage = need - stock;
        const deficitRatio = shortage / (need || 1);
        const isCritical = (deficitRatio >= 0.5 && shortage >= 50) || (itemName === 'water' && shortage >= 50);

        // Score based on deficit ratio and camp occupancy
        const urgencyScore = Math.round(deficitRatio * 75 + Math.min(25, (camp.occupancy || 0) / 10));

        list.push({
          id: `camp-${camp.id}-${itemName}`,
          refId: camp.id,
          type: 'camp_shortage',
          title: `${camp.name} - ${itemName.toUpperCase()} Shortage`,
          tag: 'Reported',
          tagColor: isCritical ? 'red' : 'amber',
          urgency: isCritical ? 'critical' : 'high',
          priorityScore: urgencyScore,
          location: { lat: camp.lat, lng: camp.lng },
          population: camp.occupancy || 0,
          reason: `Critical deficit: ${stock} available vs ${need} needed (${shortage} units missing)`,
          secondaryReason: `${camp.occupancy || 0} evacuees affected | Capacity: ${camp.capacity || 0}`,
          details: {
            campId: camp.id,
            campName: camp.name,
            item: itemName,
            stock,
            need,
            shortage
          },
          actionNeeded: 'Approve Resource Transfer',
          label: 'Suggested'
        });
      }
    }
  }

  // Sort descending by priorityScore
  list.sort((a, b) => b.priorityScore - a.priorityScore);

  return list;
}
