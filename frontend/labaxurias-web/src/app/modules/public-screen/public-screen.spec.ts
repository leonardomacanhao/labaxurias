import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicScreen } from './public-screen';

describe('PublicScreen', () => {
  let component: PublicScreen;
  let fixture: ComponentFixture<PublicScreen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicScreen],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicScreen);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
