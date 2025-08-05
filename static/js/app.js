// TodoList App JavaScript
class SimpleTodo {
    constructor() {
        this.todos = [];
        this.init();
    }

    async init() {
        this.setupEvents();
        await this.loadTodos();
        this.renderTodos();
    }

    setupEvents() {
        document.getElementById('todo-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });
    }

    async loadTodos() {
        try {
            const response = await fetch('/api/todos');
            if (response.ok) {
                this.todos = await response.json();
            }
        } catch (error) {
            console.error('Error loading todos:', error);
        }
    }

    async addTodo() {
        const input = document.getElementById('todo-input');
        const text = input.value.trim();
        
        if (!text) return;

        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (response.ok) {
                const newTodo = await response.json();
                this.todos.push(newTodo);
                this.renderTodos();
                input.value = '';
            }
        } catch (error) {
            console.error('Error adding todo:', error);
        }
    }

    async toggleTodo(id, completed) {
        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed })
            });

            if (response.ok) {
                const todo = this.todos.find(t => t.id === id);
                if (todo) {
                    todo.completed = completed;
                    this.renderTodos();
                }
            }
        } catch (error) {
            console.error('Error updating todo:', error);
        }
    }

    async deleteTodo(id) {
        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.todos = this.todos.filter(t => t.id !== id);
                this.renderTodos();
            }
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    }

    renderTodos() {
        const list = document.getElementById('todo-list');
        list.innerHTML = '';

        this.todos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            
            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <span class="todo-text">${todo.text}</span>
                <button class="delete-btn">Delete</button>
            `;

            const checkbox = li.querySelector('.todo-checkbox');
            checkbox.addEventListener('change', () => {
                this.toggleTodo(todo.id, checkbox.checked);
            });

            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => {
                this.deleteTodo(todo.id);
            });

            list.appendChild(li);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SimpleTodo();
});