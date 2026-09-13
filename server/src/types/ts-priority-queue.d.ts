// ts-priority-queue ships parallel .ts/.d.ts files under its own src/ directory, and under
// noImplicitAny our TypeScript resolves to the raw (untyped) .ts source instead of the
// package's own .d.ts files. This ambient declaration mirrors that .d.ts exactly, so
// TypeScript uses it instead of resolving into the package at all. Third-party code isn't
// touched by this - see node_modules/ts-priority-queue/src/PriorityQueue.d.ts for the source.
declare module "ts-priority-queue" {
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
}
