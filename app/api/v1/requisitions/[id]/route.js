import { NextResponse } from 'next/server';
import { db } from '../../_db';

// PATCH /api/v1/requisitions/[id] - Approve or update status of a requisition
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
    const { status, notes } = body;

    const updated = db.updateRequisition(id, { status, notes });
    if (!updated) {
      return NextResponse.json({ error: { message: `Requisition ${id} not found` } }, { status: 404 });
    }

    return NextResponse.json({
      data: updated,
      meta: { message: `Requisition ${id} updated to ${status}` }
    });
  } catch (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
