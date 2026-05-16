import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}))

const axiosPostMock = vi.mocked(axios.post)

describe('http translator drivers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('PapagoTranslator maps success response', async () => {
    const { PapagoTranslator } = await import('../../src/core/translate/drivers/PapagoTranslator')
    axiosPostMock.mockResolvedValue({
      data: {
        message: {
          result: {
            translatedText: '안녕',
          },
        },
      },
    })

    const translator = new PapagoTranslator('secret', { clientId: 'client' })
    await expect(translator.translate('Hello', 'en', 'ko')).resolves.toBe('안녕')
    expect(axiosPostMock).toHaveBeenCalledWith(
      'https://openapi.naver.com/v1/papago/n2mt',
      expect.any(URLSearchParams),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Naver-Client-Id': 'client',
          'X-Naver-Client-Secret': 'secret',
        }),
      }),
    )
  })

  it('BaiduTranslator signs request and maps response', async () => {
    const { BaiduTranslator } = await import('../../src/core/translate/drivers/BaiduTranslator')
    axiosPostMock.mockResolvedValue({
      data: {
        trans_result: [{ dst: '你好' }],
      },
    })

    const translator = new BaiduTranslator('key', { appId: 'app' })
    await expect(translator.translate('Hello', 'en', 'zh', { salt: '123' })).resolves.toBe('你好')

    const body = axiosPostMock.mock.calls[0]?.[1] as URLSearchParams
    expect(body.get('appid')).toBe('app')
    expect(body.get('salt')).toBe('123')
    expect(body.get('sign')).toHaveLength(32)
  })

  it('LiltTranslator uses basic auth and segment payload', async () => {
    const { LiltTranslator } = await import('../../src/core/translate/drivers/LiltTranslator')
    axiosPostMock.mockResolvedValue({
      data: {
        translation: [{ target: 'Hola' }],
      },
    })

    const translator = new LiltTranslator('lilt-key')
    await expect(translator.translate('Hello', 'en', 'es', { memoryId: '42' })).resolves.toBe('Hola')
    expect(axiosPostMock).toHaveBeenCalledWith(
      'https://api.lilt.com/v2/translate',
      {
        source: 'Hello',
        source_lang: 'en',
        target_lang: 'es',
        memory_id: 42,
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Basic ${Buffer.from('lilt-key:lilt-key').toString('base64')}`,
        }),
      }),
    )
  })

  it('GoogleTranslator calls REST v2 with API key and batch payload', async () => {
    const { GoogleTranslator } = await import('../../src/core/translate/drivers/GoogleTranslator')
    axiosPostMock.mockResolvedValue({
      data: {
        data: {
          translations: [
            { translatedText: 'Hola' },
            { translatedText: 'Adiós' },
          ],
        },
      },
    })

    const translator = new GoogleTranslator('google-key')
    await expect(translator.translateBatch(['Hello', 'Bye'], 'en', 'es', { format: 'text' })).resolves.toEqual([
      'Hola',
      'Adiós',
    ])

    expect(axiosPostMock).toHaveBeenCalledWith(
      'https://translation.googleapis.com/language/translate/v2',
      {
        q: ['Hello', 'Bye'],
        target: 'es',
        format: 'text',
        source: 'en',
      },
      expect.objectContaining({
        params: { key: 'google-key' },
      }),
    )
  })

  it('TencentTranslator signs TextTranslate request', async () => {
    const { TencentTranslator } = await import('../../src/core/translate/drivers/TencentTranslator')
    axiosPostMock.mockResolvedValue({
      data: {
        Response: {
          TargetText: '你好',
        },
      },
    })

    const translator = new TencentTranslator('secret-key', { secretId: 'secret-id', region: 'ap-beijing' })
    await expect(translator.translate('Hello', 'en', 'zh')).resolves.toBe('你好')

    const [, body, config] = axiosPostMock.mock.calls[0] ?? []
    expect(body).toEqual({
      SourceText: 'Hello',
      Source: 'en',
      Target: 'zh',
      ProjectId: 0,
    })
    expect(config).toEqual(expect.objectContaining({
      headers: expect.objectContaining({
        'X-TC-Action': 'TextTranslate',
        'X-TC-Region': 'ap-beijing',
        'Authorization': expect.stringMatching(/^TC3-HMAC-SHA256 /),
      }),
    }))
  })

  it('ReversoTranslator maps translation response', async () => {
    const { ReversoTranslator } = await import('../../src/core/translate/drivers/ReversoTranslator')
    axiosPostMock.mockResolvedValue({
      data: {
        translation: ['Привет'],
      },
    })

    const translator = new ReversoTranslator('')
    await expect(translator.translate('Hello', 'en', 'ru')).resolves.toBe('Привет')
    expect(axiosPostMock).toHaveBeenCalledWith(
      'https://api.reverso.net/translate/v1/translation',
      expect.objectContaining({
        from: 'eng',
        to: 'rus',
        input: 'Hello',
      }),
      expect.any(Object),
    )
  })
})
