import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase/store';
import { queryDb, getDbPool } from '@/lib/supabase/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';

    if (!q) {
      return NextResponse.json({ results: [] });
    }

    // Attempt live Supabase query if connection pool is available
    if (getDbPool()) {
      try {
        const queryText = `
          select 
            f.id,
            f.fdr_number,
            f.status,
            f.amount,
            f.issue_date,
            f.maturity_date,
            f.flagged,
            b.name as bank_name,
            i.name as institution_name,
            i.aicte_code,
            i.trust_score,
            r.name as region_name
          from fdr_instruments f
          join institutions i on i.id = f.institution_id
          join banks b on b.id = f.bank_id
          left join regions r on r.id = i.region_id
          where 
            lower(i.aicte_code) like $1
            or lower(i.name) like $1
            or lower(f.fdr_number) like $1
          limit 20;
        `;
        const pattern = `%${q.toLowerCase()}%`;
        const rows = await queryDb(queryText, [pattern]);
        if (rows && rows.length > 0) {
          return NextResponse.json({ results: rows, source: 'supabase_live' });
        }
      } catch (dbErr) {
        console.warn('Live DB search fallback to store:', dbErr);
      }
    }

    // In-memory or demo store fallback
    const instruments = dataStore.instruments.map(i => (dataStore as any).enrichInstrument(i));
    const matched = instruments.filter(inst => {
      const code = (inst.institution?.aicte_code || '').toLowerCase();
      const instName = (inst.institution?.name || '').toLowerCase();
      const fdr = inst.fdr_number.toLowerCase();
      const queryLower = q.toLowerCase();
      return code.includes(queryLower) || instName.includes(queryLower) || fdr.includes(queryLower);
    });

    const publicResults = matched.map(m => ({
      id: m.id,
      fdr_number: m.fdr_number,
      status: m.status,
      amount: m.amount,
      issue_date: m.issue_date,
      maturity_date: m.maturity_date,
      bank_name: m.bank?.name || 'Scheduled Bank',
      institution_name: m.institution?.name || 'Technical Institute',
      aicte_code: m.institution?.aicte_code || '1-XXXXXXX',
      region_name: m.institution?.region?.name || 'Regional Office',
      trust_score: m.institution?.trust_score || 95,
      flagged: m.flagged,
    }));

    return NextResponse.json({ results: publicResults, source: 'store' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
