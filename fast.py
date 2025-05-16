from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
import uvicorn
import os
import tempfile
import docx2txt
from io import BytesIO
import base64
import requests
from PIL import Image
import json

# Import the necessary components from prompt_builder_v0
import autogen
from autogen import token_count_utils
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# System messages for different assistants
from prompt_builder_v0 import (
    image_prompt, 
    elearning_prompt, 
    outline_prompt,
    truncate_text,
    manage_history_length,
    MAX_HISTORY_LENGTH,
    MAX_REFERENCE_LENGTH
)

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize Leonardo API
from leonardo_api import Leonardo
leonardo_api_key = os.getenv("LEONARDO_API_TOKEN")
if not leonardo_api_key:
    leonardo_api_key = '4c07d999-7565-4a78-b8ad-1d1e5c330399'  # Fallback, but should use env var in production
leonardo = Leonardo(auth_token=leonardo_api_key)

# LLM configuration
llm_config = {
    "model": "gpt-4o",
    "api_key": os.getenv("OPENAI_API_KEY"),
    "max_tokens": 4000,
}

# Create the assistant agents
prompt_builder = autogen.AssistantAgent(
    name="PromptBuilder",
    system_message=image_prompt,
    llm_config=llm_config,
)

elearning_assistant = autogen.AssistantAgent(
    name="ELearningAssistant",
    system_message=elearning_prompt,
    llm_config=llm_config,
)

outline_assistant = autogen.AssistantAgent(
    name="OutlineAssistant",
    system_message=outline_prompt,
    llm_config=llm_config,
)

# Initialize FastAPI
app = FastAPI(title="Prompt Assistant API")

# Add CORS middleware to allow cross-origin requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class ChatRequest(BaseModel):
    message: str
    mode: str  # 'image', 'elearning', 'outline'
    reference_content: Optional[str] = None

class ClearChatRequest(BaseModel):
    mode: str

class ReferenceContentRequest(BaseModel):
    content: str

class ImageGenerationRequest(BaseModel):
    prompt: str

# Response models
class ChatResponse(BaseModel):
    response: str
    total_tokens: int = 0

class ReferenceContentResponse(BaseModel):
    content: str
    status: str

class ImageGenerationResponse(BaseModel):
    image_url: str
    total_tokens: int = 0

# Initialize chat history stores
chat_histories = {
    "image": [{"role": "user", "content": "Hi, I want to create an AI-generated image, but I don't know how to describe it well."}],
    "elearning": [{"role": "user", "content": "Hi, I need help creating content for an e-learning course."}],
    "outline": [{"role": "user", "content": "Hi, I need help creating an outline for an e-learning course."}],
}

# Store for reference content
reference_content = ""

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    mode = request.mode.lower()
    message = request.message.strip()

    if mode not in ["image", "elearning", "outline"]:
        raise HTTPException(status_code=400, detail="Invalid mode. Choose from 'image', 'elearning', or 'outline'.")

    # Select the right assistant
    if mode == "image":
        assistant = prompt_builder
    elif mode == "elearning":
        assistant = elearning_assistant
    elif mode == "outline":
        assistant = outline_assistant

    # If reference content is provided for elearning mode, include it in the message
    if mode == "elearning" and request.reference_content:
        truncated_reference = truncate_text(request.reference_content)
        enhanced_message = f"{message}\n\nReference Content:\n{truncated_reference}"
    else:
        enhanced_message = message

    # Add message to chat history
    chat_histories[mode].append({"role": "user", "content": enhanced_message})
    chat_histories[mode] = manage_history_length(chat_histories[mode])

    # Generate reply
    reply = assistant.generate_reply(messages=chat_histories[mode])
    
    # Get token usage
    usage = assistant.get_actual_usage()
    print("actual usage", usage)
    
    # Extract total_tokens from usage
    total_tokens = 0
    for model, stats in usage.items():
        if isinstance(stats, dict) and 'total_tokens' in stats:
            total_tokens += stats['total_tokens']

    chat_histories[mode].append({"role": "assistant", "content": reply})

    return ChatResponse(response=reply, total_tokens=total_tokens)

