import { RadarComponent } from './radar/radar.component';
import { BalanceComponent } from './balance/balance.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PersonsComponent } from './persons/persons.component';
import { ModelComponent } from './model/model.component';

const routes: Routes = [
  { path: 'radar', component: RadarComponent },
  { path: 'balance', component: BalanceComponent },
  { path: 'persons', component: PersonsComponent },
  { path: 'model', component: ModelComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
