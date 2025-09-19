import { hfGenerateText, hfGenerateImage } from './hf'

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY is not set')
  return key
}

async function openaiText(prompt: string, options?: { max_new_tokens?: number; temperature?: number; model?: string }): Promise<string> {
  const apiKey = getOpenAIKey()
  // Use GPT-4o-mini as default (has image generation capabilities)
  const model = options?.model || (process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini').trim()
  const org = process.env.OPENAI_ORG_ID
  const project = process.env.OPENAI_PROJECT

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
  if (org) headers['OpenAI-Organization'] = org
  if (project) headers['OpenAI-Project'] = project

  // GPT-5 uses max_tokens, GPT-4o models use max_tokens
  const maxTokens = options?.max_new_tokens || 1000
  const temperature = options?.temperature || 0.7

  const body = {
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`OpenAI text error: ${res.status} ${msg}`)
  }
  const data: any = await res.json()
  const text: string = data?.choices?.[0]?.message?.content || ''
  return text
}

async function openaiImage(prompt: string, options?: { size?: '1024x1024' | '1792x1024' | '1024x1792' }): Promise<Buffer> {
  const apiKey = getOpenAIKey()
  // Use GPT-4o-mini for image generation (has built-in image generation)
  const model = (process.env.OPENAI_IMAGE_MODEL || 'gpt-4o-mini').trim()
  const size = options?.size || '1024x1024'
  const org = process.env.OPENAI_ORG_ID
  const project = process.env.OPENAI_PROJECT

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
  if (org) headers['OpenAI-Organization'] = org
  if (project) headers['OpenAI-Project'] = project

  // For GPT-4o models, we need to use the vision API with image generation
  if (model.includes('gpt-4o')) {
    // Use GPT-4o's built-in image generation
    const body = {
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `Generate an image: ${prompt}` },
            { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' } }
          ]
        }
      ],
      max_tokens: 1000
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText)
      throw new Error(`OpenAI GPT-4o image error: ${res.status} ${msg}`)
    }

    const data = await res.json()
    const imageUrl = data?.choices?.[0]?.message?.content
    
    if (!imageUrl) {
      throw new Error('No image URL returned from GPT-4o')
    }

    // Download the generated image
    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) {
      throw new Error(`Failed to download image: ${imageRes.status}`)
    }

    return Buffer.from(await imageRes.arrayBuffer())
  } else {
    // Fallback to DALL-E 3 for other models
    const body = {
      model: 'dall-e-3',
      prompt,
      size,
      quality: 'standard',
      n: 1
    }

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText)
      throw new Error(`OpenAI DALL-E error: ${res.status} ${msg}`)
    }

    const data = await res.json()
    const imageUrl = data?.data?.[0]?.url
    
    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E')
    }

    // Download the generated image
    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) {
      throw new Error(`Failed to download image: ${imageRes.status}`)
    }

    return Buffer.from(await imageRes.arrayBuffer())
  }
}

// Provider selection with proper trimming
export async function generateText(prompt: string, options?: { max_new_tokens?: number; temperature?: number; model?: string }): Promise<string> {
  const provider = (process.env.AGENTS_TEXT_PROVIDER || 'hf').trim().replace(/\n/g, '')
  
  console.log('🔧 Text provider detected:', provider, 'vs expected: openai')
  
  if (provider === 'openai') {
    console.log('✅ Using OpenAI for text generation')
    return openaiText(prompt, options)
  } else {
    console.log('⚠️ Falling back to Hugging Face for text generation')
    return hfGenerateText(prompt, options)
  }
}

export async function generateImage(prompt: string, options?: { size?: '1024x1024' | '1792x1024' | '1024x1792'; model?: string; format?: 'png' | 'jpg' }): Promise<Buffer> {
  const provider = (process.env.AGENTS_IMAGE_PROVIDER || 'hf').trim().replace(/\n/g, '')
  
  console.log('🔧 Image provider detected:', provider, 'vs expected: openai')
  
  if (provider === 'openai') {
    console.log('✅ Using OpenAI for image generation')
    return openaiImage(prompt, { size: options?.size })
  } else {
    console.log('⚠️ Falling back to Hugging Face for image generation')
    return hfGenerateImage(prompt, { model: options?.model, format: options?.format })
  }
}


