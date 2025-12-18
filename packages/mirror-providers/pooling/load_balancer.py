"""
Load Balancing Strategies

Distributes requests across providers based on various strategies.
"""

from abc import ABC, abstractmethod
from enum import Enum
from typing import List, Optional
import random
import time
from dataclasses import dataclass, field

from ..base import MirrorProvider, ProviderStatus


class BalancingStrategy(Enum):
    """Load balancing strategies."""
    ROUND_ROBIN = "round_robin"      # Rotate through providers
    RANDOM = "random"                 # Random selection
    LEAST_LOADED = "least_loaded"     # Prefer providers with fewer requests
    WEIGHTED = "weighted"             # Weight by configured priority
    LATENCY = "latency"               # Prefer lowest latency providers


@dataclass
class ProviderStats:
    """Runtime statistics for a provider."""
    provider: MirrorProvider
    weight: float = 1.0
    active_requests: int = 0
    total_requests: int = 0
    total_errors: int = 0
    avg_latency_ms: float = 0.0
    last_error_time: Optional[float] = None
    last_success_time: Optional[float] = None

    # Exponential moving average factor
    _ema_factor: float = field(default=0.1, repr=False)

    def record_request(self):
        """Record start of a request."""
        self.active_requests += 1
        self.total_requests += 1

    def record_success(self, latency_ms: float):
        """Record successful completion."""
        self.active_requests = max(0, self.active_requests - 1)
        self.last_success_time = time.time()

        # Update latency EMA
        if self.avg_latency_ms == 0:
            self.avg_latency_ms = latency_ms
        else:
            self.avg_latency_ms = (
                self._ema_factor * latency_ms +
                (1 - self._ema_factor) * self.avg_latency_ms
            )

    def record_error(self):
        """Record an error."""
        self.active_requests = max(0, self.active_requests - 1)
        self.total_errors += 1
        self.last_error_time = time.time()

    @property
    def error_rate(self) -> float:
        """Current error rate."""
        if self.total_requests == 0:
            return 0.0
        return self.total_errors / self.total_requests

    @property
    def is_healthy(self) -> bool:
        """Check if provider should be considered healthy."""
        # Mark unhealthy if error rate is too high
        if self.error_rate > 0.5 and self.total_requests > 5:
            return False

        # Mark unhealthy if recent consecutive errors
        if self.last_error_time and self.last_success_time:
            if self.last_error_time > self.last_success_time:
                # Recent error, apply cooldown
                cooldown = 30.0  # 30 seconds
                if time.time() - self.last_error_time < cooldown:
                    return False

        return self.provider.status == ProviderStatus.AVAILABLE


class LoadBalancer(ABC):
    """Abstract base for load balancers."""

    def __init__(self, providers: List[MirrorProvider]):
        self.stats = [ProviderStats(provider=p) for p in providers]

    @abstractmethod
    def select(self) -> Optional[ProviderStats]:
        """Select a provider based on the balancing strategy."""
        pass

    def get_healthy_providers(self) -> List[ProviderStats]:
        """Get list of healthy providers."""
        return [s for s in self.stats if s.is_healthy]

    def record_request(self, stats: ProviderStats):
        """Record that a request started."""
        stats.record_request()

    def record_success(self, stats: ProviderStats, latency_ms: float):
        """Record successful request."""
        stats.record_success(latency_ms)

    def record_error(self, stats: ProviderStats):
        """Record failed request."""
        stats.record_error()


class RoundRobinBalancer(LoadBalancer):
    """Round-robin load balancer."""

    def __init__(self, providers: List[MirrorProvider]):
        super().__init__(providers)
        self._index = 0

    def select(self) -> Optional[ProviderStats]:
        healthy = self.get_healthy_providers()
        if not healthy:
            return None

        # Rotate through healthy providers
        self._index = (self._index + 1) % len(healthy)
        return healthy[self._index]


class RandomBalancer(LoadBalancer):
    """Random selection load balancer."""

    def select(self) -> Optional[ProviderStats]:
        healthy = self.get_healthy_providers()
        if not healthy:
            return None
        return random.choice(healthy)


class LeastLoadedBalancer(LoadBalancer):
    """Prefer providers with fewer active requests."""

    def select(self) -> Optional[ProviderStats]:
        healthy = self.get_healthy_providers()
        if not healthy:
            return None

        # Sort by active requests (ascending)
        sorted_providers = sorted(healthy, key=lambda s: s.active_requests)
        return sorted_providers[0]


class WeightedBalancer(LoadBalancer):
    """Weighted random selection."""

    def __init__(self, providers: List[MirrorProvider], weights: List[float] = None):
        super().__init__(providers)
        if weights:
            for stats, weight in zip(self.stats, weights):
                stats.weight = weight

    def select(self) -> Optional[ProviderStats]:
        healthy = self.get_healthy_providers()
        if not healthy:
            return None

        total_weight = sum(s.weight for s in healthy)
        if total_weight == 0:
            return random.choice(healthy)

        r = random.uniform(0, total_weight)
        cumulative = 0
        for stats in healthy:
            cumulative += stats.weight
            if r <= cumulative:
                return stats

        return healthy[-1]


class LatencyBalancer(LoadBalancer):
    """Prefer providers with lowest latency."""

    def select(self) -> Optional[ProviderStats]:
        healthy = self.get_healthy_providers()
        if not healthy:
            return None

        # Sort by average latency (ascending)
        # New providers (0 latency) get a chance
        sorted_providers = sorted(
            healthy,
            key=lambda s: s.avg_latency_ms if s.avg_latency_ms > 0 else float('inf')
        )

        # Weighted random among top 3 to avoid always hitting one
        top_n = sorted_providers[:min(3, len(sorted_providers))]
        if len(top_n) == 1:
            return top_n[0]

        # Inverse latency weighting
        weights = []
        for s in top_n:
            if s.avg_latency_ms > 0:
                weights.append(1000 / s.avg_latency_ms)  # Inverse latency
            else:
                weights.append(1.0)  # Default for new providers

        total = sum(weights)
        r = random.uniform(0, total)
        cumulative = 0
        for stats, weight in zip(top_n, weights):
            cumulative += weight
            if r <= cumulative:
                return stats

        return top_n[0]


def create_balancer(
    strategy: BalancingStrategy,
    providers: List[MirrorProvider],
    weights: List[float] = None
) -> LoadBalancer:
    """Factory function to create a load balancer."""
    if strategy == BalancingStrategy.ROUND_ROBIN:
        return RoundRobinBalancer(providers)
    elif strategy == BalancingStrategy.RANDOM:
        return RandomBalancer(providers)
    elif strategy == BalancingStrategy.LEAST_LOADED:
        return LeastLoadedBalancer(providers)
    elif strategy == BalancingStrategy.WEIGHTED:
        return WeightedBalancer(providers, weights)
    elif strategy == BalancingStrategy.LATENCY:
        return LatencyBalancer(providers)
    else:
        return RoundRobinBalancer(providers)
