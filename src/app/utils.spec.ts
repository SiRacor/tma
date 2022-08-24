import { Equality, NullSafe, Assert, Stream } from './utils';

const { eq, neq } = Equality;
const { nsc, nsce, emp, nvl, nvle, nvls } = NullSafe;
const { getMatcher, getBool, assertTrue, assertFalse, assertEq, assertNeq} = Assert;
const { filter, forEach, toSet, toArray, toMap, toEntry, isIterable} = Stream;


describe('Equality', () => {

  it('eq with Boolean', () => {

    let b1 = true;
    let b2 = null;
    let b3 = false;

    assertFalse(eq(b1, b2, b3));
    assertFalse(eq(b1, !b3, b2));
    assertTrue(eq(b1, !b3));

    let bo1 = new Boolean(true);
    let bo2 = new Boolean(false);

    assertFalse(eq(bo1, bo2));
    assertTrue(eq(bo1, new Boolean(!(bo2.valueOf()))));
  });

  it('eq with null, undefined', () => {

    let b1 = undefined;
    let b2 = null;

    assertTrue(eq(b1, b2));
  });

  it('neq', () => {

    let b1 = undefined;
    let b2 = null;
    let b3 = null;

    assertFalse(neq(b1, b2, b3));
    assertTrue(neq(b1, b2, false));
  });

  it('arrays', () => {

    let a = new Array([1, 1]);
    let b = new Array([1, 1]);

    let oa : Object = a;
    let oc : Object = 1;

    assertTrue(eq(a, b));
    assertFalse(eq(oc, oa));
  });
})

describe('NullSafe', () => {

  it('nsc with boolean', () => {

    let a = new Boolean(true);
    let b = false;

    assertTrue(nsc(a, b));
    assertFalse(nsc(a, b, null));
  });

  it('nsc with arrays', () => {

    let a = new Array([1, 1]);
    let b = new Array([1, 1]);

    let oa : Object = a;
    let oc : Object = 1;

    assertTrue(nsc(a, b));
    assertTrue(nsc(oc, oa));
  });

  it('nsce with boolean', () => {

    let a = new Boolean(true);
    let b = false;

    assertTrue(nsce(a, b));
    assertFalse(nsce(a, b, null));
  });

  it('nsce with string', () => {

    let a = new String("");
    let b = "d";

    assertFalse(nsce(a, b));
    assertFalse(nsce(a, b, null));

    a = a.concat("f");

    assertTrue(nsce(a, b));
  });

  it('nsce with array', () => {

    let a = new Array(0);
    let b : String[] = [];

    assertFalse(nsce(a));
    assertFalse(nsce(a, b));

    a.push(1);
    b.push("1");

    assertTrue(nsce(a));
    assertTrue(nsce(b));
  });

  it('nvl with String', () => {

    let a = null;
    let b = "f";

    assertTrue(nvl(a, b) == b);
    assertTrue(nvl(b, a) == b);

    a = "d";

    assertTrue(nvl(a, b) == a);
  });

  it('nvle with String', () => {

    let a = "";
    let b = "f";

    assertEq(nvle(a, b), b);
    assertEq(nvle(b, a), b);

    a = "d";

    assertEq(nvl(a, b),a);
  });

  it('nvls with String', () => {

    let a = "f";
    let b = () => "f";

    assertEq(nvls(a, b), b());
  });

  it('nvls with call-check', () => {

    let i : number = 0;
    let a = () : string => {
      i++;
      return "f";
    };

    let b = () : string => {
      i++;
      return "g";
    };

    assertEq(nvls(a, b), "f");
    assertEq(i, 1);
  });
})

describe('Assert', () => {

  it('getBool', () => {

    let a = true;
    let b = new Boolean(false);
    let c = () => true;
    let d = () => new Boolean(false);

    assertTrue(getBool(a));
    assertFalse(getBool(b));
    assertTrue(getBool(c));
    assertFalse(getBool(d));
  });

  it('getMatcher', () => {

    let a = true;

    assertTrue(eq(getMatcher(a), expect(a)));
  });
});

describe('Stream', () => {

  it('filter', () => {

    let a : string[] = filter(["a", "b", "c"], (s) => s > "a");

    assertEq(a.length, 2);

    let b : Set<string> = filter(new Set(["a", "b", "c"]), (s) => s > "a");

    assertEq(b.size, 2);
  });

  it('forEach', () => {

    let i : number = 0;
    forEach(["a", "b", "c"], (s) => i++);

    assertEq(i, 3);

    i = 0;
    forEach(["a", "b", "c"], (s) => s > "a", (s) => i++);

    assertEq(i, 2);
  });

  it('toArray', () => {

    let a : string[] = toArray(["a", "b", "c"], (s) => s > "a", (s) => s);

    assertEq(a.length, 2);
  });

  it('toSet', () => {

    let a : Set<string> = toSet(["a", "b", "c"], (s) => s);
    let b : Set<string> = new Set(["a", "b", "c"]);

    assertEq(a.size, b.size);
    let c : any = null;

    a = toSet(["a", "b", "c"], (s) => neq(s, "b"), (s) => s);
    assertNeq(a.size, b.size);
  });

  it('toMap', () => {

    let a : Map<string, number> = toMap(["a1", "b22", "c333", "a1"],
      (s) => toEntry(s, s.length)
    );

    assertEq(a.size, 3);

    let b : Map<number, string> = toMap(["a1", "b22", "c333", "b1"], null,
      (s) => toEntry(s.length, s),
      (stored, candidate) => toEntry(stored.key + 10, candidate.value)
    );

    assertEq(b.size, 4);
  });

  it('isIterable', () => {

    assertTrue(isIterable(["a", "b", "c"]));
    assertTrue(isIterable(new Set(["a", "b", "c"])));
    assertTrue(isIterable(new Map([["a", "b"]])));
    assertFalse(isIterable({ a: 1 }));

  });

  it('toEntry', () => {

    assertTrue(eq(toEntry("a", "b"), { key: "a", value: "b"}));
    assertFalse(eq(toEntry("a", "b"), { key: "a", value: "c"}));

  });
});
