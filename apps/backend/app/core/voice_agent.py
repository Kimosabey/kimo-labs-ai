import logging
import os
from dotenv import load_dotenv
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
)
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import openai, deepgram, silero

load_dotenv()

logger = logging.getLogger("voice-agent")
logger.setLevel(logging.INFO)

async def entrypoint(ctx: JobContext):
    logger.info(f"Connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Initialize the LLM with Ollama (via OpenAI compatibility)
    ollama_llm = openai.LLM.with_ollama(
        model="llama3:latest",
        base_url=f"{os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')}/v1",
    )

    # Initialize the Agent with instructions and plugins
    agent = Agent(
        instructions=(
            "You are Kimo, a high-intelligence research assistant for Kimo Labs. "
            "Your responses should be concise, professional, and accurate. "
            "You are currently operating in the Monolith Node environment."
        ),
        vad=silero.VAD.load(),
        stt=deepgram.STT(),
        llm=ollama_llm,
        tts=deepgram.TTS(),
    )

    # Launch the Agent Session in the room
    session = AgentSession(ctx.room, agent=agent)
    
    # Optional: Initial greeting
    await agent.say("Kimo Node active. How can I assist with your research today?", allow_interruptions=True)
    
    # Run the session until completion/interruption
    await session.run()

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
