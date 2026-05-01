from pydantic import BaseModel, Field


class StartConversationRequest(BaseModel):
    participant_id: str


class SendMessageRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
