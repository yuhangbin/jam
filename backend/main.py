from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List
from enum import Enum
import json
import asyncio
import numpy as np

app = FastAPI()

# Status enumeration
class SessionStatus(str, Enum):
    IDLE = "IDLE"
    LISTENING = "LISTENING"
    USER_PERFORMING = "USER_PERFORMING"
    AI_THINKING = "AI_THINKING"
    AI_PLAYING = "AI_PLAYING"

# State Manager for tracking session status
class StateManager:
    def __init__(self):
        self.current_status = SessionStatus.IDLE
        self.audio_buffer = []
        self.is_sound_detected = False
        self.silence_start_time = None
        
    def update_status(self, new_status: SessionStatus):
        """Update the current status"""
        self.current_status = new_status
        print(f"[StateManager] Status changed to: {new_status}")
        
    def get_status(self) -> SessionStatus:
        """Get current status"""
        return self.current_status
    
    def add_audio_chunk(self, chunk: bytes):
        """Add audio chunk to buffer"""
        self.audio_buffer.append(chunk)
        
    def clear_buffer(self):
        """Clear the audio buffer"""
        self.audio_buffer = []
        
    def get_buffer(self) -> List[bytes]:
        """Get the accumulated audio buffer"""
        return self.audio_buffer.copy()

# Legacy API endpoints (keeping for compatibility)
class Note(BaseModel):
    pitch: int
    start_time: float
    duration: float
    velocity: float

class JamRequest(BaseModel):
    project_id: str
    bpm: int
    user_notes: List[Note]

class JamResponse(BaseModel):
    ai_notes: List[Note]

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/response", response_model=JamResponse)
async def generate_response(request: JamRequest):
    # Temporary Echo implementation for testing
    return JamResponse(ai_notes=request.user_notes)

# WebSocket endpoint with state management
@app.websocket("/ws/audio")
async def websocket_audio_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket Connected")
    
    state_manager = StateManager()
    
    # Send initial status
    await websocket.send_text(json.dumps({
        "type": "status",
        "value": SessionStatus.IDLE
    }))
    
    try:
        while True:
            # Receive data (can be binary audio or JSON control message)
            try:
                data = await websocket.receive()
                
                if "bytes" in data:
                    # Binary audio chunk received
                    audio_chunk = data["bytes"]
                    
                    # Analyze audio chunk for volume/activity
                    # Simple RMS-based detection (placeholder)
                    has_sound = await detect_sound(audio_chunk)
                    
                    if state_manager.get_status() == SessionStatus.IDLE:
                        # First chunk, transition to LISTENING
                        state_manager.update_status(SessionStatus.LISTENING)
                        await websocket.send_text(json.dumps({
                            "type": "status",
                            "value": SessionStatus.LISTENING
                        }))
                    
                    if has_sound:
                        if state_manager.get_status() == SessionStatus.LISTENING:
                            # Sound detected, user is performing
                            state_manager.update_status(SessionStatus.USER_PERFORMING)
                            await websocket.send_text(json.dumps({
                                "type": "status",
                                "value": SessionStatus.USER_PERFORMING
                            }))
                        
                        state_manager.add_audio_chunk(audio_chunk)
                        state_manager.silence_start_time = None
                    else:
                        # No sound detected
                        if state_manager.get_status() == SessionStatus.USER_PERFORMING:
                            # Mark silence start
                            if state_manager.silence_start_time is None:
                                state_manager.silence_start_time = asyncio.get_event_loop().time()
                            else:
                                # Check if silence duration exceeds threshold (e.g., 1 second)
                                silence_duration = asyncio.get_event_loop().time() - state_manager.silence_start_time
                                if silence_duration > 1.0:
                                    # User stopped performing, trigger AI response
                                    state_manager.update_status(SessionStatus.AI_THINKING)
                                    await websocket.send_text(json.dumps({
                                        "type": "status",
                                        "value": SessionStatus.AI_THINKING
                                    }))
                                    
                                    # Process the accumulated audio
                                    await process_and_respond(websocket, state_manager)
                                    
                                    # Reset for next iteration
                                    state_manager.clear_buffer()
                                    state_manager.update_status(SessionStatus.LISTENING)
                                    await websocket.send_text(json.dumps({
                                        "type": "status",
                                        "value": SessionStatus.LISTENING
                                    }))
                                    state_manager.silence_start_time = None
                
                elif "text" in data:
                    # JSON control message
                    message = json.loads(data["text"])
                    if message.get("type") == "control":
                        if message.get("action") == "stop_jam":
                            state_manager.update_status(SessionStatus.IDLE)
                            state_manager.clear_buffer()
                            await websocket.send_text(json.dumps({
                                "type": "status",
                                "value": SessionStatus.IDLE
                            }))
                            
            except Exception as e:
                print(f"Error processing data: {e}")
                continue
                
    except WebSocketDisconnect:
        print("WebSocket Disconnected")
    except Exception as e:
        print(f"WebSocket Error: {e}")
        await websocket.close()

async def detect_sound(audio_chunk: bytes) -> bool:
    """
    Simple sound detection based on RMS energy
    Returns True if sound is detected above threshold
    """
    try:
        # Convert bytes to numpy array (assuming Opus/WebM encoded)
        # For now, just check if chunk size is significant
        # In production, decode Opus -> PCM -> analyze
        return len(audio_chunk) > 100  # Placeholder threshold
    except Exception as e:
        print(f"Error in sound detection: {e}")
        return False

async def process_and_respond(websocket: WebSocket, state_manager: StateManager):
    """
    Process the accumulated audio and generate AI response
    For now, this echoes the audio back (Phase 1)
    """
    try:
        # Get all accumulated audio chunks
        audio_chunks = state_manager.get_buffer()
        
        if not audio_chunks:
            return
        
        # Update status to AI_PLAYING
        state_manager.update_status(SessionStatus.AI_PLAYING)
        await websocket.send_text(json.dumps({
            "type": "status",
            "value": SessionStatus.AI_PLAYING
        }))
        
        # Echo back the audio (placeholder for actual AI processing)
        for chunk in audio_chunks:
            await websocket.send_bytes(chunk)
            await asyncio.sleep(0.01)  # Small delay between chunks
        
        # Signal end of AI response with a small delay
        await asyncio.sleep(0.5)
        
    except Exception as e:
        print(f"Error in process_and_respond: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
