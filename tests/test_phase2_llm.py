"""
THE MIRROR: PHASE 2 TESTS
LLM Layer and Constitutional Enforcement

Tests verify:
- BaseLLM interface
- LocalLLM (Ollama) integration
- RemoteLLM optional/degradable
- L0AxiomChecker constitutional enforcement
- I2: Reflection-only (no advice)
- I7: Transparent/auditable
- I13: No outcome steering
"""

import pytest
from unittest.mock import Mock, patch, MagicMock

from mirror_os.llm.base import (
    BaseLLM, LLMConfig, LLMProvider, LLMResponse,
    LLMError, LLMConnectionError
)
from mirror_os.llm.local import LocalLLM
from mirror_os.llm.remote import RemoteLLM
from mirror_os.constitutional import L0AxiomChecker, ViolationType


class TestBaseLLM:
    """Test BaseLLM interface"""
    
    def test_config_validation_offline_network_conflict(self):
        """I1: Cannot claim works_offline if requires_network"""
        config = LLMConfig(
            provider=LLMProvider.LOCAL_OLLAMA,
            model="test",
            works_offline=True,
            requires_network=True  # Conflict!
        )
        
        with pytest.raises(ValueError, match="I1 VIOLATION"):
            # Create mock implementation
            class TestLLM(BaseLLM):
                def generate(self, *args, **kwargs):
                    pass
                def is_available(self):
                    return True
                def get_model_info(self):
                    return {}
            
            TestLLM(config)
    
    def test_prompt_hash_generation(self):
        """I7: Prompt hashing for auditability"""
        config = LLMConfig(
            provider=LLMProvider.LOCAL_OLLAMA,
            model="test"
        )
        
        class TestLLM(BaseLLM):
            def generate(self, *args, **kwargs):
                pass
            def is_available(self):
                return True
            def get_model_info(self):
                return {}
        
        llm = TestLLM(config)
        
        # Same prompt = same hash
        hash1 = llm.calculate_prompt_hash("test prompt")
        hash2 = llm.calculate_prompt_hash("test prompt")
        assert hash1 == hash2
        
        # Different prompt = different hash
        hash3 = llm.calculate_prompt_hash("different")
        assert hash1 != hash3
        
        # System prompt changes hash
        hash4 = llm.calculate_prompt_hash("test prompt", "system")
        assert hash1 != hash4


class TestLocalLLM:
    """Test LocalLLM (Ollama integration)"""
    
    def test_config_enforces_offline(self):
        """I1: Local LLM MUST work offline"""
        config = LLMConfig(
            provider=LLMProvider.LOCAL_OLLAMA,
            model="llama2",
            local_url="http://localhost:11434"
        )
        
        llm = LocalLLM(config)
        
        # Should be forced to offline mode
        assert llm.config.works_offline is True
        assert llm.config.requires_network is False
    
    @patch('mirror_os.llm.local.requests.get')
    def test_health_check(self, mock_get):
        """Test Ollama health check"""
        config = LLMConfig(
            provider=LLMProvider.LOCAL_OLLAMA,
            model="llama2"
        )
        llm = LocalLLM(config)
        
        # Available
        mock_get.return_value = Mock(status_code=200)
        assert llm.health_check() is True
        
        # Unavailable
        mock_get.side_effect = Exception("Connection refused")
        assert llm.health_check() is False
    
    @patch('mirror_os.llm.local.requests.post')
    @patch('mirror_os.llm.local.requests.get')
    def test_generate_success(self, mock_get, mock_post):
        """Test successful generation with Ollama"""
        config = LLMConfig(
            provider=LLMProvider.LOCAL_OLLAMA,
            model="llama2"
        )
        llm = LocalLLM(config)
        
        # Mock health check
        mock_get.return_value = Mock(status_code=200)
        
        # Mock generation
        mock_post.return_value = Mock(
            status_code=200,
            json=lambda: {
                'response': 'I notice you\'re feeling anxious.',
                'done': True,
                'eval_count': 50
            }
        )
        
        response = llm.generate(
            "I'm feeling really anxious today",
            mirror_id="user123"
        )
        
        assert response.content == "I notice you're feeling anxious."
        assert response.mirror_id == "user123"  # I2: Identity-scoped
        assert response.prompt_hash is not None  # I7: Auditable
        assert response.provider == LLMProvider.LOCAL_OLLAMA
    
    @patch('mirror_os.llm.local.requests.get')
    def test_unavailable_raises_error(self, mock_get):
        """Test error when Ollama not available"""
        config = LLMConfig(
            provider=LLMProvider.LOCAL_OLLAMA,
            model="llama2"
        )
        llm = LocalLLM(config)
        
        # Ollama not running
        mock_get.side_effect = Exception("Connection refused")
        
        with pytest.raises(LLMConnectionError, match="not available"):
            llm.generate("test", mirror_id="user123")


