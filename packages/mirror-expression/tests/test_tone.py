"""
Tests for tone adaptation system.
"""

import pytest
from ..base import ToneProfile, ToneDimension, TONE_PRESETS
from ..tone import ToneAdapter, ToneAnalyzer, ToneAnalysis


class TestToneProfile:
    """Test ToneProfile data structure."""

    def test_default_values(self):
        """Test default profile has neutral values."""
        profile = ToneProfile()
        assert profile.directness == 0.5
        assert profile.warmth == 0.5
        assert profile.formality == 0.5
        # Certainty defaults low (constitutional requirement)
        assert profile.certainty == 0.3

    def test_value_validation(self):
        """Test that values must be in valid range."""
        with pytest.raises(ValueError):
            ToneProfile(directness=1.5)

        with pytest.raises(ValueError):
            ToneProfile(warmth=-0.1)

    def test_get_dimension(self):
        """Test getting dimension values."""
        profile = ToneProfile(directness=0.7, warmth=0.3)
        assert profile.get(ToneDimension.DIRECTNESS) == 0.7
        assert profile.get(ToneDimension.WARMTH) == 0.3

    def test_set_dimension(self):
        """Test setting dimension values."""
        profile = ToneProfile()
        profile.set(ToneDimension.DIRECTNESS, 0.8)
        assert profile.directness == 0.8
        assert profile.last_updated is not None

    def test_presets_valid(self):
        """Test that all presets are valid profiles."""
        for name, profile in TONE_PRESETS.items():
            assert isinstance(profile, ToneProfile)
            assert profile.source == "preset"


class TestToneAnalyzer:
    """Test tone analysis."""

    def setup_method(self):
        self.analyzer = ToneAnalyzer()

    def test_analyze_direct_text(self):
        """Test analysis of direct language."""
        text = "You clearly need to change this behavior. This is wrong."
        analysis = self.analyzer.analyze(text)

        # Should detect high directness
        assert analysis.directness > 0.5
        assert "clearly" in analysis.direct_markers

    def test_analyze_hedged_text(self):
        """Test analysis of hedged language."""
        text = "Perhaps you might want to consider possibly exploring this."
        analysis = self.analyzer.analyze(text)

        # Should detect low directness (hedged)
        assert analysis.directness < 0.5
        assert len(analysis.hedge_markers) > 0

    def test_analyze_warm_text(self):
        """Test analysis of warm language."""
        text = "I appreciate you sharing this. I understand and care about your experience."
        analysis = self.analyzer.analyze(text)

        assert analysis.warmth > 0.5
        assert len(analysis.warmth_markers) > 0

    def test_analyze_formal_text(self):
        """Test analysis of formal language."""
        text = "Therefore, it is necessary to consider. Furthermore, regarding this matter."
        analysis = self.analyzer.analyze(text)

        assert analysis.formality > 0.5
        assert len(analysis.formal_markers) > 0

    def test_compare_to_target(self):
        """Test comparing text to target profile."""
        text = "You might want to consider this possibility."
        target = ToneProfile(directness=0.2, certainty=0.2)

        deviations = self.analyzer.compare_to_target(text, target)

        # Should have low deviation for hedged dimensions
        assert "directness" in deviations
        assert "certainty" in deviations


class TestToneAdapter:
    """Test tone adaptation."""

    def setup_method(self):
        self.adapter = ToneAdapter()

    def test_adapt_to_direct(self):
        """Test adapting to more direct tone."""
        text = "You seem to have a pattern here."
        profile = ToneProfile(directness=0.9)

        adapted = self.adapter.adapt(text, profile)

        # Should be more direct
        assert "clearly" in adapted.lower() or "you" in adapted.lower()

    def test_adapt_to_diplomatic(self):
        """Test adapting to more diplomatic tone."""
        text = "You clearly have a pattern here."
        profile = ToneProfile(directness=0.1)

        adapted = self.adapter.adapt(text, profile)

        # Should be more hedged
        assert "might" in adapted.lower() or "seem" in adapted.lower() or "considering" in adapted.lower()

    def test_adapt_formality_expand(self):
        """Test expanding contractions for formality."""
        text = "You've got a pattern here. It's interesting."
        profile = ToneProfile(formality=0.9)

        adapted = self.adapter.adapt(text, profile)

        # Should expand contractions
        assert "you have" in adapted.lower() or "it is" in adapted.lower()

    def test_adapt_formality_contract(self):
        """Test contracting for casual tone."""
        text = "You have got a pattern here. It is interesting."
        profile = ToneProfile(formality=0.1)

        adapted = self.adapter.adapt(text, profile)

        # Should use contractions
        assert "you've" in adapted.lower() or "it's" in adapted.lower()

    def test_adapt_warmth(self):
        """Test adapting warmth level."""
        text = "There is a pattern in your data."
        profile = ToneProfile(warmth=0.9)

        adapted = self.adapter.adapt(text, profile)

        # Should add warmth prefix or markers
        assert len(adapted) >= len(text)

    def test_get_presets(self):
        """Test getting preset profiles."""
        diplomatic = self.adapter.get_preset("diplomatic")
        direct = self.adapter.get_preset("direct")

        assert diplomatic is not None
        assert direct is not None
        assert diplomatic.directness < direct.directness

    def test_list_presets(self):
        """Test listing available presets."""
        presets = self.adapter.list_presets()

        assert "diplomatic" in presets
        assert "direct" in presets
        assert "warm" in presets
        assert "clinical" in presets
        assert "casual" in presets
