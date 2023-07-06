import PriorityQueue from "ts-priority-queue";

export class QueueUtils {
  public static valuePresent<T>(queue: PriorityQueue<T>, value: T): boolean {
    const dequeuedElements = new Set<T>();

    while (queue.length > 0) {
      const nextValue = queue.peek();

      // Compare nextValue with the value you're looking for
      if (nextValue === value) {
        for (const element of dequeuedElements) {
          queue.queue(element);
        }
        return true; // Value is present in the PriorityQueue
      }

      dequeuedElements.add(queue.dequeue());
    }

    for (const element of dequeuedElements) {
      queue.queue(element);
    }

    return false; // Value is not present in the PriorityQueue
  }

  public static removeValue<T>(queue: PriorityQueue<T>, value: T) {
    const maintainedValues: T[] = [];

    while (queue.length > 0) {
      const nextValue = queue.dequeue();

      if (nextValue !== value) {
        maintainedValues.push(nextValue);
      }
    }

    //Queue the maintained values.
    for (const value of maintainedValues) {
      queue.queue(value);
    }
  }

  public static getValues<T>(queue: PriorityQueue<T>): T[] {
    const values: T[] = [];

    while (queue.length > 0) {
      const nextValue = queue.dequeue();
      values.push(nextValue);
    }

    for (const value of values) {
      queue.queue(value);
    }

    return values;
  }
}
