// Enhanced Chat Functionality
class UniGuideChat {
    constructor() {
        this.messageContainer = document.getElementById('messages');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.typingIndicator = document.getElementById('typing-indicator');
        this.chatContainer = document.getElementById('chat-container');
        this.clearChatHistory();
        
        // Re-initialize suggestion buttons
        this.handleSuggestionButtons();
    }
    
    saveChatHistory() {
        // Save chat history to localStorage
        const messages = Array.from(this.messageContainer.querySelectorAll('.message')).map(msg => ({
            content: msg.querySelector('p').innerHTML,
            sender: msg.classList.contains('user-message') ? 'user' : 'ai',
            timestamp: msg.querySelector('.text-xs').textContent
        }));
        localStorage.setItem('uniguide-chat-history', JSON.stringify(messages));
    }
    
    loadChatHistory() {
        const history = localStorage.getItem('uniguide-chat-history');
        if (history) {
            try {
                const messages = JSON.parse(history);
                messages.forEach(msg => {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = msg.sender === 'user' ? 'flex justify-end' : 'flex justify-start';
                    
                    const messageClass = msg.sender === 'user' ? 'user-message' : 'ai-message';
                    messageDiv.innerHTML = `
                        <div class="message ${messageClass} p-4">
                            <p>${msg.content}</p>
                            <div class="text-xs text-gray-500 mt-1">${msg.timestamp}</div>
                        </div>
                    `;
                    
                    this.messageContainer.appendChild(messageDiv);
                });
                this.scrollToBottom();
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
    new UniGuideChat();
});ChatBtn = document.getElementById('clear-chat');
        
        this.initializeEventListeners();
        this.loadChatHistory();
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
        this.clearChatBtn.addEventListener('click', () => {
            this.clearChat();
        });
        
        // Handle suggestion button clicks
        this.handleSuggestionButtons();
    }
    
    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = (this.messageInput.scrollHeight) + 'px';
    }
    
    handleSuggestionButtons() {
        const suggestionBtns = document.querySelectorAll('.suggestion-btn');
        suggestionBtns.forEach(btn => {
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
                body: JSON.stringify({ message })
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
        const errorClass = isError ? 'bg-red-100 border border-red-300' : '';
        
        messageDiv.innerHTML = `
            <div class="message ${messageClass} p-4 ${errorClass}">
                <p>${this.formatMessage(message)}</p>
                <div class="text-xs text-gray-500 mt-1">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        
        this.messageContainer.appendChild(messageDiv);
        this.scrollToBottom();
        this.saveChatHistory();
    }
    
    addCollegeCards(colleges) {
        const cardsDiv = document.createElement('div');
        cardsDiv.className = 'flex justify-start mb-4';
        
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'max-w-4xl';
        cardsContainer.innerHTML = `
            <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="text-sm font-medium text-gray-700 mb-3">推荐大学</h4>
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
                const website = card.dataset.website;
                if (website) {
                    window.open(website, '_blank');
                }
            });
        });
        
        this.scrollToBottom();
    }
    
    createCollegeCardHTML(college) {
        return `
            <div class="college-card bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow" 
                 data-website="${college.website}">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h5 class="font-medium text-sm text-gray-900 line-clamp-1">${college.name}</h5>
                        <p class="text-xs text-gray-500 mt-1">${college.location}</p>
                        <div class="flex items-center justify-between mt-2">
                            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                #${college.ranking}
                            </span>
                            <span class="text-xs text-gray-600">
                                ${college.acceptanceRate}% 录取率
                            </span>
                        </div>
                    </div>
                </div>
                <p class="text-xs text-gray-600 mt-2 line-clamp-2">${college.description}</p>
                <div class="mt-2 text-xs text-indigo-600 hover:text-indigo-800">
                    点击访问官网 →
                </div>
            </div>
        `;
    }
    
    formatMessage(message) {
        // Basic markdown-like formatting
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
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
        // Keep welcome message and suggestions
        const welcomeContainer = document.querySelector('.welcome-container');
        const suggestionsContainer = document.querySelector('.suggestions');
        
        this.messageContainer.innerHTML = '';
        if (welcomeContainer) this.messageContainer.appendChild(welcomeContainer);
        if (suggestionsContainer) this.messageContainer.appendChild(suggestionsContainer);
        
        this.clear