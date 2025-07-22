package com.websitechat.admin.data.network

import com.websitechat.admin.data.models.*
import retrofit2.http.*

interface ApiService {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse
    
    @GET("conversations")
    suspend fun getConversations(
        @Header("Authorization") token: String
    ): List<Conversation>
    
    @GET("conversations/{id}")
    suspend fun getConversation(
        @Header("Authorization") token: String,
        @Path("id") conversationId: String
    ): Conversation
    
    @GET("conversations/{id}/messages")
    suspend fun getMessages(
        @Header("Authorization") token: String,
        @Path("id") conversationId: String
    ): List<Message>
    
    @POST("conversations/{id}/messages")
    suspend fun sendMessage(
        @Header("Authorization") token: String,
        @Path("id") conversationId: String,
        @Body request: SendMessageRequest
    ): Message
    
    @PUT("conversations/{id}/read")
    suspend fun markAsRead(
        @Header("Authorization") token: String,
        @Path("id") conversationId: String
    )
}