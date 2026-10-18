import { NextResponse } from 'next/server';
import { db } from '@/app/api/v1/_db';
import { evaluateDarkZone } from '@/src/shared/darkZone';

export async function GET() {
  const results = db.areas.map(a => ({
    ...a,
    assessment: evaluateDarkZone(a)
  }));
  return NextResponse.json({ data: results, meta: {} });
}
