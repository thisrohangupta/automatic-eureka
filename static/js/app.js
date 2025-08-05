// Main Application Entry Point
class HarnessApp {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.startup());
            } else {
                await this.startup();
            }
        } catch (error) {
            console.error('Failed to initialize application:', error);
        }
    }

    async startup() {
        try {
            console.log('🚀 Starting Harness Clone...');

            // Initialize loading state
            this.showInitialLoading();

            // Check authentication status
            const isAuthenticated = window.auth.checkAuthStatus();

            if (isAuthenticated) {
                // User is already logged in, load the app
                await this.loadApp();
            } else {
                // Show login modal
                this.hideInitialLoading();
            }

            this.isInitialized = true;
            console.log('✅ Harness Clone initialized successfully');

        } catch (error) {
            console.error('❌ Failed to startup application:', error);
            this.handleStartupError(error);
        }
    }

    async loadApp() {
        try {
            // Show the main application
            window.auth.showApp();

            // Load initial dashboard data
            await window.ui.loadViewData('dashboard');

            // Hide loading spinner
            this.hideInitialLoading();

            // Show welcome message for first-time users
            this.showWelcomeMessage();

        } catch (error) {
            console.error('Failed to load app:', error);
            window.auth.showError('Failed to load application data. Please refresh the page.');
            this.hideInitialLoading();
        }
    }

    showInitialLoading() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.style.display = 'flex';
        }
    }

    hideInitialLoading() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    }

    showWelcomeMessage() {
        // Check if this is a first visit
        const hasVisited = localStorage.getItem('hasVisited');
        if (!hasVisited) {
            localStorage.setItem('hasVisited', 'true');
            
            setTimeout(() => {
                window.auth.showNotification(
                    '🎉 Welcome to Harness Clone! Create your first project to get started with CI/CD.',
                    'info'
                );
            }, 1000);
        }
    }

    handleStartupError(error) {
        this.hideInitialLoading();
        
        // Show error message
        const errorContainer = document.createElement('div');
        errorContainer.className = 'startup-error';
        errorContainer.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 32px;
                border-radius: 12px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                text-align: center;
                max-width: 400px;
                z-index: 10000;
            ">
                <div style="color: #dc2626; font-size: 48px; margin-bottom: 16px;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2 style="margin: 0 0 16px 0; color: #1f2937;">Startup Error</h2>
                <p style="color: #6b7280; margin: 0 0 24px 0;">
                    Failed to initialize the application. Please check your connection and try again.
                </p>
                <button onclick="location.reload()" style="
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                ">
                    <i class="fas fa-refresh"></i> Reload Page
                </button>
            </div>
        `;
        
        document.body.appendChild(errorContainer);
    }

    // Utility methods for debugging and development
    getAppInfo() {
        return {
            initialized: this.isInitialized,
            authenticated: window.auth?.isAuthenticated() || false,
            currentUser: window.auth?.getUser() || null,
            currentView: window.ui?.currentView || 'unknown',
            version: '1.0.0'
        };
    }

    // Development helpers
    async createSampleData() {
        if (!window.auth.isAuthenticated()) {
            console.error('Must be authenticated to create sample data');
            return;
        }

        try {
            console.log('Creating sample data...');

            // Create sample project
            const project = await window.api.createProject({
                name: 'Sample E-commerce App',
                description: 'A sample e-commerce application for demonstrating CI/CD pipelines',
                repository_url: 'https://github.com/example/ecommerce-app'
            });

            console.log('Created project:', project);

            // Create sample pipeline
            const pipeline = await window.api.createPipeline(project.id, {
                name: 'Build and Deploy',
                description: 'Complete CI/CD pipeline for the e-commerce application',
                trigger_type: 'webhook',
                yaml_config: window.api.getSamplePipelineYAML()
            });

            console.log('Created pipeline:', pipeline);

            // Execute the pipeline
            const execution = await window.api.executePipeline(pipeline.id);
            console.log('Started execution:', execution);

            window.auth.showSuccess('Sample data created successfully!');
            
            // Refresh current view
            if (window.ui.currentView) {
                await window.ui.loadViewData(window.ui.currentView);
            }

        } catch (error) {
            console.error('Failed to create sample data:', error);
            window.auth.showError(`Failed to create sample data: ${error.message}`);
        }
    }

    // Quick login for demo purposes
    async quickLogin(username = 'admin', password = 'admin123') {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                window.auth.setAuthData(data.token, data.user);
                window.auth.hideLoginModal();
                await this.loadApp();
                window.auth.showSuccess('Logged in successfully!');
            } else {
                window.auth.showError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Quick login failed:', error);
            window.auth.showError('Login failed. Please try again.');
        }
    }

    // Export/Import configuration
    exportConfig() {
        if (!window.auth.isAuthenticated()) {
            window.auth.showError('Must be authenticated to export configuration');
            return;
        }

        const config = {
            user: window.auth.getUser(),
            timestamp: new Date().toISOString(),
            version: this.getAppInfo().version
        };

        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `harness-config-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        window.auth.showSuccess('Configuration exported successfully!');
    }

    // Performance monitoring
    startPerformanceMonitoring() {
        if (typeof PerformanceObserver !== 'undefined') {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    if (entry.entryType === 'navigation') {
                        console.log(`🚀 Page load time: ${entry.loadEventEnd - entry.fetchStart}ms`);
                    } else if (entry.entryType === 'measure') {
                        console.log(`📊 ${entry.name}: ${entry.duration}ms`);
                    }
                });
            });

            observer.observe({ entryTypes: ['navigation', 'measure'] });
        }

        // Track API call performance
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const start = performance.now();
            try {
                const response = await originalFetch.apply(this, args);
                const end = performance.now();
                console.log(`🌐 API call to ${args[0]} took ${end - start}ms`);
                return response;
            } catch (error) {
                const end = performance.now();
                console.log(`❌ API call to ${args[0]} failed after ${end - start}ms`);
                throw error;
            }
        };
    }

    // Keyboard shortcuts
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Ctrl/Cmd + K for global search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('global-search');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Number keys for navigation
            if (e.key >= '1' && e.key <= '6') {
                const views = ['dashboard', 'projects', 'pipelines', 'deployments', 'environments', 'monitoring'];
                const index = parseInt(e.key) - 1;
                if (views[index]) {
                    window.ui.switchView(views[index]);
                }
            }

            // Escape to close modals
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal-overlay.active');
                if (activeModal) {
                    window.ui.closeModal(activeModal);
                }
            }
        });
    }

    // Theme management
    initThemeManagement() {
        // Check for saved theme or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    toggleTheme() {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.auth) {
        window.auth.showError('An unexpected error occurred. Please refresh the page if problems persist.');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.auth) {
        window.auth.showError('A network error occurred. Please check your connection.');
    }
    event.preventDefault();
});

