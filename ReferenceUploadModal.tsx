"use client"

import type React from "react"
import { useState } from "react"
import { useSelector } from "react-redux"
import { X, Upload, FileText } from "lucide-react"

interface ReferenceUploadModalProps {
  onClose: () => void
  onContentUpdate: (content: string, status: string) => void
  referenceContent: string
  referenceStatus: string
}

const ReferenceUploadModal: React.FC<ReferenceUploadModalProps> = ({
  onClose,
  onContentUpdate,
  referenceContent,
  referenceStatus,
}) => {
  const [textInput, setTextInput] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<"upload" | "text">("upload")

  const authenticatedUser = useSelector((state: any) => state.auth.user)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      alert("Please upload a Word document (.docx)")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/user/prompt_builder/upload_document", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${authenticatedUser?.token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to upload document")
      }

      const data = await response.json()
      onContentUpdate(data.content, data.status)
    } catch (error) {
      console.error("Error uploading document:", error)
      onContentUpdate("", "Error uploading document. Please try again.")
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  const handleTextUpdate = () => {
    if (!textInput.trim()) {
      alert("Please enter some text")
      return
    }

    onContentUpdate(textInput, `Reference content updated! (${textInput.length} characters)`)
    setTextInput("")
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload Reference Content</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "upload"
                  ? "text-[#6f39cd] border-b-2 border-[#6f39cd]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Upload size={16} className="inline mr-2" />
              Upload Document
            </button>
            <button
              onClick={() => setActiveTab("text")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "text"
                  ? "text-[#6f39cd] border-b-2 border-[#6f39cd]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FileText size={16} className="inline mr-2" />
              Paste Text
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm bg-gray-100 p-3 rounded text-gray-600">{referenceStatus}</div>
        </div>

        {referenceContent && (
          <div className="mb-4 bg-gray-50 p-3 rounded">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Reference Content:</h4>
            <div className="text-sm text-gray-600 max-h-[150px] overflow-y-auto whitespace-pre-wrap">
              {referenceContent}
            </div>
          </div>
        )}

        {activeTab === "upload" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-4">Upload a Word document (.docx) to use as reference content</p>
              <input
                type="file"
                accept=".docx"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#6f39cd] file:text-white hover:file:bg-[#5a2ba6]"
              />
              {isUploading && <p className="text-sm text-[#6f39cd] mt-2">Uploading...</p>}
            </div>
          </div>
        )}

        {activeTab === "text" && (
          <div className="space-y-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste your reference content here..."
              className="w-full h-[200px] p-3 border border-gray-300 rounded-md resize-none text-sm focus:outline-none focus:ring-2 focus:ring-[#6f39cd] focus:border-transparent"
            />
            <button
              onClick={handleTextUpdate}
              disabled={!textInput.trim()}
              className="bg-[#6f39cd] text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Update Reference Content
            </button>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReferenceUploadModal
