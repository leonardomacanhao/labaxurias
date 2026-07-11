import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { ApiService } from '../../services/api.service';
import { Medium } from '../../models/medium';
import { Guide } from '../../models/guide';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';

export interface SelectedEntity {
  entityId: string;
  entityName: string;
  mediumId: string;
  mediumName: string;
}

interface QueueItem {
  id: string;
  name: string;
}

@Component({
  selector: 'app-atendimentos',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, DragDropModule],
  templateUrl: './atendimentos.component.html',
  styleUrl: './atendimentos.component.css'
})
export class AtendimentosComponent implements OnInit {
  @ViewChild('dateInput') dateInput!: ElementRef<HTMLInputElement>;
  
  selectedDate: string = '';
  selectedEntities: SelectedEntity[] = [];
  entityQueues: Record<string, QueueItem[]> = {};
  activeEntity: SelectedEntity | null = null;
  
  showMediumModal: boolean = false;
  mediums: Medium[] = [];
  selectedMediumIds: Set<string> = new Set();
  showEntityModal: boolean = false;
  mediumsWithEntities: { medium: Medium, entities: Guide[] }[] = [];
  selectedEntityIds: Set<string> = new Set();

  newConsulenteName: string = '';
  editingQueueItemId: string | null = null;
  editingQueueItemName: string = '';
  
  showDeleteConfirmModal: boolean = false;
  itemToDelete: QueueItem | null = null;
  
  showTransferModal: boolean = false;
  transferTargetEntityId: string | null = null;
  transferItem: QueueItem | null = null;
  
  showRemoveEntityModal: boolean = false;
  entityToRemove: SelectedEntity | null = null;
  removeEntityAction: 'transfer' | 'delete' | null = null;
  showConfirmRemoveEmptyModal: boolean = false;
  entityToRemoveEmpty: SelectedEntity | null = null;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Tentar recuperar a data do localStorage, senão usar hoje
    const savedDate = localStorage.getItem('gira_selected_date');
    if (savedDate) {
      this.selectedDate = savedDate;
    } else {
      const today = new Date();
      this.selectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    
    console.log('📅 Data inicial:', this.selectedDate);
    
    this.loadMediums();
    this.loadSessionData();
  }

  openCalendar(): void { this.dateInput.nativeElement.showPicker(); }
  
  onDateChange(): void {
    console.log('📅 Data alterada para:', this.selectedDate);
    localStorage.setItem('gira_selected_date', this.selectedDate);
    this.loadSessionData();
  }

