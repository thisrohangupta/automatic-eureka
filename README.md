# Harness Clone - CI/CD Platform 🚀

A comprehensive CI/CD platform clone inspired by Harness.io, built with Flask and modern web technologies. This application provides a complete DevOps solution for managing projects, pipelines, deployments, and monitoring in a user-friendly interface.

## ✨ Features

### 🔐 Authentication & User Management
- **Secure Authentication**: JWT-based authentication with token management
- **User Registration**: Easy account creation with email validation
- **Role-based Access**: Admin, Developer, and Viewer roles
- **Session Management**: Persistent login with automatic token refresh

### 📁 Project Management
- **Project Creation**: Organize your applications into projects
- **Repository Integration**: Connect with Git repositories
- **Environment Management**: Multiple deployment environments per project
- **Team Collaboration**: Share projects with team members

### 🔄 Pipeline Management
- **Visual Pipeline Builder**: Create and manage CI/CD pipelines
- **YAML Configuration**: Flexible pipeline definitions using YAML
- **Multiple Triggers**: Manual, webhook, and scheduled triggers
- **Stage Management**: Build, test, deploy, and approval stages
- **Parallel Execution**: Run multiple stages concurrently

### 🚀 Deployment & Execution
- **Real-time Execution**: Live pipeline execution with WebSocket updates
- **Deployment Tracking**: Monitor deployment status across environments
- **Rollback Support**: Quick rollback to previous successful deployments
- **Approval Gates**: Manual approval steps for production deployments

### 📊 Monitoring & Analytics
- **Dashboard Overview**: High-level metrics and recent activities
- **Execution History**: Detailed logs and execution history
- **Performance Metrics**: Pipeline execution times and success rates
- **Real-time Logs**: Live streaming of build and deployment logs

### 🎨 Modern UI/UX
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Themes**: Customizable appearance
- **Real-time Updates**: Live updates using WebSockets
- **Keyboard Shortcuts**: Power user productivity features
- **Modern Components**: Professional UI with smooth animations

## 🛠️ Technology Stack

### Backend
- **Python 3.11+**: Modern Python with async support
- **Flask 3.0**: Lightweight and flexible web framework
- **SQLAlchemy**: Powerful ORM for database operations
- **Flask-SocketIO**: Real-time bidirectional communication
- **Flask-JWT-Extended**: JWT authentication management
- **PostgreSQL/SQLite**: Production and development databases

### Frontend
- **Vanilla JavaScript**: Modern ES6+ features
- **CSS Grid/Flexbox**: Modern layout techniques
- **WebSockets**: Real-time communication
- **Font Awesome**: Professional icon library
- **Inter Font**: Modern typography

### Infrastructure
- **Docker**: Containerized deployment
- **Gunicorn**: Production WSGI server
- **Redis**: Session storage and caching
- **Celery**: Background task processing

## 🚀 Quick Start

### Prerequisites
- Python 3.11 or higher
- Node.js (for optional frontend tooling)
- Docker (for containerized deployment)
- Git

### Local Development

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd harness-clone
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set environment variables**:
   ```bash
   export SECRET_KEY="your-secret-key-here"
   export JWT_SECRET_KEY="your-jwt-secret-here"
   export DATABASE_URL="sqlite:///harness_clone.db"  # or PostgreSQL URL
   ```

5. **Initialize database**:
   ```bash
   python main.py
   ```

6. **Access the application**:
   Open your browser and go to `http://localhost:5000`

### Docker Deployment

1. **Build the Docker image**:
   ```bash
   docker build -t harness-clone .
   ```

2. **Run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

3. **Access the application**:
   Navigate to `http://localhost:5000`

## 📚 Usage Guide

### Initial Setup

1. **First Login**: Use the demo credentials:
   - Username: `admin`
   - Password: `admin123`

2. **Create Your First Project**:
   - Click "Create Project" in the Projects view
   - Enter project details and repository URL
   - The system automatically creates development, staging, and production environments

