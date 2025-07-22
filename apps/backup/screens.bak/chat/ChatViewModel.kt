package com.websitechat.admin.ui.screens.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.websitechat.admin.data.models.Conversation
import com.websitechat.admin.data.models.Message
import com.websitechat.admin.data.repository.ChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val chatRepository: ChatRepository,
    private val json: Json
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()
    
    private var currentConversationId: String? = null
    
    init {
        observeWebSocketMessages()
    }
    
    private fun observeWebSocketMessages() {
        viewModelScope.launch {
            chatRepository.webSocketMessages.collect { message ->
                when (message.type) {
                    "new_message" -> {
                        message.payload.message?.let { newMessage ->
                            if (newMessage.conversation_id == currentConversationId) {
                                addMessage(newMessage)
                            }
                        }
                    }
                }
            }
        }
    }
    
    private fun addMessage(message: Message) {
        val currentMessages = _uiState.value.messages.toMutableList()
        if (currentMessages.none { it.id == message.id }) {
            currentMessages.add(message)
            _uiState.value = _uiState.value.copy(
                messages = currentMessages.sortedBy { it.created_at }
            )
        }
    }
    
    fun loadConversation(conversationId: String) {
        currentConversationId = conversationId
        
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            // Load conversation details
            chatRepository.getConversation(conversationId).fold(
                onSuccess = { conversation ->
                    _uiState.value = _uiState.value.copy(conversation = conversation)
                    
                    // Send WebSocket message to join conversation
                    val joinMessage = json.encodeToString(mapOf(
                        "action" to "join_conversation",
                        "conversation_id" to conversationId
                    ))
                    chatRepository.sendWebSocketMessage(joinMessage)
                },
                onFailure = { exception ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = exception.message ?: "Failed to load conversation"
                    )
                    return@launch
                }
            )
            
            // Load messages
            chatRepository.getMessages(conversationId).fold(
                onSuccess = { messages ->
                    _uiState.value = _uiState.value.copy(
                        messages = messages.sortedBy { it.created_at },
                        isLoading = false
                    )
                    
                    // Mark as read
                    chatRepository.markAsRead(conversationId)
                },
                onFailure = { exception ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = exception.message ?: "Failed to load messages"
                    )
                }
            )
        }
    }
    
    fun onMessageInputChange(input: String) {
        _uiState.value = _uiState.value.copy(messageInput = input)
    }
    
    fun sendMessage() {
        val content = _uiState.value.messageInput.trim()
        if (content.isBlank() || currentConversationId == null) return
        
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSending = true)
            
            chatRepository.sendMessage(currentConversationId!!, content).fold(
                onSuccess = { message ->
                    _uiState.value = _uiState.value.copy(
                        messageInput = "",
                        isSending = false
                    )
                    addMessage(message)
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isSending = false)
                }
            )
        }
    }
    
    override fun onCleared() {
        super.onCleared()
        // Send leave conversation message
        currentConversationId?.let { conversationId ->
            val leaveMessage = json.encodeToString(mapOf(
                "action" to "leave_conversation",
                "conversation_id" to conversationId
            ))
            chatRepository.sendWebSocketMessage(leaveMessage)
        }
    }
}

data class ChatUiState(
    val conversation: Conversation? = null,
    val messages: List<Message> = emptyList(),
    val messageInput: String = "",
    val isLoading: Boolean = false,
    val isSending: Boolean = false,
    val error: String? = null
)