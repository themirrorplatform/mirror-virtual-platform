"""
Voice Input Pipeline for Mirror
Transcription with Whisper (local) or Deepgram (cloud)

Flow:
1. User records voice reflection
2. Audio → transcription service
3. Store transcript (NOT audio - sovereignty)
4. Create VoiceTranscribedEvent
5. Process as text reflection
"""
import asyncio
import os
import tempfile
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'mirrorx-engine', 'app'))
from event_schema import create_event
from event_log import EventLog
from canonical_signing import Ed25519Signer


class TranscriptionProvider(str, Enum):
    WHISPER_LOCAL = "whisper_local"
    WHISPER_API = "whisper_api"
    DEEPGRAM = "deepgram"
    ASSEMBLY_AI = "assemblyai"


class TranscriptionResult:
    """Result of voice transcription"""
    def __init__(
        self,
        transcript: str,
        confidence: float,
        duration_seconds: float,
        provider: TranscriptionProvider,
        language: Optional[str] = None,
        word_timestamps: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.transcript = transcript
        self.confidence = confidence
        self.duration_seconds = duration_seconds
        self.provider = provider
        self.language = language
        self.word_timestamps = word_timestamps or []
        self.metadata = metadata or {}
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "transcript": self.transcript,
            "confidence": self.confidence,
            "duration_seconds": self.duration_seconds,
            "provider": self.provider.value,
            "language": self.language,
            "word_timestamps": self.word_timestamps,
            "metadata": self.metadata
        }


class WhisperLocalTranscriber:
    """Local Whisper transcription (privacy-first)"""
    
    def __init__(self, model_size: str = "base"):
        """
        Initialize Whisper model
        
        Args:
            model_size: tiny, base, small, medium, large
        """
        try:
            import whisper
            self.model = whisper.load_model(model_size)
            self.available = True
        except ImportError:
            print("Warning: whisper not installed. Run: pip install openai-whisper")
            self.available = False
    
    async def transcribe(
        self,
        audio_path: str,
        language: Optional[str] = None
    ) -> TranscriptionResult:
        """Transcribe audio file locally"""
        if not self.available:
            raise RuntimeError("Whisper not available")
        
        import whisper
        
        # Transcribe
        result = self.model.transcribe(
            audio_path,
            language=language,
            word_timestamps=True
        )
        
        # Extract word-level timestamps
        word_timestamps = []
        if 'segments' in result:
            for segment in result['segments']:
                if 'words' in segment:
                    for word in segment['words']:
                        word_timestamps.append({
                            'word': word.get('word', ''),
                            'start': word.get('start', 0),
                            'end': word.get('end', 0),
                            'confidence': word.get('probability', 0)
                        })
        
        # Get audio duration
        import wave
        import contextlib
        try:
            with contextlib.closing(wave.open(audio_path, 'r')) as f:
                frames = f.getnframes()
                rate = f.getframerate()
                duration = frames / float(rate)
        except:
            duration = 0.0
        
        return TranscriptionResult(
            transcript=result['text'].strip(),
            confidence=result.get('confidence', 0.9),
            duration_seconds=duration,
            provider=TranscriptionProvider.WHISPER_LOCAL,
            language=result.get('language'),
            word_timestamps=word_timestamps
        )


