import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://yvjituqlienqyiznebam.supabase.co',
  'sb_publishable_UevydnioUHwwa7Gky5xikg_MFexQ7wM'
);

async function checkUser() {
  const email = 'ashwinkumarc30@gmail.com';
  console.log('Checking for user:', email);
  
  const { data, error } = await supabase
    .from('users')
    .select('*, company:companies(*)')
    .eq('email', email)
    .single();

  if (error) {
    console.error('Query Error:', error.message, error.details);
  } else {
    console.log('User found:', data);
  }
}

checkUser();
