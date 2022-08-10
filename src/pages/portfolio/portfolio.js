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
import {
	addComma,
	addDecimal,
	addTokenDecimal,
	updateTextView,
} from "@/utils/utils";
import Modal from "@/components/modal";
import Header from "@/components/header";
import { generateFromString } from "generate-avatar";
import { useNavigate } from "react-router-dom";
import crypto from "crypto";
import { derivePath } from "ed25519-hd-key";
import KeypairContext from "@/context/keypair.context";
import { Speaner } from "@/components/speaner";
import util from "util";
import SolanaTokenContext from "@/context/solanaToken.context";
import { clusterTarget } from "../../utils/utils";

import axios from "axios";
const solanaDecimalLength = String(LAMPORTS_PER_SOL).length;
const pbkdf2Promise = util.promisify(crypto.pbkdf2);
const loop = 104901;

export const Portfolio = () => {
	const navigate = useNavigate();
	const [connection, setConnection] = useState(null);
	const [pubKey, setPubkey] = useState(null);
	const [sendTokenModal, setSendTokenModal] = useState(false);
	const [receiptModal, setReceiptModal] = useState(false);
	const [passwordModal, setPasswordModal] = useState(false);
	const [isSolanaToken, setIsSolanaToken] = useState(false);
	const [loading, setLoading] = useState(false);
	const [getTokenloading, setGetTokenLoading] = useState(false);
	const [openErrorPopup, setOpenErrorPopup] = useState(false);
	const [isNotHaveToken, setIsNotHaveToken] = useState(false);
	const [tokenList, setTokenList] = useState(null);
	const [allTokenList, setAllTokenList] = useState(
		JSON.parse(sessionStorage.getItem("tokenList")) || null
	);
	const [selectedToken, setSelectedToken] = useState(null);
	const [solanaTokenData, setSolanaTokenData] = useState(null);
	const [userHoldTokenList, setUserHoldTokenList] = useState(null);
	const [rentBalance, setRentBalance] = useState(null);
	const [toAddress, setToAddress] = useState("");
	const [password, setPassword] = useState("");
	const [sendAmount, setSendAmount] = useState("");
	const [sendAmountString, setSendAmountString] = useState("");
	const [solanaAmount, setSolanaAmount] = useState(null);
	const [timer, setTimer] = useState(null);
	const [remainSolanaAmount, setRemainSolanaAmount] = useState(null);
	const [remainTokenAmount, setRemainTokenAmount] = useState(null);
	const [userMnemonic, setUserMnemonic] = useState("");
	const [reloadTime, setReloadTime] = useState(10);
	const [wallet, setWallet] = useState();
	const [fee, setFee] = useState(null);
	const { keypair, updateKeypair } = useContext(KeypairContext);
	const { solanaTokenList } = useContext(SolanaTokenContext);
	const [openAPIErrorPopup, setOpenAPIErrorPopup] = useState(false);

	useEffect(() => {
		// Solana 네트워크 연결
		setConnection(new Connection(clusterApiUrl(clusterTarget), "confirmed"));
		getLocalStorageUserData();

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		importWallet();
		getSolanaBalance();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pubKey, userMnemonic]);

	useEffect(() => {
		if (allTokenList) {
			setSolanaTokenData({
				name: "Solana",
				symbol: "SOL",
				decimal: solanaDecimalLength,
				imageUrl: allTokenList.logoURI,
			});
		}
	}, [allTokenList]);

	useEffect(() => {
		if (toAddress) {
			validateSolAddress(toAddress);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [toAddress]);

	useEffect(() => {
		if (!receiptModal) {
			setIsNotHaveToken(false);
		}
	}, [receiptModal]);

	const reloadTimerStart = () => {
		setTimer(
			setInterval(() => {
				setReloadTime(prev => prev - 1);
			}, 1000)
		);
	};

	useEffect(() => {
		if (reloadTime === 0) {
			clearInterval(timer);
		}
	}, [reloadTime]);

	const getMinimumRentExamption = async () => {
		const balance = await connection.getMinimumBalanceForRentExemption(165);
		setRentBalance(addDecimal(balance, solanaDecimalLength));
	};

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

	useEffect(() => {
		if (solanaTokenList) {
			setAllTokenList(solanaTokenList);
		}
	}, [solanaTokenList]);

	const handleFindTokenData = async tokenAddress => {
		if (allTokenList) {
			const res = await allTokenList.tokens.find(
				item => item.address === tokenAddress
			);
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
					balance: balance,
					decimal: solanaDecimalLength,
				},
			]);
			setSolanaAmount(addDecimal(balance, solanaDecimalLength));
			await getTokens(newPubKey);
		}
	};

	const handleCheckToAccountToken = async pubkey => {
		if (selectedToken.tokenName !== "SOL") {
			const mint = new PublicKey(selectedToken.pubKey);
			const toAccount = await splToken.getAssociatedTokenAddress(mint, pubkey);

			try {
				const account = await splToken.getAccount(connection, toAccount);
				if (account.mint.equals(mint)) {
					setIsNotHaveToken(false);
				}
			} catch (err) {
				setIsNotHaveToken(true);
				getMinimumRentExamption();
			}
		}
	};

	const validateSolAddress = async toAddress => {
		try {
			let pubkey = new PublicKey(toAddress);
			let isSolana = await PublicKey.isOnCurve(pubkey);
			handleCheckToAccountToken(pubkey);
			setIsSolanaToken(isSolana);
		} catch (err) {
			setIsSolanaToken(false);
			setIsNotHaveToken(false);
		}
	};

	const getTokens = async newPubKey => {
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
				const userTokenList = response.data.result;

				if (userTokenList) {
					setUserHoldTokenList(userTokenList);
				}

				setGetTokenLoading(true);
			} else {
				setOpenErrorPopup(true);
				reloadTimerStart();
			}
		}
	};

	useEffect(() => {
		if (userHoldTokenList) {
			handleTokenMaching(userHoldTokenList);
		}
	}, [userHoldTokenList]);

	const handleTokenMaching = async userToken => {
		userToken.map(async item => {
			let coinData = await handleFindTokenData(
				item.account.data.parsed.info.mint
			);
			if (coinData) {
				setTokenList(prev => [
					...prev,
					{
						tokenName: coinData ? coinData.name : "UNKNOWN",
						symbol: coinData ? coinData.symbol : null,
						balance: item.account.data.parsed.info.tokenAmount.amount,
						pubKey: item.account.data.parsed.info.mint,
						balanceString:
							item.account.data.parsed.info.tokenAmount.uiAmountString,
						decimal: item.account.data.parsed.info.tokenAmount.decimals,
						data: coinData,
					},
				]);
			} else {
				const res = await axios.get(
					`https://api.solscan.io/account?address=${item.account.data.parsed.info.mint}`
				);

				if (res.data) {
					const responseUri = await axios.get(res.data.data.metadata.data.uri);

					setTokenList(prev => [
						...prev,
						{
							tokenName: res.data.data.metadata.data.name,
							symbol: res.data.data.metadata.data.symbol,
							balance: item.account.data.parsed.info.tokenAmount.amount,
							pubKey: item.account.data.parsed.info.mint,
							balanceString:
								item.account.data.parsed.info.tokenAmount.uiAmountString,
							decimal: item.account.data.parsed.info.tokenAmount.decimals,
							data: res.data.data,
							imageUri: responseUri.data && responseUri.data.image,
						},
					]);
				}
			}
		});
	};

	const onClickTextCopy = e => {
		var range = document.createRange();
		range.selectNode(document.getElementById("publicKey"));
		var sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
		document.execCommand("copy");
		sel.removeAllRanges(range);
		toast.success("클립보드에 복사됨");
	};

	const onClickOpenTokenSendModal = item => {
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
			try {
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
			} catch (e) {
				setOpenAPIErrorPopup(true);
			}
		}
	};

	const onClickMoveTransactionList = () => {
		navigate("/history");
	};

	const onClickTokenSend = async () => {
		if (sendAmount && sendAmount > 0) {
			if (toAddress) {
				if (isSolanaToken) {
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
							setSendTokenModal(false);
							setReceiptModal(true);
						} else {
							toast.error("SOL 잔액을 확인해주세요");
						}
					} else {
						const calSolAmount =
							solanaAmount - addDecimal(fees, solanaDecimalLength);
						let resultSendAmount =
							Number(sendAmount) * Math.pow(10, selectedToken.decimal);
						const calTokenAmount =
							Number(selectedToken.balance) - resultSendAmount;
						if (calSolAmount >= 0 && calTokenAmount >= 0) {
							setRemainTokenAmount(calTokenAmount);
							setSendTokenModal(false);
							setReceiptModal(true);
						} else {
							toast.error("SOL 잔액 또는 토큰 잔액을 확인해주세요");
						}
					}
				} else {
					toast.error("올바른 토큰 주소가 아닙니다.");
				}
			} else {
				toast.error("토큰을 보낼 주소를 적어주세요");
			}
		} else {
			toast.error("수량을 확인해주세요");
		}
	};

	const getTransactionFee = async () => {
		setLoading(prev => !prev);
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
			"processed"
		);
		setLoading(prev => !prev);
		return response.value;
	};

	const onClickCheckValidPassword = async () => {
		const secure = window.localStorage.getItem("secure");
		const data = window.localStorage.getItem("data");

		if (secure == null || data == null) {
			return;
		}
		if (password) {
			const hashedText = await getHashedValue(password);
			if (hashedText !== secure) {
				toast.error("비밀번호가 맞지 않습니다.");
				return;
			}
			sendToken();
			setPasswordModal(false);
			setToAddress("");
		}
	};

	const getHashedValue = async text => {
		const key = await pbkdf2Promise(text, "", loop, 64, "sha512");
		return key.toString("base64");
	};

	const sendToken = async () => {
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
		setLoading(prev => !prev);
		const amount = sendAmount * Math.pow(10, selectedToken.decimal - 1);
		try {
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
			setLoading(prev => !prev);
			return result;
		} catch (err) {
			toast.error(err);
			setLoading(prev => !prev);
		}
	};

	const postTransferToken = async () => {
		setLoading(prev => !prev);
		const mint = new PublicKey(selectedToken.pubKey);
		const amount = Number(
			Number(sendAmount) * Math.pow(10, selectedToken.decimal)
		).toFixed(0);
		try {
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
			setLoading(prev => !prev);
			return transaction;
		} catch (err) {
			setLoading(prev => !prev);
			toast.error("수수료 잔액이 부족합니다");
		}
	};

	const onClickCloseSendTokenModal = () => {
		setToAddress("");
		setSendTokenModal(false);
		setIsNotHaveToken(false);
	};

	const onClickConfirmReceiptModal = () => {
		setReceiptModal(false);
		setPasswordModal(true);
	};

	const onClickCloseReceiptModal = () => {
		setToAddress("");
		setReceiptModal(false);
		setIsNotHaveToken(false);
	};

	const onClickClosePasswordModal = () => {
		setToAddress("");
		setPasswordModal(false);
	};

	const handleChangeAmount = e => {
		setSendAmount(e.target.value);

		setSendAmountString(
			Number.isInteger(Number(e.target.value))
				? inputPriceFormat(e.target.value)
				: e.target.value
		);
	};

	const inputPriceFormat = str => {
		console.log("s", str);
		const comma = str => {
			str = String(str);
			return str.replace(/(\d)(?=(?:\d{3})+(?!\d))/g, "$1,");
		};
		const uncomma = str => {
			str = String(str);
			return str.replace(/[^\d]+/g, "");
		};
		return comma(uncomma(str));
	};

	return (
		<>
			{loading && <Speaner />}
			<Modal isModalOpen={openAPIErrorPopup} setModalOpen={() => {}}>
				<div className="mt-5 min-w-320">
					<div className="mt-8 text-center">
						<p className="mb-5 text-2xl leading-10">
							API서버가 불안정하여 데이터를 불러올 수 없습니다.
							<br />
							다시 시도해 주세요.
						</p>

						<button
							type="button"
							className="inline-block w-1/2 h-20 px-5 text-2xl font-medium text-white rounded-md lg:text-lg lg:h-12 loa-gradient"
							onClick={() => {
								window.location.reload();
							}}
						>
							새로고침
						</button>
					</div>
				</div>
			</Modal>
			<Modal isModalOpen={openErrorPopup} setModalOpen={() => {}}>
				<div className="mt-5 min-w-320">
					<div className="mt-8 text-center">
						<p className="mb-5 text-2xl leading-9">
							정보를 제대로 불러올 수 없습니다.
							<br />
							다시 시도해 주세요.
						</p>
						<p className="mb-10 text-lg text-red-200">
							너무 많은 새로고침을 할 경우
							<br /> 정보를 제대로 불러올 수 없습니다.
						</p>
						<button
							type="button"
							className="inline-block w-1/2 h-20 px-5 text-2xl font-medium text-white rounded-md lg:text-lg lg:h-12 loa-gradient"
							onClick={() => {
								window.location.reload();
							}}
							disabled={reloadTime !== 0}
						>
							다시 불러오기 {reloadTime > 0 ? reloadTime : null}
						</button>
					</div>
				</div>
			</Modal>
			<Modal isModalOpen={passwordModal} setModalOpen={() => {}}>
				<div className="mt-5">
					<h1>비밀번호 확인</h1>{" "}
					<input
						type="password"
						className="mt-3 text-box"
						onChange={e => setPassword(e.target.value)}
					/>
					<div className="mt-8 text-center">
						<button
							type="button"
							className="inline-block w-1/2 h-20 text-2xl font-medium text-white rounded-md lg:text-lg lg:h-12 loa-gradient"
							onClick={onClickCheckValidPassword}
						>
							계속하기
						</button>
					</div>
					<button
						type="button"
						className="absolute text-2xl font-medium text-black outline-none top-5 right-5"
						onClick={onClickClosePasswordModal}
					>
						<Icon path={mdiClose} size={1.5} color="white" />
					</button>
				</div>
			</Modal>
			<Modal isModalOpen={sendTokenModal} setModalOpen={() => {}}>
				{selectedToken && (
					<div className="py-10 md:min-w-640">
						<div className="text-center">
							<h1 className="pb-5 text-3xl font-bold border-b-2">
								{selectedToken.tokenName} 보내기
							</h1>
							<p className="px-10 mt-10 text-3xl">
								잔액 :{" "}
								{selectedToken.tokenName === "SOL"
									? addDecimal(selectedToken.balance, selectedToken.decimal)
									: addTokenDecimal(
											selectedToken.balance,
											selectedToken.decimal
									  )}{" "}
								{selectedToken.tokenName === "SOL"
									? "SOL"
									: selectedToken.symbol}
							</p>
						</div>

						<div className="mt-10 text-2xl">
							{sendAmountString !== "" && (
								<p className="mb-5 text-center">
									보낼 수량 : {sendAmountString}
								</p>
							)}
							<p className="mb-2">금액</p>
							<input
								type="number"
								className="text-2xl border border-gray-500 bg-card-gray"
								onChange={handleChangeAmount}
							/>
							<p className="mt-2 text-right">{selectedToken.symbol}</p>
						</div>

						<div className="mt-10 text-2xl">
							<p className="mb-2">수신자 주소</p>
							<input
								type="text"
								className="text-2xl border border-gray-500 bg-card-gray"
								value={toAddress}
								onChange={e => setToAddress(e.target.value)}
							/>
						</div>
						{!isSolanaToken && toAddress.length > 0 && (
							<p className="mt-3 text-xl text-red-500">
								올바른 주소가 아닙니다
							</p>
						)}
						{isNotHaveToken && rentBalance && (
							<p className="mt-3 text-xl">
								수신자가 귀하가 보내려고 하는 토큰을 소유하고 있지 않습니다.
								<br />
								수신자를 위해 새로운 계정을 생성하려면 {rentBalance} SOL이
								소요됩니다.
							</p>
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
							className="absolute text-2xl font-medium text-white outline-none top-5 right-5"
							onClick={onClickCloseSendTokenModal}
						>
							<Icon path={mdiClose} size={1.5} color="white" />
						</button>
					</div>
				)}
			</Modal>
			<Modal isModalOpen={receiptModal} setModalOpen={() => {}}>
				<div className="p-10 break-words">
					{/* <p className="text-3xl text-center md:text-xl">전송합니다</p> */}
					{/* <p className="mt-5 text-2xl md:text-lg md:mt-2">{pubKey}</p> */}
					<p className="mt-10 text-3xl md:text-xl md:mt-8">수신자 주소</p>
					<p className="mt-5 text-2xl md:text-lg md:mt-2">{toAddress}</p>
					<p className="mt-10 text-3xl md:text-xl md:mt-8">보낼 수량</p>
					{selectedToken && (
						<p className="mt-5 text-2xl md:text-lg md:mt-2">
							{addDecimal(sendAmount, selectedToken.decimal)}{" "}
							{selectedToken.tokenName}
						</p>
					)}

					<p className="mt-10 text-3xl md:text-xl md:mt-8">전송 수수료</p>
					<p className="mt-5 text-2xl md:text-lg md:mt-2">
						{addDecimal(fee, solanaDecimalLength)} SOL
					</p>
					{isNotHaveToken && (
						<>
							<p className="mt-10 text-3xl md:text-xl md:mt-8">계정생성비</p>
							<p className="mt-5 text-2xl md:text-lg md:mt-2">
								{rentBalance} SOL
							</p>
						</>
					)}
					<p className="mt-10 text-3xl md:text-xl md:mt-8">남은 수량</p>
					{selectedToken && (
						<p className="mt-5 text-2xl md:text-lg md:mt-2">
							{selectedToken.tokenName === "SOL"
								? remainSolanaAmount
								: addTokenDecimal(
										remainTokenAmount,
										selectedToken.decimal
								  )}{" "}
							{selectedToken.tokenName}
						</p>
					)}
					<div className="mt-20 text-center">
						<button
							type="button"
							className="inline-block w-1/2 h-20 text-2xl font-medium text-white rounded-md lg:text-xl lg:h-16 loa-gradient"
							onClick={onClickConfirmReceiptModal}
						>
							보내기
						</button>
					</div>
					<button
						type="button"
						className="absolute text-2xl font-medium text-black outline-none top-5 right-5"
						onClick={onClickCloseReceiptModal}
					>
						<Icon path={mdiClose} size={1.5} color="white" />
					</button>
				</div>
			</Modal>

			<Header />
			<div className="px-10 pt-40 pb-20 mx-auto md:px-20 md:pt-32 max-w-1440">
				<div className="flex flex-col items-center px-5 py-16 shadow-xl bg-card-gray rounded-xl md:flex-row md:px-10 xl:py-8">
					<div className="w-48 h-48 rounded-full md:w-24 md:h-24 md:flex-shrink-0">
						{pubKey && (
							<img
								className="rounded-full"
								src="/img/ico_wallet_profile.png"
								alt=""
							/>
						)}
					</div>
					<div className="flex flex-col items-center md:flex-row md:border-l md:border-gray-400 md:ml-10 md:pl-10 md:justify-between md:w-full">
						<div className="flex flex-col items-center md:items-start md:justify-start">
							<p
								id="publicKey"
								className="px-5 py-2 mt-5 text-2xl font-medium break-all md:mt-0 md:py-0 md:px-0 md:text-xl"
							>
								{pubKey}
							</p>
							<button
								onClick={onClickTextCopy}
								className="flex items-center justify-center mt-2 rounded-full md:mt-5 md:flex-shrink-0"
							>
								<Icon path={mdiFileMultipleOutline} size={1.5} color="#fff" />
							</button>
						</div>
						<button
							onClick={() => onClickOpenTokenSendModal(tokenList[0])}
							className="mt-10 text-center md:mt-0 md:ml-10"
						>
							<span className="flex items-center justify-center w-20 h-20 rounded-full loa-gradient md:rounded-md md:px-5 md:w-auto md:h-auto">
								<Icon path={mdiRedo} size={1.5} color="white" />
								<span className="hidden py-4 mt-2 ml-5 text-2xl font-bold md:inline-block md:text-xl md:mt-0">
									보내기
								</span>
							</span>
							<span className="inline-block mt-2 text-2xl font-bold md:hidden">
								보내기
							</span>
						</button>
					</div>
				</div>
				<div className="p-10 mt-10 shadow-lg bg-card-gray x-10 rounded-xl">
					<h2 className="mb-10 text-4xl font-black md:text-2xl md:mb-5">
						자산
					</h2>

					<ul className="border-t border-gray-600">
						{tokenList &&
							solanaTokenData &&
							tokenList.map((item, index) => (
								<li
									key={index.toString()}
									className="py-5 pl-5 border-b border-gray-600"
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center mr-10 text-3xl ">
											{index === 0 ? (
												<img
													src={solanaTokenData.imageUrl}
													alt=""
													className="w-16 h-16 mr-4 rounded-full md:w-12 md:h-12"
												/>
											) : item.data.logoURI ? (
												<img
													src={item.data.logoURI}
													alt=""
													className="w-16 h-16 mr-4 rounded-full md:w-12 md:h-12"
												/>
											) : item.data.metadata ? (
												<img
													src={item.imageUri}
													alt=""
													className="w-16 h-16 mr-4 rounded-full md:w-12 md:h-12"
												/>
											) : (
												<img
													src={`data:image/svg+xml;utf8,${generateFromString(
														item.pubKey
													)}`}
													alt=""
													className="w-16 h-16 mr-4 rounded-full md:w-12 md:h-12"
												/>
											)}

											<div className="flex flex-col">
												<span className="text-3xl font-bold truncate lg:text-2xl">
													{index === 0
														? solanaTokenData.name
														: item.data.name
														? item.data.name
														: item.data.metadata.data.name}
													<em className="ml-5 not-italic font-normal">
														{index === 0
															? `(${solanaTokenData.symbol})`
															: item.data.symbol
															? `(${item.data.symbol})`
															: `(${item.data.metadata.data.symbol})`}
													</em>
												</span>

												{/* <p className="text-lg break-all">{item.pubKey}</p> */}
											</div>
										</div>
										<div>
											<button
												type="button"
												className="cursor-pointer md:hidden"
												onClick={onClickMoveTransactionList}
											>
												<Icon path={mdiChevronRight} size={2} color="#ddd" />
											</button>
										</div>
									</div>
									<div className="flex items-center mt-5 mb-5 flex-shrink-0 justify-end">
										<span className="text-2xl font-bold">
											{item.tokenName === "SOL"
												? addDecimal(item.balance, item.decimal)
												: addTokenDecimal(item.balance, item.decimal)}
											{index === 0 ? (
												<span className="ml-5">
													{item.tokenName.substr(0, 3).toUpperCase()}
												</span>
											) : item.data.symbol ? (
												<span className="ml-5">{item.data.symbol}</span>
											) : (
												<span className="ml-5">
													{item.data.metadata.data.symbol}
												</span>
											)}
										</span>
									</div>
									{index !== 0 && (
										<p className="mt-8 text-lg break-all">
											<span>민트주소 : </span>
											{item.pubKey}
										</p>
									)}
									<div className="mt-5 text-center md:text-right md:flex md:justify-between lg:mt-0">
										<button
											type="button"
											className="items-center justify-center hidden text-xl text-gray-400 cursor-pointer md:flex text-gray xl:text-base"
											onClick={onClickMoveTransactionList}
										>
											더 많은 작업
											<Icon path={mdiChevronRight} size={1} color="#9CA3AF" />
										</button>
										<button
											onClick={() => onClickOpenTokenSendModal(item)}
											className="inline-block px-10 py-5 text-2xl text-white border-gray-600 rounded-full cursor-pointer btn-gradient md:text-xl md:rounded-md md:py-3"
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
