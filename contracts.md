# API Contracts & Integration Plan

## API Endpoints to Implement

### 1. Sessions Management
```
GET /api/sessions - Get all conversation sessions
POST /api/sessions - Create new session
DELETE /api/sessions/{session_id} - Delete session
```

### 2. Messages Management
```
GET /api/sessions/{session_id}/messages - Get messages for session
POST /api/sessions/{session_id}/messages - Send message (text/image generation)
```

### 3. File Downloads
```
GET /api/download/{message_id} - Download generated content
```

## Data Models

### Session Model
```python
class Session(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
```

### Message Model
```python
class Message(BaseModel):
    id: str
    session_id: str
    type: str  # 'user' or 'assistant'
    content: str
    content_type: str  # 'text' or 'image'
    prompt: Optional[str]  # for image generation
    timestamp: datetime
```

## Mock Data to Replace

### From mock.js:
1. `mockSessions` array - Replace with database queries
2. `generateMockResponse()` function - Replace with actual Hugging Face API calls
3. Hardcoded image URLs - Replace with generated images from Stable Diffusion
4. Mock conversation history - Replace with MongoDB data

## Hugging Face Integration

### Text Generation (Llama)
- Endpoint: `https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf`
- Headers: `Authorization: Bearer {API_KEY}`
- Payload: `{"inputs": "user_message", "parameters": {"max_length": 500}}`

### Image Generation (Stable Diffusion)
- Endpoint: `https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0`
- Headers: `Authorization: Bearer {API_KEY}`
- Payload: `{"inputs": "image_prompt"}`
- Response: Binary image data

## Frontend Integration Changes

### Replace Mock Functions:
1. Remove `mockSessions` imports
2. Replace `generateMockResponse()` with actual API calls
3. Update `handleSendMessage()` to call backend endpoints
4. Update session management to use backend APIs
5. Update download functionality to use backend download endpoint

### API Integration Points:
- `ChatInterface.js` - Replace mock session loading with `/api/sessions`
- `handleSendMessage()` - Replace mock response with `/api/sessions/{id}/messages`
- `handleNewSession()` - Call `/api/sessions` POST
- `handleDeleteSession()` - Call `/api/sessions/{id}` DELETE
- `handleDownload()` - Call `/api/download/{message_id}`

## Environment Variables Needed

### Backend .env additions:
```
HUGGINGFACE_API_KEY=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
LLAMA_MODEL=meta-llama/Llama-2-7b-chat-hf
STABLE_DIFFUSION_MODEL=stabilityai/stable-diffusion-xl-base-1.0
```

## Implementation Sequence

1. **Backend API Development:**
   - Add Hugging Face integration service
   - Create MongoDB models for Session and Message
   - Implement CRUD endpoints for sessions and messages
   - Add text generation endpoint
   - Add image generation endpoint
   - Add file download endpoint

2. **Frontend Integration:**
   - Remove mock.js dependencies
   - Update API calls to use actual backend endpoints
   - Handle loading states and error messages
   - Update download functionality

3. **Testing:**
   - Test text generation with Llama
   - Test image generation with Stable Diffusion
   - Test session management
   - Test file downloads
   - Test error handling