import { RowDTO } from "./RowDTO";
import { AccessorDelegate } from 'utils';
import { ColType } from "./ColType";

export interface ColDTO {
  id: string,
  label: string,
  footer: any,
  sorter: (row1:RowDTO, row2:RowDTO) => number,
  editable?: boolean,
  type? : ColType,
  delegate: AccessorDelegate<RowDTO, any, any>;
}