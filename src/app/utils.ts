/**
 *
*/
class Equality {

  public static eqs(a : String | string, b : String | string, ignorecase : boolean) : boolean {
    let s1 : String = nsc(a) ? ignorecase ? a.toLowerCase().trim() : a.trim() : a;
    let s2 : String = nsc(b) ? ignorecase ? b.toLowerCase().trim() : b.trim() : b;

    return eq(a, b);
  }

  /**
   * desf
   * @param a
   * @param b
   * @param c
   * @returns
   */
  public static eq<T>(a : T, b : T, ...c : T[]) : boolean {

    let ret = true;

    if (!nsc(a)) {
      ret = !nsc(b);
    } else if (!nsc(b)) {
      ret = false;
    } else {

      ret = a === b
        || a == b
        || Object.getPrototypeOf(a) === Object.getPrototypeOf(b)
        || JSON.stringify(a) == JSON.stringify(b);
    }

    if (ret) {
      ret = NullSafe.iteratePredicate(c, (v : T) => eq(b, v));
    }

    return ret;
  };

  public static neq<T>(a : T, b : T, ...c : T[]) : boolean {
    return !eq(a, b, ...c);
  }
}

interface Class<T> {
  new: (...args: any[]) => T;
}

const { eq } = Equality;

const NullSafe = {

  nsc<T, U>(a : T, ...b : U[]) : boolean {
    return a != undefined && a !== undefined
      && NullSafe.iteratePredicate(b, (v : U) => nsc(v));
  },

  nsce<T, U>(a : T, ...b : U[]) : boolean {
    return nsc(a) && !emp(a)
      && NullSafe.iteratePredicate(b, (v : U) => nsce(v));
  },

  emp<T, U>(a : T | any, ...b : U[]) : boolean {

    let ret = !nsc(a, b);

    if (!ret) {
      if (typeof a === 'string' || a instanceof String) {
        ret = a.trim.length === 0;
      } else if (Array.isArray(a)) {
        ret = a.length === 0;
      } else if (typeof a.size === 'function') {
        ret = a.size() === 0;
      } else if (a.length) {
        ret = a.length === 0;
      } else if (Object.keys(a).length === 0) {
        ret = true;
      }
    }

    if (!ret) {
      ret = NullSafe.iteratePredicate(b, (v : U) => emp(v));
    }

    return ret;
  },

  nvl<T, U extends T>(a : T | any, ...b : U[]) : T {
    	if (nsc(a)) return a;
      return NullSafe.iterateFunction(b, (v) => nvl(v));
  },

  nvle<T, U extends T>(a : T | any, ...b : U[]) : T {
    	if (nsce(a)) return a;
      return NullSafe.iterateFunction(b, (v) => nvle(v));
  },

  iteratePredicate(array : any[], func : (a : any) => boolean) : boolean {

    let ret = true;

    for(var i = 0; nsc(array) && ret && i < array.length; i++) {

      if (!func(array[i])) {
        ret = false;
        break;
      }
    }

    return ret;
  },

  /**
   *
   * @param array
   * @param func
   * @returns
   */
  iterateFunction<T>(array : any[], func : (a : any) => T) : T | any {

    for(var i = 0; nsc(array) && i < array.length; i++) {

        let ret = func(array[i]);
        if (nsc(ret)) {
          return ret;
        }
    }

    return null;
  }

}

/**
 * xcs
 */
const { nsc, nsce, emp, nvl, nvle } = NullSafe;
