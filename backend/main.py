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
    # Temporary Echo implementation for testing
    return JamResponse(ai_notes=request.user_notes)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
