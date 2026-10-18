import { NextResponse } from 'next/server';
import { db } from '@/app/api/v1/_db';

export async function GET() {
  return NextResponse.json({ data: db.volunteers, meta: {} });
}
