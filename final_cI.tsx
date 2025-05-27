// ClearChat updated to reset reference content regardless of mode
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
  const authenticatedUser = useSelector((state: any) => state.auth.user)

  const [mode, setMode] = useState<ChatMode>("image")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch()

  const [referenceContent, setReferenceContent] = useState("")
  const [referenceStatus, setReferenceStatus] = useState("No reference content loaded.")
  const [showReferenceModal, setShowReferenceModal] = useState(false)

  const [generatedImageUrl, setGeneratedImageUrl] = useState("")
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [generatingImageForMessage, setGeneratingImageForMessage] = useState<number | null>(null)

  const [generatedContent, setGeneratedContent] = useState("")
  const [isGeneratingContent, setIsGeneratingContent] = useState(false)
  const [generatingContentForMessage, setGeneratingContentForMessage] = useState<number | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    let initialMessage = ""
    if (mode === "image") {
      initialMessage = "Hi, I want to create an AI-generated image, but I don't know how to describe it well."
    } else if (mode === "elearning") {
      initialMessage = "Hi, I need help creating content for an e-learning course."
    } else if (mode === "outline") {
      initialMessage = "Hi, I need help creating an outline for an e-learning course."
    }

    setMessages([
      { role: "user", content: initialMessage },
      {
        role: "assistant",
        content: `I'm here to help you with your ${mode} needs. What would you like to create?`,
      },
    ])

    setGeneratedContent("")
    setGeneratedImageUrl("")
    setReferenceContent("")
    setReferenceStatus("No reference content loaded.")
  }, [mode])

  const handleModeChange = (newMode: ChatMode) => {
    if (newMode !== mode) {
      setMode(newMode)
      clearChat(newMode)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = { role: "user" as const, content: inputMessage }
    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response: any = await fetch("/api/user/prompt_builder/prompt_chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authenticatedUser?.token}`,
        },
        body: JSON.stringify({
          message: inputMessage,
          mode,
          referenceContent: mode === "elearning" ? referenceContent : undefined,
        }),
      })

      const data = await response.json()

      if (data?.success) {
        const assistantMessage = {
          role: "assistant" as const,
          content: data.response,
          isFinalPrompt: data.is_final_prompt,
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        toast.error(data.message || "Failed to get response from assistant")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request. Please try again.",
        },
      ])
      toast.error("Failed to get response from assistant")
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = async (newMode?: ChatMode) => {
    try {
      const modeToUse = newMode || mode

      await fetch("/api/user/prompt_builder/clear_prompt_chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: modeToUse }),
      })

      let initialMessage = ""
      if (modeToUse === "image") {
        initialMessage = "Hi, I want to create an AI-generated image, but I don't know how to describe it well."
      } else if (modeToUse === "elearning") {
        initialMessage = "Hi, I need help creating content for an e-learning course."
      } else if (modeToUse === "outline") {
        initialMessage = "Hi, I need help creating an outline for an e-learning course."
      }

      setMessages([
        { role: "user", content: initialMessage },
        {
          role: "assistant",
          content: `I'm here to help you with your ${modeToUse} needs. What would you like to create?`,
        },
      ])

      setReferenceContent("")
      setReferenceStatus("No reference content loaded.")
      setGeneratedContent("")
      setGeneratedImageUrl("")
    } catch (error) {
      console.error("Error clearing chat:", error)
    }
  }

  const handleGenerateImage = async (prompt: string, messageIndex?: number) => { /* unchanged */ }

  const handleGenerateContent = async (messageIndex?: number) => { /* unchanged */ }

  const handleReferenceUpload = (content: string) => {
    setReferenceContent(content)
    setReferenceStatus("Reference content loaded.")
    toast.success("Reference content uploaded successfully")
  }

  return (
    <Layout>
      <div className="prompt-builder-container">
        <ModeSelector mode={mode} onModeChange={handleModeChange} />
        <ChatInterface
          messages={messages}
          inputMessage={inputMessage}
          isLoading={isLoading}
          mode={mode}
          onInputChange={(e) => setInputMessage(e.target.value)}
          onSendMessage={handleSendMessage}
          onClearChat={clearChat}
          onShowReferenceModal={() => setShowReferenceModal(true)}
          onGenerateImage={handleGenerateImage}
          onGenerateContent={handleGenerateContent}
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
          isOpen={showReferenceModal}
          onClose={() => setShowReferenceModal(false)}
          onUpload={handleReferenceUpload}
        />
      </div>
    </Layout>
  )
}

export default dynamic(() => Promise.resolve(PromptBuilder), { ssr: false })
