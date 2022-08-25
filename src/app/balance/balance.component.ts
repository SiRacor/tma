import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { SelectItem, SortEvent } from 'primeng/api';;
import { ProductService } from './productservice';
import { Product } from './product';
import { MessageService } from 'primeng/api';
import { Person, Row, Sheet, SheetDTO, ColDTO } from './sheet';
import { Stream, NullSafe, Equality } from '../utils';
import { NgSwitchCase } from '@angular/common';

const { findFirst, forEach } = Stream;
const { wth, nsc } = NullSafe;
const { eq } = Equality;


@Component({
  selector: 'app-balance',
  templateUrl: './balance.component.html',
  providers: [MessageService, ProductService],
  styles: ['.right { text-align: right;}'],
  styleUrls: ['./balance.component.css']
})
export class BalanceComponent implements OnInit {

  products1: Product[] = [];

  products2: Product[] = [];

  sheet: Sheet = new Sheet();
  sheetDto!: SheetDTO;

  statuses: SelectItem[] = [];
  clonedProducts: { [s: string]: Product; } = {};

  constructor(public productService: ProductService, private messageService: MessageService) { }

  ngOnInit() {
      this.productService.getProductsSmall().then(data => this.products1 = data);
      this.productService.getProductsSmall().then(data => this.products2 = data);

      this.statuses = [{label: 'In Stock', value: 'INSTOCK'},{label: 'Low Stock', value: 'LOWSTOCK'},{label: 'Out of Stock', value: 'OUTOFSTOCK'}]

      let sira : Person = new Person("Sira", "W") ;
      let sky : Person = new Person("Sky", "S") ;
      let julia : Person = new Person("Julia", "J") ;

      this.sheet.rows.add(new Row(1, new Date(), sira, [ sky, julia ], "Spar", "Essen", -10.40, this.sheet));
      this.sheet.rows.add(new Row(2, new Date(), sira, [ sira, sky, julia ], "Spar", "Essen", -5, this.sheet));
      this.sheet.rows.add(new Row(2, new Date(), sky, [ sky, julia ], "Spar", "Essen", -6, this.sheet));

      this.sheetDto = this.sheet.calc();
    }

  onRowEditInit(product: Product) {
    if (product.id != undefined) {
      this.clonedProducts[product.id] = {...product};
    }
}

onRowEditSave(product: Product) {
    if (product.id == undefined) {
      product.id = this.productService.getNextId() + "";
    }
    if (product.price != undefined && product.id != undefined && product.price > 0) {
        delete this.clonedProducts[product.id];
        this.messageService.add({severity:'success', summary: 'Success', detail:'Product is updated'});
    }
    else {
        this.messageService.add({severity:'error', summary: 'Error', detail:'Invalid Price'});
    }
}

onRowEditCancel(product: Product, index: number) {
  if (product.id != undefined) {
    this.products2[index] = this.clonedProducts[product.id];
    delete this.products2[+product.id];
  }
}
  newRow() {
    return { id: this.productService.getNextId() + "", code: 'asf', name: 'asf', inventoryStatus: 'INSTOCK', price: '0.3' };
  }

  customSort(event: SortEvent) {

    let rows: Row[] = Array.from(this.sheet.rows);

    rows.sort((data1, data2) => {
      let result = 0;

      if (event.data != null) {
        wth(findFirst(this.sheetDto.cols, (c) => eq(c.id, event.field)), (col) => {
          result = col.sorter(data1.toRowDTO(), data2.toRowDTO());
        });
      }

      return result * wth(event, 1, (e) => e.order);
    });

    this.sheet.rows = new Set(rows);
    this.sheetDto = this.sheet.calc();
	
    event.data = this.sheetDto.rows
  }
}

export interface Car {
  vin: string;
  year: string;
  brand: string;
  color: string;
}
