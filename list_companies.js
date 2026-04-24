import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://yvjituqlienqyiznebam.supabase.co',
  'sb_publishable_UevydnioUHwwa7Gky5xikg_MFexQ7wM'
);

async function listCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select('name, join_code');

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Available Companies:', data);
  }
}

listCompanies();
