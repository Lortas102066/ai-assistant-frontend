import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Chat API
export const chatAPI = {
  sendMessage: async (data: {
    message: string
    session_id?: string
    user_id?: string
    input_type?: string
  }) => {
    const response = await api.post('/api/chat', data)
    return response.data
  },

  getHistory: async (sessionId: string) => {
    const response = await api.get(`/api/history/${sessionId}`)
    return response.data
  },
}

// Upload API
export const uploadAPI = {
  uploadFile: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getUploadStatus: async () => {
    const response = await api.get('/api/upload/status')
    return response.data
  },
}

// Speech API
export const speechAPI = {
  transcribe: async (audioBlob: Blob): Promise<{ text: string; success: boolean }> => {
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.webm')
    
    const response = await api.post('/api/speech/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  synthesize: async (text: string, language: string = 'en'): Promise<Blob> => {
    const response = await api.post('/api/speech/synthesize', 
      { text, language },
      {
        responseType: 'blob',
      }
    )
    return response.data
  },
}

export default api