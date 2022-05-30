import { Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { Home } from "@/pages/home/home";
import { Portfolio } from "@/pages/portfolio/portfolio";
import { ImportWallet } from "@/pages/access/importWallet";
import { getSolanaTokenList } from "@/api/token";
import { CreateWallet } from "@/pages/access/createWallet";
import "react-toastify/dist/ReactToastify.css";
import "./global.css";
import { TransactionList } from "./pages/history/transactionList";

const App = () => {
  const [connection, setConnection] = useState();
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    setConnection(new Connection(clusterApiUrl("devnet"), "confirmed"));
    getTokenList();
  }, []);

  useEffect(() => {
    getUserData();
  }, []);

  const getTokenList = async () => {
    const response = await getSolanaTokenList();
    if (response.status === 200) {
      sessionStorage.setItem("tokenList", JSON.stringify(response.data));
    }
  };

  const getUserData = () => {
    setIsLogin(localStorage.getItem("data") !== null);
  };

  return (
    <Suspense fallback={<span>Loading</span>}>
      <ToastContainer
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
        <Route path="create" element={<CreateWallet />} />
        <Route path="access" element={<ImportWallet {...connection} />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="history" element={<TransactionList />} />
      </Routes>
    </Suspense>
  );
};

export default App;
