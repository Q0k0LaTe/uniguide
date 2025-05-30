// Task Management System
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentView = 'calendar';
        this.selectedDate = new Date();
        this.currentMonth = new Date();
        this.editingTaskId = null;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadTasks();
        this.renderCurrentView();
    }
    
    initializeElements() {
        // Calendar elements
        this.calendarGrid = document.getElementById('calendar-grid');
        this.currentMonthEl = document.getElementById('current-month');
        this.prevMonthBtn = document.getElementById('prev-month');
        this.nextMonthBtn = document.getElementById('next-month');
        this.todayBtn = document.getElementById('today-btn');
        
        // Timeline elements
        this.timelineContainer = document.getElementById('timeline-container');
        
        // Modal elements
        this.taskModal = document.getElementById('task-modal');
        this.taskForm = document.getElementById('task-form');
        this.modalTitle = document.getElementById('modal-title');
        this.closeModalBtn = document.getElementById('close-modal');
        this.addTaskBtn = document.getElementById('add-task-btn');
        this.deleteTaskBtn = document.getElementById('delete-task');
        this.cancelTaskBtn = document.getElementById('cancel-task');
        
        // Form inputs
        this.taskIdInput = document.getElementById('task-id');
        this.taskTitleInput = document.getElementById('task-title');
        this.taskDateInput = document.getElementById('task-date');
        this.taskCategoryInput = document.getElementById('task-category');
        this.taskPriorityInput = document.getElementById('task-priority');
        this.taskDescriptionInput = document.getElementById('task-description');
        
        // Filter elements
        this.filterSelect = document.getElementById('filter-select');
        this.timelineFilter = document.getElementById('timeline-filter');
        
        // Tab elements
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
    }
    
    initializeEventListeners() {
        // Calendar navigation
        this.prevMonthBtn?.addEventListener('click', () => this.navigateMonth(-1));
        this.nextMonthBtn?.addEventListener('click', () => this.navigateMonth(1));
        this.todayBtn?.addEventListener('click', () => this.goToToday());
        
        // Modal events
        this.addTaskBtn?.addEventListener('click', () => this.openTaskModal());
        this.closeModalBtn?.addEventListener('click', () => this.closeTaskModal());
        this.cancelTaskBtn?.addEventListener('click', () => this.closeTaskModal());
        this.deleteTaskBtn?.addEventListener('click', () => this.deleteTask());
        
        // Form submission
        this.taskForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });
        
        // Filter changes
        this.filterSelect?.addEventListener('change', () => this.renderCurrentView());
        this.timelineFilter?.addEventListener('change', () => this.renderTimeline());
        
        // Tab switching
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        
        // Auto-save functionality
        this.setupAutoSave();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Click outside modal to close
        this.taskModal?.addEventListener('click', (e) => {
            if (e.target === this.taskModal) {
                this.closeTaskModal();
            }
        });
    }
    
    async loadTasks() {
        try {
            const response = await fetch('/api/tasks');
            if (response.ok) {
                this.tasks = await response.json();
            } else {
                // Load sample data if API fails
                this.loadSampleTasks();
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.loadSampleTasks();
        }
        
        this.renderCurrentView();
    }
    
    loadSampleTasks() {
        // Sample tasks for demo purposes
        this.tasks = [
            {
                id: 1,
                title: "Harvard Application Due",
                date: this.formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 1 week from now
                category: "applications",
                priority: "high",
                description: "Complete and submit the Harvard application through Common App.",
                completed: false,
                userId: 1
            },
            {
                id: 2,
                title: "Stanford Essay Draft",
                date: this.formatDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)), // 3 days from now
                category: "essays",
                priority: "medium",
                description: "Complete first draft of Stanford 'What matters to you, and why?' essay.",
                completed: false,
                userId: 1
            },
            {
                id: 3,
                title: "SAT Test Date",
                date: this.formatDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), // 2 weeks from now
                category: "tests",
                priority: "high",
                description: "SAT test at Lincoln High School. Bring ID and admission ticket.",
                completed: false,
                userId: 1
            },
            {
                id: 4,
                title: "MIT Campus Visit",
                date: this.formatDate(new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)), // 3 weeks from now
                category: "visits",
                priority: "medium",
                description: "Campus tour at 10am, information session at 11:30am.",
                completed: false,
                userId: 1
            },
            {
                id: 5,
                title: "Yale Interview Prep",
                date: this.formatDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)), // 10 days from now
                category: "applications",
                priority: "medium",
                description: "Prepare answers for common interview questions.",
                completed: false,
                userId: 1
            }
        ];
    }
    
    renderCurrentView() {
        if (this.currentView === 'calendar') {
            this.renderCalendar();
        } else {
            this.renderTimeline();
        }
    }
    
    renderCalendar() {
        if (!this.calendarGrid) return;
        
        this.calendarGrid.innerHTML = '';
        
        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        
        // Update month display
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        this.currentMonthEl.textContent = `${monthNames[month]} ${year}`;
        
        // Get calendar data
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const totalDays = lastDay.getDate();
        const startingDay = firstDay.getDay(); // 0 = Sunday
        
        // Get days from previous month
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        
        // Get filter value
        const filterValue = this.filterSelect?.value || 'all';
        
        // Create calendar days
        let dayCount = 1;
        let nextMonthDay = 1;
        
        // Create 6 rows to ensure we have enough space for all months
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'calendar-day border border-gray-200 p-1 overflow-hidden bg-white hover:bg-gray-50 min-h-[100px]';
                
                let currentDate;
                
                if (row === 0 && col < startingDay) {
                    // Previous month
                    const prevDay = prevMonthLastDay - (startingDay - col - 1);
                    dayDiv.innerHTML = `<div class="text-xs text-gray-400 p-1">${prevDay}</div>`;
                    dayDiv.classList.add('different-month');
                    currentDate = new Date(year, month - 1, prevDay);
                } else if (dayCount <= totalDays) {
                    // Current month
                    const isToday = this.isDateToday(new Date(year, month, dayCount));
                    if (isToday) {
                        dayDiv.classList.add('today', 'bg-indigo-50', 'border-indigo-200');
                    }
                    
                    dayDiv.innerHTML = `<div class="text-xs font-medium p-1 ${isToday ? 'text-indigo-600' : 'text-gray-700'}">${dayCount}</div>`;
                    
                    currentDate = new Date(year, month, dayCount);
                    dayCount++;
                } else {
                    // Next month
                    dayDiv.innerHTML = `<div class="text-xs text-gray-400 p-1">${nextMonthDay}</div>`;
                    dayDiv.classList.add('different-month');
                    currentDate = new Date(year, month + 1, nextMonthDay);
                    nextMonthDay++;
                }
                
                // Add tasks for this day
                const dayTasks = this.getTasksForDate(currentDate, filterValue);
                const tasksContainer = document.createElement('div');
                tasksContainer.className = 'space-y-1 mt-1';
                
                dayTasks.forEach(task => {
                    const taskEl = this.createTaskElement(task);
                    tasksContainer.appendChild(taskEl);
                });
                
                dayDiv.appendChild(tasksContainer);
                
                // Add event listeners
                this.addDayEventListeners(dayDiv, currentDate);
                
                this.calendarGrid.appendChild(dayDiv);
            }
        }
    }
    
    renderTimeline() {
        if (!this.timelineContainer) return;
        
        this.timelineContainer.innerHTML = '';
        
        // Sort tasks by date
        const sortedTasks = [...this.tasks].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Filter tasks
        const filterValue = this.timelineFilter?.value || 'all';
        const filteredTasks = filterValue === 'all' 
            ? sortedTasks 
            : sortedTasks.filter(task => task.category === filterValue);
        
        // Group tasks by date
        const groupedTasks = {};
        filteredTasks.forEach(task => {
            if (!groupedTasks[task.date]) {
                groupedTasks[task.date] = [];
            }
            groupedTasks[task.date].push(task);
        });
        
        // Create timeline items
        Object.keys(groupedTasks).sort().forEach(date => {
            const dateObj = new Date(date + 'T00:00:00');
            const timelineItem = this.createTimelineItem(date, groupedTasks[date]);
            this.timelineContainer.appendChild(timelineItem);
        });
        
        // If no tasks
        if (Object.keys(groupedTasks).length === 0) {
            this.showEmptyTimeline();
        }
    }
    
    createTimelineItem(date, tasks) {
        const dateObj = new Date(date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
        });
        
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item pl-8 pb-6 relative';
        
        // Add colored dot based on urgency
        const daysUntil = Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24));
        let dotColor = 'bg-green-500';
        if (daysUntil < 0) dotColor = 'bg-gray-400';
        else if (daysUntil <= 3) dotColor = 'bg-red-500';
        else if (daysUntil <= 7) dotColor = 'bg-amber-500';
        
        const dot = document.createElement('div');
        dot.className = `timeline-dot ${dotColor} w-3 h-3 rounded-full absolute left-2 top-2`;
        timelineItem.appendChild(dot);
        
        // Add date header
        const dateHeader = document.createElement('div');
        dateHeader.className = 'mb-3';
        
        const dateText = document.createElement('h3');
        dateText.className = 'font-medium text-gray-800';
        dateText.textContent = formattedDate;
        
        // Add urgency indicator
        const urgencyText = document.createElement('span');
        urgencyText.className = 'text-xs ml-2';
        
        if (daysUntil === 0) {
            urgencyText.textContent = '(Today)';
            urgencyText.className += ' font-medium text-indigo-600';
        } else if (daysUntil < 0) {
            urgencyText.textContent = `(${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} ago)`;
            urgencyText.className += ' text-gray-500';
        } else {
            urgencyText.textContent = `(${daysUntil} day${daysUntil !== 1 ? 's' : ''} from now)`;
            urgencyText.className += ' text-gray-600';
        }
        
        dateText.appendChild(urgencyText);
        dateHeader.appendChild(dateText);
        timelineItem.appendChild(dateHeader);
        
        // Add tasks for this date
        const tasksContainer = document.createElement('div');
        tasksContainer.className = 'space-y-2';
        
        tasks.forEach(task => {
            const taskItem = this.createTimelineTaskItem(task);
            tasksContainer.appendChild(taskItem);
        });
        
        timelineItem.appendChild(tasksContainer);
        
        return timelineItem;
    }
    
    createTimelineTaskItem(task) {
        const taskItem = document.createElement('div');
        taskItem.className = `bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer priority-${task.priority}`;
        
        const priorityClass = this.getPriorityClass(task.priority);
        const categoryColor = this.getCategoryColor(task.category);
        
        taskItem.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h4 class="font-medium text-gray-800 ${task.completed ? 'line-through text-gray-500' : ''}">${task.title}</h4>
                    <div class="flex items-center mt-1">
                        <span class="inline-block w-2 h-2 rounded-full mr-1" style="background-color: ${categoryColor}"></span>
                        <span class="text-xs text-gray-500">${this.getCategoryName(task.category)}</span>
                        <span class="mx-2 text-gray-300">•</span>
                        <span class="text-xs px-2 py-1 rounded-full ${priorityClass}">${this.capitalizeFirst(task.priority)}</span>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="complete-task text-gray-400 hover:text-green-600" data-id="${task.id}">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                    <button class="edit-task text-gray-400 hover:text-indigo-600" data-id="${task.id}">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                </div>
            </div>
            ${task.description ? `<p class="text-sm text-gray-600 mt-2">${task.description}</p>` : ''}
        `;
        
        // Add event listeners
        taskItem.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                this.openTaskModal(task);
            }
        });
        
        taskItem.querySelector('.complete-task').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleTaskComplete(task.id);
        });
        
        taskItem.querySelector('.edit-task').addEventListener('click', (e) => {
            e.stopPropagation();
            this.openTaskModal(task);
        });
        
        return taskItem;
    }
    
    createTaskElement(task) {
        const taskEl = document.createElement('div');
        taskEl.className = `task-item text-xs p-1 rounded-sm truncate priority-${task.priority} cursor-pointer transition-all hover:shadow-sm`;
        taskEl.style.backgroundColor = this.getCategoryColor(task.category);
        taskEl.style.borderLeft = `3px solid ${this.getPriorityColor(task.priority)}`;
        taskEl.textContent = task.title;
        taskEl.setAttribute('data-id', task.id);
        taskEl.draggable = true;
        
        if (task.completed) {
            taskEl.classList.add('opacity-60', 'line-through');
        }
        
        // Event listeners
        taskEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openTaskModal(task);
        });
        
        taskEl.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
            taskEl.classList.add('opacity-50');
        });
        
        taskEl.addEventListener('dragend', () => {
            taskEl.classList.remove('opacity-50');
        });
        
        return taskEl;
    }
    
    addDayEventListeners(dayDiv, date) {
        // Double click to add task
        dayDiv.addEventListener('dblclick', () => {
            this.openTaskModal(null, date);
        });
        
        // Drag and drop functionality
        dayDiv.addEventListener('dragover', (e) => {
            e.preventDefault();
            dayDiv.classList.add('bg-blue-50', 'border-blue-300');
        });
        
        dayDiv.addEventListener('dragleave', () => {
            dayDiv.classList.remove('bg-blue-50', 'border-blue-300');
        });
        
        dayDiv.addEventListener('drop', (e) => {
            e.preventDefault();
            dayDiv.classList.remove('bg-blue-50', 'border-blue-300');
            
            const taskId = e.dataTransfer.getData('text/plain');
            if (taskId) {
                this.updateTaskDate(parseInt(taskId), date);
            }
        });
    }
    
    getTasksForDate(date, filterValue) {
        const dateString = this.formatDate(date);
        
        return this.tasks.filter(task => {
            const matchesDate = task.date === dateString;
            const matchesFilter = filterValue === 'all' || task.category === filterValue;
            
            return matchesDate && matchesFilter;
        });
    }
    
    openTaskModal(task = null, date = null) {
        if (task) {
            // Edit existing task
            this.modalTitle.textContent = 'Edit Task';
            this.taskIdInput.value = task.id;
            this.taskTitleInput.value = task.title;
            this.taskDateInput.value = task.date;
            this.taskCategoryInput.value = task.category;
            this.taskPriorityInput.value = task.priority;
            this.taskDescriptionInput.value = task.description || '';
            this.deleteTaskBtn.classList.remove('hidden');
            this.editingTaskId = task.id;
        } else {
            // Add new task
            this.modalTitle.textContent = 'Add New Task';
            this.taskForm.reset();
            if (date) {
                this.taskDateInput.value = this.formatDate(date);
            } else {
                this.taskDateInput.value = this.formatDate(new Date());
            }
            this.deleteTaskBtn.classList.add('hidden');
            this.editingTaskId = null;
        }
        
        this.taskModal.classList.remove('hidden');
        this.taskTitleInput.focus();
    }
    
    closeTaskModal() {
        this.taskModal.classList.add('hidden');
        this.editingTaskId = null;
    }
    
    async saveTask() {
        const title = this.taskTitleInput.value.trim();
        const date = this.taskDateInput.value;
        const category = this.taskCategoryInput.value;
        const priority = this.taskPriorityInput.value;
        const description = this.taskDescriptionInput.value.trim();
        
        if (!title || !date) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        const taskData = {
            title,
            date,
            category,
            priority,
            description,
            completed: false
        };
        
        try {
            let response;
            if (this.editingTaskId) {
                // Update existing task
                response = await fetch(`/api/tasks/${this.editingTaskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData)
                });
                
                if (response.ok) {
                    const updatedTask = await response.json();
                    const taskIndex = this.tasks.findIndex(t => t.id === this.editingTaskId);
                    if (taskIndex !== -1) {
                        this.tasks[taskIndex] = updatedTask;
                    }
                }
            } else {
                // Create new task
                response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(taskData)
                });
                
                if (response.ok) {
                    const newTask = await response.json();
                    this.tasks.push(newTask);
                } else {
                    // Fallback for demo
                    const newTask = {
                        id: Date.now(),
                        ...taskData,
                        userId: 1,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    this.tasks.push(newTask);
                }
            }
            
            this.closeTaskModal();
            this.renderCurrentView();
            this.showNotification('Task saved successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving task:', error);
            this.showNotification('Failed to save task', 'error');
        }
    }
    
    async deleteTask() {
        if (!this.editingTaskId) return;
        
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/tasks/${this.editingTaskId}`, {
                method: 'DELETE'
            });
            
            if (response.ok || response.status === 404) {
                this.tasks = this.tasks.filter(task => task.id !== this.editingTaskId);
                this.closeTaskModal();
                this.renderCurrentView();
                this.showNotification('Task deleted successfully!', 'success');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            // Fallback for demo
            this.tasks = this.tasks.filter(task => task.id !== this.editingTaskId);
            this.closeTaskModal();
            this.renderCurrentView();
            this.showNotification('Task deleted successfully!', 'success');
        }
    }
    
    async toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        task.completed = !task.completed;
        
        try {
            await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(task)
            });
        } catch (error) {
            console.error('Error updating task:', error);
        }
        
        this.renderCurrentView();
        this.showNotification(
            task.completed ? 'Task completed!' : 'Task marked as incomplete',
            'success'
        );
    }
    
    updateTaskDate(taskId, newDate) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        task.date = this.formatDate(newDate);
        
        // Update on server
        fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        }).catch(error => {
            console.error('Error updating task:', error);
        });
        
        this.renderCurrentView();
        this.showNotification('Task date updated!', 'success');
    }
    
    navigateMonth(direction) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + direction);
        this.renderCalendar();
    }
    
    goToToday() {
        this.currentMonth = new Date();
        this.selectedDate = new Date();
        this.renderCalendar();
    }
    
    switchTab(tabName) {
        this.currentView = tabName;
        
        // Update tab buttons
        this.tabBtns.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('tab-active', 'text-indigo-600', 'border-indigo-600');
                btn.classList.remove('text-gray-500', 'border-transparent');
            } else {
                btn.classList.remove('tab-active', 'text-indigo-600', 'border-indigo-600');
                btn.classList.add('text-gray-500', 'border-transparent');
            }
        });
        
        // Show selected content
        this.tabContents.forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${tabName}-tab`).classList.remove('hidden');
        
        this.renderCurrentView();
    }
    
    setupAutoSave() {
        // Auto-save tasks every 30 seconds
        setInterval(() => {
            // Save current state to localStorage as backup
            localStorage.setItem('uniguide-tasks-backup', JSON.stringify(this.tasks));
        }, 30000);
        
        // Load backup on page load if available
        const backup = localStorage.getItem('uniguide-tasks-backup');
        if (backup && this.tasks.length === 0) {
            try {
                this.tasks = JSON.parse(backup);
            } catch (error) {
                console.error('Error loading backup tasks:', error);
            }
        }
    }
    
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + N to add new task
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.openTaskModal();
        }
        
        // Escape to close modal
        if (e.key === 'Escape' && !this.taskModal.classList.contains('hidden')) {
            this.closeTaskModal();
        }
        
        // Ctrl/Cmd + T to go to today
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            this.goToToday();
        }
    }
    
    showEmptyTimeline() {
        this.timelineContainer.innerHTML = `
            <div class="text-center py-12">
                <svg class="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p class="text-gray-500 mb-4">Create your first task to get started with your college application timeline.</p>
                <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg" onclick="window.taskManager.openTaskModal()">
                    Add Your First Task
                </button>
            </div>
        `;
    }
    
    // Utility functions
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    isDateToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }
    
    getCategoryColor(category) {
        const colors = {
            essays: '#dbeafe',
            applications: '#e0e7ff',
            tests: '#fef3c7',
            visits: '#d1fae5',
            other: '#f3f4f6'
        };
        return colors[category] || colors.other;
    }
    
    getCategoryName(category) {
        const names = {
            essays: 'Essay',
            applications: 'Application',
            tests: 'Test',
            visits: 'Campus Visit',
            other: 'Other'
        };
        return names[category] || 'Task';
    }
    
    getPriorityColor(priority) {
        const colors = {
            high: '#ef4444',
            medium: '#f59e0b',
            low: '#10b981'
        };
        return colors[priority] || colors.medium;
    }
    
    getPriorityClass(priority) {
        const classes = {
            high: 'bg-red-100 text-red-800',
            medium: 'bg-amber-100 text-amber-800',
            low: 'bg-green-100 text-green-800'
        };
        return classes[priority] || classes.medium;
    }
    
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 translate-x-full`;
        
        const colors = {
            success: 'bg-green-100 border border-green-400 text-green-700',
            error: 'bg-red-100 border border-red-400 text-red-700',
            info: 'bg-blue-100 border border-blue-400 text-blue-700'
        };
        
        notification.className += ` ${colors[type] || colors.info}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <span>${message}</span>
                <button class="ml-4 text-current" onclick="this.parentElement.parentElement.remove()">
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('calendar-grid') || document.getElementById('timeline-container')) {
        window.taskManager = new TaskManager();
    }
});