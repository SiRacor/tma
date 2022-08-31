import { Injectable } from "@angular/core";
import { ColDTO, PersonDTO, RowDTO, SheetDTO } from "common";
import { NullSafe, Stream, Equality } from '../utils';
import { Person, Row, Sheet } from './sheet';
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

    let personDtos : Map<string, PersonDTO> = new Map();


    forEach(this.sheet.persons, (person) => personDtos.set(person.name,
       { id: person.id, letter : person.letter, name : person.name }));

    forEach(this.sheet.rows, (row) => {

      forEach(row.entries, (entry) => {
        total.set(nvl(personDtos.get(entry.target.name)),
         nvl(total.get(nvl(personDtos.get(entry.target.name))), 0) + entry.due)
      });

      let paidFor: PersonDTO[] = toArray(row.paidFor, (val) => this.toPersonDTO(val));

      let rowDto : RowDTO = { id: row.id, date: row.date, paidBy : this.toPersonDTO(row.paidBy),
        paidFor: paidFor, label : row.label, category : row.category, amount : row.amount, results : toMap(row.entries,
           (result) => toEntry(nvl(personDtos.get(result.target.name)), { target: nvl(personDtos.get(result.target.name)), part: result.part, ratio: result.ratio, due: Math.round((result.due + Number.EPSILON) * 100) / 100 } ))
      };

      res.push(rowDto);
    });

    let sum : number = 0;
    let max : { person? : PersonDTO, amount : number } = {
      person: undefined,
      amount: 0
    };

    forEach(total.keys(), (person) => {

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


    cols.push({ id: idGen(), label : "Datum", accessor: (row: RowDTO) => row.date, footer: "", sorter: nbSort((row : RowDTO) => row.date.getMilliseconds()), date: true });
    cols.push({ id: idGen(), label : "Von", accessor: (row: RowDTO) => row.paidBy.letter, footer: "", sorter: stSort((row : RowDTO) => nvl(row.paidBy.letter)) });
    cols.push({ id: idGen(), label : "Für", accessor: (row: RowDTO) => toArray(row.paidFor, (pf) => pf.letter).join(""), footer: "", sorter: stSort((row : RowDTO) => count(row.paidFor) > 0 ? row.paidFor[0].letter : "") });
    cols.push({ id: idGen(), label : "Bezeichnung", accessor: (row: RowDTO) => row.label, footer: "", sorter: stSort((row : RowDTO) => row.label)  });
    cols.push({ id: idGen(), label : "Kategorie", accessor: (row: RowDTO) => row.category, footer: "Summe", sorter: stSort((row : RowDTO) => row.category)   });
    cols.push({ id: idGen(), label : "Betrag", accessor: (row: RowDTO) => row.amount, footer: "", sorter: nbSort((row : RowDTO) => row.amount),  number: true });

    forEach(this.sheet.persons, (person) => {

      let pdto : PersonDTO = nvl(personDtos.get(person.name));

      cols.push({
        id: idGen(),
        label : "",
        accessor: (row: RowDTO) =>
           wth(row.results.get(pdto), "", (rs) => rs.part),
        footer: "",
        sorter: emptSort
      });

      cols.push({
        id: idGen(),
        label : person.name + " (" + person.letter + ")",
        accessor: (row: RowDTO) => wth(row.results.get(pdto), 0, (rs) => rs.due),
        footer: total.get(pdto),
        sorter: nbSort((row : RowDTO) => wth(row.results.get(pdto), 0, (rs) => rs.due)),
        number: true
      });

    });

    return { id: this.sheet.id, persons: Array.from(total.keys()), rows: res, cols: cols, total : total };
  };

  public readSheets(sheetId : number) : SheetDTO[] {
    return Array.of();
  };

  protected toPersonDTO(person: Person): PersonDTO {
    return { id: person.id, name: person.name, letter: person.letter };
  }
}
