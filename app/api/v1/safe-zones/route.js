import { NextResponse } from 'next/server';
import { db } from '@/app/api/v1/_db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const since = searchParams.get('since');

  let list = db.camps;
  if (since) {
    const sinceTime = new Date(since).getTime();
    list = list.filter(c => new Date(c.updatedAt).getTime() >= sinceTime);
  }

  const responseList = list.map(c => ({
    id: c.id,
    name: c.name,
    lat: c.lat,
    lng: c.lng,
    capacity: c.capacity,
    occupancy: c.occupancy,
    type: c.type || 'camp',
    updatedAt: c.updatedAt || new Date().toISOString()
  }));

  return NextResponse.json(responseList);
}

export async function POST(request) {
  const body = await request.json();
  const { name, lat, lng, capacity, type } = body;

  if (!name || lat === undefined || lng === undefined) {
    return NextResponse.json({
      error: { code: 'VALIDATION_ERROR', message: 'Name, lat, and lng are required.' }
    }, { status: 400 });
  }

  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
    return NextResponse.json({
      error: { code: 'INVALID_COORDINATES', message: 'Latitude must be [-90, 90] and longitude [-180, 180]' }
    }, { status: 400 });
  }

  const newZone = {
    id: `camp-${Date.now()}`,
    name,
    lat: numLat,
    lng: numLng,
    capacity: parseInt(capacity) || 200,
    occupancy: 0,
    minReserve: 20,
    type: type || 'safe_zone',
    updatedAt: new Date().toISOString(),
    items: [
      { item: 'water', stock: 100, need: 100 },
      { item: 'food', stock: 100, need: 100 },
      { item: 'medicine', stock: 50, need: 50 },
      { item: 'relief', stock: 50, need: 50 }
    ]
  };

  db.camps.push(newZone);
  db.logActivity('safe_zone', `New Safe Zone designated: ${newZone.name}.`);

  return NextResponse.json(newZone, { status: 201 });
}
