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

  async generatePdf(): Promise<void> {
    console.log('🔥 Botão PDF clicado!');
    
    if (!this.reportData || this.reportData.entities.length === 0) {
      alert('Não há dados para gerar o PDF.');
      return;
    }

    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Cabeçalho compacto e profissional
      doc.setFillColor(30, 30, 30);
      doc.rect(0, 0, pageWidth, 20, 'F');
      
      doc.setTextColor(255, 51, 51);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      
      const title = this.activeTab === 'attendance' ? 'RELATÓRIO DE ATENDIMENTOS' : 'RELATÓRIO DE CONSULENTES';
      doc.text(title, 10, 9);
      
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Data: ${this.formatDateBR(this.selectedDate)}`, 10, 15);
      
      // Linha separadora
      doc.setDrawColor(255, 51, 51);
      doc.setLineWidth(0.5);
      doc.line(0, 20, pageWidth, 20);
      
      let yPos = 28;
      
      if (this.activeTab === 'attendance') {
        this.generateAttendancePdf(doc, autoTable, yPos);
      } else {
        this.generateConsulentesPdf(doc, autoTable, yPos);
      }
      
      // Abrir PDF em nova aba
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      console.log('✅ PDF gerado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
    }
  }

  generateAttendancePdf(doc: any, autoTable: any, startY: number): void {
    if (!this.reportData) return;
    
    let yPos = startY;
    
    this.reportData.entities.forEach((entity, index) => {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      // Cabeçalho da entidade com fundo cinza
      doc.setFillColor(240, 240, 240);
      doc.rect(10, yPos - 4, doc.internal.pageSize.getWidth() - 20, 12, 'F');
      
      // Nome da entidade
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(entity.entityName, 12, yPos + 2);
      
      // Médium
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Médium: ${entity.mediumName}`, 12, yPos + 7);
      
      yPos += 12;
      
      // Tabela de atendimentos com coluna Médium
      if (entity.attendances && entity.attendances.length > 0) {
        const tableData = entity.attendances.map((att, idx) => [
          (idx + 1).toString(),
          att.clientName,
          entity.mediumName,
          this.formatDateTime(att.calledAt)
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Consulente', 'Médium', 'Horário']],
          body: tableData,
          theme: 'plain',
          headStyles: {
            fillColor: [255, 51, 51],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: 4
          },
          styles: {
            fontSize: 10,
            cellPadding: 4,
            lineColor: [220, 220, 220],
            lineWidth: 0.1
          },
          columnStyles: {
            0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
            1: { cellWidth: 90 },
            2: { cellWidth: 50 },
            3: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }
          },
          margin: { left: 10, right: 10 },
          didDrawPage: (data: any) => {
            // Adicionar linhas horizontais entre rows
            doc.setDrawColor(230, 230, 230);
            doc.setLineWidth(0.2);
          }
        });
        
        yPos = doc.lastAutoTable.finalY + 8;
      }
      
      // Total da entidade
      doc.setFillColor(250, 250, 250);
      doc.rect(10, yPos - 3, doc.internal.pageSize.getWidth() - 20, 8, 'F');
      
      doc.setTextColor(255, 51, 51);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: ${entity.totalCalled || 0} atendimento(s)`, 12, yPos + 2);
      
      yPos += 12;
      
      // Linha separadora entre entidades (exceto a última)
      if (index < this.reportData!.entities.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(10, yPos, doc.internal.pageSize.getWidth() - 10, yPos);
        yPos += 8;
      }
    });
    
    // Rodapé com total geral
    const total = this.getTotalAttendances();
    doc.setFillColor(30, 30, 30);
    doc.rect(0, 280, doc.internal.pageSize.getWidth(), 10, 'F');
    
    doc.setTextColor(255, 51, 51);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL GERAL: ${total} atendimento(s)`, doc.internal.pageSize.getWidth() / 2, 286, { align: 'center' });
  }

  generateConsulentesPdf(doc: any, autoTable: any, startY: number): void {
    if (this.consulentesList.length === 0) return;
    
    const tableData = this.consulentesList.map((cons, idx) => [
      (idx + 1).toString(),
      cons.clientName,
      cons.entityName,
      cons.mediumName,
      this.formatDateTime(cons.createdAt),
      cons.isCalled ? 'Sim' : 'Não',
      cons.isCalled && cons.calledAt ? this.formatDateTime(cons.calledAt) : '-'
    ]);
    
    autoTable(doc, {
      startY: startY,
      head: [['#', 'Consulente', 'Entidade', 'Médium', 'Cadastro', 'Atendido', 'Atendimento']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [255, 51, 51],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 3
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 40 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 15, halign: 'center' },
        6: { cellWidth: 20, halign: 'center' }
      },
      margin: { left: 10, right: 10 }
    });
    
    // Totais no rodapé
    const total = this.consulentesList.length;
    const atendidos = this.consulentesList.filter(c => c.isCalled).length;
    
    doc.setFillColor(30, 30, 30);
    doc.rect(0, 280, doc.internal.pageSize.getWidth(), 10, 'F');
    
    doc.setTextColor(255, 51, 51);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${total} consulente(s) | Atendidos: ${atendidos}`, doc.internal.pageSize.getWidth() / 2, 286, { align: 'center' });
  }

  formatDateBR(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  }

  getTotalAttendances(): number {
    if (!this.reportData) return 0;
    return this.reportData.entities.reduce((sum, entity) => {
      return sum + (entity.totalCalled || 0);
    }, 0);
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
}
