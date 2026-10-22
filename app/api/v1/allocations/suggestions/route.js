import { NextResponse } from 'next/server';
import { db } from '@/app/api/v1/_db';
import { generateAllocationSuggestions } from '@/src/shared/allocation';

export async function GET() {
  const suggestions = generateAllocationSuggestions(db.camps, [], db.duties);
  return NextResponse.json({ data: suggestions, meta: {} });
}
