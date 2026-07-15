import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

interface User {
  id: string;
  userName: string;
  email: string;
  roles: string[];
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  loading = false;

  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;

  // CORREÇÃO: Usar PascalCase para combinar com o C#
  newUser = { UserName: '', Email: '', Password: '', Role: 'User' };
  editingUser: User | null = null;
  editingPassword = '';
  editingRole = 'User';
  userToDelete: User | null = null;

  constructor(private api: ApiService, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.api.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar usuários:', err);
        this.loading = false;
        alert('Erro ao carregar usuários. Verifique o console.');
      }
    });
  }

  openCreateModal(): void {
    this.newUser = { UserName: '', Email: '', Password: '', Role: 'User' };
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createUser(): void {
    if (!this.newUser.UserName || !this.newUser.Password) {
      alert('Usuário e senha são obrigatórios.');
      return;
    }

    this.api.createUser(this.newUser).subscribe({
      next: () => {
        this.closeCreateModal();
        this.loadUsers();
      },
      error: (err) => {
        console.error('Erro ao criar usuário:', err);
        const errorMsg = err.error?.errors?.[0]?.description || err.error?.title || 'Erro desconhecido';
        alert('Erro ao criar usuário: ' + errorMsg);
      }
    });
  }

  openEditModal(user: User): void {
    this.editingUser = user;
    this.editingPassword = '';
    this.editingRole = user.roles.length > 0 ? user.roles[0] : 'User';
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingUser = null;
  }

  saveEdit(): void {
    if (!this.editingUser) return;

    const payload: any = {
      Id: this.editingUser.id,
      UserName: this.editingUser.userName,
      Email: this.editingUser.email,
      Role: this.editingRole
    };

    if (this.editingPassword) {
      payload.Password = this.editingPassword;
    }

    this.api.updateUser(payload).subscribe({
      next: () => {
        this.closeEditModal();
        this.loadUsers();
      },
      error: (err) => {
        console.error('Erro ao atualizar usuário:', err);
        alert('Erro ao atualizar usuário.');
      }
    });
  }

  openDeleteModal(user: User): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  confirmDelete(): void {
    if (!this.userToDelete) return;

    this.api.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.cancelDelete();
        this.loadUsers();
      },
      error: (err) => {
        console.error('Erro ao excluir usuário:', err);
        alert('Erro ao excluir usuário.');
      }
    });
  }

  getRoleBadgeClass(role: string): string {
    return role === 'Admin' ? 'badge-admin' : 'badge-user';
  }

  logout(): void {
    if (confirm('Tem certeza que deseja sair?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}


