import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Todo } from '../../../../core/models/todo.model';

@Component({
  selector: 'app-todo-item',
  imports: [CommonModule],
  templateUrl: './todo-item-component.html',
  styleUrl: './todo-item-component.css',
})
export class TodoItemComponent {
  // Input pour recevoir le todo depuis le parent
  todo = input.required<Todo>();
  
  // Outputs pour émettre des événements vers le parent
  toggleTodo = output<number>();  // Émet l'id du todo à toggle
  deleteTodo = output<number>();  // Émet l'id du todo à supprimer
  
  /**
   * Formater la date pour l'affichage
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
  
  /**
   * Handler pour le toggle (coche/décoche)
   */
  onToggle(): void {
    this.toggleTodo.emit(this.todo().id);
  }
  
  /**
   * Handler pour la suppression
   */
  onDelete(): void {
    this.deleteTodo.emit(this.todo().id);
  }
}
