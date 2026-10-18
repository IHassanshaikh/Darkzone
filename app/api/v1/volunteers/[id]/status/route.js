import { NextResponse } from 'next/server';
import { db } from '@/app/api/v1/_db';

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  const valid = ['available', 'on_duty', 'offline'];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: { code: 'INVALID_STATUS', message: 'Invalid status' } }, { status: 400 });
  }

  const vol = db.volunteers.find(v => v.id === id);
  if (!vol) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Volunteer not found' } }, { status: 404 });
  }

  vol.status = status;
  vol.availability = status === 'available';

  return NextResponse.json({ data: vol, meta: {} });
}
