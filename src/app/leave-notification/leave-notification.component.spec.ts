import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveNotificationComponent } from './leave-notification.component';

describe('LeaveNotificationComponent', () => {
  let component: LeaveNotificationComponent;
  let fixture: ComponentFixture<LeaveNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveNotificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaveNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
