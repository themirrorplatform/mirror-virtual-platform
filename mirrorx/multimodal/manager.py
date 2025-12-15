"""
Multimodal Input Manager - Voice, Video, and Longform Processing

Provides:
- Voice recording → transcript → reflection
- Video capture → analysis (opt-in)
- Longform text → chunked reflection
- Privacy controls for each modality

Sovereignty principle: All processing local-first, user controls data flow.
"""

import json
import os
from typing import Dict, List, Optional, BinaryIO
from datetime import datetime
from enum import Enum


class Modality(Enum):
    """Input modality types"""
    TEXT = "text"
    VOICE = "voice"
    VIDEO = "video"
    LONGFORM = "longform"


class ProcessingStatus(Enum):
    """Processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class MultimodalManager:
    """
    Manages multimodal input processing.
    
    Features:
    - Voice: Audio → Whisper → transcript → reflection
    - Video: Frames → vision model → analysis (opt-in)
    - Longform: Large text → chunking → section reflections
    - Privacy: All processing configurable, data retention controls
    """
    
    def __init__(self, storage):
        self.storage = storage
        self._ensure_multimodal_tables()
    
    def _ensure_multimodal_tables(self):
        """Create multimodal tracking tables"""
        
        # Multimodal inputs
        self.storage.conn.execute("""
            CREATE TABLE IF NOT EXISTS multimodal_inputs (
                id TEXT PRIMARY KEY,
                identity_id TEXT NOT NULL,
                modality TEXT NOT NULL CHECK(modality IN ('text', 'voice', 'video', 'longform')),
                status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
                file_path TEXT,
                file_size INTEGER,
                duration_seconds REAL,
                created_at TEXT NOT NULL,
                processed_at TEXT,
                transcript TEXT,
                metadata TEXT,  -- JSON
                FOREIGN KEY (identity_id) REFERENCES identities(id) ON DELETE CASCADE
            )
        """)
        
        # Processing results
        self.storage.conn.execute("""
            CREATE TABLE IF NOT EXISTS multimodal_reflections (
                id TEXT PRIMARY KEY,
                input_id TEXT NOT NULL,
                reflection_id TEXT NOT NULL,
                chunk_index INTEGER,  -- For longform
                chunk_text TEXT,
                created_at TEXT NOT NULL,
                metadata TEXT,  -- JSON
                FOREIGN KEY (input_id) REFERENCES multimodal_inputs(id) ON DELETE CASCADE,
                FOREIGN KEY (reflection_id) REFERENCES reflections(id) ON DELETE CASCADE
            )
        """)
        
        # Privacy controls
        self.storage.conn.execute("""
            CREATE TABLE IF NOT EXISTS multimodal_privacy (
                identity_id TEXT NOT NULL,
                modality TEXT NOT NULL,
                enabled INTEGER NOT NULL DEFAULT 1,
                retain_raw_files INTEGER NOT NULL DEFAULT 0,
                retain_transcripts INTEGER NOT NULL DEFAULT 1,
                auto_delete_after_days INTEGER,
                metadata TEXT,  -- JSON
                PRIMARY KEY (identity_id, modality),
                FOREIGN KEY (identity_id) REFERENCES identities(id) ON DELETE CASCADE
            )
        """)
        
        self.storage.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_multimodal_identity 
            ON multimodal_inputs(identity_id)
        """)
        
        self.storage.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_multimodal_status 
            ON multimodal_inputs(status)
        """)
        
        self.storage.conn.commit()
    
    def set_privacy_controls(
        self,
        identity_id: str,
        modality: str,
        enabled: bool = True,
        retain_raw_files: bool = False,
        retain_transcripts: bool = True,
        auto_delete_after_days: Optional[int] = None
    ) -> Dict:
        """
        Set privacy controls for a modality.
        
        Args:
            identity_id: User
            modality: voice/video/longform
            enabled: Allow this modality
            retain_raw_files: Keep original audio/video files
            retain_transcripts: Keep transcripts
            auto_delete_after_days: Auto-delete after N days
        
        Returns:
            Privacy control result
        """
        
        self.storage.conn.execute("""
            INSERT OR REPLACE INTO multimodal_privacy (
                identity_id, modality, enabled, retain_raw_files,
                retain_transcripts, auto_delete_after_days, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            identity_id,
            modality,
            1 if enabled else 0,
            1 if retain_raw_files else 0,
            1 if retain_transcripts else 0,
            auto_delete_after_days,
            json.dumps({})
        ))
        
        self.storage.conn.commit()
        
        return {
            'success': True,
            'identity_id': identity_id,
            'modality': modality,
            'enabled': enabled,
            'retain_raw_files': retain_raw_files,
            'retain_transcripts': retain_transcripts,
            'auto_delete_after_days': auto_delete_after_days
        }
    
    def get_privacy_controls(
        self,
        identity_id: str,
        modality: str
    ) -> Dict:
        """Get privacy controls for a modality"""
        
        cursor = self.storage.conn.execute("""
            SELECT * FROM multimodal_privacy
            WHERE identity_id = ? AND modality = ?
        """, (identity_id, modality))
        
        row = cursor.fetchone()
        
        if not row:
            # Default: enabled, don't retain raw, retain transcripts
            return {
                'enabled': True,
                'retain_raw_files': False,
                'retain_transcripts': True,
                'auto_delete_after_days': None
            }
        
        return {
            'enabled': bool(row['enabled']),
            'retain_raw_files': bool(row['retain_raw_files']),
            'retain_transcripts': bool(row['retain_transcripts']),
            'auto_delete_after_days': row['auto_delete_after_days']
        }
    
    def process_voice_input(
        self,
        identity_id: str,
        audio_file_path: str,
        whisper_model: str = "base"
    ) -> Dict:
        """
        Process voice recording.
        
        Flow: Audio file → Whisper transcription → Text reflection
        
        Args:
            identity_id: User
            audio_file_path: Path to audio file (wav, mp3, m4a)
            whisper_model: Whisper model size (tiny, base, small, medium, large)
        
        Returns:
            Processing result with input_id
        """
        
        # Check privacy controls
        privacy = self.get_privacy_controls(identity_id, Modality.VOICE.value)
        if not privacy['enabled']:
            return {
                'success': False,
                'error': 'Voice input disabled in privacy controls'
            }
        
        # Validate file exists
        if not os.path.exists(audio_file_path):
            return {
                'success': False,
                'error': 'Audio file not found'
            }
        
        file_size = os.path.getsize(audio_file_path)
        
        # Create input record
        input_id = f"voice_{os.urandom(16).hex()}"
        
        self.storage.conn.execute("""
            INSERT INTO multimodal_inputs (
                id, identity_id, modality, status, file_path,
                file_size, created_at, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            input_id,
            identity_id,
            Modality.VOICE.value,
            ProcessingStatus.PENDING.value,
            audio_file_path,
            file_size,
            datetime.utcnow().isoformat() + 'Z',
            json.dumps({'whisper_model': whisper_model})
        ))
        
        self.storage.conn.commit()
        
        return {
            'success': True,
            'input_id': input_id,
            'status': ProcessingStatus.PENDING.value,
            'message': 'Voice input queued for transcription',
            'next_step': 'Call transcribe_voice() to process'
        }
    
    def transcribe_voice(
        self,
        input_id: str
    ) -> Dict:
        """
        Transcribe voice input using Whisper.
        
        Note: Requires whisper library installed
        
        Args:
            input_id: Input to transcribe
        
        Returns:
            Transcription result
        """
        
        # Get input
        cursor = self.storage.conn.execute("""
            SELECT * FROM multimodal_inputs WHERE id = ?
        """, (input_id,))
        
        row = cursor.fetchone()
        if not row:
            return {
                'success': False,
                'error': 'Input not found'
            }
        
        if row['modality'] != Modality.VOICE.value:
            return {
                'success': False,
                'error': 'Not a voice input'
            }
        
        # Update status to processing
        self.storage.conn.execute("""
            UPDATE multimodal_inputs SET status = ? WHERE id = ?
        """, (ProcessingStatus.PROCESSING.value, input_id))
        self.storage.conn.commit()
        
        try:
            # Import Whisper (lazy import)
            import whisper
            
            metadata = json.loads(row['metadata'])
            model_size = metadata.get('whisper_model', 'base')
            
            # Load model
            model = whisper.load_model(model_size)
            
            # Transcribe
            result = model.transcribe(row['file_path'])
            transcript = result['text']
            
            # Update with transcript
            self.storage.conn.execute("""
                UPDATE multimodal_inputs 
                SET status = ?, transcript = ?, processed_at = ?
                WHERE id = ?
            """, (
                ProcessingStatus.COMPLETED.value,
                transcript,
                datetime.utcnow().isoformat() + 'Z',
                input_id
            ))
            
            # Check privacy: delete raw file if not retaining
            privacy = self.get_privacy_controls(
                row['identity_id'],
                Modality.VOICE.value
            )
            
            if not privacy['retain_raw_files']:
                try:
                    os.remove(row['file_path'])
                except:
                    pass
            
            self.storage.conn.commit()
            
            return {
                'success': True,
                'input_id': input_id,
                'transcript': transcript,
                'message': 'Transcription completed',
                'next_step': 'Create reflection from transcript'
            }
            
        except ImportError:
            self.storage.conn.execute("""
                UPDATE multimodal_inputs SET status = ? WHERE id = ?
            """, (ProcessingStatus.FAILED.value, input_id))
            self.storage.conn.commit()
            
            return {
                'success': False,
                'error': 'Whisper not installed. Run: pip install openai-whisper'
            }
        
        except Exception as e:
            self.storage.conn.execute("""
                UPDATE multimodal_inputs SET status = ? WHERE id = ?
            """, (ProcessingStatus.FAILED.value, input_id))
            self.storage.conn.commit()
            
            return {
                'success': False,
                'error': f'Transcription failed: {str(e)}'
            }
    
    def process_video_input(
        self,
        identity_id: str,
        video_file_path: str,
        extract_frames: bool = True,
        frame_interval_seconds: int = 5
    ) -> Dict:
        """
        Process video input (opt-in only).
        
        Flow: Video file → Frame extraction → Vision model analysis (future)
        
        Args:
            identity_id: User
            video_file_path: Path to video file
            extract_frames: Extract keyframes
            frame_interval_seconds: Seconds between frames
        
        Returns:
            Processing result
        """
        
        # Check privacy controls
        privacy = self.get_privacy_controls(identity_id, Modality.VIDEO.value)
        if not privacy['enabled']:
            return {
                'success': False,
                'error': 'Video input disabled in privacy controls'
            }
        
        # Validate file exists
        if not os.path.exists(video_file_path):
            return {
                'success': False,
                'error': 'Video file not found'
            }
        
        file_size = os.path.getsize(video_file_path)
        
        # Create input record
        input_id = f"video_{os.urandom(16).hex()}"
        
        self.storage.conn.execute("""
            INSERT INTO multimodal_inputs (
                id, identity_id, modality, status, file_path,
                file_size, created_at, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            input_id,
            identity_id,
            Modality.VIDEO.value,
            ProcessingStatus.PENDING.value,
            video_file_path,
            file_size,
            datetime.utcnow().isoformat() + 'Z',
            json.dumps({
                'extract_frames': extract_frames,
                'frame_interval': frame_interval_seconds
            })
        ))
        
        self.storage.conn.commit()
        
        return {
            'success': True,
            'input_id': input_id,
            'status': ProcessingStatus.PENDING.value,
            'message': 'Video input queued for processing',
            'note': 'Video analysis is opt-in and requires vision model integration'
        }
    
    def process_longform_text(
        self,
        identity_id: str,
        text: str,
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ) -> Dict:
        """
        Process longform text input.
        
        Flow: Large text → Chunking → Reflection per section
        
        Args:
            identity_id: User
            text: Long text content
            chunk_size: Characters per chunk
            chunk_overlap: Overlap between chunks for context
        
        Returns:
            Processing result with chunks
        """
        
        # Check privacy controls
        privacy = self.get_privacy_controls(identity_id, Modality.LONGFORM.value)
        if not privacy['enabled']:
            return {
                'success': False,
                'error': 'Longform input disabled in privacy controls'
            }
        
        # Create input record
        input_id = f"longform_{os.urandom(16).hex()}"
        
        # Chunk text
        chunks = self._chunk_text(text, chunk_size, chunk_overlap)
        
        self.storage.conn.execute("""
            INSERT INTO multimodal_inputs (
                id, identity_id, modality, status, file_size,
                created_at, processed_at, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            input_id,
            identity_id,
            Modality.LONGFORM.value,
            ProcessingStatus.COMPLETED.value,
            len(text),
            datetime.utcnow().isoformat() + 'Z',
            datetime.utcnow().isoformat() + 'Z',
            json.dumps({
                'chunk_count': len(chunks),
                'chunk_size': chunk_size,
                'chunk_overlap': chunk_overlap
            })
        ))
        
        self.storage.conn.commit()
        
        return {
            'success': True,
            'input_id': input_id,
            'chunks': chunks,
            'chunk_count': len(chunks),
            'message': f'Text chunked into {len(chunks)} sections',
            'next_step': 'Create reflection for each chunk'
        }
    
    def link_reflection_to_input(
        self,
        input_id: str,
        reflection_id: str,
        chunk_index: Optional[int] = None,
        chunk_text: Optional[str] = None
    ) -> Dict:
        """
        Link a reflection to its multimodal input source.
        
        Args:
            input_id: Source input
            reflection_id: Generated reflection
            chunk_index: For longform, which chunk
            chunk_text: For longform, the chunk content
        
        Returns:
            Link result
        """
        
        link_id = f"link_{os.urandom(16).hex()}"
        
        self.storage.conn.execute("""
            INSERT INTO multimodal_reflections (
                id, input_id, reflection_id, chunk_index,
                chunk_text, created_at, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            link_id,
            input_id,
            reflection_id,
            chunk_index,
            chunk_text,
            datetime.utcnow().isoformat() + 'Z',
            json.dumps({})
        ))
        
        self.storage.conn.commit()
        
        return {
            'success': True,
            'link_id': link_id
        }
    
    def get_input_history(
        self,
        identity_id: str,
        modality: Optional[str] = None
    ) -> List[Dict]:
        """Get multimodal input history"""
        
        if modality:
            cursor = self.storage.conn.execute("""
                SELECT id, modality, status, file_size, created_at, processed_at
                FROM multimodal_inputs
                WHERE identity_id = ? AND modality = ?
                ORDER BY created_at DESC
            """, (identity_id, modality))
        else:
            cursor = self.storage.conn.execute("""
                SELECT id, modality, status, file_size, created_at, processed_at
                FROM multimodal_inputs
                WHERE identity_id = ?
                ORDER BY created_at DESC
            """, (identity_id,))
        
        history = []
        for row in cursor.fetchall():
            history.append({
                'input_id': row['id'],
                'modality': row['modality'],
                'status': row['status'],
                'file_size': row['file_size'],
                'created_at': row['created_at'],
                'processed_at': row['processed_at']
            })
        
        return history
    
    def get_reflections_from_input(self, input_id: str) -> List[Dict]:
        """Get all reflections generated from an input"""
        
        cursor = self.storage.conn.execute("""
            SELECT mr.reflection_id, mr.chunk_index, r.content, r.created_at
            FROM multimodal_reflections mr
            JOIN reflections r ON mr.reflection_id = r.id
            WHERE mr.input_id = ?
            ORDER BY mr.chunk_index
        """, (input_id,))
        
        reflections = []
        for row in cursor.fetchall():
            reflections.append({
                'reflection_id': row['reflection_id'],
                'chunk_index': row['chunk_index'],
                'content': row['content'],
                'created_at': row['created_at']
            })
        
        return reflections
    
    def cleanup_old_inputs(
        self,
        identity_id: str,
        days_old: int = 30
    ) -> Dict:
        """
        Clean up old multimodal inputs based on retention policies.
        
        Args:
            identity_id: User
            days_old: Delete inputs older than this
        
        Returns:
            Cleanup result
        """
        
        from datetime import timedelta
        
        cutoff_date = (datetime.utcnow() - timedelta(days=days_old)).isoformat() + 'Z'
        
        # Get inputs to delete
        cursor = self.storage.conn.execute("""
            SELECT id, modality, file_path FROM multimodal_inputs
            WHERE identity_id = ? AND created_at < ?
        """, (identity_id, cutoff_date))
        
        inputs = cursor.fetchall()
        deleted_count = 0
        
        for row in inputs:
            input_id = row['id']
            modality = row['modality']
            file_path = row['file_path']
            
            # Check privacy controls
            privacy = self.get_privacy_controls(identity_id, modality)
            
            # Delete file if exists and not retaining
            if file_path and not privacy['retain_raw_files']:
                try:
                    if os.path.exists(file_path):
                        os.remove(file_path)
                except:
                    pass
            
            # Delete transcript if not retaining
            if not privacy['retain_transcripts']:
                self.storage.conn.execute("""
                    UPDATE multimodal_inputs SET transcript = NULL WHERE id = ?
                """, (input_id,))
            
            # Delete record
            self.storage.conn.execute("""
                DELETE FROM multimodal_inputs WHERE id = ?
            """, (input_id,))
            
            deleted_count += 1
        
        self.storage.conn.commit()
        
        return {
            'success': True,
            'deleted_count': deleted_count,
            'message': f'Deleted {deleted_count} inputs older than {days_old} days'
        }
    
    def _chunk_text(
        self,
        text: str,
        chunk_size: int,
        overlap: int
    ) -> List[str]:
        """
        Chunk text with overlap for context preservation.
        
        Args:
            text: Text to chunk
            chunk_size: Size of each chunk
            overlap: Overlap between chunks
        
        Returns:
            List of text chunks
        """
        
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + chunk_size
            
            # If not the last chunk, try to break at sentence boundary
            if end < text_length:
                # Look for sentence ending within last 100 chars
                search_start = max(end - 100, start)
                sentence_endings = [
                    text.rfind('. ', search_start, end),
                    text.rfind('! ', search_start, end),
                    text.rfind('? ', search_start, end),
                    text.rfind('\n\n', search_start, end)
                ]
                
                best_break = max(sentence_endings)
                if best_break > start:
                    end = best_break + 1
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # Move start position with overlap
            start = end - overlap
        
        return chunks
    
    def get_statistics(self, identity_id: str) -> Dict:
        """Get multimodal usage statistics"""
        
        cursor = self.storage.conn.execute("""
            SELECT 
                modality,
                COUNT(*) as count,
                SUM(file_size) as total_size,
                AVG(duration_seconds) as avg_duration
            FROM multimodal_inputs
            WHERE identity_id = ?
            GROUP BY modality
        """, (identity_id,))
        
        stats = {}
        for row in cursor.fetchall():
            stats[row['modality']] = {
                'count': row['count'],
                'total_size': row['total_size'],
                'avg_duration': row['avg_duration']
            }
        
        return stats
