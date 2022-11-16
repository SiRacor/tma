import { SheetDTO } from 'common';
import { NullSafe, Stream } from 'utils';
import { IStore } from "./i.store";
const { nsc, emp } = NullSafe;
const { forEach, toArray } = Stream;

export class LocalStore implements IStore {

  public static readonly STORAGE_ID: string = "polycule balance sheet";
  protected map: Map<number, SheetDTO> = new Map();

  constructor () {
  }

  public load(): void {

    let sheets: SheetDTO[] = [];
    let data: string = localStorage.getItem(LocalStore.STORAGE_ID) + "";

    forEach(JSON.parse(data), (sheet) => sheets.push(<SheetDTO> sheet));
    forEach(sheets, (sheet) => nsc(sheet.id), (sheet) => this.map.set(sheet.id, sheet));
  }

  public store() : void {

    forEach(this.map.values(), (sheet: SheetDTO) => {
      sheet.cols = new Array();
      sheet.total = new Map();

      forEach(sheet.rows, (r) => r.results = new Map());
    });

    let data = JSON.stringify(toArray(this.map.values(), (sheet) => sheet));
    localStorage.setItem(LocalStore.STORAGE_ID, data);
  }

  public save(sheet: SheetDTO) : number | null {

    let ret: number = null;

    if (!nsc(sheet.id)) {

      sheet.id = 0;

      forEach(this.map.values(), (s) => s.id > sheet.id, (s => sheet.id = s.id));
      this.map.set(sheet.id, sheet);

      ret = sheet.id
    } else {
      this.map.set(sheet.id, sheet);
    }

    this.store();
    return ret;
  }

  public read(id: number) : SheetDTO | null {
    if (emp(this.map.values())) this.load();
    return (this.map.has(id) ? this.map.get(id) : null);
  }

  public readAll() : SheetDTO[] | null {
    if (emp(this.map.values())) this.load();
    return toArray(this.map.values(), (s: SheetDTO) => s);
  }
}
