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

      // Always clear reference content and status
      setReferenceContent("")
      setReferenceStatus("No reference content loaded.")

      // Clear generated content and images states
      setGeneratedContent("")
      setGeneratedImageUrl("")
    } catch (error) {
      console.error("Error clearing chat:", error)
    }
  }
