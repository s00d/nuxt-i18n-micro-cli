import { describe, expect, it } from 'vitest'
import { signTencentCloudTc3 } from '../../src/core/translate/tencent/tc3-sign'

describe('signTencentCloudTc3', () => {
  it('produces stable TC3 authorization for fixed input', () => {
    const authorization = signTencentCloudTc3({
      url: 'https://tmt.tencentcloudapi.com/',
      payload: {
        SourceText: 'Hello',
        Source: 'en',
        Target: 'zh',
        ProjectId: 0,
      },
      timestamp: 1_700_000_000,
      service: 'tmt',
      secretId: 'AKIDTEST',
      secretKey: 'SECRETTEST',
    })

    expect(authorization).toMatch(/^TC3-HMAC-SHA256 Credential=AKIDTEST\/\d{4}-\d{2}-\d{2}\/tmt\/tc3_request, SignedHeaders=content-type;host, Signature=[a-f0-9]{64}$/)
  })
})
