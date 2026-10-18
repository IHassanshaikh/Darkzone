import { NextResponse } from 'next/server';
import { db } from '../_db';

// GET /api/v1/messages - Query messages
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const volunteerId = searchParams.get('volunteerId');
    const recipient = searchParams.get('recipient');

    let results = [...db.messages];
    if (volunteerId) {
      results = results.filter(m => m.recipientId === volunteerId || m.sender === volunteerId || m.sender === 'user' || m.sender === 'citizen');
    }
    if (recipient) {
      results = results.filter(m => m.recipientName?.toLowerCase().includes(recipient.toLowerCase()) || m.recipientId === recipient);
    }

    return NextResponse.json({
      data: results,
      meta: { count: results.length }
    });
  } catch (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

// POST /api/v1/messages - Send citizen SOS message to volunteer or coordinator
export async function POST(request) {
  try {
    const body = await request.json();
    const { text, category, recipientId, recipientName, sender, senderName, hopRoute } = body;

    if (!text) {
      return NextResponse.json({ error: { message: 'Message text is required' } }, { status: 400 });
    }

    const savedMsg = db.addMessage({
      text,
      category: category || 'Emergency Assistance',
      recipientId: recipientId || 'vol-3',
      recipientName: recipientName || 'Fatima Noor (Volunteer)',
      sender: sender || 'user',
      senderName: senderName || 'Affected Citizen',
      hopRoute: hopRoute || 'P2P Bluetooth Low Energy Mesh',
      status: 'delivered'
    });

    return NextResponse.json({
      data: savedMsg,
      meta: { message: 'Message dispatched successfully to volunteer field unit' }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
