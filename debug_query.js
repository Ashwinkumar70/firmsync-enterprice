import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://yvjituqlienqyiznebam.supabase.co',
  'sb_publishable_UevydnioUHwwa7Gky5xikg_MFexQ7wM'
);

async function testQuery() {
  console.log('Inspecting users table columns...');
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Query Error:', error);
  } else {
    // data should be an empty array, but we can check the generic structure if it returned anything
    // Since it's empty, we'll try to guess columns by trying to select them one by one
    const columnsToTest = ['id', 'email', 'company_id', 'role', 'full_name'];
    for (const col of columnsToTest) {
      const { error } = await supabase.from('users').select(col).limit(1);
      console.log(`Column '${col}': ${error ? 'FAIL (' + error.code + ')' : 'SUCCESS'}`);
    }
  }
}

testQuery();
