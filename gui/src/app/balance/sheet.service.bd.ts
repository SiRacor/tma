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

  public saveRow(row: RowDTO, sheetId : number) : void {
    this.sheetService.saveRow(row, sheetId);
  };

  public deleteRow(rowId: number, sheetId : number) : void {
    this.sheetService.deleteRow(rowId, sheetId);
  };

  public savePerson(person: PersonDTO, sheetId : number) : void {
    this.sheetService.savePerson(person, sheetId);
  };

  public deletePerson(personId: number, sheetId : number) : void {
    this.sheetService.deletePerson(personId, sheetId);
  };

  public read(sheetId : number) : SheetDTO | null {
    return this.sheetService.read(sheetId);
  };

  public readSheets(sheetId : number) : SheetDTO[] {
    return new Array(0);
  };

}
