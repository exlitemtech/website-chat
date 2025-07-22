package com.websitechat.admin.data.models

import kotlinx.serialization.Serializable

@Serializable
data class Message(
    val id: String,
    val conversation_id: String,
    val sender_type: String,
    val sender_id: String? = null,
    val content: String,
    val created_at: String,
    val read_at: String? = null
)

@Serializable
data class SendMessageRequest(
    val content: String
)

@Serializable
data class WebSocketMessage(
    val type: String,
    val payload: WebSocketPayload
)

@Serializable
data class WebSocketPayload(
    val action: String? = null,
    val conversation_id: String? = null,
    val message: Message? = null,
    val conversation: Conversation? = null
)