"""
Platform Configuration

Unified configuration management for the Mirror platform.
Handles configuration from files, environment variables, and defaults.
"""

from dataclasses import dataclass, field
from typing import Dict, Optional, List, Any
from pathlib import Path
import os
import json


@dataclass
class StorageConfig:
    """Storage configuration."""
    type: str = "sqlite"  # sqlite, memory, supabase
    path: str = "~/.mirror/data.db"
    encryption_enabled: bool = True
    sync_enabled: bool = False
    sync_url: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "type": self.type,
            "path": self.path,
            "encryption_enabled": self.encryption_enabled,
            "sync_enabled": self.sync_enabled,
        }


@dataclass
class ProviderConfig:
    """AI provider configuration."""
    default_provider: str = "ollama"  # ollama, openai, anthropic
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "llama2"
    openai_model: str = "gpt-4"
    anthropic_model: str = "claude-3-sonnet-20240229"
    fallback_enabled: bool = True

    def to_dict(self) -> dict:
        return {
            "default_provider": self.default_provider,
            "ollama_url": self.ollama_url,
            "ollama_model": self.ollama_model,
            "fallback_enabled": self.fallback_enabled,
        }


@dataclass
class SessionConfig:
    """Session configuration."""
    warning_minutes: int = 45
    limit_minutes: int = 90
    max_messages: int = 100
    cooldown_minutes: int = 30

    def to_dict(self) -> dict:
        return {
            "warning_minutes": self.warning_minutes,
            "limit_minutes": self.limit_minutes,
            "max_messages": self.max_messages,
            "cooldown_minutes": self.cooldown_minutes,
        }


@dataclass
class ExpressionConfig:
    """Expression configuration."""
    default_tone: str = "balanced"  # diplomatic, direct, warm, clinical, balanced
    enable_calibration: bool = True
    enable_leaveability: bool = True

    def to_dict(self) -> dict:
        return {
            "default_tone": self.default_tone,
            "enable_calibration": self.enable_calibration,
            "enable_leaveability": self.enable_leaveability,
        }


@dataclass
class APIConfig:
    """API server configuration."""
    host: str = "127.0.0.1"
    port: int = 8000
    cors_origins: List[str] = field(default_factory=lambda: ["http://localhost:3000"])
    auth_enabled: bool = False
    rate_limit_requests: int = 100
    rate_limit_window: int = 60  # seconds

    def to_dict(self) -> dict:
        return {
            "host": self.host,
            "port": self.port,
            "cors_origins": self.cors_origins,
            "auth_enabled": self.auth_enabled,
        }


