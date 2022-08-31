
import { SelectItem, SortEvent } from 'primeng/api';;
import { ProductService } from './productservice';
import { Product } from './product';
import { MessageService } from 'primeng/api';
import { Stream, NullSafe, Equality } from '../utils';
import { PersonDTO, RowDTO, SheetDTO } from "common";
import { SheetServiceBD } from './sheet.service.bd';
import { Component } from '@angular/core';
import { OnInit } from '@angular/core';

const { findFirst } = Stream;
const { wth } = NullSafe;
const { eq } = Equality;


@Component({
  selector: 'app-balance',
  templateUrl: './balance.component.html',
  providers: [MessageService, ProductService, SheetServiceBD ],
  styleUrls: ['./balance.component.css']
})
export class BalanceComponent implements OnInit {

  products1: Product[] = [];

  products2: Product[] = [];

  sheetDto!: SheetDTO;

  statuses: SelectItem[] = [];
  clonedProducts: { [s: string]: Product; } = {};

  constructor(public productService: ProductService, private messageService: MessageService,
    private sheetServiceBD : SheetServiceBD) { }

  ngOnInit() {
    this.productService.getProductsSmall().then(data => this.products1 = data);
    this.productService.getProductsSmall().then(data => this.products2 = data);

    this.statuses = [{label: 'In Stock', value: 'INSTOCK'},{label: 'Low Stock', value: 'LOWSTOCK'},{label: 'Out of Stock', value: 'OUTOFSTOCK'}]

    let julia : PersonDTO = { id: 1, name: "Julia", letter: "J" };
    let sky : PersonDTO = { id: 2, name: "Sky", letter: "S" };
    let sira : PersonDTO = { id: 3, name: "Sira", letter: "W" };

    let bd = this.sheetServiceBD;
    let sheetId = 0;

    bd.savePerson(julia, sheetId);
    bd.savePerson(sky, sheetId);
    bd.savePerson(sira, sheetId);

    bd.saveRow({ id: 1, date: new Date(), paidBy: sira, paidFor: [sky, julia],
      label: "Spar", category: "Essen", amount: -10.40}, sheetId);

    bd.saveRow({ id: 2, date: new Date(), paidBy: sira, paidFor: [sira, sky, julia],
      label: "Spar", category: "Essen", amount: -5}, sheetId);

    bd.saveRow({ id: 3, date: new Date(), paidBy: sky, paidFor: [sky, julia],
      label: "Spar", category: "Essen", amount: -6}, sheetId);

    this.sheetDto = this.sheetServiceBD.read(0);
    if (this.sheetDto) console.log(this.sheetDto);
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

    let rows: RowDTO[] = this.sheetDto.rows;

    rows.sort((data1, data2) => {
      let result = 0;

      if (event.data != null) {
        wth(findFirst(this.sheetDto.cols, (c) => eq(c.id, event.field)), (col) => {
          result = col.sorter(data1, data2);
        });
      }

      return result * wth(event, 1, (e) => e.order);
    });

    event.data = this.sheetDto.rows
  }
}
