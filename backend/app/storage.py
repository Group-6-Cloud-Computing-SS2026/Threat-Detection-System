"""Persistent storage for threat data on distributed filesystem (Task 7)."""

import json
import os
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict
from app.config import settings

logger = logging.getLogger(__name__)


class ThreatStorage:
    """Manages threat data persistence on k3s distributed storage."""
    
    def __init__(self):
        """Initialize storage manager."""
        self.storage_path = Path(settings.storage_path)
        self.enabled = settings.storage_enabled
        
        if self.enabled:
            self._initialize_storage()
    
    def _initialize_storage(self):
        """Initialize storage directory if it doesn't exist."""
        try:
            self.storage_path.mkdir(parents=True, exist_ok=True)
            logger.info(f"Storage initialized at {self.storage_path}")
        except Exception as e:
            logger.error(f"Failed to initialize storage: {e}")
            self.enabled = False
    
    def save_threat(self, threat_data: Dict) -> bool:
        """
        Save threat record to storage.
        
        Args:
            threat_data: Threat data dictionary
            
        Returns:
            bool: True if saved successfully
        """
        if not self.enabled:
            logger.warning("Storage is disabled")
            return False
        
        try:
            threat_id = threat_data.get("threat_id")
            threat_file = self.storage_path / f"{threat_id}.json"
            
            with open(threat_file, 'w') as f:
                json.dump(threat_data, f, indent=2, default=str)
            
            logger.info(f"Threat {threat_id} saved to storage")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save threat: {e}")
            return False
    
    def get_threat(self, threat_id: str) -> Optional[Dict]:
        """
        Retrieve threat record from storage.
        
        Args:
            threat_id: Threat ID to retrieve
            
        Returns:
            dict: Threat data or None if not found
        """
        if not self.enabled:
            return None
        
        try:
            threat_file = self.storage_path / f"{threat_id}.json"
            
            if not threat_file.exists():
                logger.warning(f"Threat {threat_id} not found")
                return None
            
            with open(threat_file, 'r') as f:
                return json.load(f)
                
        except Exception as e:
            logger.error(f"Failed to retrieve threat: {e}")
            return None
    
    def get_all_threats(self) -> List[Dict]:
        """
        Retrieve all threats from storage.
        
        Returns:
            list: List of all threat records
        """
        if not self.enabled:
            return []
        
        threats = []
        try:
            for threat_file in self.storage_path.glob("*.json"):
                with open(threat_file, 'r') as f:
                    threats.append(json.load(f))
            
            # Sort by timestamp descending
            threats.sort(
                key=lambda x: x.get("timestamp", ""),
                reverse=True
            )
            
        except Exception as e:
            logger.error(f"Failed to retrieve threats: {e}")
        
        return threats
    
    def update_threat(self, threat_id: str, updates: Dict) -> bool:
        """
        Update threat record.
        
        Args:
            threat_id: Threat ID to update
            updates: Dictionary of updates
            
        Returns:
            bool: True if updated successfully
        """
        if not self.enabled:
            return False
        
        try:
            threat_data = self.get_threat(threat_id)
            
            if not threat_data:
                logger.warning(f"Threat {threat_id} not found for update")
                return False
            
            threat_data.update(updates)
            return self.save_threat(threat_data)
            
        except Exception as e:
            logger.error(f"Failed to update threat: {e}")
            return False
    
    def get_storage_stats(self) -> Dict:
        """
        Get storage usage statistics.
        
        Returns:
            dict: Storage statistics
        """
        stats = {
            "total_threats": 0,
            "storage_used_mb": 0.0,
            "enabled": self.enabled
        }
        
        if not self.enabled:
            return stats
        
        try:
            total_size = 0
            threat_count = 0
            
            for threat_file in self.storage_path.glob("*.json"):
                total_size += threat_file.stat().st_size
                threat_count += 1
            
            stats["total_threats"] = threat_count
            stats["storage_used_mb"] = round(total_size / (1024 * 1024), 2)
            
        except Exception as e:
            logger.error(f"Failed to get storage stats: {e}")
        
        return stats


# Global storage instance
storage = ThreatStorage()
