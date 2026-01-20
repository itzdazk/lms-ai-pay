// frontend/src/lib/api/upload.ts
import apiClient from './client'

export interface UploadImageResponse {
    id: string
    userId: number
    type: string
    category: string
    filename: string
    originalName: string
    mimetype: string
    size: number
    path: string
    url: string
    uploadedAt: string
}

/**
 * Upload image file
 * @param file - File to upload
 * @param type - Upload type: 'avatar' | 'thumbnail' | 'system' | 'general' (default: 'general')
 * @returns Upload response with file URL
 */
export async function uploadImage(
    file: File,
    type: 'avatar' | 'thumbnail' | 'system' | 'general' = 'general'
): Promise<UploadImageResponse> {
    const formData = new FormData()
    formData.append('image', file)

    const response = await apiClient.post<{ data: UploadImageResponse }>(
        `/uploads/image?type=${type}`,
        formData
    )

    return response.data.data
}
