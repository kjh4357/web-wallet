export function cls(...classnames) {
  return classnames.join(" ");
}

export const apiTarget = localStorage.getItem("roacoreconfig")
  ? localStorage.getItem("roacoreconfig") === "mainnet-beta"
    ? process.env.REACT_APP_SOLANA_CLUSTER_RPC_ENDPOINT_MAIN
    : process.env.REACT_APP_SOLANA_CLUSTER_RPC_ENDPOINT_DEV
  : process.env.REACT_APP_SOLANA_CLUSTER_RPC_ENDPOINT;

export const clusterTarget = localStorage.getItem("roacoreconfig")
  ? localStorage.getItem("roacoreconfig") === "mainnet-beta"
    ? process.env.REACT_APP_SOLANA_CLUSTER_TARGET_MAIN
    : process.env.REACT_APP_SOLANA_CLUSTER_TARGET_DEV
  : process.env.REACT_APP_SOLANA_CLUSTER_TARGET;

export function addDecimal(amount, lamport = 9) {
  if (Number.isInteger(amount)) {
    return Number(amount / Math.pow(10, lamport - 1));
  } else {
    return LBN(amount, lamport);
  }
}

export const splitIntegerAndDecimal = (price) => price.toString().split(".");
export const commaPlacementSelector = (integer, seperationUnit = 3) => {
  const integerToString = integer.toString();
  return integerToString.length % seperationUnit !== 0
    ? integerToString.length % seperationUnit
    : (integerToString.length % seperationUnit) + seperationUnit;
};
export const formattingDecimalLength = (decimalNumber, length = 8) => {
  let decimalFloorNumber;
  if (Number(length) === 0) {
    decimalFloorNumber = decimalNumber
      ? `${decimalNumber.slice(0, length)}`
      : "";
  } else if (!decimalNumber || decimalNumber.length < length) {
    decimalFloorNumber = decimalNumber
      ? `.${decimalNumber.concat("0".repeat(length - decimalNumber.length))}`
      : `.${"0".repeat(length)}`;
  } else {
    decimalFloorNumber = decimalNumber
      ? `.${decimalNumber.slice(0, length)}`
      : "";
  }
  return decimalFloorNumber;
};
export const appendCommaToInteger = (integer, seperatorUnit) =>
  integer
    .toString()
    .split("")
    .map((item, i) =>
      i % 3 === seperatorUnit - 1 && i !== integer.length - 1
        ? `${item},`
        : item
    )
    .join("");

const convertNegativeToPositive = (
  isNegative,
  num,
  length,
  isFloor = false
) => {
  const sumOfIntegerAndPointLength = num.toString().split(".")[0].length + 1;
  if (isNegative) {
    const numberInArray = num.toString().split("");
    numberInArray.splice(0, 1);
    const joinNumber = Number(numberInArray.join(""));
    return isFloor
      ? joinNumber.toString().slice(0, length + sumOfIntegerAndPointLength)
      : joinNumber.toFixed(length);
  }
  return isFloor
    ? num.toString().slice(0, length + sumOfIntegerAndPointLength)
    : Number(num).toFixed(length);
};

export const LBNFloor = (num, length = 8) => {
  let newNum = num;
  if (!num) return (0).toFixed(length);
  if (Array.isArray(num)) {
    newNum = num.join("");
  }
  const isNegative = newNum.toString()[0] === "-";
  const targetNumber = convertNegativeToPositive(
    isNegative,
    newNum,
    length,
    true
  );
  const integerNumber = splitIntegerAndDecimal(targetNumber)[0];
  const decimalNumber = splitIntegerAndDecimal(targetNumber)[1];
  const seperator = commaPlacementSelector(integerNumber, 3);
  return `${isNegative ? "-" : ""}${appendCommaToInteger(
    integerNumber,
    seperator
  )}${formattingDecimalLength(decimalNumber, length)}`;
};

