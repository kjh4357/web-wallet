import { useEffect, useState } from "react";
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Account, Keypair } from "@solana/web3.js";
import Header from "@/components/header";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const CreateWallet = () => {
  const navigate = useNavigate();
  const [mnemonic, setMnemonic] = useState(null);
  const [arrMnemonic, setArrMnemonic] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    handleCreateWallet();
  }, []);

  const handleCreateWallet = async () => {
    const mnemonic = bip39.generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(mnemonic, "");
    const keyPair = Keypair.fromSeed(
      derivePath(`m/44'/501'/0'/0'`, seed.toString("hex")).key
    );
    const account = new Account(keyPair.secretKey);
    setMnemonic(mnemonic);
    setArrMnemonic(mnemonic.split(" "));
    setAccount(account.publicKey.toBase58());
  };

  const setSessionPublickKey = async () => {
    await sessionStorage.setItem("pubKey", account);
    navigate("/portfolio");
  };

  const onClickCopyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic);
    toast.success("클립보드에 복사됨");
  };

  return (
    <>
      <Header />
      <div className="flex flex-col justify-center w-full h-full min-h-full p-10">
        <p className="text-4xl font-bold">복구 문구 적어 두기</p>
        <div className="p-10 mt-10 bg-white shadow-xl">
          <ul className="grid grid-cols-2 data-number-list">
            {arrMnemonic &&
              arrMnemonic.map((item, index) => (
                <li
                  key={index}
                  data-index={index + 1}
                  className="py-5 text-3xl"
                >
                  {item}
                </li>
              ))}
          </ul>
          <div className="pt-10 mt-10 border-t-2">
            <button className="btn-text" onClick={onClickCopyMnemonic}>
              복사
            </button>
          </div>
        </div>
        <div className="mt-20">
          <Link to="/" className="btn-text">
            뒤로 가기
          </Link>
          <button className="mt-10 btn" onClick={setSessionPublickKey}>
            복구 문구를 저장했습니다.
          </button>
        </div>
      </div>
    </>
  );
};
