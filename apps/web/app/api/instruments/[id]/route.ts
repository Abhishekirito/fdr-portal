import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase/store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const instrument = dataStore.getInstrumentById(id);
    if (!instrument) {
      return NextResponse.json({ error: 'Instrument not found' }, { status: 404 });
    }

    const auditChain = dataStore.getAuditLogs(id);

    return NextResponse.json({
      instrument,
      auditChain,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
