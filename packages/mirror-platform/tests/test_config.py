"""
Tests for platform configuration.
"""

import pytest
import json
from pathlib import Path
from tempfile import TemporaryDirectory

from ..config import (
    MirrorPlatformConfig,
    StorageConfig,
    ProviderConfig,
    SessionConfig,
    ExpressionConfig,
    APIConfig,
    load_config,
    save_config,
    get_config_path,
    ensure_directories,
)


class TestStorageConfig:
    """Test storage configuration."""

    def test_default_values(self):
        """Test default storage configuration."""
        config = StorageConfig()

        assert config.type == "sqlite"
        assert config.sync_enabled is False

    def test_custom_path(self):
        """Test custom storage path."""
        config = StorageConfig(
            local_path="/custom/path",
            type="postgres",
        )

        assert config.local_path == "/custom/path"
        assert config.type == "postgres"


class TestProviderConfig:
    """Test provider configuration."""

    def test_default_provider(self):
        """Test default provider is ollama."""
        config = ProviderConfig()

        assert config.default_provider == "ollama"
        assert config.ollama_model == "llama3.2"

    def test_anthropic_config(self):
        """Test Anthropic configuration."""
        config = ProviderConfig(
            default_provider="anthropic",
            anthropic_model="claude-3-opus-20240229",
        )

        assert config.default_provider == "anthropic"
        assert "claude" in config.anthropic_model


class TestSessionConfig:
    """Test session configuration."""

    def test_default_limits(self):
        """Test default session limits."""
        config = SessionConfig()

        assert config.warning_minutes == 45
        assert config.hard_limit_minutes == 90
        assert config.max_messages == 100

    def test_custom_limits(self):
        """Test custom session limits."""
        config = SessionConfig(
            warning_minutes=30,
            hard_limit_minutes=60,
            max_messages=50,
        )

        assert config.warning_minutes == 30
        assert config.hard_limit_minutes == 60
        assert config.max_messages == 50


class TestExpressionConfig:
    """Test expression configuration."""

    def test_default_tone(self):
        """Test default tone is balanced."""
        config = ExpressionConfig()

        assert config.default_tone == "balanced"

    def test_custom_tone(self):
        """Test custom tone configuration."""
        config = ExpressionConfig(
            default_tone="diplomatic",
            formality=0.8,
            warmth=0.7,
        )

        assert config.default_tone == "diplomatic"
        assert config.formality == 0.8
        assert config.warmth == 0.7


class TestAPIConfig:
    """Test API configuration."""

    def test_default_host_port(self):
        """Test default host and port."""
        config = APIConfig()

        assert config.host == "127.0.0.1"
        assert config.port == 8000

    def test_cors_origins(self):
        """Test CORS origins configuration."""
        config = APIConfig(
            cors_origins=["http://localhost:3000", "http://example.com"]
        )

        assert len(config.cors_origins) == 2
        assert "http://localhost:3000" in config.cors_origins


class TestMirrorPlatformConfig:
    """Test main platform configuration."""

    def test_default_config(self):
        """Test default configuration."""
        config = MirrorPlatformConfig()

        assert config.environment == "development"
        assert config.strict_mode is True
        assert config.storage is not None
        assert config.provider is not None
        assert config.session is not None

    def test_to_dict(self):
        """Test serialization to dict."""
        config = MirrorPlatformConfig()
        data = config.to_dict()

        assert "environment" in data
        assert "storage" in data
        assert "provider" in data
        assert "session" in data

    def test_from_dict(self):
        """Test deserialization from dict."""
        data = {
            "environment": "production",
            "strict_mode": True,
            "storage": {"type": "postgres"},
            "provider": {"default_provider": "anthropic"},
        }

        config = MirrorPlatformConfig.from_dict(data)

        assert config.environment == "production"
        assert config.storage.type == "postgres"
        assert config.provider.default_provider == "anthropic"

    def test_roundtrip(self):
        """Test serialization roundtrip."""
        original = MirrorPlatformConfig(
            environment="staging",
            strict_mode=True,
        )

        data = original.to_dict()
        restored = MirrorPlatformConfig.from_dict(data)

        assert restored.environment == original.environment
        assert restored.strict_mode == original.strict_mode


class TestConfigIO:
    """Test configuration file I/O."""

    def test_save_and_load(self):
        """Test saving and loading configuration."""
        with TemporaryDirectory() as tmpdir:
            config_path = Path(tmpdir) / "config.json"

            original = MirrorPlatformConfig(
                environment="test",
            )

            save_config(original, config_path)
            loaded = load_config(config_path)

            assert loaded.environment == "test"

    def test_load_nonexistent_returns_default(self):
        """Test loading nonexistent file returns defaults."""
        config = load_config(Path("/nonexistent/path/config.json"))

        assert config is not None
        assert config.environment == "development"

    def test_ensure_directories(self):
        """Test directory creation."""
        with TemporaryDirectory() as tmpdir:
            config = MirrorPlatformConfig()
            config.storage.local_path = str(Path(tmpdir) / "mirror_data")

            ensure_directories(config)

            assert Path(config.storage.local_path).exists()


class TestConfigPath:
    """Test configuration path resolution."""

    def test_get_config_path(self):
        """Test getting default config path."""
        path = get_config_path()

        assert path is not None
        assert "mirror" in str(path).lower()
