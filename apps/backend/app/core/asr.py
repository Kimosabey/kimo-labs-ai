import os
import asyncio
import logging
from faster_whisper import WhisperModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ASR")

class ASRRunner:
    def __init__(self, model_size="base", device="cpu", compute_type="int8"):
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self.model = None
        self._lock = asyncio.Lock()
        self.deepgram_api_key = os.getenv("DEEPGRAM_API_KEY")

    async def load_whisper(self):
        async with self._lock:
            if self.model is None:
                try:
                    logger.info(f"Loading Whisper model: {self.model_size} on {self.device}...")
                    self.model = await asyncio.to_thread(
                        WhisperModel, 
                        self.model_size, 
                        device=self.device, 
                        compute_type=self.compute_type
                    )
                    logger.info("Whisper model loaded successfully.")
                except Exception as e:
                    logger.error(f"Failed to load Whisper model: {e}")
                    raise
        return self.model

    async def transcribe(self, audio_path: str, provider: str = "whisper"):
        """
        Transcribe an audio file using either local Whisper or cloud Deepgram.
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        if provider.lower() == "deepgram":
            if not self.deepgram_api_key:
                raise ValueError("DEEPGRAM_API_KEY is not set.")
            return await self._transcribe_deepgram(audio_path)
        
        return await self._transcribe_whisper(audio_path)

    async def _transcribe_whisper(self, audio_path: str):
        model = await self.load_whisper()
        def run_transcription():
            segments, info = model.transcribe(audio_path, beam_size=5)
            full_text = ""
            results = []
            for segment in segments:
                full_text += segment.text + " "
                results.append({
                    "start": segment.start,
                    "end": segment.end,
                    "text": segment.text.strip()
                })
            return full_text.strip(), info, results

        text, info, segments = await asyncio.to_thread(run_transcription)
        return {
            "text": text,
            "language": info.language,
            "language_probability": info.language_probability,
            "segments": segments,
            "provider": "whisper"
        }

    async def _transcribe_deepgram(self, audio_path: str):
        import httpx
        url = "https://api.deepgram.com/v1/listen?smart_format=true&model=nova-2&language=en-US"
        headers = {
            "Authorization": f"Token {self.deepgram_api_key}",
            "Content-Type": "audio/wav"
        }
        
        async with httpx.AsyncClient() as client:
            with open(audio_path, "rb") as audio:
                response = await client.post(url, headers=headers, content=audio, timeout=60.0)
            
            if response.status_code != 200:
                logger.error(f"Deepgram API error: {response.text}")
                raise Exception(f"Deepgram API returned {response.status_code}")
                
            data = response.json()
            transcript = data["results"]["channels"][0]["alternatives"][0]["transcript"]
            
            return {
                "text": transcript,
                "language": "en",
                "language_probability": 1.0,
                "segments": [], # Deepgram returns segments differently, adding base support for now
                "provider": "deepgram"
            }

asr_runner = ASRRunner()
