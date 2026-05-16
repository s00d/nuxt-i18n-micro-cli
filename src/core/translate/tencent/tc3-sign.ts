import { createHash, createHmac } from 'node:crypto'

export interface TencentTc3SignInput {
  method?: 'GET' | 'POST'
  url: string
  payload: Record<string, unknown>
  timestamp: number
  service: string
  secretId: string
  secretKey: string
  contentType?: string
}

function sha256Hex(message: string | Buffer, secret = ''): string {
  const hmac = createHmac('sha256', secret)
  return hmac.update(message).digest('hex')
}

function hashHex(message: string | Buffer): string {
  return createHash('sha256').update(message).digest('hex')
}

function getDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function signTencentCloudTc3(input: TencentTc3SignInput): string {
  const {
    method = 'POST',
    url,
    payload,
    timestamp,
    service,
    secretId,
    secretKey,
    contentType = 'application/json',
  } = input

  const urlObj = new URL(url)
  const headers = `content-type:${contentType}\nhost:${urlObj.hostname}\n`
  const signedHeaders = 'content-type;host'
  const payloadHash = hashHex(JSON.stringify(payload))
  const canonicalRequest = [
    method,
    urlObj.pathname || '/',
    urlObj.search.slice(1),
    headers,
    signedHeaders,
    payloadHash,
  ].join('\n')

  const date = getDate(timestamp)
  const stringToSign = [
    'TC3-HMAC-SHA256',
    String(timestamp),
    `${date}/${service}/tc3_request`,
    hashHex(canonicalRequest),
  ].join('\n')

  const kDate = sha256Hex(date, `TC3${secretKey}`)
  const kService = sha256Hex(service, kDate)
  const kSigning = sha256Hex('tc3_request', kService)
  const signature = sha256Hex(stringToSign, kSigning)

  return `TC3-HMAC-SHA256 Credential=${secretId}/${date}/${service}/tc3_request, SignedHeaders=${signedHeaders}, Signature=${signature}`
}
