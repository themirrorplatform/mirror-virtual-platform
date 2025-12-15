"""
Tests for Language Shapes Detection

Tests I9 compliance: Anti-diagnosis, user control over all metadata
"""

import pytest
from mirror_os.core.language_shapes import (
    LanguageShapeDetector, LanguageShape, ShapeOccurrence
)


class TestLanguageShapeBasics:
    """Test basic shape detection"""
    
    def test_detector_initialization(self):
        """Should initialize with default shapes"""
        detector = LanguageShapeDetector()
        
        assert len(detector.shapes) > 0
        assert 'uncertainty' in detector.shapes
        assert 'control' in detector.shapes
        assert 'stuck' in detector.shapes
    
    def test_default_shapes_have_disclaimers(self):
        """All shapes must have I9 disclaimer"""
        detector = LanguageShapeDetector()
        
        for shape_id, shape in detector.shapes.items():
            assert shape.disclaimer is not None
            assert len(shape.disclaimer) > 0
            assert 'not a diagnosis' in shape.disclaimer.lower()
    
    def test_custom_shape_addition(self):
        """User can add custom shapes (I9)"""
        detector = LanguageShapeDetector()
        
        custom = LanguageShape(
            id='my_pattern',
            name='My Pattern',
            description='A pattern I notice',
            example_phrases=['I often say'],
            pattern_markers=[r'\bi often say\b']
        )
        
        result = detector.add_custom_shape(custom)
        
        assert result is True
        assert 'my_pattern' in detector.shapes


class TestShapeDetection:
    """Test pattern detection in content"""
    
    def test_detect_uncertainty(self):
        """Should detect uncertainty language"""
        detector = LanguageShapeDetector()
        
        content = "I don't know what to do. I'm not sure if this is right. Maybe I should try something else."
        
        occurrences = detector.detect(content, min_confidence=0.1)
        
        # Should find uncertainty
        uncertainty_found = any(o.shape_id == 'uncertainty' for o in occurrences)
        assert uncertainty_found
        
        # Check matched phrases
        uncertainty = next(o for o in occurrences if o.shape_id == 'uncertainty')
        assert len(uncertainty.matched_phrases) > 0
        assert uncertainty.confidence > 0
    
    def test_detect_control_language(self):
        """Should detect control/management language"""
        detector = LanguageShapeDetector()
        
        content = "I need to control this situation. I have to manage everything and organize my life."
        
        occurrences = detector.detect(content, min_confidence=0.1)
        
        control_found = any(o.shape_id == 'control' for o in occurrences)
        assert control_found
    
    def test_detect_stuck_language(self):
        """Should detect stuck/trapped language"""
        detector = LanguageShapeDetector()
        
        content = "I feel stuck and trapped. I can't move forward."
        
        occurrences = detector.detect(content, min_confidence=0.1)
        
        stuck_found = any(o.shape_id == 'stuck' for o in occurrences)
        assert stuck_found
    
    def test_detect_should_ing(self):
        """Should detect should-ing language"""
        detector = LanguageShapeDetector()
        
        content = "I should do this. I ought to be better. I have to change."
        
        occurrences = detector.detect(content, min_confidence=0.1)
        
        should_found = any(o.shape_id == 'should' for o in occurrences)
        assert should_found
    
    def test_detect_questioning(self):
        """Should detect questioning language"""
        detector = LanguageShapeDetector()
        
        content = "What if this happens? How come it's like this? Why does it feel this way?"
        
        occurrences = detector.detect(content, min_confidence=0.1)
        
        questioning_found = any(o.shape_id == 'questioning' for o in occurrences)
        assert questioning_found
    
    def test_detect_tension(self):
        """Should detect tension/conflict language"""
        detector = LanguageShapeDetector()
        
        content = "Part of me wants to go, but part of me wants to stay. I'm torn between two choices."
        
        occurrences = detector.detect(content, min_confidence=0.1)
        
        tension_found = any(o.shape_id == 'tension' for o in occurrences)
        assert tension_found
    
    def test_min_confidence_threshold(self):
        """Should respect minimum confidence threshold"""
        detector = LanguageShapeDetector()
        
        # Low occurrence content
        content = "I wonder about this."
        
        # High threshold should filter out
        high_threshold = detector.detect(content, min_confidence=0.9)
        low_threshold = detector.detect(content, min_confidence=0.1)
        
        assert len(high_threshold) <= len(low_threshold)
    
    def test_context_snippet_included(self):
        """Should include context around matches"""
        detector = LanguageShapeDetector()
        
        content = "I'm feeling really uncertain about this decision. I don't know what to choose."
        
        occurrences = detector.detect(content, context_window=30)
        
        uncertainty = next((o for o in occurrences if o.shape_id == 'uncertainty'), None)
        assert uncertainty is not None
        assert uncertainty.context_snippet is not None
        assert len(uncertainty.context_snippet) > 0
    
    def test_no_false_positives(self):
        """Should not detect shapes in unrelated content"""
        detector = LanguageShapeDetector()
        
        # Content with no shape markers
        content = "The weather is nice today. Birds are singing."
        
        occurrences = detector.detect(content, min_confidence=0.1)
        
        # Should find few or no matches
        assert len(occurrences) == 0


