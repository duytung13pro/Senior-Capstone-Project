from pydantic import BaseModel

class TTSRequest(BaseModel):
    text: str
    language: str # 'en', 'zh', 'vi'

class TranslateRequest(BaseModel):
    text: str
    context: str = "" # Optional context from surrounding text
    courseId: str # For RAG filtering

class QuizRequest(BaseModel):
    courseId: str
    topic: str
    num_questions: int = 5

class FlashcardRequest(BaseModel):
    courseId: str
    topic: str
    num_cards: int = 10

class Flashcard(BaseModel):
    front: str
    back: str

class FlashcardResponse(BaseModel):
    flashcards: list[Flashcard]

class QuizOption(BaseModel):
    label: str          # e.g., "A", "B", "C", "D"
    text: str           # The answer text
    is_correct: bool

class QuizQuestion(BaseModel):
    question_text: str
    options: list[QuizOption]
    explanation: str    # RAG-based explanation for why the answer is correct

class QuizResponse(BaseModel):
    questions: list[QuizQuestion]
