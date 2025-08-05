// Authentication Module
class Auth {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.baseUrl = '';
        
        this.initEventListeners();
    }

    initEventListeners() {
        // Auth tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tab}-form`).classList.add('active');
    }

    async handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const submitBtn = document.querySelector('#login-form button[type="submit"]');

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                this.setAuthData(data.token, data.user);
                this.hideLoginModal();
                this.showApp();
                this.showSuccess('Welcome back! You have been successfully logged in.');
            } else {
                this.showError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('An error occurred during login. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    }

    async handleRegister() {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const submitBtn = document.querySelector('#register-form button[type="submit"]');

        // Basic validation
        if (username.length < 3) {
            this.showError('Username must be at least 3 characters long');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                this.setAuthData(data.token, data.user);
                this.hideLoginModal();
                this.showApp();
                this.showSuccess('Account created successfully! Welcome to Harness Clone.');
            } else {
                this.showError(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('An error occurred during registration. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Sign Up';
        }
    }

    setAuthData(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update UI
        this.updateUserDisplay();
    }

    updateUserDisplay() {
        const userNameEl = document.getElementById('user-name');
        if (userNameEl && this.user) {
            userNameEl.textContent = this.user.username;
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        this.hideApp();
        this.showLoginModal();
        this.showSuccess('You have been successfully logged out.');
    }

    showLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showApp() {
        const app = document.getElementById('app');
        if (app) {
            app.style.display = 'grid';
        }
        this.updateUserDisplay();
    }

    hideApp() {
        const app = document.getElementById('app');
        if (app) {
            app.style.display = 'none';
        }
    }

    isAuthenticated() {
        return !!this.token;
    }

    getToken() {
        return this.token;
    }

    getUser() {
        return this.user;
    }

    getAuthHeaders() {
        if (!this.token) {
            throw new Error('No authentication token available');
        }
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
        };
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification alert alert-${type === 'error' ? 'error' : type === 'success' ? 'success' : 'info'}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
            <button class="notification-close" style="margin-left: auto; background: none; border: none; font-size: 16px; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.hideNotification(notification);
        });

        // Auto hide after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                this.hideNotification(notification);
            }
        }, 5000);
    }

    hideNotification(notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }

    checkAuthStatus() {
        if (this.isAuthenticated()) {
            this.hideLoginModal();
            this.showApp();
            return true;
        } else {
            this.hideApp();
            this.showLoginModal();
            return false;
        }
    }

    // Handle token expiration
    handleTokenExpiration() {
        this.showError('Your session has expired. Please log in again.');
        this.logout();
    }

    // Make authenticated API calls
    async apiCall(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.getAuthHeaders(),
                    ...options.headers,
                },
            });

            if (response.status === 401) {
                this.handleTokenExpiration();
                throw new Error('Authentication required');
            }

            return response;
        } catch (error) {
            if (error.message === 'Authentication required') {
                throw error;
            }
            console.error('API call error:', error);
            throw error;
        }
    }
}

// Create global auth instance
window.auth = new Auth();