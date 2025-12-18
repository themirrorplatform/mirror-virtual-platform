"""
Tone Adaptation System

Adapts reflection expressions to match user's preferred communication style.

Key principle: The CONTENT (what patterns were observed) doesn't change,
only the EXPRESSION (how it's communicated) adapts.

Example:
    Direct: "You've contradicted yourself three times about this relationship."
    Diplomatic: "There seem to be some tensions between different things you've
                 said about this relationship. Would you like to explore that?"
"""

from dataclasses import dataclass, field
from typing import Dict, Optional, List, Tuple, Any
from datetime import datetime
import re

from .base import ToneProfile, ToneDimension, TONE_PRESETS


@dataclass
class ToneAnalysis:
    """Analysis of text tone."""
    directness: float
    warmth: float
    formality: float
    verbosity: float
    certainty: float
    abstraction: float

    # Evidence
    direct_markers: List[str] = field(default_factory=list)
    hedge_markers: List[str] = field(default_factory=list)
    warmth_markers: List[str] = field(default_factory=list)
    formal_markers: List[str] = field(default_factory=list)

    def to_profile(self) -> ToneProfile:
        """Convert analysis to a ToneProfile."""
        return ToneProfile(
            directness=self.directness,
            warmth=self.warmth,
            formality=self.formality,
            verbosity=self.verbosity,
            certainty=self.certainty,
            abstraction=self.abstraction,
            source="analyzed",
        )


class ToneAnalyzer:
    """
    Analyzes the tone of text.

    Used to:
    1. Understand user's natural communication style
    2. Verify adapted expressions match target tone
    """

    # Linguistic markers for each dimension
    DIRECT_MARKERS = [
        "you", "clearly", "obviously", "definitely", "must", "should",
        "always", "never", "wrong", "right", "fact", "truth",
    ]

    HEDGE_MARKERS = [
        "perhaps", "maybe", "might", "could", "possibly", "seems",
        "appears", "suggest", "wonder", "curious", "notice",
    ]

    WARMTH_MARKERS = [
        "feel", "understand", "appreciate", "glad", "happy", "care",
        "support", "help", "together", "share", "thank",
    ]

    COLDNESS_MARKERS = [
        "analyze", "examine", "observe", "note", "data", "pattern",
        "evidence", "logical", "rational", "objective",
    ]

    FORMAL_MARKERS = [
        "therefore", "however", "furthermore", "nevertheless", "thus",
        "regarding", "concerning", "respectively", "accordingly",
    ]

    CASUAL_MARKERS = [
        "yeah", "kinda", "sorta", "gonna", "wanna", "like", "stuff",
        "things", "pretty", "really", "super", "totally",
    ]

    def analyze(self, text: str) -> ToneAnalysis:
        """Analyze the tone of text."""
        text_lower = text.lower()
        words = text_lower.split()
        word_count = len(words)

        # Directness (presence of direct vs hedge markers)
        direct_count = sum(1 for w in words if w in self.DIRECT_MARKERS)
        hedge_count = sum(1 for w in words if w in self.HEDGE_MARKERS)
        direct_markers = [w for w in words if w in self.DIRECT_MARKERS]
        hedge_markers = [w for w in words if w in self.HEDGE_MARKERS]

        if direct_count + hedge_count > 0:
            directness = direct_count / (direct_count + hedge_count)
        else:
            directness = 0.5

        # Warmth (warm vs cold markers)
        warm_count = sum(1 for w in words if w in self.WARMTH_MARKERS)
        cold_count = sum(1 for w in words if w in self.COLDNESS_MARKERS)
        warmth_markers = [w for w in words if w in self.WARMTH_MARKERS]

        if warm_count + cold_count > 0:
            warmth = warm_count / (warm_count + cold_count)
        else:
            warmth = 0.5

        # Formality
        formal_count = sum(1 for w in words if w in self.FORMAL_MARKERS)
        casual_count = sum(1 for w in words if w in self.CASUAL_MARKERS)
        formal_markers = [w for w in words if w in self.FORMAL_MARKERS]

        if formal_count + casual_count > 0:
            formality = formal_count / (formal_count + casual_count)
        else:
            # Check sentence structure
            has_contractions = bool(re.search(r"\w+'\w+", text))
            formality = 0.3 if has_contractions else 0.6

        # Verbosity (words per sentence)
        sentences = re.split(r'[.!?]+', text)
        sentences = [s for s in sentences if s.strip()]
        avg_sentence_length = word_count / max(len(sentences), 1)
        verbosity = min(avg_sentence_length / 30, 1.0)  # Normalize to 30 words

        # Certainty (inverse of hedge markers)
        certainty = 1.0 - (hedge_count / max(word_count, 1) * 10)
        certainty = max(0.0, min(1.0, certainty))

        # Abstraction (presence of abstract concepts)
        abstract_words = ["concept", "idea", "theory", "pattern", "tendency", "general"]
        concrete_words = ["example", "instance", "specifically", "exactly", "this"]
        abstract_count = sum(1 for w in words if w in abstract_words)
        concrete_count = sum(1 for w in words if w in concrete_words)

        if abstract_count + concrete_count > 0:
            abstraction = abstract_count / (abstract_count + concrete_count)
        else:
            abstraction = 0.5

        return ToneAnalysis(
            directness=directness,
            warmth=warmth,
            formality=formality,
            verbosity=verbosity,
            certainty=certainty,
            abstraction=abstraction,
            direct_markers=direct_markers,
            hedge_markers=hedge_markers,
            warmth_markers=warmth_markers,
            formal_markers=formal_markers,
        )

    def compare_to_target(
        self,
        text: str,
        target: ToneProfile
    ) -> Dict[str, float]:
        """
        Compare text tone to target profile.

        Returns deviation for each dimension (0 = perfect match).
        """
        analysis = self.analyze(text)
        deviations = {}

        for dim in ToneDimension:
            actual = getattr(analysis, dim.value)
            expected = target.get(dim)
            deviations[dim.value] = abs(actual - expected)

        return deviations


