// ts-priority-queue ships parallel .ts/.d.ts files under its own src/ directory, and
// TypeScript resolves imports of the package to that raw (untyped) .ts source rather
// than its own .d.ts files, which trips noImplicitAny on third-party code we don't
// control. tsconfig.json remaps the "ts-priority-queue" specifier to this file via
// "paths", so this is used instead of node_modules for type-checking only. Vite
// doesn't read tsconfig "paths", so it still resolves the package normally (main:
// index.js) at runtime. It mirrors node_modules/ts-priority-queue/src/PriorityQueue.d.ts
// exactly.
export type Comparator<T> = (a: T, b: T) => number;

export interface Options<T> {
  comparator: Comparator<T>;
  initialValues?: T[];
}

export interface QueueStrategy<T> {
  queue(value: T): void;
  dequeue(): T;
  peek(): T;
  clear(): void;
}

export default class PriorityQueue<T> {
  readonly length: number;
  constructor(options: Options<T>);
  queue(value: T): void;
  dequeue(): T;
  peek(): T;
  clear(): void;
}
