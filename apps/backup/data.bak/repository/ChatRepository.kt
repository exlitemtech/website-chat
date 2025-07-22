package com.websitechat.admin.data.repository

import com.websitechat.admin.data.models.*
import com.websitechat.admin.data.network.ApiService
import com.websitechat.admin.data.network.WebSocketManager
import kotlinx.coroutines.flow.SharedFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChatRepository @Inject constructor(
    private val apiService: ApiService,
    private val webSocketManager: WebSocketManager,
    private val authRepository: AuthRepository
) {
    val webSocketMessages: SharedFlow<WebSocketMessage> = webSocketManager.messages
    val connectionState: SharedFlow<WebSocketManager.ConnectionState> = webSocketManager.connectionState
    
    suspend fun getConversations(): Result<List<Conversation>> {
        return try {
            val token = authRepository.getAuthToken() ?: return Result.failure(Exception("Not authenticated"))
            val conversations = apiService.getConversations("Bearer $token")
            Result.success(conversations)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getConversation(conversationId: String): Result<Conversation> {
        return try {
            val token = authRepository.getAuthToken() ?: return Result.failure(Exception("Not authenticated"))
            val conversation = apiService.getConversation("Bearer $token", conversationId)
            Result.success(conversation)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getMessages(conversationId: String): Result<List<Message>> {
        return try {
            val token = authRepository.getAuthToken() ?: return Result.failure(Exception("Not authenticated"))
            val messages = apiService.getMessages("Bearer $token", conversationId)
            Result.success(messages)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun sendMessage(conversationId: String, content: String): Result<Message> {
        return try {
            val token = authRepository.getAuthToken() ?: return Result.failure(Exception("Not authenticated"))
            val message = apiService.sendMessage(
                "Bearer $token", 
                conversationId, 
                SendMessageRequest(content)
            )
            Result.success(message)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun markAsRead(conversationId: String) {
        try {
            val token = authRepository.getAuthToken() ?: return
            apiService.markAsRead("Bearer $token", conversationId)
        } catch (e: Exception) {
            // Handle error silently
        }
    }
    
    fun connectWebSocket(userId: String, token: String) {
        webSocketManager.connect(userId, token)
    }
    
    fun disconnectWebSocket() {
        webSocketManager.disconnect()
    }
    
    fun sendWebSocketMessage(message: String) {
        webSocketManager.sendMessage(message)
    }
}