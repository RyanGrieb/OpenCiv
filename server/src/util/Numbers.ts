import crypto from "crypto";

export class Numbers {
  public static safeRandom() {
    const buffer = crypto.randomBytes(4); // 4 bytes for a 32-bit number
    const randomNum = buffer.readUInt32BE(0) / (0xffffffff + 1);
    return randomNum;
  }
}
