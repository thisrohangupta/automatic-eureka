# TodoList Application 📝

A modern, responsive web-based todolist application built with Flask and vanilla JavaScript. This application provides a clean, intuitive interface for managing your daily tasks with features like priority levels, filtering, and persistent storage.

## ✨ Features

- **Create Todos**: Add new tasks with custom priority levels (High, Medium, Low)
- **Mark Complete**: Check off completed tasks with visual feedback
- **Edit Tasks**: Modify existing todos with an elegant modal interface
- **Delete Tasks**: Remove individual tasks or clear all completed ones
- **Priority System**: Organize tasks by priority with color-coded labels
- **Smart Filtering**: View all, pending, completed, or high-priority tasks
- **Real-time Stats**: See total, pending, and completed task counts
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Persistent Storage**: Tasks are saved to JSON file and persist between sessions
- **Modern UI**: Beautiful gradient design with smooth animations and transitions

## 🚀 Quick Start

### Local Development

1. **Clone and navigate to the project**:
   ```bash
   git clone <your-repo>
   cd <project-directory>
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   python main.py
   ```

4. **Open your browser** and go to `http://localhost:5000`

### Docker Deployment

1. **Build the Docker image**:
   ```bash
   docker build -t todolist-app .
   ```

2. **Run the container**:
   ```bash
   docker run -p 5000:5000 todolist-app
   ```

3. **Access the application** at `http://localhost:5000`

## 🔧 Configuration

- **Port**: Set the `PORT` environment variable (default: 5000)
- **Debug Mode**: Automatically enabled in development
- **Data Storage**: Todos are stored in `todos.json` file

## 📚 API Endpoints

The application provides a RESTful API for todo management:

- `GET /` - Main application interface
- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create a new todo
- `PUT /api/todos/<id>` - Update a specific todo
- `DELETE /api/todos/<id>` - Delete a specific todo
- `DELETE /api/todos/clear-completed` - Clear all completed todos
- `GET /api/stats` - Get todolist statistics

## 🎯 Usage

### Adding Todos
1. Type your task in the input field
2. Select priority level (Low, Medium, High)
3. Click the "Add" button or press Enter

### Managing Todos
- **Complete**: Click the checkbox next to any task
- **Edit**: Click the edit icon to modify task text or priority
- **Delete**: Click the trash icon to remove a task
- **Filter**: Use filter buttons to view specific subsets of tasks

### Bulk Actions
- **Mark All Complete**: Mark all pending tasks as completed
- **Clear Completed**: Remove all completed tasks at once

## 🛠️ Technology Stack

- **Backend**: Python 3.11, Flask 2.3.3
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Styling**: Custom CSS with flexbox/grid, CSS animations
- **Icons**: Font Awesome 6.0
- **Storage**: JSON file-based persistence
- **Deployment**: Docker with multi-stage builds

## 📱 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

---

**Enjoy staying organized with your new TodoList app! 🎉**

## 🟦 Go Version (Converted)

This repository now includes a Go implementation of the server.

### Run locally (Go)

```bash
# From repo root
go run main.go
# or build
go build -o server ./main.go
./server
```

The server listens on `PORT` (default `5000`).

### Endpoints
- GET `/` – serves `templates/index.html`
- GET `/static/*` – static assets
- REST API matches the original Flask version:
  - GET `/api/todos`
  - POST `/api/todos`
  - PUT `/api/todos/<id>`
  - DELETE `/api/todos/<id>`

### Persistence
- Todos are saved to `todos.json` in the working directory.

### Docker (Go)

```bash
docker build -t todolist-go .
docker run -p 5000:5000 todolist-go
```
