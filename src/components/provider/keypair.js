import React, { useState } from "react";
import KeypairContext from "@/context/keypair.context";

const KeypairProvider = ({ children }) => {
  const updateKeypair = (props) => {
    setKeypair((prevState) => {
      return {
        ...prevState,
        keypair: props,
      };
    });
  };
  const initialState = {
    keypair: {},
    updateKeypair,
  };
  const [keypair, setKeypair] = useState(initialState);

  return (
    <KeypairContext.Provider value={keypair}>
      {children}
    </KeypairContext.Provider>
  );
};

export default KeypairProvider;
