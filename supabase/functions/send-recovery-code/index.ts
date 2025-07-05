import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()
    if (!email) {
      throw new Error("E-mail é obrigatório.")
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, whatsapp')
      .eq('email', email)
      .single()

    if (userError || !user) {
      console.warn(`Tentativa de recuperação para e-mail não encontrado: ${email}`)
      // Retornamos sucesso mesmo se o usuário não existir para não revelar informações
      return new Response(JSON.stringify({ message: "Se uma conta com este e-mail existir, um código será enviado." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    
    // 2. Generate a 6-digit code
    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos de validade

    // 3. Store code and expiration in the database
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        recovery_code: recoveryCode,
        recovery_code_expires_at: expiresAt.toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    // 4. Call the webhook
    const webhookUrl = Deno.env.get('RECOVERY_WEBHOOK_URL')
    if (webhookUrl && user.whatsapp) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.whatsapp,
          message: `Seu código de recuperação Tanotado é: ${recoveryCode}`,
        }),
      })
    }

    return new Response(JSON.stringify({ message: "Se uma conta com este e-mail existir, um código será enviado." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
