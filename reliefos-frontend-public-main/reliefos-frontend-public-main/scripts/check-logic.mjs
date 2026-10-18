#!/usr/bin/env node
/**
 * scripts/check-logic.mjs
 *
 * Smoke-tests the three pure logic modules.
 * Expected output:
 *   Area C isDarkZone true
 *   Suggestion: Camp D → Camp B  item: water  qty: 300  dist: 6.4 km
 *
 * Run with:  node scripts/check-logic.mjs
 */

import { createRequire } from 'module';
import { assessArea }        from '../src/lib/darkZone.js';
import { buildPriorityList } from '../src/lib/priority.js';
import { computeSuggestions } from '../src/lib/allocation.js';

const require = createRequire(import.meta.url);
const areas   = require('../src/data/mock/areas.json');
const camps   = require('../src/data/mock/camps.json');

// ── 1. Dark Zone check ─────────────────────────────────────────────────
console.log('\n=== Dark Zone assessments ===');
for (const area of areas) {
  const result = assessArea(area);
  console.log(`${area.name}  isDarkZone ${result.isDarkZone}  score ${result.score}  confidence ${result.confidence}`);
  if (result.isDarkZone) {
    console.log(`  → Reasons: ${result.reasons.join(' | ')}`);
  }
}

// ── Explicit assertion required by Step 0 ─────────────────────────────
const areaC      = areas.find(a => a.id === 'area-c');
const resultC    = assessArea(areaC);
console.log('\nArea C isDarkZone', resultC.isDarkZone);  // must print: Area C isDarkZone true
if (!resultC.isDarkZone) {
  console.error('FAIL: Area C should be a Dark Zone. Check seed data or formula.');
  process.exit(1);
}

// ── 2. Priority list ──────────────────────────────────────────────────
console.log('\n=== Priority list (top 5) ===');
const areasWithAssessments = areas.map(a => ({ ...a, assessment: assessArea(a), verification: 'none' }));
const priorityList = buildPriorityList(areasWithAssessments, camps);
for (const entry of priorityList.slice(0, 5)) {
  console.log(`  Rank ${entry.rank}: [${entry.tag}] ${entry.id}  urgency ${entry.urgency}  — ${entry.reasons[0]}`);
}

// ── 3. Allocation suggestions ─────────────────────────────────────────
console.log('\n=== Allocation suggestions ===');
const suggestions = computeSuggestions(camps);
for (const s of suggestions) {
  console.log(`  ${s.fromCampId} → ${s.toCampId}  item: ${s.item}  qty: ${s.quantity}  dist: ${s.distanceKm} km  [${s.label}]`);
}

// ── Explicit assertion required by Step 0 ─────────────────────────────
const waterSuggestion = suggestions.find(
  s => s.fromCampId === 'camp-d' && s.toCampId === 'camp-b' && s.item === 'water'
);
if (waterSuggestion) {
  console.log(`\nCamp D to Camp B water suggestion  ✓  qty: ${waterSuggestion.quantity}  dist: ${waterSuggestion.distanceKm} km`);
} else {
  console.error('FAIL: Expected Camp D → Camp B water suggestion not found. Check camp seed data.');
  process.exit(1);
}

console.log('\n✓ All checks passed.\n');
