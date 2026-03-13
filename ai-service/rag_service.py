import os
from llama_index.core import (
    VectorStoreIndex,
    StorageContext,
    Settings,
    SimpleDirectoryReader,
    Document
)
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.embeddings.google_genai import GoogleGenAIEmbedding
import qdrant_client
from config import (
    logger,
    QDRANT_URL,
    QDRANT_COLLECTION_NAME,
    GOOGLE_API_KEY,
    EMBEDDING_MODEL,
    LLM_MODEL
)
from schemas import QuizResponse, FlashcardResponse

class RAGService:
    def __init__(self):
        self._setup_done = False
        try:
            if not GOOGLE_API_KEY:
                logger.warning("GOOGLE_API_KEY is not set. RAG features will be disabled.")
                return

            # 1. Setup Models
            # Using Google's Gemini models for both LLM and Embeddings
            self.llm = GoogleGenAI(model=LLM_MODEL, api_key=GOOGLE_API_KEY)
            self.embed_model = GoogleGenAIEmbedding(
                model_name=EMBEDDING_MODEL, api_key=GOOGLE_API_KEY
            )
            
            # Configure global settings for LlamaIndex
            Settings.llm = self.llm
            Settings.embed_model = self.embed_model

            # 2. Setup Vector Store
            self.client = qdrant_client.QdrantClient(url=QDRANT_URL)
            self.vector_store = QdrantVectorStore(
                client=self.client, 
                collection_name=QDRANT_COLLECTION_NAME
            )
            self.storage_context = StorageContext.from_defaults(vector_store=self.vector_store)
            
            self._setup_done = True
            logger.info(f"RAG Service initialized with Qdrant at {QDRANT_URL}")

        except Exception as e:
            logger.error(f"Failed to initialize RAG Service: {e}")

    def _check_setup(self):
        if not self._setup_done:
            raise ValueError("RAG Service is not initialized. check API keys and Qdrant connection.")

    async def ingest_document(self, file_path: str, course_id: str):
        """
        Reads a document, chunks it, and indexes it into Qdrant with course_id metadata.
        """
        self._check_setup()
        try:
            # Use SimpleDirectoryReader to load the specific file
            loader = SimpleDirectoryReader(input_files=[file_path])
            documents = loader.load_data()

            # Add metadata to each document chunk
            for doc in documents:
                doc.metadata["course_id"] = course_id

            # Create index from documents (this automatically chunks and upserts to Qdrant)
            # We don't need to persist the index to disk because Qdrant handles storage
            VectorStoreIndex.from_documents(
                documents,
                storage_context=self.storage_context,
                show_progress=True
            )
            logger.info(f"Successfully ingested {file_path} for course {course_id}")
            return True
        except Exception as e:
            logger.error(f"Error ingesting document {file_path}: {e}")
            raise e

    async def generate_quiz(self, topic: str, course_id: str, num_questions: int = 5) -> QuizResponse:
        self._check_setup()
        
        # 1. Retrieve relevant context (if any documents have been ingested)
        context_text = ""
        try:
            from llama_index.core.vector_stores import MetadataFilters, ExactMatchFilter
            index = VectorStoreIndex.from_vector_store(
                self.vector_store,
                embed_model=self.embed_model
            )
            filters = MetadataFilters(
                filters=[ExactMatchFilter(key="course_id", value=course_id)]
            )
            retriever = index.as_retriever(filters=filters, similarity_top_k=5)
            nodes = retriever.retrieve(topic)
            context_text = "\n\n".join([n.get_content() for n in nodes])
            logger.info(f"Retrieved {len(nodes)} context nodes for quiz generation")
        except Exception as e:
            logger.warning(f"RAG retrieval failed (no ingested content?), using LLM-only mode: {e}")
            context_text = ""

        # 2. Prompting with Structured Output
        # We use the specialized structured output capabilities of the LLM wrapper or just prompt engineering
        # LlamaIndex has 'as_structured_llm' or we can direct prompt.
        
        context_section = f"Context from course materials:\n{context_text}" if context_text.strip() else "No specific course materials available — use your general knowledge."

        prompt = f"""
        You are an expert Chinese language teacher.
        Generate a quiz with {num_questions} multiple-choice questions about "{topic}".
        Each question must have exactly 4 options (A, B, C, D) with exactly one correct answer.
        
        {context_section}
        
        Output valid JSON matching this schema:
        {{
            "questions": [
                {{
                    "question_text": "...",
                    "options": [
                        {{ "label": "A", "text": "...", "is_correct": true }},
                        {{ "label": "B", "text": "...", "is_correct": false }}
                    ],
                    "explanation": "..."
                }}
            ]
        }}
        """
        
        response = await self.llm.acomplete(prompt)
        
        import json
        import re
        
        # improved cleanup to handle markdown code blocks often returned by LLMs
        json_str = response.text.strip()
        json_str = re.sub(r'^```json\s*', '', json_str)
        json_str = re.sub(r'\s*```$', '', json_str)
        
        data = json.loads(json_str)
        return QuizResponse(**data)

    async def generate_flashcards(self, topic: str, course_id: str, num_cards: int = 10) -> FlashcardResponse:
        self._check_setup()
        
        context_text = ""
        try:
            from llama_index.core.vector_stores import MetadataFilters, ExactMatchFilter
            index = VectorStoreIndex.from_vector_store(
                self.vector_store,
                embed_model=self.embed_model
            )
            filters = MetadataFilters(
                filters=[ExactMatchFilter(key="course_id", value=course_id)]
            )
            retriever = index.as_retriever(filters=filters, similarity_top_k=5)
            nodes = retriever.retrieve(topic)
            context_text = "\n\n".join([n.get_content() for n in nodes])
        except Exception as e:
            logger.warning(f"RAG retrieval failed for flashcards, using LLM-only mode: {e}")
            context_text = ""

        prompt = f"""
        Based on the Context, generate {num_cards} flashcards for studying "{topic}".
        Each card should have a 'front' (term/question) and a 'back' (definition/answer).
        
        Context:
        {context_text}
        
        Output valid JSON matching this schema:
        {{
            "flashcards": [
                {{ "front": "...", "back": "..." }}
            ]
        }}
        """
        
        response = await self.llm.acomplete(prompt)
        
        import json
        import re
        json_str = response.text.strip()
        json_str = re.sub(r'^```json\s*', '', json_str)
        json_str = re.sub(r'\s*```$', '', json_str)
        
        data = json.loads(json_str)
        return FlashcardResponse(**data)

    async def explain_text(self, text: str, course_id: str) -> str:
        self._check_setup()
        
        context_text = ""
        try:
            from llama_index.core.vector_stores import MetadataFilters, ExactMatchFilter
            index = VectorStoreIndex.from_vector_store(
                self.vector_store,
                embed_model=self.embed_model
            )
            filters = MetadataFilters(
                filters=[ExactMatchFilter(key="course_id", value=course_id)]
            )
            retriever = index.as_retriever(filters=filters, similarity_top_k=3)
            nodes = retriever.retrieve(text)
            context_text = "\n\n".join([n.get_content() for n in nodes])
        except Exception as e:
            logger.warning(f"RAG retrieval failed for explain, using LLM-only: {e}")
            context_text = ""
        
        context_section = f"Context from course materials:\n{context_text}" if context_text.strip() else ""
        
        prompt = f"""You are an expert Chinese language teacher. 
        Explain the Chinese text or concept: "{text}"
        
        Provide: 1) Pronunciation (pinyin), 2) Meaning in English, 3) Example usage in a sentence.
        Keep the response concise (3-5 sentences).
        {context_section}
        """
        
        response = await self.llm.acomplete(prompt)
        return response.text

# Singleton instance
rag_service = RAGService()