class TestUserControl:
    """Test I9: User control over shapes"""
    
    def test_rename_shape(self):
        """User can rename shapes (I9)"""
        detector = LanguageShapeDetector()
        
        result = detector.rename_shape('uncertainty', 'My Wondering')
        
        assert result is True
        assert detector.shapes['uncertainty'].name == 'My Wondering'
        assert detector.shapes['uncertainty'].user_renamed is True
    
    def test_hide_shape(self):
        """User can hide shapes (I9)"""
        detector = LanguageShapeDetector()
        
        result = detector.hide_shape('uncertainty')
        
        assert result is True
        assert detector.shapes['uncertainty'].user_hidden is True
        
        # Hidden shape should not appear in detection
        content = "I don't know what to do."
        occurrences = detector.detect(content, min_confidence=0.1)
        
        uncertainty_found = any(o.shape_id == 'uncertainty' for o in occurrences)
        assert uncertainty_found is False
    
    def test_merge_shapes(self):
        """User can merge shapes (I9)"""
        detector = LanguageShapeDetector()
        
        result = detector.merge_shapes('stuck', 'control')
        
        assert result is True
        assert detector.shapes['stuck'].merged_into == 'control'
        
        # Merged shape should not appear in detection
        content = "I feel stuck and need to control things."
        occurrences = detector.detect(content, min_confidence=0.1)
        
        stuck_found = any(o.shape_id == 'stuck' for o in occurrences)
        assert stuck_found is False
        
        # But control should still be found
        control_found = any(o.shape_id == 'control' for o in occurrences)
        assert control_found is True
    
    def test_get_visible_shapes(self):
        """Should only return visible shapes"""
        detector = LanguageShapeDetector()
        
        # Hide one shape
        detector.hide_shape('uncertainty')
        
        # Merge another
        detector.merge_shapes('stuck', 'control')
        
        visible = detector.get_visible_shapes()
        
        # Hidden and merged should not be visible
        assert not any(s.id == 'uncertainty' for s in visible)
        assert not any(s.id == 'stuck' for s in visible)
        
        # Others should be visible
        assert any(s.id == 'control' for s in visible)
        assert any(s.id == 'questioning' for s in visible)
    
    def test_cannot_rename_nonexistent_shape(self):
        """Should fail to rename shape that doesn't exist"""
        detector = LanguageShapeDetector()
        
        result = detector.rename_shape('nonexistent', 'New Name')
        
        assert result is False
    
    def test_cannot_hide_nonexistent_shape(self):
        """Should fail to hide shape that doesn't exist"""
        detector = LanguageShapeDetector()
        
        result = detector.hide_shape('nonexistent')
        
        assert result is False