// Initialize the application
const app = new HarnessApp();

// Make app available globally for debugging
window.harnessApp = app;

// Add console welcome message
console.log(`
🚀 Harness Clone CI/CD Platform
Version: 1.0.0

Available commands:
- harnessApp.getAppInfo() - Get application information
- harnessApp.createSampleData() - Create sample projects and pipelines
- harnessApp.quickLogin() - Quick login with admin credentials
- harnessApp.exportConfig() - Export configuration

Keyboard shortcuts:
- Ctrl/Cmd + K - Focus search
- 1-6 - Navigate between views
- Escape - Close modals
`);

// Development helpers (only in development)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Add development toolbar
    document.addEventListener('DOMContentLoaded', () => {
        const devToolbar = document.createElement('div');
        devToolbar.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px;
                border-radius: 8px;
                font-size: 12px;
                z-index: 10000;
                display: none;
            " id="dev-toolbar">
                <div style="margin-bottom: 8px; font-weight: bold;">Dev Tools</div>
                <button onclick="harnessApp.createSampleData()" style="
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    margin-right: 4px;
                    cursor: pointer;
                ">Sample Data</button>
                <button onclick="harnessApp.quickLogin()" style="
                    background: #16a34a;
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    margin-right: 4px;
                    cursor: pointer;
                ">Quick Login</button>
                <button onclick="console.log(harnessApp.getAppInfo())" style="
                    background: #d97706;
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    cursor: pointer;
                ">Info</button>
            </div>
        `;
        document.body.appendChild(devToolbar);

        // Show dev toolbar with Ctrl+Shift+D
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                const toolbar = document.getElementById('dev-toolbar');
                toolbar.style.display = toolbar.style.display === 'none' ? 'block' : 'none';
            }
        });
    });
}