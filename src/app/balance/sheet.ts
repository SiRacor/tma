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

    forEach(this.rows, (row) => {

      forEach(row.entries, (entry) => {
        total.set(entry.target, nvl(total.get(entry.target), 0) + entry.due)
      });

      res.push(row.toRowDTO());
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
    cols.push({ id: idGen(), label : "Für", accessor: (row: RowDTO) => row.paidFor, footer: "", sorter: stSort((row : RowDTO) => nvl(row.paidFor)) });
    cols.push({ id: idGen(), label : "Bezeichnung", accessor: (row: RowDTO) => row.label, footer: "", sorter: stSort((row : RowDTO) => row.label)  });
    cols.push({ id: idGen(), label : "Kategorie", accessor: (row: RowDTO) => row.category, footer: "Summe", sorter: stSort((row : RowDTO) => row.category)   });
    cols.push({ id: idGen(), label : "Betrag", accessor: (row: RowDTO) => row.amount, footer: "", sorter: nbSort((row : RowDTO) => row.amount),  number: true });
	
	
	
    forEach(this.persons, (person) => {

      cols.push({
        id: idGen(),
        label : "",
        accessor: (row: RowDTO) =>
           wth(row.results.get(person), "", (rs) => rs.part),
        footer: "",
        sorter: emptSort
      });

      cols.push({
        id: idGen(),
        label : person.name + " (" + person.letter + ")",
        accessor: (row: RowDTO) => wth(row.results.get(person), 0, (rs) => rs.due),
        footer: total.get(person),
        sorter: nbSort((row : RowDTO) => wth(row.results.get(person), 0, (rs) => rs.due)),
        number: true
      });

    });

    return { persons: Array.from(total.keys()), rows: res, cols: cols, total : total };
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
    this.letter = nvle(letter, name.toUpperCase(), 'Z')?.charAt(0);
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
      public readonly id: number,
      public date: Date,
      public readonly paidBy: Person,
      paidFor: Person[],
      public readonly label: string,
      public readonly category: string,
      amount: number, sheet: Sheet) {

    this.id = id;
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
      this.entries.add({ target : this.paidBy, part: "-1", ratio: 1,  due: this.amount });
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

      this.entries.add({ target : pf, part: (a* -1) + "/" + b, ratio: a / b,  due: this.amount * a / b});
    })
  }

  private addToSheet(pers : Person) : void {
    if (!anyMatch(this.sheet.persons, (p) => p == pers)) {
      this.sheet.persons.add(pers);
      this
    }
  }

  public toRowDTO() : RowDTO {
    let row: Row = this;
    let paidFor : string = "";

    forEach(row.entries, (entry) => {
      if (entry.ratio != 1) {
        paidFor = paidFor + "" + entry.target.letter
      }
    });

    return { id: row.id, date: row.date, paidBy : row.paidBy, paidFor: paidFor, label : row.label, category : row.category,
      amount : row.amount, results : toMap(row.entries,
         (result) => toEntry(result.target, { target: result.target, part: result.part, ratio: result.ratio, due: Math.round((result.due + Number.EPSILON) * 100) / 100 } ))
    };
  }

}

export interface Result {
  target: Person, part: string, ratio: number, due: number
}

export interface RowDTO {
  id:number, date: Date, paidBy : Person, paidFor : string, label : string, category : string, amount: number, results: Map<Person, Result>
}

export interface ColDTO {
  id: string,
  label: string, accessor: (row: RowDTO) => any, footer: any,
  sorter: (row1:RowDTO, row2:RowDTO) => number,
  number?: boolean, date?: boolean
}

export interface SheetDTO {
  persons: Person[];
  rows: RowDTO[];
  cols: ColDTO[];
  total : Map<Person, number>;
}
