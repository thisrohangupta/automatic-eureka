import os
import json
import uuid
import datetime
from datetime import timedelta
from flask import Flask, render_template, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import subprocess
import threading
import time
import yaml

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'harness-io-clone-secret-key')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-string')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///harness_clone.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)
cors = CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    role = db.Column(db.String(20), default='developer')  # admin, developer, viewer

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    repository_url = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    pipelines = db.relationship('Pipeline', backref='project', lazy=True, cascade='all, delete-orphan')
    environments = db.relationship('Environment', backref='project', lazy=True, cascade='all, delete-orphan')

class Environment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)  # dev, staging, prod
    description = db.Column(db.Text)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    config = db.Column(db.Text)  # JSON config for environment variables
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class Pipeline(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    yaml_config = db.Column(db.Text)  # Pipeline YAML configuration
    trigger_type = db.Column(db.String(20), default='manual')  # manual, webhook, schedule
    trigger_config = db.Column(db.Text)  # JSON config for triggers
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    executions = db.relationship('PipelineExecution', backref='pipeline', lazy=True, cascade='all, delete-orphan')

class PipelineExecution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pipeline_id = db.Column(db.Integer, db.ForeignKey('pipeline.id'), nullable=False)
    execution_id = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    status = db.Column(db.String(20), default='pending')  # pending, running, success, failed, cancelled
    started_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    finished_at = db.Column(db.DateTime)
    triggered_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    environment_id = db.Column(db.Integer, db.ForeignKey('environment.id'))
    logs = db.Column(db.Text)
    error_message = db.Column(db.Text)
    
    # Relationships
    stages = db.relationship('StageExecution', backref='execution', lazy=True, cascade='all, delete-orphan')

class StageExecution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    execution_id = db.Column(db.Integer, db.ForeignKey('pipeline_execution.id'), nullable=False)
    stage_name = db.Column(db.String(100), nullable=False)
    stage_type = db.Column(db.String(50), nullable=False)  # build, test, deploy, approval
    status = db.Column(db.String(20), default='pending')
    started_at = db.Column(db.DateTime)
    finished_at = db.Column(db.DateTime)
    logs = db.Column(db.Text)
    order_index = db.Column(db.Integer, default=0)

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User(username=data['username'], email=data['email'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    
    token = create_access_token(identity=user.id)
    return jsonify({'token': token, 'user': {'id': user.id, 'username': user.username, 'email': user.email}})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if user and user.check_password(data['password']):
        token = create_access_token(identity=user.id)
        return jsonify({'token': token, 'user': {'id': user.id, 'username': user.username, 'email': user.email}})
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/projects', methods=['GET'])
@jwt_required()
def get_projects():
    user_id = get_jwt_identity()
    projects = Project.query.filter_by(owner_id=user_id, is_active=True).all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description,
        'repository_url': p.repository_url,
        'created_at': p.created_at.isoformat(),
        'pipeline_count': len(p.pipelines),
        'environment_count': len(p.environments)
    } for p in projects])

@app.route('/api/projects', methods=['POST'])
@jwt_required()
def create_project():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    project = Project(
        name=data['name'],
        description=data.get('description', ''),
        repository_url=data.get('repository_url', ''),
        owner_id=user_id
    )
    db.session.add(project)
    db.session.commit()
    
    # Create default environments
    environments = ['development', 'staging', 'production']
    for env_name in environments:
        env = Environment(name=env_name, project_id=project.id)
        db.session.add(env)
    
    db.session.commit()
    
    return jsonify({'id': project.id, 'name': project.name, 'description': project.description})

@app.route('/api/projects/<int:project_id>/pipelines', methods=['GET'])
@jwt_required()
def get_pipelines(project_id):
    user_id = get_jwt_identity()
    project = Project.query.filter_by(id=project_id, owner_id=user_id).first()
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    pipelines = Pipeline.query.filter_by(project_id=project_id, is_active=True).all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description,
        'trigger_type': p.trigger_type,
        'created_at': p.created_at.isoformat(),
        'last_execution': get_last_execution(p.id)
    } for p in pipelines])

@app.route('/api/projects/<int:project_id>/pipelines', methods=['POST'])
@jwt_required()
def create_pipeline(project_id):
    user_id = get_jwt_identity()
    project = Project.query.filter_by(id=project_id, owner_id=user_id).first()
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    data = request.get_json()
    pipeline = Pipeline(
        name=data['name'],
        description=data.get('description', ''),
        project_id=project_id,
        yaml_config=data.get('yaml_config', ''),
        trigger_type=data.get('trigger_type', 'manual')
    )
    db.session.add(pipeline)
    db.session.commit()
    
    return jsonify({'id': pipeline.id, 'name': pipeline.name})

