const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const schema = {
  name: 'task_interpretation',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      items: {
        type: 'array', minItems: 1, maxItems: 5,
        items: {
          type: 'object', additionalProperties: false,
          properties: {
            title: { type: 'string' },
            deadlineDate: { type: ['string', 'null'], description: 'ISO date YYYY-MM-DD or null' },
            plannedDate: { type: 'string', description: 'The best ISO date YYYY-MM-DD within the supplied planning range' },
            deadlineLabel: { type: 'string' },
            durationMinutes: { type: 'integer', minimum: 15, maximum: 480 },
            effort: { type: 'string', enum: ['low', 'medium', 'high'] },
            preferredPeriod: { type: 'string', enum: ['morning', 'afternoon', 'evening', 'flexible'] },
            splittable: { type: 'boolean' },
            wellbeingPriority: { type: ['string', 'null'] },
            explanation: { type: 'string' },
          },
          required: ['title', 'deadlineDate', 'plannedDate', 'deadlineLabel', 'durationMinutes', 'effort', 'preferredPeriod', 'splittable', 'wellbeingPriority', 'explanation'],
        },
      },
      explanation: { type: 'string' },
    },
    required: ['items', 'explanation'],
  },
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

    const { intention, currentDate, timeZone, planningRange } = await request.json()
    if (typeof intention !== 'string' || !intention.trim()) {
      return new Response(JSON.stringify({ error: 'A task is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-5.4-nano',
        messages: [
          {
            role: 'system',
            content: `Split clearly different activities into separate schedulable items, but keep the result small. Only repeat an activity when the user gives an exact count such as three times. If they say mornings, evenings, regularly, or often without a count, create one item and preserve that preference; do not create one item for every day. Return at most five items. Current local date: ${currentDate}. Time zone: ${timeZone}. Imported calendar range: ${planningRange?.from ?? currentDate} through ${planningRange?.to ?? currentDate}. Every plannedDate must be inside that range. Resolve weekday words against that range. deadlineDate is only a real deadline stated by the user; otherwise null. Do not invent activities. Keep each explanation simple.`,
          },
          { role: 'user', content: intention.trim() },
        ],
        response_format: { type: 'json_schema', json_schema: schema },
      }),
    })

    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.error?.message ?? 'OpenAI request failed')
    const content = payload?.choices?.[0]?.message?.content
    if (!content) throw new Error('OpenAI returned no interpretation')

    return new Response(content, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Interpretation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
