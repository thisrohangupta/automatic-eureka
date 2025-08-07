package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "path/filepath"
    "strconv"
    "sync"
)

type Todo struct {
    ID        int    `json:"id"`
    Text      string `json:"text"`
    Completed bool   `json:"completed"`
}

type PersistedData struct {
    Todos  []Todo `json:"todos"`
    NextID int    `json:"next_id"`
}

type Server struct {
    todos       []Todo
    nextID      int
    dataPath    string
    dataMutex   sync.Mutex
    staticDir   string
    templatesDir string
}

func NewServer() *Server {
    return &Server{
        todos:        []Todo{},
        nextID:       1,
        dataPath:     "todos.json",
        staticDir:    "static",
        templatesDir: "templates",
    }
}

func (s *Server) loadTodos() {
    s.dataMutex.Lock()
    defer s.dataMutex.Unlock()

    if _, err := os.Stat(s.dataPath); err != nil {
        s.todos = []Todo{}
        s.nextID = 1
        return
    }

    content, err := os.ReadFile(s.dataPath)
    if err != nil {
        log.Printf("failed reading %s: %v", s.dataPath, err)
        return
    }

    var data PersistedData
    if err := json.Unmarshal(content, &data); err != nil {
        log.Printf("failed to parse %s: %v", s.dataPath, err)
        return
    }
    s.todos = data.Todos
    if data.NextID > 0 {
        s.nextID = data.NextID
    } else {
        // compute next id
        maxID := 0
        for _, t := range s.todos {
            if t.ID > maxID { maxID = t.ID }
        }
        s.nextID = maxID + 1
    }
}

func (s *Server) saveTodos() {
    s.dataMutex.Lock()
    defer s.dataMutex.Unlock()

    data := PersistedData{Todos: s.todos, NextID: s.nextID}
    bytes, err := json.MarshalIndent(data, "", "  ")
    if err != nil {
        log.Printf("failed to marshal todos: %v", err)
        return
    }
    if err := os.WriteFile(s.dataPath, bytes, 0644); err != nil {
        log.Printf("failed to write %s: %v", s.dataPath, err)
    }
}

func (s *Server) handleIndex(w http.ResponseWriter, r *http.Request) {
    // Serve the static index.html from templates directory
    indexPath := filepath.Join(s.templatesDir, "index.html")
    http.ServeFile(w, r, indexPath)
}

func (s *Server) handleGetTodos(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    s.dataMutex.Lock()
    defer s.dataMutex.Unlock()
    json.NewEncoder(w).Encode(s.todos)
}

func (s *Server) handleAddTodo(w http.ResponseWriter, r *http.Request) {
    var payload struct{ Text string `json:"text"` }
    if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
        http.Error(w, `{"error":"Invalid JSON"}`, http.StatusBadRequest)
        return
    }
    text := payload.Text
    if len(text) == 0 || len(trim(text)) == 0 { // custom trim below
        http.Error(w, `{"error":"Text required"}`, http.StatusBadRequest)
        return
    }

    s.dataMutex.Lock()
    todo := Todo{ID: s.nextID, Text: trim(text), Completed: false}
    s.todos = append(s.todos, todo)
    s.nextID++
    s.dataMutex.Unlock()

    s.saveTodos()

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(todo)
}

func (s *Server) handleUpdateTodo(w http.ResponseWriter, r *http.Request) {
    // Expect path: /api/todos/{id}
    idStr := lastPathPart(r.URL.Path)
    id, err := strconv.Atoi(idStr)
    if err != nil {
        http.Error(w, `{"error":"Invalid ID"}`, http.StatusBadRequest)
        return
    }

    var payload struct{ Completed *bool `json:"completed"` }
    if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
        http.Error(w, `{"error":"Invalid JSON"}`, http.StatusBadRequest)
        return
    }

    s.dataMutex.Lock()
    defer s.dataMutex.Unlock()

    for i := range s.todos {
        if s.todos[i].ID == id {
            if payload.Completed != nil {
                s.todos[i].Completed = *payload.Completed
            }
            go s.saveTodos()
            w.Header().Set("Content-Type", "application/json")
            json.NewEncoder(w).Encode(s.todos[i])
            return
        }
    }
    http.Error(w, `{"error":"Not found"}`, http.StatusNotFound)
}

func (s *Server) handleDeleteTodo(w http.ResponseWriter, r *http.Request) {
    idStr := lastPathPart(r.URL.Path)
    id, err := strconv.Atoi(idStr)
    if err != nil {
        http.Error(w, `{"error":"Invalid ID"}`, http.StatusBadRequest)
        return
    }

    s.dataMutex.Lock()
    filtered := make([]Todo, 0, len(s.todos))
    for _, t := range s.todos {
        if t.ID != id {
            filtered = append(filtered, t)
        }
    }
    s.todos = filtered
    s.dataMutex.Unlock()

    s.saveTodos()

    w.WriteHeader(http.StatusNoContent)
}

func (s *Server) routes() http.Handler {
    mux := http.NewServeMux()

    // API routes
    mux.HandleFunc("/api/todos", func(w http.ResponseWriter, r *http.Request) {
        switch r.Method {
        case http.MethodGet:
            s.handleGetTodos(w, r)
        case http.MethodPost:
            s.handleAddTodo(w, r)
        default:
            http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
        }
    })

    mux.HandleFunc("/api/todos/", func(w http.ResponseWriter, r *http.Request) {
        switch r.Method {
        case http.MethodPut:
            s.handleUpdateTodo(w, r)
        case http.MethodDelete:
            s.handleDeleteTodo(w, r)
        default:
            http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
        }
    })

    // Static files
    fileServer := http.FileServer(http.Dir(s.staticDir))
    mux.Handle("/static/", http.StripPrefix("/static/", fileServer))

    // Index - must be last to avoid shadowing /static
    mux.HandleFunc("/", s.handleIndex)

    return mux
}

func main() {
    server := NewServer()
    server.loadTodos()

    port := os.Getenv("PORT")
    if port == "" {
        port = "5000"
    }

    addr := fmt.Sprintf(":%s", port)
    log.Printf("Starting server on %s", addr)
    if err := http.ListenAndServe(addr, server.routes()); err != nil {
        log.Fatalf("server error: %v", err)
    }
}

// Helpers
func trim(s string) string {
    // Lightweight trim to avoid importing strings for a single usage
    // Remove leading/trailing spaces and tabs
    start := 0
    end := len(s)
    for start < end {
        c := s[start]
        if c == ' ' || c == '\n' || c == '\t' || c == '\r' {
            start++
        } else {
            break
        }
    }
    for end > start {
        c := s[end-1]
        if c == ' ' || c == '\n' || c == '\t' || c == '\r' {
            end--
        } else {
            break
        }
    }
    return s[start:end]
}

func lastPathPart(p string) string {
    if p == "" {
        return ""
    }
    // remove trailing slash if present
    if p[len(p)-1] == '/' {
        p = p[:len(p)-1]
    }
    for i := len(p) - 1; i >= 0; i-- {
        if p[i] == '/' {
            return p[i+1:]
        }
    }
    return p
}