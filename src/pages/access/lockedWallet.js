import { toast } from "react-toastify";
import crypto from "crypto";
import util from "util";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Modal from "@/components/modal";
import Icon from "@mdi/react";
import { mdiClose } from "@mdi/js";

const pbkdf2Promise = util.promisify(crypto.pbkdf2);
const loop = 104901;

export const LockedWallet = () => {
  const navigate = useNavigate();
  const [walletPassword, setWalletPassword] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const onChangeWalletPassword = (e) => {
    const { name, value } = e.target;
    setWalletPassword(value);
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
      localStorage.removeItem("locked");
      handlePasswordLogin();
      // const userMnemonic = decipher(data, hashedText.substring(0, 16));
      // console.log(userMnemonic);
      // setUserMnemonic(userMnemonic);
    } else {
      toast.error("비밀번호를 입력하세요");
    }
  };

  const getHashedValue = async (text) => {
    const key = await pbkdf2Promise(text, "", loop, 64, "sha512");
    return key.toString("base64");
  };

  const handlePasswordLogin = async () => {
    navigate("/portfolio");
  };

  const onClickDeleteWalletData = async () => {
    if (deleteText === "CLEAR DATA") {
      localStorage.removeItem("pubKey");
      localStorage.removeItem("data");
      localStorage.removeItem("secure");
      localStorage.removeItem("locked");
      navigate("/");
    } else {
      toast.error("입력필드를 확인해주세요");
    }
  };

  return (
    <>
      <Modal isModalOpen={deleteModal} setModalOpen={setDeleteModal}>
        <div className="max-w-640">
          <h1 className="text-3xl">비밀번호를 잊어버리셨나요?</h1>
          <p className="mt-10 text-2xl leading-8">
            LOA CORE 암호를 잊어버린 경우 할 수 있는 유일한 방법은
            <br /> LOA CORE 지갑이 지갑에 대해 저장하는 모든 데이터를 지우고
            <br />
            니모닉, Ledger 장치, 개인 키 등을 가져와서 다시 시작하는 것입니다.
          </p>
          <p className="mt-5 text-2xl leading-8">
            그렇게 하려면 아래 필드에{" "}
            <span className="font-bold text-pink-600">CLEAR DATA</span> 를
            입력하고 <span className="font-bold text-pink-600">초기화</span>를
            클릭합니다.
          </p>
          <input
            type="text"
            className="mt-10 text-box"
            onChange={(e) => setDeleteText(e.target.value)}
          />
          <div className="mt-12 text-center">
            <button
              type="button"
              className="inline-block w-1/2 h-20 text-2xl font-medium text-white rounded-md lg:text-lg lg:h-12 loa-gradient"
              onClick={onClickDeleteWalletData}
            >
              초기화
            </button>
          </div>
          <button
            type="button"
            className="absolute text-2xl font-medium text-black outline-none top-5 right-5"
            onClick={() => setDeleteModal(false)}
          >
            <Icon path={mdiClose} size={1.5} color="white" />
          </button>
        </div>
      </Modal>
      <div className="flex flex-col justify-center w-full h-full min-h-full p-10 bg-center bg-cover md:bg-intro-pattern bg-intro-pattern-m">
        <div className="mx-auto max-w-420">
          <p className="text-2xl">설정한 지갑 비밀번호로 로그인하세요</p>
          <div className="mt-10">
            <input
              type="password"
              className="text-box"
              onChange={onChangeWalletPassword}
            />
          </div>
          <div className="flex flex-col w-full mt-20">
            <button className="mt-10 btn" onClick={postLoginWalletPassword}>
              잠금 해제
            </button>
            <button
              className="mt-10 btn-line"
              onClick={() => setDeleteModal(true)}
            >
              비밀번호를 잊어버렸어요
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
