import { Directive, Injectable } from "@angular/core";
import { PersonDTO, RowDTO, SheetDTO } from "common";
import { SheetService } from './sheet.service';

@Injectable({
  providedIn: 'root'
})
@Directive({
  providers: [SheetServiceBD]
})
export class SheetServiceBD {

  constructor (public sheetService: SheetService) {
    this.sheetService = new SheetService();
  }

  public saveRow(row: RowDTO, sheetId : number, idx?: number) : number {
    return this.sheetService.saveRow(row, sheetId, idx);
  };

  public deleteRow(rowId: number, sheetId : number) : boolean {
    return this.sheetService.deleteRow(rowId, sheetId);
  };

  public savePerson(person: PersonDTO, sheetId : number, idx?: number) : number {
    return this.sheetService.savePerson(person, sheetId, idx);
  };

  public deletePerson(personId: number, sheetId : number) : boolean {
    return this.sheetService.deletePerson(personId, sheetId);
  };

  public read(sheetId : number) : SheetDTO | null {
    return this.sheetService.read(sheetId);
  };

  public readSheets(sheetId : number) : SheetDTO[] {
    return new Array(0);
  };

}
