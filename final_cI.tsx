"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback, type ChangeEvent, type KeyboardEvent } from "react"
import { marked } from "marked"
import { SendIcon, PaperclipIcon } from "@heroicons/react/24/solid"

interface ChatInterfaceProps {
  onSendMessage: (message: string) => void
  messages: { id: string; text: string; sender: "user" | "bot" }[]
  isLoading: boolean
  mode?: "default" | "elearning"
  referenceStatus?: string
  onShowReferenceModal?: () => void
  onClearChat: () => void
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onSendMessage,
  messages,
  isLoading,
  mode = "default",
  referenceStatus = "",
  onShowReferenceModal,
  onClearChat,
}) => {
  const [inputMessage, setInputMessage] = useState("")
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Scroll to the bottom of the chat container when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const onInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(event.target.value)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      if (inputMessage.trim()) {
        onSendMessage(inputMessage)
        setInputMessage("")
        adjustTextareaHeight()
      }
    }
  }

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputMessage, adjustTextareaHeight])

  const handleDownloadImage = (imageUrl: string) => {
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `generated-image-${Date.now()}.png`
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const processMessageContent = (content: string) => {
    // Configure marked options for better formatting
    marked.setOptions({
      breaks: true, // Convert \n to <br>
      gfm: true, // GitHub flavored markdown
    })

    // Convert markdown to HTML
    let html = marked(content)

    // Add download button to generated images
    if (content.includes("generated-image-container")) {
      const imgMatch = content.match(/src="([^"]+)"/)
      if (imgMatch) {
        const imageUrl = imgMatch[1]
        html = html.replace(
          "</div>",
          `<button 
            onclick="(function(url) { 
              const link = document.createElement('a'); 
              link.href = url; 
              link.download = 'generated-image-' + Date.now() + '.png'; 
              link.target = '_blank'; 
              document.body.appendChild(link); 
              link.click(); 
              document.body.removeChild(link); 
            })('${imageUrl}')"
            style="margin-top: 8px; background-color: #6f39cd; color: white; padding: 6px 12px; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;"
          >
            Download Image
          </button></div>`,
        )
      }
    }

    return html
  }

  const onSendMessageWrapper = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage)
      setInputMessage("")
      adjustTextareaHeight()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-300 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-gray-900 text-sm font-medium">Chat Assistant</h2>
          {mode === "elearning" && <span className="text-xs text-gray-500">{referenceStatus}</span>}
        </div>
        <button
          onClick={onClearChat}
          className="text-white text-xs border border-white/50 bg-[#6f39cd] px-2 py-1 rounded"
        >
          Clear Chat
        </button>
      </div>

      {/* Chat Messages */}
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className={`mb-3 ${message.sender === "user" ? "text-right" : "text-left"}`}>
            <div
              className={`inline-block rounded-xl p-3 text-sm max-w-2/3 break-words ${
                message.sender === "user"
                  ? "bg-[#6f39cd] text-white rounded-br-none"
                  : "bg-gray-200 text-gray-800 rounded-bl-none"
              }`}
              dangerouslySetInnerHTML={{
                __html: processMessageContent(message.text),
              }}
            />
          </div>
        ))}
        {isLoading && (
          <div className="text-left">
            <div className="inline-block rounded-xl p-3 text-sm max-w-2/3 bg-gray-200 text-gray-800 rounded-bl-none">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3 flex gap-2">
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
        {mode === "elearning" && (
          <button
            onClick={onShowReferenceModal}
            className="flex items-center justify-center gap-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 px-3 rounded-md bg-white hover:bg-gray-50"
            title="Upload reference content"
          >
            <PaperclipIcon size={14} />
            Ref
          </button>
        )}
        <button
          onClick={onSendMessageWrapper}
          disabled={isLoading || !inputMessage.trim()}
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