class TestRemoteLLM:
    """Test RemoteLLM (Claude/OpenAI)"""
    
    def test_config_enforces_network_required(self):
        """I1: Remote LLM requires network"""
        config = LLMConfig(
            provider=LLMProvider.REMOTE_CLAUDE,
            model="claude-3-sonnet",
            api_key="test_key"
        )
        
        llm = RemoteLLM(config)
        
        # Should be network-dependent
        assert llm.config.works_offline is False
        assert llm.config.requires_network is True
    
    def test_missing_api_key_raises_error(self):
        """Remote provider requires API key"""
        config = LLMConfig(
            provider=LLMProvider.REMOTE_CLAUDE,
            model="claude-3-sonnet"
            # No api_key!
        )
        
        with pytest.raises(ValueError, match="requires api_key"):
            RemoteLLM(config)
    
    def test_availability_check_graceful(self):
        """I1: System degrades gracefully if remote unavailable"""
        config = LLMConfig(
            provider=LLMProvider.REMOTE_CLAUDE,
            model="claude-3-sonnet",
            api_key="short"  # Too short, should fail validation
        )
        
        llm = RemoteLLM(config)
        
        # Should not crash, just return False
        available = llm.is_available()
        assert available is False  # No crash, graceful degradation


class TestL0AxiomChecker:
    """Test L0AxiomChecker constitutional enforcement"""
    
    def test_compliant_reflection_passes(self):
        """I2: Pure reflection should pass"""
        checker = L0AxiomChecker()
        
        reflection_text = (
            "I notice you're feeling anxious about work. "
            "There's a lot of uncertainty in what you described. "
            "I see a pattern of worry about things outside your control."
        )
        
        result = checker.check(reflection_text)
        
        assert result.passed is True
        assert result.blocked is False
        assert result.directive_ratio < checker.DIRECTIVE_THRESHOLD
        assert len(result.violations) == 0
    
    def test_directive_threshold_violation(self):
        """I2: >15% directive language is rejected"""
        checker = L0AxiomChecker()
        
        directive_text = (
            "You should try to relax more. "
            "I recommend taking deep breaths. "
            "You need to work on managing your anxiety. "
            "You must set goals to improve."
        )
        
        result = checker.check(directive_text)
        
        assert result.passed is False
        assert result.directive_ratio > checker.DIRECTIVE_THRESHOLD
        assert ViolationType.DIRECTIVE_THRESHOLD_EXCEEDED in result.violations
    
    def test_imperative_intent_blocked(self):
        """I2: Imperative language is blocked"""
        checker = L0AxiomChecker()
        
        imperative_text = "You should see a therapist. You must make changes."
        
        result = checker.check(imperative_text)
        
        assert result.blocked is True
        assert ViolationType.IMPERATIVE_INTENT in result.violations
        assert len(result.analysis['imperatives']) > 0
    
    def test_outcome_steering_blocked(self):
        """I13: Outcome steering is blocked"""
        checker = L0AxiomChecker()
        
        steering_text = (
            "Set a goal to meditate daily. "
            "Make a plan to achieve better mental health. "
            "Work towards feeling less anxious."
        )
        
        result = checker.check(steering_text)
        
        assert result.blocked is True
        assert ViolationType.OUTCOME_STEERING in result.violations
    
    def test_advice_language_detected(self):
        """I2: Advice-giving is detected"""
        checker = L0AxiomChecker()
        
        advice_text = "Try to exercise more. Consider talking to someone."
        
        result = checker.check(advice_text)
        
        assert ViolationType.ADVICE_LANGUAGE in result.violations
        assert len(result.analysis['advice_phrases']) > 0
    
    def test_future_projection_detected(self):
        """I13: Future projections are detected"""
        checker = L0AxiomChecker()
        
        future_text = (
            "You'll feel better if you do this. "
            "This will help you achieve peace."
        )
        
        result = checker.check(future_text)
        
        assert ViolationType.FUTURE_PROJECTION in result.violations
    
    def test_critical_severity_for_multiple_violations(self):
        """Multiple violations = critical severity"""
        checker = L0AxiomChecker()
        
        bad_text = (
            "You should set a goal to feel better. "
            "I recommend you try meditation. "
            "This will help you achieve happiness. "
            "You need to work on yourself."
        )
        
        result = checker.check(bad_text)
        
        assert result.severity == 'critical'
        assert result.blocked is True
        assert len(result.violations) >= 3
    
    def test_reflection_score(self):
        """Test reflection quality scoring"""
        checker = L0AxiomChecker()
        
        # Good reflection (multiple reflection markers)
        good = "I notice you're struggling. I see a pattern here. I wonder about that. I observe this tension."
        good_score = checker.get_reflection_score(good)
        assert good_score > 0.3  # Lower threshold due to sentence-based scoring
        
        # Bad directive
        bad = "You should do this. You must try that. I recommend this."
        bad_score = checker.get_reflection_score(bad)
        assert bad_score < 0.2
        
        # Good should score higher
        assert good_score > bad_score
    
    def test_transparency_analysis(self):
        """I7: Analysis must be transparent"""
        checker = L0AxiomChecker()
        
        text = "You should try this. I notice that pattern."
        result = checker.check(text)
        
        # Analysis must include detailed breakdown
        assert 'directive_ratio' in result.analysis
        assert 'imperatives_found' in result.analysis
        assert 'imperatives' in result.analysis
        assert result.analysis is not None