class TestCustomShapeCreation:
    """Test building shapes from user's history"""
    
    def test_build_shape_from_history(self):
        """Should build custom shape from recurring patterns"""
        detector = LanguageShapeDetector()
        
        reflections = [
            "I keep saying the same thing over and over",
            "The same thing keeps happening",
            "I notice the same thing again",
            "The same thing is coming up"
        ]
        
        shape = detector.build_shape_from_history(
            reflections,
            pattern_phrases=["the same thing"],
            shape_name="Repetition",
            shape_description="When I notice patterns repeating",
            min_occurrences=3
        )
        
        assert shape is not None
        assert shape.name == "Repetition"
        assert "the same thing" in [p.lower() for p in shape.example_phrases]
    
    def test_build_shape_insufficient_occurrences(self):
        """Should not build shape if pattern not recurring enough"""
        detector = LanguageShapeDetector()
        
        reflections = [
            "I said this once",
            "Something else entirely"
        ]
        
        shape = detector.build_shape_from_history(
            reflections,
            pattern_phrases=["said this once"],
            shape_name="Rare Pattern",
            shape_description="Doesn't occur much",
            min_occurrences=3
        )
        
        assert shape is None
    
    def test_custom_shape_has_disclaimer(self):
        """Custom shapes must have I9 disclaimer"""
        detector = LanguageShapeDetector()
        
        reflections = ["pattern here"] * 5
        
        shape = detector.build_shape_from_history(
            reflections,
            pattern_phrases=["pattern here"],
            shape_name="Test Pattern",
            shape_description="Test",
            min_occurrences=3
        )
        
        assert shape is not None
        assert 'not a diagnosis' in shape.disclaimer.lower()


class TestShapeFrequency:
    """Test frequency analysis"""
    
    def test_get_shape_frequency(self):
        """Should count shape occurrences per reflection"""
        detector = LanguageShapeDetector()
        
        reflections = [
            ("r1", "maybe this could work"),
            ("r2", "I feel certain about everything."),
            ("r3", "uncertain and confused, maybe try something")
        ]
        
        frequency = detector.get_shape_frequency(reflections, 'uncertainty')
        
        # r1 and r3 should have uncertainty (both have 'maybe', r3 has 'uncertain')
        assert 'r1' in frequency
        assert 'r3' in frequency
        
        # r2 should not (it's about certainty)
        assert 'r2' not in frequency
    
    def test_shape_statistics(self):
        """Should calculate statistics about shape usage (I14: per-mirror only)"""
        detector = LanguageShapeDetector()
        
        reflections = [
            ("r1", "maybe uncertain confused"),
            ("r2", "I wonder about this"),
            ("r3", "Maybe I guess so")
        ]
        
        stats = detector.get_shape_statistics(reflections)
        
        assert 'uncertainty' in stats
        assert stats['uncertainty']['total_occurrences'] > 0
        assert stats['uncertainty']['reflections_with_shape'] > 0
        assert 'average_per_reflection' in stats['uncertainty']
    
    def test_statistics_exclude_hidden_shapes(self):
        """Statistics should not include hidden shapes"""
        detector = LanguageShapeDetector()
        
        reflections = [("r1", "I don't know")]
        
        # Hide uncertainty
        detector.hide_shape('uncertainty')
        
        stats = detector.get_shape_statistics(reflections)
        
        # Hidden shape should not be in stats
        assert 'uncertainty' not in stats or stats['uncertainty']['total_occurrences'] == 0


