import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceCard } from './attendance-card';

describe('AttendanceCard', () => {
  let component: AttendanceCard;
  let fixture: ComponentFixture<AttendanceCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceCard],
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render guide name and queue items', () => {
    component.guideName = 'Mestre João';
    component.queue = [
      {
        id: '1',
        clientName: 'Maria',
        spiritualGuideId: 'guide-1',
        order: 1,
        createdAt: '2026-07-07T00:00:00Z',
        isCalled: false,
      }
    ];

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Mestre João');
    expect(compiled.textContent).toContain('Na fila: 1');
    expect(compiled.textContent).toContain('Maria');
  });
});
