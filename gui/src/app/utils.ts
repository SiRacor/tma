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

export class NullSafe {

  public static nsc<T, U>(a : T, ...b : U[]) : boolean {
    return a != undefined && a !== undefined
      && NullSafe.iteratePredicate(b, (v : U) => nsc(v));
  }

  public static nsce<T, U>(a : T, ...b : U[]) : boolean {
    return nsc(a) && !emp(a)
      && NullSafe.iteratePredicate(b, (v : U) => nsce(v));
  }

  public static emp<T, U>(a : T | any, ...b : U[]) : boolean {

    let ret = !nsc(a, b);

    if (!ret) {
      if (typeof a === 'string' || a instanceof String) {
        ret = a.trim().length === 0;
      } else if (typeof a === 'boolean' || a instanceof Boolean) {
        ret = false;
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

    if (!ret && b != undefined) {
      ret = NullSafe.iteratePredicate(b, (v : U) => emp(v) != true) != true;
    }

    return ret;
  }

  public static nvl<T>(a? : T, ...b : T[] | any) : T {
    	if (nsc(a) && a != undefined) return a;
      return NullSafe.iterateFunction(b, (v) => nvl(v));
  }

  public static nvle<T>(a? : T, ...b : T[]) : T {
    	if (nsce(a) && a != undefined) return a;
      return NullSafe.iterateFunction(b, (v) => nvle(v));
  }

  public static nvls<T>(a : (() => T) | T, ...b : T[] | (() => T)[]) : T {

      a = NullSafe.rsl(a);
    	if (nsc(a)) return a;

      return NullSafe.iterateFunction(b, (v) => nvls(v));
  }

  public static rsl<T>(a : (() => T)) : T;
  public static rsl<T>(a : (() => T) | T) : T
  public static rsl<T>(a : (() => T) | T | any) : T {
    return typeof a == 'function' ? a() : a;
  }

  public static wth<T>(t : T | null, func : (t : T) => any) : boolean;
  public static wth<T, R>(t : T | null | undefined, alt : R, func : (t : T) => any) : R;
  public static wth<T, R>(t : T | null | undefined, a : (t : T) => R | R, b? : (t : T ) => R) : boolean | R {

    let alt : R | any = nsc(b) ? a : null;
    let func : ((t : T) => R) | any = nsc(b) ? b : a;

    let ret : boolean = false;

    if (alt != undefined) {
      ret = (t != null) ? func(t) : alt;
    } else if (t != null) {
      func(t);
      ret = true;
    }

    return ret;
  }


  public static iteratePredicate(array : any[], func : (a : any) => boolean) : boolean {

    let ret = true;

    for(var i = 0; array != undefined && ret && i < array.length; i++) {

      if (!func(array[i])) {
        ret = false;
        break;
      }
    }

    return ret;
  }

  public static iterateFunction<T>(array : any[], func : (a : any) => T) : T | any {

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

  public static filter<T>(list: T[], filter : (arg: T) => boolean): T[];
  public static filter<T>(list: Iterable<T>, filter : (arg: T) => boolean): Set<T>;
  public static filter<T>(list: T[] | Iterable<T>, filter : (arg: T) => boolean): T[] | Set<T> | null {

    if (!nsc(list, filter)) {
      return null;
    }

    let ret : T[]  = new Array();
    let buffer : T[] = (Array.isArray(list)) ? list : Array.from(list);

    buffer?.forEach((item) => {
      if (nsc(item) && (!filter || filter(item))) {
          ret.push(item);
      }
    })

    return Array.isArray(list) ? ret : new Set(ret);
  }

  public static anyMatch<T>(list: T[], filter : (arg: T) => boolean): boolean;
  public static anyMatch<T>(list: Iterable<T>, filter : (arg: T) => boolean): boolean;
  public static anyMatch<T>(list: T[] | Iterable<T>, filter : (arg: T) => boolean): boolean {
    return Stream.count(list, filter) > 0;
  }

  public static findFirst<T>(list: T[], filter : (arg: T) => boolean): T | null;
  public static findFirst<T>(list: Iterable<T>, filter : (arg: T) => boolean): T | null;
  public static findFirst<T>(list: T[] | Iterable<T>, filter : (arg: T) => boolean): T | null {

    let filtered: T[] =  new Array(0);
    if (filter != undefined) {
      filtered = Array.from(Stream.filter(list, filter));
    }

    return filtered.length > 0 ? filtered[0] : null;
  }

  public static count<T>(list: T[] | Iterable<T>, filter? : (arg: T) => boolean): number {

    if (filter != undefined) {
      list = Stream.filter(list, filter);
    }

    return Array.isArray(list) ? list.length : isIterable(list) ? new Set(list).size : 0;
  }

  public static forEach<T>(list: T[] | Iterable<T>, consumer : (arg: T) => void) : void;
  public static forEach<T>(list: T[] | Iterable<T>, preFilter : (arg: T) => boolean, consumer : (arg: T) => void) : void;
  public static forEach<T>(list: T[] | Iterable<T>, a : ((arg: T) => boolean) | ((arg: T) => void), b? : (arg: T) => void) : void {

    let preFilter : ((arg: T) => boolean) | any = nsc(b) ? a : null;
    let consumer : ((arg: T) => void) | any = nsc(b) ? b : a;

    if (!nsc(list, consumer)) {
      return;
    }

    let buffer : T[] = (Array.isArray(list)) ? list : Array.from(list);

    buffer.forEach((item) => {
      if (nsc(item) && (!preFilter || preFilter(item))) {
        consumer(item);
      }
    });
  }

  public static toSet<T, R>(list: T[] | Iterable<T>, func : (arg: T) => R) : Set<R>;
  public static toSet<T, R>(list: T[] | Iterable<T>, preFilter : (arg: T) => boolean, func : (arg: T) => R) : Set<R>;
  public static toSet<T, R>(list: T[] | Iterable<T>, a : ((arg: T) => boolean) | ((arg: T) => R), b? : (arg: T) => R) : Set<R> | null {

    let preFilter : ((arg: T) => boolean) | any = nsc(b) ? a : null;
    let func : ((arg: T) => R) | any = nsc(b) ? b : a;

    let buffer : R[] | null = Stream.toArray(list, preFilter, func);
    return buffer ? new Set(buffer) : null;
  }

  public static toArray<T, R>(list: T[] | Iterable<T>, func : (arg: T) => R) : R[];
  public static toArray<T, R>(list: T[] | Iterable<T>, preFilter : (arg: T) => boolean, func : (arg: T) => R) : R[];
  public static toArray<T, R>(list: T[] | Iterable<T>, a : ((arg: T) => boolean) | ((arg: T) => R), b? : (arg: T) => R) : R[] | null {

    let preFilter : ((arg: T) => boolean) | any = nsc(b) ? a : null;
    let func : ((arg: T) => R) | any = nsc(b) ? b : a;

    if (!nsc(list, func)) {
      return null;
    }

    let ret : R[] = new Array();
    let buffer : T[] = (Array.isArray(list)) ? list : Array.from(list);

    buffer.forEach((item) => {
      if (nsc(item) && (!preFilter || preFilter(item))) {

        let r : R = func(item);

        if (nsc(r)) {
          ret.push(r);
        }
      }
    })

    return ret;
  }

  public static toMap<T, K, V, E extends { key : K, value : V }>(list: T[] | Iterable<T>, func : (arg: T) => E): Map<K, V>;
  public static toMap<T, K, V, E extends { key : K, value : V }>(list: T[] | Iterable<T>, preFilter : (arg: T) => boolean, func : (arg: T) => E): Map<K, V>;
  public static toMap<T, K, V, E extends { key : K, value : V }>(list: T[] | Iterable<T>, preFilter : ((arg: T) => boolean) | null, func : (arg: T) => E, conflict : (stored: E, candidate: E) => E): Map<K, V>;
  public static toMap<T, K, V, E extends { key : K, value : V }>(list: T[] | Iterable<T>, a : ((arg: T) => E) | ((arg: T) => boolean), b? : (arg: T) => boolean, c? : (stored: E, candidate: E) => E): Map<K, V> | null {

    let preFilter : ((arg: T) => boolean) | any = nsc(b) ? a : null;
    let func : ((arg: T) => E) | any = nsc(b) ? b : a;
    let conflict: (stored: E, candidate: E | any) => E = nvl(c, (stored: E, candidate: E) => nvl(candidate, stored));

    if (!nsc(list, func)) {
      return null;
    }

    let buffer : T[] = (Array.isArray(list)) ? list : Array.from(list);
    let ret : Map<K, V> = new Map();

    buffer.forEach((item) => {
      if (nsc(item) && (!preFilter || preFilter(item))) {

        let r : E = func(item);

        if (nsc(r) && ret.has(r.key) && ret.get(r.key) != r.value) {
          r = conflict(r, ret.get(r.key));
        }

        if (nsc(r)) ret.set(r.key, r.value);
      }
    });

    return ret;
  }

  public static toEntry<K, V>(key : K, value : V) : { key : K, value : V } {
    let entry : { key : K, value : V } = { key : key, value : value};
    return entry;
  }

  public static isIterable(obj : any) {
    return nsc(obj) && typeof obj[Symbol.iterator] === 'function';
  }
}


/**
 * xcs
 */
 const { filter, forEach, toSet, toArray, toMap, isIterable, toEntry} = Stream;
