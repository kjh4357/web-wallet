import "./App.css";
import { useEffect, useState } from "react";
import * as bip39 from "bip39";
import nacl from "tweetnacl";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  Account,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
  LAMPORTS_PER_SOL2,
} from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import axios from "axios";
import { derivePath } from "ed25519-hd-key";
import { fromString } from "uint8arrays/from-string";

function App() {
  const [connection, setConnection] = useState();
  const [mnemonic, setMnemonic] = useState();
  const [address, setAddress] = useState();

  const [wallet, setWallet] = useState();
  const [userMnemonic, setUserMnemonic] = useState(
    "pencil range middle satisfy south mosquito appear next recipe raise march fuel"
  );
  const [userAddress, setUserAddress] = useState();
  const [balance, setBalance] = useState();
  const [tokenAddress, setTokenAddress] = useState(
    "AnqSrWGXn5JmSicpezJaEBYkJ1FTt9bu3rfZKXYcxxQV"
  );
  const [amount, setAmount] = useState();
  const [balanceMintToken, setBalanceMintToken] = useState();
  const [toAddress, setToAddress] = useState();
  const [transactionId, setTransactionId] = useState();
  const [transactions, setTransactions] = useState([]);
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    // Solana 네트워크 연결
    setConnection(
      new Connection(
        //clusterApiUrl('mainnet-beta'),
        clusterApiUrl("devnet"),
        "confirmed"
      )
    );
  }, []);

  const createWallet = async () => {
    const mnemonic = bip39.generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(mnemonic, ""); // prefer async mnemonicToSeed
    //const keyPair = nacl.sign.keyPair.fromSeed(seed.slice(0, 32));

    // BIP44
    const keyPair = Keypair.fromSeed(
      derivePath(`m/44'/501'/0'/0'`, seed.toString("hex")).key
    );
    const account = new Account(keyPair.secretKey);
    setMnemonic(mnemonic);
    setAddress(account.publicKey.toBase58());
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
      setWallet(wallet);
      setUserAddress(wallet.publicKey.toBase58());
    }
    //let secretKey = Uint8Array.from([5,221,176,230,254,69,103,184,153,84,150,59,138,40,111,219,93,34,136,14,244,178,202,137,112,8,101,28,171,5,229,103,159,238,232,213,246,21,121,194,221,35,174,95,162,83,22,123,5,30,25,136,91,112,103,54,145,65,132,129,121,206,27,255]);
    //let wallet = Keypair.fromSecretKey(secretKey);
    /*
        const wallet = Keypair.fromSecretKey(seedKeyPair.secretKey);
        setWallet(wallet);
        setUserAddress(wallet.publicKey.toBase58());
         */
  };

  const getBalance = async () => {
    if (wallet) {
      console.log(wallet);
      console.log(connection);
      const balance = await connection.getBalance(wallet.publicKey);
      setBalance(balance);
    }
  };

  const postAirdrop = async () => {
    if (wallet) {
      const airdropSignature = await connection.requestAirdrop(
        wallet.publicKey,
        LAMPORTS_PER_SOL2
      );
      await connection.confirmTransaction(airdropSignature);
    }
  };

  const createToken = async () => {
    if (wallet) {
      const mint = await splToken.createMint(
        connection,
        wallet,
        wallet.publicKey,
        wallet.publicKey,
        8
      );
      setTokenAddress(mint.toBase58());
      const mintInfo = await splToken.getMint(connection, mint);
      console.log(mintInfo);
    }
  };

  const toMintToken = async () => {
    if (wallet) {
      const mint = new PublicKey(tokenAddress);
      console.log(mint);

      const tokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        wallet,
        mint,
        wallet.publicKey
      );

      console.log(tokenAccount);

      await splToken.mintTo(
        connection,
        wallet,
        mint,
        tokenAccount.address,
        wallet,
        amount
      );
    }
  };

  const getBalanceMintToken = async () => {
    if (wallet) {
      const mint = new PublicKey(tokenAddress);
      console.log(mint);

      const tokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        wallet,
        mint,
        wallet.publicKey
      );

      const tokenAccountInfo = await splToken.getAccount(
        connection,
        tokenAccount.address
      );

      setBalanceMintToken(tokenAccountInfo.amount.toString());
      console.log(tokenAccountInfo.amount);
    }
  };

  const postBurnToken = async () => {
    if (wallet) {
      const mint = new PublicKey(tokenAddress);

      const tokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        wallet,
        mint,
        wallet.publicKey
      );

      const burn = await splToken.burn(
        connection,
        wallet,
        tokenAccount.address,
        mint,
        wallet,
        1
      );
      console.log(burn);
    }
  };

  const postFreezeMintToken = async () => {
    const mint = new PublicKey(tokenAddress);

    let transaction = new Transaction().add(
      splToken.createSetAuthorityInstruction(
        mint,
        wallet.publicKey,
        splToken.AuthorityType.MintTokens,
        null
      )
    );

    await sendAndConfirmTransaction(connection, transaction, [wallet]);
  };

  const postTransferToken = async () => {
    const mint = new PublicKey(tokenAddress);

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

    console.log(mint, fromAccount, toAccount);

    const transaction = await splToken.transfer(
      connection,
      wallet,
      fromAccount.address,
      toAccount.address,
      wallet,
      1
    );
    console.log(transaction);
    setTransactionId(transaction);
  };

  const postTransferTokenForSolana = async () => {
    let transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(toAddress),
        lamports: LAMPORTS_PER_SOL, //Investing 1 SOL. Remember 1 Lamport = 10^-9 SOL.
      })
    );
    const result = await sendAndConfirmTransaction(connection, transaction, [
      wallet,
    ]);
    console.log(result);
    setTransactionId(result);
  };

  const getTransactions = async () => {
    const transactions = await connection.getConfirmedSignaturesForAddress2(
      wallet.publicKey
    );
    console.log(transactions);
    setTransactions(transactions);
  };

  const getTokens = async () => {
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
                bytes: wallet.publicKey.toBase58(),
              },
            },
          ],
        },
      ],
    };

    const response = await axios.post("https://api.devnet.solana.com", data, {
      //const response = await axios.post( 'https://api.mainnet-beta.solana.com', data, {
      headers: {
        "Content-type": "application/json",
        Accept: "application/json",
      },
    });
    console.log(response);
    setTokens(response.data.result);
  };

  const onChangeMnemonic = (e) => {
    const { name, value } = e.target;
    setUserMnemonic(value);
  };

  const onChangeAmount = (e) => {
    const { name, value } = e.target;
    setAmount(value);
  };

  const onChangeToAddress = (e) => {
    const { name, value } = e.target;
    setToAddress(value);
  };

  return (
    <div className="App">
      <div className="contents">
        <button onClick={createWallet}>지갑 생성</button>
        <div>mnemonic: {mnemonic}</div>
        <div>address: {address}</div>
      </div>
      <div className="contents">
        <button onClick={postAirdrop}>솔라나 에어드랍 받기</button>
      </div>
      <div className="contents">
        <button onClick={importWallet}>지갑 Import</button>
        <input
          name="mnemonic"
          placeholder="mnemonic"
          style={{ width: 500 }}
          onChange={onChangeMnemonic}
        />
      </div>
      <div className="contents">
        <div>address: {userAddress}</div>
        <button onClick={getBalance}>솔라나 잔고</button>
        <div>balance: {balance}</div>
      </div>
      <div className="contents">
        <button onClick={createToken}>토큰 생성</button>
        <div>Token Address: {tokenAddress}</div>
      </div>
      <div className="contents">
        <button onClick={toMintToken}>토큰 발행</button>
        <input name="amount" placeholder="amount" onChange={onChangeAmount} />
      </div>
      <div className="contents">
        <button onClick={getBalanceMintToken}>발행한 토큰 잔고</button>
        <div>balance: {balanceMintToken}</div>
      </div>
      <div className="contents">
        <button onClick={postBurnToken}>발행한 토큰 소각 - 1개</button>
      </div>
      <div className="contents">
        <button onClick={postFreezeMintToken}>토큰 신규 발행 금지</button>
      </div>
      <div className="contents">
        <button onClick={postTransferTokenForSolana}>솔라나 전송 - 1개</button>
        <button onClick={postTransferToken}>발행한 토큰 전송 - 1개</button>
        <input
          name="toAddress"
          placeholder="Address"
          style={{ width: 500 }}
          onChange={onChangeToAddress}
        />
        <div>transaction: {transactionId}</div>
      </div>
      <div className="contents">
        <button onClick={getTransactions}>트랜잭션 조회</button>
        <div>
          {transactions.map((t, index) => (
            <div key={t.blockTime} style={{ fontSize: 11, textAlign: "left" }}>
              {t.confirmationStatus} - {t.blockTime} - {t.signature}
            </div>
          ))}
        </div>
      </div>
      <div className="contents">
        <button onClick={getTokens}>토큰 목록 조회</button>
        <div>
          {tokens.map((t, index) => (
            <div key={t.pubkey} style={{ fontSize: 12, textAlign: "left" }}>
              {t.account.data.parsed.info.mint} -{" "}
              {t.account.data.parsed.info.tokenAmount.amount}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
