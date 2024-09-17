import * as crypto from 'node:crypto'
import axios from 'axios'
import type { TranslatorDriver } from './TranslatorDriver'

export class TencentTranslator implements TranslatorDriver {
  private secretId: string
  private secretKey: string
  private region: string

  constructor(apiKey: string, options?: { [key: string]: string }) {
    const [secretId, secretKey] = apiKey.split(':')
    if (!secretId || !secretKey) {
      throw new Error('Tencent Translator requires apiKey in the format "secretId:secretKey".')
    }
    this.secretId = secretId
    this.secretKey = secretKey
    this.region = options?.region || 'ap-guangzhou'
  }

  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    _options?: { [key: string]: any },
  ): Promise<string> {
    const endpoint = 'tmt.tencentcloudapi.com'
    const service = 'tmt'
    const action = 'TextTranslate'
    const version = '2018-03-21'
    const timestamp = Math.floor(Date.now() / 1000)
    const algorithm = 'TC3-HMAC-SHA256'

    const params = {
      SourceText: text,
      Source: fromLang,
      Target: toLang,
      ProjectId: 0,
    }

    const headers: { [key: string]: any } = {
      'Content-Type': 'application/json; charset=utf-8',
      'Host': endpoint,
      'X-TC-Action': action,
      'X-TC-Version': version,
      'X-TC-Timestamp': timestamp.toString(),
      'X-TC-Region': this.region,
    }

    const payload = JSON.stringify(params)
    const canonicalRequest = [
      'POST',
      '/',
      '',
      `content-type:${headers['Content-Type']}\nhost:${headers.Host}\n`,
      'content-type;host',
      crypto.createHash('sha256').update(payload).digest('hex'),
    ].join('\n')

    const date = new Date(timestamp * 1000).toISOString().slice(0, 10)
    const credentialScope = `${date}/${service}/tc3_request`
    const stringToSign = [
      algorithm,
      timestamp.toString(),
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n')

    const kDate = crypto
      .createHmac('sha256', `TC3${this.secretKey}`)
      .update(date)
      .digest()
    const kService = crypto.createHmac('sha256', kDate).update(service).digest()
    const kSigning = crypto.createHmac('sha256', kService).update('tc3_request').digest()
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex')

    const authorization = `${algorithm} Credential=${this.secretId}/${credentialScope}, SignedHeaders=content-type;host, Signature=${signature}`

    headers['Authorization'] = authorization

    try {
      const response = await axios.post(
        `https://${endpoint}`,
        payload,
        { headers },
      )

      const data = response.data

      if (data.Response.Error) {
        throw new Error(`Tencent API error: ${data.Response.Error.Message} (${data.Response.Error.Code})`)
      }

      return data.Response.TargetText
    }
    catch (error: any) {
      throw new Error(`Tencent API error: ${error.message}`)
    }
  }
}
