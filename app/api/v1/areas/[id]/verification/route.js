import { NextResponse } from 'next/server';
import { db } from '@/app/api/v1/_db';
import { evaluateDarkZone } from '@/src/shared/darkZone';

export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { outcome, note = '' } = body;

  const validOutcomes = ['team_sent', 'confirmed', 'rejected', 'verified_safe'];
  if (!validOutcomes.includes(outcome)) {
    return NextResponse.json({
      error: { code: 'INVALID_OUTCOME', message: `Outcome must be one of: ${validOutcomes.join(', ')}` }
    }, { status: 400 });
  }

  const area = db.areas.find(a => a.id === id);
  if (!area) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Area not found' } }, { status: 404 });
  }

  area.verification = outcome;
  const msg = outcome === 'confirmed'
    ? `Ground hazards in ${area.name} CONFIRMED. Dark Zone priority elevated.`
    : outcome === 'verified_safe'
    ? `Ground inspection in ${area.name} VERIFIED SAFE. Removed from Silent Risk.`
    : `Area ${area.name} flag REJECTED by coordinator.`;

  db.logActivity('verification', msg);

  return NextResponse.json({
    data: { area, assessment: evaluateDarkZone(area) },
    meta: {}
  });
}
