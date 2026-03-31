import os
import asyncio
import logging
from faster_whisper import WhisperModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ASR")

class ASRRunner:
    def __init__(self, model_size="base", device="cpu", compute_type="int8"):
        """
        Initialize the ASR Runner.
        - model_size: 'tiny', 'base', 'small', 'medium', 'large-v3'
        - device: 'cpu' or 'cuda' (for local Mac, we use 'cpu' or 'auto')
        """
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self.model = None
        self._lock = asyncio.Lock()

    async def load_model(self):
        async with self._lock:
            if self.model is None:
                try:
                    logger.info(f"Loading Whisper model: {self.model_size} on {self.device}...")
                    # Run the blocking model loading in a thread to avoid blocking the event loop
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

    async def transcribe(self, audio_path: str):
        """
        Transcribe an audio file and return the full text and metadata.
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        model = await self.load_model()
        
        try:
            # model.transcribe is blocking inside the generator, using asyncio.to_thread for the generator execution would be complex
            # For local use, running the generator iteration in a thread is safer
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
                "segments": segments
            }
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            raise

# Singleton instance
asr_runner = ASRRunner()
