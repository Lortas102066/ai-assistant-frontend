'use client'

import { useState, useRef } from 'react'
import { Volume2, FileText, Mic } from 'lucide-react'
import { speechAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface ChatBubbleProps {
  message: string
  speaker: 'user' | 'assistant'
  inputType: 'text' | 'voice' | 'file'
  timestamp: Date
}

export default function ChatBubble({ message, speaker, inputType, timestamp }: ChatBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handlePlayAudio = async () => {
    if (speaker !== 'assistant') return

    try {
      setIsPlaying(true)
      const audioBlob = await speechAPI.synthesize(message)
      const audioUrl = URL.createObjectURL(audioBlob)
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.play()
        
        audioRef.current.onended = () => {
          setIsPlaying(false)
          URL.revokeObjectURL(audioUrl)
        }
      }
    } catch (error) {
      console.error('Audio playback error:', error)
      setIsPlaying(false)
    }
  }

  const getInputTypeIcon = () => {
    switch (inputType) {
      case 'voice':
        return <Mic size={12} className="text-primary" />
      case 'file':
        return <FileText size={12} className="text-green-500" />
      default:
        return null
    }
  }

  const isUser = speaker === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isUser
            ? 'bg-primary text-primary-foreground ml-auto'
            : 'bg-muted'
        }`}
      >
        <div className="flex items-start space-x-2">
          <div className="flex-1">
            <p className="text-sm whitespace-pre-wrap">{message}</p>
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-1">
                {getInputTypeIcon()}
                <span className={`text-xs ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              {!isUser && (
                <Button
                  onClick={handlePlayAudio}
                  disabled={isPlaying}
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-6 w-6 p-0"
                  title="Play audio"
                >
                  <Volume2 
                    size={14} 
                    className={isPlaying ? 'text-primary' : 'text-muted-foreground'} 
                  />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      )}
      
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  )
}