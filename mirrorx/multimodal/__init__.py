"""
Multimodal Package - Voice, Video, and Longform Processing

Provides unified interface for:
- Voice input (audio → transcript → reflection)
- Video input (frames → analysis)
- Longform text (chunking → section reflections)

Usage:
    from mirrorx.multimodal import MultimodalManager
    
    manager = MultimodalManager(storage)
    
    # Voice
    result = manager.process_voice_input(identity_id, "audio.mp3")
    manager.transcribe_voice(result['input_id'])
    
    # Longform
    result = manager.process_longform_text(identity_id, long_text)
    for i, chunk in enumerate(result['chunks']):
        # Create reflection for each chunk
        pass
"""

from .manager import MultimodalManager, Modality, ProcessingStatus

__all__ = ['MultimodalManager', 'Modality', 'ProcessingStatus']
