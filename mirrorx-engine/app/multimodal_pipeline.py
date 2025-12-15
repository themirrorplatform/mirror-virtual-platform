"""
Multimodal Reflection Pipelines
Video, Document, and Image processing for Mirror

Modalities:
- Video: Extract frames + audio, transcribe, visual analysis
- Document: PDF/text analysis, citation extraction, structure detection
- Image: Visual reflection analysis (drawings, screenshots, diagrams)
"""
import os
import tempfile
from typing import Dict, Any, Optional, List, BinaryIO
from datetime import datetime
from enum import Enum
import base64

from event_schema import create_event
from event_log import EventLog
from canonical_signing import Ed25519Signer


class VideoFormat(str, Enum):
    MP4 = "mp4"
    MOV = "mov"
    AVI = "avi"
    WEBM = "webm"


class DocumentFormat(str, Enum):
    PDF = "pdf"
    TXT = "txt"
    DOCX = "docx"
    MD = "markdown"


class ImageFormat(str, Enum):
    JPG = "jpg"
    PNG = "png"
    HEIC = "heic"
    SVG = "svg"


class VideoProcessor:
    """Process video reflections"""
    
    def __init__(
        self,
        event_log: EventLog,
        instance_id: str,
        user_id: str,
        signer_private_key_hex: str
    ):
        self.event_log = event_log
        self.instance_id = instance_id
        self.user_id = user_id
        self.signer_private_key_hex = signer_private_key_hex
    
    async def process_video(
        self,
        video_data: bytes,
        video_format: VideoFormat,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process video reflection:
        1. Extract audio → transcribe (like voice pipeline)
        2. Extract key frames
        3. Analyze visual content (optional)
        4. Create events
        """
        # Save video temporarily
        with tempfile.NamedTemporaryFile(
            suffix=f".{video_format.value}",
            delete=False
        ) as temp_video:
            temp_video.write(video_data)
            temp_video_path = temp_video.name
        
        try:
            # Extract audio using ffmpeg
            audio_path = await self._extract_audio(temp_video_path)
            
            # Transcribe audio (reuse voice pipeline)
            from voice_pipeline import WhisperLocalTranscriber
            transcriber = WhisperLocalTranscriber()
            transcription = await transcriber.transcribe(audio_path)
            
            # Extract key frames
            frames = await self._extract_key_frames(temp_video_path, num_frames=5)
            
            # Analyze frames (optional - requires vision model)
            visual_analysis = await self._analyze_frames(frames)
            
            # Create events
            signer = Ed25519Signer.from_private_hex(self.signer_private_key_hex)
            
            # Video transcribed event
            video_event = create_event(
                event_type="voice_transcribed",  # Reuse same event type
                instance_id=self.instance_id,
                user_id=self.user_id,
                transcript=transcription.transcript,
                provider="video_whisper",
                confidence=transcription.confidence,
                duration_seconds=transcription.duration_seconds,
                language=transcription.language,
                word_timestamps=transcription.word_timestamps
            )
            video_event.signature = signer.sign_dict(video_event.to_dict())
            self.event_log.append(video_event)
            
            # Reflection event with visual metadata
            reflection_event = create_event(
                event_type="reflection_created",
                instance_id=self.instance_id,
                user_id=self.user_id,
                content=transcription.transcript,
                modality="video",
                metadata={
                    **(metadata or {}),
                    "transcription_confidence": transcription.confidence,
                    "duration_seconds": transcription.duration_seconds,
                    "visual_analysis": visual_analysis,
                    "frame_count": len(frames)
                }
            )
            reflection_event.signature = signer.sign_dict(reflection_event.to_dict())
            self.event_log.append(reflection_event)
            
            return {
                "transcript": transcription.transcript,
                "confidence": transcription.confidence,
                "duration_seconds": transcription.duration_seconds,
                "visual_analysis": visual_analysis,
                "reflection_event_id": reflection_event.event_id,
                "frame_count": len(frames)
            }
            
        finally:
            # Cleanup
            if os.path.exists(temp_video_path):
                os.unlink(temp_video_path)
            if 'audio_path' in locals() and os.path.exists(audio_path):
                os.unlink(audio_path)
    
    async def _extract_audio(self, video_path: str) -> str:
        """Extract audio track from video"""
        import subprocess
        
        audio_path = video_path.replace('.mp4', '.wav')
        
        # Use ffmpeg to extract audio
        subprocess.run([
            'ffmpeg',
            '-i', video_path,
            '-vn',  # No video
            '-acodec', 'pcm_s16le',  # WAV format
            '-ar', '16000',  # 16kHz sample rate
            '-ac', '1',  # Mono
            audio_path
        ], check=True, capture_output=True)
        
        return audio_path
    
    async def _extract_key_frames(
        self,
        video_path: str,
        num_frames: int = 5
    ) -> List[bytes]:
        """Extract key frames from video"""
        import subprocess
        
        frames = []
        temp_dir = tempfile.mkdtemp()
        
        try:
            # Extract frames
            subprocess.run([
                'ffmpeg',
                '-i', video_path,
                '-vf', f'select=eq(pict_type\\,I)',  # Only I-frames (key frames)
                '-vsync', 'vfr',
                '-frames:v', str(num_frames),
                f'{temp_dir}/frame_%03d.jpg'
            ], check=True, capture_output=True)
            
            # Read frames
            for i in range(1, num_frames + 1):
                frame_path = f'{temp_dir}/frame_{i:03d}.jpg'
                if os.path.exists(frame_path):
                    with open(frame_path, 'rb') as f:
                        frames.append(f.read())
            
            return frames
            
        finally:
            # Cleanup
            import shutil
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
    
    async def _analyze_frames(self, frames: List[bytes]) -> Dict[str, Any]:
        """Analyze visual content of frames (requires vision model)"""
        # TODO: Implement with Claude Vision or GPT-4 Vision
        # For now, return placeholder
        return {
            "frame_count": len(frames),
            "analysis": "Visual analysis requires vision model",
            "detected_objects": [],
            "scene_description": None
        }


class DocumentProcessor:
    """Process document reflections"""
    
    def __init__(
        self,
        event_log: EventLog,
        instance_id: str,
        user_id: str,
        signer_private_key_hex: str
    ):
        self.event_log = event_log
        self.instance_id = instance_id
        self.user_id = user_id
        self.signer_private_key_hex = signer_private_key_hex
    
    async def process_document(
        self,
        document_data: bytes,
        document_format: DocumentFormat,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process document reflection:
        1. Extract text
        2. Detect structure (headings, lists, etc.)
        3. Extract citations/links
        4. Create reflection with document metadata
        """
        # Extract text based on format
        text = await self._extract_text(document_data, document_format)
        
        # Analyze structure
        structure = await self._analyze_structure(text, document_format)
        
        # Extract citations
        citations = await self._extract_citations(text)
        
        # Create reflection event
        signer = Ed25519Signer.from_private_hex(self.signer_private_key_hex)
        
        reflection_event = create_event(
            event_type="reflection_created",
            instance_id=self.instance_id,
            user_id=self.user_id,
            content=text,
            modality="document",
            metadata={
                **(metadata or {}),
                "document_format": document_format.value,
                "structure": structure,
                "citations": citations,
                "word_count": len(text.split()),
                "char_count": len(text)
            }
        )
        
        reflection_event.signature = signer.sign_dict(reflection_event.to_dict())
        self.event_log.append(reflection_event)
        
        return {
            "text": text[:500] + "..." if len(text) > 500 else text,
            "full_text_length": len(text),
            "word_count": len(text.split()),
            "structure": structure,
            "citations": citations,
            "reflection_event_id": reflection_event.event_id
        }
    
    async def _extract_text(
        self,
        document_data: bytes,
        document_format: DocumentFormat
    ) -> str:
        """Extract text from document"""
        if document_format == DocumentFormat.TXT or document_format == DocumentFormat.MD:
            return document_data.decode('utf-8')
        
        elif document_format == DocumentFormat.PDF:
            try:
                import PyPDF2
                import io
                
                pdf_file = io.BytesIO(document_data)
                reader = PyPDF2.PdfReader(pdf_file)
                
                text = []
                for page in reader.pages:
                    text.append(page.extract_text())
                
                return "\n\n".join(text)
            except ImportError:
                return "PDF extraction requires PyPDF2: pip install PyPDF2"
        
        elif document_format == DocumentFormat.DOCX:
            try:
                import docx
                import io
                
                doc = docx.Document(io.BytesIO(document_data))
                text = []
                for paragraph in doc.paragraphs:
                    text.append(paragraph.text)
                
                return "\n\n".join(text)
            except ImportError:
                return "DOCX extraction requires python-docx: pip install python-docx"
        
        return ""
    
    async def _analyze_structure(
        self,
        text: str,
        document_format: DocumentFormat
    ) -> Dict[str, Any]:
        """Analyze document structure"""
        structure = {
            "headings": [],
            "lists": [],
            "paragraphs": 0,
            "sections": 0
        }
        
        lines = text.split('\n')
        
        # Detect markdown headings
        if document_format == DocumentFormat.MD:
            for line in lines:
                if line.startswith('#'):
                    level = len(line) - len(line.lstrip('#'))
                    structure["headings"].append({
                        "level": level,
                        "text": line.lstrip('#').strip()
                    })
        
        # Count paragraphs (non-empty lines)
        structure["paragraphs"] = sum(1 for line in lines if line.strip())
        
        return structure
    
    async def _extract_citations(self, text: str) -> List[str]:
        """Extract citations/URLs from text"""
        import re
        
        # Find URLs
        url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
        urls = re.findall(url_pattern, text)
        
        return list(set(urls))  # Deduplicate


class ImageProcessor:
    """Process image reflections"""
    
    def __init__(
        self,
        event_log: EventLog,
        instance_id: str,
        user_id: str,
        signer_private_key_hex: str
    ):
        self.event_log = event_log
        self.instance_id = instance_id
        self.user_id = user_id
        self.signer_private_key_hex = signer_private_key_hex
    
    async def process_image(
        self,
        image_data: bytes,
        image_format: ImageFormat,
        user_caption: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process image reflection:
        1. Analyze image content (requires vision model)
        2. Extract text if present (OCR)
        3. Combine with user caption
        4. Create reflection
        """
        # Analyze image (requires vision model like Claude Vision)
        visual_analysis = await self._analyze_image(image_data, image_format)
        
        # OCR if needed
        ocr_text = await self._extract_text_from_image(image_data, image_format)
        
        # Combine caption + OCR + analysis
        content_parts = []
        if user_caption:
            content_parts.append(f"Caption: {user_caption}")
        if ocr_text:
            content_parts.append(f"Text in image: {ocr_text}")
        if visual_analysis.get("description"):
            content_parts.append(f"Visual content: {visual_analysis['description']}")
        
        content = "\n\n".join(content_parts)
        
        # Create reflection event
        signer = Ed25519Signer.from_private_hex(self.signer_private_key_hex)
        
        reflection_event = create_event(
            event_type="reflection_created",
            instance_id=self.instance_id,
            user_id=self.user_id,
            content=content,
            modality="image",
            metadata={
                **(metadata or {}),
                "image_format": image_format.value,
                "visual_analysis": visual_analysis,
                "ocr_text": ocr_text,
                "has_caption": user_caption is not None
            }
        )
        
        reflection_event.signature = signer.sign_dict(reflection_event.to_dict())
        self.event_log.append(reflection_event)
        
        return {
            "content": content,
            "visual_analysis": visual_analysis,
            "ocr_text": ocr_text,
            "reflection_event_id": reflection_event.event_id
        }
    
    async def _analyze_image(
        self,
        image_data: bytes,
        image_format: ImageFormat
    ) -> Dict[str, Any]:
        """Analyze image content with vision model"""
        # TODO: Implement with Claude Vision or GPT-4 Vision
        # For now, return placeholder
        
        # This would use Anthropic's vision API:
        # import anthropic
        # client = anthropic.Anthropic(api_key=...)
        # message = client.messages.create(
        #     model="claude-3-opus-20240229",
        #     max_tokens=1024,
        #     messages=[{
        #         "role": "user",
        #         "content": [
        #             {
        #                 "type": "image",
        #                 "source": {
        #                     "type": "base64",
        #                     "media_type": f"image/{image_format.value}",
        #                     "data": base64.b64encode(image_data).decode()
        #                 }
        #             },
        #             {
        #                 "type": "text",
        #                 "text": "Describe what you see in this image."
        #             }
        #         ]
        #     }]
        # )
        
        return {
            "description": "Image analysis requires vision model",
            "detected_objects": [],
            "scene_type": None,
            "colors": []
        }
    
    async def _extract_text_from_image(
        self,
        image_data: bytes,
        image_format: ImageFormat
    ) -> Optional[str]:
        """Extract text from image using OCR"""
        try:
            from PIL import Image
            import pytesseract
            import io
            
            image = Image.open(io.BytesIO(image_data))
            text = pytesseract.image_to_string(image)
            
            return text.strip() if text.strip() else None
            
        except ImportError:
            # OCR not available
            return None
        except Exception as e:
            print(f"OCR error: {e}")
            return None


class MultimodalPipeline:
    """Unified pipeline for all modalities"""
    
    def __init__(
        self,
        event_log: EventLog,
        instance_id: str,
        user_id: str,
        signer_private_key_hex: str
    ):
        self.video_processor = VideoProcessor(
            event_log, instance_id, user_id, signer_private_key_hex
        )
        self.document_processor = DocumentProcessor(
            event_log, instance_id, user_id, signer_private_key_hex
        )
        self.image_processor = ImageProcessor(
            event_log, instance_id, user_id, signer_private_key_hex
        )
    
    async def process(
        self,
        data: bytes,
        modality: str,
        format: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Universal processor - route to appropriate pipeline
        
        Args:
            data: Raw bytes
            modality: 'video', 'document', or 'image'
            format: Specific format (mp4, pdf, jpg, etc.)
            metadata: Optional metadata
        
        Returns:
            Processing result with reflection_event_id
        """
        if modality == "video":
            return await self.video_processor.process_video(
                data, VideoFormat(format), metadata
            )
        elif modality == "document":
            return await self.document_processor.process_document(
                data, DocumentFormat(format), metadata
            )
        elif modality == "image":
            return await self.image_processor.process_image(
                data, ImageFormat(format), metadata=metadata
            )
        else:
            raise ValueError(f"Unsupported modality: {modality}")


# Example usage
async def example_usage():
    """Example multimodal processing"""
    from event_log import EventLog
    from canonical_signing import Ed25519Signer
    
    event_log = EventLog("mirror_events.db")
    signer = Ed25519Signer.generate()
    
    pipeline = MultimodalPipeline(
        event_log=event_log,
        instance_id="instance-123",
        user_id="user-456",
        signer_private_key_hex=signer.private_hex()
    )
    
    # Process document
    with open("reflection.pdf", "rb") as f:
        result = await pipeline.process(
            data=f.read(),
            modality="document",
            format="pdf",
            metadata={"source": "journal_entry"}
        )
    
    print(f"Processed document: {result['reflection_event_id']}")
    print(f"Word count: {result['word_count']}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(example_usage())
