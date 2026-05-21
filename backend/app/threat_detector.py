"""Threat detection and classification system."""

import logging
from datetime import datetime
from typing import Tuple
from app.models import ThreatLevel, ThreatDetailResponse
from app.config import settings

logger = logging.getLogger(__name__)

# High-risk object types that always trigger higher threat levels
HIGH_RISK_OBJECTS = {"weapon", "gun", "knife", "explosive", "fire", "smoke"}


class ThreatDetector:
    """Intelligent threat detection and classification."""
    
    def __init__(self):
        """Initialize threat detector with settings."""
        self.sensitivity = settings.threat_sensitivity
        self.critical_threshold = settings.critical_threshold
        self.high_threshold = settings.high_threshold
        self.medium_threshold = settings.medium_threshold
    
    def classify_threat(
        self,
        object_type: str,
        confidence: float,
        location: str = None
    ) -> Tuple[ThreatLevel, str]:
        """
        Classify threat based on object type and detection confidence.
        
        Args:
            object_type: Type of object detected
            confidence: Detection confidence (0-1)
            location: Location metadata
            
        Returns:
            Tuple of (ThreatLevel, reasoning_string)
        """
        
        # Apply sensitivity adjustment
        adjusted_confidence = confidence * self.sensitivity
        
        # Check for high-risk objects
        is_high_risk = object_type.lower() in HIGH_RISK_OBJECTS
        
        # Classify based on confidence and risk level
        if adjusted_confidence >= self.critical_threshold:
            threat_level = ThreatLevel.CRITICAL
            reason = f"Critical threat detected: {object_type} with {confidence:.2%} confidence"
            
        elif is_high_risk and adjusted_confidence >= self.high_threshold:
            threat_level = ThreatLevel.CRITICAL
            reason = f"High-risk object detected: {object_type} at {confidence:.2%} confidence"
            
        elif adjusted_confidence >= self.high_threshold:
            threat_level = ThreatLevel.HIGH
            reason = f"High threat level: {object_type} detected with {confidence:.2%} confidence"
            
        elif adjusted_confidence >= self.medium_threshold:
            threat_level = ThreatLevel.MEDIUM
            reason = f"Medium threat level: {object_type} detected"
            
        else:
            threat_level = ThreatLevel.LOW
            reason = f"Low threat level: {object_type} detected"
        
        return threat_level, reason
    
    def should_notify(self, threat_level: ThreatLevel) -> bool:
        """
        Determine if threat should trigger notifications.
        
        Args:
            threat_level: Level of threat
            
        Returns:
            bool: True if notifications should be sent
        """
        return threat_level in [ThreatLevel.CRITICAL, ThreatLevel.HIGH]
    
    def generate_threat_id(self, sensor_id: str) -> str:
        """
        Generate unique threat ID.
        
        Args:
            sensor_id: Sensor identifier
            
        Returns:
            str: Unique threat ID
        """
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
        return f"THREAT-{sensor_id}-{timestamp}"


# Global detector instance
detector = ThreatDetector()
