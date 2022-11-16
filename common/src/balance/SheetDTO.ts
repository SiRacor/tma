import { PersonDTO } from './PersonDTO';
import { RowDTO } from './RowDTO';
import { ColDTO } from './ColDTO';

export interface SheetDTO {
  id: number;
  persons: PersonDTO[];
  rows: RowDTO[];
  cols: ColDTO[];
  total: Map<PersonDTO, number>;
  uidSheetDto: "uidSheetDto";
}

export class SheetDTO {
  public static is(obj: unknown): obj is SheetDTO {
    return (
      typeof obj === 'object' && obj !== null && 'uidSheetDto' in obj 
    );
  }
  public static create(id: number, persons: PersonDTO[], rows: RowDTO[], cols: ColDTO[], total : Map<PersonDTO, number>): SheetDTO {
    return { id: id, persons: persons, rows: rows, cols: cols, total : total, uidSheetDto : 'uidSheetDto' };
  }
}