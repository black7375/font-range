type Diff<T, U> = T extends U ? never : T;
export type RequiredByValueExcept<T, TOptional extends keyof T> = Pick<T, Diff<keyof T, TOptional>> & Partial<T>;
export type ValueOf<T> = T[keyof T];
export {};
