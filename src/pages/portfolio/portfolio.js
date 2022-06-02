import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Icon from "@mdi/react";
import {
  mdiRedo,
  mdiFileMultipleOutline,
  mdiClose,
  mdiChevronRight,
} from "@mdi/js";
import * as splToken from "@solana/spl-token";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import * as bip39 from "bip39";
import nacl from "tweetnacl";
import { getUserTokens } from "@/api/token";
import { addDecimal } from "@/utils/utils";
import Modal from "@/components/modal";
import Header from "@/components/header";
import { generateFromString } from "generate-avatar";
import { useNavigate } from "react-router-dom";
import crypto from "crypto";
import { derivePath } from "ed25519-hd-key";
import KeypairContext from "@/context/keypair.context";

const solanaDecimalLength = String(LAMPORTS_PER_SOL).length;

export const Portfolio = () => {
  const navigate = useNavigate();
  const [connection, setConnection] = useState(null);
  const [pubKey, setPubkey] = useState(null);
  const [sendTokenModal, setSendTokenModal] = useState(false);
  const [receiptModal, setReceiptModal] = useState(false);
  const [typedMessage, setTypedMessage] = useState(false);
  const [isSolanaToken, setIsSolanaToken] = useState(false);

  const [tokenList, setTokenList] = useState([]);
  const [allTokenList, setAllTokenList] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [solanaTokenData, setSolanaTokenData] = useState(null);
  const [toAddress, setToAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [solanaAmount, setSolanaAmount] = useState(null);
  const [remainSolanaAmount, setRemainSolanaAmount] = useState(null);
  const [remainTokenAmount, setRemainTokenAmount] = useState(null);
  const [userMnemonic, setUserMnemonic] = useState("");
  const [wallet, setWallet] = useState();
  const [fee, setFee] = useState(null);
  const { keypair, updateKeypair } = useContext(KeypairContext);

  useEffect(() => {
    // Solana 네트워크 연결
    setConnection(
      new Connection(
        clusterApiUrl(process.env.REACT_APP_SOLANA_CLUSTER_TARGET),
        "confirmed"
      )
    );
    getLocalStorageUserData();
    getSessionStorageCoinList();
  }, []);

  useEffect(() => {
    importWallet();
    getSolanaBalance();
  }, [pubKey, userMnemonic]);

  const getLocalStorageUserData = () => {
    if (localStorage.getItem("data") === null) {
      navigate("/");
    } else {
      handleGetUserMnemonic();
    }
  };

  const handleGetUserMnemonic = () => {
    const data = localStorage.getItem("data");
    const hashedText = localStorage.getItem("secure");
    const userMnemonic = decipher(data, hashedText.substring(0, 16));
    setUserMnemonic(userMnemonic);
  };

  const getSessionStorageCoinList = () => {
    setAllTokenList(JSON.parse(sessionStorage.getItem("tokenList")));
  };

  useEffect(() => {
    setSolanaTokenData({
      name: "Solana",
      symbol: "SOL",
      decimal: solanaDecimalLength,
      imageUrl: allTokenList.logoURI,
    });
  }, [allTokenList]);

  const handleFindTokenData = async (tokenAddress) => {
    console.log(allTokenList);
    if (allTokenList) {
      const res = await allTokenList.tokens.find(
        (item) => item.address === tokenAddress
      );
      console.log(res);
      return res;
    }
  };

  const getSolanaBalance = async () => {
    if (pubKey) {
      const newPubKey = new PublicKey(pubKey);
      const balance = await connection.getBalance(newPubKey);
      setTokenList([
        {
          tokenName: "SOL",
          balance: addDecimal(balance, solanaDecimalLength),
          decimal: solanaDecimalLength,
        },
      ]);
      setSolanaAmount(addDecimal(balance, solanaDecimalLength));
      await getTokens(newPubKey);
    }
  };

  useEffect(() => {
    if (toAddress) {
      validateSolAddress(toAddress);
    }
  }, [toAddress]);

  const validateSolAddress = async (toAddress) => {
    try {
      let pubkey = new PublicKey(toAddress);
      let isSolana = await PublicKey.isOnCurve(pubkey);
      setIsSolanaToken(isSolana);
    } catch (err) {
      setIsSolanaToken(false);
    }
  };

  const getTokens = async (newPubKey) => {
    if (newPubKey) {
      const data = {
        jsonrpc: "2.0",
        id: 1,
        method: "getProgramAccounts",
        params: [
          process.env.REACT_APP_TOKEN_PROGRAM_ACCOUNT,
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
        console.log(response.data.result);
        const userTokenList = response.data.result;

        userTokenList.map(async (item) => {
          let coinData = await handleFindTokenData(
            item.account.data.parsed.info.mint
          );
          setTokenList((prev) => [
            ...prev,
            {
              tokenName: item.account.data.parsed.info.mint,
              balance: addDecimal(
                item.account.data.parsed.info.tokenAmount.uiAmount,
                item.account.data.parsed.info.tokenAmount.decimals
              ),
              balanceString:
                item.account.data.parsed.info.tokenAmount.uiAmountString,
              decimal: item.account.data.parsed.info.tokenAmount.decimals,
              data: coinData,
            },
          ]);
        });
        console.log(tokenList);
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

  const decipher = (text, key) => {
    const decode = crypto.createDecipheriv("aes-128-ecb", key, "");
    const decodeResult =
      decode.update(text, "base64", "utf8") + decode.final("utf8");
    return decodeResult;
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

      for (let i = 0; i < 10; i++) {
        const path = `m/44'/501'/0'/${i}'`;
        const keypair = Keypair.fromSeed(
          derivePath(path, seed.toString("hex")).key
        );
        keypairs.push(keypair);
        accounts.push(keypair.publicKey);
      }

      for (let i = 0; i < 10; i++) {
        const path = `m/44'/501'/${i}'/0'`;
        const keypair = Keypair.fromSeed(
          derivePath(path, seed.toString("hex")).key
        );
        keypairs.push(keypair);
        accounts.push(keypair.publicKey);
      }

      const accountsInfo = await connection.getMultipleAccountsInfo(accounts);
      const availAccount = [];
      accountsInfo.forEach((account, i) => {
        if (account != null) {
          availAccount.push(keypairs[i]);
        }
      });

      let wallet = Keypair.fromSeed(
        derivePath(`m/44'/501'/0'/0'`, seed.toString("hex")).key
      );
      if (availAccount.length > 0) {
        wallet = availAccount[0];
      }
      setWallet(wallet);
      updateKeypair(wallet);
      setPubkey(wallet.publicKey.toBase58());
      localStorage.setItem("pubKey", wallet.publicKey.toBase58());
    }
  };

  const onClickMoveTransactionList = () => {
    navigate("/history");
  };

  const onClickTokenSend = async () => {
    if (sendAmount) {
      if (toAddress) {
        if (isSolanaToken) {
          console.log(selectedToken);
          const fees = await getTransactionFee();
          setFee(addDecimal(fees, solanaDecimalLength));
          if (selectedToken.tokenName === "SOL") {
            const resultSendAmount =
              solanaAmount -
              addDecimal(fees, solanaDecimalLength) -
              Number(sendAmount);
            if (resultSendAmount >= 0) {
              setRemainSolanaAmount(
                addDecimal(resultSendAmount, solanaDecimalLength)
              );
              setReceiptModal(true);
              setSendTokenModal(false);
            } else {
              toast.error("SOL 잔액을 확인해주세요");
            }
          } else {
            const calSolAmount =
              solanaAmount - addDecimal(fees, solanaDecimalLength);
            const calTokenAmount =
              Number(selectedToken.balance) - Number(sendAmount);
            if (calSolAmount >= 0 && calTokenAmount >= 0) {
              setRemainTokenAmount(
                addDecimal(calTokenAmount, selectedToken.decimal)
              );
              setReceiptModal(true);
              setSendTokenModal(false);
            } else {
              toast.error("SOL 잔액 또는 토큰 잔액을 확인해주세요");
            }
          }
        } else {
          toast.error("올바른 토큰 주소가 아닙니다.");
        }

        // setReceiptModal(true);
        // setSendTokenModal(false);
      } else {
        toast.error("토큰을 보낼 주소를 적어주세요");
      }
    } else {
      toast.error("수량을 확인해주세요");
    }
  };

  const getTransactionFee = async () => {
    // 솔라나 토큰 Transaction Fee
    let transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(toAddress),
        lamports: LAMPORTS_PER_SOL, //Investing 1 SOL. Remember 1 Lamport = 10^-9 SOL.
      })
    );

    let responseBlockhash = await connection.getLatestBlockhash("finalized");
    transaction.recentBlockhash = responseBlockhash.blockhash;
    transaction.feePayer = wallet.publicKey;
    const response = await connection.getFeeForMessage(
      transaction.compileMessage(),
      "confirmed"
    );
    // const fee = addDecimal(response.value, solanaDecimalLength);
    // console.log(fee);

    return response.value;
  };

  const sendToken = async () => {
    console.log(selectedToken);
    if (selectedToken.tokenName === "SOL") {
      const res = await postTransferTokenForSolana();
      if (res) {
        setReceiptModal(false);
        navigate("/history");
      }
    } else {
      const res = await postTransferToken();
      if (res) {
        setReceiptModal(false);
        navigate("/history");
      }
    }
  };

  const postTransferTokenForSolana = async () => {
    const amount = sendAmount * Math.pow(10, selectedToken.decimal - 1);
    let transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(toAddress),
        lamports: amount, //Investing 1 SOL. Remember 1 Lamport = 10^-9 SOL.
      })
    );
    const result = await sendAndConfirmTransaction(connection, transaction, [
      wallet,
    ]);
    return result;
  };

  const postTransferToken = async () => {
    const mint = new PublicKey(selectedToken.tokenName);
    const amount = sendAmount * Math.pow(10, selectedToken.decimal);
    console.log(amount);
    const fromAccount = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mint,
      wallet.publicKey
    );

    const toAccount = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mint,
      new PublicKey(toAddress)
    );

    const transaction = await splToken.transfer(
      connection,
      wallet,
      fromAccount.address,
      toAccount.address,
      wallet,
      amount
    );
    return transaction;
    // setTransactionId(transaction);
  };

  // 3UmcizVy9Gsa5QLnDBqh6gqc8wVqKnNbriT1UGttHSoZ

  return (
    <>
      <Modal isModalOpen={receiptModal} setModalOpen={setReceiptModal}>
        <div className="p-10 break-words">
          <p className="text-3xl">From</p>
          <p className="mt-5 text-2xl">{pubKey}</p>
          <p className="mt-10 text-3xl">To</p>
          <p className="mt-5 text-2xl">{toAddress}</p>
          <p className="mt-10 text-3xl">보낼 수량</p>
          {selectedToken && (
            <p className="mt-5 text-2xl">
              {addDecimal(sendAmount, selectedToken.decimal)}{" "}
              {selectedToken.tokenName}
            </p>
          )}

          <p className="mt-10 text-3xl">Fee</p>
          <p className="mt-5 text-2xl">
            {addDecimal(fee, solanaDecimalLength)} SOL
          </p>
          <p className="mt-10 text-3xl">남은 수량</p>
          {selectedToken && (
            <p className="mt-5 text-2xl">
              {selectedToken.tokenName === "SOL"
                ? remainSolanaAmount
                : remainTokenAmount}{" "}
              {selectedToken.tokenName}
            </p>
          )}
          <div className="mt-20 text-center">
            <button
              type="button"
              className="inline-block w-1/2 h-20 text-2xl font-medium text-white rounded-md loa-gradient"
              onClick={sendToken}
            >
              보내기
            </button>
          </div>
          <button
            type="button"
            className="absolute text-2xl font-medium text-black outline-none top-5 right-5"
            onClick={() => setReceiptModal(false)}
          >
            <Icon path={mdiClose} size={1.5} color="black" />
          </button>
        </div>
      </Modal>
      <Modal isModalOpen={sendTokenModal} setModalOpen={setSendTokenModal}>
        {selectedToken &&
          (typedMessage ? (
            <div></div>
          ) : (
            <div className="py-10 md:min-w-640">
              <div className="text-center">
                <h1 className="pb-5 text-3xl font-bold border-b-2">
                  {selectedToken.tokenName} 보내기
                </h1>
                <p className="px-10 mt-10 text-3xl">
                  잔액 :{" "}
                  {addDecimal(selectedToken.balance, selectedToken.decimal)}{" "}
                  {selectedToken.tokenName.substr(0, 3).toUpperCase()}
                </p>
              </div>
              <div className="mt-10">
                <input
                  type="text"
                  className="text-3xl"
                  onChange={(e) => setSendAmount(e.target.value)}
                />
                <p className="text-right">
                  {selectedToken.tokenName.substr(0, 3).toUpperCase()}
                </p>
              </div>
              <div className="mt-10 text-3xl">
                <p className="mb-2">From</p>
                <input
                  type="text"
                  value={pubKey}
                  className="text-3xl"
                  readOnly
                />
              </div>
              <div className="mt-10 text-3xl">
                <p className="mb-2">To</p>
                <input
                  type="text"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                />
              </div>
              {!isSolanaToken && toAddress.length > 0 && (
                <p>이건 솔라나 토큰이 아님</p>
              )}
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
          ))}
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
            {tokenList.length > 0 &&
              tokenList.map((item, index) => (
                <li key={index.toString()} className="py-5 pl-5 border-b-2 ">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center flex-shrink-0 mr-10 text-3xl truncate">
                      {index === 0 ? (
                        <img
                          src={solanaTokenData.imageUrl}
                          alt=""
                          className="w-16 h-16 mr-4 rounded-full"
                        />
                      ) : item.data ? (
                        <img
                          src={item.data.logoURI}
                          alt=""
                          className="w-16 h-16 mr-4 rounded-full"
                        />
                      ) : (
                        <img
                          src={`data:image/svg+xml;utf8,${generateFromString(
                            item.tokenName
                          )}`}
                          alt=""
                          className="w-16 h-16 mr-4 rounded-full"
                        />
                      )}

                      <span className="font-bold truncate">
                        {index === 0
                          ? solanaTokenData.name
                          : item.data
                          ? item.data.symbol
                          : "UNKNOWN"}
                      </span>
                    </div>
                    <div className="flex items-center flex-shrink-0">
                      <span className="text-2xl font-bold">
                        {item.balance}
                        {index === 0 ? (
                          <span className="ml-5">
                            {item.tokenName.substr(0, 3).toUpperCase()}
                          </span>
                        ) : item.data ? (
                          <span>{item.data.symbol}</span>
                        ) : null}
                      </span>
                      <button
                        type="button"
                        className="cursor-pointer"
                        onClick={onClickMoveTransactionList}
                      >
                        <Icon path={mdiChevronRight} size={2} color="#ddd" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-5 text-center">
                    <button
                      onClick={() => onClickOpenTokenSendModal(item)}
                      className="inline-block px-8 py-3 text-2xl text-black border-2 rounded-md cursor-pointer hover-gradient"
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
