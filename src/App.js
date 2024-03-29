import { Suspense, useContext, useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { Home } from "@/pages/home/home";
import { Portfolio } from "@/pages/portfolio/portfolio";
import { ImportWallet } from "@/pages/access/importWallet";
import { getSolanaTokenList } from "@/api/token";
import { CreateWallet } from "@/pages/access/createWallet";
import { TransactionList } from "@/pages/history/transactionList";
import "react-toastify/dist/ReactToastify.css";
import "./global.css";

import { LockedWallet } from "./pages/access/lockedWallet";
import "./utils/api.js";
import SolanaTokenContext from "./context/solanaToken.context";
import {apiTarget, clusterTarget} from "./utils/utils";

const App = () => {
  const navigate = useNavigate();
  const [connection, setConnection] = useState();
  const [isLocked, setIsLocked] = useState(false);
  const [isLogined, setIsLogined] = useState(false);
  const { updateSolanaToken } = useContext(SolanaTokenContext);

  useEffect(() => {
    setConnection(new Connection(apiTarget, "confirmed"));
    getTokenList();
    checkSrt();
    handleGetWalletLocking();
    setApiTarget();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setApiTarget = () => {
    if (localStorage.getItem("roacoreconfig") === null) {
      localStorage.setItem(
        "roacoreconfig",
        process.env.REACT_APP_SOLANA_CLUSTER_TARGET
      );
    }
  };

  const checkSrt = () => {
    if (localStorage.getItem("srt")) {
      checkLockedTime();
    } else {
      localStorageSetTime();
    }
  };

  const localStorageSetTime = () => {
    const date = new Date();
    const currentTime = date.getTime();
    localStorage.setItem("srt", currentTime);
    setTimeout(() => {
      setIsLocked(true);
    }, 900000);
  };

  const checkLockedTime = () => {
    const date = new Date();
    const dueTIme = 900000;
    const currentTime = date.getTime();
    const prevTime = Number(localStorage.getItem("srt"));
    if (prevTime + dueTIme < currentTime) {
      setIsLocked(true);
    } else {
      handleWalletLockTimer();
    }
  };

  const handleWalletLockTimer = () => {
    const date = new Date();
    const dueTIme = 900000;
    const currentTime = date.getTime();
    const prevTime = Number(localStorage.getItem("srt"));
    setTimeout(() => {
      setIsLocked(true);
    }, dueTIme + prevTime - currentTime);
  };

  useEffect(() => {
    if (isLocked && isLogined) {
      navigate("/locked");
    } else if (!isLocked && isLogined) {
      navigate("/portfolio");
    } else {
      navigate("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked, isLogined]);

  const getTokenList = async () => {
    const response = await getSolanaTokenList();
    if (response.status === 200) {
      updateSolanaToken(response.data);
      // sessionStorage.setItem("tokenList", JSON.stringify(response.data));
    }
  };

  const handleGetWalletLocking = () => {
    setIsLocked(localStorage.getItem("locked") ? true : false);
    setIsLogined(localStorage.getItem("data") ? true : false);
  };

  return (
    <Suspense fallback={<span>Loading</span>}>
      <ToastContainer
        theme="dark"
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        <Route path="/" element={<Home solanaConnection={connection} />} />
        <Route path="locked" element={<LockedWallet />} />
        <Route path="create" element={<CreateWallet />} />
        <Route path="access" element={<ImportWallet {...connection} />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="history" element={<TransactionList />} />
      </Routes>
    </Suspense>
  );
};

export default App;
