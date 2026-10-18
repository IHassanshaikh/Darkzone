import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    healthy: true,
    service: 'ReliefOS + DARK ZONE Full-Stack Next.js Engine',
    timestamp: new Date().toISOString()
  });
}
