import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple database connection test
    await db.select().from(user).limit(1);

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
