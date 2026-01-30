import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoService } from '../../../../core/services/todo.service';
import { Todo } from '../../../../core/models/todo.model';
import { TodoFormComponent } from '../../todo-form/todo-form-component/todo-form-component';
import { TodoItemComponent } from '../../todo-item/todo-item-component/todo-item-component';

@Component({
  selector: 'app-todo-list',
  imports: [CommonModule, TodoFormComponent, TodoItemComponent],
  templateUrl: './todo-list-component.html',
  styleUrl: './todo-list-component.css',
})
export class TodoListComponent implements OnInit {
  todos = signal<Todo[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  filter = signal<'all' | 'active' | 'completed'>('all');

  // Todos filtrés selon le filtre actif
  filteredTodos = computed(() => {
    const allTodos = this.todos();
    const currentFilter = this.filter();

    switch (currentFilter) {
      case 'active':
        return allTodos.filter(todo => !todo.isDone);
      case 'completed':
        return allTodos.filter(todo => todo.isDone);
      default:
        return allTodos;
    }
  });

  // Statistiques
  stats = computed(() => {
    const allTodos = this.todos();
    return {
      total: allTodos.length,
      completed: allTodos.filter(t => t.isDone).length,
      active: allTodos.filter(t => !t.isDone).length
    };
  });

  constructor(private todoService: TodoService) {}

  ngOnInit(): void {
    this.loadTodos();
  }

  /**
   * Charger tous les todos depuis l'API
   */
  loadTodos(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.todoService.getTodos().subscribe({
      next: (response) => {
        this.todos.set(response.todos);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des todos:', error);
        this.errorMessage.set('Impossible de charger les todos');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Ajouter un nouveau todo
   */
  onAddTodo(data: { description: string; date?: string }): void {
    this.todoService.createTodo(data.description, data.date).subscribe({
      next: (response) => {
        // Ajouter le nouveau todo au début de la liste
        this.todos.update(todos => [response.todo, ...todos]);
      },
      error: (error) => {
        console.error('Erreur lors de la création du todo:', error);
        this.errorMessage.set('Impossible de créer le todo');
      }
    });
  }

  /**
   * Basculer l'état d'un todo (fait/non fait)
   */
  onToggleTodo(todoId: number): void {
    this.todoService.toggleTodo(todoId).subscribe({
      next: (response) => {
        // Mettre à jour le todo dans la liste
        this.todos.update(todos =>
          todos.map(todo =>
            todo.id === todoId ? response.todo : todo
          )
        );
      },
      error: (error) => {
        console.error('Erreur lors du toggle du todo:', error);
        this.errorMessage.set('Impossible de mettre à jour le todo');
      }
    });
  }

  /**
   * Supprimer un todo
   */
  onDeleteTodo(todoId: number): void {
    this.todoService.deleteTodo(todoId).subscribe({
      next: () => {
        // Retirer le todo de la liste
        this.todos.update(todos => todos.filter(todo => todo.id !== todoId));
      },
      error: (error) => {
        console.error('Erreur lors de la suppression du todo:', error);
        this.errorMessage.set('Impossible de supprimer le todo');
      }
    });
  }

  /**
   * Changer le filtre
   */
  setFilter(filter: 'all' | 'active' | 'completed'): void {
    this.filter.set(filter);
  }
}
