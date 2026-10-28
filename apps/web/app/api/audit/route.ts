import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase/store';
import { verifyAuditChainIntegrity } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId') || undefined;

    await dataStore.syncFromDatabase();
    const logs = dataStore.getAuditLogs(entityId);
    return NextResponse.json({
      logs,
      total: logs.length,
      source: 'supabase_cloud',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { entityId } = body;

    const entries = dataStore.getAuditLogs(entityId);
    const verificationResult = await verifyAuditChainIntegrity(entries);

    return NextResponse.json({
      success: true,
      result: verificationResult,
      entriesCount: entries.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
