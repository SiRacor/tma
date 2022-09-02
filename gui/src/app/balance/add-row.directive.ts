import { Directive, Input, HostListener } from '@angular/core';
import { Table } from 'primeng/table';
import { NullSafe } from '../utils';
const { nsc } = NullSafe;


@Directive({
  selector: '[pAddRow]'

})
export class AddRowDirective {
  @Input() table: Table | any;
  @Input() newRow: any;
  @Input() belowOf: any;

  @HostListener('click', ['$event'])
  onClick(event: Event) {

    // Insert a new row
    let values : any[] = <any[]>this.table.value;
    console.log(this.belowOf);

    if (!nsc(this.belowOf)) {
      values.push(this.newRow);
    } else {
      values.splice(this.belowOf + 1, 0, this.newRow);
    }

    // Set the new row in edit mode
    this.table.initRowEdit(this.newRow);

    event.preventDefault();
  }
}

