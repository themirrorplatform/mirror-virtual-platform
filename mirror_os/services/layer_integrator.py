# mirror_os/services/layer_integrator.py
"""
Layer Integrator: Connect All Layers (Sovereign, Commons, Worldview)

Ensures Mirror OS can process data from every layer and MirrorX Engine
can pull all available data.

Layers:
- Layer 0: Constitution (immutable)
- Layer 1: Sovereign Core (local, private)
- Layer 2: Commons (public, shared)
- Layer 3: Worldview (governance, recognition)

Features:
- Cross-layer data access
- Unified query interface
- Permission management (user controls what flows where)
- Archive integration (store everything)
"""

from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class DataLayer(Enum):
    """System layers"""
    CONSTITUTION = "constitution"  # Layer 0
    SOVEREIGN = "sovereign"  # Layer 1
    COMMONS = "commons"  # Layer 2
    WORLDVIEW = "worldview"  # Layer 3


class DataFlowPermission(Enum):
    """Permission for data to flow between layers"""
    BLOCKED = "blocked"  # Cannot flow
    ANONYMIZED = "anonymized"  # Can flow with identity removed
    FULL = "full"  # Can flow with full metadata


@dataclass
class LayerQuery:
    """Query across multiple layers"""
    query_id: str
    layers: List[DataLayer]
    query_type: str  # 'reflection', 'pattern', 'fork', etc.
    filters: Dict[str, Any]
    limit: int = 100


@dataclass
class LayerResult:
    """Result from specific layer"""
    layer: DataLayer
    data: List[Dict[str, Any]]
    metadata: Dict[str, Any]


