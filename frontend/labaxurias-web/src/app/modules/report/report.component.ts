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

interface CambonesEntity {
  entityName: string;
  mediumName: string;
  consulentes: string[];
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

  activeTab: 'attendance' | 'consulentes' | 'cambones' = 'attendance';
  selectedDate: string = '';
  reportData: ReportData | null = null;
  consulentesList: ConsulenteItem[] = [];
  cambonesData: CambonesEntity[] = [];
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

  setTab(tab: 'attendance' | 'consulentes' | 'cambones'): void {
    this.activeTab = tab;
    this.loadReport();
  }

  async generatePdf(): Promise<void> {
    if (!this.reportData || this.reportData.entities.length === 0) {
      alert('Não há dados para gerar o PDF.');
      return;
    }

    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

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

      doc.setDrawColor(255, 51, 51);
      doc.setLineWidth(0.5);
      doc.line(0, 20, pageWidth, 20);

      let yPos = 28;

      if (this.activeTab === 'attendance') {
        this.generateAttendancePdf(doc, autoTable, yPos);
      } else {
        this.generateConsulentesPdf(doc, autoTable, yPos);
      }

      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF.');
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

      doc.setFillColor(240, 240, 240);
      doc.rect(10, yPos - 4, doc.internal.pageSize.getWidth() - 20, 12, 'F');

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(entity.entityName, 12, yPos + 2);

      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Médium: ${entity.mediumName}`, 12, yPos + 7);

      yPos += 12;

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
          margin: { left: 10, right: 10 }
        });

        yPos = doc.lastAutoTable.finalY + 8;
      }

      doc.setFillColor(250, 250, 250);
      doc.rect(10, yPos - 3, doc.internal.pageSize.getWidth() - 20, 8, 'F');

      doc.setTextColor(255, 51, 51);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: ${entity.totalCalled || 0} atendimento(s)`, 12, yPos + 2);

      yPos += 12;

      if (index < this.reportData!.entities.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(10, yPos, doc.internal.pageSize.getWidth() - 10, yPos);
        yPos += 8;
      }
    });

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

    const total = this.consulentesList.length;
    const atendidos = this.consulentesList.filter(c => c.isCalled).length;

    doc.setFillColor(30, 30, 30);
    doc.rect(0, 280, doc.internal.pageSize.getWidth(), 10, 'F');

    doc.setTextColor(255, 51, 51);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${total} consulente(s) | Atendidos: ${atendidos}`, doc.internal.pageSize.getWidth() / 2, 286, { align: 'center' });
  }

  printCambones(): void {
    if (this.cambonesData.length === 0) {
      alert('Não há dados para imprimir.');
      return;
    }

    const dateFormatted = this.formatDateBR(this.selectedDate);
    const totalEntities = this.cambonesData.length;
    const totalConsulentes = this.getTotalCambonesConsulentes();

    let entitiesHtml = '';
    this.cambonesData.forEach(entity => {
      let itemsHtml = '';
      entity.consulentes.forEach((consulente, i) => {
        const num = String(i + 1).padStart(2, '0');
        itemsHtml += `<li>${num}. ${this.escapeHtml(consulente)}</li>`;
      });

      if (entity.consulentes.length === 0) {
        itemsHtml = '<li style="color:#888; font-style:italic;">Nenhum consulente</li>';
      }

      entitiesHtml += `
        <div class="entity">
          <div class="entity-header">
            <strong>${this.escapeHtml(entity.entityName)}</strong>
            <span>${this.escapeHtml(entity.mediumName)}</span>
          </div>
          <div class="divider thin"></div>
          <ol class="list">
            ${itemsHtml}
          </ol>
          <div class="divider"></div>
        </div>
      `;
    });

    const printContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Lista para Cambones</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 3mm;
      width: 80mm;
      font-family: 'Courier New', Courier, monospace;
      font-size: 9pt;
      color: #000;
      line-height: 1.3;
      background: #fff;
    }
    .header {
      text-align: center;
      margin-bottom: 3mm;
    }
    .header h1 {
      font-size: 11pt;
      font-weight: 700;
      margin: 0 0 1mm 0;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .header p {
      font-size: 9pt;
      margin: 0;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 2mm 0;
    }
    .divider.thin {
      margin: 1mm 0;
      border-top-style: dotted;
    }
    .entity {
      margin-bottom: 2mm;
    }
    .entity-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 1mm;
      gap: 2mm;
    }
    .entity-header strong {
      font-size: 10pt;
      font-weight: 700;
      flex: 1;
    }
    .entity-header span {
      font-size: 8pt;
      font-style: italic;
    }
    .list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .list li {
      font-size: 9pt;
      padding: 0.8mm 0;
      border-bottom: 1px dotted #ccc;
      margin: 0;
    }
    .list li:last-child {
      border-bottom: none;
    }
    .footer {
      margin-top: 3mm;
      padding-top: 2mm;
      border-top: 2px solid #000;
      font-size: 9pt;
      text-align: center;
    }
    .footer p {
      margin: 0.5mm 0;
    }
    @media print {
      body {
        width: 80mm;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>LISTA DE CONSULENTES</h1>
    <p>Data: ${dateFormatted}</p>
  </div>
  <div class="divider"></div>
  ${entitiesHtml}
  <div class="footer">
    <p>Total de entidades: ${totalEntities}</p>
    <p>Total de consulentes: ${totalConsulentes}</p>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 200);
      window.onafterprint = function() {
        window.close();
      };
    };
  </script>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=350,height=700');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    } else {
      alert('Não foi possível abrir a janela de impressão. Verifique se o navegador não bloqueou pop-ups.');
    }
  }

  private escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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

  getTotalCambonesConsulentes(): number {
    return this.cambonesData.reduce((sum, entity) => sum + entity.consulentes.length, 0);
  }

  loadReport(): void {
    this.loading = true;

    if (this.activeTab === 'attendance') {
      this.api.getAttendanceReport(this.selectedDate).subscribe({
        next: (data) => {
          this.reportData = data;
          this.consulentesList = [];
          this.cambonesData = [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao carregar relatório:', err);
          this.loading = false;
        }
      });
    } else if (this.activeTab === 'consulentes') {
      this.api.getRegistrationReport(this.selectedDate).subscribe({
        next: (data) => {
          this.reportData = data;
          this.consulentesList = [];
          this.cambonesData = [];
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
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
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
    } else if (this.activeTab === 'cambones') {
      this.api.getCambonesReport(this.selectedDate).subscribe({
        next: (data) => {
          this.reportData = data;
          this.consulentesList = [];
          this.cambonesData = (data.entities || []).map((e: any) => ({
            entityName: e.entityName,
            mediumName: e.mediumName,
            consulentes: e.consulentes || []
          }));
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