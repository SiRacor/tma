import { Component, OnInit } from '@angular/core';
import { SelectItem } from 'primeng/api';;
import { ProductService } from './productservice';
import { Product } from './product';
import { MessageService } from 'primeng/api';
import { Person, Row, Sheet, SheetDTO } from './sheet';

@Component({
  selector: 'app-balance',
  templateUrl: './balance.component.html',
  providers: [MessageService, ProductService],
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

      this.sheet.rows.add(new Row(sira, [ sky, julia ], "Spar", "Essen", -10.40, this.sheet));
      this.sheet.rows.add(new Row(sira, [ sira, sky, julia ], "Spar", "Essen", -5, this.sheet));

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
}

export interface Car {
  vin: string;
  year: string;
  brand: string;
  color: string;
}
