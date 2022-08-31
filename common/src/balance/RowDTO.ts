import { PersonDTO } from "./PersonDTO";
import { ResultDTO } from "./ResultDTO";

export interface RowDTO {
  id:number, date: Date, paidBy : PersonDTO, paidFor : PersonDTO[], label : string, category : string, amount: number, results?: Map<PersonDTO, ResultDTO>
}