@dataclass
class MirrorPlatformConfig:
    """Complete platform configuration."""
    # Environment
    environment: str = "development"  # development, production
    debug: bool = False

    # Sub-configurations
    storage: StorageConfig = field(default_factory=StorageConfig)
    provider: ProviderConfig = field(default_factory=ProviderConfig)
    session: SessionConfig = field(default_factory=SessionConfig)
    expression: ExpressionConfig = field(default_factory=ExpressionConfig)
    api: APIConfig = field(default_factory=APIConfig)

    # Constitutional settings
    strict_mode: bool = True
    log_violations: bool = True
    show_axiom_references: bool = False

    # Paths
    config_dir: str = "~/.mirror"
    log_dir: str = "~/.mirror/logs"

    def to_dict(self) -> dict:
        return {
            "environment": self.environment,
            "debug": self.debug,
            "storage": self.storage.to_dict(),
            "provider": self.provider.to_dict(),
            "session": self.session.to_dict(),
            "expression": self.expression.to_dict(),
            "api": self.api.to_dict(),
            "strict_mode": self.strict_mode,
            "log_violations": self.log_violations,
            "show_axiom_references": self.show_axiom_references,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "MirrorPlatformConfig":
        """Create config from dictionary."""
        config = cls()

        if "environment" in data:
            config.environment = data["environment"]
        if "debug" in data:
            config.debug = data["debug"]
        if "strict_mode" in data:
            config.strict_mode = data["strict_mode"]
        if "log_violations" in data:
            config.log_violations = data["log_violations"]
        if "show_axiom_references" in data:
            config.show_axiom_references = data["show_axiom_references"]

        if "storage" in data:
            s = data["storage"]
            config.storage = StorageConfig(
                type=s.get("type", "sqlite"),
                path=s.get("path", "~/.mirror/data.db"),
                encryption_enabled=s.get("encryption_enabled", True),
                sync_enabled=s.get("sync_enabled", False),
            )

        if "provider" in data:
            p = data["provider"]
            config.provider = ProviderConfig(
                default_provider=p.get("default_provider", "ollama"),
                ollama_url=p.get("ollama_url", "http://localhost:11434"),
                ollama_model=p.get("ollama_model", "llama2"),
            )

        if "session" in data:
            s = data["session"]
            config.session = SessionConfig(
                warning_minutes=s.get("warning_minutes", 45),
                limit_minutes=s.get("limit_minutes", 90),
                max_messages=s.get("max_messages", 100),
            )

        if "expression" in data:
            e = data["expression"]
            config.expression = ExpressionConfig(
                default_tone=e.get("default_tone", "balanced"),
                enable_calibration=e.get("enable_calibration", True),
                enable_leaveability=e.get("enable_leaveability", True),
            )

        if "api" in data:
            a = data["api"]
            config.api = APIConfig(
                host=a.get("host", "127.0.0.1"),
                port=a.get("port", 8000),
            )

        return config


def get_config_path() -> Path:
    """Get the configuration file path."""
    # Check environment variable first
    env_path = os.environ.get("MIRROR_CONFIG")
    if env_path:
        return Path(env_path)

    # Default to ~/.mirror/config.json
    return Path.home() / ".mirror" / "config.json"


def load_config(config_path: Path = None) -> MirrorPlatformConfig:
    """
    Load configuration from file and environment.

    Priority (highest to lowest):
    1. Environment variables (MIRROR_*)
    2. Config file
    3. Defaults
    """
    config_path = config_path or get_config_path()

    # Start with defaults
    config = MirrorPlatformConfig()

    # Load from file if exists
    if config_path.exists():
        try:
            with open(config_path) as f:
                data = json.load(f)
            config = MirrorPlatformConfig.from_dict(data)
        except Exception:
            pass  # Use defaults on error

    # Override with environment variables
    config = _apply_env_overrides(config)

    return config


def _apply_env_overrides(config: MirrorPlatformConfig) -> MirrorPlatformConfig:
    """Apply environment variable overrides."""
    # Environment
    if os.environ.get("MIRROR_ENV"):
        config.environment = os.environ["MIRROR_ENV"]
    if os.environ.get("MIRROR_DEBUG"):
        config.debug = os.environ["MIRROR_DEBUG"].lower() == "true"

    # Provider
    if os.environ.get("MIRROR_PROVIDER"):
        config.provider.default_provider = os.environ["MIRROR_PROVIDER"]
    if os.environ.get("OLLAMA_URL"):
        config.provider.ollama_url = os.environ["OLLAMA_URL"]
    if os.environ.get("OPENAI_API_KEY"):
        config.provider.default_provider = "openai"
    if os.environ.get("ANTHROPIC_API_KEY"):
        config.provider.default_provider = "anthropic"

    # Storage
    if os.environ.get("MIRROR_STORAGE_TYPE"):
        config.storage.type = os.environ["MIRROR_STORAGE_TYPE"]
    if os.environ.get("MIRROR_STORAGE_PATH"):
        config.storage.path = os.environ["MIRROR_STORAGE_PATH"]

    # API
    if os.environ.get("MIRROR_API_PORT"):
        config.api.port = int(os.environ["MIRROR_API_PORT"])
    if os.environ.get("MIRROR_API_HOST"):
        config.api.host = os.environ["MIRROR_API_HOST"]

    return config


def save_config(config: MirrorPlatformConfig, config_path: Path = None):
    """Save configuration to file."""
    config_path = config_path or get_config_path()

    # Ensure directory exists
    config_path.parent.mkdir(parents=True, exist_ok=True)

    with open(config_path, "w") as f:
        json.dump(config.to_dict(), f, indent=2)


def ensure_directories(config: MirrorPlatformConfig):
    """Ensure required directories exist."""
    config_dir = Path(config.config_dir).expanduser()
    log_dir = Path(config.log_dir).expanduser()

    config_dir.mkdir(parents=True, exist_ok=True)
    log_dir.mkdir(parents=True, exist_ok=True)

    return config_dir, log_dir
