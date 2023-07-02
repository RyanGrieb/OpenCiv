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
}
