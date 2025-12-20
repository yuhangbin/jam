from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI()

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
    # Placeholder: Echo the user's notes transposed by +4 semitones (Major 3rd)
    ai_notes = []
    for note in request.user_notes:
        new_note = note.model_copy()
        new_note.pitch += 4
        # Offset start time to reply *after* the user? 
        # For "Call and Response", the AI responds after the user finishes.
        # But here we just return the notes, the client handles the timeline placement.
        # Or we can just shift them in time if we want to simulate "after".
        # For simplicity MVP, let's just return transposed notes and client schedules them.
        ai_notes.append(new_note)
    
    return JamResponse(ai_notes=ai_notes)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