  loadMediums(): void {
    this.api.getMediums().subscribe({
      next: (mediums) => {
        this.mediums = mediums.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('❌ Erro ao carregar médiuns:', err)
    });
  }

  loadSessionData(): void {
    console.log('🔄 Carregando sessão para data:', this.selectedDate);
    
    this.api.getSessionByDate(this.selectedDate).subscribe({
      next: (data) => {
        console.log('✅ Dados recebidos do backend:', data);
        
        this.selectedEntities = data.sessionEntities.map((se: any) => ({
          entityId: se.entityId,
          entityName: se.entityName,
          mediumId: se.mediumId,
          mediumName: se.mediumName
        }));
        
        this.entityQueues = {};
        data.sessionEntities.forEach((se: any) => {
          this.entityQueues[se.entityId] = se.queueItems.map((qi: any) => ({
            id: qi.id,
            name: qi.name
          }));
        });
        
        console.log('📋 Entidades carregadas:', this.selectedEntities.length);
        console.log('📋 Filas carregadas:', Object.keys(this.entityQueues).length);
        
        this.cdr.detectChanges();
      },
      error: (err) => console.error('❌ Erro ao carregar sessão:', err)
    });
  }

  openMediumModal(): void { 
    console.log('🔓 Abrindo modal de médiuns');
    this.showMediumModal = true; 
  }
  
  closeMediumModal(): void { 
    console.log('🔒 Fechando modal de médiuns');
    this.showMediumModal = false; 
    this.selectedMediumIds.clear(); 
  }
  
  toggleMedium(mediumId: string): void {
    this.selectedMediumIds.has(mediumId) ? this.selectedMediumIds.delete(mediumId) : this.selectedMediumIds.add(mediumId);
  }

  confirmMediumSelection(): void {
    console.log('✅ Confirmando seleção de médiuns:', this.selectedMediumIds.size);
    if (this.selectedMediumIds.size === 0) return alert('Selecione pelo menos um médium!');
    this.loadEntitiesForSelectedMediums();
  }

  private loadEntitiesForSelectedMediums(): void {
    this.mediumsWithEntities = [];
    let loadedCount = 0;
    const total = this.selectedMediumIds.size;
    const temp: { medium: Medium, entities: Guide[] }[] = [];

    this.selectedMediumIds.forEach(mid => {
      const med = this.mediums.find(m => m.id === mid);
      if (!med) return;
      this.api.getGuidesByMediumId(mid).subscribe({
        next: (ents) => {
          // CORREÇÃO: Filtrar entidades que já estão no hall de atendimento
          const availableEntities = ents.filter(e => 
            !this.selectedEntities.some(se => se.entityId === e.id)
          );
          
          temp.push({ medium: med, entities: availableEntities.sort((a, b) => 
            a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
          )});
          
          if (++loadedCount === total) {
            this.mediumsWithEntities = temp;
            this.cdr.detectChanges();
            this.showMediumModal = false;
            setTimeout(() => { 
              this.showEntityModal = true; 
              this.cdr.detectChanges(); 
            }, 150);
          }
        },
        error: (err) => { 
          console.error(err); 
          if(++loadedCount === total) this.showMediumModal = false; 
        }
      });
    });
  }

  closeEntityModal(): void { 
    console.log('🔒 Fechando modal de entidades');
    this.showEntityModal = false; 
    this.selectedEntityIds.clear(); 
    this.mediumsWithEntities = []; 
  }
  
  toggleEntity(eid: string): void { 
    this.selectedEntityIds.has(eid) ? this.selectedEntityIds.delete(eid) : this.selectedEntityIds.add(eid); 
  }

  // CORREÇÃO CRÍTICA: Agora ADICIONA ao invés de substituir
  confirmEntitySelection(): void {
    console.log('✅ Adicionando entidades ao hall:', this.selectedEntityIds.size);
    
    if (this.selectedEntityIds.size === 0) return alert('Selecione pelo menos uma entidade!');
    
    const newEnts: SelectedEntity[] = [];
    this.mediumsWithEntities.forEach(m => m.entities.forEach(e => {
      if (this.selectedEntityIds.has(e.id)) newEnts.push({ entityId: e.id, entityName: e.name, mediumId: m.medium.id, mediumName: m.medium.name });
    }));
    
    // CORREÇÃO: Concatena as novas entidades às existentes, ao invés de substituir
    const combinedEntities = [...this.selectedEntities, ...newEnts];
    this.selectedEntities = combinedEntities.sort((a, b) => 
      a.entityName.localeCompare(b.entityName, 'pt-BR', { sensitivity: 'base' })
    );
    
    this.showEntityModal = false;
    this.selectedEntityIds.clear();
    this.mediumsWithEntities = [];
    
    console.log('💾 Chamando saveSession() após adicionar entidades');
    this.saveSession();
  }

  onEntityCardClick(entity: SelectedEntity): void {
    console.log('👆 Card clicado:', entity.entityName);
    this.activeEntity = { ...entity };
    if (!this.entityQueues[entity.entityId]) {
      this.entityQueues[entity.entityId] = [];
    }
    this.cdr.detectChanges();
  }

  closeEntityQueueModal(): void {
    console.log('🔒 Fechando modal de fila');
    this.activeEntity = null;
    this.editingQueueItemId = null;
    this.editingQueueItemName = '';
    this.saveSession();
    this.cdr.detectChanges();
  }

  removeEntity(entity: SelectedEntity, event: Event): void {
    event.stopPropagation();
    
    const queue = this.entityQueues[entity.entityId] || [];
    
    if (queue.length > 0) {
      this.entityToRemove = entity;
      this.removeEntityAction = null;
      this.showRemoveEntityModal = true;
    } else {
      this.entityToRemoveEmpty = entity;
      this.showConfirmRemoveEmptyModal = true;
    }
  }

  cancelRemoveEmptyEntity(): void {
    this.showConfirmRemoveEmptyModal = false;
    this.entityToRemoveEmpty = null;
  }

  confirmRemoveEmptyEntity(): void {
    if (!this.entityToRemoveEmpty) return;
    
    this.selectedEntities = this.selectedEntities.filter(e => e.entityId !== this.entityToRemoveEmpty!.entityId);
    delete this.entityQueues[this.entityToRemoveEmpty.entityId];
    this.saveSession();
    
    this.showConfirmRemoveEmptyModal = false;
    this.entityToRemoveEmpty = null;
  }

  confirmRemoveWithTransfer(): void {
    if (!this.entityToRemove || !this.transferTargetEntityId) return;
    
    const queue = this.entityQueues[this.entityToRemove.entityId] || [];
    
    if (!this.entityQueues[this.transferTargetEntityId]) {
      this.entityQueues[this.transferTargetEntityId] = [];
    }
    this.entityQueues[this.transferTargetEntityId].push(...queue);
    
    this.selectedEntities = this.selectedEntities.filter(e => e.entityId !== this.entityToRemove!.entityId);
    delete this.entityQueues[this.entityToRemove.entityId];
    
    this.showRemoveEntityModal = false;
    this.entityToRemove = null;
    this.transferTargetEntityId = null;
    this.saveSession();
  }

  confirmRemoveWithDelete(): void {
    if (!this.entityToRemove) return;
    
    this.selectedEntities = this.selectedEntities.filter(e => e.entityId !== this.entityToRemove!.entityId);
    delete this.entityQueues[this.entityToRemove.entityId];
    
    this.showRemoveEntityModal = false;
    this.entityToRemove = null;
    this.saveSession();
  }

  cancelRemoveEntity(): void {
    this.showRemoveEntityModal = false;
    this.entityToRemove = null;
    this.removeEntityAction = null;
    this.transferTargetEntityId = null;
  }

  openTransferModal(): void {
    this.transferTargetEntityId = null;
    this.transferItem = null;
    this.showTransferModal = true;
  }

  openTransferItemModal(item: QueueItem): void {
    this.transferTargetEntityId = null;
    this.transferItem = item;
    this.showTransferModal = true;
  }

  closeTransferModal(): void {
    this.showTransferModal = false;
    this.transferTargetEntityId = null;
    this.transferItem = null;
  }

  transferAttendance(): void {
    if (!this.activeEntity || !this.transferTargetEntityId) return;
    
    const targetEntity = this.selectedEntities.find(e => e.entityId === this.transferTargetEntityId);
    if (!targetEntity) return;
    
    if (!this.entityQueues[this.transferTargetEntityId]) {
      this.entityQueues[this.transferTargetEntityId] = [];
    }
    
    if (this.transferItem) {
      this.entityQueues[this.transferTargetEntityId].push(this.transferItem);
      this.entityQueues[this.activeEntity.entityId] = this.entityQueues[this.activeEntity.entityId].filter(i => i.id !== this.transferItem!.id);
      
      this.showTransferModal = false;
      this.transferTargetEntityId = null;
      this.transferItem = null;
      this.saveSession();
      
      alert(`Consulente "${this.transferItem!.name}" transferido para ${targetEntity.entityName}!`);
    } else {
      const sourceQueue = this.entityQueues[this.activeEntity.entityId] || [];
      if (sourceQueue.length === 0) {
        alert('Não há consulentes para transferir!');
        return;
      }
      
      this.entityQueues[this.transferTargetEntityId].push(...sourceQueue);
      this.entityQueues[this.activeEntity.entityId] = [];
      
      this.showTransferModal = false;
      this.transferTargetEntityId = null;
      this.saveSession();
      
      alert(`Todos os consulentes transferidos para ${targetEntity.entityName}!`);
    }
  }

  get currentQueue(): QueueItem[] {
    if (!this.activeEntity) return [];
    if (!this.entityQueues[this.activeEntity.entityId]) this.entityQueues[this.activeEntity.entityId] = [];
    return this.entityQueues[this.activeEntity.entityId];
  }

  addConsulente(): void {
    console.log('➕ Adicionando consulente:', this.newConsulenteName);
    if (!this.newConsulenteName.trim() || !this.activeEntity) return;
    this.entityQueues[this.activeEntity.entityId].push({
      id: crypto.randomUUID(),
      name: this.newConsulenteName.trim()
    });
    this.newConsulenteName = '';
    this.saveSession();
  }

  confirmDeleteQueueItem(item: QueueItem): void {
    this.itemToDelete = item;
    this.showDeleteConfirmModal = true;
  }

  executeDeleteQueueItem(): void {
    if (!this.itemToDelete || !this.activeEntity) return;
    this.entityQueues[this.activeEntity.entityId] = this.entityQueues[this.activeEntity.entityId].filter(i => i.id !== this.itemToDelete!.id);
    if (this.editingQueueItemId === this.itemToDelete.id) this.editingQueueItemId = null;
    this.showDeleteConfirmModal = false;
    this.itemToDelete = null;
    this.saveSession();
  }

  cancelDeleteQueueItem(): void {
    this.showDeleteConfirmModal = false;
    this.itemToDelete = null;
  }

  startEditQueueItem(item: QueueItem): void {
    this.editingQueueItemId = item.id;
    this.editingQueueItemName = item.name;
  }

  saveEditQueueItem(): void {
    console.log('💾 Salvando edição');
    if (!this.activeEntity || !this.editingQueueItemId) return;
    const queue = this.entityQueues[this.activeEntity.entityId];
    const idx = queue.findIndex(i => i.id === this.editingQueueItemId);
    if (idx !== -1 && this.editingQueueItemName.trim()) {
      queue[idx].name = this.editingQueueItemName.trim();
    }
    this.editingQueueItemId = null;
    this.saveSession();
  }

  cancelEditQueueItem(): void {
    this.editingQueueItemId = null;
  }

  dropQueue(event: CdkDragDrop<QueueItem[]>): void {
    console.log('🔀 Reordenando fila');
    if (!this.activeEntity) return;
    moveItemInArray(this.entityQueues[this.activeEntity.entityId], event.previousIndex, event.currentIndex);
    this.saveSession();
  }

  private saveSession(): void {
    const data = {
      date: this.selectedDate,
      entities: this.selectedEntities.map(e => ({
        entityId: e.entityId,
        queueItems: (this.entityQueues[e.entityId] || []).map(qi => ({ name: qi.name }))
      }))
    };
    
    console.log('💾 SALVANDO SESSÃO:', data);
    
    this.api.saveSession(data).subscribe({
      next: (response) => {
        console.log('✅ SESSÃO SALVA COM SUCESSO:', response);
      },
      error: (err) => {
        console.error('❌ ERRO AO SALVAR SESSÃO:', err);
        console.error('Status:', err.status);
        console.error('Mensagem:', err.message);
      }
    });
  }
}
