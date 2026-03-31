import os
import asyncio
import logging
import subprocess
import tempfile
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TTS")

class TTSRunner:
    def __init__(self, model_path=None, config_path=None):
        """
        Initialize the TTS Runner.
        Defaults to checking a local 'data/models/piper' directory.
        """
        self.base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/models/piper"))
        self.model_path = model_path or os.path.join(self.base_dir, "en_US-lessac-medium.onnx")
        self.config_path = config_path or (self.model_path + ".json")
        self._lock = asyncio.Lock()

    async def generate_speech(self, text: str, output_path: str = None):
        """
        Generate speech from text using Piper CLI.
        Returns the path to the generated wav file.
        """
        if not output_path:
            temp_dir = tempfile.gettempdir()
            output_path = os.path.join(temp_dir, f"tts_{uuid.uuid4()}.wav")

        if not os.path.exists(self.model_path):
            logger.error(f"Piper model not found at {self.model_path}")
            # In a real scenario, we might want to auto-download or throw a specific error
            raise FileNotFoundError(f"Piper model not found. Please place it in {self.model_path}")

        async with self._lock:
            try:
                logger.info(f"Generating speech for: {text[:50]}...")
                
                # Piper CLI usage: echo "text" | piper --model model.onnx --output_file output.wav
                # Using subprocess for the CLI execution
                def run_piper():
                    process = subprocess.Popen(
                        ["piper", "--model", self.model_path, "--output_file", output_path],
                        stdin=subprocess.PIPE,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True
                    )
                    stdout, stderr = process.communicate(input=text)
                    if process.returncode != 0:
                        raise Exception(f"Piper error: {stderr}")
                    return output_path

                await asyncio.to_thread(run_piper)
                logger.info(f"Speech generated successfully at {output_path}")
                return output_path
                
            except Exception as e:
                logger.error(f"TTS generation error: {e}")
                raise

# Singleton instance
tts_runner = TTSRunner()
