import { Injectable } from "@angular/core";
import { ColDTO, ColType, PersonDTO, RowDTO, SheetDTO } from "common";
import { NullSafe, Stream, Equality } from '../utils';
import { Person, Row, Sheet } from './sheet';
import { AccessorDelegate } from 'utils';
const { nsc, nvl, wth } = NullSafe;
const { eq } = Equality;
const { forEach, findFirst, toArray, toMap, toEntry, count } = Stream;

@Injectable()
export class SheetService {

  protected sheet!: Sheet;

  constructor () {

    this.sheet = new Sheet();
    let data: string = localStorage.getItem("polycule balance sheet") + "";

    wth(<SheetDTO> JSON.parse(data), (dto) => {

      this.sheet.id = dto.id;

      forEach(dto.persons, (person) =>
        this.savePerson(person, this.sheet.id)
      );

      forEach(dto.rows, (row) =>
        this.saveRow(row, this.sheet.id)
      );
    });
  }

  public saveRow(rowDto: RowDTO, sheetId : number) : number {

    let persResolver: (persDto: PersonDTO) => Person = (persDto) =>
      nvl(
        findFirst(this.sheet.persons, (pers) => pers.name == persDto.name),
        new Person(persDto.id, persDto.name, persDto.letter)
      );

    let paidBy: Person = persResolver(rowDto.paidBy);
    let paidFor: Person[] = toArray(rowDto.paidFor, persResolver);

    let row : Row = findFirst(this.sheet.rows, (r) => eq(r.id, rowDto.id));

    if (nsc(row)) {
      row.amount = rowDto.amount;
      row.date = rowDto.date;
      row.label = rowDto.label;
      row.category = rowDto.category;
      row.paidBy = rowDto.paidBy;

      forEach(row.paidFor, (pf) => row.removePaidFor(pf));
      forEach(paidFor, (pf) => row.addPaidFor(pf));

    } else {

      row = new Row(rowDto.id, rowDto.date, paidBy, paidFor,
        rowDto.label, rowDto.category, rowDto.amount, this.sheet);

      this.sheet.rows.add(row)
    }

    row.calc();
    return row.id;
  };

  public deleteRow(rowId: number, sheetId : number) : boolean {

    return wth(findFirst(this.sheet.rows, (row) => row.id == rowId), (row) =>

      this.sheet.rows.delete(row)
    );
  };

  public savePerson(personDto: PersonDTO, sheetId : number) : number {

    let person : Person | null =
      findFirst(this.sheet.persons, (pers) => pers.name == personDto.name);

    if (nsc(person)) {

      person.name = personDto.name;
      person.id = personDto.id;

    } else {

      person = new Person(personDto.id, personDto.name, personDto.letter);
      this.sheet.persons.add(person);

    }

    return person.id;
  };

  public deletePerson(personId: number, sheetId : number) : boolean {

    return wth(findFirst(this.sheet.persons, (person) => person.id == personId), (person) =>

      this.sheet.persons.delete(person)
    );
  };

