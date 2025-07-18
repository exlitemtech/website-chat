import json
import asyncio
from typing import Dict, List, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import uuid

class ConnectionManager:
    def __init__(self):
        # Active WebSocket connections
        self.active_connections: Dict[str, WebSocket] = {}
        
        # Connection metadata
        self.connection_info: Dict[str, Dict] = {}
        
        # Conversation subscriptions: conversation_id -> set of connection_ids
        self.conversation_subscriptions: Dict[str, Set[str]] = {}
        
        # User subscriptions: user_id -> set of connection_ids  
        self.user_subscriptions: Dict[str, Set[str]] = {}
        
        # Website subscriptions: website_id -> set of connection_ids
        self.website_subscriptions: Dict[str, Set[str]] = {}
        
        # Connection limits
        self.max_connections_per_user = 1  # One WebSocket per agent session
        self.max_total_connections = 100  # Reduced for better resource management
        
        # Connection cleanup settings
        self.idle_timeout = 300  # 5 minutes idle timeout
        self.cleanup_interval = 60  # Check for idle connections every minute

    async def connect(self, websocket: WebSocket, connection_id: str, user_id: str, 
                     connection_type: str = "agent", website_id: Optional[str] = None,
                     visitor_id: Optional[str] = None):
        """Register a new WebSocket connection (assumes websocket.accept() already called)"""
        
        # Clean up idle connections first
        await self._cleanup_idle_connections()
        
        # Check total connection limit
        if len(self.active_connections) >= self.max_total_connections:
            await websocket.close(code=4008, reason="Server at capacity")
            raise Exception("Max total connections reached")
        
        # WebSocket should already be accepted by endpoint
        print(f"Registering WebSocket connection for {connection_type} {user_id}")
        
        # Store connection info before closing old ones
        self.active_connections[connection_id] = websocket
        self.connection_info[connection_id] = {
            "user_id": user_id,
            "connection_type": connection_type,  # "agent" or "visitor"
            "website_id": website_id,
            "visitor_id": visitor_id,
            "connected_at": datetime.utcnow().isoformat(),
            "last_seen": datetime.utcnow().isoformat()
        }
        
        # Subscribe user to their own updates
        if user_id not in self.user_subscriptions:
            self.user_subscriptions[user_id] = set()
        self.user_subscriptions[user_id].add(connection_id)
        
        # For agents, temporarily allow multiple connections for testing
        if connection_type == "agent":
            print(f"Agent connection established for user {user_id}")
            # Temporarily disabled: other_connections cleanup for testing
            # This will be re-enabled after confirming messaging works
            
        # For visitors, allow the configured limit
        elif connection_type == "visitor":
            existing_visitor_connections = len([conn_id for conn_id in self.user_subscriptions.get(user_id, set()) 
                                              if conn_id != connection_id])
            if existing_visitor_connections >= self.max_connections_per_user:
                await self._cleanup_oldest_user_connection(user_id)
                await asyncio.sleep(0.1)
        
        # Subscribe user to their own updates
        if user_id not in self.user_subscriptions:
            self.user_subscriptions[user_id] = set()
        self.user_subscriptions[user_id].add(connection_id)
        
        # Subscribe to website updates if specified
        if website_id:
            if website_id not in self.website_subscriptions:
                self.website_subscriptions[website_id] = set()
            self.website_subscriptions[website_id].add(connection_id)

        print(f"WebSocket connection established: {connection_id} ({connection_type}) - Total: {len(self.active_connections)}")

    async def _close_all_user_connections(self, user_id: str, reason: str = "Connection replaced"):
        """Close all existing connections for a user (used for agents)"""
        if user_id not in self.user_subscriptions:
            return
            
        user_connection_ids = list(self.user_subscriptions[user_id])
        if not user_connection_ids:
            return
            
        print(f"Closing {len(user_connection_ids)} existing connections for user {user_id}")
        
        for conn_id in user_connection_ids:
            if conn_id in self.active_connections:
                try:
                    await self.active_connections[conn_id].close(code=4010, reason=reason)
                    print(f"Closed connection {conn_id} for user {user_id}: {reason}")
                except Exception as e:
                    print(f"Error closing connection {conn_id}: {e}")
                finally:
                    self.disconnect(conn_id)
        
        # Small delay to ensure cleanup is complete
        await asyncio.sleep(0.2)

    async def _close_specific_connections(self, connection_ids: list, reason: str = "Connection replaced"):
        """Close specific connections by ID"""
        if not connection_ids:
            return
            
        print(f"Closing {len(connection_ids)} specific connections")
        
        for conn_id in connection_ids:
            if conn_id in self.active_connections:
                try:
                    await self.active_connections[conn_id].close(code=4010, reason=reason)
                    print(f"Closed connection {conn_id}: {reason}")
                except Exception as e:
                    print(f"Error closing connection {conn_id}: {e}")
                finally:
                    self.disconnect(conn_id)
        
        # Small delay to ensure cleanup is complete
        await asyncio.sleep(0.1)

    async def _delayed_connection_cleanup(self, connection_ids: list, reason: str):
        """Close connections after a delay to allow new connection to stabilize"""
        await asyncio.sleep(5.0)  # Give new connection more time to join conversations and stabilize
        await self._close_specific_connections(connection_ids, reason)

    async def _cleanup_oldest_user_connection(self, user_id: str):
        """Close the oldest connection for a user to make room for a new one"""
        if user_id not in self.user_subscriptions:
            return
            
        user_connection_ids = list(self.user_subscriptions[user_id])
        if not user_connection_ids:
            return
            
        # Find oldest connection by creation time
        oldest_connection_id = None
        oldest_time = None
        
        for conn_id in user_connection_ids:
            if conn_id in self.connection_info:
                connected_at = self.connection_info[conn_id].get("connected_at")
                if oldest_time is None or (connected_at and connected_at < oldest_time):
                    oldest_time = connected_at
                    oldest_connection_id = conn_id
        
        if oldest_connection_id and oldest_connection_id in self.active_connections:
            try:
                await self.active_connections[oldest_connection_id].close(code=4009, reason="Connection limit reached")
                print(f"Closed oldest connection {oldest_connection_id} for user {user_id}")
            except:
                pass
            finally:
                self.disconnect(oldest_connection_id)
    
    async def _cleanup_idle_connections(self):
        """Clean up idle connections that have exceeded the timeout"""
        current_time = datetime.utcnow()
        connections_to_remove = []
        
        for connection_id, info in self.connection_info.items():
            try:
                last_seen = datetime.fromisoformat(info.get("last_seen", info.get("connected_at", "")))
                idle_time = (current_time - last_seen).total_seconds()
                
                if idle_time > self.idle_timeout:
                    connections_to_remove.append(connection_id)
                    
            except (ValueError, TypeError):
                # If timestamp parsing fails, consider it idle
                connections_to_remove.append(connection_id)
        
        for connection_id in connections_to_remove:
            if connection_id in self.active_connections:
                try:
                    await self.active_connections[connection_id].close(code=4002, reason="Idle timeout")
                    print(f"Closed idle connection {connection_id}")
                except:
                    pass
                finally:
                    self.disconnect(connection_id)

    def disconnect(self, connection_id: str):
        """Remove a WebSocket connection"""
        if connection_id in self.active_connections:
            # Remove from active connections
            del self.active_connections[connection_id]
            
            # Get connection info before removing
            info = self.connection_info.get(connection_id, {})
            user_id = info.get("user_id")
            website_id = info.get("website_id")
            
            # Remove from subscriptions
            if user_id and user_id in self.user_subscriptions:
                self.user_subscriptions[user_id].discard(connection_id)
                if not self.user_subscriptions[user_id]:
                    del self.user_subscriptions[user_id]
            
            if website_id and website_id in self.website_subscriptions:
                self.website_subscriptions[website_id].discard(connection_id)
                if not self.website_subscriptions[website_id]:
                    del self.website_subscriptions[website_id]
            
            # Remove from conversation subscriptions
            for conv_id, conn_set in self.conversation_subscriptions.items():
                conn_set.discard(connection_id)
            
            # Clean up empty subscription sets
            self.conversation_subscriptions = {
                k: v for k, v in self.conversation_subscriptions.items() if v
            }
            
            # Remove connection info
            if connection_id in self.connection_info:
                del self.connection_info[connection_id]
            
            print(f"WebSocket connection closed: {connection_id}")

    async def send_personal_message(self, message: dict, connection_id: str):
        """Send a message to a specific connection"""
        if connection_id in self.active_connections:
            websocket = self.active_connections[connection_id]
            try:
                # Check if WebSocket is still open
                if websocket.client_state.value == 3:  # CLOSED state
                    print(f"WebSocket {connection_id} is already closed, removing connection")
                    self.disconnect(connection_id)
                    return
                
                await websocket.send_text(json.dumps(message))
                
                # Update last seen
                if connection_id in self.connection_info:
                    self.connection_info[connection_id]["last_seen"] = datetime.utcnow().isoformat()
                    
            except Exception as e:
                error_msg = str(e) if str(e) else f"{type(e).__name__}: {repr(e)}"
                print(f"Error sending message to {connection_id}: {error_msg}")
                # Connection is broken, remove it
                self.disconnect(connection_id)
                # Re-raise WebSocketDisconnect to let the endpoint handle it properly
                from fastapi import WebSocketDisconnect
                if isinstance(e, WebSocketDisconnect):
                    raise e

    async def broadcast_to_conversation(self, message: dict, conversation_id: str, 
                                      exclude_connection: Optional[str] = None):
        """Broadcast a message to all connections subscribed to a conversation"""
        if conversation_id not in self.conversation_subscriptions:
            print(f"📭 No subscribers for conversation {conversation_id}")
            return
        
        subscribers = self.conversation_subscriptions[conversation_id]
        print(f"📤 Broadcasting to {len(subscribers)} subscribers for conversation {conversation_id}")
        
        connections_to_remove = []
        
        for connection_id in subscribers:
            if exclude_connection and connection_id == exclude_connection:
                print(f"⏭️ Skipping excluded connection {connection_id}")
                continue
                
            try:
                print(f"📨 Sending message to connection {connection_id}")
                await self.send_personal_message(message, connection_id)
                print(f"✅ Message sent to connection {connection_id}")
            except Exception as e:
                print(f"❌ Failed to send message to connection {connection_id}: {e}")
                connections_to_remove.append(connection_id)
        
        # Remove broken connections
        for connection_id in connections_to_remove:
            self.disconnect(connection_id)

    async def broadcast_to_user(self, message: dict, user_id: str, 
                               exclude_connection: Optional[str] = None):
        """Broadcast a message to all connections for a specific user"""
        if user_id not in self.user_subscriptions:
            return
        
        connections_to_remove = []
        
        for connection_id in self.user_subscriptions[user_id]:
            if exclude_connection and connection_id == exclude_connection:
                continue
                
            try:
                await self.send_personal_message(message, connection_id)
            except:
                connections_to_remove.append(connection_id)
        
        # Remove broken connections
        for connection_id in connections_to_remove:
            self.disconnect(connection_id)

    async def broadcast_to_website(self, message: dict, website_id: str,
                                  exclude_connection: Optional[str] = None):
        """Broadcast a message to all connections for a specific website"""
        if website_id not in self.website_subscriptions:
            return
        
        connections_to_remove = []
        
        for connection_id in self.website_subscriptions[website_id]:
            if exclude_connection and connection_id == exclude_connection:
                continue
                
            try:
                await self.send_personal_message(message, connection_id)
            except:
                connections_to_remove.append(connection_id)
        
        # Remove broken connections
        for connection_id in connections_to_remove:
            self.disconnect(connection_id)

    def subscribe_to_conversation(self, connection_id: str, conversation_id: str):
        """Subscribe a connection to conversation updates"""
        if conversation_id not in self.conversation_subscriptions:
            self.conversation_subscriptions[conversation_id] = set()
        
        self.conversation_subscriptions[conversation_id].add(connection_id)
        print(f"Connection {connection_id} subscribed to conversation {conversation_id}")

    def unsubscribe_from_conversation(self, connection_id: str, conversation_id: str):
        """Unsubscribe a connection from conversation updates"""
        if conversation_id in self.conversation_subscriptions:
            self.conversation_subscriptions[conversation_id].discard(connection_id)
            if not self.conversation_subscriptions[conversation_id]:
                del self.conversation_subscriptions[conversation_id]

    def get_conversation_participants(self, conversation_id: str) -> List[Dict]:
        """Get all active participants in a conversation"""
        if conversation_id not in self.conversation_subscriptions:
            return []
        
        participants = []
        for connection_id in self.conversation_subscriptions[conversation_id]:
            if connection_id in self.connection_info:
                info = self.connection_info[connection_id].copy()
                info["connection_id"] = connection_id
                participants.append(info)
        
        return participants

    def get_online_agents(self, website_id: Optional[str] = None) -> List[Dict]:
        """Get all online agents, optionally filtered by website"""
        agents = []
        
        for connection_id, info in self.connection_info.items():
            if info.get("connection_type") == "agent":
                if website_id is None or info.get("website_id") == website_id:
                    agent_info = info.copy()
                    agent_info["connection_id"] = connection_id
                    agents.append(agent_info)
        
        return agents

    def get_connection_stats(self) -> Dict:
        """Get connection statistics"""
        total_connections = len(self.active_connections)
        agent_connections = sum(1 for info in self.connection_info.values() 
                               if info.get("connection_type") == "agent")
        visitor_connections = sum(1 for info in self.connection_info.values() 
                                 if info.get("connection_type") == "visitor")
        
        return {
            "total_connections": total_connections,
            "agent_connections": agent_connections,
            "visitor_connections": visitor_connections,
            "active_conversations": len(self.conversation_subscriptions),
            "websites_with_connections": len(self.website_subscriptions)
        }

# Global connection manager instance
connection_manager = ConnectionManager()