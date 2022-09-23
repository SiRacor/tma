import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { ProductService } from './balance/productservice';
import { SheetDAO } from './balance/sheetdao';
import { SheetService } from './balance/sheet.service';
import { SheetServiceBD } from './balance/sheet.service.bd';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BalanceComponent } from './balance/balance.component';
import { RadarComponent } from './radar/radar.component';
import { TabMenuModule } from 'primeng/tabmenu';
import { RouterModule } from '@angular/router';

import {FormsModule} from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import {TableModule} from 'primeng/table';
import {ToastModule} from 'primeng/toast';
import {CalendarModule} from 'primeng/calendar';
import {SliderModule} from 'primeng/slider';
import {MultiSelectModule} from 'primeng/multiselect';
import {ContextMenuModule} from 'primeng/contextmenu';
import {DialogModule} from 'primeng/dialog';
import {ButtonModule} from 'primeng/button';
import {DropdownModule} from 'primeng/dropdown';
import {ProgressBarModule} from 'primeng/progressbar';
import {InputTextModule} from 'primeng/inputtext';
import {CardModule} from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { AddRowDirective } from './balance/add-row.directive';


@NgModule({
  declarations: [
    AppComponent,
    BalanceComponent,
    RadarComponent,
    AddRowDirective
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    TableModule,
    CalendarModule,
		SliderModule,
		DialogModule,
		MultiSelectModule,
		ContextMenuModule,
		DropdownModule,
		ButtonModule,
		ToastModule,
    InputTextModule,
    ProgressBarModule,
    HttpClientModule,
    FormsModule,
    TabMenuModule,
    RouterModule,
    CardModule,
    ConfirmDialogModule
  ],
  providers: [ProductService, SheetService, SheetServiceBD, SheetDAO, ConfirmationService],
  bootstrap: [AppComponent]
})
export class AppModule { }
