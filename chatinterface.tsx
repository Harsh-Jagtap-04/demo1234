"use client"

import type React from "react"
import { useRef, useEffect } from "react"
import type { Message, ChatMode } from "@/app/(routes)/promptbuilder/types"
import { SendIcon } from "../../../public/svgs"
import { PaperclipIcon } from "lucide-react"

interface ChatInterfaceProps {
  messages: Message[]
  inputMessage: string
  isLoading: boolean
  mode: ChatMode
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSendMessage: () => void
  onClearChat: () => void
  onShowReferenceModal: () => void
  onGenerateImage: (prompt: string) => void
  onGenerateContent: () => void
  generatedImageUrl: string
  generatedContent: string
  isGeneratingImage: boolean
  isGeneratingContent: boolean
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
  referenceStatus,
  messagesEndRef,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Handle Enter key to send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSendMessage()
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "60px"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [inputMessage])

  // Check if we should show action buttons (after first user message and AI response)
  const shouldShowActionButtons = messages.length >= 4

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full min-h-[80vh]">
      <div className="bg-gray-50 border-b border-gray-300 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-gray-900 text-sm font-medium">Chat</h2>
          {mode === "elearning" && (
            <div className="flex items-center gap-2">
              <button
                onClick={onShowReferenceModal}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 px-2 py-1 rounded"
                title="Upload reference content"
              >
                <PaperclipIcon size={12} />
                Reference
              </button>
              <span className="text-xs text-gray-500">{referenceStatus}</span>
            </div>
          )}
        </div>
        <button
          onClick={onClearChat}
          className="text-white text-xs border border-white/50 bg-[#6f39cd] px-2 py-1 rounded"
        >
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((message, index) => (
          <div key={index}>
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-[#6f39cd] text-white self-end ml-auto"
                  : "bg-gray-100 text-gray-800 self-start"
              }`}
            >
              <div className="text-sm" dangerouslySetInnerHTML={{ __html: message.content }}></div>
            </div>

            {/* Show action buttons after every AI response */}
            {message.role === "assistant" && (
              <div className="mt-3 flex flex-col gap-2">
                {mode === "image" && (
                  <button
                    onClick={() => onGenerateImage(message.content)}
                    disabled={isGeneratingImage}
                    className="bg-[#6f39cd] text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed self-start"
                  >
                    {isGeneratingImage ? "Generating Image..." : "Generate Image from Chat"}
                  </button>
                )}

                {(mode === "elearning" || mode === "outline") && (
                  <button
                    onClick={onGenerateContent}
                    disabled={isGeneratingContent}
                    className="bg-[#6f39cd] text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed self-start"
                  >
                    {isGeneratingContent ? "Generating..." : "Generate Content from Chat"}
                  </button>
                )}

                {/* Show generated image */}
                {mode === "image" && generatedImageUrl && (
                  <div className="mt-3 bg-gray-50 p-4 rounded-md max-w-md">
                    <img
                      src={generatedImageUrl || "/placeholder.svg"}
                      alt="Generated image"
                      className="max-w-full h-auto rounded-md"
                    />
                  </div>
                )}

                {/* Show generated content */}
                {(mode === "elearning" || mode === "outline") && generatedContent && (
                  <div className="mt-3 bg-gray-50 p-4 rounded-md max-w-full">
                    <h4 className="text-sm font-medium mb-2">Generated Content:</h4>
                    <div className="text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">{generatedContent}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="self-start p-3">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
              <span
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></span>
              <span
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-3 flex gap-2">
        <textarea
          ref={textareaRef}
          value={inputMessage}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 p-2 border border-gray-300 rounded-md resize-none text-sm focus:outline-none focus:ring-2 focus:ring-[#6f39cd] focus:border-transparent"
          rows={1}
        />
        <button
          onClick={onSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="bg-[#6637B8] text-white px-4 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <SendIcon
            className={`relative top-2 -rotate-45 -translate-y-1/2 cursor-pointer hover:scale-110 transition`}
            width={24}
            height={24}
            alt="send button"
          />
        </button>
      </div>
    </div>
  )
}

export default ChatInterface
