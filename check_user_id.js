import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://yvjituqlienqyiznebam.supabase.co',
  'sb_publishable_UevydnioUHwwa7Gky5xikg_MFexQ7wM'
);

async function checkUser() {
  const userId = '04b6657f-eae7-40ce-97f8-8395d7f186f7';
  console.log('Checking for user ID:', userId);
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId);

  if (error) {
    console.error('Query Error:', error.message, error.details);
  } else {
    console.log('User results:', data);
  }
}

checkUser();
