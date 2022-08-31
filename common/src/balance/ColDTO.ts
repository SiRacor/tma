import { RowDTO } from "./RowDTO";

export interface ColDTO {
  id: string,
  label: string, accessor: (row: RowDTO) => any, footer: any,
  sorter: (row1:RowDTO, row2:RowDTO) => number,
  number?: boolean, date?: boolean
}