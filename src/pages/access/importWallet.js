import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { clusterApiUrl, Connection, Keypair } from "@solana/web3.js";
import * as bip39 from "bip39";
import nacl from "tweetnacl";
import { Link, useNavigate } from "react-router-dom";
import { derivePath } from "ed25519-hd-key";
import { toast } from "react-toastify";
import crypto from "crypto";
import util from "util";
import { cls } from "@/utils/utils";

const pbkdf2Promise = util.promisify(crypto.pbkdf2);
const loop = 104901;

export const ImportWallet = (props) => {
  const tabMenu = ["복구문구로", "비밀번호로"];
  const navigate = useNavigate();
  const [connection, setConnection] = useState();
  const [userMnemonic, setUserMnemonic] = useState("");
  const [userAddress, setUserAddress] = useState();
  const [userLogined, setUserLogined] = useState(false);
  const [loginMnemonic, setLoginMnemonic] = useState(false);
  const [walletPassword, setWalletPassword] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tabIndex, setTabIndex] = useState(0);
  const [wallet, setWallet] = useState();
  const [isInValid, setIsInValid] = useState(false);

  useEffect(() => {
    setIsInValid(false);
  }, [password, confirm]);

  useEffect(() => {
    // Solana 네트워크 연결
    setConnection(new Connection(clusterApiUrl("devnet"), "confirmed"));
    handleCheckUserLogin();
    // getSessionStoragePublicKey();
  }, []);

  const getSessionStoragePublicKey = () => {
    const path = Route();
    console.log(path);
    console.log();
    if (sessionStorage.getItem("pubKey") !== null) {
      navigate("/portfolio");
    }
  };

  const handleCheckUserLogin = () => {
    console.log(localStorage.getItem("data") ? true : false);
    setUserLogined(localStorage.getItem("data") ? true : false);
  };

  const onClickMnemonicLogin = async () => {
    if (bip39.validateMnemonic(userMnemonic)) {
      setLoginMnemonic(true);
    } else {
      toast.error("잘못된 복구 문구입니다.");
    }
  };

  const onChangeWalletPassword = (e) => {
    const { name, value } = e.target;
    setWalletPassword(value);
  };

  const putWalletPassword = async () => {
    const hashedText = await getHashedValue(password);
    const encryptMnemonic = cipher(userMnemonic, hashedText.substring(0, 16));

    window.localStorage.setItem("secure", hashedText);
    window.localStorage.setItem("data", encryptMnemonic);
  };

  const postLoginWalletPassword = async () => {
    const secure = window.localStorage.getItem("secure");
    const data = window.localStorage.getItem("data");

    if (secure == null || data == null) {
      console.log("No wallet password.");
      return;
    }
    if (walletPassword) {
      const hashedText = await getHashedValue(walletPassword);
      if (hashedText !== secure) {
        console.log("Password incorrect.");
        toast.error("비밀번호가 맞지 않습니다.");
        return;
      }
      console.log("Password correct.");
      const userMnemonic = decipher(data, hashedText.substring(0, 16));
      console.log(userMnemonic);
      setUserMnemonic(userMnemonic);
    }
  };

  useEffect(() => {
    if (walletPassword && tabIndex === 1) {
      handlePasswordLogin();
    }
  }, [userMnemonic]);

  const handlePasswordLogin = async () => {
    await importWallet();
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

  const decipher = (text, key) => {
    const decode = crypto.createDecipheriv("aes-128-ecb", key, "");
    const decodeResult =
      decode.update(text, "base64", "utf8") + decode.final("utf8");
    console.log(decodeResult);
    return decodeResult;
  };

  const importWallet = async () => {
    const keypairs = [];
    const accounts = [];
    console.log(userMnemonic);
    if (bip39.validateMnemonic(userMnemonic)) {
      const seed = bip39.mnemonicToSeedSync(userMnemonic, ""); // prefer async mnemonicToSeed

      const bip39KeyPair = Keypair.fromSecretKey(
        nacl.sign.keyPair.fromSeed(seed.slice(0, 32)).secretKey
      );
      keypairs.push(bip39KeyPair);
      accounts.push(bip39KeyPair.publicKey);
      console.log(`bip39KeyPair => ${bip39KeyPair.publicKey.toBase58()}`);

      for (let i = 0; i < 10; i++) {
        const path = `m/44'/501'/0'/${i}'`;
        const keypair = Keypair.fromSeed(
          derivePath(path, seed.toString("hex")).key
        );
        console.log(`${path} => ${keypair.publicKey.toBase58()}`);
        keypairs.push(keypair);
        accounts.push(keypair.publicKey);
      }

      for (let i = 0; i < 10; i++) {
        const path = `m/44'/501'/${i}'/0'`;
        const keypair = Keypair.fromSeed(
          derivePath(path, seed.toString("hex")).key
        );
        console.log(`${path} => ${keypair.publicKey.toBase58()}`);
        keypairs.push(keypair);
        accounts.push(keypair.publicKey);
      }

      const accountsInfo = await connection.getMultipleAccountsInfo(accounts);
      console.log(accountsInfo);
      const availAccount = [];
      accountsInfo.forEach((account, i) => {
        if (account != null) {
          console.log(account.owner.toBase58());
          console.log(keypairs[i]);
          availAccount.push(keypairs[i]);
        }
      });

      console.log("availAccount: ", availAccount.length);

      let wallet = Keypair.fromSeed(
        derivePath(`m/44'/501'/0'/0'`, seed.toString("hex")).key
      );
      if (availAccount.length > 0) {
        wallet = availAccount[0];
      }
      console.log(wallet);

      setWallet(wallet);
      setUserAddress(wallet.publicKey.toBase58());
      setSessionStoragePublicKey(wallet.publicKey.toBase58());
      navigate("/portfolio");
    } else {
      toast.error("잘못된 복구 문구입니다.");
    }
  };

  const setSessionStoragePublicKey = (pubKey) => {
    sessionStorage.setItem("pubKey", pubKey);
  };

  const onChangeMnemonic = (e) => {
    setUserMnemonic(e.target.value);
  };

  const onClickSetPassword = async () => {
    if (password === confirm) {
      await importWallet();
      putWalletPassword();
    } else {
      setIsInValid(true);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center h-full min-h-full p-10">
        {userLogined && (
          <div className="absolute top-0 left-0 w-full">
            <ul className="flex w-full text-center">
              {tabMenu.map((item, index) => (
                <li
                  key={index.toString()}
                  className={cls(
                    "w-1/2  bg-white text-3xl",
                    index === tabIndex ? "active" : null
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setTabIndex(index)}
                    className={cls(
                      "w-full py-10",
                      index === tabIndex
                        ? "loa-gradient text-white font-bold"
                        : ""
                    )}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tabIndex === 0 ? (
          <>
            {!loginMnemonic ? (
              <div>
                <p className="text-3xl">
                  지갑 생성시 저장한 시드문구를 입력하세요
                </p>
                <textarea
                  className="w-full h-56 p-10 mt-10 text-3xl"
                  value={userMnemonic}
                  onChange={onChangeMnemonic}
                ></textarea>
                <div className="flex flex-col w-full mt-20">
                  <Link to="/" className="btn-text">
                    뒤로 가기
                  </Link>
                  <button
                    className="mt-10 btn"
                    onClick={onClickMnemonicLogin}
                    disabled={userMnemonic.length < 1}
                  >
                    계속하기
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-3xl">비밀번호 설정</p>
                <div className="mt-10">
                  <input
                    type="password"
                    className="px-10 py-5 text-2xl"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    className="px-10 py-5 mt-5 text-2xl"
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
                {isInValid && (
                  <p className="mt-3 ml-1 text-2xl font-bold text-red-600">
                    비밀번호가 일치하지 않습니다.
                  </p>
                )}
                <div className="flex flex-col w-full mt-20">
                  <button
                    className="btn-text"
                    onClick={() => setLoginMnemonic(false)}
                  >
                    뒤로 가기
                  </button>
                  <button className="mt-10 btn" onClick={onClickSetPassword}>
                    계속하기
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div>
            <p className="text-3xl">설정한 지갑 비밀번호로 로그인하세요</p>
            <div className="mt-10">
              <input
                type="password"
                className="px-10 py-5 text-2xl"
                onChange={onChangeWalletPassword}
              />
            </div>
            <div className="flex flex-col w-full mt-20">
              <Link to="/" className="btn-text">
                뒤로 가기
              </Link>
              <button className="mt-10 btn" onClick={postLoginWalletPassword}>
                Import
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
