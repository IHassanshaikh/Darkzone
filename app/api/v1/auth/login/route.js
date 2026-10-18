import { NextResponse } from 'next/server';
import { findUserByEmail, recordLogin } from '@/src/lib/sqliteDb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const user = findUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account not found in local SQL database.',
          hint: 'Demo accounts: admin@reliefos.org (admin123), camp@reliefos.org (camp123), volunteer@reliefos.org (vol123)'
        },
        { status: 401 }
      );
    }

    if (user.password !== password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid password.',
          hint: 'Default demo passwords: admin123, camp123, vol123'
        },
        { status: 401 }
      );
    }

    // Determine theme accent based on role
    const themeAccent = user.theme_accent || (user.role === 'admin' ? 'red' : user.role === 'camp_manager' ? 'amber' : 'emerald');

    // Record login into SQLite log table
    recordLogin(user.id, user.email, user.role, themeAccent);

    // Return safe user object
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      organization: user.organization,
      location: user.location,
      themeAccent,
      notes: user.notes
    };

    return NextResponse.json({
      success: true,
      message: `Authenticated as ${user.name} (${user.role}).`,
      user: safeUser
    });
  } catch (error) {
    console.error('[API /api/v1/auth/login] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during authentication.' },
      { status: 500 }
    );
  }
}
