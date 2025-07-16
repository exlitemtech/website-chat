package com.websitechat.admin.data.models

import kotlinx.serialization.Serializable

@Serializable
data class Conversation(
    val id: String,
    val website_id: String,
    val visitor_id: String,
    val visitor_name: String? = null,
    val visitor_email: String? = null,
    val status: String,
    val created_at: String,
    val updated_at: String,
    val last_message: Message? = null,
    val unread_count: Int = 0
)