class LayerIntegrator:
    """
    Integrate all system layers for unified data access.
    
    Design:
    - User controls all data flows
    - Constitutional compliance at every layer
    - Efficient querying across layers
    - Archive stores everything
    - MirrorX Engine can pull from all layers
    """
    
    def __init__(
        self,
        sovereign_storage_path: Path,
        commons_api=None,
        worldview_registry=None,
        archive=None,
    ):
        """
        Initialize layer integrator.
        
        Args:
            sovereign_storage_path: Path to local storage
            commons_api: Optional Commons instance
            worldview_registry: Optional Worldview registry
            archive: Optional Archive instance
        """
        self.sovereign_path = sovereign_storage_path
        self.commons = commons_api
        self.worldview = worldview_registry
        self.archive = archive
        
        # Data flow permissions (user-configurable)
        self.permissions = {
            (DataLayer.SOVEREIGN, DataLayer.COMMONS): DataFlowPermission.BLOCKED,
            (DataLayer.SOVEREIGN, DataLayer.WORLDVIEW): DataFlowPermission.BLOCKED,
            (DataLayer.COMMONS, DataLayer.SOVEREIGN): DataFlowPermission.ANONYMIZED,
            (DataLayer.COMMONS, DataLayer.WORLDVIEW): DataFlowPermission.FULL,
            (DataLayer.WORLDVIEW, DataLayer.COMMONS): DataFlowPermission.FULL,
            (DataLayer.WORLDVIEW, DataLayer.SOVEREIGN): DataFlowPermission.BLOCKED,
        }
        
        # Stats
        self.stats = {
            'queries_executed': 0,
            'layers_accessed': 0,
            'permission_blocks': 0,
            'results_returned': 0,
        }
    
    def query_all_layers(
        self,
        query_type: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 100,
    ) -> Dict[DataLayer, LayerResult]:
        """
        Query across all available layers.
        
        Args:
            query_type: Type of data to query
            filters: Optional filters
            limit: Max results per layer
        
        Returns:
            Results from each layer
        """
        query = LayerQuery(
            query_id=self._generate_query_id(),
            layers=[DataLayer.SOVEREIGN, DataLayer.COMMONS, DataLayer.WORLDVIEW],
            query_type=query_type,
            filters=filters or {},
            limit=limit,
        )
        
        results = {}
        
        # Query each layer
        for layer in query.layers:
            try:
                result = self._query_layer(layer, query)
                if result and result.data:
                    results[layer] = result
                    self.stats['layers_accessed'] += 1
                    self.stats['results_returned'] += len(result.data)
            except Exception as e:
                logger.error(f"Error querying {layer.value}: {e}")
        
        self.stats['queries_executed'] += 1
        
        logger.info(
            f"Query complete: {len(results)} layers, "
            f"{sum(len(r.data) for r in results.values())} total results"
        )
        
        return results
    
    def get_reflection_context(
        self,
        identity_id: str,
        include_commons: bool = False,
        include_worldview: bool = False,
    ) -> Dict[str, Any]:
        """
        Get complete context for reflection generation.
        
        This is what MirrorX Engine calls to pull all data.
        
        Args:
            identity_id: User's identity
            include_commons: Include Commons insights
            include_worldview: Include Worldview patterns
        
        Returns:
            Complete context from all layers
        """
        context = {
            'identity_id': identity_id,
            'timestamp': datetime.utcnow().isoformat(),
            'layers': {},
        }
        
        # Layer 1: Sovereign (always included)
        context['layers']['sovereign'] = self._get_sovereign_context(identity_id)
        
        # Layer 2: Commons (optional)
        if include_commons and self.commons:
            if self._check_permission(DataLayer.COMMONS, DataLayer.SOVEREIGN):
                context['layers']['commons'] = self._get_commons_context()
        
        # Layer 3: Worldview (optional)
        if include_worldview and self.worldview:
            if self._check_permission(DataLayer.WORLDVIEW, DataLayer.SOVEREIGN):
                context['layers']['worldview'] = self._get_worldview_context()
        
        # Add archive summary
        if self.archive:
            context['archive_summary'] = self._get_archive_summary(identity_id)
        
        return context
    
    def archive_to_all_layers(
        self,
        identity_id: str,
        data_type: str,
        data: Dict[str, Any],
    ) -> Dict[DataLayer, bool]:
        """
        Archive data across appropriate layers.
        
        Args:
            identity_id: User's identity
            data_type: Type of data
            data: Data to archive
        
        Returns:
            Success status per layer
        """
        results = {}
        
        # Always archive to Layer 1 (Sovereign)
        results[DataLayer.SOVEREIGN] = self._archive_to_sovereign(
            identity_id, data_type, data
        )
        
        # Archive to Commons if user has opted in
        if self._check_permission(DataLayer.SOVEREIGN, DataLayer.COMMONS):
            if self.commons:
                results[DataLayer.COMMONS] = self._archive_to_commons(data)
        
        # Archive to Worldview if applicable (governance, forks)
        if data_type in ['fork', 'amendment', 'vote']:
            if self.worldview:
                results[DataLayer.WORLDVIEW] = self._archive_to_worldview(data)
        
        # Universal archive (compressed semantic storage)
        if self.archive:
            self.archive.archive_reflection(identity_id, data)
        
        return results
    
    def set_permission(
        self,
        source: DataLayer,
        target: DataLayer,
        permission: DataFlowPermission,
    ):
        """
        Set data flow permission between layers.
        
        Args:
            source: Source layer
            target: Target layer
            permission: Permission level
        """
        self.permissions[(source, target)] = permission
        logger.info(f"Permission set: {source.value} -> {target.value} = {permission.value}")
    
    def _check_permission(self, source: DataLayer, target: DataLayer) -> bool:
        """Check if data can flow from source to target"""
        permission = self.permissions.get((source, target), DataFlowPermission.BLOCKED)
        
        if permission == DataFlowPermission.BLOCKED:
            self.stats['permission_blocks'] += 1
            return False
        
        return True
    
    def _query_layer(self, layer: DataLayer, query: LayerQuery) -> Optional[LayerResult]:
        """Query specific layer"""
        if layer == DataLayer.SOVEREIGN:
            return self._query_sovereign(query)
        elif layer == DataLayer.COMMONS:
            return self._query_commons(query)
        elif layer == DataLayer.WORLDVIEW:
            return self._query_worldview(query)
        
        return None
    
    def _query_sovereign(self, query: LayerQuery) -> LayerResult:
        """Query Layer 1: Sovereign"""
        # TODO: Query local storage
        return LayerResult(
            layer=DataLayer.SOVEREIGN,
            data=[],
            metadata={'source': 'local_storage'},
        )
    
    def _query_commons(self, query: LayerQuery) -> LayerResult:
        """Query Layer 2: Commons"""
        if not self.commons:
            return LayerResult(layer=DataLayer.COMMONS, data=[], metadata={})
        
        # TODO: Query Commons
        return LayerResult(
            layer=DataLayer.COMMONS,
            data=[],
            metadata={'source': 'commons_network'},
        )
    
    def _query_worldview(self, query: LayerQuery) -> LayerResult:
        """Query Layer 3: Worldview"""
        if not self.worldview:
            return LayerResult(layer=DataLayer.WORLDVIEW, data=[], metadata={})
        
        # TODO: Query Worldview registry
        return LayerResult(
            layer=DataLayer.WORLDVIEW,
            data=[],
            metadata={'source': 'recognition_registry'},
        )
    
    def _get_sovereign_context(self, identity_id: str) -> Dict[str, Any]:
        """Get Layer 1 context for identity"""
        # TODO: Query local storage for identity data
        return {
            'identity_id': identity_id,
            'recent_reflections': [],
            'identity_snapshot': {},
            'patterns': [],
        }
    
    def _get_commons_context(self) -> Dict[str, Any]:
        """Get Layer 2 context (public insights)"""
        # TODO: Query Commons for relevant public patterns
        return {
            'public_themes': [],
            'trending_tensions': [],
            'collective_patterns': [],
        }
    
    def _get_worldview_context(self) -> Dict[str, Any]:
        """Get Layer 3 context (governance, forks)"""
        # TODO: Query Worldview for amendments, fork patterns
        return {
            'active_amendments': [],
            'successful_fork_patterns': [],
            'constitutional_evolution': [],
        }
    
    def _get_archive_summary(self, identity_id: str) -> Dict[str, Any]:
        """Get archive summary for identity"""
        if not self.archive:
            return {}
        
        # TODO: Query archive for summary
        return {
            'total_reflections': 0,
            'archive_periods': 0,
            'dominant_themes': [],
        }
    
    def _archive_to_sovereign(
        self,
        identity_id: str,
        data_type: str,
        data: Dict[str, Any],
    ) -> bool:
        """Archive to Layer 1"""
        # TODO: Write to local storage
        return True
    
    def _archive_to_commons(self, data: Dict[str, Any]) -> bool:
        """Archive to Layer 2"""
        # TODO: Publish to Commons (if user opted in)
        return True
    
    def _archive_to_worldview(self, data: Dict[str, Any]) -> bool:
        """Archive to Layer 3"""
        # TODO: Register in Worldview
        return True
    
    def _generate_query_id(self) -> str:
        """Generate unique query ID"""
        import hashlib
        return hashlib.sha256(
            f"query_{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:16]
