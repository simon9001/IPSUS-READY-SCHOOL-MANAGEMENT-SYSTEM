import crypto from 'node:crypto'

export interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
}

/**
 * Uploads an image (base64 data URI or image URL) directly to Cloudinary
 * using HMAC SHA1 signature with the configured API key and secret.
 */
export async function uploadToCloudinary(
  fileBase64OrUrl: string,
  folder = 'school_passports',
): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'vxfoi1gm'
  const apiKey = process.env.CLOUDINARY_API_KEY || '177843973847651'
  const apiSecret = process.env.CLOUDINARY_API_SECRET || 'CllM0L6ZoyHm65VuAeBvisk_2sg'

  const timestamp = Math.floor(Date.now() / 1000)
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
  const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex')

  const formData = new FormData()
  formData.append('file', fileBase64OrUrl)
  formData.append('api_key', apiKey)
  formData.append('timestamp', String(timestamp))
  formData.append('folder', folder)
  formData.append('signature', signature)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Cloudinary upload failed: ${errText}`)
  }

  const result = (await response.json()) as CloudinaryUploadResult
  return result.secure_url
}
