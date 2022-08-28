import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { BalanceComponent } from './balance.component';
import { ProductService } from './productservice';
import { MessageService } from 'primeng/api';

describe('BalanceComponent', () => {
  let component: BalanceComponent;
  let fixture: ComponentFixture<BalanceComponent>;
  let spy2;

  beforeEach(async () => {

    spy2 = jasmine.createSpyObj('HttpClient', ['get']);

    spy2.get.and.callFake(function() {
        return { toPromise() { return new Promise(() => []) }};
    });

    await TestBed.configureTestingModule({
      providers: [
        MessageService, ProductService,
        { provide: HttpClient, useValue: spy2 }
      ],
      declarations: [ BalanceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
