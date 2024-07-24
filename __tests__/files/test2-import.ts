export default function Test2Import(arg1: string, arg2: string, cwd: string, options: any) {
  return {
    arg1,
    arg2,
    cwd,
    options: !!options
  };
}