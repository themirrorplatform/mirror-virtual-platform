"""
Commons API Client: Query central registry for Candidate Cards

Commons v1 Architecture:
- Central metadata registry (not P2P discovery)
- Pull-based sync (instances query, don't broadcast)
- Public artifacts only (no Identity Graphs)
- Anonymous aggregates (k-anonymity enforced)
- Signed submissions (cryptographic verification)
"""

from typing import List, Optional, Dict
from datetime import datetime
import requests
import json
from pathlib import Path

from .candidate_cards import CandidateCard, AsymmetryReport, AsymmetryLevel, EvidenceTier


class CommonsAPIClient:
    """
    Client for Commons v1 REST API.
    
    Privacy guarantees:
    - Never sends Identity Graph
    - Never reveals user_id in queries
    - All queries are abstract (lens tags only)
    - K-anonymity for all reports
    """
    
    def __init__(self, commons_url: str, instance_id: str, 
                 private_key_path: Path):
        self.commons_url = commons_url
        self.instance_id = instance_id
        self.private_key_path = private_key_path
        self.session = requests.Session()
        
        # TODO: Load signing key
        self.signing_key = None
    
    def query_cards(self, lens_tags: List[str], 
                   interaction_style: Optional[str] = None,
                   max_results: int = 50) -> List[CandidateCard]:
        """
        Query Commons for Candidate Cards.
        
        Privacy: Query parameters are abstract (no personal info).
        """
        params = {
            'lens_tags': ','.join(lens_tags),
            'max_results': max_results,
        }
        
        if interaction_style:
            params['interaction_style'] = interaction_style
        
        try:
            response = self.session.get(
                f"{self.commons_url}/v1/cards",
                params=params,
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            return [CandidateCard.from_dict(card) for card in data['cards']]
        
        except requests.RequestException as e:
            print(f"Commons query failed: {e}")
            return []
    
    def get_attestations(self, node_id: str) -> List[Dict]:
        """
        Retrieve attestations for a candidate.
        
        Attestations = third-party verification of candidate metadata.
        """
        try:
            response = self.session.get(
                f"{self.commons_url}/v1/attestations/{node_id}",
                timeout=10
            )
            response.raise_for_status()
            
            return response.json()['attestations']
        
        except requests.RequestException as e:
            print(f"Attestation fetch failed: {e}")
            return []
    
    def get_asymmetry_aggregates(self, node_id: str) -> Optional[AsymmetryReport]:
        """
        Get anonymous asymmetry reports for candidate.
        
        K-anonymity enforced: Only returns if ≥k reports exist.
        """
        try:
            response = self.session.get(
                f"{self.commons_url}/v1/asymmetry_aggregates/{node_id}",
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            
            if data['report_count'] < data['k_threshold']:
                return None  # Not enough reports for k-anonymity
            
            # Reconstruct aggregate report
            return AsymmetryReport(
                exit_friction=AsymmetryLevel(data['exit_friction_mode']),
                data_demand_ratio=data['data_demand_ratio_mean'],
                opacity=data['opacity_fraction'] > 0.5,
                identity_coercion=data['identity_coercion_fraction'] > 0.5,
                unilateral_control=data['unilateral_control_fraction'] > 0.5,
                lock_in_terms=data['lock_in_terms_fraction'] > 0.5,
                evidence_tier=EvidenceTier.ATTESTED,  # Aggregate = attested
            )
        
        except requests.RequestException as e:
            print(f"Asymmetry aggregate fetch failed: {e}")
            return None
    
    def submit_card(self, card: CandidateCard) -> bool:
        """
        Submit self-attested Candidate Card to Commons.
        
        Signed submission (prevents spam/impersonation).
        """
        payload = {
            'card': card.to_dict(),
            'instance_id': self.instance_id,
            'signature': self._sign_card(card),
            'submitted_at': datetime.utcnow().isoformat(),
        }
        
        try:
            response = self.session.post(
                f"{self.commons_url}/v1/cards",
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            
            return True
        
        except requests.RequestException as e:
            print(f"Card submission failed: {e}")
            return False
    
    def submit_anonymous_report(self, reports: List[Dict]) -> bool:
        """
        Submit anonymous asymmetry reports in batch.
        
        K-anonymity enforced: Batched with other instances' reports.
        """
        payload = {
            'reports': reports,
            'instance_id': self.instance_id,  # For rate limiting only
            'submitted_at': datetime.utcnow().isoformat(),
        }
        
        try:
            response = self.session.post(
                f"{self.commons_url}/v1/reports",
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            
            return True
        
        except requests.RequestException as e:
            print(f"Report submission failed: {e}")
            return False
    
    def _sign_card(self, card: CandidateCard) -> str:
        """Sign card with instance private key"""
        # TODO: Implement Ed25519 signing
        return "signature_placeholder"
    
    def health_check(self) -> bool:
        """Check if Commons is reachable"""
        try:
            response = self.session.get(
                f"{self.commons_url}/v1/health",
                timeout=5
            )
            return response.status_code == 200
        
        except requests.RequestException:
            return False
