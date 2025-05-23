"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { CopyButton } from "@/components/copy-button"
import { useUser } from "@clerk/nextjs"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

type ChatMode = "image" | "elearning" | "outline"

const PromptBuilderPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [mode, setMode] = useState<ChatMode>("image")
  const [generatedContent, setGeneratedContent] = useState("")
  const [generatedImageUrl, setGeneratedImageUrl] = useState("")
  const [referenceContent, setReferenceContent] = useState("")
  const [referenceStatus, setReferenceStatus] = useState("No reference content loaded.")
  const [loadingReference, setLoadingReference] = useState(false)
  const [loadingGeneration, setLoadingGeneration] = useState(false)
  const { user } = useUser()

  // Load initial messages on mount
  useEffect(() => {
    clearChat()
  }, [])

  // Handle mode change
  const handleModeChange = (newMode: ChatMode) => {
    if (newMode !== mode) {
      setMode(newMode)
      clearChat(newMode) // Pass the new mode to clearChat
    }
  }

  // Handle clearing chat
  const clearChat = async (newMode?: ChatMode) => {
    try {
      const modeToUse = newMode || mode // Use the passed mode or fall back to the current mode

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

      if (modeToUse === "elearning") {
        setReferenceContent("")
        setReferenceStatus("No reference content loaded.")
      }

      setGeneratedContent("")
      setGeneratedImageUrl("")
    } catch (error) {
      console.error("Error clearing chat:", error)
    }
  }

  // Handle sending a message
  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: ChatMessage = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")

    try {
      setLoadingGeneration(true)
      const response = await fetch("/api/user/prompt_builder/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, mode }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response,
      }
      setMessages((prev) => [...prev, assistantMessage])

      if (mode === "image") {
        setGeneratedImageUrl(data.imageUrl)
      } else {
        setGeneratedContent(data.response)
      }
    } catch (error: any) {
      console.error("Error sending message:", error)
      toast.error(`Error: ${error.message}`)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ])
    } finally {
      setLoadingGeneration(false)
    }
  }

  // Handle loading reference content
  const handleLoadReference = async () => {
    setLoadingReference(true)
    setReferenceStatus("Loading reference content...")
    try {
      const response = await fetch("/api/user/prompt_builder/load_reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setReferenceContent(data.content)
      setReferenceStatus("Reference content loaded.")
    } catch (error: any) {
      console.error("Error loading reference content:", error)
      setReferenceStatus("Error loading reference content.")
      toast.error(`Error: ${error.message}`)
    } finally {
      setLoadingReference(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Prompt Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Select value={mode} onValueChange={handleModeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Image Generation</SelectItem>
                <SelectItem value="elearning">E-Learning Content</SelectItem>
                <SelectItem value="outline">E-Learning Outline</SelectItem>
              </SelectContent>
            </Select>

            {mode === "elearning" && (
              <div className="grid gap-2">
                <Button onClick={handleLoadReference} disabled={loadingReference}>
                  {loadingReference ? "Loading..." : "Load Reference Content"}
                </Button>
                <Badge>{referenceStatus}</Badge>
                <Textarea
                  placeholder="Reference Content"
                  value={referenceContent}
                  readOnly
                  className="min-h-[100px] resize-none"
                />
              </div>
            )}

            <div className="grid gap-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-md ${
                    message.role === "user"
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {message.content}
                </div>
              ))}
              {loadingGeneration && <div className="p-3 rounded-md bg-muted text-muted-foreground">Thinking...</div>}
            </div>

            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter your prompt"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSend()
                  }
                }}
              />
              <Button onClick={handleSend} disabled={loadingGeneration}>
                Send
              </Button>
            </div>

            {mode === "image" && generatedImageUrl && (
              <div className="grid gap-2">
                <img src={generatedImageUrl || "/placeholder.svg"} alt="Generated Image" className="rounded-md" />
              </div>
            )}

            {mode !== "image" && generatedContent && (
              <div className="grid gap-2">
                <Textarea
                  placeholder="Generated Content"
                  value={generatedContent}
                  readOnly
                  className="min-h-[100px] resize-none"
                />
                <CopyButton text={generatedContent} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PromptBuilderPage
