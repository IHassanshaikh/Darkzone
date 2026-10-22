import { NextResponse } from 'next/server';
import { db } from '@/app/api/v1/_db';

export async function GET() {
  return NextResponse.json({ data: db.duties, meta: {} });
}

export async function POST(request) {
  try {
    const dutyData = await request.json();
    const newDuty = {
      id: dutyData.id || `duty-${Date.now()}`,
      volunteerId: dutyData.volunteerId,
      volunteerName: dutyData.volunteerName || 'Volunteer',
      title: dutyData.title || dutyData.instructions,
      location: dutyData.location || dutyData.toName || 'Field Zone',
      areaId: dutyData.areaId || 'area-c',
      status: dutyData.status || 'assigned',
      priority: dutyData.priority || 'high',
      notes: dutyData.notes || '',
      type: dutyData.type || 'field_task',
      instructions: dutyData.instructions || dutyData.title,
      toName: dutyData.toName || dutyData.location,
      fromCampId: dutyData.fromCampId,
      fromCampName: dutyData.fromCampName,
      item: dutyData.item,
      quantity: dutyData.quantity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.duties.unshift(newDuty);
    db.saveToDisk();

    db.broadcastNotification({
      type: 'task_assigned',
      title: 'NEW TASK ASSIGNED',
      message: `Task "${newDuty.title}" assigned to ${newDuty.volunteerName}`,
      targetRole: 'all',
      targetRoles: ['all', 'volunteer'],
      targetVolunteerId: newDuty.volunteerId,
      link: '/volunteer'
    });

    return NextResponse.json({ success: true, data: newDuty }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}
