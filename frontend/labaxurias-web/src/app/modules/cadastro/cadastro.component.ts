import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Medium } from '../../models/medium';
import { Guide } from '../../models/guide';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './cadastro.component.html',
  styleUrl: './cadastro.component.css'
})
export class CadastroComponent implements OnInit {
  activeTab: 'medium' | 'entidade' = 'medium';
  
  mediums: Medium[] = [];
  entities: Guide[] = [];

  newMedium: Partial<Medium> = { name: '' };
  showEditMediumModal: boolean = false;
  editingMedium: Partial<Medium> = { id: '', name: '' };

  selectedMediumId: string | null = null;
  newEntity: Partial<Guide> = { name: '', mediumId: '' };
  showEditEntityModal: boolean = false;
  editingEntity: Partial<Guide> = { id: '', name: '', mediumId: '' };

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMediums();
  }

  setTab(tab: 'medium' | 'entidade') {
    this.activeTab = tab;
    if (tab === 'entidade' && this.mediums.length === 0) {
      this.loadMediums();
    }
  }

  loadMediums() {
    this.api.getMediums().subscribe({
      next: (mediums) => {
        // Ordena alfabeticamente ignorando acentos (pt-BR)
        this.mediums = mediums.sort((a, b) => 
          a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
        );
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar médiuns:', err)
    });
  }

  saveMedium() {
    if (!this.newMedium.name?.trim()) return;
    this.api.createMedium(this.newMedium).subscribe({
      next: () => {
        this.newMedium = { name: '' };
        this.loadMediums();
      },
      error: (err) => console.error('Erro ao criar médium:', err)
    });
  }

  openEditMediumModal(medium: Medium) {
    this.editingMedium = { id: medium.id, name: medium.name };
    this.showEditMediumModal = true;
  }

  closeEditMediumModal() {
    this.showEditMediumModal = false;
    this.editingMedium = { id: '', name: '' };
  }

  saveEditMedium() {
    if (!this.editingMedium.name?.trim() || !this.editingMedium.id) return;
    this.api.updateMedium(this.editingMedium.id, this.editingMedium).subscribe({
      next: () => {
        this.closeEditMediumModal();
        this.loadMediums();
      },
      error: (err) => console.error('Erro ao atualizar médium:', err)
    });
  }

  deleteMedium(id: string) {
    if (confirm('Tem certeza? Isso também excluirá todas as entidades deste médium.')) {
      this.api.deleteMedium(id).subscribe({
        next: () => {
          if (this.selectedMediumId === id) {
            this.selectedMediumId = null;
            this.entities = [];
          }
          this.loadMediums();
        },
        error: (err) => console.error('Erro ao excluir médium:', err)
      });
    }
  }

  loadEntities() {
    if (!this.selectedMediumId) {
      this.entities = [];
      this.cdr.detectChanges();
      return;
    }
    this.api.getGuidesByMediumId(this.selectedMediumId).subscribe({
      next: (entities) => {
        // Ordena entidades alfabeticamente ignorando acentos (pt-BR)
        this.entities = entities.sort((a, b) => 
          a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
        );
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar entidades:', err)
    });
  }

  onMediumSelect() {
    this.newEntity = { name: '', mediumId: '' };
    this.loadEntities();
  }

  saveEntity() {
    if (!this.newEntity.name?.trim() || !this.selectedMediumId) return;
    this.api.createGuide({ ...this.newEntity, mediumId: this.selectedMediumId }).subscribe({
      next: () => {
        this.newEntity = { name: '', mediumId: '' };
        this.loadEntities();
      },
      error: (err) => console.error('Erro ao criar entidade:', err)
    });
  }

  openEditEntityModal(entity: Guide) {
    this.editingEntity = { id: entity.id, name: entity.name, mediumId: entity.mediumId };
    this.showEditEntityModal = true;
  }

  closeEditEntityModal() {
    this.showEditEntityModal = false;
    this.editingEntity = { id: '', name: '', mediumId: '' };
  }

  saveEditEntity() {
    if (!this.editingEntity.name?.trim() || !this.editingEntity.id) return;
    this.api.updateGuide(this.editingEntity.id, this.editingEntity).subscribe({
      next: () => {
        this.closeEditEntityModal();
        this.loadEntities();
      },
      error: (err) => console.error('Erro ao atualizar entidade:', err)
    });
  }

  deleteEntity(id: string) {
    if (confirm('Tem certeza que deseja excluir esta entidade?')) {
      this.api.deleteGuide(id).subscribe({
        next: () => {
          this.loadEntities();
        },
        error: (err) => console.error('Erro ao excluir entidade:', err)
      });
    }
  }
}
