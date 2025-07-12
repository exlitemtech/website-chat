// Simple Node.js script to verify widget works
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

async function testWidget() {
    try {
        // Read the test HTML file
        const htmlPath = path.join(__dirname, 'test-simple.html');
        const html = fs.readFileSync(htmlPath, 'utf8');
        
        // Read the widget JS file
        const jsPath = path.join(__dirname, '../apps/chat-widget/dist/website-chat-widget.iife.js');
        const widgetJs = fs.readFileSync(jsPath, 'utf8');
        
        // Create JSDOM instance
        const dom = new JSDOM(html, { 
            runScripts: "dangerously",
            resources: "usable",
            pretendToBeVisual: true
        });
        
        const { window } = dom;
        
        // Add the widget script
        const script = window.document.createElement('script');
        script.textContent = widgetJs;
        window.document.head.appendChild(script);
        
        // Wait a bit for script to execute
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('WebsiteChat type:', typeof window.WebsiteChat);
        console.log('WebsiteChat methods:', window.WebsiteChat ? Object.keys(window.WebsiteChat) : 'none');
        
        if (window.WebsiteChat) {
            try {
                const widget = window.WebsiteChat.init({
                    websiteId: 'test-123',
                    apiUrl: 'http://localhost:8002',
                    primaryColor: '#667eea',
                    position: 'bottom-right',
                    welcomeMessage: 'Test working!',
                    agentName: 'Test Agent'
                });
                
                console.log('Widget initialized successfully:', !!widget);
                
                // Check DOM elements
                const container = window.document.querySelector('.wc-widget-container');
                const launcher = window.document.querySelector('.wc-launcher');
                
                console.log('Container created:', !!container);
                console.log('Launcher created:', !!launcher);
                
                if (container) {
                    console.log('Container position:', window.getComputedStyle(container).position);
                    console.log('Container z-index:', window.getComputedStyle(container).zIndex);
                }
                
            } catch (initError) {
                console.error('Initialization error:', initError.message);
            }
        } else {
            console.error('WebsiteChat not available on window');
        }
        
    } catch (error) {
        console.error('Test failed:', error.message);
        console.log('JSDOM not available, widget should be tested manually in browser');
        console.log('Visit: http://localhost:8001/test-simple.html');
    }
}

testWidget();