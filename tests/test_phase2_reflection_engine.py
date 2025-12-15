"""
Tests for Phase 2 Part 3: Reflection Generation Engine

Tests the full integration:
Storage → Reflection → LLM → L0Check → Mirrorback → Storage
"""

import pytest
import tempfile
import os
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock

from mirror_os.storage.sqlite_storage import SQLiteStorage
from mirror_os.llm.base import BaseLLM, LLMConfig, LLMResponse, LLMProvider
from mirror_os.llm.local import LocalLLM
from mirror_os.constitutional import L0AxiomChecker, ViolationType
from mirror_os.core import MirrorbackGenerator, GenerationResult, GenerationError


@pytest.fixture
def temp_db():
    """Create temporary database"""
    fd, path = tempfile.mkstemp(suffix='.db')
    os.close(fd)
    yield path
    if os.path.exists(path):
        os.unlink(path)


@pytest.fixture
def storage(temp_db):
    """Initialize storage"""
    # SQLiteStorage initializes automatically in __init__
    storage = SQLiteStorage(temp_db)
    return storage


@pytest.fixture
def checker():
    """Initialize constitutional checker"""
    return L0AxiomChecker()


def create_test_mirror(storage, owner_id="test_user", label="Test User"):
    """Helper to create mirror with required parameters"""
    return storage.create_mirror(
        owner_id=owner_id,
        label=label,
        mirrorcore_version="1.0.0-test",
        constitution_hash="test_hash_123",
        constitution_version="1.0"
    )


@pytest.fixture
def mock_llm():
    """Mock LLM that returns good reflections"""
    llm = Mock(spec=BaseLLM)
    
    def generate_side_effect(prompt, mirror_id, system_prompt=None, **kwargs):
        # Return reflection-only content
        return LLMResponse(
            content="I notice you're expressing anxiety about work. There seems to be tension between wanting control and feeling overwhelmed.",
            model="test-model",
            provider=LLMProvider.LOCAL_OLLAMA,
            tokens_used=50,
            latency_ms=100,
            mirror_id=mirror_id,
            prompt_hash="abcd1234",
            finish_reason="stop"
        )
    
    llm.generate.side_effect = generate_side_effect
    return llm


@pytest.fixture
def mock_llm_directive():
    """Mock LLM that returns directives (should be blocked)"""
    llm = Mock(spec=BaseLLM)
    
    def generate_side_effect(prompt, mirror_id, system_prompt=None, **kwargs):
        # Return advice-filled content (violates I2)
        return LLMResponse(
            content="You should really try to set a goal for managing your anxiety. I recommend making a plan to prioritize tasks. You must take control of your schedule. This will help you feel better.",
            model="test-model",
            provider=LLMProvider.LOCAL_OLLAMA,
            tokens_used=50,
            latency_ms=100,
            mirror_id=mirror_id,
            prompt_hash="abcd1234",
            finish_reason="stop"
        )
    
    llm.generate.side_effect = generate_side_effect
    return llm


class TestMirrorbackGeneratorBasics:
    """Test basic initialization and configuration"""
    
    def test_initialization(self, storage, mock_llm, checker):
        """Should initialize with required components"""
        generator = MirrorbackGenerator(storage, mock_llm, checker)
        
        assert generator.storage == storage
        assert generator.llm == mock_llm
        assert generator.checker == checker
        assert generator.max_retries == 3
    
    def test_initialization_creates_checker(self, storage, mock_llm):
        """Should create L0AxiomChecker if not provided"""
        generator = MirrorbackGenerator(storage, mock_llm)
        
        assert generator.checker is not None
        assert isinstance(generator.checker, L0AxiomChecker)
    
    def test_system_prompt_reflection_only(self, storage, mock_llm, checker):
        """System prompt should enforce reflection-only (I2)"""
        generator = MirrorbackGenerator(storage, mock_llm, checker)
        
        prompt = generator.SYSTEM_PROMPT.lower()
        
        # Should mention reflection
        assert "reflect" in prompt
        
        # Should forbid advice
        assert "should" in prompt or "advice" in prompt
        assert "forbidden" in prompt or "not" in prompt


