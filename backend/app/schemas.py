import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# --- Auth ---

class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


# --- DoE Setups ---

class DoESetupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    config: dict


class DoESetupUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    config: dict | None = None


class DoESetupResponse(BaseModel):
    id: uuid.UUID
    name: str
    config: dict
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
