import { NextResponse } from 'next/server';
import { db } from '@/app/api/v1/_db';
import { generateAllocationSuggestions } from '@/src/shared/allocation';

export async function POST(request) {
  const body = await request.json();
  const { suggestionId } = body;

  const suggestions = generateAllocationSuggestions(db.camps, []);
  const suggestion = suggestions.find(s => s.suggestionId === suggestionId || s.id === suggestionId);

  if (!suggestion) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Allocation suggestion not found' } }, { status: 404 });
  }

  const newDuty = {
    id: `duty-del-${Date.now()}`,
    volunteerId: 'vol-2',
    volunteerName: 'Ahmed Raza',
    type: 'delivery',
    fromCampId: suggestion.fromCampId,
    fromCampName: suggestion.fromCampName,
    toType: 'camp',
    toId: suggestion.toCampId,
    toName: suggestion.toCampName,
    item: suggestion.item,
    quantity: suggestion.quantity,
    status: 'assigned', // Pending
    instructions: `Approved transfer: Deliver ${suggestion.quantity} ${suggestion.item} from ${suggestion.fromCampName} to ${suggestion.toCampName}.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Deduct transferred stock from donor camp so it doesn't get suggested repeatedly
  const donorCamp = db.camps.find(c => c.id === suggestion.fromCampId);
  if (donorCamp && Array.isArray(donorCamp.items)) {
    const itm = donorCamp.items.find(i => (i.item || i.name || '').toLowerCase() === suggestion.item.toLowerCase());
    if (itm && itm.stock !== undefined) {
      itm.stock = Math.max(0, itm.stock - suggestion.quantity);
    }
  }

  db.duties.unshift(newDuty);
  db.logActivity('allocation', `Transfer approved: ${suggestion.quantity} ${suggestion.item} from ${suggestion.fromCampName} to ${suggestion.toCampName}. Duty created.`);
  db.saveToDisk();

  return NextResponse.json({
    data: {
      duty: newDuty,
      deliveryStatus: 'Pending',
      approvedSuggestionId: suggestionId
    },
    meta: {}
  });
}
