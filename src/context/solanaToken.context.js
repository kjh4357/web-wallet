import { createContext } from "react";

const SolanaTokenContext = createContext({
  solanaTokenList: [],
  updateSolanaToken: () => {},
});

export default SolanaTokenContext;
