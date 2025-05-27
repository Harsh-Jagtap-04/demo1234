// ChatInterface.tsx

"use client"

import type React from "react"
import { useRef, useEffect } from "react"
import type { Message, ChatMode } from "@/app/(routes)/promptbuilder/types"
import { SendIcon } from "../../../public/svgs"
import { PaperclipIcon, DownloadIcon } from "lucide-react"
import { marked } from "marked"

interface ChatInterfaceProps {
  messages: Message[]
  inputMessage: string
  isLoading: boolean
  mode: ChatMode
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSendMessage: () => void
  onClearChat: () => void
  onShowReferenceModal: () => void
  onGenerateImage: (prompt: string, messageIndex?: number) => void
  onGenerateContent: (messageIndex?: number) => void
  generatedImageUrl: string
  generatedContent: string
  isGeneratingImage: boolean
  isGeneratingContent: boolean
  generatingImageForMessage: number | null
  generatingContentForMessage: number | null
  referenceStatus: string
  messagesEndRef: React.RefObject<HTMLDivElement>
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  inputMessage,
  isLoading,
  mode,
  onInputChange,
  onSendMessage,
  onClearChat,
  onShowReferenceModal,
  onGenerateImage,
  onGenerateContent,
  generatedImageUrl,
  generatedContent,
  isGeneratingImage,
  isGeneratingContent,
  generatingImageForMessage,
  generatingContentForMessage,
  referenceStatus,
  messagesEndRef,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSendMessage()
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "60px"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [inputMessage])

  const getGenerateButtonText = () => {
    switch (mode) {
      case "image": return "Generate Image"
      case "elearning": return "Generate Storyboard"
      case "outline": return "Generate Outline"
      default: return "Generate"
    }
  }

  const getGeneratingText = () => {
    switch (mode) {
      case "image": return "Generating image..."
      case "elearning": return "Generating storyboard..."
      case "outline": return "Generating outline..."
      default: return "Generating..."
    }
  }

  const handleGenerate = (message: Message, index: number) => {
    if (mode === "image") onGenerateImage(message.content, index)
    else onGenerateContent(index)
  }

  const processMessageContent = (content: string) => {
    marked.setOptions({ breaks: true, gfm: true })
    return marked(content)
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full min-h-[80vh]">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-300 px-4 py-3 flex justify-between items-center">
        <div className="flex flex-col">
          <h2 className="text-gray-900 text-sm font-medium">Chat Assistant</h2>
          {referenceStatus !== "No reference content loaded." && (
            <span className="text-xs text-gray-600 mt-1">{referenceStatus}</span>
          )}
        </div>
        <button onClick={onClearChat} className="text-white text-xs bg-[#6f39cd] px-2 py-1 rounded">
          Clear Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((message, index) => (
          <div key={index}>
            <div className={`max-w-[80%] p-3 rounded-lg ${message.role === "user" ? "bg-[#6f39cd] text-white self-end" : "bg-gray-100 text-gray-800 self-start"}`}>  
              <div className="text-sm prose max-w-none" dangerouslySetInnerHTML={{ __html: processMessageContent(message.content) }} />
            </div>

            {message.role === "assistant" && message.content.includes("<img") && (
              <div className="mt-2 self-start">
                <a href={message.content.match(/<img src=\"(.*?)\"/)?.[1] || ''} download className="flex items-center gap-1 text-xs">
                  <DownloadIcon size={14} /> Download Image
                </a>
              </div>
            )}

            {message.role === "assistant" && message.isFinalPrompt && (
              <div className="mt-3 flex flex-col gap-2">
                <button
                  onClick={() => handleGenerate(message, index)}
                  disabled={isGeneratingImage || isGeneratingContent}
                  className="bg-[#6f39cd] text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed self-start"
                >
                  {generatingImageForMessage === index || generatingContentForMessage === index ? (
                    <span className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                        <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                        <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                      </div>
                      {getGeneratingText()}
                    </span>
                  ) : getGenerateButtonText()}
                </button>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="self-start p-3">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input row */}
      <div className="border-t border-gray-200 p-3 flex items-stretch gap-2">
        <textarea
          ref={textareaRef}
          value={inputMessage}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={1}
          disabled={isLoading}
          className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#6f39cd] focus:border-transparent resize-none"
        />

        {mode === "elearning" && (
          <button
            onClick={onShowReferenceModal}
            title={referenceStatus}
            className="h-full flex items-center justify-center border border-gray-300 px-3 rounded-md text-gray-600 hover:text-gray-800"
          >
            <PaperclipIcon size={16} />
          </button>
        )}

        <button
          onClick={onSendMessage}
          disabled={isLoading || !inputMessage.trim()}
          className="h-full flex items-center justify-center bg-[#6637B8] px-3 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <SendIcon width={20} height={20} alt="send" />
        </button>
      </div>
    </div>
  )
}

export default ChatInterface
