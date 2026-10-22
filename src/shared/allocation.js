/**
 * ReliefOS + DARK ZONE: Pure ES Module for Resource Allocation
 * Suggests optimal transfers from nearest surplus camp to shortage camp
 */

/**
 * Calculates Haversine distance in km between two coordinate points
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 999999;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Generates suggested camp-to-camp transfers
 * @param {Array} camps 
 * @param {Array} campItems 
 * @returns {Array} suggested transfers
 */
export function generateAllocationSuggestions(camps = [], campItems = [], existingDuties = []) {
  const suggestions = [];

  // Index items by campId and item name
  const itemsByCamp = {};
  for (const ci of campItems) {
    const cId = ci.camp_id || ci.campId;
    if (!itemsByCamp[cId]) itemsByCamp[cId] = {};
    itemsByCamp[cId][(ci.item || '').toLowerCase()] = {
      stock: ci.stock || 0,
      need: ci.need || 0
    };
  }

  // Also support camp.items embedded
  for (const camp of camps) {
    if (camp.items && Array.isArray(camp.items)) {
      if (!itemsByCamp[camp.id]) itemsByCamp[camp.id] = {};
      for (const itm of camp.items) {
        itemsByCamp[camp.id][(itm.item || itm.name || '').toLowerCase()] = {
          stock: itm.stock || 0,
          need: itm.need || 0
        };
      }
    }
  }

  const campMap = {};
  camps.forEach(c => { campMap[c.id] = c; });

  const resources = ['water', 'food', 'medicine', 'relief'];

  for (const destCamp of camps) {
    const destItems = itemsByCamp[destCamp.id] || {};

    for (const item of resources) {
      const destItem = destItems[item] || { stock: 0, need: 0 };
      const shortage = destItem.need - destItem.stock;

      if (shortage > 0) {
        // Find candidate donor camps with surplus
        const candidates = [];

        for (const srcCamp of camps) {
          if (srcCamp.id === destCamp.id) continue;
          const srcItem = (itemsByCamp[srcCamp.id] && itemsByCamp[srcCamp.id][item]) || { stock: 0, need: 0 };
          const minReserve = srcCamp.minReserve || srcCamp.min_reserve || 0;
          const availableSurplus = srcItem.stock - minReserve;

          if (availableSurplus > 0) {
            const distanceKm = haversineDistance(srcCamp.lat, srcCamp.lng, destCamp.lat, destCamp.lng);
            candidates.push({
              sourceCamp: srcCamp,
              surplus: availableSurplus,
              distanceKm
            });
          }
        }

        // Sort candidates by nearest distance first, then highest surplus
        candidates.sort((a, b) => a.distanceKm - b.distanceKm || b.surplus - a.surplus);

        if (candidates.length > 0) {
          const best = candidates[0];
          const transferQty = Math.min(shortage, best.surplus);
          const suggestionId = `${best.sourceCamp.id}:${destCamp.id}:${item}`;

          // If an active/in-progress delivery duty already exists for this donor-to-recipient route, skip
          const hasInFlightDelivery = Array.isArray(existingDuties) && existingDuties.some(d => 
            d.type === 'delivery' && 
            d.status !== 'done' && 
            (d.fromCampId === best.sourceCamp.id || d.fromCampName === best.sourceCamp.name) &&
            (d.toId === destCamp.id || d.toName === destCamp.name) &&
            (d.item || '').toLowerCase() === item.toLowerCase()
          );

          if (!hasInFlightDelivery) {
            suggestions.push({
              id: suggestionId,
              suggestionId,
              fromCampId: best.sourceCamp.id,
              fromCampName: best.sourceCamp.name,
              toCampId: destCamp.id,
              toCampName: destCamp.name,
              item,
              quantity: transferQty,
              unit: item === 'water' ? 'L' : (item === 'food' ? 'rations' : 'kits'),
              distanceKm: best.distanceKm,
              reason: `Transfer ${transferQty} ${item} from ${best.sourceCamp.name} (${best.distanceKm} km away) to relieve ${destCamp.name}'s deficit.`,
              shortageRatio: shortage / (destItem.need || 1),
              peopleAffected: destCamp.occupancy || 0,
              status: 'suggested',
              label: 'Suggested',
              createdAt: new Date().toISOString()
            });
          }
        }
      }
    }
  }

  // Sort suggestions: highest shortage ratio and highest people affected first
  suggestions.sort((a, b) => (b.shortageRatio * b.peopleAffected) - (a.shortageRatio * a.peopleAffected));

  return suggestions;
}
