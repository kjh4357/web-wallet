import { createContext } from "react";

const KeypairContext = createContext({
  keypair: {},
  updateKeypair: () => {},
});

export default KeypairContext;
