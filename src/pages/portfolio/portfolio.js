import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Icon from "@mdi/react";
import {
  mdiRedo,
  mdiFileMultipleOutline,
  mdiClose,
  mdiChevronRight,
} from "@mdi/js";
import { Link } from "react-router-dom";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { getUserTokens } from "@/api/token";
import { addDecimal } from "@/utils/utils";
import Modal from "@/components/modal";
import Header from "@/components/header";
import { generateFromString } from "generate-avatar";
import { useNavigate } from "react-router-dom";
import KeypairContext from "@/context/keypair.context";

export const Portfolio = () => {
  const navigate = useNavigate();
  const [connection, setConnection] = useState(null);
  const [pubKey, setPubkey] = useState(null);
  const [sendTokenModal, setSendTokenModal] = useState(false);
  const [tokenList, setTokenList] = useState([]);
  const [allTokenList, setAllTokenList] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [toAddress, setToAddress] = useState("");
  const [solanaTokenData, setSolanaTokenData] = useState(null);
  const value = useContext(KeypairContext);

  useEffect(() => {
    // Solana 네트워크 연결
    setConnection(new Connection(clusterApiUrl("devnet"), "confirmed"));
    getSessionStoragePublicKey();
    getSessionStorageCoinList();
  }, []);

  const getSessionStoragePublicKey = () => {
    if (sessionStorage.getItem("pubKey") === null) {
      navigate("/");
    }
  };

  const getSessionStorageCoinList = () => {
    setAllTokenList(JSON.parse(sessionStorage.getItem("tokenList")));
    console.log(allTokenList);
  };

  useEffect(() => {
    const pub = sessionStorage.getItem("pubKey");
    setPubkey(pub);
  }, []);

  useEffect(() => {
    console.log(allTokenList);
    setSolanaTokenData({
      name: "Solana",
      symbol: "SOL",
      imageUrl: allTokenList.logoURI,
    });
  }, [allTokenList]);

  useEffect(() => {
    getSolanaBalance();
  }, [connection]);

  const getSolanaBalance = async () => {
    if (pubKey) {
      const newPubKey = new PublicKey(pubKey);
      const balance = await connection.getBalance(newPubKey);
      setTokenList([
        {
          tokenName: "SOL",
          balance,
        },
      ]);
      await getTokens(newPubKey);
    }
  };

  const getTokens = async (newPubKey) => {
    if (newPubKey) {
      const data = {
        jsonrpc: "2.0",
        id: 1,
        method: "getProgramAccounts",
        params: [
          "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          {
            encoding: "jsonParsed",
            filters: [
              {
                dataSize: 165,
              },
              {
                memcmp: {
                  offset: 32,
                  bytes: newPubKey,
                },
              },
            ],
          },
        ],
      };

      const response = await getUserTokens(data);
      if (response.status === 200) {
        const tokenList = response.data.result;
        tokenList.map((item) => {
          setTokenList((prev) => [
            ...prev,
            {
              tokenName: item.pubkey,
              balance: item.account.data.parsed.info.tokenAmount.uiAmount,
            },
          ]);
        });
      }
    }
    // setTokens(response.data.result);
  };

  const onClickTextCopy = (e) => {
    var range = document.createRange();
    range.selectNode(document.getElementById("publicKey"));
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand("copy");
    sel.removeRange(range);
    toast.success("클립보드에 복사됨");
  };

  const onClickOpenTokenSendModal = (item) => {
    setSendTokenModal(true);
    setSelectedToken(item);
  };

  const onClickTokenSend = async () => {
    const test = await connection.getFeeCalculatorForBlockhash(toAddress);
    console.log(test);
  };

  // const postTransferToken = async () => {
  //   const mint = new PublicKey(tokenAddress);

  //   const fromAccount = await splToken.getOrCreateAssociatedTokenAccount(
  //     connection,
  //     wallet,
  //     mint,
  //     wallet.publicKey
  //   );

  //   const toAccount = await splToken.getOrCreateAssociatedTokenAccount(
  //     connection,
  //     wallet,
  //     mint,
  //     new PublicKey(toAddress)
  //   );

  //   console.log(mint, fromAccount, toAccount);

  //   const transaction = await splToken.transfer(
  //     connection,
  //     wallet,
  //     fromAccount.address,
  //     toAccount.address,
  //     wallet,
  //     1
  //   );
  //   console.log(transaction);
  //   setTransactionId(transaction);
  // };

  // 3UmcizVy9Gsa5QLnDBqh6gqc8wVqKnNbriT1UGttHSoZ

  return (
    <>
      <Modal isModalOpen={sendTokenModal} setModalOpen={setSendTokenModal}>
        {selectedToken && (
          <div className="py-10">
            <div className="text-center">
              <h1 className="pb-5 text-3xl font-bold border-b-2">
                {selectedToken.tokenName} 보내기
              </h1>
              <p className="px-10 mt-10 text-3xl">
                잔액 : {addDecimal(selectedToken.balance)}{" "}
                {selectedToken.tokenName.substr(0, 3).toUpperCase()}
              </p>
            </div>
            <div className="mt-10">
              <input type="text" />
              <p className="text-right">
                {selectedToken.tokenName.substr(0, 3).toUpperCase()}
              </p>
            </div>
            <div className="mt-10 text-3xl">
              <p className="mb-2">From</p>
              <input type="text" value={pubKey} readOnly />
            </div>
            <div className="mt-10 text-3xl">
              <p className="mb-2">To</p>
              <input
                type="text"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
              />
            </div>
            <div className="mt-20 text-center">
              <button
                type="button"
                className="inline-block w-1/2 h-20 text-2xl font-medium text-white rounded-md loa-gradient"
                onClick={onClickTokenSend}
              >
                보내기
              </button>
            </div>
            <button
              type="button"
              className="absolute text-2xl font-medium text-black outline-none top-5 right-5"
              onClick={() => setSendTokenModal(false)}
            >
              <Icon path={mdiClose} size={1.5} color="black" />
            </button>
          </div>
        )}
      </Modal>
      <Header />
      <div className="px-10 pt-40 pb-20">
        <div className="flex flex-col items-center px-5 py-16 bg-white shadow-xl rounded-xl">
          <div className="w-48 h-48 bg-red-800 rounded-full">
            {pubKey && (
              <img
                className="rounded-full"
                src={`data:image/svg+xml;utf8,${generateFromString(pubKey)}`}
                alt=""
              />
            )}
          </div>
          <p
            id="publicKey"
            className="px-5 py-2 mt-5 text-2xl font-medium break-all"
          >
            {pubKey}
          </p>
          <button
            onClick={onClickTextCopy}
            className="flex items-center justify-center mt-2 rounded-full"
          >
            <Icon path={mdiFileMultipleOutline} size={1.5} color="#603669" />
          </button>
          <button
            onClick={() => onClickOpenTokenSendModal(tokenList[0])}
            className="mt-10 text-center"
          >
            <span className="flex items-center justify-center w-20 h-20 rounded-full loa-gradient">
              <Icon path={mdiRedo} size={2} color="white" />
            </span>
            <span className="inline-block mt-2 text-2xl font-bold">보내기</span>
          </button>
        </div>
        <div className="p-10 mt-10 bg-white shadow-lg x-10 rounded-xl">
          <h2 className="mb-10 text-4xl font-black">자산</h2>
          <ul className="border-t-2">
            {tokenList.map((item, index) => (
              <li key={index.toString()} className="py-5 pl-5 border-b-2 ">
                <div className="flex items-center justify-between">
                  <div className="flex items-center mr-10 text-3xl truncate">
                    {index === 0 && (
                      <img
                        src={solanaTokenData.imageUrl}
                        alt=""
                        className="w-16 h-16 mr-4 rounded-full"
                      />
                    )}
                    <span className="font-bold truncate ">
                      {index === 0 && solanaTokenData.name}({item.tokenName})
                    </span>
                  </div>
                  <div className="flex items-center flex-shrink-0">
                    <span className="mr-5 text-2xl font-bold">
                      {addDecimal(item.balance)}
                      <span className="ml-3">
                        {item.tokenName.substr(0, 3).toUpperCase()}
                      </span>
                    </span>
                    <Link to="/">
                      <Icon path={mdiChevronRight} size={2} color="#ddd" />
                    </Link>
                  </div>
                </div>
                <div className="mt-5 text-center">
                  <button
                    onClick={() => onClickOpenTokenSendModal(item)}
                    className="inline-block px-8 py-3 text-2xl text-white rounded-md loa-gradient"
                  >
                    보내기
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};
