'use client'

import { useState, useRef } from 'react'
import ChatBubble from '@/components/ChatBubble'
import Recorder from '@/components/Recorder'
import { Upload, Send, FileText } from 'lucide-react'
import { chatAPI, uploadAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Message {
  id: string
  speaker: 'user' | 'assistant'
  message: string
  inputType: 'text' | 'voice' | 'file'
  timestamp: Date
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addMessage = (speaker: 'user' | 'assistant', message: string, inputType: 'text' | 'voice' | 'file' = 'text') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      speaker,
      message,
      inputType,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const sendMessage = async (message: string, inputType: 'text' | 'voice' = 'text') => {
    if (!message.trim()) return

    addMessage('user', message, inputType)
    setIsLoading(true)

    try {
      const response = await chatAPI.sendMessage({
        message,
        session_id: sessionId,
        input_type: inputType
      })

      if (response.session_id && !sessionId) {
        setSessionId(response.session_id)
      }

      addMessage('assistant', response.response)
    } catch (error) {
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.')
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
    setInput('')
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    addMessage('user', `Uploaded file: ${file.name}`, 'file')

    try {
      const response = await uploadAPI.uploadFile(file)
      setUploadedFile(file.name)
      addMessage('assistant', 
        `File uploaded successfully! Found ${response.rows_count} rows with columns: ${response.data_preview.columns.join(', ')}`
      )
    } catch (error) {
      addMessage('assistant', 'Sorry, there was an error uploading your file.')
      console.error('Upload error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoiceMessage = (transcription: string) => {
    sendMessage(transcription, 'voice')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-140px)]">
      {/* File Upload Section */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2" size={20} />
              File Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
            >
              <Upload className="mr-2" size={16} />
              Upload CSV ファイル
            </Button>
            
            {uploadedFile && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  ✓ {uploadedFile}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat Section */}
      <div className="lg:col-span-3 flex flex-col">
        <Card className="flex-1 flex flex-col">
          {/* Chat Messages */}
          <CardContent className="flex-1 overflow-y-auto space-y-4 pt-6">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground mt-8">
                <p>Welcome to AI Assistant! 👋</p>
                <p className="text-sm mt-2">Upload a CSV file or start chatting to begin.</p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message.message}
                  speaker={message.speaker}
                  inputType={message.inputType}
                  timestamp={message.timestamp}
                />
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {/* Input Section */}
          <div className="border-t p-4 space-y-4">
            {/* Voice Recorder */}
            <div className="flex justify-center">
              <Recorder onTranscription={handleVoiceMessage} />
            </div>
            
            {/* Text Input */}
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="icon"
              >
                <Send size={16} />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}