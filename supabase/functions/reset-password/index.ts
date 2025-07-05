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
    const { email, code, password } = await req.json()
    if (!email || !code || !password) {
      throw new Error("E-mail, código e nova senha são obrigatórios.")
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Find user by email and recovery code
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, recovery_code, recovery_code_expires_at')
      .eq('email', email)
      .single()

    if (userError || !user) {
      throw new Error("Usuário não encontrado ou código inválido.")
    }

    // 2. Verify the code and its expiration
    const now = new Date()
    const expiresAt = new Date(user.recovery_code_expires_at)

    if (user.recovery_code !== code || now > expiresAt) {
      throw new Error("Código de recuperação inválido ou expirado.")
    }

    // 3. If valid, update the user's password in auth.users
    const { error: updateAuthUserError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password: password }
    )

    if (updateAuthUserError) {
      throw updateAuthUserError
    }

    // 4. Invalidate the code
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({
        recovery_code: null,
        recovery_code_expires_at: null,
      })
      .eq('id', user.id)

    if (updateProfileError) {
      // Log the error but don't fail the request, as the password was already updated
      console.error("Falha ao invalidar o código de recuperação:", updateProfileError)
    }

    return new Response(JSON.stringify({ message: "Senha atualizada com sucesso." }), {
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
