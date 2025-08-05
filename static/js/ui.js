// UI Module for handling interface interactions
class UI {
    constructor() {
        this.currentView = 'dashboard';
        this.currentProject = null;
        this.socket = null;
        
        this.initEventListeners();
        this.initSocketConnection();
    }

    initEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link[data-view]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView(e.target.dataset.view);
            });
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeModal(e.target.closest('.modal-overlay'));
            });
        });

        // Modal overlay clicks
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeModal(overlay);
                }
            });
        });

        // Create project button
        const createProjectBtn = document.getElementById('create-project-btn');
        if (createProjectBtn) {
            createProjectBtn.addEventListener('click', () => {
                this.showCreateProjectModal();
            });
        }

        // Create project form
        const createProjectForm = document.getElementById('create-project-form');
        if (createProjectForm) {
            createProjectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateProject();
            });
        }

        // Create pipeline button
        const createPipelineBtn = document.getElementById('create-pipeline-btn');
        if (createPipelineBtn) {
            createPipelineBtn.addEventListener('click', () => {
                this.showCreatePipelineModal();
            });
        }

        // Create pipeline form
        const createPipelineForm = document.getElementById('create-pipeline-form');
        if (createPipelineForm) {
            createPipelineForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreatePipeline();
            });
        }

        // Global search
        const globalSearch = document.getElementById('global-search');
        if (globalSearch) {
            globalSearch.addEventListener('input', (e) => {
                this.handleGlobalSearch(e.target.value);
            });
        }

        // Project filter
        const projectFilter = document.getElementById('project-filter');
        if (projectFilter) {
            projectFilter.addEventListener('change', (e) => {
                this.handleProjectFilter(e.target.value);
            });
        }
    }

    initSocketConnection() {
        if (typeof io !== 'undefined') {
            this.socket = io();
            
            this.socket.on('execution_update', (data) => {
                this.handleExecutionUpdate(data);
            });

            this.socket.on('stage_update', (data) => {
                this.handleStageUpdate(data);
            });
        }
    }

    // View Management
    switchView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}-view`).classList.add('active');

        this.currentView = viewName;

        // Load view data
        this.loadViewData(viewName);
    }

    async loadViewData(viewName) {
        try {
            this.showLoading();

            switch (viewName) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'projects':
                    await this.loadProjects();
                    break;
                case 'pipelines':
                    await this.loadPipelines();
                    break;
                case 'deployments':
                    await this.loadDeployments();
                    break;
                case 'environments':
                    await this.loadEnvironments();
                    break;
                case 'monitoring':
                    await this.loadMonitoring();
                    break;
            }
        } catch (error) {
            console.error(`Failed to load ${viewName} data:`, error);
            window.auth.showError(`Failed to load ${viewName} data: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    // Dashboard
    async loadDashboard() {
        const [stats, recentExecutions] = await Promise.all([
            window.api.getDashboardStats(),
            window.api.getRecentExecutions(5)
        ]);

        this.updateDashboardStats(stats);
        this.updateRecentExecutions(recentExecutions);
    }

    updateDashboardStats(stats) {
        document.getElementById('total-projects').textContent = stats.totalProjects;
        document.getElementById('total-pipelines').textContent = stats.totalPipelines;
        document.getElementById('successful-deployments').textContent = stats.successfulDeployments;
        document.getElementById('failed-deployments').textContent = stats.failedDeployments;
    }

    updateRecentExecutions(executions) {
        const container = document.getElementById('recent-executions');
        
        if (executions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-play-circle"></i>
                    <p>No recent executions</p>
                </div>
            `;
            return;
        }

        container.innerHTML = executions.map(execution => `
            <div class="execution-item" data-execution-id="${execution.id}">
                <div class="execution-info">
                    <div class="execution-header">
                        <h4>${execution.pipeline.name}</h4>
                        <span class="execution-status ${execution.status}">${execution.status}</span>
                    </div>
                    <p>${execution.project.name}</p>
                    <small>${window.api.formatDate(execution.started_at)}</small>
                </div>
                <div class="execution-actions">
                    <button class="btn btn-sm btn-outline" onclick="ui.showExecutionModal('${execution.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Projects
    async loadProjects() {
        const projects = await window.api.getProjects();
        this.updateProjectsGrid(projects);
    }

    updateProjectsGrid(projects) {
        const grid = document.getElementById('projects-grid');
        
        if (projects.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder"></i>
                    <p>No projects found. Create your first project to get started.</p>
                    <button class="btn btn-primary" onclick="ui.showCreateProjectModal()">
                        <i class="fas fa-plus"></i> Create Project
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = projects.map(project => `
            <div class="project-card" data-project-id="${project.id}">
                <div class="project-header">
                    <h3 class="project-title">${project.name}</h3>
                    <div class="project-menu">
                        <button class="btn btn-sm btn-outline">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
                <p class="project-description">${project.description || 'No description provided'}</p>
                <div class="project-meta">
                    <div class="project-meta-item">
                        <i class="fas fa-code-branch"></i>
                        <span>${project.pipeline_count} pipelines</span>
                    </div>
                    <div class="project-meta-item">
                        <i class="fas fa-layer-group"></i>
                        <span>${project.environment_count} environments</span>
                    </div>
                    <div class="project-meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${window.api.formatDate(project.created_at)}</span>
                    </div>
                </div>
                <div class="project-actions">
                    <button class="btn btn-sm btn-outline" onclick="ui.viewProject(${project.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="ui.createPipelineForProject(${project.id})">
                        <i class="fas fa-plus"></i> Pipeline
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Pipelines
    async loadPipelines() {
        const [projects, pipelines] = await Promise.all([
            window.api.getProjects(),
            window.api.getAllPipelines()
        ]);

        this.updateProjectFilter(projects);
        this.updatePipelinesList(pipelines);
    }

    updateProjectFilter(projects) {
        const filter = document.getElementById('project-filter');
        filter.innerHTML = '<option value="">All Projects</option>' +
            projects.map(project => `<option value="${project.id}">${project.name}</option>`).join('');
    }

    updatePipelinesList(pipelines) {
        const list = document.getElementById('pipelines-list');
        
        if (pipelines.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-code-branch"></i>
                    <p>No pipelines found. Create your first pipeline to get started.</p>
                    <button class="btn btn-primary" onclick="ui.showCreatePipelineModal()">
                        <i class="fas fa-plus"></i> Create Pipeline
                    </button>
                </div>
            `;
            return;
        }

        list.innerHTML = pipelines.map(pipeline => `
            <div class="pipeline-item" data-pipeline-id="${pipeline.id}">
                <div class="pipeline-info">
                    <h3>${pipeline.name}</h3>
                    <p>${pipeline.description || 'No description provided'}</p>
                    <div class="pipeline-meta">
                        <span class="pipeline-trigger">${pipeline.trigger_type}</span>
                        ${pipeline.last_execution ? `
                            <span class="pipeline-status ${pipeline.last_execution.status}">
                                <i class="fas fa-${window.api.getStatusIcon(pipeline.last_execution.status)}"></i>
                                ${pipeline.last_execution.status}
                            </span>
                            <span class="pipeline-time">${window.api.formatDate(pipeline.last_execution.started_at)}</span>
                        ` : '<span class="pipeline-status pending">Never executed</span>'}
                    </div>
                </div>
                <div class="pipeline-actions">
                    <button class="btn btn-sm btn-success" onclick="ui.executePipeline(${pipeline.id})">
                        <i class="fas fa-play"></i> Run
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="ui.editPipeline(${pipeline.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="ui.viewPipelineHistory(${pipeline.id})">
                        <i class="fas fa-history"></i> History
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Modals
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showCreateProjectModal() {
        this.showModal('create-project-modal');
        // Clear form
        document.getElementById('create-project-form').reset();
    }

    async showCreatePipelineModal() {
        this.showModal('create-pipeline-modal');
        
        // Clear form and load projects
        document.getElementById('create-pipeline-form').reset();
        
        try {
            const projects = await window.api.getProjects();
            const projectSelect = document.getElementById('pipeline-project');
            projectSelect.innerHTML = '<option value="">Select a project</option>' +
                projects.map(project => `<option value="${project.id}">${project.name}</option>`).join('');
                
            // Add sample YAML
            document.getElementById('pipeline-yaml').value = window.api.getSamplePipelineYAML();
        } catch (error) {
            window.auth.showError('Failed to load projects');
        }
    }

    // Project Actions
    async handleCreateProject() {
        const form = document.getElementById('create-project-form');
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

            const projectData = {
                name: formData.get('name') || document.getElementById('project-name').value,
                description: formData.get('description') || document.getElementById('project-description').value,
                repository_url: formData.get('repository_url') || document.getElementById('project-repo').value
            };

            await window.api.createProject(projectData);
            
            this.closeModal(document.getElementById('create-project-modal'));
            window.auth.showSuccess('Project created successfully!');
            
            if (this.currentView === 'projects') {
                await this.loadProjects();
            }
        } catch (error) {
            window.auth.showError(`Failed to create project: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Create Project';
        }
    }

    async handleCreatePipeline() {
        const form = document.getElementById('create-pipeline-form');
        const submitBtn = form.querySelector('button[type="submit"]');

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

            const projectId = document.getElementById('pipeline-project').value;
            const pipelineData = {
                name: document.getElementById('pipeline-name').value,
                description: document.getElementById('pipeline-description').value,
                trigger_type: document.getElementById('pipeline-trigger').value,
                yaml_config: document.getElementById('pipeline-yaml').value
            };

            if (!projectId) {
                throw new Error('Please select a project');
            }

            await window.api.createPipeline(projectId, pipelineData);
            
            this.closeModal(document.getElementById('create-pipeline-modal'));
            window.auth.showSuccess('Pipeline created successfully!');
            
            if (this.currentView === 'pipelines') {
                await this.loadPipelines();
            }
        } catch (error) {
            window.auth.showError(`Failed to create pipeline: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Create Pipeline';
        }
    }

    // Pipeline Actions
    async executePipeline(pipelineId) {
        try {
            const result = await window.api.executePipeline(pipelineId);
            window.auth.showSuccess('Pipeline execution started!');
            this.showExecutionModal(result.execution_id);
        } catch (error) {
            window.auth.showError(`Failed to execute pipeline: ${error.message}`);
        }
    }

    async showExecutionModal(executionId) {
        this.showModal('execution-modal');
        
        try {
            const execution = await window.api.getExecution(executionId);
            this.updateExecutionModal(execution);
            
            // Join socket room for real-time updates
            if (this.socket) {
                this.socket.emit('join_execution', { execution_id: executionId });
            }
        } catch (error) {
            window.auth.showError(`Failed to load execution: ${error.message}`);
        }
    }

    updateExecutionModal(execution) {
        document.getElementById('execution-id').textContent = execution.id;
        document.getElementById('execution-status').textContent = execution.status;
        document.getElementById('execution-status').className = `execution-status ${execution.status}`;
        document.getElementById('execution-time').textContent = execution.started_at ? 
            window.api.formatDate(execution.started_at) : 'Not started';

        // Update stages
        const stagesContainer = document.getElementById('execution-stages');
        if (execution.stages && execution.stages.length > 0) {
            stagesContainer.innerHTML = execution.stages.map(stage => `
                <div class="stage-item">
                    <div class="stage-icon ${stage.status}">
                        <i class="fas fa-${window.api.getStatusIcon(stage.status)}"></i>
                    </div>
                    <div class="stage-content">
                        <h4>${stage.name}</h4>
                        <p>${stage.type}</p>
                    </div>
                    <div class="stage-duration">
                        ${window.api.formatDuration(stage.started_at, stage.finished_at)}
                    </div>
                </div>
            `).join('');
        } else {
            stagesContainer.innerHTML = '<p>No stages available</p>';
        }

        // Update logs
        const logsContainer = document.getElementById('execution-logs');
        if (execution.logs) {
            logsContainer.innerHTML = execution.logs.split('\n').map(line => 
                `<div class="log-line">${line}</div>`
            ).join('');
        } else {
            logsContainer.innerHTML = '<div class="log-line">No logs available</div>';
        }
    }

    // Socket event handlers
    handleExecutionUpdate(data) {
        // Update execution status if the modal is open
        const modal = document.getElementById('execution-modal');
        if (modal.classList.contains('active')) {
            const currentExecutionId = document.getElementById('execution-id').textContent;
            if (currentExecutionId === data.execution_id) {
                document.getElementById('execution-status').textContent = data.status;
                document.getElementById('execution-status').className = `execution-status ${data.status}`;
            }
        }
    }

    handleStageUpdate(data) {
        // Update stage status if the modal is open
        const modal = document.getElementById('execution-modal');
        if (modal.classList.contains('active')) {
            const currentExecutionId = document.getElementById('execution-id').textContent;
            if (currentExecutionId === data.execution_id) {
                // Find and update the stage
                const stageElements = document.querySelectorAll('.stage-item');
                stageElements.forEach(stageEl => {
                    const stageName = stageEl.querySelector('h4').textContent;
                    if (stageName === data.stage_name) {
                        const icon = stageEl.querySelector('.stage-icon');
                        icon.className = `stage-icon ${data.status}`;
                        icon.innerHTML = `<i class="fas fa-${window.api.getStatusIcon(data.status)}"></i>`;
                    }
                });
            }
        }
    }

    // Utility methods
    showLoading() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.style.display = 'flex';
        }
    }

    hideLoading() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    }

    handleGlobalSearch(query) {
        // Implement global search functionality
        console.log('Global search:', query);
    }

    handleProjectFilter(projectId) {
        // Filter pipelines by project
        const pipelineItems = document.querySelectorAll('.pipeline-item');
        pipelineItems.forEach(item => {
            if (!projectId || item.dataset.projectId === projectId) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Placeholder methods for future implementation
    async loadDeployments() {
        console.log('Loading deployments...');
    }

    async loadEnvironments() {
        console.log('Loading environments...');
    }

    async loadMonitoring() {
        console.log('Loading monitoring...');
    }

    viewProject(projectId) {
        console.log('View project:', projectId);
        this.switchView('pipelines');
        // TODO: Filter by project
    }

    createPipelineForProject(projectId) {
        this.showCreatePipelineModal();
        // Pre-select the project
        setTimeout(() => {
            document.getElementById('pipeline-project').value = projectId;
        }, 100);
    }

    editPipeline(pipelineId) {
        console.log('Edit pipeline:', pipelineId);
        // TODO: Implement pipeline editing
    }

    viewPipelineHistory(pipelineId) {
        console.log('View pipeline history:', pipelineId);
        // TODO: Implement pipeline history view
    }
}

// Create global UI instance
window.ui = new UI();