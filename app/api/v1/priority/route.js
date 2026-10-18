import { NextResponse } from 'next/server';
import { db } from '@/app/api/v1/_db';
import { computePriorityList } from '@/src/shared/priority';

export async function GET() {
  const ranked = computePriorityList(db.areas, db.camps, []);
  return NextResponse.json({ data: ranked, meta: {} });
}
