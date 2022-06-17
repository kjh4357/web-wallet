import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { BrowserRouter } from "react-router-dom";
import KeypairProvider from "./components/provider/keypair";
import SolanaTokenContext from "./components/provider/tokenList";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <SolanaTokenContext>
      <KeypairProvider>
        <App />
      </KeypairProvider>
    </SolanaTokenContext>
  </BrowserRouter>
);
