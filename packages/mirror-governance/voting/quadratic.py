"""
Quadratic Voting Calculator

Implements quadratic voting to prevent plutocracy.
Vote power scales with square root of votes, not linearly.

This means:
- 1 vote = 1 power
- 4 votes = 2 power
- 9 votes = 3 power
- 100 votes = 10 power

Prevents wealthy users from dominating governance.
"""

import math
from typing import Dict, List
from dataclasses import dataclass


@dataclass
class QuadraticConfig:
    """Configuration for quadratic voting."""
    enabled: bool = True
    max_weight: float = 100.0  # Maximum effective weight
    min_weight: float = 1.0    # Minimum weight (everyone gets at least 1)


class QuadraticCalculator:
    """
    Calculates quadratic vote weights.

    Quadratic voting ensures that:
    1. Everyone has meaningful voice
    2. Large stakeholders can't dominate
    3. Strong preferences are still expressed

    Formula: effective_weight = sqrt(raw_weight)
    Capped at max_weight to prevent extreme concentration.
    """

    def __init__(self, config: QuadraticConfig = None):
        self.config = config or QuadraticConfig()

    def calculate_weight(self, raw_weight: float) -> float:
        """
        Calculate quadratic vote weight.

        Args:
            raw_weight: Original weight (e.g., tokens, reputation)

        Returns:
            Quadratic-adjusted weight
        """
        if not self.config.enabled:
            return min(raw_weight, self.config.max_weight)

        if raw_weight <= 0:
            return 0.0

        # Apply square root
        quadratic_weight = math.sqrt(raw_weight)

        # Apply bounds
        quadratic_weight = max(quadratic_weight, self.config.min_weight)
        quadratic_weight = min(quadratic_weight, self.config.max_weight)

        return quadratic_weight

    def calculate_weights(self, raw_weights: Dict[str, float]) -> Dict[str, float]:
        """
        Calculate quadratic weights for multiple voters.

        Args:
            raw_weights: Dict of voter_id -> raw_weight

        Returns:
            Dict of voter_id -> quadratic_weight
        """
        return {
            voter_id: self.calculate_weight(weight)
            for voter_id, weight in raw_weights.items()
        }

    def get_effective_power(
        self,
        raw_weight: float,
        total_raw_weight: float
    ) -> float:
        """
        Calculate effective voting power as percentage.

        Compares quadratic weight to what linear weight would give.

        Args:
            raw_weight: Voter's raw weight
            total_raw_weight: Total of all raw weights

        Returns:
            Percentage reduction in power due to quadratic voting
        """
        if total_raw_weight == 0 or raw_weight == 0:
            return 0.0

        linear_power = raw_weight / total_raw_weight
        quadratic_weight = self.calculate_weight(raw_weight)
        total_quadratic = math.sqrt(total_raw_weight)
        quadratic_power = quadratic_weight / total_quadratic

        return quadratic_power / linear_power if linear_power > 0 else 0.0

    def demonstrate_effect(self, weights: List[float]) -> Dict[str, any]:
        """
        Demonstrate the effect of quadratic voting.

        Useful for transparency - shows how votes are transformed.
        """
        total_raw = sum(weights)
        quadratic_weights = [self.calculate_weight(w) for w in weights]
        total_quadratic = sum(quadratic_weights)

        results = []
        for i, (raw, quad) in enumerate(zip(weights, quadratic_weights)):
            linear_pct = (raw / total_raw * 100) if total_raw > 0 else 0
            quad_pct = (quad / total_quadratic * 100) if total_quadratic > 0 else 0

            results.append({
                "voter": i + 1,
                "raw_weight": raw,
                "quadratic_weight": round(quad, 2),
                "linear_power_pct": round(linear_pct, 2),
                "quadratic_power_pct": round(quad_pct, 2),
                "power_reduction": round(linear_pct - quad_pct, 2),
            })

        return {
            "total_raw_weight": total_raw,
            "total_quadratic_weight": round(total_quadratic, 2),
            "voters": results,
            "gini_reduction": self._calculate_gini_reduction(weights, quadratic_weights),
        }

    def _calculate_gini_reduction(
        self,
        raw_weights: List[float],
        quadratic_weights: List[float]
    ) -> float:
        """Calculate how much quadratic voting reduces inequality (Gini)."""

        def gini(values):
            if not values or sum(values) == 0:
                return 0.0
            sorted_vals = sorted(values)
            n = len(sorted_vals)
            cumsum = sum((i + 1) * v for i, v in enumerate(sorted_vals))
            return (2 * cumsum) / (n * sum(sorted_vals)) - (n + 1) / n

        raw_gini = gini(raw_weights)
        quad_gini = gini(quadratic_weights)

        if raw_gini == 0:
            return 0.0

        return round((raw_gini - quad_gini) / raw_gini * 100, 2)
