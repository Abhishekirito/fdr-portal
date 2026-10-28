import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase/store';

export async function POST() {
  try {
    const result = dataStore.runMaturityCronCheck();
    return NextResponse.json({
      success: true,
      message: `Maturity cron executed: ${result.checked} active instruments monitored, ${result.alertsGenerated} notification alert(s) generated.`,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
