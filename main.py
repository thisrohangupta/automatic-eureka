from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)

# Simple in-memory storage with file persistence
todos = []
todo_id = 1

def load_todos():
    global todos, todo_id
    try:
        if os.path.exists('todos.json'):
            with open('todos.json', 'r') as f:
                data = json.load(f)
                todos = data.get('todos', [])
                todo_id = data.get('next_id', 1)
    except:
        todos = []
        todo_id = 1

def save_todos():
    try:
        with open('todos.json', 'w') as f:
            json.dump({'todos': todos, 'next_id': todo_id}, f)
    except:
        pass

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/api/todos", methods=['GET'])
def get_todos():
    return jsonify(todos)

@app.route("/api/todos", methods=['POST'])
def add_todo():
    global todo_id
    data = request.get_json()
    
    if not data or not data.get('text', '').strip():
        return jsonify({'error': 'Text required'}), 400
    
    todo = {
        'id': todo_id,
        'text': data['text'].strip(),
        'completed': False
    }
    
    todos.append(todo)
    todo_id += 1
    save_todos()
    
    return jsonify(todo)

@app.route("/api/todos/<int:todo_id>", methods=['PUT'])
def update_todo(todo_id):
    data = request.get_json()
    
    for todo in todos:
        if todo['id'] == todo_id:
            if 'completed' in data:
                todo['completed'] = data['completed']
            save_todos()
            return jsonify(todo)
    
    return jsonify({'error': 'Not found'}), 404

@app.route("/api/todos/<int:todo_id>", methods=['DELETE'])
def delete_todo(todo_id):
    global todos
    todos = [t for t in todos if t['id'] != todo_id]
    save_todos()
    return '', 204

if __name__ == "__main__":
    load_todos()
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
