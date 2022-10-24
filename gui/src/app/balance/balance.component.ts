import { SelectItem, SortEvent, MenuItem, MessageService, ConfirmationService } from 'primeng/api';;
import { Stream, NullSafe, Equality, DateTime } from 'utils'
import { PersonDTO, RowDTO, ColDTO, ResultDTO } from "common";
import { Component, ViewChild } from '@angular/core';
import { OnInit } from '@angular/core';
import { Table } from 'primeng/table';
import * as FileSaver from 'file-saver';
import { Papa, ParseConfig, UnparseConfig } from 'ngx-papaparse';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeDeExtra from '@angular/common/locales/extra/de';
import { FileUpload } from 'primeng/fileupload';
import { SheetService } from './service/sheet.service';

const { findFirst, forEach, toMap, toEntry, toArray, tryGet } = Stream;
const { wth, nsc, emp, nvl } = NullSafe;
const { eq } = Equality;
const { ddDmmDyyyy } = DateTime;


@Component({
  selector: 'app-balance',
  templateUrl: './balance.component.html',
  providers: [MessageService, SheetService, ConfirmationService],
  styleUrls: ['./balance.component.css']
})
export class BalanceComponent implements OnInit {

  currentSort? : SortEvent;

  sheetId!: number;
  cols!: ColDTO[];
  maxSize: 100000
  rows!: RowDTO[];
  persons!: PersonDTO[];

  rowMenuItems: MenuItem[];
  personMenuItems: MenuItem[];

  selectedRow: RowDTO;
  selectedPerson: PersonDTO;

  statuses: SelectItem[] = [];
  uploadedFiles: any[] = [];

  constructor(private messageService: MessageService,
    private sheetService : SheetService, private confirmationService: ConfirmationService) { }

  ngOnInit() {
    this.rowMenuItems = [
      {label: 'Kopiere', icon: 'pi pi-fw pi-copy', command: () => this.onRowCopy(this.selectedRow)},
      {label: 'Bearbeite', icon: 'pi pi-fw pi-check', command: () => this.onRowEditInit(this.selectedRow)},
      {label: 'L\u00f6sche', icon: 'pi pi-fw pi-times', command: () => this.onItemDelete(this.selectedRow)}
    ];

    this.personMenuItems = [
      {label: 'Bearbeite', icon: 'pi pi-fw pi-check', command: () => this.onPersonEditInit(this.selectedPerson)},
      {label: 'L\u00f6sche', icon: 'pi pi-fw pi-times', command: () => this.onItemDelete(this.selectedPerson)}
    ];

    this.statuses = [{label: 'In Stock', value: 'INSTOCK'},{label: 'Low Stock', value: 'LOWSTOCK'},{label: 'Out of Stock', value: 'OUTOFSTOCK'}]

    let julia : PersonDTO = { id: 1, name: "Julia", letter: "J" };
    let sky : PersonDTO = { id: 2, name: "Sky", letter: "S" };
    let sira : PersonDTO = { id: 3, name: "Sira", letter: "W" };

    let bd = this.sheetService;

    this.readSheet();
    if (emp(this.rows)) {

      bd.savePerson(julia, this.sheetId);
      bd.savePerson(sky, this.sheetId);
      bd.savePerson(sira, this.sheetId);

      bd.saveRow({ id: 1, date: new Date(), paidBy: sira, paidFor: [sky, julia],
        label: "Spar", category: "Essen", amount: -10.40}, this.sheetId);

      bd.saveRow({ id: 2, date: new Date(), paidBy: sira, paidFor: [sira, sky, julia],
        label: "Spar", category: "Essen", amount: -5}, this.sheetId);

      bd.saveRow({ id: 3, date: new Date(), paidBy: sky, paidFor: [sky, julia],
        label: "Spar", category: "Essen", amount: -6}, this.sheetId);

      this.readSheet();
    }

    registerLocaleData(localeDe, 'de-DE', localeDeExtra);
  }

  public get personsPlusA() : PersonDTO[]{
    let ret : PersonDTO[] = Array.from(this.persons);
    ret.push({ id: -1, name: "Alle", letter: "A"});
    return ret;
  }

  @ViewChild('dt', {static: false}) private rowTable: Table;
  @ViewChild('dt1', {static: false}) private personTable: Table;

