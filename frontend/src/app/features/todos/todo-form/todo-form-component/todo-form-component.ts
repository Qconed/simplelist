import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-todo-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './todo-form-component.html',
  styleUrl: './todo-form-component.css',
})
export class TodoFormComponent {
  todoForm: FormGroup;
  
  // Output pour émettre l'ajout d'un nouveau todo
  addTodo = output<{ description: string; date?: string }>();

  constructor(private fb: FormBuilder) {
    // Création du formulaire avec validation
    this.todoForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(3)]],
      date: [this.getTodayDate()]  // Date par défaut = aujourd'hui
    });
  }

  /**
   * Obtenir la date d'aujourd'hui au format YYYY-MM-DD
   */
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Soumission du formulaire
   */
  onSubmit(): void {
    if (this.todoForm.invalid) {
      return;
    }

    const { description, date } = this.todoForm.value;
    
    // Émettre l'événement vers le parent
    this.addTodo.emit({
      description: description.trim(),
      date: date || undefined
    });

    // Réinitialiser le formulaire
    this.todoForm.reset({
      description: '',
      date: this.getTodayDate()
    });
  }

  /**
   * Getter pour accéder au contrôle description
   */
  get description() {
    return this.todoForm.get('description');
  }
}
