package com.websitechat.admin.ui.screens.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.websitechat.admin.R
import com.websitechat.admin.data.models.Message
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    conversationId: String,
    onBackClick: () -> Unit,
    viewModel: ChatViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    
    LaunchedEffect(conversationId) {
        viewModel.loadConversation(conversationId)
    }
    
    LaunchedEffect(uiState.messages.size) {
        if (uiState.messages.isNotEmpty()) {
            coroutineScope.launch {
                listState.animateScrollToItem(uiState.messages.size - 1)
            }
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = uiState.conversation?.visitor_name 
                                ?: "Visitor ${uiState.conversation?.visitor_id?.take(8) ?: ""}"
                        )
                        uiState.conversation?.visitor_email?.let { email ->
                            Text(
                                text = email,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            Icons.Default.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                }
            )
        },
        bottomBar = {
            ChatInput(
                value = uiState.messageInput,
                onValueChange = viewModel::onMessageInputChange,
                onSend = viewModel::sendMessage,
                isEnabled = !uiState.isSending
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                uiState.isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                uiState.error != null -> {
                    Text(
                        text = uiState.error,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                else -> {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(uiState.messages) { message ->
                            MessageItem(
                                message = message,
                                isFromVisitor = message.sender_type == "visitor"
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MessageItem(
    message: Message,
    isFromVisitor: Boolean
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isFromVisitor) Arrangement.Start else Arrangement.End
    ) {
        Card(
            modifier = Modifier
                .widthIn(max = 280.dp)
                .padding(
                    start = if (isFromVisitor) 0.dp else 48.dp,
                    end = if (isFromVisitor) 48.dp else 0.dp
                ),
            colors = CardDefaults.cardColors(
                containerColor = if (isFromVisitor) 
                    MaterialTheme.colorScheme.secondaryContainer 
                else 
                    MaterialTheme.colorScheme.primaryContainer
            ),
            shape = RoundedCornerShape(
                topStart = 16.dp,
                topEnd = 16.dp,
                bottomStart = if (isFromVisitor) 4.dp else 16.dp,
                bottomEnd = if (isFromVisitor) 16.dp else 4.dp
            )
        ) {
            Text(
                text = message.content,
                modifier = Modifier.padding(12.dp)
            )
        }
    }
}

@Composable
fun ChatInput(
    value: String,
    onValueChange: (String) -> Unit,
    onSend: () -> Unit,
    isEnabled: Boolean
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shadowElevation = 8.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = value,
                onValueChange = onValueChange,
                placeholder = { Text(stringResource(R.string.type_message)) },
                modifier = Modifier.weight(1f),
                enabled = isEnabled,
                singleLine = false,
                maxLines = 4
            )
            
            IconButton(
                onClick = onSend,
                enabled = isEnabled && value.isNotBlank()
            ) {
                Icon(
                    Icons.Default.Send,
                    contentDescription = stringResource(R.string.send_message),
                    tint = if (isEnabled && value.isNotBlank()) 
                        MaterialTheme.colorScheme.primary 
                    else 
                        MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}