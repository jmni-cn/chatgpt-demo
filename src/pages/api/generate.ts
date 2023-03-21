import type { APIRoute } from 'astro'
import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser'
import { verifySignature } from '../../utils'
const apiKey = import.meta.env.OPENAI_API_KEY
const sitePassword = import.meta.env.SITE_PASSWORD

export const post: APIRoute = async (context) => {
  const body = await context.request.json()
  const { sign, time, messages, pass } = body
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  if (!messages) {
    return new Response('No input text')
  }
  // 简单鉴权
  if (sitePassword && !sitePassword.includes(pass)) {
    return new Response('Invalid password')
  }
  // 防劫持
  if (import.meta.env.PROD && !await verifySignature({ t: time, m: messages?.[messages.length - 1]?.content || '', }, sign)) {
    return new Response('Invalid signature')
  }
  // https://api.openai.com/dashboard/billing/credit_grants
  // 查询余额
  if( messages[messages.length-1].role == 'user' && /^sk-/.test(messages[messages.length-1].content) ){
    const grant = await fetch('https://api.openai.com/dashboard/billing/credit_grants', {
      headers: {
        Authorization: `Bearer ${messages[messages.length-1].content}`,
      },
      method: 'GET',
    })
    return grant
  }
  const completion = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    method: 'POST',
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.6,
      stream: true,
    }),
  })

  const stream = new ReadableStream({
    async start(controller) {
      const streamParser = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data
          if (data === '[DONE]') {
            controller.close()
            return
          }
          try {
            const json = JSON.parse(data)
            const text = json.choices[0].delta?.content            
            const queue = encoder.encode(text)
            controller.enqueue(queue)
          } catch (e) {
            controller.error(e)
          }
        }
      }

      const parser = createParser(streamParser)
      for await (const chunk of completion.body as any) {
        parser.feed(decoder.decode(chunk))
      }
    },
  })

  return new Response(stream)
}
