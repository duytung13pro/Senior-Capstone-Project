import uuid
import edge_tts
from config import logger, MEDIA_DIR

async def process_tts(text: str, language: str) -> str:
    """Generates audio for given text using Edge TTS and returns the public URL."""
    # Determine voice based on language
    voice = "en-US-AriaNeural" # Default English
    if language == 'zh':
        voice = "zh-CN-XiaoxiaoNeural"
    elif language == 'vi':
        voice = "vi-VN-HoaiMyNeural"
        
    # Generate Audio
    filename = f"{uuid.uuid4()}.mp3"
    output_path = MEDIA_DIR / filename
    
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(output_path))
    
    public_url = f"/media/{filename}"
    return public_url