class TestSuccessfulGeneration:
    """Test successful mirrorback generation"""
    
    def test_generate_mirrorback_success(self, storage, mock_llm, checker):
        """Should generate mirrorback from reflection"""
        # Setup: Create mirror and reflection
        mirror = create_test_mirror(storage)
        reflection = storage.create_reflection(
            mirror.id,
            "I've been feeling anxious about work lately."
        )
        
        # Generate
        generator = MirrorbackGenerator(storage, mock_llm, checker)
        result = generator.generate(reflection.id, mirror.id)
        
        # Verify success
        assert result.success is True
        assert result.mirrorback is not None
        assert result.attempts == 1
        assert result.blocked_reason is None
        
        # Verify mirrorback content
        assert "notice" in result.mirrorback.content.lower()
        assert "anxiety" in result.mirrorback.content.lower()
        
        # Verify constitutional check passed
        assert result.constitutional_check is not None
        assert result.constitutional_check.passed is True
        assert result.constitutional_check.blocked is False
    
    def test_mirrorback_stored_in_database(self, storage, mock_llm, checker):
        """Generated mirrorback should be persisted"""
        mirror = create_test_mirror(storage)
        reflection = storage.create_reflection(
            mirror.id,
            "I'm feeling overwhelmed."
        )
        
        generator = MirrorbackGenerator(storage, mock_llm, checker)
        result = generator.generate(reflection.id, mirror.id)
        
        # Retrieve from storage
        retrieved = storage.get_mirrorback(result.mirrorback.id, mirror.id)
        
        assert retrieved is not None
        assert retrieved.id == result.mirrorback.id
        assert retrieved.reflection_id == reflection.id
    
    def test_constitutional_audit_logged(self, storage, mock_llm, checker):
        """Should log constitutional check to audit table (I7/I11)"""
        mirror = create_test_mirror(storage)
        reflection = storage.create_reflection(mirror.id, "Test content")
        
        generator = MirrorbackGenerator(storage, mock_llm, checker)
        result = generator.generate(reflection.id, mirror.id)
        
        # Get audit logs
        audits = storage.get_constitutional_audit(mirror.id)
        
        assert len(audits) > 0
        
        # Find the mirrorback generation log
        mirrorback_audits = [
            a for a in audits
            if a['check_type'] == "mirrorback_generation"
        ]
        
        assert len(mirrorback_audits) > 0
        audit = mirrorback_audits[0]
        
        assert "I2" in audit['invariants_checked']  # Reflection-only
        assert "I7" in audit['invariants_checked']  # Transparency
        assert "I13" in audit['invariants_checked']  # No optimization
        assert audit['all_passed'] is True
        assert audit['context_id'] == reflection.id
        assert audit['context_type'] == "reflection"
class TestConstitutionalBlocking:
    """Test that directives are blocked"""
    
    def test_directive_content_blocked(self, storage, mock_llm_directive, checker):
        """Should block content with >15% directives (I2)"""
        mirror = create_test_mirror(storage)
        reflection = storage.create_reflection(mirror.id, "I'm anxious.")
        
        generator = MirrorbackGenerator(storage, mock_llm_directive, checker, max_retries=1)
        result = generator.generate(reflection.id, mirror.id)
        
        # Should be blocked
        assert result.success is False
        assert result.mirrorback is None
        assert result.blocked_reason is not None
        
        # Should have constitutional check
        assert result.constitutional_check is not None
        assert result.constitutional_check.blocked is True
        assert result.constitutional_check.directive_ratio > 0.15
    
    def test_imperative_intent_blocked(self, storage, mock_llm_directive, checker):
        """Should block 'you should/must' language"""
        mirror = create_test_mirror(storage)
        reflection = storage.create_reflection(mirror.id, "Test")
        
        generator = MirrorbackGenerator(storage, mock_llm_directive, checker, max_retries=1)
        result = generator.generate(reflection.id, mirror.id)
        
        # Check violations
        assert ViolationType.IMPERATIVE_INTENT in result.constitutional_check.violations
    
    def test_outcome_steering_blocked(self, storage, mock_llm_directive, checker):
        """Should block goal-setting and outcome steering (I13)"""
        mirror = create_test_mirror(storage)
        reflection = storage.create_reflection(mirror.id, "Test")
        
        generator = MirrorbackGenerator(storage, mock_llm_directive, checker, max_retries=1)
        result = generator.generate(reflection.id, mirror.id)
        
        # Check for outcome steering violation
        assert ViolationType.OUTCOME_STEERING in result.constitutional_check.violations
    
    def test_blocked_reason_human_readable(self, storage, mock_llm_directive, checker):
        """Blocked reason should be human-readable"""
        mirror = create_test_mirror(storage)
        reflection = storage.create_reflection(mirror.id, "Test")
        
        generator = MirrorbackGenerator(storage, mock_llm_directive, checker, max_retries=1)
        result = generator.generate(reflection.id, mirror.id)
        
        assert result.blocked_reason is not None
        assert len(result.blocked_reason) > 0
        
        # Should mention specific violations
        reason_lower = result.blocked_reason.lower()
        assert any(word in reason_lower for word in ["directive", "imperative", "steering", "advice"])


