const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const schema = {
  name: 'weekly_balance_insight',
  strict: true,
  schema: {
    type: 'object', additionalProperties: false,
    properties: {
      decisionReason: { type: 'string' },
      suggestion: { type: 'string' },
    },
    required: ['decisionReason', 'suggestion'],
  },
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')
    const { week, desires = [], focusAspects = [] } = await request.json()
    if (!Array.isArray(week) || week.length === 0) throw new Error('A generated week is required')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-5.4-nano',
        messages: [
          { role: 'system', content: 'Compare the generated week with the user desires and focus areas. Fixed calendar blocks cannot move. decisionReason must explain one important placement decision in 22 words or fewer. Prioritize explaining any desire that was omitted, moved from its preferred period, shortened, or otherwise contradicted. If nothing conflicted, briefly explain why one proposed activity was placed in its chosen period. suggestion must be one practical improvement in 18 words or fewer. Use everyday language. Do not repeat the whole schedule, judge the whole week, or invent events.' },
          { role: 'user', content: JSON.stringify({ week, desires, focusAspects }) },
        ],
        response_format: { type: 'json_schema', json_schema: schema },
      }),
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.error?.message ?? 'OpenAI request failed')
    const content = payload?.choices?.[0]?.message?.content
    if (!content) throw new Error('OpenAI returned no weekly insight')
    return new Response(content, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Weekly analysis failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
