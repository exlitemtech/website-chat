package com.websitechat.admin.ui.screens.conversations

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.websitechat.admin.data.models.Conversation
import com.websitechat.admin.data.models.WebSocketMessage
import com.websitechat.admin.data.repository.AuthRepository
import com.websitechat.admin.data.repository.ChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ConversationsViewModel @Inject constructor(
    private val chatRepository: ChatRepository,
    private val authRepository: AuthRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ConversationsUiState())
    val uiState: StateFlow<ConversationsUiState> = _uiState.asStateFlow()
    
    init {
        observeWebSocketMessages()
        connectWebSocket()
    }
    
    private fun connectWebSocket() {
        viewModelScope.launch {
            authRepository.currentUser.first()?.let { user ->
                authRepository.authToken.first()?.let { token ->
                    chatRepository.connectWebSocket(user.id, token)
                }
            }
        }
    }
    
    private fun observeWebSocketMessages() {
        viewModelScope.launch {
            chatRepository.webSocketMessages.collect { message ->
                when (message.type) {
                    "conversation_update" -> {
                        message.payload.conversation?.let { updatedConversation ->
                            updateConversation(updatedConversation)
                        }
                    }
                    "new_message" -> {
                        // Refresh conversations to update last message and unread count
                        loadConversations()
                    }
                }
            }
        }
    }
    
    private fun updateConversation(conversation: Conversation) {
        val currentList = _uiState.value.conversations.toMutableList()
        val index = currentList.indexOfFirst { it.id == conversation.id }
        if (index != -1) {
            currentList[index] = conversation
        } else {
            currentList.add(0, conversation)
        }
        _uiState.value = _uiState.value.copy(
            conversations = currentList.sortedByDescending { it.updated_at }
        )
    }
    
    fun loadConversations() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            chatRepository.getConversations().fold(
                onSuccess = { conversations ->
                    _uiState.value = _uiState.value.copy(
                        conversations = conversations.sortedByDescending { it.updated_at },
                        isLoading = false
                    )
                },
                onFailure = { exception ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = exception.message ?: "Failed to load conversations"
                    )
                }
            )
        }
    }
    
    fun logout() {
        viewModelScope.launch {
            chatRepository.disconnectWebSocket()
            authRepository.logout()
            _uiState.value = _uiState.value.copy(isLoggedOut = true)
        }
    }
    
    override fun onCleared() {
        super.onCleared()
        chatRepository.disconnectWebSocket()
    }
}

data class ConversationsUiState(
    val conversations: List<Conversation> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val isLoggedOut: Boolean = false
)