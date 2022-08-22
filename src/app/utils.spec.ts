import { Equality, NullSafe } from './utils';

const { eq, neq } = Equality;
const { nsc, nsce, emp, nvl, nvle } = NullSafe;

describe('Equality', () => {

  it('eq with Boolean', () => {

    let b1 = true;
    let b2 = null;
    let b3 = false;

    expect(eq(b1, b2, b3)).toBe(false);
    expect(eq(b1, !b3, b2)).toBe(false);
    expect(eq(b1, !b3)).toBe(true);

    let bo1 = new Boolean(true);
    let bo2 = new Boolean(false);

    expect(eq(bo1, bo2)).toBe(false);
    expect(eq(bo1, new Boolean(!(bo2.valueOf())))).toBe(true);
  });

  it('eq with null, undefined', () => {

    let b1 = undefined;
    let b2 = null;

    expect(eq(b1, b2)).toBe(true);
  });

  it('neq', () => {

    let b1 = undefined;
    let b2 = null;
    let b3 = null;

    expect(neq(b1, b2, b3)).toBe(false);
    expect(neq(b1, b2, false)).toBe(true);
  });

  it('arrays', () => {

    let a = new Array([1, 1]);
    let b = new Array([1, 1]);

    let oa : Object = a;
    let oc : Object = 1;

    expect(eq(a, b)).toBe(true);
    expect(eq(oc, oa)).toBe(false);
  });
})

describe('NullSafe', () => {

  it('arrays', () => {

    let a = new Array([1, 1]);
    let b = new Array([1, 1]);

    let oa : Object = a;
    let oc : Object = 1;

    expect(nsc(a, b)).toBe(true);
    expect(nsc(oc, oa)).toBe(true);
  });
});
