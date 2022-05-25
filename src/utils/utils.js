export function cls(...classnames) {
  return classnames.join(" ");
}

export function addDecimal(amount) {
  if (Number.isInteger(amount)) {
    return amount / 1000000000;
  } else {
    return amount.toFixed(8);
  }
}
