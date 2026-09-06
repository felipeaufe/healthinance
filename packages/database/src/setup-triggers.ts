import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not defined');
  process.exit(1);
}

const sql = postgres(connectionString);

async function main() {
  try {
    // 1. Confirm any pending unconfirmed emails in auth.users
    await sql`
      UPDATE auth.users
      SET email_confirmed_at = NOW()
      WHERE email_confirmed_at IS NULL;
    `;
    console.log('Confirmed pending auth.users');

    // 2. Trigger BEFORE INSERT on auth.users to auto-confirm email
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION public.auto_confirm_user()
      RETURNS trigger AS $func$
      BEGIN
        IF NEW.email_confirmed_at IS NULL THEN
          NEW.email_confirmed_at := NOW();
        END IF;
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    await sql.unsafe(`
      DROP TRIGGER IF EXISTS on_auth_user_before_insert ON auth.users;
      CREATE TRIGGER on_auth_user_before_insert
        BEFORE INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.auto_confirm_user();
    `);
    console.log('Created auto_confirm_user BEFORE INSERT trigger');

    // 3. Trigger AFTER INSERT OR UPDATE on auth.users to sync to public.users
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $func$
      BEGIN
        INSERT INTO public.users (id, email, name, avatar_url, created_at, updated_at)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
          NEW.raw_user_meta_data->>'avatar_url',
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          updated_at = NOW();
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    await sql.unsafe(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT OR UPDATE ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `);
    console.log('Created user trigger');

    // 4. Populate existing users into public.users
    await sql.unsafe(`
      INSERT INTO public.users (id, email, name, created_at, updated_at)
      SELECT id, email, COALESCE(raw_user_meta_data->>'name', ''), NOW(), NOW()
      FROM auth.users
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    `);

    const authUsers = await sql`SELECT id, email, email_confirmed_at FROM auth.users;`;
    const publicUsers = await sql`SELECT id, email, name FROM public.users;`;
    console.log('auth.users:', authUsers);
    console.log('public.users:', publicUsers);
  } catch (error) {
    console.error('Error during setup:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
