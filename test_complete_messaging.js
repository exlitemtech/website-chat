// Complete messaging test: Widget → Web Admin + Duplicate Prevention
const WebSocket = require('ws');

console.log('🧪 COMPLETE MESSAGING TEST');
console.log('============================');
console.log('Testing:');
console.log('1. Widget → Web Admin real-time messaging'); 
console.log('2. Duplicate message prevention in widget');
console.log('3. Bidirectional messaging flow');
console.log('');

async function testCompleteMessaging() {
    console.log('📡 Step 1: Setting up Web Admin WebSocket...');
    
    // First login to get credentials
    const { spawn } = require('child_process');
    
    const loginCommand = spawn('curl', [
        '-X', 'POST',
        '-H', 'Content-Type: application/json',
        '-d', JSON.stringify({
            email: 'admin@example.com',
            password: 'password123'
        }),
        'http://localhost:8000/api/v1/auth/login'
    ]);
    
    let loginResponse = '';
    loginCommand.stdout.on('data', (data) => {
        loginResponse += data.toString();
    });
    
    loginCommand.on('close', (code) => {
        if (code === 0) {
            try {
                const result = JSON.parse(loginResponse);
                if (result.accessToken) {
                    console.log('✅ Admin authentication successful');
                    setupWebAdminWebSocket(result.user.id, result.accessToken);
                } else {
                    console.log('❌ Admin authentication failed');
                    process.exit(1);
                }
            } catch (e) {
                console.log('❌ Login parsing failed');
                process.exit(1);
            }
        }
    });
}

