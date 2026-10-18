import { NextResponse } from 'next/server';
import { db } from '@/app/api/v1/_db';

export async function GET(request, { params }) {
  const { id } = await params;
  const camp = db.camps.find(c => c.id === id);
  if (!camp) {
    return NextResponse.json({ error: 'Camp not found' }, { status: 404 });
  }
  return NextResponse.json({ data: camp });
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { item, deltaQty, setStock, deltaOccupancy, reason } = body;
    const camp = db.camps.find(c => c.id === id);
    if (!camp) {
      return NextResponse.json({ error: 'Camp not found' }, { status: 404 });
    }

    if (item) {
      const targetItem = (camp.items || []).find(i => i.item === item);
      if (targetItem) {
        if (typeof setStock === 'number') {
          targetItem.stock = Math.max(0, setStock);
        } else if (typeof deltaQty === 'number') {
          targetItem.stock = Math.max(0, targetItem.stock + deltaQty);
        }
      }
      db.logActivity(
        'camp_stock',
        `Camp ${camp.name}: ${item} stock adjusted by ${deltaQty > 0 ? '+' : ''}${deltaQty || 0} (${reason || 'Logistics update'}). New stock: ${targetItem?.stock}.`,
        'Confirmed'
      );
    }

    if (typeof deltaOccupancy === 'number') {
      camp.occupancy = Math.max(0, Math.min(camp.capacity || 1000, camp.occupancy + deltaOccupancy));
      db.logActivity(
        'camp_intake',
        `Camp ${camp.name}: Occupancy updated by ${deltaOccupancy > 0 ? '+' : ''}${deltaOccupancy}. Current: ${camp.occupancy}/${camp.capacity}.`,
        'Confirmed'
      );
    }

    camp.updatedAt = new Date().toISOString();
    return NextResponse.json({ success: true, data: camp });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
