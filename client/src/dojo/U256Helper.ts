export interface U256 {
  low: bigint;
  high: bigint;
}

export class U256Math {
  static MAX_UINT128 = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"); // 128-bit max value
  static MAX_UINT64 = BigInt("0xFFFFFFFFFFFFFFFF"); // 64-bit max value
  static TWO_128 = BigInt("0x100000000000000000000000000000000"); // 2^128

  // Add two U256 values
  static add(a: U256, b: U256): U256 {
      const lowSum = a.low + b.low;
      const carry = lowSum > this.MAX_UINT128 ? BigInt(1) : BigInt(0);
      const low = lowSum & this.MAX_UINT128;
      const high = a.high + b.high + carry;

      return { low, high };
  }

  // Subtract two U256 values
  static subtract(a: U256, b: U256): U256 {
      const lowDiff = a.low - b.low;
      const borrow = lowDiff < 0 ? BigInt(1) : BigInt(0);
      const low = lowDiff & this.MAX_UINT128;
      const high = a.high - b.high - borrow;

      return { low, high };
  }

  // Multiply two U256 values
  static multiply(a: U256, b: U256): U256 {
      const aLow = a.low;
      const aHigh = a.high;
      const bLow = b.low;
      const bHigh = b.high;

      const lowProduct = aLow * bLow;
      const midProduct1 = aHigh * bLow;
      const midProduct2 = aLow * bHigh;
      const highProduct = aHigh * bHigh;

      const low = lowProduct & this.MAX_UINT128;
      const carryLow = lowProduct >> BigInt(128);
      const midSum = midProduct1 + midProduct2 + carryLow;
      const high = highProduct + (midSum >> BigInt(128));

      const finalLow = low | ((midSum & this.MAX_UINT128) << BigInt(128));
      return { low: finalLow, high: high };
  }
  // Multiply U256 by a bigint
  static multiplyByBigint(a: U256, b: bigint): U256 {
    const lowProduct = a.low * b;
    const highProduct = a.high * b;

    // Separate the 256-bit result into the lower 128-bit and the upper 128-bit parts
    const low = lowProduct & this.MAX_UINT128; // Lower 128 bits
    const carryLow = lowProduct >> BigInt(128); // Upper bits from the low product
    const high = highProduct + carryLow; // Add the carry from the lower product to the high product

    return { low, high };
  }

  // Divide two U256 values
  static divide(a: U256, b: U256): U256 {
      const aBigInt = (a.high << BigInt(128)) | a.low;
      const bBigInt = (b.high << BigInt(128)) | b.low;

      const result = aBigInt / bBigInt;

      const low = result & this.MAX_UINT128;
      const high = result >> BigInt(128);

      return { low, high };
  }

  // Divide U256 by a number
  static divideByNumber(a: U256, b: number): U256 {
      const bBigInt = BigInt(b);
      const aBigInt = (a.high << BigInt(128)) | a.low;

      const result = aBigInt / bBigInt;

      const low = result & this.MAX_UINT128;
      const high = result >> BigInt(128);

      return { low, high };
  }

  // Modulo of two U256 values
  static mod(a: U256, b: U256): U256 {
      const aBigInt = (a.high << BigInt(128)) | a.low;
      const bBigInt = (b.high << BigInt(128)) | b.low;

      const result = aBigInt % bBigInt;

      const low = result & this.MAX_UINT128;
      const high = result >> BigInt(128);

      return { low, high };
  }

  // Modulo U256 by a number
  static modByNumber(a: U256, b: number): U256 {
      const bBigInt = BigInt(b);
      const aBigInt = (a.high << BigInt(128)) | a.low;

      const result = aBigInt % bBigInt;

      const low = result & this.MAX_UINT128;
      const high = result >> BigInt(128);

      return { low, high };
  }

  // Bitwise AND between two U256 values
  static bitwiseAnd(a: U256, b: U256): U256 {
      const low = a.low & b.low;
      const high = a.high & b.high;
      return { low, high };
  }

  // Bitwise OR between two U256 values
  static bitwiseOr(a: U256, b: U256): U256 {
      const low = a.low | b.low;
      const high = a.high | b.high;
      return { low, high };
  }

  // Bitwise XOR between two U256 values
  static bitwiseXor(a: U256, b: U256): U256 {
      const low = a.low ^ b.low;
      const high = a.high ^ b.high;
      return { low, high };
  }

  // Bitwise NOT for a U256 value
  static bitwiseNot(a: U256): U256 {
      const low = ~a.low & this.MAX_UINT128;
      const high = ~a.high & this.MAX_UINT128;
      return { low, high };
  }

  // Left shift
  static leftShift(a: U256, shift: number): U256 {
      if (shift >= 128) {
          return { low: BigInt(0), high: a.low << BigInt(shift - 128) };
      }
      const low = a.low << BigInt(shift);
      const high = (a.high << BigInt(shift)) | (a.low >> BigInt(128 - shift));

      return { low: low & this.MAX_UINT128, high: high & this.MAX_UINT128 };
  }

  // Right shift
  static rightShift(a: U256, shift: number): U256 {
      if (shift >= 128) {
          return { low: a.high >> BigInt(shift - 128), high: BigInt(0) };
      }
      const low = (a.low >> BigInt(shift)) | (a.high << BigInt(128 - shift));
      const high = a.high >> BigInt(shift);

      return { low: low & this.MAX_UINT128, high: high & this.MAX_UINT128 };
  }
}