class TestRetryLogic:
    """Test retry behavior on constitutional failures"""
    
    def test_retries_on_block(self, storage, checker):
        """Should retry generation if blocked"""
        mirror = create_test_mirror(storage)
        reflection = storage.create_reflection(mirror.id, "Test")
        
        # Mock LLM that fails twice, then succeeds
        llm = Mock(spec=BaseLLM)
        call_count = [0]
        
        def generate_side_effect(*args, **kwargs):
            call_count[0] += 1
            if call_count[0] <= 2:
                # Return directive content (blocked)
                return LLMResponse(
                    content="You should really try to do this. You must take action. Set a goal.",
                    model="test", provider=LLMProvider.LOCAL_OLLAMA,
                    tokens_used=20, latency_ms=100, mirror_id=mirror.id,
                    prompt_hash="abc", finish_reason="stop"
                )
            else:
                # Return good reflection
                return LLMResponse(
                    content="I notice you're exploring this. There seems to be tension here.",
                    model="test", provider=LLMProvider.LOCAL_OLLAMA,
                    tokens_used=20, latency_ms=100, mirror_id=mirror.id,
                    prompt_hash="abc", finish_reason="stop"
                )
        
        llm.generate.side_effect = generate_side_effect
        
        generator = MirrorbackGenerator(storage, llm, checker, max_retries=3)
        result = generator.generate(reflection.id, mirror.id)
        
        # Should succeed after retries
        assert result.success is True
        assert result.attempts == 3
        assert call_count[0] == 3
    
    def test_max_retries_exhausted(self, storage, mock_llm_directive, checker):
        """Should fail if all retries blocked"""
        mirror = create_test_mirror(storage)
        reflection = storage.create_reflection(mirror.id, "Test")
        
        generator = MirrorbackGenerator(storage, mock_llm_directive, checker, max_retries=2)
        result = generator.generate(reflection.id, mirror.id)
        
        assert result.success is False
        assert result.attempts == 2
        assert result.mirrorback is None
    
    def test_all_checks_logged(self, storage, mock_llm_directive, checker):
        """Should log all constitutional checks, even retries (I11)"""
        mirror = create_test_mirror(storage)
        reflection = storage.create_reflection(mirror.id, "Test")
        
        generator = MirrorbackGenerator(storage, mock_llm_directive, checker, max_retries=3)
        result = generator.generate(reflection.id, mirror.id)
        
        # All 3 attempts should be logged
        audits = storage.get_constitutional_audit(mirror.id)
        mirrorback_audits = [
            a for a in audits
            if a['check_type'] == "mirrorback_generation"
        ]
        
        assert len(mirrorback_audits) == 3
        
        # All should show failures
        for audit in mirrorback_audits:
            assert audit['all_passed'] is False


class TestIdentityScoping:
    """Test I2: Identity locality enforcement"""
    
    def test_requires_mirror_id(self, storage, mock_llm, checker):
        """Generation should require mirror_id (I2)"""
        mirror = create_test_mirror(storage)
        reflection = storage.create_reflection(mirror.id, "Test")
        
        generator = MirrorbackGenerator(storage, mock_llm, checker)
        result = generator.generate(reflection.id, mirror.id)
        
        # Should pass mirror_id to LLM
        mock_llm.generate.assert_called_once()
        call_kwargs = mock_llm.generate.call_args[1]
        assert call_kwargs['mirror_id'] == mirror.id
    
    def test_cannot_access_other_mirror_reflection(self, storage, mock_llm, checker):
        """Should not generate from another mirror's reflection"""
        mirror1 = create_test_mirror(storage, "user1", "User 1")
        mirror2 = create_test_mirror(storage, "user2", "User 2")
        
        reflection = storage.create_reflection(mirror1.id, "Private thought")
        
        generator = MirrorbackGenerator(storage, mock_llm, checker)
        
        # Try to generate with wrong mirror_id
        with pytest.raises(GenerationError):
            generator.generate(reflection.id, mirror2.id)


