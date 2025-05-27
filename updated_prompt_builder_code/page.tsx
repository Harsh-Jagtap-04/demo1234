// page.tsx

"use client"

import { useState, useRef, useEffect } from "react"
import ModeSelector from "@/components/promptBuilder/ModeSelector"
import ChatInterface from "@/components/promptBuilder/ChatInterface"
import ReferenceUploadModal from "@/components/promptBuilder/ReferenceUploadModal"
import type { Message, ChatMode } from "./types"
import Layout from "@/components/Layout/Layout"
import dynamic from "next/dynamic"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "react-toastify"
import { getImageId } from "@/services/user/getImageId"
import { logout } from "@/redux/features/authSlice"

function PromptBuilder() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<ChatMode>("outline")
  const [referenceContent, setReferenceContent] = useState("")
  const [referenceStatus, setReferenceStatus] = useState("No reference content loaded.")
  const [generatedImageUrl, setGeneratedImageUrl] = useState("")
  const [generatedContent, setGeneratedContent] = useState("")
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isGeneratingContent, setIsGeneratingContent] = useState(false)
  const [generatingImageForMessage, setGeneratingImageForMessage] = useState<number | null>(null)
  const [generatingContentForMessage, setGeneratingContentForMessage] = useState<number | null>(null)
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize or scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle clearing chat
  const clearChat = async (newMode?: ChatMode) => {
    try {
      const modeToUse = newMode || mode

      await fetch("/api/user/prompt_builder/clear_prompt_chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: modeToUse }),
      })

      let initialUser = ""
      let initialBot = ""
      if (modeToUse === "image") {
        initialUser = "Hi, I want to create an AI-generated image, but I don't know how to describe it well."
        initialBot = `I'm here to help you with your image needs. What would you like to create?`
      } else if (modeToUse === "elearning") {
        initialUser = "Hi, I need help creating content for an e-learning course."
        initialBot = `I'm here to help you with your elearning needs. What would you like to create?`
      } else {
        initialUser = "Hi, I need help creating an outline for an e-learning course."
        initialBot = `I'm here to help you with your outline needs. What would you like to create?`
      }

      setMessages([
        { role: "user", content: initialUser },
        { role: "assistant", content: initialBot },
      ])
      setReferenceContent("")
      setReferenceStatus("No reference content loaded.")
      setGeneratedImageUrl("")
      setGeneratedContent("")
      setInputMessage("")
    } catch (error) {
      console.error("Error clearing chat:", error)
      toast.error("Failed to clear chat. Please try again.")
    }
  }

  // Send user message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return
    const userMsg: Message = { role: "user", content: inputMessage }
    setMessages((prev) => [...prev, userMsg])
    setInputMessage("")
    setIsLoading(true)
    try {
      // Replace with actual API call logic
      const response = await fetch("/api/user/prompt_builder/send_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, mode, referenceContent }),
      })
      const data = await response.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }])
    } catch (e) {
      console.error(e)
      toast.error("Failed to send message.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <ModeSelector currentMode={mode} onChange={setMode} onClear={() => clearChat(mode)} />

      <ChatInterface
        messages={messages}
        inputMessage={inputMessage}
        isLoading={isLoading}
        mode={mode}
        onInputChange={(e) => setInputMessage(e.target.value)}
        onSendMessage={handleSendMessage}
        onClearChat={() => clearChat()}
        onShowReferenceModal={() => setIsReferenceModalOpen(true)}
        onGenerateImage={() => {}}
        onGenerateContent={() => {}}
        generatedImageUrl={generatedImageUrl}
        generatedContent={generatedContent}
        isGeneratingImage={isGeneratingImage}
        isGeneratingContent={isGeneratingContent}
        generatingImageForMessage={generatingImageForMessage}
        generatingContentForMessage={generatingContentForMessage}
        referenceStatus={referenceStatus}
        messagesEndRef={messagesEndRef}
      />

      <ReferenceUploadModal
        open={isReferenceModalOpen}
        onClose={() => setIsReferenceModalOpen(false)}
        onUpload={(content: string) => {
          setReferenceContent(content)
          setReferenceStatus("Reference content loaded.")
          setIsReferenceModalOpen(false)
        }}
      />
    </Layout>
  )
}

export default dynamic(() => Promise.resolve(PromptBuilder), { ssr: false })