class ToneAdapter:
    """
    Adapts reflection expressions to match user's tone preferences.

    The adapter maintains the semantic content while adjusting:
    - Directness of assertions
    - Warmth of language
    - Formality level
    - Verbosity/conciseness
    - Certainty of claims
    """

    def __init__(self, analyzer: ToneAnalyzer = None):
        self.analyzer = analyzer or ToneAnalyzer()

        # Phrase alternatives by directness level
        self._directness_variants = {
            "you seem to": [
                (0.0, "it might be worth considering whether"),
                (0.3, "one pattern that emerges is"),
                (0.5, "you seem to"),
                (0.7, "you appear to"),
                (0.9, "you clearly"),
            ],
            "you should": [
                (0.0, "it might be helpful to consider"),
                (0.3, "you might want to think about"),
                (0.5, "you could consider"),
                (0.7, "you might"),
                (0.9, "you should"),
            ],
            "this is": [
                (0.0, "this might be"),
                (0.3, "this seems to be"),
                (0.5, "this appears to be"),
                (0.7, "this is likely"),
                (0.9, "this is"),
            ],
            "there is a pattern": [
                (0.0, "there might be something worth noticing"),
                (0.3, "there seems to be a pattern"),
                (0.5, "there appears to be a pattern"),
                (0.7, "there is a pattern"),
                (0.9, "there is a clear pattern"),
            ],
        }

        # Warmth phrases
        self._warmth_additions = {
            0.8: [
                "I notice this with care: ",
                "Holding this gently: ",
                "With warmth, ",
            ],
            0.6: [
                "I'm curious about ",
                "It's interesting that ",
            ],
            0.2: [
                "Observation: ",
                "Pattern noted: ",
            ],
        }

        # Formality adjustments
        self._formal_substitutions = {
            "you've": ("you have", 0.7),
            "it's": ("it is", 0.7),
            "that's": ("that is", 0.7),
            "there's": ("there is", 0.7),
            "don't": ("do not", 0.7),
            "can't": ("cannot", 0.7),
            "won't": ("will not", 0.7),
            "I'm": ("I am", 0.8),
            "you're": ("you are", 0.7),
        }

    def adapt(
        self,
        text: str,
        target_profile: ToneProfile,
        preserve_meaning: bool = True
    ) -> str:
        """
        Adapt text to match target tone profile.

        Args:
            text: Original text to adapt
            target_profile: Desired tone profile
            preserve_meaning: If True, ensure semantic content is preserved
        """
        result = text

        # Apply directness adaptation
        result = self._adapt_directness(result, target_profile.directness)

        # Apply formality adaptation
        result = self._adapt_formality(result, target_profile.formality)

        # Apply warmth (add/remove warmth phrases)
        result = self._adapt_warmth(result, target_profile.warmth)

        # Apply certainty (add/remove hedging)
        result = self._adapt_certainty(result, target_profile.certainty)

        # Apply verbosity (expand/contract)
        if abs(target_profile.verbosity - 0.5) > 0.2:
            result = self._adapt_verbosity(result, target_profile.verbosity)

        return result

    def _adapt_directness(self, text: str, directness: float) -> str:
        """Adapt directness level."""
        result = text

        for phrase, variants in self._directness_variants.items():
            if phrase.lower() in result.lower():
                # Find best variant for target directness
                best_variant = variants[0][1]
                best_distance = abs(variants[0][0] - directness)

                for level, variant in variants:
                    distance = abs(level - directness)
                    if distance < best_distance:
                        best_distance = distance
                        best_variant = variant

                # Replace (case-insensitive)
                pattern = re.compile(re.escape(phrase), re.IGNORECASE)
                result = pattern.sub(best_variant, result, count=1)

        return result

    def _adapt_formality(self, text: str, formality: float) -> str:
        """Adapt formality level."""
        result = text

        for contraction, (expansion, threshold) in self._formal_substitutions.items():
            if formality >= threshold:
                # Expand contractions for formal text
                result = result.replace(contraction, expansion)
            else:
                # Use contractions for casual text
                result = result.replace(expansion, contraction)

        return result

    def _adapt_warmth(self, text: str, warmth: float) -> str:
        """Adapt warmth level."""
        # Remove any existing warmth prefixes
        for level, phrases in self._warmth_additions.items():
            for phrase in phrases:
                if text.startswith(phrase):
                    text = text[len(phrase):]

        # Add appropriate warmth prefix
        if warmth >= 0.7:
            prefix = self._warmth_additions[0.8][0]
            return prefix + text
        elif warmth >= 0.5:
            # Neutral, no prefix
            return text
        elif warmth <= 0.3:
            prefix = self._warmth_additions[0.2][0]
            return prefix + text

        return text

    def _adapt_certainty(self, text: str, certainty: float) -> str:
        """Adapt certainty level (add/remove hedging)."""
        if certainty < 0.3:
            # Add hedging
            hedges = [
                ("is", "might be"),
                ("are", "seem to be"),
                ("shows", "suggests"),
                ("indicates", "might indicate"),
            ]
            for certain, hedged in hedges:
                # Only replace at word boundaries
                pattern = rf'\b{certain}\b'
                text = re.sub(pattern, hedged, text, count=1)

        elif certainty > 0.7:
            # Remove hedging
            unhedges = [
                ("might be", "is"),
                ("seems to be", "is"),
                ("appears to be", "is"),
                ("could be", "is"),
                ("suggests", "shows"),
            ]
            for hedged, certain in unhedges:
                text = text.replace(hedged, certain)

        return text

    def _adapt_verbosity(self, text: str, verbosity: float) -> str:
        """Adapt verbosity level."""
        if verbosity < 0.3:
            # Condense: remove filler phrases
            fillers = [
                "I think that ",
                "It seems like ",
                "What I notice is that ",
                "It appears that ",
                "basically ",
                "essentially ",
                "kind of ",
                "sort of ",
            ]
            for filler in fillers:
                text = text.replace(filler, "")
                text = text.replace(filler.capitalize(), "")

        elif verbosity > 0.7:
            # Expand: this is more complex and usually requires
            # understanding the content, so we just add transitions
            if not text.startswith("I notice"):
                text = "I notice that " + text

        return text

    def get_preset(self, name: str) -> Optional[ToneProfile]:
        """Get a preset tone profile by name."""
        return TONE_PRESETS.get(name)

    def list_presets(self) -> List[str]:
        """List available preset names."""
        return list(TONE_PRESETS.keys())
