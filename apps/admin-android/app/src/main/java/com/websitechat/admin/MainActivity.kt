package com.websitechat.admin

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.lifecycleScope
import androidx.navigation.compose.rememberNavController
import com.websitechat.admin.data.repository.AuthRepository
import com.websitechat.admin.ui.navigation.AppNavigation
import com.websitechat.admin.ui.navigation.Screen
import com.websitechat.admin.ui.theme.WebsiteChatAdminTheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    @Inject
    lateinit var authRepository: AuthRepository
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            WebsiteChatAdminTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    var startDestination by remember { mutableStateOf<String?>(null) }
                    
                    LaunchedEffect(Unit) {
                        lifecycleScope.launch {
                            val token = authRepository.authToken.first()
                            startDestination = if (token != null) {
                                Screen.Conversations.route
                            } else {
                                Screen.Login.route
                            }
                        }
                    }
                    
                    startDestination?.let { destination ->
                        AppNavigation(
                            navController = navController,
                            startDestination = destination
                        )
                    }
                }
            }
        }
    }
}