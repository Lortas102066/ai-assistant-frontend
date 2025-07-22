'use client'

import { useState, useRef } from 'react'
import { Mic, MicOff, Square } from 'lucide-react'
import { speechAPI } from '@/lib/api'

interface RecorderProps {
  onTranscription: (text: string) => void
}

export default function Recorder({ onTranscription }: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        setIsProcessing(true)
        
        try {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const transcription = await speechAPI.transcribe(audioBlob)
          onTranscription(transcription.text)
        } catch (error) {
          console.error('Transcription error:', error)
          onTranscription('Sorry, I could not transcribe the audio. Please try again.')
        } finally {
          setIsProcessing(false)
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Recording error:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={toggleRecording}
        disabled={isProcessing}
        className={`p-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-500'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isProcessing ? (
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
        ) : isRecording ? (
          <Square size={20} />
        ) : (
          <Mic size={20} />
        )}
      </button>
      
      {isRecording && (
        <div className="flex items-center space-x-2 text-red-500">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium">Recording...</span>
        </div>
      )}
      
      {isProcessing && (
        <span className="text-sm text-gray-500">Processing...</span>
      )}
    </div>
  )
}