import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HeaderInfoComponent } from './header-info.component';

describe('HeaderInfoComponent', () => {
  let component: HeaderInfoComponent;
  let fixture: ComponentFixture<HeaderInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderInfoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderInfoComponent);
    component = fixture.componentInstance;
  });

  it('should refresh the visible time every second', fakeAsync(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-07-22T10:00:00')); 

    fixture.detectChanges();
    const initialTime = component.currentTime;

    jasmine.clock().tick(1000);
    fixture.detectChanges();

    expect(component.currentTime).not.toBe(initialTime);

    jasmine.clock().uninstall();
  }));
});
