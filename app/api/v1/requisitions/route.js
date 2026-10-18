import { NextResponse } from 'next/server';
import { db } from '../_db';

// GET /api/v1/requisitions - Query camp resource requisitions
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get('campId');
    const volunteerId = searchParams.get('volunteerId');
    const status = searchParams.get('status');

    let results = [...db.requisitions];
    if (campId) results = results.filter(r => r.campId === campId);
    if (volunteerId) results = results.filter(r => r.volunteerId === volunteerId);
    if (status) results = results.filter(r => r.status === status);

    return NextResponse.json({
      data: results,
      meta: { count: results.length }
    });
  } catch (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

// POST /api/v1/requisitions - Volunteer requests emergency supplies from a camp
export async function POST(request) {
  try {
    const body = await request.json();
    const { volunteerId, volunteerName, campId, campName, items, notes, priority } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: { message: 'Requisition must include at least one item' } }, { status: 400 });
    }

    const savedReq = db.addRequisition({
      volunteerId: volunteerId || 'vol-3',
      volunteerName: volunteerName || 'Fatima Noor',
      campId: campId || 'camp-b',
      campName: campName || 'Camp B (Coastal School)',
      items,
      notes: notes || 'Urgent supplies required for field team operations.',
      priority: priority || 'high'
    });

    return NextResponse.json({
      data: savedReq,
      meta: { message: 'Requisition submitted and routed to Camp Operations' }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
