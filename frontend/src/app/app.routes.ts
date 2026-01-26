import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login-component/login-component';
import { RegisterComponent } from './features/auth/register/register-component/register-component';
import { HomeComponent } from './features/home/home.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'todos',
    loadComponent: () => import('./features/todos/todo-list/todo-list-component/todo-list-component').then(m => m.TodoListComponent),
    canActivate: [authGuard]  // Route protégée
  },
  {
    path: '**',
    redirectTo: ''
  }
];
