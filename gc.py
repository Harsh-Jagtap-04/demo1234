"use client"

import type React from "react"

interface GeneratedContentProps {
  title: string
  content: string
  isGenerating: boolean
  onGenerate: () => void
}

const GeneratedContent: React.FC<GeneratedContentProps> = ({ title, content, isGenerating, onGenerate }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h2 className="text-lg font-medium mb-4">{title}</h2>

      <div className="mb-4">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="bg-[#1A3150] text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isGenerating ? "Generating..." : "Generate Content from Chat"}
        </button>
      </div>

      {isGenerating ? (
        <div className="flex justify-center items-center h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1A3150]"></div>
        </div>
      ) : content ? (
        <div className="bg-gray-50 p-4 rounded-md h-[500px] overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm">{content}</pre>
        </div>
      ) : (
        <div className="flex justify-center items-center h-[300px] bg-gray-50 rounded-md">
          <p className="text-gray-500">Generated content will appear here</p>
        </div>
      )}
    </div>
  )
}

export default GeneratedContent
