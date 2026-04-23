import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = (await cookies()).get('auth_session')?.value;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const notifs = await db.query(`
      SELECT n.id, n.type, n.title, n.message, n.status, n.created_at, n.from_user_id, u.username as from_username
      FROM notifications n
      LEFT JOIN users u ON n.from_user_id = u.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 20
    `, [session]);

    return NextResponse.json({ notifications: notifs.rows });
  } catch (error) {
    console.error('API Notifications GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = (await cookies()).get('auth_session')?.value;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await db.query("UPDATE notifications SET status = 'read' WHERE user_id = $1", [session]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = (await cookies()).get('auth_session')?.value;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await request.json();
    await db.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, session]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
