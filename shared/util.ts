export class SharedUtil {
  private static sortedIndex(array, value) {
    var low = 0,
      high = array.length;

    while (low < high) {
      var mid = (low + high) >>> 1;
      if (array[mid] < value) low = mid + 1;
      else high = mid;
    }
    return low;
  }

  public static sortedInsert(array, value) {
    var index = this.sortedIndex(array, value);
    array.splice(index, 0, value);
  }
}