class TestMirrorbackRating:
    """Test I13: Rating restrictions"""
    
    def test_rate_mirrorback_resonance_fidelity_clarity(self, storage, mock_llm, checker):
        """Should allow resonance/fidelity/clarity ratings (I13)"""
        mirror = create_test_mirror(storage)
        reflection = storage.create_reflection(mirror.id, "Test")
        
        generator = MirrorbackGenerator(storage, mock_llm, checker)
        result = generator.generate(reflection.id, mirror.id)
        
        # Rate mirrorback
        updated = generator.rate_mirrorback(
            result.mirrorback.id,
            mirror.id,
            resonance=5,
            fidelity=4,
            clarity=5
        )
        
        assert updated.rating_resonance == 5
        assert updated.rating_fidelity == 4
        assert updated.rating_clarity == 5
    
    def test_no_helpfulness_rating(self, storage):
        """Should NOT have helpfulness rating (I13)"""
        # Check schema doesn't have helpfulness columns
        mirror = create_test_mirror(storage)
        reflection = storage.create_reflection(mirror.id, "Test")
        mirrorback = storage.create_mirrorback(
            mirror.id, reflection.id, "Test content",
            constitutional_check_passed=True,
            directive_ratio=0.05,
            imperative_intent_detected=False,
            outcome_steering_detected=False,
            engine_version="1.0",
            model_used="test-model"
        )
        
        # Should not have helpfulness attribute
        assert not hasattr(mirrorback, 'rating_helpfulness')
        assert not hasattr(mirrorback, 'rating_usefulness')


class TestOfflineOperation:
    """Test I1: Works without network"""
    
    @patch('mirror_os.llm.local.requests.get')
    @patch('mirror_os.llm.local.requests.post')
    def test_complete_flow_offline(self, mock_post, mock_get, storage, checker):
        """Should work completely offline with LocalLLM"""
        # Mock health check (GET /api/tags)
        mock_health = Mock()
        mock_health.status_code = 200
        mock_health.json.return_value = {"models": []}
        mock_get.return_value = mock_health
        
        # Mock Ollama response (POST /api/generate)
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "model": "llama2",
            "response": "I notice you're feeling anxious. There seems to be tension between work demands and your capacity.",
            "done": True
        }
        mock_post.return_value = mock_response
        
        # Use LocalLLM (offline)
        llm = LocalLLM(LLMConfig(
            provider=LLMProvider.LOCAL_OLLAMA,
            model="llama2",
            local_url="http://localhost:11434"
        ))
        
        mirror = create_test_mirror(storage)
        reflection = storage.create_reflection(mirror.id, "I'm anxious about work")
        
        generator = MirrorbackGenerator(storage, llm, checker)
        result = generator.generate(reflection.id, mirror.id)
        
        # Should succeed
        assert result.success is True
        
        # Should only call local endpoint (no external network)
        assert mock_post.called
        call_url = mock_post.call_args[0][0]
        assert "localhost" in call_url or "127.0.0.1" in call_url


class TestContextIntegration:
    """Test optional context (shapes, tensions)"""
    
    def test_generate_with_context(self, storage, mock_llm, checker):
        """Should accept optional context dict"""
        mirror = create_test_mirror(storage)
        reflection = storage.create_reflection(mirror.id, "Test")
        
        generator = MirrorbackGenerator(storage, mock_llm, checker)
        
        context = {
            'detected_shapes': ['uncertainty', 'control'],
            'detected_tensions': 'control ↔ surrender'
        }
        
        result = generator.generate(reflection.id, mirror.id, context=context)
        
        # Should pass context to checker
        assert result.success is True
    
    def test_prompt_includes_context(self, storage, mock_llm, checker):
        """Prompt should include detected patterns if provided"""
        mirror = create_test_mirror(storage)
        reflection = storage.create_reflection(mirror.id, "I feel uncertain")
        
        generator = MirrorbackGenerator(storage, mock_llm, checker)
        
        context = {
            'detected_shapes': ['uncertainty', 'control']
        }
        
        # Generate and inspect prompt
        result = generator.generate(reflection.id, mirror.id, context=context)
        
        # Check LLM was called with prompt mentioning shapes
        call_args = mock_llm.generate.call_args
        prompt = call_args[1]['prompt']
        
        assert 'uncertainty' in prompt.lower() or 'patterns' in prompt.lower()


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
