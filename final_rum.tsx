"use client"

import type React from "react"
import { useState } from "react"
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  FormControl,
  FormLabel,
  Text,
  Spinner,
} from "@chakra-ui/react"
import { useAuth } from "@/hooks/auth"

interface ReferenceUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (content: string) => void
  setReferenceContent: (content: string) => void
  setReferenceStatus: (status: string) => void
}

const ReferenceUploadModal: React.FC<ReferenceUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  setReferenceContent,
  setReferenceStatus,
}) => {
  const [textInput, setTextInput] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const { authenticatedUser } = useAuth()

  const handleTextUpdate = () => {
    if (!textInput.trim()) {
      alert("Please enter some text")
      return
    }

    setReferenceContent(textInput)
    setReferenceStatus(`Reference content updated! (${textInput.length} characters)`)
    onUpload(textInput)
    setTextInput("")
    onClose() // Close modal after successful update
  }

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
      setReferenceContent(data.content)
      setReferenceStatus(data.status)
      onUpload(data.content)
      onClose() // Close modal after successful upload
    } catch (error) {
      console.error("Error uploading document:", error)
      setReferenceStatus("Error uploading document. Please try again.")
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Upload Reference Content</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4}>
            <FormLabel>Enter Text:</FormLabel>
            <Input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} />
            <Button mt={2} colorScheme="blue" onClick={handleTextUpdate}>
              Update with Text
            </Button>
          </FormControl>

          <FormControl>
            <FormLabel>Upload Document (.docx):</FormLabel>
            <Input type="file" accept=".docx" onChange={handleFileUpload} />
          </FormControl>

          {isUploading && (
            <Text mt={2} textAlign="center">
              Uploading... <Spinner size="sm" />
            </Text>
          )}
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="gray" mr={3} onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default ReferenceUploadModal
