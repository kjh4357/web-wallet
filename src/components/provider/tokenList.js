import React, { useState } from "react";
import SolanaTokenContext from "@/context/solanaToken.context";

const SolanaTokenListProvider = ({ children }) => {
  const updateSolanaToken = (props) => {
    setSolanaTokenList((prevState) => {
      return {
        ...prevState,
        solanaTokenList: props,
      };
    });
  };
  const initialState = {
    solanaTokenList: [],
    updateSolanaToken,
  };
  const [solanaTokenList, setSolanaTokenList] = useState(initialState);
  return (
    <SolanaTokenContext.Provider value={solanaTokenList}>
      {children}
    </SolanaTokenContext.Provider>
  );
};

export default SolanaTokenListProvider;