class WhisperAPITranscriber:
    """OpenAI Whisper API transcription"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        try:
            import openai
            self.client = openai.OpenAI(api_key=api_key)
            self.available = True
        except ImportError:
            print("Warning: openai not installed. Run: pip install openai")
            self.available = False
    
    async def transcribe(
        self,
        audio_path: str,
        language: Optional[str] = None
    ) -> TranscriptionResult:
        """Transcribe using OpenAI Whisper API"""
        if not self.available:
            raise RuntimeError("OpenAI client not available")
        
        with open(audio_path, 'rb') as audio_file:
            response = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language=language,
                response_format="verbose_json",
                timestamp_granularities=["word"]
            )
        
        # Extract word timestamps
        word_timestamps = []
        if hasattr(response, 'words') and response.words:
            for word in response.words:
                word_timestamps.append({
                    'word': word.word,
                    'start': word.start,
                    'end': word.end,
                    'confidence': 0.95  # API doesn't return confidence
                })
        
        return TranscriptionResult(
            transcript=response.text.strip(),
            confidence=0.95,  # Whisper API is generally high quality
            duration_seconds=response.duration if hasattr(response, 'duration') else 0.0,
            provider=TranscriptionProvider.WHISPER_API,
            language=response.language if hasattr(response, 'language') else language,
            word_timestamps=word_timestamps
        )


class DeepgramTranscriber:
    """Deepgram transcription (fast, accurate)"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        try:
            from deepgram import DeepgramClient, PrerecordedOptions
            self.client = DeepgramClient(api_key)
            self.PrerecordedOptions = PrerecordedOptions
            self.available = True
        except ImportError:
            print("Warning: deepgram-sdk not installed. Run: pip install deepgram-sdk")
            self.available = False
    
    async def transcribe(
        self,
        audio_path: str,
        language: Optional[str] = None
    ) -> TranscriptionResult:
        """Transcribe using Deepgram"""
        if not self.available:
            raise RuntimeError("Deepgram SDK not available")
        
        with open(audio_path, 'rb') as audio_file:
            audio_data = audio_file.read()
        
        options = self.PrerecordedOptions(
            model="nova-2",
            language=language or "en",
            smart_format=True,
            punctuate=True,
            paragraphs=True,
            utterances=True
        )
        
        response = self.client.listen.prerecorded.v("1").transcribe_file(
            {"buffer": audio_data},
            options
        )
        
        # Extract transcript and metadata
        transcript = response.results.channels[0].alternatives[0].transcript
        confidence = response.results.channels[0].alternatives[0].confidence
        
        # Extract word timestamps
        word_timestamps = []
        words = response.results.channels[0].alternatives[0].words
        for word in words:
            word_timestamps.append({
                'word': word.word,
                'start': word.start,
                'end': word.end,
                'confidence': word.confidence
            })
        
        # Get duration
        duration = response.metadata.duration if hasattr(response.metadata, 'duration') else 0.0
        
        return TranscriptionResult(
            transcript=transcript.strip(),
            confidence=confidence,
            duration_seconds=duration,
            provider=TranscriptionProvider.DEEPGRAM,
            language=language,
            word_timestamps=word_timestamps,
            metadata={
                'model': 'nova-2',
                'channels': response.metadata.channels
            }
        )


