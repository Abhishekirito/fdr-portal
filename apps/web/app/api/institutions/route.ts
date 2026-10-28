import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase/store';

export async function GET() {
  try {
    await dataStore.syncFromDatabase();
    const institutions = dataStore.getInstitutions();
    return NextResponse.json({
      institutions,
      total: institutions.length,
      source: 'supabase_cloud',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
