import { NextResponse } from 'next/server';
import { db } from '@/app/api/v1/_db';
import { evaluateDarkZone } from '@/src/shared/darkZone';

export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { volunteerIds = [] } = body;

  const area = db.areas.find(a => a.id === id);
  if (!area) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Area not found' } }, { status: 404 });
  }

  area.verification = 'team_sent';

  volunteerIds.forEach(vId => {
    const vol = db.volunteers.find(v => v.id === vId);
    if (vol) {
      vol.status = 'on_duty';
      vol.availability = false;
    }
    db.duties.push({
      id: `duty-field-${Date.now()}-${vId}`,
      volunteerId: vId,
      volunteerName: vol ? vol.name : 'Volunteer Team',
      type: 'verification',
      fromCampId: 'camp-a',
      toType: 'area',
      toId: area.id,
      toName: area.name,
      status: 'assigned',
      instructions: `Verification scout deployment to ${area.name}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  db.logActivity('field_team', `Field team dispatched to ${area.name}. Status updated to team_sent.`);

  return NextResponse.json({
    data: { area, assessment: evaluateDarkZone(area) },
    meta: {}
  });
}