class VoiceInputPipeline:
    """Complete voice input pipeline"""
    
    def __init__(
        self,
        event_log: EventLog,
        instance_id: str,
        user_id: str,
        signer_private_key_hex: str,
        provider: TranscriptionProvider = TranscriptionProvider.WHISPER_LOCAL,
        api_key: Optional[str] = None
    ):
        self.event_log = event_log
        self.instance_id = instance_id
        self.user_id = user_id
        self.signer_private_key_hex = signer_private_key_hex
        self.provider = provider
        
        # Initialize appropriate transcriber
        if provider == TranscriptionProvider.WHISPER_LOCAL:
            self.transcriber = WhisperLocalTranscriber()
        elif provider == TranscriptionProvider.WHISPER_API:
            if not api_key:
                raise ValueError("API key required for Whisper API")
            self.transcriber = WhisperAPITranscriber(api_key)
        elif provider == TranscriptionProvider.DEEPGRAM:
            if not api_key:
                raise ValueError("API key required for Deepgram")
            self.transcriber = DeepgramTranscriber(api_key)
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    async def process_voice_reflection(
        self,
        audio_data: bytes,
        audio_format: str = "wav",
        language: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process voice reflection end-to-end
        
        Args:
            audio_data: Raw audio bytes
            audio_format: Audio format (wav, mp3, m4a, etc)
            language: Language code (en, es, etc)
            metadata: Optional metadata
        
        Returns:
            Dict with transcript, event_id, confidence
        """
        # Save audio to temporary file
        with tempfile.NamedTemporaryFile(
            suffix=f".{audio_format}",
            delete=False
        ) as temp_audio:
            temp_audio.write(audio_data)
            temp_audio_path = temp_audio.name
        
        try:
            # Transcribe
            result = await self.transcriber.transcribe(temp_audio_path, language)
            
            # Create VoiceTranscribedEvent
            event = create_event(
                event_type="voice_transcribed",
                instance_id=self.instance_id,
                user_id=self.user_id,
                transcript=result.transcript,
                provider=result.provider.value,
                confidence=result.confidence,
                duration_seconds=result.duration_seconds,
                language=result.language,
                word_timestamps=result.word_timestamps
            )
            
            # Sign and store
            signer = Ed25519Signer.from_private_hex(self.signer_private_key_hex)
            event.signature = signer.sign_dict(event.to_dict())
            self.event_log.append(event)
            
            # Now create ReflectionCreatedEvent with transcript
            reflection_event = create_event(
                event_type="reflection_created",
                instance_id=self.instance_id,
                user_id=self.user_id,
                content=result.transcript,
                modality="voice",
                metadata={
                    **(metadata or {}),
                    "transcription_confidence": result.confidence,
                    "duration_seconds": result.duration_seconds,
                    "language": result.language,
                    "provider": result.provider.value
                }
            )
            
            reflection_event.signature = signer.sign_dict(reflection_event.to_dict())
            self.event_log.append(reflection_event)
            
            return {
                "transcript": result.transcript,
                "confidence": result.confidence,
                "duration_seconds": result.duration_seconds,
                "language": result.language,
                "transcription_event_id": event.event_id,
                "reflection_event_id": reflection_event.event_id,
                "word_timestamps": result.word_timestamps
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_audio_path):
                os.unlink(temp_audio_path)
    
    async def process_voice_file(
        self,
        audio_path: str,
        language: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Process voice reflection from file path"""
        with open(audio_path, 'rb') as f:
            audio_data = f.read()
        
        # Determine format from extension
        audio_format = audio_path.split('.')[-1].lower()
        
        return await self.process_voice_reflection(
            audio_data=audio_data,
            audio_format=audio_format,
            language=language,
            metadata=metadata
        )


class VoiceBatchProcessor:
    """Batch process multiple voice files"""
    
    def __init__(self, pipeline: VoiceInputPipeline):
        self.pipeline = pipeline
    
    async def process_batch(
        self,
        audio_files: List[str],
        language: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Process multiple voice files in parallel"""
        tasks = [
            self.pipeline.process_voice_file(audio_path, language)
            for audio_path in audio_files
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions
        return [r for r in results if isinstance(r, dict)]


# Example usage
async def example_usage():
    """Example of voice pipeline usage"""
    from event_log import EventLog
    from canonical_signing import Ed25519Signer
    
    # Setup
    event_log = EventLog("mirror_events.db")
    signer = Ed25519Signer.generate()
    
    # Create pipeline with local Whisper (privacy-first)
    pipeline = VoiceInputPipeline(
        event_log=event_log,
        instance_id="instance-123",
        user_id="user-456",
        signer_private_key_hex=signer.private_hex(),
        provider=TranscriptionProvider.WHISPER_LOCAL
    )
    
    # Process voice file
    result = await pipeline.process_voice_file(
        audio_path="reflection.wav",
        language="en"
    )
    
    print(f"Transcript: {result['transcript']}")
    print(f"Confidence: {result['confidence']}")
    print(f"Duration: {result['duration_seconds']}s")
    print(f"Event ID: {result['reflection_event_id']}")


if __name__ == "__main__":
    asyncio.run(example_usage())
