// Enhanced Chat Functionality
class UniGuideChat {
    constructor() {
        this.messageContainer = document.getElementById('messages');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.typingIndicator = document.getElementById('typing-indicator');
        this.chatContainer = document.getElementById('chat-container');
        this.clearChatBtn = document.getElementById('clear-chat');
        this.sidebarToggle = document.getElementById('sidebar-toggle');
        this.sidebar = document.getElementById('sidebar');
        
        this.initializeEventListeners();
        this.loadChatHistory();
        this.handleSuggestionButtons();
        this.setupVoiceInput();
        this.setupFileUpload();
    }
    
    initializeEventListeners() {
        // Send message on button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Send message on Enter key
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
        
        // Clear chat functionality
        this.clearChatBtn?.addEventListener('click', () => {
            this.clearChat();
        });
        
        // Sidebar toggle for mobile
        this.sidebarToggle?.addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        // Handle suggestion button clicks
        this.handleSuggestionButtons();
        
        // Handle navigation in sidebar
        this.setupSidebarNavigation();
    }
    
    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = (this.messageInput.scrollHeight) + 'px';
    }
    
    handleSuggestionButtons() {
        const suggestionBtns = document.querySelectorAll('.suggestion-btn');
        suggestionBtns.forEach(btn => {
            // Remove existing event listeners
            btn.replaceWith(btn.cloneNode(true));
        });
        
        // Re-add event listeners to new elements
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const question = btn.querySelector('p').textContent;
                this.messageInput.value = question;
                this.autoResizeTextarea();
                this.sendMessage();
            });
        });
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        this.addMessageToChat(message, 'user');
        
        // Clear input and reset height
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Send to backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message,
                    context: 'general_chat'
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to get response');
            }
            
            const data = await response.json();
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add AI response to chat
            this.addMessageToChat(data.response, 'ai');
            
            // Add college cards if provided
            if (data.collegeCards && data.collegeCards.length > 0) {
                this.addCollegeCards(data.collegeCards);
            }
            
            // Save to history
            this.saveChatHistory();
            
        } catch (error) {
            console.error('Chat error:', error);
            this.hideTypingIndicator();
            this.addMessageToChat('抱歉，出现了网络错误。请稍后再试。', 'ai', true);
        }
    }
    
    addMessageToChat(message, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = sender === 'user' ? 'flex justify-end' : 'flex justify-start';
        
        const messageClass = sender === 'user' ? 'user-message' : 'ai-message';
        const errorClass = isError ? 'bg-red-100 border border-red-300 text-red-700' : '';
        
        const timestamp = new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageDiv.innerHTML = `
            <div class="message ${messageClass} p-4 ${errorClass}">
                <div class="message-content">${this.formatMessage(message)}</div>
                <div class="text-xs text-gray-500 mt-1 opacity-70">${timestamp}</div>
            </div>
        `;
        
        this.messageContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Hide welcome content if this is the first real message
        this.hideWelcomeContent();
    }
    
    addCollegeCards(colleges) {
        const cardsDiv = document.createElement('div');
        cardsDiv.className = 'flex justify-start mb-4';
        
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'max-w-4xl';
        cardsContainer.innerHTML = `
            <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    推荐大学
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    ${colleges.map(college => this.createCollegeCardHTML(college)).join('')}
                </div>
            </div>
        `;
        
        cardsDiv.appendChild(cardsContainer);
        this.messageContainer.appendChild(cardsDiv);
        
        // Add click handlers to college cards
        cardsContainer.querySelectorAll('.college-card').forEach(card => {
            card.addEventListener('click', () => {
                const collegeId = card.dataset.id;
                const website = card.dataset.website;
                
                // Show options to user
                this.showCollegeCardActions(collegeId, website);
            });
        });
        
        this.scrollToBottom();
    }
    
    createCollegeCardHTML(college) {
        return `
            <div class="college-card bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-all duration-200 hover:border-indigo-300" 
                 data-id="${college.id}" data-website="${college.website || '#'}">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                        <h5 class="font-medium text-sm text-gray-900 line-clamp-1">${college.name}</h5>
                        <p class="text-xs text-gray-500 mt-1">${college.location}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            #${college.ranking}
                        </span>
                    </div>
                </div>
                <p class="text-xs text-gray-600 mb-2 line-clamp-2">${college.description}</p>
                <div class="flex items-center justify-between">
                    <span class="text-xs text-orange-600 font-medium">
                        ${college.acceptanceRate}% 录取率
                    </span>
                    <div class="text-xs text-indigo-600 hover:text-indigo-800 flex items-center">
                        <span>了解更多</span>
                        <svg class="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </div>
        `;
    }
    
    showCollegeCardActions(collegeId, website) {
        const actions = [
            { 
                text: '查看详细信息', 
                action: () => window.location.href = `/colleges?id=${collegeId}` 
            },
            { 
                text: '访问官网', 
                action: () => window.open(website, '_blank') 
            },
            { 
                text: '了解更多关于这所大学', 
                action: () => {
                    this.messageInput.value = `请告诉我更多关于这所大学的信息`;
                    this.sendMessage();
                }
            }
        ];
        
        // Create a simple action menu
        const actionMenu = document.createElement('div');
        actionMenu.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        actionMenu.innerHTML = `
            <div class="bg-white rounded-lg p-4 max-w-sm w-full mx-4">
                <h3 class="font-medium mb-3">选择操作</h3>
                <div class="space-y-2">
                    ${actions.map((action, index) => `
                        <button class="action-btn w-full text-left p-2 rounded hover:bg-gray-100" data-action="${index}">
                            ${action.text}
                        </button>
                    `).join('')}
                </div>
                <button class="close-menu w-full mt-3 p-2 border border-gray-300 rounded hover:bg-gray-50">
                    取消
                </button>
            </div>
        `;
        
        document.body.appendChild(actionMenu);
        
        // Add event listeners
        actionMenu.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const actionIndex = parseInt(btn.dataset.action);
                actions[actionIndex].action();
                document.body.removeChild(actionMenu);
            });
        });
        
        actionMenu.querySelector('.close-menu').addEventListener('click', () => {
            document.body.removeChild(actionMenu);
        });
    }
    
    formatMessage(message) {
        // Basic formatting for AI responses
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-2 rounded text-sm"><code>$1</code></pre>');
    }
    
    showTypingIndicator() {
        this.typingIndicator.classList.remove('hidden');
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.typingIndicator.classList.add('hidden');
    }
    
    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
    
    clearChat() {
        // Keep welcome message and suggestions, clear only chat messages
        const welcomeContainer = document.querySelector('.welcome-container');
        const suggestionsContainer = document.querySelector('.suggestions');
        
        // Clear messages but keep welcome content
        const messages = this.messageContainer.querySelectorAll('.flex');
        messages.forEach(msg => {
            if (!msg.closest('.welcome-container') && !msg.closest('.suggestions')) {
                msg.remove();
            }
        });
        
        // Show welcome content again
        if (welcomeContainer) welcomeContainer.classList.remove('hidden');
        if (suggestionsContainer) suggestionsContainer.classList.remove('hidden');
        
        // Clear localStorage
        this.clearChatHistory();
    }
    
    hideWelcomeContent() {
        const welcomeContainer = document.querySelector('.welcome-container');
        const suggestionsContainer = document.querySelector('.suggestions');
        
        if (welcomeContainer && !welcomeContainer.classList.contains('hidden')) {
            welcomeContainer.classList.add('hidden');
        }
        if (suggestionsContainer && !suggestionsContainer.classList.contains('hidden')) {
            suggestionsContainer.classList.add('hidden');
        }
    }
    
    toggleSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('hidden');
        }
    }
    
    setupSidebarNavigation() {
        // Handle new conversation button
        const newConversationBtn = document.querySelector('button:contains("新对话")');
        newConversationBtn?.addEventListener('click', () => {
            this.clearChat();
        });
        
        // Handle conversation history clicks
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Update active state
                document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // In a full implementation, this would load the conversation
                // For now, we'll just show a placeholder
                this.loadConversation(link.textContent.trim());
            });
        });
    }
    
    loadConversation(title) {
        // Placeholder for loading specific conversations
        // In a real implementation, this would fetch from the server
        console.log('Loading conversation:', title);
    }
    
    setupVoiceInput() {
        // Add voice input button if speech recognition is available
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const voiceBtn = document.createElement('button');
            voiceBtn.className = 'voice-btn absolute right-12 bottom-3 p-2 text-gray-400 hover:text-gray-600';
            voiceBtn.innerHTML = `
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-14 0m14 0a7 7 0 00-14 0M5 11v6a7 7 0 0014 0v-6m-7 0V4m0 0L9 6m3-2l3 2" />
                </svg>
            `;
            
            const inputContainer = this.messageInput.parentElement;
            inputContainer.appendChild(voiceBtn);
            
            voiceBtn.addEventListener('click', () => this.startVoiceInput());
        }
    }
    
    startVoiceInput() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'zh-CN';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.messageInput.value = transcript;
            this.autoResizeTextarea();
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };
        
        recognition.start();
    }
    
    setupFileUpload() {
        // Add file upload functionality
        const fileBtn = document.createElement('button');
        fileBtn.className = 'file-btn absolute right-20 bottom-3 p-2 text-gray-400 hover:text-gray-600';
        fileBtn.innerHTML = `
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
        `;
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg';
        fileInput.className = 'hidden';
        
        const inputContainer = this.messageInput.parentElement;
        inputContainer.appendChild(fileBtn);
        inputContainer.appendChild(fileInput);
        
        fileBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files[0]));
    }
    
    handleFileUpload(file) {
        if (!file) return;
        
        // Show file upload message
        this.addMessageToChat(`📎 已上传文件: ${file.name}`, 'user');
        
        // In a real implementation, this would upload the file to the server
        // and process it for content extraction
        setTimeout(() => {
            this.addMessageToChat('我已经收到您的文件。请告诉我您希望我如何帮助您处理这个文件？', 'ai');
        }, 1000);
    }
    
    saveChatHistory() {
        // Save current chat to localStorage
        const messages = Array.from(this.messageContainer.querySelectorAll('.flex')).map(msg => {
            const messageEl = msg.querySelector('.message');
            if (!messageEl) return null;
            
            return {
                content: messageEl.querySelector('.message-content')?.innerHTML || '',
                sender: messageEl.classList.contains('user-message') ? 'user' : 'ai',
                timestamp: messageEl.querySelector('.text-xs')?.textContent || ''
            };
        }).filter(msg => msg && msg.content && !msg.content.includes('推荐大学'));
        
        localStorage.setItem('uniguide-chat-history', JSON.stringify(messages));
    }
    
    loadChatHistory() {
        const history = localStorage.getItem('uniguide-chat-history');
        if (history) {
            try {
                const messages = JSON.parse(history);
                if (messages.length > 0) {
                    // Hide welcome content if there are saved messages
                    this.hideWelcomeContent();
                    
                    messages.forEach(msg => {
                        if (msg.content && msg.sender) {
                            const messageDiv = document.createElement('div');
                            messageDiv.className = msg.sender === 'user' ? 'flex justify-end' : 'flex justify-start';
                            
                            const messageClass = msg.sender === 'user' ? 'user-message' : 'ai-message';
                            messageDiv.innerHTML = `
                                <div class="message ${messageClass} p-4">
                                    <div class="message-content">${msg.content}</div>
                                    <div class="text-xs text-gray-500 mt-1 opacity-70">${msg.timestamp}</div>
                                </div>
                            `;
                            
                            this.messageContainer.appendChild(messageDiv);
                        }
                    });
                    this.scrollToBottom();
                }
            } catch (error) {
                console.error('Error loading chat history:', error);
            }
        }
    }
    
    clearChatHistory() {
        localStorage.removeItem('uniguide-chat-history');
    }
}

// Initialize chat when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the chat page
    if (document.getElementById('messages')) {
        new UniGuideChat();
    }
    
    // Add floating chat button to other pages
    if (!window.location.pathname.includes('/chat')) {
        addFloatingChatButton();
    }
});

// Floating chat button for other pages
function addFloatingChatButton() {
    const floatingBtn = document.createElement('button');
    floatingBtn.className = 'floating-chat-btn fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg z-40 transition-all duration-300 hover:scale-110';
    floatingBtn.innerHTML = `
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
    `;
    
    floatingBtn.addEventListener('click', () => {
        window.location.href = '/chat';
    });
    
    document.body.appendChild(floatingBtn);
}

// Export for use in other modules
window.UniGuideChat = UniGuideChat;