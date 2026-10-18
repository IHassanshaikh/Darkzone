import { NextResponse } from 'next/server';
import { db } from '@/app/api/v1/_db';

export async function PATCH(request, context) {
  try {
    const resolvedParams = context?.params ? await context.params : {};
    const id = resolvedParams.id;
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const { status } = body;

    const valid = ['assigned', 'in_progress', 'done'];
    if (!valid.includes(status)) {
      return NextResponse.json({ error: { code: 'INVALID_STATUS', message: 'Invalid status' } }, { status: 400 });
    }

    const duty = db.duties.find(d => d.id === id || String(d.id).toLowerCase() === String(id).toLowerCase());
    if (!duty) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Duty not found' } }, { status: 404 });
    }

    duty.status = status;
    duty.updatedAt = new Date().toISOString();
    db.logActivity('duty', `Duty #${duty.id.substr(-6)} status updated to ${status}.`);
    db.saveToDisk();

    return NextResponse.json({ data: duty, meta: {} });
  } catch (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