  onRowCopy(row: RowDTO) {
    let copy : RowDTO = this.onRowNewInit(row);
    let values : any[] = <any[]>this.rowTable.value;

    let index = values.length;

    for (let i = 0; i < values.length; i++){
      if (values[i].id === row.id) {
        index = i + 1;
        break;
      }
    }

    values.splice(index, 0, copy);
    this.rowTable.initRowEdit(copy);
  }

  onRowEditInit(row: RowDTO) {
    this.rowTable.initRowEdit(row);
  }

  onPersonEditInit(person: PersonDTO) {
    this.personTable.initRowEdit(person);
  }

  onRowNewInit(row: RowDTO): RowDTO {
    let lastRow: RowDTO = null;

    forEach(this.rows, (r) => !nsc(lastRow) || r.id > lastRow.id, (r) => lastRow = r);
    let id = 0;

    if (!nsc(lastRow)) {
      let results : Map<PersonDTO, ResultDTO> = toMap(this.persons,
        (p) => toEntry(p, <ResultDTO> { target: p, part: "0", ratio: 0, due: 0 }));
      row = { id: 0, date: new Date(), paidBy: null, paidFor: new Array(0),
        results: results, label: "", category: "", amount: 0 };
    } else {
      id = lastRow.id;
    }

    if (!nsc(row)) {
      row = lastRow;
    }

    return { id: id + 1, date: row.date, paidBy: row.paidBy, paidFor: Array.from(row.paidFor),
      label: row.label, category: row.category, amount: row.amount,
      results: toMap(row.results?.entries(), (e)=> toEntry(e[0], {target: e[1].target, due: 0, ratio: 1, part: ""} ))};
  }

  onPersonNewInit(person: PersonDTO) : PersonDTO {

    let lastPerson: PersonDTO = null;
    forEach(this.persons,
      (p) => !nsc(lastPerson) || p.id > lastPerson.id,
      (p) => lastPerson = p
    );

    let id : number = 0;

    if (nsc(lastPerson)) {
      id = lastPerson.id;
    }

    return { id: id + 1, name: "", letter: ""};
  }

  onRowReorder(event: { dragIndex: number; dropIndex: number }) {

    if (!nsc(event) || eq(event.dragIndex, event.dropIndex))
    return;

    let a = this.persons[event.dropIndex];
    let idx = event.dropIndex;
    this.messageService.add({severity: 'warn', detail: JSON.stringify(event) + JSON.stringify(a)});

    this.sheetService.savePerson(a, this.sheetId, idx);

    this.readSheet();
  }

  onItemDelete(item: PersonDTO) : void;
  onItemDelete(item: PersonDTO, confirmed: boolean) : void;
  onItemDelete(item: RowDTO) : void;
  onItemDelete(item: RowDTO, confirmed: boolean) : void;
  onItemDelete(item: RowDTO | PersonDTO | any, confirmed?: boolean) : void {

    const accept = () => {
      if (item.letter && this.sheetService.deletePerson(item.id, this.sheetId) ||
          item.date && this.sheetService.deleteRow(item.id, this.sheetId)) {
        this.messageService.add({severity: 'info', summary: 'Eintrag wurde gel\u00f6scht.', detail: JSON.stringify(item)});
        this.readSheet();
        if (this.currentSort) this.customSort(this.currentSort);
      }
    }

    if (confirmed) {
      accept();
    } else {
      this.confirmationService.confirm({
        message: 'Auswahl wirklich l\u00f6schen?',
        header: 'L\u00f6schen',
        icon: 'pi pi-exclamation-triangle',
        accept: accept
      });
    }
  }

  readSheet(): void {
    let sheetDto = this.sheetService.read(nvl(this.sheetId, 0));
    if (nsc(sheetDto)) {
      this.sheetId = sheetDto.id;
      this.persons = sheetDto.persons;
      this.rows = sheetDto.rows;
      this.cols = sheetDto.cols;
    } else {
      this.sheetId = null;
      this.persons = [];
      this.rows = [];
      this.cols = [];
    }

    /**
     *
    id: string;
    label: string;
    footer: any;
    sorter: (row1: RowDTO, row2: RowDTO) => number;
    editable?: boolean;
    type?: ColType;
    delegate: AccessorDelegate<RowDTO, any, any>;
     */
  }


