// API Module for handling all backend communications
class API {
    constructor() {
        this.baseUrl = '';
    }

    // Generic API call method
    async call(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        try {
            let response;
            if (options.requireAuth !== false && window.auth && window.auth.isAuthenticated()) {
                response = await window.auth.apiCall(url, options);
            } else {
                response = await fetch(url, options);
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            // Return empty object for 204 No Content
            if (response.status === 204) {
                return {};
            }

            return await response.json();
        } catch (error) {
            console.error(`API call failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // Projects API
    async getProjects() {
        return this.call('/api/projects');
    }

    async createProject(projectData) {
        return this.call('/api/projects', {
            method: 'POST',
            body: JSON.stringify(projectData),
        });
    }

    async updateProject(projectId, projectData) {
        return this.call(`/api/projects/${projectId}`, {
            method: 'PUT',
            body: JSON.stringify(projectData),
        });
    }

    async deleteProject(projectId) {
        return this.call(`/api/projects/${projectId}`, {
            method: 'DELETE',
        });
    }

    // Pipelines API
    async getPipelines(projectId) {
        return this.call(`/api/projects/${projectId}/pipelines`);
    }

    async getAllPipelines() {
        // This would need to be implemented on the backend
        // For now, we'll get projects and their pipelines
        const projects = await this.getProjects();
        const allPipelines = [];
        
        for (const project of projects) {
            try {
                const pipelines = await this.getPipelines(project.id);
                pipelines.forEach(pipeline => {
                    pipeline.project = project;
                    allPipelines.push(pipeline);
                });
            } catch (error) {
                console.error(`Failed to get pipelines for project ${project.id}:`, error);
            }
        }
        
        return allPipelines;
    }

    async createPipeline(projectId, pipelineData) {
        return this.call(`/api/projects/${projectId}/pipelines`, {
            method: 'POST',
            body: JSON.stringify(pipelineData),
        });
    }

    async updatePipeline(pipelineId, pipelineData) {
        return this.call(`/api/pipelines/${pipelineId}`, {
            method: 'PUT',
            body: JSON.stringify(pipelineData),
        });
    }

    async deletePipeline(pipelineId) {
        return this.call(`/api/pipelines/${pipelineId}`, {
            method: 'DELETE',
        });
    }

    // Pipeline Execution API
    async executePipeline(pipelineId, executionData = {}) {
        return this.call(`/api/pipelines/${pipelineId}/execute`, {
            method: 'POST',
            body: JSON.stringify(executionData),
        });
    }

    async getExecution(executionId) {
        return this.call(`/api/executions/${executionId}`);
    }

    async getExecutions(pipelineId) {
        return this.call(`/api/pipelines/${pipelineId}/executions`);
    }

    async cancelExecution(executionId) {
        return this.call(`/api/executions/${executionId}/cancel`, {
            method: 'POST',
        });
    }

    // Environments API
    async getEnvironments(projectId) {
        return this.call(`/api/projects/${projectId}/environments`);
    }

    async createEnvironment(projectId, environmentData) {
        return this.call(`/api/projects/${projectId}/environments`, {
            method: 'POST',
            body: JSON.stringify(environmentData),
        });
    }

    async updateEnvironment(environmentId, environmentData) {
        return this.call(`/api/environments/${environmentId}`, {
            method: 'PUT',
            body: JSON.stringify(environmentData),
        });
    }

    async deleteEnvironment(environmentId) {
        return this.call(`/api/environments/${environmentId}`, {
            method: 'DELETE',
        });
    }

    // Dashboard/Stats API
    async getDashboardStats() {
        try {
            const [projects, pipelines] = await Promise.all([
                this.getProjects(),
                this.getAllPipelines()
            ]);

            // Calculate stats
            const stats = {
                totalProjects: projects.length,
                totalPipelines: pipelines.length,
                successfulDeployments: 0,
                failedDeployments: 0,
                recentExecutions: []
            };

            // Count successful/failed deployments from pipeline last executions
            pipelines.forEach(pipeline => {
                if (pipeline.last_execution) {
                    if (pipeline.last_execution.status === 'success') {
                        stats.successfulDeployments++;
                    } else if (pipeline.last_execution.status === 'failed') {
                        stats.failedDeployments++;
                    }
                }
            });

            return stats;
        } catch (error) {
            console.error('Failed to get dashboard stats:', error);
            return {
                totalProjects: 0,
                totalPipelines: 0,
                successfulDeployments: 0,
                failedDeployments: 0,
                recentExecutions: []
            };
        }
    }

    async getRecentExecutions(limit = 10) {
        try {
            const pipelines = await this.getAllPipelines();
            const executions = [];

            // Get recent executions from all pipelines
            for (const pipeline of pipelines) {
                if (pipeline.last_execution) {
                    executions.push({
                        ...pipeline.last_execution,
                        pipeline: pipeline,
                        project: pipeline.project
                    });
                }
            }

            // Sort by started_at descending and limit
            return executions
                .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
                .slice(0, limit);
        } catch (error) {
            console.error('Failed to get recent executions:', error);
            return [];
        }
    }

    // Utility methods
    formatDate(dateString) {
        if (!dateString) return 'Never';
        
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        // Less than 1 minute
        if (diff < 60000) {
            return 'Just now';
        }
        
        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
        }
        
        // Less than 1 day
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        }
        
        // Less than 1 week
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days} day${days === 1 ? '' : 's'} ago`;
        }
        
        // Format as date
        return date.toLocaleDateString();
    }

    formatDuration(startTime, endTime) {
        if (!startTime) return '';
        
        const start = new Date(startTime);
        const end = endTime ? new Date(endTime) : new Date();
        const diff = end - start;
        
        if (diff < 1000) {
            return '< 1s';
        }
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    getStatusIcon(status) {
        const icons = {
            pending: 'clock',
            running: 'spinner fa-spin',
            success: 'check-circle',
            failed: 'times-circle',
            cancelled: 'ban'
        };
        return icons[status] || 'question-circle';
    }

    getStatusColor(status) {
        const colors = {
            pending: '#64748b',
            running: '#d97706',
            success: '#16a34a',
            failed: '#dc2626',
            cancelled: '#6b7280'
        };
        return colors[status] || '#64748b';
    }

    // Sample YAML configurations
    getSamplePipelineYAML() {
        return `stages:
  - name: "Build"
    type: "build"
    steps:
      - name: "Checkout Code"
        action: "git-clone"
      - name: "Install Dependencies"
        action: "shell"
        command: "npm install"
      - name: "Build Application"
        action: "shell"
        command: "npm run build"
        
  - name: "Test"
    type: "test"
    steps:
      - name: "Unit Tests"
        action: "shell"
        command: "npm test"
      - name: "Integration Tests"
        action: "shell"
        command: "npm run test:integration"
        
  - name: "Deploy"
    type: "deploy"
    steps:
      - name: "Deploy to Environment"
        action: "deploy"
        target: "{{environment}}"
      - name: "Health Check"
        action: "shell"
        command: "curl -f {{deploy_url}}/health"

environment_variables:
  NODE_ENV: "production"
  API_URL: "https://api.example.com"
  
triggers:
  - type: "webhook"
    branch: "main"
  - type: "schedule"
    cron: "0 2 * * *"`;
    }
}

// Create global API instance
window.api = new API();