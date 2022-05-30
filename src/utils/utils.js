import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export function cls(...classnames) {
  return classnames.join(" ");
}

export function addDecimal(amount) {
  if (Number.isInteger(amount)) {
    return Number(amount / LAMPORTS_PER_SOL);
  } else {
    return Number(amount.toFixed(8));
  }
}