  public read(sheetId : number) : SheetDTO | null {

    let res : RowDTO[] = new Array();
    let cols : ColDTO[] = new Array();
    let total : Map<PersonDTO, number> = new Map();
    let persons : PersonDTO[] = toArray(this.sheet.persons, (pers) => this.toPersonDTO(pers));

    let persById : (id: number) => PersonDTO =
      (id: number) => findFirst(persons, (p) => p.id == id);

    let persByLetter : (letter: string) => PersonDTO =
      (letter: string) => findFirst(persons, (p) => p.letter == letter);

    forEach(this.sheet.rows, (row) => {

      forEach(row.entries, (entry) => {
        total.set(nvl(persById(entry.target.id)),
         nvl(total.get(nvl(persById(entry.target.id))), 0) + entry.due)
      });

      let paidFor: PersonDTO[] = toArray(row.paidFor, (val) => this.toPersonDTO(val));

      let rowDto : RowDTO = { id: row.id, date: row.date, paidBy : this.toPersonDTO(row.paidBy),
        paidFor: paidFor, label : row.label, category : row.category, amount : row.amount, results : toMap(row.entries,
           (result) => toEntry(nvl(persById(result.target.id)), { target: nvl(persById(result.target.id)), part: result.part, ratio: result.ratio, due: Math.round((result.due + Number.EPSILON) * 100) / 100 } ))
      };

      res.push(rowDto);
    });

    let sum : number = 0;
    let max : { person? : PersonDTO, amount : number } = {
      person: undefined,
      amount: 0
    };

    forEach(persons, (person) => {

      let amount : number = nvl(total.get(person), 0);
      let rounded : number = Math.round((amount + Number.EPSILON) * 100) / 100;

      if (max.person == undefined || max.amount < rounded) {
        max = { person : person, amount : rounded };
      }

      sum += rounded;
      total.set(person, rounded);
    });

    if (sum != 0 && max.person) {
      total.set(max.person, max.amount - (sum));
    }

    let emptSort: (row1:RowDTO, row2:RowDTO) => number =
     (row1:RowDTO, row2:RowDTO) => 0;

    let stSort : (gtr: (row: RowDTO) => string) => (row1:RowDTO, row2:RowDTO) => number =
      (gtr) => (row1:RowDTO, row2:RowDTO) => gtr(row1).localeCompare(gtr(row2));

    let nbSort : (gtr: (row: RowDTO) => number) => (row1:RowDTO, row2:RowDTO) => number =
      (gtr) => (row1:RowDTO, row2:RowDTO) => gtr(row1) < gtr(row2) ? -1 : gtr(row1) > gtr(row2) ? 1 : 0;

    let i = 0;
    let idGen: () => string = () => "" + i++;


    cols.push({
      id: idGen(),
      label: 'Datum',
      footer: '',
      sorter: nbSort((row: RowDTO) => row.date.getDate()),
      type: ColType.date,
      editable: true,
      delegate: new AccessorDelegate(
        (row: RowDTO) => row.date,
        (row: RowDTO, value: Date) => row.date = value
      )
    });
    cols.push({
      id: idGen(),
      label: 'Von',
      footer: '',
      sorter: stSort((row: RowDTO) => nvl(row.paidBy.letter)),
      type: ColType.person,
      editable: true,
      delegate: new AccessorDelegate(
        (row: RowDTO) => row.paidBy,
        (row: RowDTO, value: PersonDTO) => row.paidBy = value,
        (row: RowDTO) => row.paidBy.letter,
      )
    });
    cols.push({
      id: idGen(),
      label: 'Für',
      footer: '',
      sorter: stSort((row: RowDTO) =>
        count(row.paidFor) > 0 ? row.paidFor[0].letter : ''
      ),
      type: ColType.persons,
      editable: true,
      delegate: new AccessorDelegate(
        (row: RowDTO) => toArray(row.paidFor, (pf) => pf.letter).join(''),
        (row: RowDTO, value: string) => row.paidFor = toArray(value, (s) => persByLetter(s)),
        (row: RowDTO) => toArray(row.paidFor, (pf) => pf.letter).join(''),
      )
    });
    cols.push({
      id: idGen(),
      label: 'Bezeichnung',
      footer: '',
      sorter: stSort((row: RowDTO) => row.label),
      editable: true,
      delegate: new AccessorDelegate(
        (row: RowDTO) => row.label,
        (row: RowDTO, value: string) => row.label = value
      )
    });
    cols.push({
      id: idGen(),
      label: 'Kategorie',
      footer: 'Summe',
      sorter: stSort((row: RowDTO) => row.category),
      editable: true,
      delegate: new AccessorDelegate(
        (row: RowDTO) => row.category,
        (row: RowDTO, value: string) => row.category = value
      )
    });
    cols.push({
      id: idGen(),
      label: 'Betrag',
      footer: '',
      sorter: nbSort((row: RowDTO) => row.amount),
      type: ColType.number,
      editable: true,
      delegate: new AccessorDelegate(
        (row: RowDTO) => row.amount,
        (row: RowDTO, value: number) => row.amount = value
      )
    });

    forEach(this.sheet.persons, (person) => {

      let pdto : PersonDTO = nvl(persById(person.id));

      cols.push({
        id: idGen(),
        label : "",
        footer: "",
        sorter: emptSort,
        delegate: new AccessorDelegate(
          (row: RowDTO) => wth(row.results.get(pdto), "", (rs) => rs.part)
        )
      });

      cols.push({
        id: idGen(),
        label : person.name + " (" + person.letter + ")",
        footer: total.get(pdto),
        sorter: nbSort((row : RowDTO) => wth(row.results.get(pdto), 0, (rs) => rs.due)),
        type: ColType.number,
        delegate: new AccessorDelegate(
          (row: RowDTO) => wth(row.results.get(pdto), "", (rs) => rs.due)
        )
      });

    });

    return { id: this.sheet.id, persons: persons, rows: res, cols: cols, total : total };
  };

  public readSheets(sheetId : number) : SheetDTO[] {
    return Array.of();
  };

  protected toPersonDTO(person: Person): PersonDTO {
    return { id: person.id, name: person.name, letter: person.letter };
  }
}
