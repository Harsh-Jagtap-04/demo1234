"use client"

import type React from "react"
import { useRef, useEffect } from "react"
import type { Message, ChatMode } from "@/app/(routes)/promptbuilder/types"
import { SendIcon } from "../../../public/svgs"
import { PaperclipIcon } from "lucide-react"
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

  const getGenerateButtonText = () => {
    switch (mode) {
      case "image":
        return "Generate Image"
      case "elearning":
        return "Generate Storyboard"
      case "outline":
        return "Generate Outline"
      default:
        return "Generate"
    }
  }

  const getGeneratingText = () => {
    switch (mode) {
      case "image":
        return "Generating image..."
      case "elearning":
        return "Generating storyboard..."
      case "outline":
        return "Generating outline..."
      default:
        return "Generating..."
    }
  }

  const handleGenerate = (message: Message, index: number) => {
    if (mode === "image") {
      onGenerateImage(message.content, index)
    } else {
      onGenerateContent(index)
    }
  }

  const processMessageContent = (content: string) => {
    // Configure marked options for better formatting
    marked.setOptions({
      breaks: true, // Convert \n to <br>
      gfm: true, // GitHub flavored markdown
    })

    // Convert markdown to HTML
    return marked(content)
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full min-h-[80vh]">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-300 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-gray-900 text-sm font-medium">Chat Assistant</h2>
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
          Clear Chat
        </button>
      </div>

      {/* Messages */}
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
              <div
                className="text-sm prose prose-sm max-w-none prose-headings:text-inherit prose-p:text-inherit prose-strong:text-inherit prose-ul:text-inherit prose-li:text-inherit"
                dangerouslySetInnerHTML={{ __html: processMessageContent(message.content) }}
              />
{message.content.includes("generated-image-container") && (
  <div className="mt-2">
    <a
      href={generatedImageUrl}
      download="generated-image.png"
      className="text-xs text-blue-600 hover:underline"
    >
      Download Image
    </a>
  </div>
)}

            </div>

            {/* Generate button - only show for assistant messages with final prompt */}
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
                        <span
                          className="w-2 h-2 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: "0s" }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        ></span>
                      </div>
                      {getGeneratingText()}
                    </span>
                  ) : (
                    getGenerateButtonText()
                  )}
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
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

      {/* Input */}
<div className="border-t border-gray-200 p-3 flex gap-2 items-start">
        <textarea
          ref={textareaRef}
          value={inputMessage}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 p-2 border border-gray-300 rounded-md resize-none text-sm focus:outline-none focus:ring-2 focus:ring-[#6f39cd] focus:border-transparent"
          rows={1}
          disabled={isLoading}
        />
        <div className="flex flex-col gap-1 items-center">
          {mode === "elearning" && (
            <button
              onClick={onShowReferenceModal}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 px-2 py-1 rounded"
              title="Upload reference content"
            >
              <PaperclipIcon size={12} />
              Reference
            </button>
          )}
          <button
            onClick={onSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="bg-[#6637B8] text-white px-3 py-1 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <SendIcon
              className="relative top-2 -rotate-45 -translate-y-1/2 cursor-pointer hover:scale-110 transition"
              width={20}
              height={20}
              alt="send button"
            />
          </button>
        </div>
      </div>
    </div>
  )