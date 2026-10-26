import { afterEach, describe, expect, it, vi } from 'vitest'
import { cloudinaryConfig, uploadToCloudinary } from './cloudinary.js'
import { AppError } from './errors.js'

function stubCloudinaryEnv(values: Partial<Record<'CLOUDINARY_CLOUD_NAME' | 'CLOUDINARY_API_KEY' | 'CLOUDINARY_API_SECRET', string>>) {
  vi.stubEnv('CLOUDINARY_CLOUD_NAME', values.CLOUDINARY_CLOUD_NAME ?? '')
  vi.stubEnv('CLOUDINARY_API_KEY', values.CLOUDINARY_API_KEY ?? '')
  vi.stubEnv('CLOUDINARY_API_SECRET', values.CLOUDINARY_API_SECRET ?? '')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('cloudinaryConfig', () => {
  it('refuses with 503 instead of falling back to a built-in account', () => {
    stubCloudinaryEnv({})
    expect(() => cloudinaryConfig()).toThrow(expect.objectContaining({ statusCode: 503 }))
  })

  it('refuses when only some of the three variables are set', () => {
    stubCloudinaryEnv({ CLOUDINARY_CLOUD_NAME: 'demo', CLOUDINARY_API_KEY: 'key' })
    expect(() => cloudinaryConfig()).toThrow(AppError)
  })

  it('returns the configured credentials', () => {
    stubCloudinaryEnv({ CLOUDINARY_CLOUD_NAME: 'demo', CLOUDINARY_API_KEY: 'key', CLOUDINARY_API_SECRET: 'secret' })
    expect(cloudinaryConfig()).toEqual({ cloudName: 'demo', apiKey: 'key', apiSecret: 'secret' })
  })
})

describe('uploadToCloudinary', () => {
  it('never calls Cloudinary when credentials are missing', async () => {
    stubCloudinaryEnv({})
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    await expect(uploadToCloudinary('data:image/png;base64,AAAA')).rejects.toBeInstanceOf(AppError)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('posts a signed upload to the configured cloud and returns the secure URL', async () => {
    stubCloudinaryEnv({ CLOUDINARY_CLOUD_NAME: 'demo', CLOUDINARY_API_KEY: 'key', CLOUDINARY_API_SECRET: 'secret' })
    const fetchSpy = vi.fn(async () => Response.json({ secure_url: 'https://res.cloudinary.com/demo/x.png', public_id: 'x' }))
    vi.stubGlobal('fetch', fetchSpy)

    const url = await uploadToCloudinary('data:image/png;base64,AAAA', 'avatars')

    expect(url).toBe('https://res.cloudinary.com/demo/x.png')
    const [endpoint, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit]
    expect(endpoint).toBe('https://api.cloudinary.com/v1_1/demo/image/upload')
    const body = init.body as FormData
    expect(body.get('api_key')).toBe('key')
    expect(body.get('folder')).toBe('avatars')
    expect(body.get('signature')).toMatch(/^[0-9a-f]{40}$/)
  })
})
