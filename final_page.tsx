"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

type ChatMode = "image" | "elearning" | "outline"

const PromptBuilderPage = () => {
  const [inputMessage, setInputMessage] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [mode, setMode] = useState<ChatMode>("image")
  const [isLoading, setIsLoading] = useState(false)
  const [referenceContent, setReferenceContent] = useState("")
  const [referenceStatus, setReferenceStatus] = useState("No reference content loaded.")
  const [generatedContent, setGeneratedContent] = useState("")
  const [generatedImageUrl, setGeneratedImageUrl] = useState("")
  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState(false)
  const [creativityLevel, setCreativityLevel] = useState(0.5)
  const [progress, setProgress] = useState(0)

  const { user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/sign-in")
    } else {
      // Initial chat messages based on the mode
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
    }
  }, [user, router, mode])

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: ChatMessage = { role: "user", content: inputMessage }
    setMessages((prevMessages) => [...prevMessages, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/user/prompt_builder/prompt_chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputMessage, mode, creativityLevel }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.generated_image_url) {
        setGeneratedImageUrl(data.generated_image_url)
        setGeneratedContent("") // Clear any previous text content
      } else {
        setGeneratedContent(data.response)
        setGeneratedImageUrl("") // Clear any previous image URL
      }

      const assistantMessage: ChatMessage = { role: "assistant", content: data.response }
      setMessages((prevMessages) => [...prevMessages, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message. Please try again.")
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

      // Reset all states including reference content
      setReferenceContent("")
      setReferenceStatus("No reference content loaded.")
      setGeneratedContent("")
      setGeneratedImageUrl("")
      setInputMessage("")
    } catch (error) {
      console.error("Error clearing chat:", error)
    }
  }

  // Handle mode change
  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode)
    clearChat(newMode) // Clear the chat when the mode changes
  }

  // Handle uploading reference content
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setReferenceStatus("No file selected.")
      return
    }

    setReferenceStatus("Loading...")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/user/prompt_builder/upload_reference_content", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setReferenceContent(data.content)
      setReferenceStatus("Reference content loaded successfully.")
      toast.success("Reference content loaded successfully!")
    } catch (error) {
      console.error("Error uploading file:", error)
      setReferenceStatus("Failed to load reference content.")
      toast.error("Failed to load reference content. Please try again.")
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Prompt Builder</h1>

      <div className="flex space-x-4 mb-4">
        <Select value={mode} onValueChange={handleModeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">Image Generation</SelectItem>
            <SelectItem value="elearning">E-Learning Content</SelectItem>
            <SelectItem value="outline">E-Learning Outline</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="destructive" onClick={() => clearChat()}>
          Clear Chat
        </Button>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-2 p-3 rounded-md ${message.role === "user" ? "bg-gray-100" : "bg-blue-100"}`}
              >
                <Badge variant={message.role === "user" ? "secondary" : "default"} className="mr-2">
                  {message.role === "user" ? "You" : "Assistant"}
                </Badge>
                {message.content}
              </div>
            ))}
            {isLoading && <Skeleton className="w-full h-10" />}
          </div>

          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Enter your message"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage()
                }
              }}
            />
            <Button onClick={handleSendMessage} disabled={isLoading}>
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      {mode === "image" && generatedImageUrl ? (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Generated Image</CardTitle>
          </CardHeader>
          <CardContent>
            <img src={generatedImageUrl || "/placeholder.svg"} alt="Generated Image" className="w-full rounded-md" />
          </CardContent>
        </Card>
      ) : null}

      {generatedContent && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={generatedContent} className="w-full h-48 resize-none" readOnly />
          </CardContent>
        </Card>
      )}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Reference Content</CardTitle>
        </CardHeader>
        <CardContent>
          <input type="file" id="file-upload" className="sr-only" onChange={handleFileUpload} />
          <Label
            htmlFor="file-upload"
            className="cursor-pointer bg-green-500 text-white p-2 rounded-md hover:bg-green-600 inline-block"
          >
            Upload Reference Content
          </Label>
          <p className="mt-2">{referenceStatus}</p>
          {referenceContent && <Textarea value={referenceContent} className="w-full h-48 resize-none mt-2" readOnly />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advanced Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="advanced-options">Show Advanced Options</Label>
              <Switch
                id="advanced-options"
                checked={isAdvancedOptionsOpen}
                onCheckedChange={setIsAdvancedOptionsOpen}
              />
            </div>

            {isAdvancedOptionsOpen && (
              <>
                <Separator className="my-2" />
                <div>
                  <Label htmlFor="creativity">Creativity Level</Label>
                  <Slider
                    id="creativity"
                    defaultValue={[creativityLevel * 100]}
                    max={100}
                    step={1}
                    onValueChange={(value) => setCreativityLevel(value[0] / 100)}
                  />
                  <p className="text-sm text-muted-foreground">Adjust the creativity level of the AI.</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PromptBuilderPage
