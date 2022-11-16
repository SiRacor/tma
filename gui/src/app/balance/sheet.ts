import { SheetService } from './service/sheet.service';
import { Equality, NullSafe, Stream } from "utils";

const { eq, neq } = Equality;
const { nsc, nvl, nvle, wth } = NullSafe;
const { forEach, anyMatch, count, toEntry, toMap, filter, toSet } = Stream;

export class Sheet {

  constructor(public id : number  = 0, public persons : Set<Person> = new Set(), public rows : Set<Row> = new Set()) {
    this.id = id;
    this.persons = persons;
    this.rows = rows;
  }
}

export class Person {

  letter?: string;

  public constructor(id: number, name: string);

  public constructor(id: number, name: string, letter: string);

  public constructor(
    public id: number,
    public name: string,
    letter?: string
  ) {
    this.id = id;
    this.name = name;
    this.letter = nvle(letter, nvle(name.toUpperCase(), 'Z')?.charAt(0));
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
  }

  public get paidFor(): IterableIterator<Person> {
    return this._paidFor.values();
  }

  public addPaidFor(person : Person) : void {
    if (nsc(person)) {
      this._paidFor.push(person);
    }
  }

  public removePaidFor(person : Person) : void {
    if (nsc(person)) {
      const index: number = this._paidFor.indexOf(person);
      if (index !== -1) {
          this._paidFor.splice(index, 1);
      }
    }
  }

  public constructor(
      public id: number,
      public date: Date,
      public paidBy: Person,
      paidFor: Person[],
      public label: string,
      public category: string,
      amount: number, sheet: Sheet) {

    this.id = id;
    this._amount = amount;
    this._sheet = sheet;
    this.paidBy = paidBy;
    this.label = label;
    this.category = category;
    this._paidFor = nvl(paidFor, new Array(0));
    this._entries = new Set();
  }

  public calc() : void {

    this.entries.clear();

    let paidFor = filter(this.paidFor, (pf) => neq(pf, SheetService.PERSON_MODEL))

    if (anyMatch(paidFor, (pf) => eq(pf, SheetService.PERSON_ALL))) {
      paidFor = filter(this.sheet.persons, (pf) => pf.id > -1);
    }

    let self : boolean = anyMatch(paidFor, (pf) => eq(pf.id, this.paidBy.id));
    let cntPf : number = count(paidFor);

    this.addToSheet(this.paidBy);

    if (!self && count(paidFor) > 0) {
      this.entries.add({ target : this.paidBy, part: "-1", ratio: 1,  due: this.amount * 1 });
    }

    forEach(paidFor, (pf) => {

      this.addToSheet(pf);

      let a : number = 0;
      let b : number = cntPf;

      if (eq(pf.id, this.paidBy.id)) {
        a = (cntPf - 1);
      } else {
        a = -1
      }
      this.entries.add({ target : pf, part: (a* -1) + "/" + b, ratio: a / b,  due: this.amount * a / b});
    })
  }

  private addToSheet(pers : Person) : void {
    if (!anyMatch(this.sheet.persons, (p) => p.id == pers.id)) {
      this.sheet.persons.add(pers);
    }
  }

}

export interface Result {
  target: Person, part: string, ratio: number, due: number
}
