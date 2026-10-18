import { NextResponse } from 'next/server';
import { findUserByEmail, createUser, recordLogin } from '@/src/lib/sqliteDb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, role = 'volunteer', phone, organization, location } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required fields.' },
        { status: 400 }
      );
    }

    if (!['admin', 'camp_manager', 'volunteer'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be admin, camp_manager, or volunteer.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists in local database.' },
        { status: 409 }
      );
    }

    const created = createUser({
      name,
      email,
      password,
      role,
      phone: phone || '+1 (555) 000-0000',
      organization: organization || 'ReliefOS Emergency Response Unit',
      location: location || 'Field Sector 1'
    });

    const themeAccent = created.theme_accent || (role === 'admin' ? 'red' : role === 'camp_manager' ? 'amber' : 'emerald');

    recordLogin(created.id, created.email, created.role, themeAccent);

    return NextResponse.json({
      success: true,
      message: `Account created successfully in local SQL database for ${created.name}!`,
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.role,
        phone: created.phone,
        organization: created.organization,
        location: created.location,
        themeAccent
      }
    });
  } catch (error) {
    console.error('[API /api/v1/auth/signup] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to register account in local database.' },
      { status: 500 }
    );
  }
}
