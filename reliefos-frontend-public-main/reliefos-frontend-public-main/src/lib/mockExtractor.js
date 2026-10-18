/**
 * src/lib/mockExtractor.js
 *
 * Pure ES module. Zero browser APIs, zero external libraries.
 * Simple keyword rules for disaster triage entity extraction.
 *
 * A field not found returns "Not found", never a guess.
 *
 * @param {string} text - Raw emergency message
 * @returns {{
 *   age: string,
 *   mobilityIssue: string,
 *   hazard: string,
 *   urgency: string,
 *   assistanceNeeded: string
 * }}
 */
export function extractEmergencyDetails(text = '') {
  const lower = String(text).toLowerCase();

  // 1. Age / demographic
  let age = 'Not found';
  if (/\b(elderly|senior|seniors|aged|grandparent|pensioner|old\s+(man|woman|person|people))\b/.test(lower)) {
    age = 'elderly';
  } else if (/\b(child|children|kid|kids|baby|babies|infant|infants|toddler|toddlers)\b/.test(lower)) {
    age = 'child';
  } else if (/\b(pregnant|expecting)\b/.test(lower)) {
    age = 'pregnant';
  } else if (/\b(adult|adults|youth|teen|teenager)\b/.test(lower)) {
    age = 'adult';
  }

  // 2. Mobility issue
  let mobilityIssue = 'Not found';
  if (/\b(no\s+mobility\s+issue|can\s+walk|mobile)\b/.test(lower)) {
    mobilityIssue = 'No';
  } else if (
    /\b(wheelchair|bedridden|immobile|paralyzed|disabled|amputee|cannot\s+walk|can't\s+walk|unable\s+to\s+walk|stuck|stranded|trapped|submerged)\b/.test(
      lower
    )
  ) {
    mobilityIssue = 'Yes';
  }

  // 3. Hazard
  let hazard = 'Not found';
  if (/\b(flood|flooding|water\s+level|submerged|river\s+bank|drowning|overflow)\b/.test(lower)) {
    hazard = 'flood';
  } else if (/\b(fire|flames|smoke|burning|explosion)\b/.test(lower)) {
    hazard = 'fire';
  } else if (/\b(earthquake|tremor|quake|collapsed|rubble|debris)\b/.test(lower)) {
    hazard = 'earthquake';
  } else if (/\b(storm|cyclone|hurricane|tornado|high\s+winds|gale)\b/.test(lower)) {
    hazard = 'storm';
  } else if (/\b(landslide|mudslide|rockfall)\b/.test(lower)) {
    hazard = 'landslide';
  }

  // 4. Urgency
  let urgency = 'Not found';
  if (
    /\b(critical|life[- ]threatening|immediate|dying|drowning|trapped|underwater|emergency|bleeding|severe)\b/.test(
      lower
    )
  ) {
    urgency = 'critical';
  } else if (/\b(urgent|high|asap|fast|quickly|soon|running\s+out|stranded)\b/.test(lower)) {
    urgency = 'high';
  } else if (/\b(moderate|medium|need\s+soon|needed)\b/.test(lower)) {
    urgency = 'moderate';
  } else if (/\b(low|minor|stable|non[- ]urgent)\b/.test(lower)) {
    urgency = 'low';
  }

  // 5. Assistance needed
  let assistanceNeeded = 'Not found';
  if (/\b(evacuat(e|ion)|rescue|boat|helicopter|airlift|trapped)\b/.test(lower)) {
    assistanceNeeded = 'evacuation';
  } else if (/\b(medic(al|ine)|doctor|first[- ]aid|injury|injured|wound|bleeding|hospital)\b/.test(lower)) {
    assistanceNeeded = 'medical';
  } else if (/\b(food|water|ration|rations|hunger|starving|drinking\s+water|clean\s+water)\b/.test(lower)) {
    assistanceNeeded = 'food & water';
  } else if (/\b(shelter|tent|blanket|blankets|clothing|clothes)\b/.test(lower)) {
    assistanceNeeded = 'shelter';
  }

  return {
    age,
    mobilityIssue,
    hazard,
    urgency,
    assistanceNeeded,
  };
}
