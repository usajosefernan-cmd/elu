from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Optional, Literal, Union
from datetime import datetime, timezone
import uuid

# Tipos
UserMode = Literal['user', 'pro', 'prolux']
PillarMode = Literal['auto', 'off']
PillarName = Literal['photoscaler', 'stylescaler', 'lightscaler']
SliderLevel = Literal['OFF', 'LOW', 'MED', 'HIGH', 'FORCE']

class SliderState(BaseModel):
    name: str
    value: int = Field(ge=0, le=10)
    levelText: SliderLevel
    snippet: str

class PillarState(BaseModel):
    pillarName: PillarName
    mode: PillarMode
    sliders: List[SliderState]

class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password: str # En produccion esto debe ser hasheado
    user_mode: UserMode = 'user'
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PillarsConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_mode: UserMode
    photoscaler: PillarState
    stylescaler: PillarState
    lightscaler: PillarState
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProcessRequest(BaseModel):
    user_id: str
    input_text: str
    input_image_url: Optional[str] = None

class ProcessResponse(BaseModel):
    process_id: str
    output_text: str
    metadata: Dict

class LoginRequest(BaseModel):
    email: str
    password: str
