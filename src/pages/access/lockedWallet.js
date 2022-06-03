import { toast } from "react-toastify";
import crypto from "crypto";
import util from "util";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const pbkdf2Promise = util.promisify(crypto.pbkdf2);
const loop = 104901;

export const LockedWallet = () => {
  const navigate = useNavigate();
  const [walletPassword, setWalletPassword] = useState(null);

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

  const onClickDeleteWalletData = async () => {};

  return (
    <>
      <div className="flex flex-col justify-center w-full h-full min-h-full p-10 bg-center bg-cover md:bg-intro-pattern bg-intro-pattern-m">
        <div className="mx-auto max-w-420">
          <p className="text-3xl">설정한 지갑 비밀번호로 로그인하세요</p>
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
            <button className="mt-10 btn-line">비밀번호를 잊어버렸어요</button>
          </div>
        </div>
      </div>
    </>
  );
};
