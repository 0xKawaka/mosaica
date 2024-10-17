function formatBigIntWith18DecimalsAndPrecision(value: bigint, precision: number): string {
  const DECIMALS = BigInt(10 ** 18); // 18 decimals (fixed)
  const precisionFactor = BigInt(10 ** (18 - precision)); // Factor to truncate decimals

  // Separate the integer part and the fractional part (18 decimals)
  const integerPart = value / DECIMALS;
  const fractionalPart = value % DECIMALS;

  // Adjust the fractional part based on the specified precision
  const adjustedFractionalPart = fractionalPart / precisionFactor;

  // Convert both parts to string
  const integerPartStr = integerPart.toString();
  let fractionalPartStr = adjustedFractionalPart.toString().padStart(precision, '0'); // Ensure the correct precision length

  // Remove trailing zeros from the fractional part
  fractionalPartStr = fractionalPartStr.replace(/0+$/, '');

  // If the fractional part becomes empty, return just the integer part
  if (fractionalPartStr === '') {
      return integerPartStr;
  }

  // If the integer part is 0 and fractional part exists, handle numbers less than 1
  if (integerPart === BigInt(0)) {
      return `0.${fractionalPartStr}`;
  }

  // Return the combined integer and fractional parts
  return `${integerPartStr}.${fractionalPartStr}`;
}

export {formatBigIntWith18DecimalsAndPrecision};
