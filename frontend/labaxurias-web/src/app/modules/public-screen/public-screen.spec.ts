import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, OnInit, NgZone } from '@angular/core';
import { SignalrService } from '../../services/signalr';
import { PublicScreen } from './public-screen';

constructor(
  private signalr: SignalrService,
  private ngZone: NgZone
) {}

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
