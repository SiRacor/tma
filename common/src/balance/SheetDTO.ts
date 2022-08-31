import { PersonDTO } from './PersonDTO';
import { RowDTO } from './RowDTO';
import { ColDTO } from './ColDTO';

export interface SheetDTO {
  id: number;
  persons: PersonDTO[];
  rows: RowDTO[];
  cols: ColDTO[];
  total : Map<PersonDTO, number>;
}