import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../core/components/page-header/page-header.component';
import { ApiService } from '../../services/api.service';
import { FilterCalledPipe } from '../../pipes/filter-called.pipe';

interface Attendance {
  clientName: string;
  calledAt: string;
  createdAt: string;
}

interface EntityReport {
  entityName: string;
  mediumName: string;
  totalCalled?: number;
  attendances?: Attendance[];
  registrations?: any[];
}

interface ReportData {
  date: string;
  entities: EntityReport[];
}

interface ConsulenteItem {
  clientName: string;
  createdAt: string;
  entityName: string;
  mediumName: string;
  isCalled: boolean;
  calledAt?: string;
}

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, FilterCalledPipe],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export class ReportComponent implements OnInit {
  @ViewChild('dateInput') dateInput!: ElementRef<HTMLInputElement>;
  
  activeTab: 'attendance' | 'consulentes' = 'attendance';
  selectedDate: string = '';
  reportData: ReportData | null = null;
  consulentesList: ConsulenteItem[] = [];
  loading: boolean = false;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const savedDate = localStorage.getItem('gira_selected_date');
    if (savedDate) {
      this.selectedDate = savedDate;
    } else {
      const today = new Date();
      this.selectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    
    this.loadReport();
  }

  openCalendar(): void { 
    this.dateInput.nativeElement.showPicker(); 
  }

  onDateChange(): void {
    localStorage.setItem('gira_selected_date', this.selectedDate);
    this.loadReport();
  }

  setTab(tab: 'attendance' | 'consulentes'): void {
    this.activeTab = tab;
    this.loadReport();
  }

  loadReport(): void {
    this.loading = true;
    
    if (this.activeTab === 'attendance') {
      this.api.getAttendanceReport(this.selectedDate).subscribe({
        next: (data) => {
          this.reportData = data;
          this.consulentesList = [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao carregar relatório:', err);
          this.loading = false;
        }
      });
    } else {
      this.api.getRegistrationReport(this.selectedDate).subscribe({
        next: (data) => {
          this.reportData = data;
          // Achatar lista de consulentes de todas as entidades
          this.consulentesList = [];
          if (data && data.entities) {
            data.entities.forEach((entity: EntityReport) => {
              if (entity.registrations) {
                entity.registrations.forEach((reg: any) => {
                  this.consulentesList.push({
                    clientName: reg.clientName,
                    createdAt: reg.createdAt,
                    entityName: entity.entityName,
                    mediumName: entity.mediumName,
                    isCalled: reg.isCalled,
                    calledAt: reg.calledAt
                  });
                });
              }
            });
            // Ordenar alfabeticamente ignorando acentos
            this.consulentesList.sort((a, b) => 
              a.clientName.localeCompare(b.clientName, 'pt-BR', { sensitivity: 'base' })
            );
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao carregar relatório:', err);
          this.loading = false;
        }
      });
    }
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getTotalAttendances(): number {
    if (!this.reportData) return 0;
    if (this.activeTab === 'attendance') {
      return this.reportData.entities.reduce((sum, entity) => {
        return sum + (entity.totalCalled || 0);
      }, 0);
    } else {
      return this.consulentesList.length;
    }
  }
}
