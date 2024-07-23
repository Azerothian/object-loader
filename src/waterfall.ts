export default function waterfall<T, T1, T2>(
  arr: T1[] = [],
  func: (val: T1, prevVal: T2) => Promise<T2> | T2,
  start?: T2,
): Promise<T> {
  if (!Array.isArray(arr)) {
    arr = [arr];
  }
  return arr.reduce(function (promise: Promise<any>, innerVal: any) {
    return promise.then(function (prevVal) {
      return func(innerVal, prevVal);
    });
  }, Promise.resolve(start));
}
