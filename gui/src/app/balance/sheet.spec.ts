import { SheetService } from './sheet.service';
import { TestBed } from '@angular/core/testing';
import { Assert } from '../assert';
import { Stream, NullSafe } from '../utils';
import { SheetDAO } from './sheetdao';
import { Sheet, Row } from './sheet';
import { PersonDTO, RowDTO } from 'common';

const { getMatcher, getBool, assertTrue, assertFalse, assertEq, assertNeq} = Assert;
const { findFirst } = Stream;
const { wth } = NullSafe;

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

    let sira : PersonDTO = { id: 1, name: "Sky", letter: "W" } ;
    let sky : PersonDTO = { id: 2, name: "Sira", letter: "S" } ;
    let julia : PersonDTO = { id: 3, name: "Julia", letter: "J" };

    let service: SheetService = new SheetService();
    service.savePerson(sira, 0);
    service.savePerson(sky, 0);
    service.savePerson(julia, 0);

    service.saveRow({ id: 1, date: new Date(), paidBy: sira, paidFor: [sky, julia], label: "Spar", category: "Essen", amount: -10.40 }, 0)
    service.saveRow({ id: 2, date: new Date(), paidBy: sira, paidFor: [sira, sky, julia], label: "Spar", category: "Essen", amount: -5 }, 0)

    let dto = service.read(0)

    assertEq(findFirst(dto.total.entries(), (entry) => entry[0].id == sky.id)[1], 6.86);
    assertEq(findFirst(dto.total.entries(), (entry) => entry[0].id == julia.id)[1], 6.87);
    assertEq(findFirst(dto.total.entries(), (entry) => entry[0].id == sira.id)[1], -13.73);

  });


});
