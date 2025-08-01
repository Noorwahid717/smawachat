from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List
import uuid
from datetime import datetime
import base64
import io

from models import Session, SessionCreate, Message, MessageCreate, SessionWithMessages
from services.huggingface_service import HuggingFaceService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize HuggingFace service
hf_service = HuggingFaceService()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Sessions endpoints
@api_router.get("/sessions", response_model=List[Session])
async def get_sessions():
    """Get all chat sessions"""
    try:
        sessions_cursor = db.sessions.find().sort("updated_at", -1)
        sessions = await sessions_cursor.to_list(1000)
        return [Session(**session) for session in sessions]
    except Exception as e:
        logging.error(f"Error fetching sessions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch sessions")

@api_router.post("/sessions", response_model=Session)
async def create_session(session_data: SessionCreate):
    """Create a new chat session"""
    try:
        session = Session(
            title=session_data.title,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        await db.sessions.insert_one(session.dict())
        return session
    except Exception as e:
        logging.error(f"Error creating session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create session")

@api_router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a chat session and all its messages"""
    try:
        # Delete all messages in the session
        await db.messages.delete_many({"session_id": session_id})
        
        # Delete the session
        result = await db.sessions.delete_one({"id": session_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"message": "Session deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete session")

# Messages endpoints
@api_router.get("/sessions/{session_id}/messages", response_model=List[Message])
async def get_messages(session_id: str):
    """Get all messages for a session"""
    try:
        messages_cursor = db.messages.find({"session_id": session_id}).sort("timestamp", 1)
        messages = await messages_cursor.to_list(1000)
        return [Message(**message) for message in messages]
    except Exception as e:
        logging.error(f"Error fetching messages: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch messages")

@api_router.post("/sessions/{session_id}/messages", response_model=Message)
async def send_message(session_id: str, message_data: MessageCreate):
    """Send a message and get AI response"""
    try:
        # Check if session exists
        session = await db.sessions.find_one({"id": session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Create user message
        user_message = Message(
            session_id=session_id,
            type="user",
            content=message_data.content,
            content_type="text",
            timestamp=datetime.utcnow()
        )
        
        # Save user message
        await db.messages.insert_one(user_message.dict())
        
        # Generate AI response
        if message_data.message_type == "image":
            # Generate image
            image_data = await hf_service.generate_image(message_data.content)
            
            if image_data:
                assistant_message = Message(
                    session_id=session_id,
                    type="assistant",
                    content=image_data,
                    content_type="image",
                    prompt=message_data.content,
                    timestamp=datetime.utcnow()
                )
            else:
                assistant_message = Message(
                    session_id=session_id,
                    type="assistant",
                    content="Maaf, saya tidak dapat membuat gambar saat ini. Silakan coba lagi nanti.",
                    content_type="text",
                    timestamp=datetime.utcnow()
                )
        else:
            # Generate text response
            ai_response = await hf_service.generate_text(message_data.content)
            
            assistant_message = Message(
                session_id=session_id,
                type="assistant",
                content=ai_response,
                content_type="text",
                timestamp=datetime.utcnow()
            )
        
        # Save AI response
        await db.messages.insert_one(assistant_message.dict())
        
        # Update session timestamp
        await db.sessions.update_one(
            {"id": session_id},
            {"$set": {"updated_at": datetime.utcnow()}}
        )
        
        # Update session title if it's the first message
        if session["title"] == "Percakapan Baru":
            # Generate a title from the first user message (first 50 chars)
            title = message_data.content[:50] + ("..." if len(message_data.content) > 50 else "")
            await db.sessions.update_one(
                {"id": session_id},
                {"$set": {"title": title}}
            )
        
        return assistant_message
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error sending message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send message")

@api_router.get("/download/{message_id}")
async def download_message(message_id: str):
    """Download message content (text or image)"""
    try:
        message = await db.messages.find_one({"id": message_id})
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        if message["content_type"] == "image":
            # Extract base64 data
            if message["content"].startswith("data:image/png;base64,"):
                base64_data = message["content"].split(",")[1]
                image_bytes = base64.b64decode(base64_data)
                
                return StreamingResponse(
                    io.BytesIO(image_bytes),
                    media_type="image/png",
                    headers={"Content-Disposition": f"attachment; filename=image-{message_id}.png"}
                )
            else:
                raise HTTPException(status_code=400, detail="Invalid image data")
        else:
            # Text content
            text_bytes = message["content"].encode('utf-8')
            return StreamingResponse(
                io.BytesIO(text_bytes),
                media_type="text/plain",
                headers={"Content-Disposition": f"attachment; filename=message-{message_id}.txt"}
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error downloading message: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to download message")

# Legacy endpoint for compatibility
@api_router.get("/")
async def root():
    return {"message": "Chatbot API is running"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()