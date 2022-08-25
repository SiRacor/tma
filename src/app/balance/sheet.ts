import { Equality, NullSafe, Stream } from '../utils';

const { eq } = Equality;
const { nsc, nvl, nvle, wth } = NullSafe;
const { forEach, anyMatch, count, toEntry, toMap } = Stream;

export class Sheet {

  constructor(public persons : Set<Person> = new Set(), public rows : Set<Row> = new Set()) {
    this.persons = persons;
    this.rows = rows;
  }

  public calc() : SheetDTO {

    let res : RowDTO[] = new Array();
    let cols : ColDTO[] = new Array();
    let total : Map<Person, number> = new Map();

    cols.push({ label : "Bezeichnung", accessor: (row: RowDTO) => row.label });
    cols.push({ label : "Kategorie", accessor: (row: RowDTO) => row.category });
    cols.push({ label : "Betrag", accessor: (row: RowDTO) => row.amount });

    forEach(this.persons, (person) => {

      cols.push({
        label : "",
        accessor: (row: RowDTO) =>
           wth(row.results.get(person), "", (rs) => rs.part)
      });

      cols.push({
        label : person.name,
        accessor: (row: RowDTO) => wth(row.results.get(person), 0, (rs) => rs.due)
      });

    });

    let i = 0;
    forEach(this.rows, (row) => {

      res.push({ id: i, paidBy : row.paidBy, label : row.label, category : row.category,
        amount : row.amount, results : toMap(row.entries, (result) => toEntry(result.target, result))
      });

      forEach(row.entries, (entry) =>
        total.set(entry.target, nvl(total.get(entry.target), 0) + entry.due)
      );
    });

    let sum : number = 0;
    let max : { person? : Person, amount : number } = {
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

    return { rows: res, cols: cols, total : total };
  }
}

export class Person {

  letter?: string;

  public constructor(name: String);

  public constructor(name: string, letter: string);

  public constructor(
    public name: string,
    letter?: string
  ) {
    this.name = name;
    this.letter = nvle(name.toUpperCase(), letter, 'Z')?.charAt(0);
  }
}

export class Row {

  private readonly _entries: Set<Result>;
  private readonly _sheet: Sheet;
  private _amount: number;
  private readonly _paidFor: Person[];

  public get entries(): Set<Result> {
    return this._entries;
  }

  public get sheet(): Sheet {
    return this._sheet;
  }

  public get amount(): number {
    return this._amount;
  }
  public set amount(value: number) {
    this._amount = value;
    this.calc();
  }

  public get paidFor(): IterableIterator<Person> {
    return this._paidFor.values();
  }

  public addPaidFor(person : Person) : void {
    if (nsc(person)) {
      this._paidFor.push(person);
      this.calc();
    }
  }

  public removePaidFor(person : Person) : void {
    if (nsc(person)) {
      const index: number = this._paidFor.indexOf(person);
      if (index !== -1) {
          this._paidFor.splice(index, 1);
          this.calc();
      }
    }
  }

  public constructor(
      public readonly paidBy: Person,
      paidFor: Person[],
      public readonly label: string,
      public readonly category: string,
      amount: number, sheet: Sheet) {

    this._amount = amount;
    this._sheet = sheet;
    this.paidBy = paidBy;
    this.label = label;
    this.category = category;
    this._paidFor = nvl(paidFor, new Array(0));
    this._entries = new Set();
    this.calc();
  }

  public calc() : void {

    this.entries.clear();
    let self : boolean = anyMatch(this.paidFor, (pf) => eq(pf, this.paidBy));
    let cntPf : number = count(this.paidFor);

    this.addToSheet(this.paidBy);

    if (!self) {
      this.entries.add({ target : this.paidBy, part: "1", ratio: 1,  due: this.amount });
    }

    forEach(this.paidFor, (pf) => {

      this.addToSheet(pf);

      let a : number = 0;
      let b : number = cntPf;

      if (eq(pf, this.paidBy)) {
        a = (cntPf - 1);
      } else {
        a = -1
      }

      this.entries.add({ target : pf, part: a + "/" + b, ratio: a / b,  due: this.amount * a / b});
    })
  }

  private addToSheet(pers : Person) : void {
    if (!anyMatch(this.sheet.persons, (p) => p == pers)) {
      this.sheet.persons.add(pers);
      this
    }
  }

}

export interface Result {
  target: Person, part: string, ratio: number, due: number
}

export interface RowDTO {
  id:number; paidBy : Person, label : string, category : string, amount: number, results: Map<Person, Result>
}

export interface ColDTO {
  label: string, accessor: (row: RowDTO) => any
}

export interface SheetDTO {
  rows: RowDTO[];
  cols: ColDTO[];
  total : Map<Person, number>;
}
