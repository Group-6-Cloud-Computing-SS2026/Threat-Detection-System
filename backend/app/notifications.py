"""Telegram Bot notifications for threat alerts."""

import httpx
import logging
from typing import Optional
from datetime import datetime
from app.config import settings
from app.models import ThreatLevel, ThreatDetailResponse

logger = logging.getLogger(__name__)

TELEGRAM_API_URL = "https://api.telegram.org/bot"


class TelegramNotifier:
    """Sends threat notifications via Telegram Bot (Task 9)."""
    
    def __init__(self):
        """Initialize Telegram notifier."""
        self.enabled = settings.telegram_enabled
        self.bot_token = settings.telegram_bot_token
        self.chat_id = settings.telegram_chat_id
    
    async def send_threat_alert(self, threat: ThreatDetailResponse) -> bool:
        """
        Send threat alert via Telegram.
        
        Args:
            threat: Threat details
            
        Returns:
            bool: True if sent successfully
        """
        if not self.enabled or not self.bot_token or not self.chat_id:
            logger.debug("Telegram notifications disabled")
            return False
        
        try:
            message = self._format_threat_message(threat)
            return await self._send_message(message)
            
        except Exception as e:
            logger.error(f"Failed to send Telegram alert: {e}")
            return False
    
    async def send_health_alert(self, sensor_id: str, status: str) -> bool:
        """
        Send health/status alert via Telegram.
        
        Args:
            sensor_id: Sensor identifier
            status: Status message
            
        Returns:
            bool: True if sent successfully
        """
        if not self.enabled or not self.bot_token or not self.chat_id:
            return False
        
        try:
            message = f"🔔 **Sensor Health Alert**\n\n"
            message += f"Sensor: {sensor_id}\n"
            message += f"Status: {status}\n"
            message += f"Time: {datetime.utcnow().isoformat()}\n"
            
            return await self._send_message(message)
            
        except Exception as e:
            logger.error(f"Failed to send health alert: {e}")
            return False
    
    def _format_threat_message(self, threat: ThreatDetailResponse) -> str:
        """
        Format threat data into readable Telegram message.
        
        Args:
            threat: Threat details
            
        Returns:
            str: Formatted message
        """
        # Emoji indicators
        emoji_map = {
            ThreatLevel.CRITICAL: "🚨",
            ThreatLevel.HIGH: "⚠️",
            ThreatLevel.MEDIUM: "⚡",
            ThreatLevel.LOW: "ℹ️"
        }
        
        emoji = emoji_map.get(threat.threat_level, "ℹ️")
        
        message = f"{emoji} **THREAT DETECTION ALERT**\n\n"
        message += f"<b>Level:</b> {threat.threat_level}\n"
        message += f"<b>Object:</b> {threat.object_type}\n"
        message += f"<b>Confidence:</b> {threat.confidence:.1%}\n"
        message += f"<b>Sensor:</b> {threat.sensor_id}\n"
        
        if threat.location:
            message += f"<b>Location:</b> {threat.location}\n"
        
        message += f"<b>Time:</b> {threat.timestamp.isoformat()}\n"
        
        if threat.image_url:
            message += f"<b>Evidence:</b> <a href='{threat.image_url}'>View Image</a>\n"
        
        return message
    
    async def _send_message(self, message: str) -> bool:
        """
        Send message via Telegram API.
        
        Args:
            message: Message content
            
        Returns:
            bool: True if sent successfully
        """
        try:
            url = f"{TELEGRAM_API_URL}{self.bot_token}/sendMessage"
            
            payload = {
                "chat_id": self.chat_id,
                "text": message,
                "parse_mode": "HTML"
            }
            
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
            
            logger.info(f"Telegram message sent successfully")
            return True
            
        except Exception as e:
            logger.error(f"Telegram API error: {e}")
            return False
    
    async def send_image_alert(self, threat_id: str, image_url: str) -> bool:
        """
        Send threat image via Telegram.
        
        Args:
            threat_id: Threat identifier
            image_url: URL of threat image
            
        Returns:
            bool: True if sent successfully
        """
        if not self.enabled or not self.bot_token or not self.chat_id:
            return False
        
        try:
            url = f"{TELEGRAM_API_URL}{self.bot_token}/sendPhoto"
            
            payload = {
                "chat_id": self.chat_id,
                "photo": image_url,
                "caption": f"Threat Evidence: {threat_id}"
            }
            
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
            
            logger.info(f"Image sent to Telegram")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send image: {e}")
            return False


# Global notifier instance
notifier = TelegramNotifier()
