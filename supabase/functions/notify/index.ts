// FirmSync Enterprise – Supabase Edge Function: notify
// Deploy with: supabase functions deploy notify
// Invoke from frontend: supabase.functions.invoke('notify', { body: { ... } })

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyPayload {
  user_id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  email?: string;
  link?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body: NotifyPayload = await req.json();
    const { user_id, title, message, type = 'info', email, link } = body;

    // 1. Insert in-app notification
    await supabase.from('notifications').insert({
      user_id,
      title,
      message,
      type,
      link,
      is_read: false,
    });

    // 2. Send email via Resend (if email provided)
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey && email) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'FirmSync <notifications@firmsync.com>',
          to: [email],
          subject: title,
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: linear-gradient(135deg, #1B2A4A, #2a3f6b); padding: 28px; border-radius: 12px; margin-bottom: 24px;">
                <div style="font-size: 22px; font-weight: 800; color: white; letter-spacing: -0.5px;">
                  FS FirmSync
                </div>
              </div>
              <h2 style="color: #0F172A; font-size: 18px; margin-bottom: 12px;">${title}</h2>
              <p style="color: #64748B; font-size: 14px; line-height: 1.7;">${message}</p>
              ${link ? `<a href="${link}" style="display: inline-block; margin-top: 20px; background: #3B82F6; color: white; padding: 10px 24px; border-radius: 8px; font-weight: 600; text-decoration: none;">View Details</a>` : ''}
              <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 32px 0;" />
              <p style="font-size: 12px; color: #94A3B8;">This is an automated notification from FirmSync Enterprise. Do not reply to this email.</p>
            </div>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
