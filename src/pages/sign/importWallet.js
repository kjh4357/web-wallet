import { useEffect, useState, useContext } from "react";
import { clusterApiUrl, Connection, Keypair } from "@solana/web3.js";
import * as bip39 from "bip39";
import nacl from "tweetnacl";
import { Link, useNavigate } from "react-router-dom";
import { derivePath } from "ed25519-hd-key";
import { toast } from "react-toastify";
import KeypairContext from "@/context/keypair.context";
import Header from "@/components/header";

export const ImportWallet = (props) => {
  const navigate = useNavigate();
  const [connection, setConnection] = useState();
  const [userMnemonic, setUserMnemonic] = useState("");
  const { updateKeypair } = useContext(KeypairContext);

  useEffect(() => {
    // Solana 네트워크 연결
    setConnection(new Connection(clusterApiUrl("devnet"), "confirmed"));
    getSessionStoragePublicKey();
  }, []);

  const getSessionStoragePublicKey = () => {
    if (sessionStorage.getItem("pubKey") !== null) {
      navigate("/portfolio");
    }
  };

  const importWallet = async () => {
    const keypairs = [];
    const accounts = [];
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

      updateKeypair(wallet);
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

  return (
    <>
      <Header />
      <div className="flex flex-col items-center justify-center h-full min-h-full p-10">
        <p className="text-3xl">지갑 생성시 저장한 시드문구를 입력하세요</p>
        <textarea
          className="w-full h-56 p-10 mt-10 text-3xl"
          value={userMnemonic}
          onChange={onChangeMnemonic}
        ></textarea>
        <div className="flex flex-col w-full mt-20">
          <Link to="/" className="btn-text">
            뒤로 가기
          </Link>
          <button className="mt-10 btn" onClick={importWallet}>
            Import
          </button>
        </div>
      </div>
    </>
  );
};
