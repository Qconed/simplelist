// Interface principale Todo
export interface Todo {
  id: number;
  description: string;
  date: string;  // ISO string depuis l'API
  isDone: boolean;
  userEmail: string;
}

// Request pour créer un todo (POST /api/todos)
export interface CreateTodoRequest {
  description: string;
  date?: string;  // Optionnel, par défaut = aujourd'hui
}

// Request pour mettre à jour un todo (PUT /api/todos/:id)
export interface UpdateTodoRequest {
  description?: string;
  date?: string;
}

// Response de l'API pour un todo créé/mis à jour
export interface TodoResponse {
  message: string;
  todo: Todo;
}

// Response de l'API pour la liste des todos
export interface TodoListResponse {
  count: number;
  todos: Todo[];
}