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

  // State for chat mode
  const [mode, setMode] = useState<ChatMode>("image")

  // State for chat
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch()

  // State for reference content (for e-learning mode)
  const [referenceContent, setReferenceContent] = useState("")
  const [referenceStatus, setReferenceStatus] = useState("No reference content loaded.")
  const [showReferenceModal, setShowReferenceModal] = useState(false)

  // State for image generation - track which message is generating
  const [generatedImageUrl, setGeneratedImageUrl] = useState("")
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [generatingImageForMessage, setGeneratingImageForMessage] = useState<number | null>(null)

  // State for content generation
  const [generatedContent, setGeneratedContent] = useState("")
  const [isGeneratingContent, setIsGeneratingContent] = useState(false)
  const [generatingContentForMessage, setGeneratingContentForMessage] = useState<number | null>(null)

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load initial message based on mode
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

    // Reset generated content when mode changes
    setGeneratedContent("")
    setGeneratedImageUrl("")
    setReferenceContent("")
    setReferenceStatus("No reference content loaded.")
  }, [mode])

  // Handle mode change
  const handleModeChange = (newMode: ChatMode) => {
    if (newMode !== mode) {
      setMode(newMode)
      clearChat(newMode)
    }
  }

  // Handle sending a message
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
          isFinalPrompt: data.is_final_prompt, // Add this flag
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

  // Handle clearing chat
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

      // Clear generated content and images states
      setGeneratedContent("")
      setGeneratedImageUrl("")
    } catch (error) {
      console.error("Error clearing chat:", error)
    }
  }

  // Handle generating image from prompt
  const handleGenerateImage = async (prompt: string, messageIndex?: number) => {
    if (!prompt.trim() || isGeneratingImage) return

    // Add user message showing the action
    const actionMessage = {
      role: "user" as const,
      content: "Generate image from above prompt",
    }
    setMessages((prev) => [...prev, actionMessage])

    setIsGeneratingImage(true)
    setGeneratingImageForMessage(messageIndex ?? null)
    setGeneratedImageUrl("")

    try {
      const response: any = await getImageId(
        authenticatedUser?._id,
        "photo",
        "",
        prompt,
        "1",
        authenticatedUser?.token,
        dispatch,
        logout,
        true,
      )
      if (response?.success) {
        setGeneratedImageUrl(response.data?.imageUrl)
        
        // Add the generated image as a message to the chat
        const imageMessage = {
          role: "assistant" as const,
          content: `<div class="generated-image-container">
            <h4 style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">Generated Image:</h4>
            <img src="${response.data?.imageUrl}" alt="Generated image" style="max-width: 100%; height: auto; border-radius: 6px;" />
          </div>`,
        }
        setMessages(prev => [...prev, imageMessage])
      } else {
        toast.error(response?.message || "Failed to generate image")
      }
    } catch (error) {
      console.error("Error generating image:", error)
      toast.error("Failed to generate image")
    } finally {
      setIsGeneratingImage(false)
      setGeneratingImageForMessage(null)
    }
  }

  // Handle generating content from prompt
  const handleGenerateContent = async (messageIndex?: number) => {
    if (isGeneratingContent || messages.length === 0) return

    // Find the last assistant message with final prompt
    const lastAssistantMessage = [...messages].reverse().find((msg) => msg.role === "assistant" && msg.isFinalPrompt)
    if (!lastAssistantMessage) {
      toast.error("No final prompt found")
      return
    }

    // Add user message showing the action
    const actionText = mode === "elearning" ? "Generate storyboard from above prompt" : "Generate outline from above prompt"
    const actionMessage = {
      role: "user" as const,
      content: actionText,
    }
    setMessages((prev) => [...prev, actionMessage])

    setIsGeneratingContent(true)
    setGeneratingContentForMessage(messageIndex ?? null)
    setGeneratedContent("")

    try {
      const endpoint =
        mode === "elearning"
          ? "/api/user/prompt_builder/generate_storyboard"
          : "/api/user/prompt_builder/generate_outline"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authenticatedUser?.token}`,
        },
        body: JSON.stringify({
          prompt: lastAssistantMessage.content,
          referenceContent: mode === "elearning" ? referenceContent : undefined,
        }),
      })

      const data = await response.json()
      
      if (data?.success) {
        const contentData = data.content || data.response || data.data || data.result || ""
        
        if (!contentData) {
          console.error("No content found in response:", data)
          toast.error("No content received from API")
          return
        }
        
        setGeneratedContent(contentData)
        
        // Add the generated content as a message to the chat
        const contentTitle = mode === "elearning" ? "Generated Storyboard:" : "Generated Outline:"
        const contentMessage = {
          role: "assistant" as const,
          content: `<div class="generated-content-container">
            <h4 style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">${contentTitle}</h4>
            <div style="white-space: pre-wrap; font-size: 14px;">${contentData}</div>
          </div>`,
        }
        setMessages(prev => [...prev, contentMessage])
      } else {
        console.error("API Error:", data)
        toast.error(data.message || "Failed to generate content")
      }
    } catch (error) {
      console.error("Error generating content:", error)
      toast.error("Failed to generate content")
    } finally {
      setIsGeneratingContent(false)
      setGeneratingContentForMessage(null)
    }
  }

  // Handle reference content upload
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