
import { SelectItem, SortEvent } from 'primeng/api';;
import { ProductService } from './productservice';
import { Product } from './product';
import { MessageService } from 'primeng/api';
import { Stream, NullSafe, Equality } from '../utils';
import { PersonDTO, RowDTO, SheetDTO } from "common";
import { SheetServiceBD } from './sheet.service.bd';
import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { ResultDTO } from '../../../../common/dist/balance/ResultDTO';

const { findFirst, forEach, toMap, toEntry } = Stream;
const { wth, nsc, emp } = NullSafe;
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

  currentSort? : SortEvent;

  sheetDto!: SheetDTO;

  statuses: SelectItem[] = [];
  clonedProducts: { [s: string]: RowDTO; } = {};

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

    this.sheetDto = this.sheetServiceBD.read(sheetId);
    if (emp(this.sheetDto.rows)) {

      bd.savePerson(julia, sheetId);
      bd.savePerson(sky, sheetId);
      bd.savePerson(sira, sheetId);

      bd.saveRow({ id: 1, date: new Date(), paidBy: sira, paidFor: [sky, julia],
        label: "Spar", category: "Essen", amount: -10.40}, sheetId);

      bd.saveRow({ id: 2, date: new Date(), paidBy: sira, paidFor: [sira, sky, julia],
        label: "Spar", category: "Essen", amount: -5}, sheetId);

      bd.saveRow({ id: 3, date: new Date(), paidBy: sky, paidFor: [sky, julia],
        label: "Spar", category: "Essen", amount: -6}, sheetId);

      this.sheetDto = this.sheetServiceBD.read(sheetId);

    }
  }

  public get personsPlusA() : PersonDTO[]{
    let ret : PersonDTO[] = Array.from(this.sheetDto.persons);
    ret.push({ id: -1, name: "Alle", letter: "A"});
    return ret;
  }

  onRowEditInit(row: RowDTO) {
    if (row.id != undefined) {
      this.clonedProducts[row.id] = {...row};
    }
  }

  onRowNewInit(row: RowDTO): RowDTO {

    let lastRow: RowDTO = null;

    forEach(this.sheetDto.rows, (r) => !nsc(lastRow) || r.id > lastRow.id, (r) => lastRow = r);

    if (!nsc(lastRow)) {
      let results : Map<PersonDTO, ResultDTO> = toMap(this.sheetDto.persons,
        (p) => toEntry(p, <ResultDTO> { target: p, part: "0", ratio: 0, due: 0 }));
      row = { id: 0, date: new Date(), paidBy: null, paidFor: new Array(0),
        results: results, label: "", category: "", amount: 0 };
    }

    if (!nsc(row)) {
      row = lastRow;
    }

    return { id: lastRow.id + 1, date: row.date, paidBy: row.paidBy, paidFor: Array.from(row.paidFor),
      label: row.label, category: row.category, amount: row.amount,
      results: toMap(row.results?.entries(), (e)=> toEntry(e[0], e[1]))};
  }

  onRowEditSave(row: RowDTO) {

    let maxId = 0;
    forEach(this.sheetDto.rows, (r) => r.id > maxId, (r) => maxId = r.id);

    if (row.id == undefined) {
      row.id = ++maxId;
    }
    console.log(row);
    if (row.amount != undefined && row.id != undefined) {
      delete this.clonedProducts[row.id];

      let sheetId = 0;
      let bd = this.sheetServiceBD;

      bd.saveRow(row, sheetId);

      this.messageService.add({severity:'success', summary: 'Success', detail:'Row is updated'});
    }
    else {
        this.messageService.add({severity:'error', summary: 'Error', detail:'Invalid id'});
    }
    this.sheetDto = this.sheetServiceBD.read(0);
    if (this.currentSort) this.customSort(this.currentSort);
}

onRowEditCancel(row: RowDTO, index: number) {
  this.sheetDto = this.sheetServiceBD.read(0);
}
  newRow() {
    return { id: this.productService.getNextId() + "", code: 'asf', name: 'asf', inventoryStatus: 'INSTOCK', price: '0.3' };
  }

  customSort(event: SortEvent) {

    let rows: RowDTO[] = this.sheetDto.rows;
    this.currentSort = event;

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