class TestConstitutionalIntegration:
    """Test LLM + L0AxiomChecker integration"""
    
    @patch('mirror_os.llm.local.requests.post')
    @patch('mirror_os.llm.local.requests.get')
    def test_end_to_end_constitutional_check(self, mock_get, mock_post):
        """Test full flow: Generate → Check → Accept/Reject"""
        # Setup LLM
        config = LLMConfig(
            provider=LLMProvider.LOCAL_OLLAMA,
            model="llama2"
        )
        llm = LocalLLM(config)
        checker = L0AxiomChecker()
        
        # Mock Ollama
        mock_get.return_value = Mock(status_code=200)
        
        # Test 1: Compliant generation
        mock_post.return_value = Mock(
            status_code=200,
            json=lambda: {
                'response': 'I notice you\'re feeling overwhelmed. There\'s a lot of pressure you described.',
                'done': True,
                'eval_count': 30
            }
        )
        
        response = llm.generate("I'm overwhelmed", mirror_id="user123")
        result = checker.check(response.content)
        
        assert result.passed is True
        assert result.blocked is False
        
        # Test 2: Non-compliant generation
        mock_post.return_value = Mock(
            status_code=200,
            json=lambda: {
                'response': 'You should try meditation. Set a goal to relax daily. This will help you feel better.',
                'done': True,
                'eval_count': 30
            }
        )
        
        response = llm.generate("I'm stressed", mirror_id="user123")
        result = checker.check(response.content)
        
        assert result.blocked is True  # REJECTED
        assert len(result.violations) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
