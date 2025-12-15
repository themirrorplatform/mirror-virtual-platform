# mirrorcore/config/settings.py
"""
MirrorCore Settings - Sovereign Configuration

This settings file defines how MirrorCore operates.
It is designed to work completely offline with no cloud dependencies.

Mode flags allow users to choose their level of sovereignty vs convenience.
"""

from pydantic_settings import BaseSettings
from typing import Literal, Optional
from pathlib import Path
import os


class MirrorSettings(BaseSettings):
    """
    Sovereign configuration for MirrorCore.
    
    Core principle: No required cloud dependencies.
    Everything optional, user-controlled, transparent.
    """
    
    # ==========================================
    # VERSION & IDENTITY
    # ==========================================
    
    version: str = "1.0.0"
    instance_name: str = "MirrorCore"
    
    # ==========================================
    # MODE FLAGS - How MirrorCore Operates
    # ==========================================
    
    mirror_mode: Literal["local", "hybrid", "cloud"] = "local"
    """
    - local: Everything offline, maximum sovereignty
    - hybrid: Local storage + optional cloud features
    - cloud: Hosted on platform (can still export to local)
    """
    
    engine_mode: Literal["local_llm", "remote_llm", "manual"] = "local_llm"
    """
    - local_llm: Use Ollama/LM Studio (fully offline)
    - remote_llm: Use Claude/OpenAI (user provides API key)
    - manual: No AI, just store and organize reflections
    """
    
    sync_enabled: bool = False
    """
    Whether to sync with platform. Always user-controlled.
    Disabled by default to protect privacy.
    """
    
    # ==========================================
    # STORAGE - Where Your Data Lives
    # ==========================================
    
    db_path: Optional[Path] = None
    """
    Path to local SQLite database.
    Defaults to: ~/.mirrorcore/mirror.db
    """
    
    data_dir: Optional[Path] = None
    """
    Directory for all MirrorCore data.
    Defaults to: ~/.mirrorcore/
    """
    
    # ==========================================
    # LOCAL LLM SETTINGS (Ollama/LM Studio)
    # ==========================================
    
    local_llm_url: str = "http://localhost:11434"
    """Ollama default endpoint"""
    
    local_llm_model: str = "llama2"
    """Model to use for local generation"""
    
    local_llm_timeout: int = 30
    """Timeout for local LLM requests (seconds)"""
    
    # ==========================================
    # REMOTE LLM SETTINGS (Optional)
    # ==========================================
    
    anthropic_api_key: Optional[str] = None
    """User's own API key - never required"""
    
    claude_model: str = "claude-sonnet-4-20250514"
    """Claude model to use if remote_llm enabled"""
    
    openai_api_key: Optional[str] = None
    """OpenAI API key - optional alternative"""
    
    # ==========================================
    # UPDATE SYSTEM - Sovereign Updates
    # ==========================================
    
    update_source: str = "mirror-systems/mirrorcore"
    """
    GitHub repo for updates.
    Users can change this to follow a fork.
    """
    
    update_channel: Literal["stable", "beta"] = "stable"
    """stable = production releases, beta = preview features"""
    
    auto_update_enabled: bool = False
    """
    Auto-check for updates in background.
    Always user-controlled, never forced.
    """
    
    auto_update_check_interval: int = 86400
    """How often to check (seconds). Default: daily"""
    
    # ==========================================
    # SYNC LAYER (Layer 2) - Optional Platform Connection
    # ==========================================
    
    sync_hub_url: Optional[str] = None
    """
    Platform URL for sync.
    Only used if sync_enabled = True.
    """
    
    sync_include_full_text: bool = False
    """
    Whether to sync full reflection text.
    Default: False (only summaries)
    """
    
    sync_include_identity: bool = False
    """
    Whether to sync identity graph.
    Default: False (keep fully local)
    """
    
    # ==========================================
    # PRIVACY & SECURITY
    # ==========================================
    
    encrypt_local_db: bool = False
    """Encrypt local database (future feature)"""
    
    require_auth_for_local_ui: bool = False
    """Require password for localhost UI (future feature)"""
    
    # ==========================================
    # DEVELOPMENT & DEBUGGING
    # ==========================================
    
    debug_mode: bool = False
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    
    # ==========================================
    # CONFIGURATION
    # ==========================================
    
    class Config:
        env_prefix = "MIRROR_"
        env_file = ".env"
        case_sensitive = False
    
    # ==========================================
    # HELPER METHODS
    # ==========================================
    
    def get_data_dir(self) -> Path:
        """Get data directory, creating if needed"""
        if self.data_dir:
            path = Path(self.data_dir)
        else:
            path = Path.home() / ".mirrorcore"
        
        path.mkdir(parents=True, exist_ok=True)
        return path
    
    def get_db_path(self) -> Path:
        """Get database path"""
        if self.db_path:
            return Path(self.db_path)
        return self.get_data_dir() / "mirror.db"
    
    def get_config_path(self) -> Path:
        """Get config file path"""
        return self.get_data_dir() / "config.json"
    
    def is_sovereign(self) -> bool:
        """Check if running in fully sovereign mode (no cloud deps)"""
        return (
            self.mirror_mode == "local" and
            self.engine_mode == "local_llm" and
            not self.sync_enabled
        )
    
    def requires_api_key(self) -> bool:
        """Check if current config requires API key"""
        return self.engine_mode == "remote_llm"
    
    def validate_config(self) -> list[str]:
        """
        Validate configuration and return list of warnings/errors.
        Returns empty list if all good.
        """
        issues = []
        
        # Check API key if required
        if self.engine_mode == "remote_llm":
            if not self.anthropic_api_key and not self.openai_api_key:
                issues.append(
                    "remote_llm mode requires anthropic_api_key or openai_api_key"
                )
        
        # Check sync requirements
        if self.sync_enabled and not self.sync_hub_url:
            issues.append("sync_enabled requires sync_hub_url to be set")
        
        # Check local LLM availability (future: actually test connection)
        if self.engine_mode == "local_llm":
            # Future: ping local_llm_url to verify it's running
            pass
        
        return issues


# Global singleton instance
_settings: Optional[MirrorSettings] = None


def get_settings() -> MirrorSettings:
    """Get global settings instance"""
    global _settings
    if _settings is None:
        _settings = MirrorSettings()
    return _settings


def reset_settings():
    """Reset settings (useful for testing)"""
    global _settings
    _settings = None


# Alias for backward compatibility
EngineSettings = MirrorSettings

# Export both names for compatibility
__all__ = ['MirrorSettings', 'EngineSettings', 'get_settings', 'reset_settings']