  onItemEditSave(item: PersonDTO, idx: number) : void;
  onItemEditSave(item: RowDTO, idx: number) : void;
  onItemEditSave(item: RowDTO | PersonDTO | any, idx: number) : void {

    let bd = this.sheetService;

    if (item.letter) {

      let person: PersonDTO = item;

      bd.savePerson(person, this.sheetId);

      this.messageService.add({severity:'success', summary: 'Erfolg', detail:'Person wurde gespeichert!'});

    } else if (item.date) {

      let row: RowDTO = item;
      let maxId = 0;
      forEach(this.rows, (r) => r.id > maxId, (r) => maxId = r.id);

      if (row.id == undefined) {
        row.id = ++maxId;
      }

      if (row.amount != undefined && row.id != undefined) {

        bd.saveRow(row, this.sheetId, idx);

        this.messageService.add({severity:'success', summary: 'Erfolg', detail:'Daten wurden gespeichert!'});
      }
      else {
          this.messageService.add({severity:'error', summary: 'Fehler', detail:'Flasche ID'});
      }

    }

    this.readSheet();
    if (this.currentSort) this.customSort(this.currentSort);
}

  onItemEditCancel(item: any, index: number) {
    this.readSheet();
  }

  customSort(event: SortEvent) {

    let rows: RowDTO[] = this.rows;
    this.currentSort = event;

    rows.sort((data1, data2) => {
      let result = 0;

      if (event.data != null) {
        wth(findFirst(this.cols, (c) => eq(c.id, event.field)), (col) => {
          result = col.sorter(data1, data2);
        });
      }

      return result * wth(event, 1, (e) => e.order);
    });

    event.data = this.rows
  }

  saveToFile(): void {

    let lines: Object[][] = [];

    const papa = new Papa();
    const conf : UnparseConfig = {
      delimiter: ";",
      quoteChar: '"',
      quotes: true,
      header: false
    };

    lines = lines.concat(toArray(this.persons,
      (p) => ["PE", p.name, p.letter]
    ));

    const rowToData = (r: RowDTO) => {

      let data = ["VR", ddDmmDyyyy(r.date), r.paidBy.letter,
          toArray(r.paidFor, (pf) => pf.letter).join(""), r.amount, r.label, r.category]

      forEach(this.persons,
        (p) => data = data.concat(wth(r.results.get(p), ["", ""], (rs) => [rs.part, rs.due]))
      )

      return data;
    }

    lines = lines.concat(toArray(this.rows,
      (row) => rowToData(row)
    ));

    const blob = new Blob([papa.unparse(lines, conf)], {
      type: "text/plain;charset=utf-8"
    });

    FileSaver.saveAs(blob, 'data-export '
      + DateTime.yyyymmdd_hhmmss(new Date()) + ".csv");
  }

  @ViewChild('fu', {static: false}) fileUpload: FileUpload;

  readFromFile(event: { files: any; }) {

    for (let file of event.files) {
        this.uploadedFiles.push(file);
    }

    event.files = [];

    const papa = new Papa();
    const conf : ParseConfig = {
      delimiter: ";",
      quoteChar: '"',
      header: false
    };

    for (var index = 0; index < this.uploadedFiles.length; index++) {
      let reader = new FileReader();
      reader.onload = () => {

        const pres = papa.parse(wth(reader.result, "", (r) => r.toString()), conf);
        const persons: Map<string, PersonDTO> = new Map();

        console.log(reader.result);

        forEach(<string[]> pres.data,

          (line) => eq(tryGet(line, 0), "PE"),
          (line) => {

            const person: PersonDTO = {
              id: null,
              name:tryGet(line, 1),
              letter:tryGet(line, 2)
            };

            persons.set(person.letter, person);
            wth(this.sheetService.savePerson(person, this.sheetId),
             (id) => person.id = id
            );
          }
        );

        forEach(<string[]> pres.data,

          (line) => eq(tryGet(line, 0), "VR"),
          (line) => {

            const row: RowDTO = {
              id: null,
              date: ddDmmDyyyy(tryGet(line, 1)),
              paidBy: nvl(persons.get(tryGet(line, 2))),
              paidFor: toArray(tryGet(line, 3), (pf) => nvl(persons.get(pf))),
              amount: new Number(tryGet(line, 4)).valueOf(),
              label: tryGet(line, 5),
              category: tryGet(line, 6)
            };

            this.sheetService.saveRow(row, this.sheetId);
          }
        );

        this.readSheet();
        this.fileUpload.clear();

        this.messageService.add({severity: 'info', summary: 'File Uploaded', detail: ''});
      }

      reader.readAsText(this.uploadedFiles[index]);
    };

    this.uploadedFiles = [];

  }
}
