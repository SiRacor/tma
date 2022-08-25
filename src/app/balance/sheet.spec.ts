import { TestBed } from '@angular/core/testing';
import { Assert } from '../assert';
import { SheetDAO } from './sheetdao';
import { Sheet, Row, Person, SheetDTO } from './sheet';

const { getMatcher, getBool, assertTrue, assertFalse, assertEq, assertNeq} = Assert;

describe('SheetdaoService', () => {
  let service: SheetDAO;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SheetDAO);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });


  it('Sheet', () => {

    let sira : Person = new Person("Sira", "W") ;
    let sky : Person = new Person("Sky", "S") ;
    let julia : Person = new Person("Julia", "J") ;

    let sheet : Sheet = new Sheet(new Set([julia, sky, sira]));

    sheet.rows.add(new Row(sira, [ sky, julia ], "Spar", "Essen", -10.40, sheet));
    sheet.rows.add(new Row(sira, [ sira, sky, julia ], "Spar", "Essen", -5, sheet));

    let dto = sheet.calc();

    assertEq(dto.total.get(julia), 6.87);
    assertEq(dto.total.get(sky), 6.86);
    assertEq(dto.total.get(sira), -13.73);

  });


});
