from pydantic import BaseModel


class AskRequest(BaseModel):
    question: str
    grade: int | None = None
    subject: str | None = None
    language: str = "en"