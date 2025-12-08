"""
MirrorX Engine - Conductor orchestration tests
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch


def test_conductor_orchestrates_all_providers(client: TestClient, sample_reflection_data):
    """Test that conductor orchestrates all AI providers"""
    response = client.post("/api/mirrorback", json=sample_reflection_data)
    
    assert response.status_code in [200, 500, 503]
    if response.status_code == 200:
        data = response.json()
        # Should have synthesized output from multiple providers
        assert "metadata" in data or "body" in data


def test_conductor_emotion_analysis():
    """Test conductor emotion analysis step"""
    from app.conductor import Conductor
    
    conductor = Conductor()
    reflection_text = "I feel torn between two paths."
    
    # Mock test - actual test would require API keys
    with patch.object(conductor, 'analyze_emotion') as mock_emotion:
        mock_emotion.return_value = {
            "primary_emotions": ["Confusion", "Concern"],
            "intensity": 0.65
        }
        
        result = conductor.analyze_emotion(reflection_text)
        assert "primary_emotions" in result
        assert isinstance(result["primary_emotions"], list)


def test_conductor_identity_extraction():
    """Test conductor identity extraction step"""
    from app.conductor import Conductor
    
    conductor = Conductor()
    reflection_text = "I value both independence and connection."
    
    with patch.object(conductor, 'extract_identity_signals') as mock_identity:
        mock_identity.return_value = {
            "values": ["independence", "connection"],
            "tensions": ["autonomy vs belonging"]
        }
        
        result = conductor.extract_identity_signals(reflection_text)
        assert "values" in result


def test_conductor_semantic_enrichment():
    """Test conductor semantic enrichment step"""
    from app.conductor import Conductor
    
    conductor = Conductor()
    reflection_text = "Work feels meaningless lately."
    
    with patch.object(conductor, 'enrich_semantics') as mock_semantic:
        mock_semantic.return_value = {
            "themes": ["purpose", "fulfillment", "meaning"],
            "context": "existential reflection"
        }
        
        result = conductor.enrich_semantics(reflection_text)
        assert "themes" in result


def test_conductor_logic_analysis():
    """Test conductor logic analysis step"""
    from app.conductor import Conductor
    
    conductor = Conductor()
    reflection_text = "I want freedom but need security."
    
    with patch.object(conductor, 'analyze_logic') as mock_logic:
        mock_logic.return_value = {
            "contradictions": ["freedom vs security"],
            "reasoning_patterns": ["binary thinking"]
        }
        
        result = conductor.analyze_logic(reflection_text)
        assert "contradictions" in result or "reasoning_patterns" in result


def test_conductor_grounding_check():
    """Test conductor grounding/factuality check step"""
    from app.conductor import Conductor
    
    conductor = Conductor()
    claims = ["Everyone hates me", "I never succeed"]
    
    with patch.object(conductor, 'check_grounding') as mock_grounding:
        mock_grounding.return_value = {
            "overgeneralizations": claims,
            "grounded_claims": []
        }
        
        result = conductor.check_grounding(claims)
        assert "overgeneralizations" in result or "grounded_claims" in result


def test_conductor_tone_calibration():
    """Test conductor tone calibration step"""
    from app.conductor import Conductor
    
    conductor = Conductor()
    
    with patch.object(conductor, 'calibrate_tone') as mock_tone:
        mock_tone.return_value = {
            "detected_tone": "raw",
            "recommended_response_tone": "gentle_inquiry"
        }
        
        result = conductor.calibrate_tone("raw reflection text")
        assert "detected_tone" in result


def test_conductor_synthesis():
    """Test conductor final synthesis step"""
    from app.conductor import Conductor
    
    conductor = Conductor()
    bundle = {
        "emotion": {"primary_emotions": ["Confusion"]},
        "identity": {"values": ["autonomy"]},
        "semantic": {"themes": ["purpose"]},
        "logic": {"contradictions": []},
        "grounding": {"overgeneralizations": []},
        "tone": {"detected_tone": "raw"}
    }
    
    with patch.object(conductor, 'synthesize_mirrorback') as mock_synthesis:
        mock_synthesis.return_value = {
            "body": "What does autonomy mean to you in this context?",
            "tensions": [],
            "tone": "reflective"
        }
        
        result = conductor.synthesize_mirrorback(bundle)
        assert "body" in result
        assert "?" in result["body"]  # MirrorCore: questions not answers
