import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeDeExtra from '@angular/common/locales/extra/de';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ColDTO, PersonDTO, RowDTO } from "common";
import { ConfirmationService, MenuItem, MessageService, SelectItem, SortEvent } from 'primeng/api';
import { Table } from 'primeng/table';
import { DateTime, Equality, NullSafe, Stream } from 'utils';
import { SheetService } from '../balance/service/sheet.service';

const { findFirst, forEach, toMap, toEntry, toArray, tryGet } = Stream;
const { wth, nsc, emp, nvl } = NullSafe;
const { eq } = Equality;
const { ddDmmDyyyy } = DateTime;


@Component({
  selector: 'app-persons',
  templateUrl: './persons.component.html',
  providers: [MessageService, SheetService, ConfirmationService],
  styleUrls: ['./persons.component.css']
})
export class PersonsComponent implements OnInit {


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

    this.personMenuItems = [
      {label: 'Bearbeite', icon: 'pi pi-fw pi-check', command: () => this.onPersonEditInit(this.selectedPerson)},
      {label: 'L\u00f6sche', icon: 'pi pi-fw pi-times', command: () => this.onItemDelete(this.selectedPerson)}
    ];

    let bd = this.sheetService;
    this.readSheet();

    registerLocaleData(localeDe, 'de-DE', localeDeExtra);
  }

  public get personsPlusA() : PersonDTO[]{
    let ret : PersonDTO[] = Array.from(this.persons);
    ret.push({ id: -1, name: "Alle", letter: "A"});
    return ret;
  }

  @ViewChild('dt1', {static: false}) private personTable: Table;


  onPersonEditInit(person: PersonDTO) {
    this.personTable.initRowEdit(person);
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

  onItemDelete(item: PersonDTO) : void;
  onItemDelete(item: PersonDTO, confirmed: boolean) : void ;
  onItemDelete(item: PersonDTO, confirmed?: boolean) : void {

    const accept = () => {
      if (this.sheetService.deletePerson(item.id, this.sheetId)) {
        this.messageService.add({severity: 'info', summary: 'Eintrag wurde gel\u00f6scht.', detail: JSON.stringify(item)});
        this.readSheet();
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
    } else {
      this.sheetId = null;
      this.persons = [];
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
    if (this.currentSort) this.oncustomSort(this.currentSort);
}

  onItemEditCancel(item: any, index: number) {
    this.readSheet();
  }

  oncustomSort(event: SortEvent) {

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
}