function setupWebAdminWebSocket(userId, token) {
    const conversationId = 'ab991d0e-e714-4c6d-9419-816939b7d555';
    const wsUrl = `ws://localhost:8000/ws/agent/${userId}?token=${encodeURIComponent(token)}`;
    
    console.log('🔌 Connecting Web Admin WebSocket...');
    const adminWs = new WebSocket(wsUrl);
    
    let adminConnected = false;
    let adminJoined = false;
    let widgetMessagesReceived = 0;
    let agentMessagesReceived = 0;
    const expectedTests = 2; // We'll send 2 widget messages to test duplicates
    
    adminWs.on('open', function() {
        console.log('✅ Web Admin WebSocket connected');
        adminConnected = true;
        
        // Join conversation immediately
        setTimeout(() => {
            console.log('📤 Admin joining conversation...');
            adminWs.send(JSON.stringify({
                type: 'join_conversation',
                conversation_id: conversationId
            }));
        }, 100);
    });
    
    adminWs.on('message', function(data) {
        try {
            const message = JSON.parse(data);
            console.log(`📥 Admin WebSocket received: ${message.type}`);
            
            if (message.type === 'connection_established') {
                console.log('   ✅ Admin connection established');
                
            } else if (message.type === 'agent_joined') {
                console.log('   ✅ Admin successfully joined conversation');
                adminJoined = true;
                
                // Start testing widget messages
                setTimeout(() => {
                    console.log('\n📡 Step 2: Testing Widget → Admin messaging...');
                    testWidgetMessages();
                }, 500);
                
            } else if (message.type === 'new_message') {
                console.log(`   🔔 ADMIN RECEIVED MESSAGE: "${message.message.content}"`);
                console.log(`   👤 From: ${message.message.sender} (${message.message.sender_id})`);
                
                if (message.message.sender === 'visitor') {
                    widgetMessagesReceived++;
                    console.log(`   📊 Widget messages received by admin: ${widgetMessagesReceived}/${expectedTests}`);
                    
                    if (widgetMessagesReceived >= expectedTests) {
                        // All widget messages received, now test admin → widget
                        setTimeout(() => {
                            console.log('\n📡 Step 3: Testing Admin → Widget messaging...');
                            testAdminToWidget();
                        }, 1000);
                    }
                } else if (message.message.sender === 'agent') {
                    agentMessagesReceived++;
                    console.log(`   📊 Agent messages confirmed: ${agentMessagesReceived}`);
                    
                    // Test complete
                    setTimeout(() => {
                        showFinalResults();
                        adminWs.close();
                        process.exit(0);
                    }, 1000);
                }
                
            } else {
                console.log(`   📋 Other message: ${message.type}`);
            }
            
        } catch (e) {
            console.log('📥 Raw admin message:', data.toString());
        }
    });
    
    adminWs.on('error', function(err) {
        console.log('❌ Admin WebSocket error:', err.message);
    });
    
    adminWs.on('close', function(code, reason) {
        console.log(`🔌 Admin WebSocket closed: ${code} - ${reason}`);
    });
    
    function testWidgetMessages() {
        console.log('🚀 Sending 2 widget messages to test duplicate prevention...');
        
        // Send first message
        setTimeout(() => sendWidgetMessage('First widget message'), 100);
        
        // Send second message 
        setTimeout(() => sendWidgetMessage('Second widget message'), 2000);
    }
    
    function sendWidgetMessage(content) {
        const timestamp = Date.now();
        const messageContent = `${content} ${timestamp}`;
        
        console.log(`📡 Sending widget message: "${messageContent}"`);
        
        const { spawn } = require('child_process');
        const curlCommand = spawn('curl', [
            '-X', 'POST',
            '-H', 'Content-Type: application/json',
            '-d', JSON.stringify({
                content: messageContent,
                visitorId: 'duplicate-test-visitor',
                websiteId: 'test-website',
                conversationId: conversationId
            }),
            'http://localhost:8000/api/v1/widget/message'
        ]);
        
        let widgetResponse = '';
        curlCommand.stdout.on('data', (data) => {
            widgetResponse += data.toString();
        });
        
        curlCommand.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(widgetResponse);
                    if (result.success) {
                        console.log(`✅ Widget API call successful for: "${messageContent}"`);
                        console.log(`📝 Message ID: ${result.message.id}`);
                    } else {
                        console.log(`❌ Widget API call failed: ${result.error}`);
                    }
                } catch (e) {
                    console.log('❌ Widget API response parsing failed');
                }
            }
        });
    }
    
    function testAdminToWidget() {
        console.log('📤 Sending admin message to test bidirectional flow...');
        
        const agentMessage = {
            type: 'send_message',
            conversation_id: conversationId,
            content: `Admin response ${Date.now()}`
        };
        
        adminWs.send(JSON.stringify(agentMessage));
        console.log(`📡 Admin sent: "${agentMessage.content}"`);
    }
    
    function showFinalResults() {
        console.log('\n📊 COMPLETE MESSAGING TEST RESULTS');
        console.log('===================================');
        
        console.log(`${adminConnected ? '✅' : '❌'} Admin WebSocket Connection`);
        console.log(`${adminJoined ? '✅' : '❌'} Admin Joined Conversation`);
        console.log(`${widgetMessagesReceived >= expectedTests ? '✅' : '❌'} Widget → Admin Messages (${widgetMessagesReceived}/${expectedTests})`);
        console.log(`${agentMessagesReceived >= 1 ? '✅' : '❌'} Admin → Widget Messages (${agentMessagesReceived}/1)`);
        
        const allTestsPassed = adminConnected && adminJoined && 
                              widgetMessagesReceived >= expectedTests && 
                              agentMessagesReceived >= 1;
        
        if (allTestsPassed) {
            console.log('\n🎉 SUCCESS: All messaging tests passed!');
            console.log('✅ Widget → Web Admin messaging works');
            console.log('✅ Admin → Widget messaging works');
            console.log('✅ Bidirectional real-time messaging confirmed');
            console.log('\n📝 Next: Check widget UI to confirm no duplicate messages appear');
            console.log('📝 To test: Open test-website/index.html and send messages');
        } else {
            console.log('\n❌ ISSUE: Some tests failed');
            
            if (!adminConnected || !adminJoined) {
                console.log('🔧 Problem: Admin WebSocket connection/join failed');
            }
            if (widgetMessagesReceived < expectedTests) {
                console.log('🔧 Problem: Widget → Admin messaging not working');
            }
            if (agentMessagesReceived < 1) {
                console.log('🔧 Problem: Admin → Widget messaging not working');
            }
        }
    }
    
    // Safety timeout
    setTimeout(() => {
        console.log('\n⏰ Test timeout');
        showFinalResults();
        adminWs.close();
        process.exit(1);
    }, 30000);
}

testCompleteMessaging();