@app.post("/clear_chat")
async def clear_chat(request: ClearChatRequest):
    mode = request.mode.lower()

    if mode not in ["image", "elearning", "outline"]:
        raise HTTPException(status_code=400, detail="Invalid mode. Choose from 'image', 'elearning', or 'outline'.")

    # Reset chat history for the specified mode
    if mode == "image":
        chat_histories[mode] = [{"role": "user", "content": "Hi, I want to create an AI-generated image, but I don't know how to describe it well."}]
    elif mode == "elearning":
        chat_histories[mode] = [{"role": "user", "content": "Hi, I need help creating content for an e-learning course."}]
        global reference_content
        reference_content = ""
    elif mode == "outline":
        chat_histories[mode] = [{"role": "user", "content": "Hi, I need help creating an outline for an e-learning course."}]

    return {"success": True}

@app.post("/update_reference_content", response_model=ReferenceContentResponse)
async def update_reference_content(request: ReferenceContentRequest):
    global reference_content
    
    # Truncate to manage token count
    truncated_content = truncate_text(request.content)
    reference_content = truncated_content
    
    if len(request.content) > MAX_REFERENCE_LENGTH:
        status = f"Reference content updated but truncated! ({len(truncated_content)}/{len(request.content)} characters)"
    else:
        status = f"Reference content updated! ({len(request.content)} characters)"
    
    return ReferenceContentResponse(content=truncated_content, status=status)

@app.post("/upload_document", response_model=ReferenceContentResponse)
async def upload_document(file: UploadFile = File(...)):
    global reference_content
    
    if not file.filename.endswith('.docx'):
        raise HTTPException(status_code=400, detail="Only Word documents (.docx) are supported")
    
    try:
        # Create a temporary file to save the uploaded file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp_file:
            temp_path = temp_file.name
            # Write the binary file data to the temporary file
            contents = await file.read()
            temp_file.write(contents)
            
        # Extract text from the Word document
        content = docx2txt.process(temp_path)
        
        # Remove the temporary file
        os.unlink(temp_path)
        
        # Truncate content if too long
        truncated_content = truncate_text(content)
        reference_content = truncated_content
        
        if len(content) > MAX_REFERENCE_LENGTH:
            status = f"Word document processed but content truncated! ({len(truncated_content)}/{len(content)} characters extracted)"
        else:
            status = f"Word document processed successfully! ({len(content)} characters extracted)"
        
        return ReferenceContentResponse(content=truncated_content, status=status)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing Word document: {str(e)}")

@app.post("/generate_image", response_model=ImageGenerationResponse)
async def generate_image(request: ImageGenerationRequest):
    try:
        if not request.prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")

        print("Sending generation request with prompt:", request.prompt)
        response = leonardo.post_generations(
            prompt=request.prompt,
            negative_prompt="",
            num_images=1,
            model_id='e71a1c2f-4f80-4800-934f-2c68979d8cc8',
            width=1024,
            height=1024,
            num_inference_steps=40,
            guidance_scale=7,
        )

        print("Generation response:", response)

        generation_id = response['sdGenerationJob']['generationId']
        result = leonardo.wait_for_image_generation(generation_id=generation_id)

        print("Image URL:", result['url'])
        
        # For image generation, we'll use a fixed token count since Leonardo doesn't provide usage stats
        # This is an estimate based on typical prompt lengths
        estimated_tokens = len(request.prompt.split()) * 1.5
        
        return ImageGenerationResponse(image_url=result['url'], total_tokens=int(estimated_tokens))

    except Exception as e:
        print(f"Error generating image: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating image: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("fastapi_autogen_app:app", host="0.0.0.0", port=8000, reload=True)
