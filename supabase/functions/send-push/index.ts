import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const { record } = payload

    console.log(`Webhook reçu. Titre: "${record?.title}", Statut: "${record?.status}"`)

    if (!record || record.status !== 'published') {
      console.log("Article non publié. Annulation.")
      return new Response(JSON.stringify({ message: 'Skipped: Not published' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Configuration VAPID
    try {
      webpush.setVapidDetails(
        'mailto:admin@ton-site.com',
        Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
        Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
      )
    } catch (configError) {
      console.error("Erreur config VAPID:", configError)
      throw new Error("Configuration VAPID invalide. Vérifiez vos clés secrets.")
    }

    const { data: tokens, error } = await supabase
      .from('web_push_tokens')
      .select('id, token')

    if (error) throw error

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ message: 'Aucun abonné.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Envoi à ${tokens.length} abonnés...`)

    const notificationPayload = JSON.stringify({
      title: `🔥 Nouvel article : ${record.title}`,
      body: record.excerpt || "Venez lire la suite sur l'application !",
      url: `/blog/${record.slug}`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png'
    })

    const results = await Promise.allSettled(
      tokens.map(async (row) => {
        try {
          const subscription = typeof row.token === 'string' ? JSON.parse(row.token) : row.token
          await webpush.sendNotification(subscription, notificationPayload)
          return { success: true, id: row.id }
        } catch (err: unknown) {
          const error = err as { statusCode?: number; message?: string }
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`Token invalide (${row.id}). Suppression...`)
            await supabase.from('web_push_tokens').delete().eq('id', row.id)
          } else {
            console.error(`Erreur envoi (${row.id}):`, error.message)
          }
          throw err
        }
      })
    )

    const successCount = results.filter((r) => r.status === 'fulfilled').length

    return new Response(JSON.stringify({ success: true, sent: successCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('Erreur critique:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
