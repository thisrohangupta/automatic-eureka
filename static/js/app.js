// TodoList App JavaScript
class TodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadTodos();
        this.updateStats();
        this.applyFilter();
    }

    setupEventListeners() {
        // Add todo form
        document.getElementById('todo-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Action buttons
        document.getElementById('clear-completed').addEventListener('click', () => {
            this.clearCompleted();
        });

        document.getElementById('mark-all-complete').addEventListener('click', () => {
            this.markAllComplete();
        });

        // Edit form
        document.getElementById('edit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEdit();
        });

        // Modal close on outside click
        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') {
                this.closeEditModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeEditModal();
            }
        });
    }

    async loadTodos() {
        try {
            const response = await fetch('/api/todos');
            if (response.ok) {
                this.todos = await response.json();
                this.renderTodos();
            } else {
                console.error('Failed to load todos');
            }
        } catch (error) {
            console.error('Error loading todos:', error);
            this.showNotification('Failed to load todos', 'error');
        }
    }

    async addTodo() {
        const input = document.getElementById('todo-input');
        const prioritySelect = document.getElementById('priority-select');
        const text = input.value.trim();
        
        if (!text) return;

        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    priority: prioritySelect.value
                }),
            });

            if (response.ok) {
                const newTodo = await response.json();
                this.todos.push(newTodo);
                this.renderTodos();
                this.updateStats();
                this.applyFilter();
                input.value = '';
                prioritySelect.value = 'medium';
                this.showNotification('Todo added successfully!', 'success');
            } else {
                const error = await response.json();
                console.error('Failed to add todo:', error);
                this.showNotification('Failed to add todo', 'error');
            }
        } catch (error) {
            console.error('Error adding todo:', error);
            this.showNotification('Failed to add todo', 'error');
        }
    }

    async updateTodo(id, updates) {
        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });

            if (response.ok) {
                const updatedTodo = await response.json();
                const index = this.todos.findIndex(todo => todo.id === id);
                if (index !== -1) {
                    this.todos[index] = updatedTodo;
                }
                this.renderTodos();
                this.updateStats();
                this.applyFilter();
                return true;
            } else {
                console.error('Failed to update todo');
                this.showNotification('Failed to update todo', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error updating todo:', error);
            this.showNotification('Failed to update todo', 'error');
            return false;
        }
    }

    async deleteTodo(id) {
        if (!confirm('Are you sure you want to delete this todo?')) return;

        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                this.todos = this.todos.filter(todo => todo.id !== id);
                this.renderTodos();
                this.updateStats();
                this.applyFilter();
                this.showNotification('Todo deleted successfully!', 'success');
            } else {
                console.error('Failed to delete todo');
                this.showNotification('Failed to delete todo', 'error');
            }
        } catch (error) {
            console.error('Error deleting todo:', error);
            this.showNotification('Failed to delete todo', 'error');
        }
    }

    async clearCompleted() {
        const completedTodos = this.todos.filter(todo => todo.completed);
        if (completedTodos.length === 0) {
            this.showNotification('No completed todos to clear', 'info');
            return;
        }

        if (!confirm(`Are you sure you want to delete ${completedTodos.length} completed todo(s)?`)) return;

        try {
            const response = await fetch('/api/todos/clear-completed', {
                method: 'DELETE',
            });

            if (response.ok) {
                this.todos = this.todos.filter(todo => !todo.completed);
                this.renderTodos();
                this.updateStats();
                this.applyFilter();
                this.showNotification('Completed todos cleared!', 'success');
            } else {
                console.error('Failed to clear completed todos');
                this.showNotification('Failed to clear completed todos', 'error');
            }
        } catch (error) {
            console.error('Error clearing completed todos:', error);
            this.showNotification('Failed to clear completed todos', 'error');
        }
    }

    async markAllComplete() {
        const incompleteTodos = this.todos.filter(todo => !todo.completed);
        if (incompleteTodos.length === 0) {
            this.showNotification('All todos are already completed!', 'info');
            return;
        }

        for (const todo of incompleteTodos) {
            await this.updateTodo(todo.id, { completed: true });
        }
        this.showNotification('All todos marked as complete!', 'success');
    }

    renderTodos() {
        const todoList = document.getElementById('todo-list');
        const emptyState = document.getElementById('empty-state');
        
        if (this.todos.length === 0) {
            todoList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        todoList.style.display = 'block';
        emptyState.style.display = 'none';
        
        todoList.innerHTML = '';
        
        this.todos.forEach(todo => {
            const todoElement = this.createTodoElement(todo);
            todoList.appendChild(todoElement);
        });
    }

    createTodoElement(todo) {
        const template = document.getElementById('todo-template');
        const todoElement = template.content.cloneNode(true);
        const li = todoElement.querySelector('.todo-item');
        
        li.dataset.id = todo.id;
        li.classList.toggle('completed', todo.completed);
        
        const checkbox = todoElement.querySelector('.todo-checkbox');
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', () => {
            this.updateTodo(todo.id, { completed: checkbox.checked });
        });
        
        const textSpan = todoElement.querySelector('.todo-text');
        textSpan.textContent = todo.text;
        
        const prioritySpan = todoElement.querySelector('.todo-priority');
        prioritySpan.textContent = todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1);
        prioritySpan.className = `todo-priority ${todo.priority}`;
        
        const dateSpan = todoElement.querySelector('.todo-date');
        dateSpan.textContent = this.formatDate(todo.created_at);
        
        const editBtn = todoElement.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => {
            this.openEditModal(todo);
        });
        
        const deleteBtn = todoElement.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            this.deleteTodo(todo.id);
        });
        
        return todoElement;
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.applyFilter();
    }

    applyFilter() {
        const todoItems = document.querySelectorAll('.todo-item');
        
        todoItems.forEach(item => {
            const todo = this.todos.find(t => t.id == item.dataset.id);
            if (!todo) return;
            
            let show = false;
            
            switch (this.currentFilter) {
                case 'all':
                    show = true;
                    break;
                case 'pending':
                    show = !todo.completed;
                    break;
                case 'completed':
                    show = todo.completed;
                    break;
                case 'high':
                    show = todo.priority === 'high' && !todo.completed;
                    break;
            }
            
            item.classList.toggle('hidden', !show);
        });
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;
        
        document.getElementById('total-count').textContent = `Total: ${total}`;
        document.getElementById('pending-count').textContent = `Pending: ${pending}`;
        document.getElementById('completed-count').textContent = `Completed: ${completed}`;
    }

    openEditModal(todo) {
        document.getElementById('edit-todo-id').value = todo.id;
        document.getElementById('edit-todo-text').value = todo.text;
        document.getElementById('edit-priority').value = todo.priority;
        document.getElementById('edit-modal').style.display = 'block';
        
        // Focus on text input
        setTimeout(() => {
            document.getElementById('edit-todo-text').focus();
            document.getElementById('edit-todo-text').select();
        }, 100);
    }

    closeEditModal() {
        document.getElementById('edit-modal').style.display = 'none';
    }

    async saveEdit() {
        const id = parseInt(document.getElementById('edit-todo-id').value);
        const text = document.getElementById('edit-todo-text').value.trim();
        const priority = document.getElementById('edit-priority').value;
        
        if (!text) {
            this.showNotification('Todo text cannot be empty', 'error');
            return;
        }
        
        const success = await this.updateTodo(id, { text, priority });
        if (success) {
            this.closeEditModal();
            this.showNotification('Todo updated successfully!', 'success');
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '10px',
            color: 'white',
            fontWeight: '500',
            zIndex: '9999',
            transform: 'translateX(400px)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px',
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
        });
        
        // Set background color based on type
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            info: '#2196f3',
            warning: '#ff9800'
        };
        notification.style.background = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});

// Make closeEditModal globally accessible for the HTML onclick
window.closeEditModal = function() {
    document.getElementById('edit-modal').style.display = 'none';
};