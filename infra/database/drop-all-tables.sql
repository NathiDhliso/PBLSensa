-- Drop All Tables Script
-- This will clean the database for a fresh start

-- Drop all tables (CASCADE will drop dependent objects)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', r.tablename;
    END LOOP;
    
    -- Drop all views
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.viewname) || ' CASCADE';
        RAISE NOTICE 'Dropped view: %', r.viewname;
    END LOOP;
    
    -- Drop all materialized views
    FOR r IN (SELECT matviewname FROM pg_matviews WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS ' || quote_ident(r.matviewname) || ' CASCADE';
        RAISE NOTICE 'Dropped materialized view: %', r.matviewname;
    END LOOP;
    
    -- Drop all functions
    FOR r IN (SELECT proname, oidvectortypes(proargtypes) as argtypes 
              FROM pg_proc INNER JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid 
              WHERE pg_namespace.nspname = 'public') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || '(' || r.argtypes || ') CASCADE';
        RAISE NOTICE 'Dropped function: %', r.proname;
    END LOOP;
    
    RAISE NOTICE 'Database cleaned successfully!';
END $$;
