import PriorityQueue from "ts-priority-queue";

export class QueueUtils {
  public static valuePresent<T>(queue: PriorityQueue<T>, value: T): boolean {
    const elementsToRequeue: T[] = [];

    while (queue.length > 0) {
      const nextValue = queue.peek();

      // Compare nextValue with the value you're looking for
      if (nextValue === value) {
        for (const element of elementsToRequeue) {
          queue.queue(element);
        }
        return true; // Value is present in the PriorityQueue
      }

      elementsToRequeue.push(queue.dequeue());
    }

    for (const element of elementsToRequeue) {
      queue.queue(element);
    }

    return false; // Value is not present in the PriorityQueue
  }
}
