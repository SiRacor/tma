import { PrefixNot } from "@angular/compiler";
import { __spreadArrays } from "tslib";

/**
 *
*/
export class Equality {

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
        || (Object.getPrototypeOf(a) === Object.getPrototypeOf(b)
            && JSON.stringify(a) == JSON.stringify(b));
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

const { eq, neq } = Equality;

export const NullSafe = {

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

  nvls<T, U extends () => T>(a : U | any, ...b : U[]) : T {
    	if (nsce(a())) return a;
      return NullSafe.iterateFunction(b, (v) => nvls(v));
  },

  iteratePredicate(array : any[], func : (a : any) => boolean) : boolean {

    let ret = true;

    for(var i = 0; array != undefined && ret && i < array.length; i++) {

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
const { nsc, nsce, emp, nvl, nvle, nvls } = NullSafe;

type DescribableFunction = {
  (someArg: number): boolean;
}

export class Stream {

  public static filter<T>(list: T[] | Iterable<T>, filter : (arg: T) => boolean): T[] | null {

    if (!nsc(list, filter)) {
      return null;
    }

    let ret : T[] = new Array();

    let buffer : T[] = (Array.isArray(list)) ? list : Array.from(list);

    buffer?.forEach((item) => {
      if (nsc(item) && (!filter || filter(item))) {
          ret.push(item);
      }
    })

    return ret;
  }

  public static forEach<T>(list: T[] | Iterable<T>, consumer : (arg: T) => void) : void;
  public static forEach<T>(list: T[] | Iterable<T>, consumer : (arg: T) => void, preFilter? : (arg: T) => boolean) : void;
  public static forEach<T>(list: T[] | Iterable<T>, consumer : (arg: T) => void, preFilter? : (arg: T) => boolean) : void {

    if (!nsc(list, consumer)) {
      return;
    }

    let buffer : T[] = (Array.isArray(list)) ? list : Array.from(list);

    buffer.forEach((item) => {
      if (nsc(preFilter, item) && preFilter?.(item)) {
        consumer(item);
      }
    });
  }

  public static toSet<T, R>(list: T[] | Iterable<T>, func : (arg: T) => R) : Set<R> | null;
  public static toSet<T, R>(list: T[] | Iterable<T>, func : (arg: T) => R, preFilter : (arg: T) => boolean) : Set<R> | null;
  public static toSet<T, R>(list: T[] | Iterable<T>, func : (arg: T) => R, preFilter? : (arg: T) => boolean, postFilter? : (arg: R) => boolean) : Set<R>;
  public static toSet<T, R>(list: T[] | Iterable<T>, func : (arg: T) => R, preFilter? : (arg: T) => boolean, postFilter? : (arg: R) => boolean) : Set<R> | null {

    let buffer : R[] | null = Stream.toArray(list, func, preFilter);
    return buffer ? new Set(buffer) : null;
  }

  public static toArray<T, R>(list: T[] | Iterable<T>, func : (arg: T) => R) : R[] | null;
  public static toArray<T, R>(list: T[] | Iterable<T>, func : (arg: T) => R, preFilter : (arg: T) => boolean) : R[] | null;
  public static toArray<T, R>(list: T[] | Iterable<T>, func? : (arg: T) => R, preFilter? : (arg: T) => boolean, postFilter? : (arg: R) => boolean) : R[] | null;
  public static toArray<T, R>(list: T[] | Iterable<T>, func? : (arg: T) => R, preFilter? : (arg: T) => boolean, postFilter? : (arg: R) => boolean) : R[] | null {

    if (!nsc(list, func) || !func) {
      return null;
    }

    let ret : R[] = new Array();
    let buffer : T[] = (Array.isArray(list)) ? list : Array.from(list);

    buffer.forEach((item) => {
      if (nsc(item) && (!preFilter || preFilter(item))) {

        let r : R = func(item);

        if (nsc(r) && (!postFilter || postFilter(r))) {
          ret.push(r);
        }
      }
    })

    return ret;
  }

  public static toMap<T, K, V, E extends { key : K, value : V }>(list: T[] | Iterable<T>, func : (arg: T) => E): Map<K, V> | null;
  public static toMap<T, K, V, E extends { key : K, value : V }>(list: T[] | Iterable<T>, func : (arg: T) => E, preFilter? : (arg: T) => boolean): Map<K, V> | null;
  public static toMap<T, K, V, E extends { key : K, value : V }>(list: T[] | Iterable<T>, func : (arg: T) => E, preFilter? : (arg: T) => boolean, postFilter? : (arg: E) => boolean): Map<K, V> | null;
  public static toMap<T, K, V, E extends { key : K, value : V }>(list: T[] | Iterable<T>, func : (arg: T) => E, preFilter? : (arg: T) => boolean, postFilter? : (arg: E) => boolean): Map<K, V> | null {

    if (!nsc(list, func)) {
      return null;
    }

    let buffer : T[] = (Array.isArray(list)) ? list : Array.from(list);
    let ret : Map<K, V> = new Map();

    buffer.forEach((item) => {
      if (nsc(item) && (!preFilter || preFilter(item))) {
        let r : E = func(item);

        if (nsc(r) && (!postFilter || postFilter(r))) {
          ret.set(r.key, r.value);
        }
      }
    });

    return ret;
  }

  public static isIterable(obj : any) {
    return nsc(obj) && typeof obj[Symbol.iterator] === 'function';
  }
}


/**
 * xcs
 */
 const { filter, forEach, toSet, toArray, toMap, isIterable} = Stream;
