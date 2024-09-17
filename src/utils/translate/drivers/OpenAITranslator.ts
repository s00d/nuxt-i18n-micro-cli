// src/utils/drivers/OpenAITranslator.ts

import axios from 'axios'
import type { TranslatorDriver } from './TranslatorDriver'

interface OpenAIChatCompletionResponse {
  choices: Array<{
    message: {
      content: string
      role: string
    }
  }>
  error?: {
    message: string
    type: string
    param: string | null
    code: string | null
  }
}

export class OpenAITranslator implements TranslatorDriver {
  private apiKey: string

  constructor(apiKey: string, _options?: { [key: string]: string }) {
    this.apiKey = apiKey
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: {
      openaiModel?: string
      max_tokens?: number
      temperature?: number
      top_p?: number
      n?: number
      stop?: string | string[]
    },
  ): Promise<string> {
    const url = 'https://api.openai.com/v1/chat/completions'

    const model = options?.openaiModel || 'gpt-3.5-turbo'
    const maxTokens = options?.max_tokens ?? 1000
    const temperature = options?.temperature ?? 0.3

    const messages = [
      {
        role: 'system',
        content: `You are a helpful assistant that translates text from ${fromLang} to ${toLang}.`,
      },
      {
        role: 'user',
        content: text,
      },
    ]

    const body = {
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature,
      ...options, // Включаем дополнительные опции
    }

    try {
      const response = await axios.post<OpenAIChatCompletionResponse>(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      const data = response.data

      if (data.error) {
        throw new Error(`OpenAI API error: ${data.error.message}`)
      }

      return data.choices[0].message.content.trim()
    }
    catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`)
    }
  }
}
