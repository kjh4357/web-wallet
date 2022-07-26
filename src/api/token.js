import axios from "axios";
import instance from "../utils/api";

export const getSolanaTokenList = async (data) => {
  const response = await axios.get(
    "https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json",

    {
      headers: {
        "Content-type": "application/json",
        Accept: "application/json",
      },
    }
  );
  return response;
};

export const getUserTokens = async (data) => {
  const response = await instance.post(
    // "https://api.mainnet-beta.solana.com",

    "/",
    data,
    {
      headers: {
        "Content-type": "application/json",
        Accept: "application/json",
      },
    }
  );
  return response;
};
