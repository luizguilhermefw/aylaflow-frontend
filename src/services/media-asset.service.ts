import api from './api'

export interface MediaAsset {
  id: string
  originalName: string
  mimeType: string
  sizeBytes: number
  status: string
  expiresAt?: string | null
  createdAt?: string
}

export const mediaAssetService = {
  async uploadImage(file: File): Promise<MediaAsset> {
    const formData = new FormData()
    formData.append('file', file)

    const { data } = await api.post<MediaAsset>('/media-assets', formData)
    return data
  },
}
