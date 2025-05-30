// Wizard Form Management
class WizardManager {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.formData = {};
        
        this.stepIndicators = [];
        this.stepLines = [];
        this.formPanels = [];
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadSavedData();
        this.updateUI();
    }
    
    initializeElements() {
        // Get step indicators and panels
        for (let i = 1; i <= this.totalSteps; i++) {
            this.stepIndicators.push(document.getElementById(`step-indicator-${i}`));
            if (i < this.totalSteps) {
                this.stepLines.push(document.getElementById(`step-line-${i}`));
            }
            this.formPanels.push(document.getElementById(`step-${i}`));
        }
        
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.submitBtn = document.getElementById('submit-btn');
    }
    
    initializeEventListeners() {
        // Navigation buttons
        this.nextBtn?.addEventListener('click', () => this.nextStep());
        this.prevBtn?.addEventListener('click', () => this.prevStep());
        this.submitBtn?.addEventListener('click', (e) => this.submitForm(e));
        
        // Dynamic form additions
        this.setupDynamicForms();
        
        // Auto-save functionality
        this.setupAutoSave();
    }
    
    setupDynamicForms() {
        // Add internship button
        const addInternshipBtn = document.getElementById('add-internship');
        if (addInternshipBtn) {
            addInternshipBtn.addEventListener('click', () => this.addInternshipField());
        }
        
        // Add activity button
        const addActivityBtn = document.getElementById('add-activity');
        if (addActivityBtn) {
            addActivityBtn.addEventListener('click', () => this.addActivityField());
        }
        
        // Add volunteer button
        const addVolunteerBtn = document.getElementById('add-volunteer');
        if (addVolunteerBtn) {
            addVolunteerBtn.addEventListener('click', () => this.addVolunteerField());
        }
    }
    
    setupAutoSave() {
        // Save form data every 30 seconds
        setInterval(() => {
            this.saveCurrentStepData();
        }, 30000);
        
        // Save on form field changes
        document.addEventListener('change', (e) => {
            if (e.target.closest('.form-panel')) {
                this.saveCurrentStepData();
            }
        });
    }
    
    nextStep() {
        if (this.validateCurrentStep() && this.currentStep < this.totalSteps) {
            this.saveCurrentStepData();
            this.currentStep++;
            this.updateUI();
        }
    }
    
    prevStep() {
        if (this.currentStep > 1) {
            this.saveCurrentStepData();
            this.currentStep--;
            this.updateUI();
        }
    }
    
    updateUI() {
        this.updateStepIndicators();
        this.showCurrentStep();
        this.updateButtons();
    }
    
    updateStepIndicators() {
        for (let i = 0; i < this.totalSteps; i++) {
            const indicator = this.stepIndicators[i];
            const line = i < this.totalSteps - 1 ? this.stepLines[i] : null;
            
            // Remove all classes first
            indicator.classList.remove('step-active', 'step-completed', 'step-inactive');
            
            if (i + 1 < this.currentStep) {
                // Completed step
                indicator.classList.add('step-completed');
                if (line) {
                    line.classList.add('step-line-active');
                    line.classList.remove('step-line-inactive');
                }
            } else if (i + 1 === this.currentStep) {
                // Current active step
                indicator.classList.add('step-active');
            } else {
                // Future inactive step
                indicator.classList.add('step-inactive');
                if (line) {
                    line.classList.add('step-line-inactive');
                    line.classList.remove('step-line-active');
                }
            }
        }
    }
    
    showCurrentStep() {
        this.formPanels.forEach((panel, index) => {
            if (index + 1 === this.currentStep) {
                panel.classList.remove('hidden');
                panel.classList.add('animate-fade-in');
            } else {
                panel.classList.add('hidden');
                panel.classList.remove('animate-fade-in');
            }
        });
    }
    
    updateButtons() {
        // Previous button
        if (this.currentStep === 1) {
            this.prevBtn?.classList.add('hidden');
        } else {
            this.prevBtn?.classList.remove('hidden');
        }
        
        // Next/Submit buttons
        if (this.currentStep === this.totalSteps) {
            this.nextBtn?.classList.add('hidden');
            this.submitBtn?.classList.remove('hidden');
        } else {
            this.nextBtn?.classList.remove('hidden');
            this.submitBtn?.classList.add('hidden');
        }
    }
    
    validateCurrentStep() {
        const currentPanel = this.formPanels[this.currentStep - 1];
        const requiredFields = currentPanel.querySelectorAll('[required]');
        
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                this.highlightField(field, false);
                isValid = false;
            } else {
                this.highlightField(field, true);
            }
        });
        
        // Additional validation for specific steps
        if (this.currentStep === 1) {
            isValid = this.validateStep1() && isValid;
        } else if (this.currentStep === 5) {
            isValid = this.validateStep5() && isValid;
        }
        
        if (!isValid) {
            this.showValidationError('请填写所有必填字段');
        }
        
        return isValid;
    }
    
    validateStep1() {
        // Validate email format
        const email = document.getElementById('email')?.value;
        if (email && !this.isValidEmail(email)) {
            this.showValidationError('请输入有效的邮箱地址');
            return false;
        }
        
        // Validate phone format
        const phone = document.getElementById('phone')?.value;
        if (phone && !this.isValidPhone(phone)) {
            this.showValidationError('请输入有效的手机号码');
            return false;
        }
        
        return true;
    }
    
    validateStep5() {
        // Check if at least one target country is selected
        const countries = document.querySelectorAll('input[name="target-countries"]:checked');
        if (countries.length === 0) {
            this.showValidationError('请至少选择一个目标国家/地区');
            return false;
        }
        
        return true;
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    isValidPhone(phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    }
    
    highlightField(field, isValid) {
        if (isValid) {
            field.classList.remove('border-red-500');
            field.classList.add('border-green-500');
        } else {
            field.classList.remove('border-green-500');
            field.classList.add('border-red-500');
        }
    }
    
    showValidationError(message) {
        // Remove existing error
        const existingError = document.querySelector('.validation-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Create new error message
        const error = document.createElement('div');
        error.className = 'validation-error fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50';
        error.innerHTML = `
            <div class="flex items-center">
                <svg class="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                <span>${message}</span>
                <button class="ml-4" onclick="this.parentElement.parentElement.remove()">
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(error);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (error.parentElement) {
                error.remove();
            }
        }, 5000);
    }
    
    saveCurrentStepData() {
        const currentPanel = this.formPanels[this.currentStep - 1];
        const formElements = currentPanel.querySelectorAll('input, select, textarea');
        
        formElements.forEach(element => {
            if (element.type === 'checkbox') {
                if (!this.formData.targetCountries) {
                    this.formData.targetCountries = [];
                }
                if (element.checked) {
                    if (!this.formData.targetCountries.includes(element.value)) {
                        this.formData.targetCountries.push(element.value);
                    }
                } else {
                    const index = this.formData.targetCountries.indexOf(element.value);
                    if (index > -1) {
                        this.formData.targetCountries.splice(index, 1);
                    }
                }
            } else {
                this.formData[element.name || element.id] = element.value;
            }
        });
        
        // Save to localStorage
        localStorage.setItem('uniguide-wizard-data', JSON.stringify(this.formData));
    }
    
    loadSavedData() {
        const savedData = localStorage.getItem('uniguide-wizard-data');
        if (savedData) {
            try {
                this.formData = JSON.parse(savedData);
                this.populateForm();
            } catch (error) {
                console.error('Error loading saved data:', error);
            }
        }
    }
    
    populateForm() {
        Object.keys(this.formData).forEach(key => {
            const element = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
            
            if (element) {
                if (element.type === 'checkbox') {
                    if (key === 'targetCountries' && Array.isArray(this.formData[key])) {
                        const checkboxes = document.querySelectorAll('input[name="target-countries"]');
                        checkboxes.forEach(checkbox => {
                            checkbox.checked = this.formData[key].includes(checkbox.value);
                        });
                    } else {
                        element.checked = this.formData[key];
                    }
                } else {
                    element.value = this.formData[key];
                }
            }
        });
    }
    
    async submitForm(e) {
        e.preventDefault();
        
        if (!this.validateCurrentStep()) {
            return;
        }
        
        this.saveCurrentStepData();
        
        try {
            this.showSubmitLoading(true);
            
            const response = await fetch('/api/user/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.formData)
            });
            
            if (response.ok) {
                this.showSuccess('信息提交成功！正在跳转到仪表板...');
                
                // Clear saved data
                localStorage.removeItem('uniguide-wizard-data');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 2000);
            } else {
                const error = await response.json();
                this.showValidationError(error.message || '提交失败，请重试');
            }
        } catch (error) {
            console.error('Submit error:', error);
            this.showValidationError('网络错误，请检查连接后重试');
        } finally {
            this.showSubmitLoading(false);
        }
    }
    
    showSubmitLoading(show) {
        if (show) {
            this.submitBtn.disabled = true;
            this.submitBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                提交中...
            `;
        } else {
            this.submitBtn.disabled = false;
            this.submitBtn.innerHTML = `
                提交
                <svg class="-mr-1 ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
            `;
        }
    }
    
    showSuccess(message) {
        const success = document.createElement('div');
        success.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50';
        success.innerHTML = `
            <div class="flex items-center">
                <svg class="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(success);
        
        setTimeout(() => {
            if (success.parentElement) {
                success.remove();
            }
        }, 5000);
    }
    
    // Dynamic form field management
    addInternshipField() {
        const container = document.getElementById('internship-container');
        const count = container.children.length + 1;
        
        const newField = document.createElement('div');
        newField.className = 'internship-item border-b border-gray-200 pb-4 mb-4';
        newField.innerHTML = this.createInternshipFieldHTML(count);
        
        container.appendChild(newField);
        
        // Add remove functionality
        newField.querySelector('.remove-internship').addEventListener('click', () => {
            container.removeChild(newField);
        });
    }
    
    addActivityField() {
        const container = document.getElementById('activity-container');
        const count = container.children.length + 1;
        
        const newField = document.createElement('div');
        newField.className = 'activity-item border-b border-gray-200 pb-4 mb-4';
        newField.innerHTML = this.createActivityFieldHTML(count);
        
        container.appendChild(newField);
        
        // Add remove functionality
        newField.querySelector('.remove-activity').addEventListener('click', () => {
            container.removeChild(newField);
        });
    }
    
    addVolunteerField() {
        const container = document.getElementById('volunteer-container');
        const count = container.children.length + 1;
        
        const newField = document.createElement('div');
        newField.className = 'volunteer-item border-b border-gray-200 pb-4 mb-4';
        newField.innerHTML = this.createVolunteerFieldHTML(count);
        
        container.appendChild(newField);
        
        // Add remove functionality
        newField.querySelector('.remove-volunteer').addEventListener('click', () => {
            container.removeChild(newField);
        });
    }
    
    createInternshipFieldHTML(count) {
        return `
            <div class="flex justify-between items-center mb-2">
                <h5 class="text-sm font-medium text-gray-700">实习经历 #${count}</h5>
                <button type="button" class="remove-internship text-sm text-red-600 hover:text-red-800">
                    删除
                </button>
            </div>
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <label for="internship-company-${count}" class="block text-sm font-medium text-gray-700">公司/组织名称</label>
                    <input type="text" name="internship-company-${count}" id="internship-company-${count}" class="form-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="请输入公司或组织名称">
                </div>
                <div>
                    <label for="internship-position-${count}" class="block text-sm font-medium text-gray-700">职位</label>
                    <input type="text" name="internship-position-${count}" id="internship-position-${count}" class="form-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="请输入您的职位">
                </div>
                <div>
                    <label for="internship-start-${count}" class="block text-sm font-medium text-gray-700">开始日期</label>
                    <input type="date" name="internship-start-${count}" id="internship-start-${count}" class="form-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
                <div>
                    <label for="internship-end-${count}" class="block text-sm font-medium text-gray-700">结束日期</label>
                    <input type="date" name="internship-end-${count}" id="internship-end-${count}" class="form-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
                <div class="sm:col-span-2">
                    <label for="internship-description-${count}" class="block text-sm font-medium text-gray-700">职责描述</label>
                    <textarea id="internship-description-${count}" name="internship-description-${count}" rows="3" class="form-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="请简述您的主要职责和成就"></textarea>
                </div>
            </div>
        `;
    }
    
    createActivityFieldHTML(count) {
        return `
            <div class="flex justify-between items-center mb-2">
                <h5 class="text-sm font-medium text-gray-700">课外活动 #${count}</h5>
                <button type="button" class="remove-activity text-sm text-red-600 hover:text-red-800">
                    删除
                </button>
            </div>
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <label for="activity-name-${count}" class="block text-sm font-medium text-gray-700">活动名称</label>
                    <input type="text" name="activity-name-${count}" id="activity-name-${count}" class="form-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="请输入活动名称">
                </div>
                <div>
                    <label for="activity-role-${count}" class="block text-sm font-medium text-gray-700">角色</label>
                    <input type="text" name="activity-role-${count}" id="activity-role-${count}" class="form-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="请输入您在活动中的角色">
                </div>
                <div>
                    <label for="activity-start-${count}" class="block text-sm font-medium text-gray-700">开始日期</label>
                    <input type="date" name="activity-start-${count}" id="activity-start-${count}" class="form-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
                <div>
                    <label for="activity-end-${count}" class="block text-sm font-medium text-gray-700">结束日期</label>
                    <input type="date" name="activity-end-${count}" id="activity-end-${count}" class="form-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
                <div class="sm:col-span-2">
                    <label for="activity-description-${count}" class="block text-sm font-medium text-gray-700">活动描述</label>
                    <textarea id="activity-description-${count}" name="activity-description-${count}" rows="3" class="form-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="请简述活动内容和您的贡献"></textarea>
                </div>
            </div>
        `;
    }
    
    createVolunteerFieldHTML(count) {
        return `
            <div class="flex justify-between items-center mb-2">
                <h5 class="text-sm font-medium text-gray-700">志愿服务 #${count}</h5>
                <button type="button" class="remove-volunteer text-sm text-red-600 hover:text-red-800">
                    删除
                </button>
            </div>
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <label for="volunteer-org-${count}" class="block text-sm font-medium text-gray-700">组织名称</label>
                    <input type="text" name="volunteer-org-${count}" id="volunteer-org-${count}" class="form-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="请输入组织名称">
                </div>
                <div>
                    <label for="volunteer-role-${count}" class="block text-sm font-medium text-gray-700">角色</label>
                    <input type="text" name="volunteer-role-${count}" id="volunteer-role-${count}" class="form-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="请输入您的角色">
                </div>
                <div>
                    <label for="volunteer-start-${count}" class="block text-sm font-medium text-gray-700">开始日期</label>
                    <input type="date" name="volunteer-start-${count}" id="volunteer-start-${count}" class="form-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
                <div>
                    <label for="volunteer-end-${count}" class="block text-sm font-medium text-gray-700">结束日期</label>
                    <input type="date" name="volunteer-end-${count}" id="volunteer-end-${count}" class="form-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                </div>
                <div class="sm:col-span-2">
                    <label for="volunteer-description-${count}" class="block text-sm font-medium text-gray-700">服务描述</label>
                    <textarea id="volunteer-description-${count}" name="volunteer-description-${count}" rows="3" class="form-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="请简述服务内容和您的贡献"></textarea>
                </div>
            </div>
        `;
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    new WizardManager();
});