from flask import Flask, render_template, request, jsonify, redirect, url_for
import os
import json
from datetime import datetime

app = Flask(__name__)

# In-memory storage for todos (in production, you'd use a database)
todos = []
todo_id_counter = 1

def load_todos():
    """Load todos from file if it exists"""
    global todos, todo_id_counter
    try:
        if os.path.exists('todos.json'):
            with open('todos.json', 'r') as f:
                data = json.load(f)
                todos = data.get('todos', [])
                todo_id_counter = data.get('counter', 1)
    except Exception as e:
        print(f"Error loading todos: {e}")
        todos = []
        todo_id_counter = 1

def save_todos():
    """Save todos to file"""
    try:
        with open('todos.json', 'w') as f:
            json.dump({
                'todos': todos,
                'counter': todo_id_counter
            }, f, indent=2)
    except Exception as e:
        print(f"Error saving todos: {e}")

@app.route("/")
def index():
    """Main page - display the todolist"""
    return render_template('index.html', todos=todos)

@app.route("/api/todos", methods=['GET'])
def get_todos():
    """API endpoint to get all todos"""
    return jsonify(todos)

@app.route("/api/todos", methods=['POST'])
def add_todo():
    """API endpoint to add a new todo"""
    global todo_id_counter
    
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'Todo text is required'}), 400
    
    todo = {
        'id': todo_id_counter,
        'text': data['text'].strip(),
        'completed': False,
        'created_at': datetime.now().isoformat(),
        'priority': data.get('priority', 'medium')
    }
    
    todos.append(todo)
    todo_id_counter += 1
    save_todos()
    
    return jsonify(todo), 201

@app.route("/api/todos/<int:todo_id>", methods=['PUT'])
def update_todo(todo_id):
    """API endpoint to update a todo"""
    data = request.get_json()
    
    for todo in todos:
        if todo['id'] == todo_id:
            if 'text' in data:
                todo['text'] = data['text'].strip()
            if 'completed' in data:
                todo['completed'] = data['completed']
            if 'priority' in data:
                todo['priority'] = data['priority']
            todo['updated_at'] = datetime.now().isoformat()
            save_todos()
            return jsonify(todo)
    
    return jsonify({'error': 'Todo not found'}), 404

@app.route("/api/todos/<int:todo_id>", methods=['DELETE'])
def delete_todo(todo_id):
    """API endpoint to delete a todo"""
    global todos
    
    todos = [todo for todo in todos if todo['id'] != todo_id]
    save_todos()
    
    return '', 204

@app.route("/api/todos/clear-completed", methods=['DELETE'])
def clear_completed():
    """API endpoint to clear all completed todos"""
    global todos
    
    todos = [todo for todo in todos if not todo['completed']]
    save_todos()
    
    return jsonify({'message': 'Completed todos cleared'})

@app.route("/api/stats", methods=['GET'])
def get_stats():
    """API endpoint to get todolist statistics"""
    total = len(todos)
    completed = len([todo for todo in todos if todo['completed']])
    pending = total - completed
    
    priority_counts = {'high': 0, 'medium': 0, 'low': 0}
    for todo in todos:
        if not todo['completed']:
            priority_counts[todo.get('priority', 'medium')] += 1
    
    return jsonify({
        'total': total,
        'completed': completed,
        'pending': pending,
        'priority_counts': priority_counts
    })

if __name__ == "__main__":
    # Load existing todos on startup
    load_todos()
    
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
