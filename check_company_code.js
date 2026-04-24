import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://yvjituqlienqyiznebam.supabase.co',
  'sb_publishable_UevydnioUHwwa7Gky5xikg_MFexQ7wM'
);

async function checkCompany() {
  const code = 'ACME123';
  console.log('Checking for Company Code:', code);
  
  const { data: company, error: cError } = await supabase
    .from('companies')
    .select('*')
    .eq('join_code', code);

  if (cError) {
    console.error('Company Query Error:', cError.message);
    return;
  }

  if (!company || company.length === 0) {
    console.log('No company found with code:', code);
    return;
  }

  console.log('Company found:', company[0]);

  const { data: depts, error: dError } = await supabase
    .from('departments')
    .select('*')
    .eq('company_id', company[0].id);

  if (dError) {
    console.error('Departments Query Error:', dError.message);
  } else {
    console.log('Departments found:', depts);
  }
}

checkCompany();