export const LBN = (num, length = 8) => {
  let newNum = num;
  if (!num) return (0).toFixed(length);
  if (Array.isArray(num)) {
    newNum = num.join("");
  }
  const isNegative = newNum.toString()[0] === "-";
  const targetNumber = convertNegativeToPositive(
    isNegative,
    Number(newNum).toFixed(length),
    length
  );
  const integerNumber = splitIntegerAndDecimal(targetNumber)[0];
  const decimalNumber = splitIntegerAndDecimal(
    Number(targetNumber).toFixed(length)
  )[1];
  const seperator = commaPlacementSelector(integerNumber, 3);
  if (Number(length) === 0)
    return `${appendCommaToInteger(
      Number(targetNumber).toFixed(0),
      seperator
    )}`;
  return `${isNegative ? "-" : ""}${appendCommaToInteger(
    integerNumber,
    seperator
  )}${formattingDecimalLength(decimalNumber, length)}`;
};

export const getDecimalByLength = (length, isNegative) => {
  const result = 1 / 10 ** length;
  return isNegative ? result * -1 : result;
};

export const getRoundedUpNumber = (value, min, length) => {
  const absoluteValue = Math.abs(value);
  const target = getDecimalByLength(length, value < 0);
  if (absoluteValue > min && absoluteValue < Math.abs(target)) {
    return LBN(target, length);
  }
  return LBN(value, length);
};

export const getScaleNumber = (number) => {
  const integerNumber = number.toString().split(",").join("").split(".")[0];
  let newNumber;
  let unit;

  if (integerNumber.length >= 14) {
    newNumber = integerNumber.slice(0, -12);
    unit = "T"; // Trillion
  } else if (integerNumber.length >= 11) {
    newNumber = integerNumber.slice(0, -9);
    unit = "B"; // Billion
  } else if (integerNumber.length >= 8) {
    newNumber = integerNumber.slice(0, -6);
    unit = "M"; // Million
  } else if (integerNumber.length >= 5) {
    newNumber = integerNumber.slice(0, -3);
    unit = "K"; // Kilo
  } else if (integerNumber.length > 3) {
    return Number(integerNumber).toFixed(2);
  } else {
    return number;
  }
  return `${newNumber}${unit}`;
};

const getUSDIntegerNumber = (price, integer, index, unit) =>
  `${integer.slice(0, -index)}.${price[price.indexOf(".") + 1]}${unit}`;

const getKRWIntegerNumber = (price, integer, index, unit) => {
  if (unit === "만") {
    return `${appendCommaToInteger(integer.slice(0, -index))}.${integer.slice(
      -index,
      -index + 1
    )}${unit}`;
  }
  return `${appendCommaToInteger(integer.slice(0, -index + 1))}${unit}`;
};

const getDefaultFiatVolume = (price) => {
  const integerNumber = price.toString().split(",").join("").split(".")[0];
  if (integerNumber.length >= 14) {
    return getUSDIntegerNumber(price, integerNumber, 12, "T");
  }
  if (integerNumber.length >= 11) {
    return getUSDIntegerNumber(price, integerNumber, 9, "B");
  }
  if (integerNumber.length >= 8) {
    return getUSDIntegerNumber(price, integerNumber, 6, "M");
  }
  if (integerNumber.length >= 5) {
    return getUSDIntegerNumber(price, integerNumber, 3, "K");
  }
  if (integerNumber.length > 3) {
    return `${appendCommaToInteger(integerNumber)}.${
      price[price.indexOf(".") + 1]
    }`;
  }
  return price;
};

const getKRWFiatVolume = (price) => {
  const dotLocation = price.toString()[price.toString().indexOf(".") + 1];
  const integerNumber = price.toString().split(",").join("").split(".")[0];
  if (integerNumber.length >= 12) {
    return getKRWIntegerNumber(price, integerNumber, 12, "천억");
  }
  if (integerNumber.length >= 9) {
    return getKRWIntegerNumber(price, integerNumber, 8, "천만");
  }
  if (integerNumber.length > 6) {
    return getKRWIntegerNumber(price, integerNumber, 4, "만");
  }
  return `${appendCommaToInteger(integerNumber)}.${dotLocation || 0}`;
};

