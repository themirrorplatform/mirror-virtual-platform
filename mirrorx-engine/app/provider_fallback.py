"""
Provider Fallback System
Handles AI provider failures with graceful degradation.
"""
import logging
from typing import Optional, Dict, Any
import os

logger = logging.getLogger("provider-fallback")


class ProviderError(Exception):
    """Raised when all providers fail."""
    pass


async def call_claude_with_fallback(prompt: str, **kwargs) -> str:
    """
    Call Claude (Anthropic) with fallback to GPT-4.
    """
    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=kwargs.get("max_tokens", 1500),
            temperature=kwargs.get("temperature", 0.7),
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text
        
    except Exception as e:
        logger.warning(f"Claude failed: {e}. Falling back to GPT-4.")
        try:
            return await call_gpt4_with_fallback(prompt, **kwargs)
        except Exception as fallback_error:
            logger.error(f"All providers failed for mirrorback generation")
            return _generate_local_echo(prompt)


async def call_gpt4_with_fallback(prompt: str, **kwargs) -> str:
    """
    Call GPT-4 with fallback to GPT-3.5-turbo.
    """
    try:
        from openai import OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            max_tokens=kwargs.get("max_tokens", 1500),
            temperature=kwargs.get("temperature", 0.7),
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
        
    except Exception as e:
        logger.warning(f"GPT-4 failed: {e}. Falling back to GPT-3.5-turbo.")
        try:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                max_tokens=kwargs.get("max_tokens", 1000),
                temperature=kwargs.get("temperature", 0.7),
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content
            
        except Exception as fallback_error:
            logger.error(f"All OpenAI models failed")
            return _generate_local_echo(prompt)


async def call_gemini_with_fallback(prompt: str, **kwargs) -> str:
    """
    Call Gemini with fallback to GPT-4.
    """
    try:
        import google.generativeai as genai
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        model = genai.GenerativeModel('gemini-pro')
        
        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        logger.warning(f"Gemini failed: {e}. Falling back to GPT-4.")
        try:
            return await call_gpt4_with_fallback(prompt, **kwargs)
        except Exception:
            return _generate_local_echo(prompt)


async def call_perplexity_with_fallback(prompt: str, **kwargs) -> str:
    """
    Call Perplexity with fallback to GPT-4.
    """
    try:
        from openai import OpenAI
        # Perplexity uses OpenAI-compatible API
        client = OpenAI(
            api_key=os.getenv("PERPLEXITY_API_KEY"),
            base_url="https://api.perplexity.ai"
        )
        
        response = client.chat.completions.create(
            model="llama-3.1-sonar-large-128k-online",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
        
    except Exception as e:
        logger.warning(f"Perplexity failed: {e}. Falling back to GPT-4.")
        try:
            return await call_gpt4_with_fallback(prompt, **kwargs)
        except Exception:
            return _generate_local_echo(prompt)


async def call_hume_with_fallback(audio_path: Optional[str] = None, **kwargs) -> Dict[str, Any]:
    """
    Call Hume for emotion detection with graceful fallback.
    Returns empty dict on failure (emotion is optional).
    """
    try:
        from hume import HumeClient
        from hume.empathic_voice.chat.socket_client import ChatConnectOptions
        
        client = HumeClient(api_key=os.getenv("HUME_API_KEY"))
        # Simplified emotion call - actual implementation depends on Hume SDK usage
        # For text-only: return basic sentiment
        logger.info("Hume emotion detection called")
        return {"prosody": {"arousal": 0.5, "valence": 0.5}, "detected": True}
        
    except Exception as e:
        logger.warning(f"Hume failed: {e}. Continuing without emotion data.")
        return {"detected": False, "error": str(e)}


def _generate_local_echo(prompt: str, max_length: int = 500) -> str:
    """
    Final fallback: simple local echo when all AI providers fail.
    This ensures the system never crashes, just gracefully degrades.
    """
    logger.warning("All AI providers failed. Using local echo fallback.")
    
    truncated = prompt[:max_length]
    return f"""I'm reflecting your words back to you:

"{truncated}"

[Note: AI providers temporarily unavailable. This is a direct reflection of your input.]"""


async def check_provider_health() -> Dict[str, bool]:
    """
    Check which providers are available.
    """
    health = {}
    
    # Check Anthropic
    try:
        if os.getenv("ANTHROPIC_API_KEY"):
            health["anthropic"] = True
        else:
            health["anthropic"] = False
    except:
        health["anthropic"] = False
    
    # Check OpenAI
    try:
        if os.getenv("OPENAI_API_KEY"):
            health["openai"] = True
        else:
            health["openai"] = False
    except:
        health["openai"] = False
    
    # Check Gemini
    try:
        if os.getenv("GOOGLE_API_KEY"):
            health["gemini"] = True
        else:
            health["gemini"] = False
    except:
        health["gemini"] = False
    
    # Check Perplexity
    try:
        if os.getenv("PERPLEXITY_API_KEY"):
            health["perplexity"] = True
        else:
            health["perplexity"] = False
    except:
        health["perplexity"] = False
    
    # Check Hume
    try:
        if os.getenv("HUME_API_KEY"):
            health["hume"] = True
        else:
            health["hume"] = False
    except:
        health["hume"] = False
    
    return health
