import { LocalStore } from './local.store';
import { Injectable } from "@angular/core";
import { SheetDTO } from "common";
import { IStore } from './i.store';

@Injectable({
  providedIn: 'root'
})
export class StoreBD {

  private actual: IStore

  constructor () {
    this.actual = new LocalStore();
  }

  load(): void {
    this.actual.load();
  }
  store(): void {
    this.actual.store();
  }
  save(sheet: SheetDTO): number | null {
    return this.actual.save(sheet);
  }
  read(id: number): SheetDTO | null {
    return this.actual.read(id);
  }
  readAll(): SheetDTO[] | null {
    return this.actual.readAll();
  }
}
