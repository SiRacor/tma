import { Injectable } from "@angular/core";
import { SheetDTO } from "common";

export interface IStore {
  load(): void;
  store(): void;
  save(sheet: SheetDTO) : number | null;
  read(id: number) : SheetDTO | null;
  readAll() : SheetDTO[] | null;
}