3. **Build Your First Pipeline**:
   - Navigate to the Pipelines view
   - Click "Create Pipeline"
   - Use the sample YAML or create your custom configuration
   - Configure triggers (manual, webhook, or scheduled)

### Pipeline Configuration

Create powerful CI/CD pipelines using YAML:

```yaml
stages:
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
    cron: "0 2 * * *"
```

### Keyboard Shortcuts

- **Ctrl/Cmd + K**: Focus global search
- **1-6**: Navigate between views (Dashboard, Projects, Pipelines, etc.)
- **Escape**: Close open modals
- **Ctrl + Shift + D**: Toggle development toolbar (localhost only)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Flask secret key | Required |
| `JWT_SECRET_KEY` | JWT token signing key | Required |
| `DATABASE_URL` | Database connection string | `sqlite:///harness_clone.db` |
| `PORT` | Application port | `5000` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |

### Database Configuration

#### SQLite (Development)
```bash
export DATABASE_URL="sqlite:///harness_clone.db"
```

#### PostgreSQL (Production)
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/harness_clone"
```

## 📖 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |

### Project Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List user projects |
| POST | `/api/projects` | Create new project |
| PUT | `/api/projects/{id}` | Update project |
| DELETE | `/api/projects/{id}` | Delete project |

### Pipeline Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/{id}/pipelines` | List project pipelines |
| POST | `/api/projects/{id}/pipelines` | Create pipeline |
| POST | `/api/pipelines/{id}/execute` | Execute pipeline |
| GET | `/api/executions/{id}` | Get execution details |

## 🔌 WebSocket Events

### Real-time Updates

- `execution_update`: Pipeline execution status changes
- `stage_update`: Individual stage status updates
- `deployment_update`: Deployment progress updates

### Client Events

- `join_execution`: Subscribe to execution updates
- `leave_execution`: Unsubscribe from execution updates

## 🧪 Development

### Development Toolbar

Press `Ctrl + Shift + D` in localhost to access:
- **Sample Data**: Create sample projects and pipelines
- **Quick Login**: Instant admin login
- **App Info**: Display application state

### Available Console Commands

```javascript
// Get application information
harnessApp.getAppInfo()

// Create sample data for testing
harnessApp.createSampleData()

// Quick admin login
harnessApp.quickLogin()

// Export configuration
harnessApp.exportConfig()
```

### Running Tests

```bash
# Run backend tests
python -m pytest tests/

# Run with coverage
python -m pytest --cov=app tests/
```

## 🚀 Deployment

### Production Deployment

1. **Set Production Environment Variables**:
   ```bash
   export FLASK_ENV=production
   export DATABASE_URL="postgresql://..."
   export REDIS_URL="redis://..."
   ```

2. **Use Production WSGI Server**:
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 main:app
   ```

3. **Configure Reverse Proxy** (Nginx):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Docker Production

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/harness
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
      
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=harness
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    
volumes:
  postgres_data:
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use ESLint for JavaScript code
- Write tests for new features
- Update documentation as needed
- Ensure responsive design for UI changes

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Check DATABASE_URL environment variable
   - Ensure database server is running
   - Verify connection credentials

2. **WebSocket Connection Failed**:
   - Check if Socket.IO is properly loaded
   - Verify CORS settings
   - Check browser console for errors

3. **Authentication Issues**:
   - Clear browser localStorage
   - Check JWT_SECRET_KEY configuration
   - Verify token expiration settings

### Debug Mode

Enable debug mode for development:
```bash
export FLASK_DEBUG=1
python main.py
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Harness.io](https://harness.io)
- Built with [Flask](https://flask.palletsprojects.com/)
- UI components inspired by modern design systems
- Icons by [Font Awesome](https://fontawesome.com)

## 📞 Support

For support, email support@harness-clone.com or join our [Discord community](https://discord.gg/harness-clone).

---

**Built with ❤️ for the DevOps community**

Ready to revolutionize your CI/CD workflow? Get started with Harness Clone today! 🚀
