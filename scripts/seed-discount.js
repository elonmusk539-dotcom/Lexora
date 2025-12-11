const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local because dotenv might not be installed
function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf8');
      const lines = envConfig.split('\n');
      lines.forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // Remove quotes
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  } catch (e) {
    console.warn('Could not load .env.local', e);
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDiscountCodes() {
  console.log('Seeding discount codes...');

  const code = 'LEXORA100';

  const { data, error } = await supabase
    .from('discount_codes')
    .upsert({
      code: code,
      discount_percent: 100,
      duration_months: 1,
      max_uses: 100, // Limit to 100 people for now
      current_uses: 0,
      is_active: true
    }, { onConflict: 'code' })
    .select()
    .single();

  if (error) {
    console.error('Error seeding discount code:', error);
    // If table doesn't exist, this will error.
    if (error.code === '42P01') { // undefined_table
      console.error('\nCRITICAL: The "discount_codes" table does not exist.');
      console.error('Please run the "database/discount_schema.sql" in your Supabase SQL Editor first.\n');
    }
  } else {
    console.log(`Successfully seeded discount code: ${code}`);
    console.log('Details:', data);
  }
}

seedDiscountCodes();