export const getFiatTradeVolume = (price, language) =>
  language === "ko" ? getKRWFiatVolume(price) : getDefaultFiatVolume(price);

const setDecimalNumber = (original, decimalPoint) => {
  if (!original.split(".")[1]) return ".0";
  const decimalNumberLength = Number(original.split(".")[1].length);
  const dotIndex = original.indexOf(".");
  if (decimalNumberLength <= decimalPoint) {
    return `.${Number(original).toFixed(decimalPoint).split(".")[1]}`;
  }
  return original.toString().slice(dotIndex, dotIndex + decimalPoint + 1);
};

export const getArrayOfNumber = (number, decimalPoint) => {
  if (!number) {
    return ["0", ".0"];
  }
  const int = String(parseInt(number, 10));
  let decimal;
  if (!number.split(".")[1]) return [number, ".0"];
  if (Number(number) === 0) {
    decimal = Number(number)
      .toFixed(decimalPoint)
      .slice(1, Number(decimalPoint) + 2);
  } else decimal = setDecimalNumber(number, Number(decimalPoint));
  return [appendCommaToInteger(int), decimal];
};

const getIntLength = (value) => String(value).split(".")[0].length + 1;

export const getInputNumber = ({
  originValue,
  value = 0,
  max = 100,
  min = 0,
  decimalLength = 0,
  // maxOverMessage,
  // minOverMessage,
}) => {
  const checker = decimalLength > 0 ? /[-+]?[0-9.]/g : /[-+]?[0-9]/g;
  const length = getIntLength(value) + Number(decimalLength);
  const num = String(value).match(checker) || [];

  let myNum = "";
  let count = 0;

  for (let i = 0; i < num.length; i++) {
    if (num[i] === ".") {
      count += 1;
    }
    if (count > 1) {
      break;
    }
    if (i < length) {
      myNum += num[i];
    }
  }
  if (myNum[myNum.length - 1] === "." || myNum === "") {
    return myNum;
  }
  if (myNum[myNum.length - 1] === "0" && Number(myNum) === 0) {
    return myNum;
  }
  if (Number(myNum) > Number(max)) {
    // if (maxOverMessage) { handleWarningAlertShow(maxOverMessage); }
    return originValue;
  }
  if (Number(myNum) < Number(min)) {
    // if (minOverMessage) { handleWarningAlertShow(minOverMessage); }
    return min;
  }
  return myNum;
};

export const getFloorDecimalNumber = (value, length = 8) => {
  const number = Number(value);
  const precision = 10 ** length;
  return (Math.floor(number * precision) / precision).toFixed(length);
};

export const getSpotProfit = (amount, averagePrice, lastPrice, currencyUnit) =>
  ((Number(lastPrice) - Number(averagePrice)) * Number(amount)).toFixed(
    currencyUnit
  );

export const getTransitionRate = (previousClosingPrice, lastPrice) =>
  Number(previousClosingPrice) === 0
    ? "0"
    : (
        ((lastPrice - previousClosingPrice) / previousClosingPrice) *
        100
      ).toString();

export const getMaxAvailable = (
  dailyWithdrawableAmount,
  dailyWithdrewAmount,
  withdrawableAmount,
  fee,
  minWithdrawAmount,
  onceWithdrawableAmount
) => {
  const dailyAvailable = dailyWithdrawableAmount - dailyWithdrewAmount;
  const maxAvailable = Math.min(
    dailyAvailable,
    withdrawableAmount,
    onceWithdrawableAmount
  );
  if (
    Number(maxAvailable) <= Number(fee) ||
    Number(maxAvailable) <= Number(minWithdrawAmount)
  ) {
    return 0;
  }
  return (maxAvailable * 1 - fee * 1).toFixed(8);
};