class TestConstitutionalCompliance:
    """Test I9 anti-diagnosis compliance"""
    
    def test_shapes_are_descriptive_not_diagnostic(self):
        """Shape names should be descriptive, not clinical"""
        detector = LanguageShapeDetector()
        
        for shape_id, shape in detector.shapes.items():
            # Should not use clinical/diagnostic terms
            name_lower = shape.name.lower()
            description_lower = shape.description.lower()
            
            # Check for clinical terms we want to avoid
            clinical_terms = [
                'disorder', 'syndrome', 'illness', 'pathology',
                'diagnosis', 'symptom', 'disease'
            ]
            
            for term in clinical_terms:
                assert term not in name_lower, f"Shape '{shape.name}' uses clinical term '{term}'"
                assert term not in description_lower, f"Shape description uses clinical term '{term}'"
    
    def test_all_shapes_have_required_disclaimer(self):
        """I9: All shapes must have anti-diagnosis disclaimer"""
        detector = LanguageShapeDetector()
        
        for shape_id, shape in detector.shapes.items():
            assert shape.disclaimer is not None
            assert len(shape.disclaimer) > 10  # Substantial disclaimer
            disclaimer_lower = shape.disclaimer.lower()
            
            # Must mention it's not a diagnosis
            assert 'not a diagnosis' in disclaimer_lower or 'not diagnostic' in disclaimer_lower
    
    def test_user_has_full_control(self):
        """I9: User can modify or remove any shape"""
        detector = LanguageShapeDetector()
        
        shape_id = 'uncertainty'
        
        # User can rename
        assert detector.rename_shape(shape_id, 'My Custom Name')
        
        # User can hide
        assert detector.hide_shape(shape_id)
        
        # Hidden shape doesn't appear
        visible = detector.get_visible_shapes()
        assert not any(s.id == shape_id for s in visible)
    
    def test_no_cross_identity_inference(self):
        """I14: Shapes only analyze within single mirror"""
        detector = LanguageShapeDetector()
        
        # This method explicitly takes reflections as input
        # No global aggregation possible - each call is independent
        mirror1_reflections = [("r1", "I don't know what to do")]
        mirror2_reflections = [("r2", "I feel stuck")]
        
        # Each analysis is independent
        stats1 = detector.get_shape_statistics(mirror1_reflections)
        stats2 = detector.get_shape_statistics(mirror2_reflections)
        
        # Different content should yield different stats
        # The key point: method doesn't maintain cross-identity state
        assert isinstance(stats1, dict)
        assert isinstance(stats2, dict)


class TestIntegrationScenarios:
    """Test realistic usage scenarios"""
    
    def test_full_detection_workflow(self):
        """Test complete detection flow"""
        detector = LanguageShapeDetector()
        
        # User writes reflection
        content = """
        Maybe uncertain confused. I feel stuck and cannot move forward.
        Part of me wants to control everything, but I should just let go.
        What if this happens? I wonder about this.
        """
        
        # Detect shapes
        occurrences = detector.detect(content, min_confidence=0.1)
        
        # Should detect multiple shapes
        assert len(occurrences) > 0
        
        # Check for expected shapes
        shape_ids = {o.shape_id for o in occurrences}
        assert 'uncertainty' in shape_ids
        assert 'stuck' in shape_ids or 'control' in shape_ids or 'should' in shape_ids
    
    def test_user_customization_workflow(self):
        """Test user customizing shapes"""
        detector = LanguageShapeDetector()
        
        # User renames a shape
        detector.rename_shape('uncertainty', 'My Wondering')
        
        # User hides a shape they don't like
        detector.hide_shape('stuck')
        
        # User creates custom shape
        custom = LanguageShape(
            id='excitement',
            name='Excitement',
            description='When I express enthusiasm',
            example_phrases=['I love this', 'This is amazing'],
            pattern_markers=[r'\bi love\b', r'\bamazing\b']
        )
        detector.add_custom_shape(custom)
        
        # All modifications should persist
        assert detector.shapes['uncertainty'].name == 'My Wondering'
        assert detector.shapes['stuck'].user_hidden is True
        assert 'excitement' in detector.shapes


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
