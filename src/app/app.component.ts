import { Component } from '@angular/core';
import { TabMenuModule } from 'primeng/tabmenu';
import { RadarComponent } from './radar/radar.component';
import { BalanceComponent } from './balance/balance.component';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'tma';

  items!: MenuItem[];

  activeItem!: MenuItem;

  ngOnInit() {
      this.items = [
          {label: 'Balance', icon: 'pi pi-fw pi-pencil', routerLink: ['/balance']},
          {label: 'Radar', icon: 'pi pi-fw pi-file', routerLink: ['/radar']}
      ];

      this.activeItem = this.items[0];
  }
}
