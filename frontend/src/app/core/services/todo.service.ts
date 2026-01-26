import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoResponse,
  TodoListResponse
} from '../models/todo.model';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste des todos
   * GET /api/todos?isDone=true/false (optionnel)
   */
  getTodos(isDone?: boolean): Observable<TodoListResponse> {
    let params = new HttpParams();
    
    if (isDone !== undefined) {
      params = params.set('isDone', isDone.toString());
    }

    return this.http.get<TodoListResponse>(`${this.API_URL}/api/todos`, { params });
  }

  /**
   * Crée un nouveau todo
   * POST /api/todos
   */
  createTodo(description: string, date?: string): Observable<TodoResponse> {
    const body: CreateTodoRequest = { description };
    
    if (date) {
      body.date = date;
    }

    return this.http.post<TodoResponse>(`${this.API_URL}/api/todos`, body);
  }

  /**
   * Met à jour un todo
   * PUT /api/todos/:id
   */
  updateTodo(id: number, description?: string, date?: string): Observable<TodoResponse> {
    const body: UpdateTodoRequest = {};
    
    if (description !== undefined) {
      body.description = description;
    }
    
    if (date !== undefined) {
      body.date = date;
    }

    return this.http.put<TodoResponse>(`${this.API_URL}/api/todos/${id}`, body);
  }

  /**
   * Toggle le statut d'un todo (fait/non fait)
   * PATCH /api/todos/:id/toggle
   */
  toggleTodo(id: number): Observable<TodoResponse> {
    return this.http.patch<TodoResponse>(`${this.API_URL}/api/todos/${id}/toggle`, {});
  }

  /**
   * Supprime un todo
   * DELETE /api/todos/:id
   */
  deleteTodo(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/api/todos/${id}`);
  }
}