import { NextResponse } from 'next/server';
import { db } from '@/app/api/v1/_db';
import { evaluateDarkZone } from '@/src/shared/darkZone';

export async function GET(request, { params }) {
  const { id } = await params;
  const area = db.areas.find(a => a.id === id);
  if (!area) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Area not found' } }, { status: 404 });
  }
  return NextResponse.json({
    data: {
      ...area,
      assessment: evaluateDarkZone(area)
    },
    meta: {}
  });
}