@app.route('/api/pipelines/<int:pipeline_id>/execute', methods=['POST'])
@jwt_required()
def execute_pipeline(pipeline_id):
    user_id = get_jwt_identity()
    pipeline = Pipeline.query.get(pipeline_id)
    if not pipeline:
        return jsonify({'error': 'Pipeline not found'}), 404
    
    data = request.get_json()
    environment_id = data.get('environment_id')
    
    execution = PipelineExecution(
        pipeline_id=pipeline_id,
        triggered_by=user_id,
        environment_id=environment_id
    )
    db.session.add(execution)
    db.session.commit()
    
    # Start pipeline execution in background thread
    threading.Thread(target=run_pipeline_execution, args=(execution.id,)).start()
    
    return jsonify({'execution_id': execution.execution_id, 'status': 'started'})

@app.route('/api/executions/<execution_id>', methods=['GET'])
@jwt_required()
def get_execution(execution_id):
    execution = PipelineExecution.query.filter_by(execution_id=execution_id).first()
    if not execution:
        return jsonify({'error': 'Execution not found'}), 404
    
    return jsonify({
        'id': execution.execution_id,
        'status': execution.status,
        'started_at': execution.started_at.isoformat() if execution.started_at else None,
        'finished_at': execution.finished_at.isoformat() if execution.finished_at else None,
        'logs': execution.logs,
        'stages': [{
            'name': s.stage_name,
            'type': s.stage_type,
            'status': s.status,
            'started_at': s.started_at.isoformat() if s.started_at else None,
            'finished_at': s.finished_at.isoformat() if s.finished_at else None,
            'logs': s.logs
        } for s in execution.stages]
    })

def get_last_execution(pipeline_id):
    execution = PipelineExecution.query.filter_by(pipeline_id=pipeline_id).order_by(PipelineExecution.started_at.desc()).first()
    if execution:
        return {
            'id': execution.execution_id,
            'status': execution.status,
            'started_at': execution.started_at.isoformat()
        }
    return None

def run_pipeline_execution(execution_id):
    """Run pipeline execution in background"""
    execution = PipelineExecution.query.get(execution_id)
    if not execution:
        return
    
    try:
        execution.status = 'running'
        db.session.commit()
        
        # Emit status update
        socketio.emit('execution_update', {
            'execution_id': execution.execution_id,
            'status': 'running'
        })
        
        # Parse pipeline YAML and create stages
        if execution.pipeline.yaml_config:
            try:
                config = yaml.safe_load(execution.pipeline.yaml_config)
                stages = config.get('stages', [])
            except:
                stages = [
                    {'name': 'Build', 'type': 'build'},
                    {'name': 'Test', 'type': 'test'},
                    {'name': 'Deploy', 'type': 'deploy'}
                ]
        else:
            stages = [
                {'name': 'Build', 'type': 'build'},
                {'name': 'Test', 'type': 'test'},
                {'name': 'Deploy', 'type': 'deploy'}
            ]
        
        # Execute stages
        for i, stage_config in enumerate(stages):
            stage = StageExecution(
                execution_id=execution.id,
                stage_name=stage_config['name'],
                stage_type=stage_config['type'],
                order_index=i,
                started_at=datetime.datetime.utcnow()
            )
            db.session.add(stage)
            db.session.commit()
            
            # Simulate stage execution
            stage.status = 'running'
            db.session.commit()
            
            socketio.emit('stage_update', {
                'execution_id': execution.execution_id,
                'stage_name': stage.stage_name,
                'status': 'running'
            })
            
            # Simulate work
            time.sleep(2)
            
            stage.status = 'success'
            stage.finished_at = datetime.datetime.utcnow()
            stage.logs = f"Stage {stage.stage_name} completed successfully"
            db.session.commit()
            
            socketio.emit('stage_update', {
                'execution_id': execution.execution_id,
                'stage_name': stage.stage_name,
                'status': 'success'
            })
        
        execution.status = 'success'
        execution.finished_at = datetime.datetime.utcnow()
        execution.logs = "Pipeline execution completed successfully"
        
    except Exception as e:
        execution.status = 'failed'
        execution.finished_at = datetime.datetime.utcnow()
        execution.error_message = str(e)
        execution.logs = f"Pipeline execution failed: {str(e)}"
    
    db.session.commit()
    
    socketio.emit('execution_update', {
        'execution_id': execution.execution_id,
        'status': execution.status
    })

# SocketIO events
@socketio.on('join_execution')
def on_join_execution(data):
    execution_id = data['execution_id']
    join_room(execution_id)
    emit('joined', {'execution_id': execution_id})

@socketio.on('leave_execution')
def on_leave_execution(data):
    execution_id = data['execution_id']
    leave_room(execution_id)

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        
        # Create default admin user if not exists
        if not User.query.filter_by(username='admin').first():
            admin = User(username='admin', email='admin@harness.local', role='admin')
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
    
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, debug=True, host='0.0.0.0', port=port)
