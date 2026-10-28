import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase/store';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const logId = body.logId || dataStore.auditLogs[0]?.id;

    if (!logId) {
      return NextResponse.json({ error: 'No audit log available to tamper' }, { status: 400 });
    }

    const result = dataStore.simulateTamperAuditLog(logId);
    return NextResponse.json({
      success: true,
      message: 'SIMULATION: Historical database row payload was altered without recalculating entry_hash. Audit chain is now invalid.',
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    dataStore.resetAuditLogs();
    return NextResponse.json({
      success: true,
      message: 'Audit chain restored to valid cryptographic state.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
