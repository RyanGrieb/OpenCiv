export class Numbers {
  public static clamp(num, min, max): number {
    return Math.min(Math.max(num, min), max);
  }

  public static addAndWrapAround(num: number, addend: number, max: number): number {
    // add the numbers
    let sum = num + addend;

    // if the sum is greater than the max, wrap around to the beginning
    if (sum > max) {
      sum = sum % (max + 1);
    }

    return sum;
  }

  public static safeRandom() {
    const crypto = window.crypto;
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
  }
}
