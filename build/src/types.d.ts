declare type Diff<T, U> = T extends U ? never : T;
export declare type RequiredByValueExcept<T, TOptional extends keyof T> = Pick<T, Diff<keyof T, TOptional>> & Partial<T>;
export declare type ValueOf<T> = T[keyof T];
export {};
