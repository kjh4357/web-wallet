import { useEffect, useState } from "react";
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Account, Keypair } from "@solana/web3.js";
import Header from "@/components/header";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import crypto from "crypto";
import util from "util";

const pbkdf2Promise = util.promisify(crypto.pbkdf2);
const loop = 104901;

export const CreateWallet = () => {
  const navigate = useNavigate();
  const [mnemonic, setMnemonic] = useState(null);
  const [arrMnemonic, setArrMnemonic] = useState(null);
  const [account, setAccount] = useState(null);
  const [nextStep, setNextStep] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isInValid, setIsInValid] = useState(false);

  useEffect(() => {
    handleCreateWallet();
  }, []);

  useEffect(() => {
    setIsInValid(false);
  }, [password, confirm]);

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

  const onMoveNextStep = () => {
    setNextStep((prev) => !prev);
    // await sessionStorage.setItem("pubKey", account);
    // navigate("/portfolio");
  };

  const onClickCopyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic);
    toast.success("클립보드에 복사됨");
  };

  const onClickSetPassword = () => {
    if (password === confirm) {
      putWalletPassword();
    } else {
      setIsInValid(true);
    }
  };

  const putWalletPassword = async () => {
    const hashedText = await getHashedValue(password);
    const encryptMnemonic = cipher(mnemonic, hashedText.substring(0, 16));
    window.localStorage.setItem("pubKey", account);
    window.localStorage.setItem("secure", hashedText);
    window.localStorage.setItem("data", encryptMnemonic);
    navigate("/portfolio");
  };

  const getHashedValue = async (text) => {
    const key = await pbkdf2Promise(text, "", loop, 64, "sha512");
    return key.toString("base64");
  };

  const cipher = (text, key) => {
    const encrypt = crypto.createCipheriv("aes-128-ecb", key, "");
    const encryptResult =
      encrypt.update(text, "utf8", "base64") + encrypt.final("base64");
    console.log(encryptResult);
    return encryptResult;
  };

  return (
    <>
      <div className="flex flex-col justify-center w-full h-full min-h-full p-10 bg-center bg-cover md:bg-intro-pattern bg-intro-pattern-m">
        {nextStep ? (
          <div className=" md:w-full md:mx-auto md:max-w-420">
            <p className="text-4xl font-bold text-center">
              지갑의 비밀번호 설정
            </p>
            <div className="mt-10">
              <input
                type="password"
                className="px-10 py-5 text-2xl border border-gray-500 bg-card-gray"
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                type="password"
                className="px-10 py-5 mt-5 text-2xl border border-gray-500 bg-card-gray"
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {isInValid && (
              <p className="mt-3 ml-1 text-2xl font-bold text-red-600">
                비밀번호가 일치하지 않습니다.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-20 md:w-full md:mx-auto md:max-w-640">
            <p className="text-4xl font-bold">복구 문구 적어 두기</p>
            <div className="p-10 mt-10 shadow-xl bg-card-gray md:py-5">
              <ul className="grid grid-cols-2 data-number-list">
                {arrMnemonic &&
                  arrMnemonic.map((item, index) => (
                    <li
                      key={index}
                      data-index={index + 1}
                      className="py-5 text-3xl md:text-2xl lg:text-xl xl:py-3"
                    >
                      {item}
                    </li>
                  ))}
              </ul>
              <div className="pt-10 mt-10 text-center border-t border-gray-400 md:pt-5 md:mt-5">
                <button
                  className="text-3xl text-center text-white md:text-2xl"
                  onClick={onClickCopyMnemonic}
                >
                  복사
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-20 md:w-full md:mx-auto md:max-w-420 md:mt-10">
          {nextStep ? (
            <>
              <button className="btn-line" onClick={onMoveNextStep}>
                뒤로 가기
              </button>
              <button
                className="mt-10 btn"
                disabled={password.length < 1}
                onClick={onClickSetPassword}
              >
                계속하기
              </button>
            </>
          ) : (
            <>
              <Link to="/" className="btn-line">
                뒤로 가기
              </Link>
              <button className="mt-10 btn" onClick={onMoveNextStep}>
                복구 문구를 저장했습니다.
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};
