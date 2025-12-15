# mirrorcore/models/local_llm.py
"""
Local LLM implementation using llama-cpp-python.

Provides privacy-first, on-device inference using quantized Llama models.
Recommended models: Llama 3.x 8B or 13B (Q4/Q5 quantized).
"""

import json
import re
from typing import Optional, Dict, Any, List
from pathlib import Path

from mirrorcore.models.base import (
    MirrorLLM, LLMResponse, ConstitutionalFlag, MirrorPrompts
)

try:
    from llama_cpp import Llama
    LLAMA_CPP_AVAILABLE = True
except ImportError:
    LLAMA_CPP_AVAILABLE = False
    Llama = None


class LocalLLM(MirrorLLM):
    """
    Local LLM implementation using llama-cpp-python.
    
    Runs quantized models on CPU/GPU for complete privacy.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize local LLM.
        
        Args:
            config: Configuration dict containing:
                - model_path: Path to GGUF model file
                - n_ctx: Context window size (default: 4096)
                - n_gpu_layers: GPU layers to offload (default: 0)
                - n_threads: CPU threads (default: 4)
                - temperature: 0.0-1.0 (default: 0.7)
                - max_tokens: Max response length (default: 1024)
                - verbose: Logging verbosity (default: False)
        """
        if not LLAMA_CPP_AVAILABLE:
            raise RuntimeError(
                "llama-cpp-python not installed. "
                "Install with: pip install llama-cpp-python"
            )
        
        super().__init__(config)
        
        model_path = config.get('model_path')
        if not model_path:
            raise ValueError("model_path is required for LocalLLM")
        
        if not Path(model_path).exists():
            raise FileNotFoundError(f"Model not found: {model_path}")
        
        # Initialize llama.cpp
        self.llm = Llama(
            model_path=model_path,
            n_ctx=config.get('n_ctx', 4096),
            n_gpu_layers=config.get('n_gpu_layers', 0),
            n_threads=config.get('n_threads', 4),
            verbose=config.get('verbose', False)
        )
        
        self.model_path = model_path
    
    def _generate(
        self,
        prompt: str,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        stop: Optional[List[str]] = None
    ) -> str:
        """Internal generation method."""
        response = self.llm(
            prompt,
            max_tokens=max_tokens or self.max_tokens,
            temperature=temperature or self.temperature,
            stop=stop or [],
            echo=False
        )
        return response['choices'][0]['text'].strip()
    
    def generate_mirrorback(
        self,
        reflection: str,
        context: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> LLMResponse:
        if not reflection or not reflection.strip():
            raise ValueError("Reflection cannot be empty")
        
        # Build prompt
        system = system_prompt or MirrorPrompts.SYSTEM_PROMPT
        context_section = MirrorPrompts.build_context_section(context)
        user_prompt = MirrorPrompts.MIRRORBACK_PROMPT.format(
            reflection=reflection,
            context_section=context_section
        )
        
        # Llama 3 chat format
        prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

{system}<|eot_id|><|start_header_id|>user<|end_header_id|>

{user_prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""
        
        # Generate mirrorback
        content = self._generate(
            prompt,
            stop=['<|eot_id|>', '<|end_of_text|>']
        )
        
        # Check constitutional compliance
        flags = self.validate_constitutional(content, strict_mode=True)
        
        return LLMResponse(
            content=content,
            constitutional_flags=flags,
            metadata={
                'model': self.model_name,
                'model_path': self.model_path,
                'engine_mode': 'local_llm'
            }
        )
    
    def detect_patterns(
        self,
        reflections: List[str],
        existing_patterns: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        if not reflections:
            return []
        
        # Limit to recent reflections for context window
        recent = reflections[-20:]
        reflections_text = "\n\n---\n\n".join(
            f"Reflection {i+1}: {r}" for i, r in enumerate(recent)
        )
        
        prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are a pattern recognition system for Mirror, analyzing reflections for recurring themes.

Identify patterns that appear multiple times. Return ONLY valid JSON, no commentary.<|eot_id|><|start_header_id|>user<|end_header_id|>

{MirrorPrompts.PATTERN_DETECTION_PROMPT.format(reflections=reflections_text)}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""
        
        response = self._generate(prompt, max_tokens=512, temperature=0.3)
        
        # Extract JSON
        try:
            # Find JSON array in response
            match = re.search(r'\[.*\]', response, re.DOTALL)
            if match:
                patterns = json.loads(match.group(0))
                return patterns
        except json.JSONDecodeError:
            pass
        
        return []
    
    def detect_tensions(
        self,
        reflection: str,
        known_tensions: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        if not reflection or not reflection.strip():
            return []
        
        known_section = MirrorPrompts.build_known_tensions_section(known_tensions)
        
        prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are a tension detection system for Mirror. Identify paradoxes and internal contradictions.

Return ONLY valid JSON, no commentary.<|eot_id|><|start_header_id|>user<|end_header_id|>

{MirrorPrompts.TENSION_DETECTION_PROMPT.format(
    reflection=reflection,
    known_tensions_section=known_section
)}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""
        
        response = self._generate(prompt, max_tokens=384, temperature=0.3)
        
        # Extract JSON
        try:
            match = re.search(r'\[.*\]', response, re.DOTALL)
            if match:
                tensions = json.loads(match.group(0))
                return tensions
        except json.JSONDecodeError:
            pass
        
        return []
    
    def validate_constitutional(
        self,
        text: str,
        strict_mode: bool = True
    ) -> List[ConstitutionalFlag]:
        """Simple heuristic-based constitutional checking."""
        flags = []
        text_lower = text.lower()
        
        # Directive language
        directive_patterns = [
            r'\byou should\b', r'\byou need to\b', r'\btry to\b',
            r'\bmake sure\b', r'\bconsider\b', r'\bwould recommend\b'
        ]
        for pattern in directive_patterns:
            if re.search(pattern, text_lower):
                flags.append(ConstitutionalFlag.DIRECTIVE)
                break
        
        # Prescriptive language
        prescriptive_patterns = [
            r'\bsolution\b', r'\bfix\b', r'\bresolve\b', r'\banswer is\b'
        ]
        for pattern in prescriptive_patterns:
            if re.search(pattern, text_lower):
                flags.append(ConstitutionalFlag.PRESCRIPTIVE)
                break
        
        # Absolutist statements
        absolutist_patterns = [
            r'\balways\b', r'\bnever\b', r'\bcertainly\b',
            r'\bdefinitely\b', r'\bobviously\b', r'\bclearly\b'
        ]
        if strict_mode:
            for pattern in absolutist_patterns:
                if re.search(pattern, text_lower):
                    flags.append(ConstitutionalFlag.ABSOLUTIST)
                    break
        
        # Judgmental language
        judgmental_patterns = [
            r'\bgood\b', r'\bbad\b', r'\bright\b', r'\bwrong\b',
            r'\bhealthy\b', r'\bunhealthy\b'
        ]
        if strict_mode:
            for pattern in judgmental_patterns:
                if re.search(pattern, text_lower):
                    flags.append(ConstitutionalFlag.JUDGMENTAL)
                    break
        
        # Medical/therapeutic advice
        medical_patterns = [
            r'\btherapy\b', r'\btreatment\b', r'\bdiagnosis\b',
            r'\bmedication\b', r'\bcounseling\b'
        ]
        for pattern in medical_patterns:
            if re.search(pattern, text_lower):
                flags.append(ConstitutionalFlag.MEDICAL_ADVICE)
                break
        
        return flags
    
    def summarize_thread(
        self,
        reflections: List[str],
        max_length: int = 200
    ) -> str:
        if not reflections:
            return ""
        
        reflections_text = "\n\n".join(reflections[-10:])
        
        prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

Summarize these reflections briefly (2-3 sentences max). Focus on themes and tensions.<|eot_id|><|start_header_id|>user<|end_header_id|>

{reflections_text}

Summary:<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""
        
        summary = self._generate(prompt, max_tokens=150, temperature=0.5)
        return summary[:max_length]
    
    def suggest_tensions(
        self,
        reflections: List[str],
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        if not reflections:
            return []
        
        recent = reflections[-15:]
        reflections_text = "\n\n".join(recent)
        
        prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

Based on these reflections, suggest tensions (paradoxes) the person might explore.

Return JSON array (max {limit}):
[{{"name": "...", "axis_a": "...", "axis_b": "...", "rationale": "..."}}]<|eot_id|><|start_header_id|>user<|end_header_id|>

{reflections_text}

Suggested tensions:<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""
        
        response = self._generate(prompt, max_tokens=384, temperature=0.4)
        
        try:
            match = re.search(r'\[.*\]', response, re.DOTALL)
            if match:
                suggestions = json.loads(match.group(0))
                return suggestions[:limit]
        except json.JSONDecodeError:
            pass
        
        return []
    
    def get_embeddings(
        self,
        texts: List[str]
    ) -> List[List[float]]:
        """Generate embeddings using llama.cpp."""
        embeddings = []
        for text in texts:
            embedding = self.llm.embed(text)
            embeddings.append(embedding)
        return embeddings
    
    def get_model_info(self) -> Dict[str, Any]:
        info = super().get_model_info()
        info.update({
            'type': 'local',
            'provider': 'llama.cpp',
            'model_path': self.model_path,
            'context_length': self.llm.n_ctx(),
            'capabilities': [
                'mirrorback_generation',
                'pattern_detection',
                'tension_detection',
                'constitutional_validation',
                'embeddings'
            ]
        })
        return info
    
    def is_available(self) -> bool:
        return self.llm is not None
    
    def shutdown(self):
        """Clean up llama.cpp resources."""
        if self.llm:
            # llama.cpp handles cleanup automatically
            self.llm = None
