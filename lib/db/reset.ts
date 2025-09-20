import { config } from 'dotenv';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

config({ path: '.env' });

if (!('POSTGRES_URL' in process.env))
  throw new Error('POSTGRES_URL not found in environment variables');

const client = postgres(process.env.POSTGRES_URL as string);
const db = drizzle(client);

async function reset() {
  console.log('⏳ Resetting database...');
  const start = Date.now();

  const query = sql`
		-- Delete all tables (including Drizzle migration tracking)
		DO $$ DECLARE
		    r RECORD;
		BEGIN
		    -- Disable triggers to avoid dependency issues
		    SET session_replication_role = replica;
		    
		    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
		        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
		    END LOOP;
		    
		    -- Re-enable triggers
		    SET session_replication_role = DEFAULT;
		END $$;

		-- Delete enums
		DO $$ DECLARE
			r RECORD;
		BEGIN
			FOR r IN (select t.typname as enum_name
			from pg_type t
				join pg_enum e on t.oid = e.enumtypid
				join pg_catalog.pg_namespace n ON n.oid = t.typnamespace
				where n.nspname = current_schema()) LOOP
				EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.enum_name) || ' CASCADE';
			END LOOP;
		END $$;

		-- Explicitly drop all possible Drizzle migration tables
		DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE;
		DROP TABLE IF EXISTS "drizzle_migrations" CASCADE;
		DROP TABLE IF EXISTS "__drizzle_migrations__" CASCADE;
		
		-- Clean up any remaining functions or procedures
		DO $$ DECLARE
		    r RECORD;
		BEGIN
		    FOR r IN (SELECT proname, oidvectortypes(proargtypes) as argtypes FROM pg_proc INNER JOIN pg_namespace ns ON (pg_proc.pronamespace = ns.oid) WHERE ns.nspname = current_schema()) LOOP
		        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || '(' || r.argtypes || ') CASCADE';
		    END LOOP;
		END $$;
	`;

  await db.execute(query);

  const end = Date.now();
  console.log(`✅ Reset end & took ${end - start}ms`);
  console.log('');
  process.exit(0);
}

reset().catch((err) => {
  console.error('❌ Reset failed');
  console.error(err);
  process.exit(1);
});
