import { NextResponse } from 'next/server';
import { getSqlFileContent, getAllUsers } from '@/src/lib/sqliteDb';

export async function GET() {
  try {
    const sql = getSqlFileContent();
    const users = getAllUsers();

    return NextResponse.json({
      success: true,
      sqlFile: 'reliefos.sql',
      dbFile: 'reliefos.db',
      content: sql,
      userCount: users.length,
      users
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
