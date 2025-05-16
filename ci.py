"use client"

import type React from "react"
import { useRef, useEffect } from "react"
import type { Message } from "../types"

interface ChatInterfaceProps {
  messages: Message[]
  inputMessage: string
  isLoading: boolean
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSendMessage: () => void
  onClearChat: () => void
  messagesEndRef: React.RefObject<HTMLDivElement>
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  inputMessage,
  isLoading,
  onInputChange,
  onSendMessage,
  onClearChat,
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

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-[600px]">
      <div className="bg-[#1A3150] px-4 py-3 flex justify-between items-center">
        <h2 className="text-white text-sm font-medium">Chat</h2>
        <button
          onClick={onClearChat}
          className="text-white text-xs border border-white/50 px-2 py-1 rounded hover:bg-white/10 transition-colors"
        >
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-[80%] p-3 rounded-lg ${
              message.role === "user" ? "bg-[#1A3150] text-white self-end" : "bg-gray-100 text-gray-800 self-start"
            }`}
          >
            <div className="text-sm">{message.content}</div>
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
          className="flex-1 p-2 border border-gray-300 rounded-md resize-none text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3150] focus:border-transparent"
          rows={1}
        />
        <button
          onClick={onSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="bg-[#1A3150] text-white px-4 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default ChatInterface
