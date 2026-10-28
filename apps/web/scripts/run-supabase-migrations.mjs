import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..', '..');

const connectionConfig = {
  host: process.env.SUPABASE_DB_HOST || 'aws-0-ap-northeast-2.pooler.supabase.com',
  port: parseInt(process.env.SUPABASE_DB_PORT || '6543'),
  user: process.env.SUPABASE_DB_USER || 'postgres.kpsmbuofwvatrapjvryn',
  password: process.env.SUPABASE_DB_PASSWORD || '',
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
};

async function run() {
  console.log('🚀 Connecting to Supabase PostgreSQL at aws-0-ap-northeast-2.pooler.supabase.com:6543...');
  const client = new Client(connectionConfig);

  try {
    await client.connect();
    console.log('✅ Connected successfully to Supabase database!\n');

    // 1. Migration 0001_init.sql
    console.log('📦 Running Migration 0001: Schema & Core Tables (0001_init.sql)...');
    const initSql = fs.readFileSync(path.join(rootDir, 'supabase', 'migrations', '0001_init.sql'), 'utf-8');
    await client.query(initSql);
    console.log('✅ Migration 0001 completed successfully.\n');

    // 2. Migration 0002_rls_policies.sql
    console.log('🛡️ Running Migration 0002: Row Level Security Policies (0002_rls_policies.sql)...');
    const rlsSql = fs.readFileSync(path.join(rootDir, 'supabase', 'migrations', '0002_rls_policies.sql'), 'utf-8');
    await client.query(rlsSql);
    console.log('✅ Migration 0002 completed successfully.\n');

    // 3. Migration 0003_storage_policies.sql
    console.log('📁 Running Migration 0003: Storage Buckets & Policies (0003_storage_policies.sql)...');
    const storageSql = fs.readFileSync(path.join(rootDir, 'supabase', 'migrations', '0003_storage_policies.sql'), 'utf-8');
    try {
      await client.query(storageSql);
      console.log('✅ Migration 0003 completed successfully.\n');
    } catch (err) {
      console.log(`⚠️ Migration 0003 notice: ${err.message}\n`);
    }

    // 4. Migration 0004_cron_and_functions.sql
    console.log('⏰ Running Migration 0004: Automation Functions & Maturity Checks (0004_cron_and_functions.sql)...');
    const cronSql = fs.readFileSync(path.join(rootDir, 'supabase', 'migrations', '0004_cron_and_functions.sql'), 'utf-8');
    try {
      await client.query(cronSql);
      console.log('✅ Migration 0004 completed successfully.\n');
    } catch (err) {
      console.log(`⚠️ Migration 0004 notice: ${err.message}\n`);
    }

    // 5. Ensure Auth Users exist for foreign key constraint before seed
    console.log('👤 Synchronizing Seed Auth Users into auth.users...');
    const seedUsers = [
      { id: '00000000-0000-0000-0000-000000000001', email: 'superadmin@aicte.gov.in' },
      { id: '00000000-0000-0000-0000-000000000002', email: 'compliance@aicte.gov.in' },
      { id: '00000000-0000-0000-0000-000000000003', email: 'bureau.head@aicte.gov.in' },
      { id: '00000000-0000-0000-0000-000000000004', email: 'rvo.mumbai@aicte.gov.in' },
      { id: '00000000-0000-0000-0000-000000000005', email: 'rfo.mumbai@aicte.gov.in' },
      { id: '00000000-0000-0000-0000-000000000006', email: 'rvo.delhi@aicte.gov.in' },
      { id: '00000000-0000-0000-0000-000000000007', email: 'rfo.delhi@aicte.gov.in' },
      { id: '00000000-0000-0000-0000-000000000010', email: 'admin@vjti.ac.in' },
      { id: '00000000-0000-0000-0000-000000000011', email: 'fdr@coep.ac.in' },
      { id: '00000000-0000-0000-0000-000000000012', email: 'accounts@dtu.ac.in' },
      { id: '00000000-0000-0000-0000-000000000013', email: 'admin@rvce.edu.in' },
    ];

    for (const u of seedUsers) {
      await client.query(`
        insert into auth.users (
          id,
          instance_id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          created_at,
          updated_at
        ) values (
          $1,
          '00000000-0000-0000-0000-000000000000',
          'authenticated',
          'authenticated',
          $2,
          crypt('aicte@password123', gen_salt('bf')),
          now(),
          '{"provider":"email","providers":["email"]}',
          '{}',
          now(),
          now()
        )
        on conflict (id) do update set email = $2;
      `, [u.id, u.email]);
    }
    console.log(`✅ Seed auth users synced into auth.users.\n`);

    // 6. Run Seed Data
    console.log('🌱 Populating Initial Seed Data (seed.sql)...');
    const seedSql = fs.readFileSync(path.join(rootDir, 'supabase', 'seed.sql'), 'utf-8');
    await client.query(seedSql);
    console.log('✅ Seed data applied successfully.\n');

    // 7. Verify Database Contents
    console.log('🔍 Verifying Tables & Record Counts in Supabase:');
    const tables = ['regions', 'institutions', 'banks', 'profiles', 'fdr_instruments', 'audit_logs', 'notifications'];
    for (const tbl of tables) {
      const res = await client.query(`select count(*) from ${tbl};`);
      console.log(`   • ${tbl.padEnd(16)}: ${res.rows[0].count} records`);
    }

    console.log('\n🎉 ALL SUPABASE MIGRATIONS AND SEED DATA COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
