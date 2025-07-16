package com.websitechat.admin.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.websitechat.admin.data.models.LoginRequest
import com.websitechat.admin.data.models.User
import com.websitechat.admin.data.network.ApiService
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "auth_prefs")

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: ApiService,
    @ApplicationContext private val context: Context
) {
    private val TOKEN_KEY = stringPreferencesKey("auth_token")
    private val USER_ID_KEY = stringPreferencesKey("user_id")
    private val USER_EMAIL_KEY = stringPreferencesKey("user_email")
    private val USER_NAME_KEY = stringPreferencesKey("user_name")
    
    val authToken: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[TOKEN_KEY]
    }
    
    val currentUser: Flow<User?> = context.dataStore.data.map { preferences ->
        val id = preferences[USER_ID_KEY]
        val email = preferences[USER_EMAIL_KEY]
        val name = preferences[USER_NAME_KEY]
        
        if (id != null && email != null && name != null) {
            User(id = id, email = email, name = name, role = "admin")
        } else {
            null
        }
    }
    
    suspend fun login(email: String, password: String): Result<User> {
        return try {
            val response = apiService.login(LoginRequest(email, password))
            
            // Save auth data
            context.dataStore.edit { preferences ->
                preferences[TOKEN_KEY] = response.access_token
                preferences[USER_ID_KEY] = response.user.id
                preferences[USER_EMAIL_KEY] = response.user.email
                preferences[USER_NAME_KEY] = response.user.name
            }
            
            Result.success(response.user)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun logout() {
        context.dataStore.edit { preferences ->
            preferences.clear()
        }
    }
    
    suspend fun getAuthToken(): String? {
        return context.dataStore.data.map { preferences ->
            preferences[TOKEN_KEY]
        }.first()
    }
}