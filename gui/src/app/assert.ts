import { Equality, NullSafe, Stream } from './utils';
const { nsc } = NullSafe;

 export class Assert {

  public static getMatcher<T>(actual: T, msg? : String | string): jasmine.Matchers<T> {
    let msi : string | any = msg instanceof String ? msg.valueOf() : msg;
    return (nsc(msi)) ? expect(actual).withContext(msi) : expect(actual);
  }

  public static getBool(test : boolean | Boolean | (() => boolean | Boolean)): boolean {
    return test instanceof Boolean
    ? test.valueOf()
    : typeof test == 'function'
    ? getBool(test())
    : test != undefined && test
  }


  public static assertTrue(test : boolean | Boolean | (() => boolean | Boolean)) : void;
  public static assertTrue(test : boolean | Boolean | (() => boolean | Boolean), msg? : String | string) : void;
  public static assertTrue(test : boolean | Boolean | (() => boolean | Boolean), msg? : String | string) : void {
    Assert.getMatcher(Assert.getBool(test), msg).toBeTrue();
  }

  public static assertFalse(test : boolean | Boolean | (() => boolean | Boolean)) : void;
  public static assertFalse(test : boolean | Boolean | (() => boolean | Boolean), msg? : String | string) : void;
  public static assertFalse(test : boolean | Boolean | (() => boolean | Boolean), msg? : String | string) : void{
    Assert.getMatcher(Assert.getBool(test), msg).toBeFalse();
  }

  public static assertEq<T>(a : T, b : T) : void;
  public static assertEq<T>(a : T, b : T, msg? : String | string) : void;
  public static assertEq<T>(a : T, b : T, msg? : String | string) : void{
    Assert.getMatcher(a, msg).toEqual(b);
  }

  public static assertNeq<T>(a : T, b : T) : void;
  public static assertNeq<T>(a : T, b : T, msg? : String | string) : void;
  public static assertNeq<T>(a : T, b : T, msg? : String | string) : void{
    Assert.getMatcher(a, msg).not.toEqual(b);
  }

 }

 const { getMatcher, getBool, assertTrue, assertFalse } = Assert;
