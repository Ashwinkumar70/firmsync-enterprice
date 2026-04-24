import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://yvjituqlienqyiznebam.supabase.co',
  'sb_publishable_UevydnioUHwwa7Gky5xikg_MFexQ7wM'
);

async function checkAlphaCrew() {
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('name', 'Alpha Crew')
    .single();

  if (!company) {
    console.log('Company Alpha Crew not found');
    return;
  }

  console.log('Alpha Crew Join Code:', company.join_code);

  const { data: depts } = await supabase
    .from('departments')
    .select('*')
    .eq('company_id', company.id);

  console.log('Departments:', depts);
}

checkAlphaCrew();
