/**
 * Lightweight Hugging Face Inference helpers for text and image generation.
 * Requires env vars:
 * - HUGGINGFACE_API_TOKEN (bearer token)
 * - HUGGINGFACE_TEXT_MODEL (e.g., meta-llama/Meta-Llama-3-8B-Instruct)
 * - HUGGINGFACE_IMAGE_MODEL (e.g., stabilityai/stable-diffusion-2)
 */

const HF_BASE = 'https://api-inference.huggingface.co/models';

function getToken(): string {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) throw new Error('HUGGINGFACE_API_TOKEN is not set');
  return token;
}

function getTextUrl(modelFromOptions?: string) {
  const endpoint = process.env.HUGGINGFACE_TEXT_ENDPOINT || process.env.HF_TEXT_ENDPOINT
  if (endpoint) return endpoint.trim()
  const model = modelFromOptions || process.env.HUGGINGFACE_TEXT_MODEL || 'HuggingFaceH4/zephyr-7b-beta'
  return `${HF_BASE}/${encodeURIComponent(model)}`
}

export async function hfGenerateText(prompt: string, options?: { model?: string; max_new_tokens?: number; temperature?: number }) {
  const url = getTextUrl(options?.model);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: options?.max_new_tokens ?? 1200,
        temperature: options?.temperature ?? 0.6,
        return_full_text: false
      }
    })
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`HF text gen error: ${res.status} ${msg}`);
  }

  const data = await res.json();
  // Inference API may return array of generated_text objects
  const text = Array.isArray(data) ? (data[0]?.generated_text ?? '') : (data?.generated_text ?? JSON.stringify(data));
  return text as string;
}

function getImageUrl(modelFromOptions?: string) {
  const endpoint = process.env.HUGGINGFACE_IMAGE_ENDPOINT || process.env.HF_IMAGE_ENDPOINT
  if (endpoint) return endpoint.trim()
  const model = modelFromOptions || process.env.HUGGINGFACE_IMAGE_MODEL || 'runwayml/stable-diffusion-v1-5'
  return `${HF_BASE}/${encodeURIComponent(model)}`
}

export async function hfGenerateImage(prompt: string, options?: { model?: string; format?: 'png' | 'jpg' }) {
  const url = getImageUrl(options?.model);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: prompt
    })
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`HF image gen error: ${res.status} ${msg}`);
  }

  // Image models typically return binary; but some community models return base64/json.
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    const b64 = data?.[0]?.image_base64 || data?.image_base64;
    if (!b64) throw new Error('Unexpected HF image response');
    return Buffer.from(b64, 'base64');
  }

  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}


