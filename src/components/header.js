import { cls, clusterTarget } from "@/utils/utils";
import { mdiCheckCircle, mdiClose, mdiCogOutline } from "@mdi/js";
import Icon from "@mdi/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Modal from "./modal";
import util from "util";
import crypto from "crypto";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";

const pbkdf2Promise = util.promisify(crypto.pbkdf2);
const loop = 104901;

export default function Header() {
  const [isLogined, setIsLogined] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [openSetting, setOpenSetting] = useState(false);
  const [openNetwork, setOpenNetwork] = useState(false);
  const [network, setNetwork] = useState("");
  const [password, setPassword] = useState("");
  const ref = useRef();
  const navigate = useNavigate();

  useOnClickOutside(ref, () => setOpenSetting(false));

  useEffect(() => {
    setIsLogined(localStorage.getItem("data") ? true : false);
  }, []);

  useEffect(() => {
    if (localStorage.getItem("roacoreconfig")) {
      setNetwork(localStorage.getItem("roacoreconfig"));
    }
  }, [localStorage.getItem("roacoreconfig")]);

  const handleCheckPassword = async () => {
    const secure = window.localStorage.getItem("secure");
    const data = window.localStorage.getItem("data");

    if (secure == null || data == null) {
      return;
    }
    if (password) {
      const hashedText = await getHashedValue(password);
      if (hashedText !== secure) {
        toast.error("패스워드가 일치하지 않습니다.");
        return;
      }
      onClickLogout();
    }
  };

  const getHashedValue = async (text) => {
    const key = await pbkdf2Promise(text, "", loop, 64, "sha512");
    return key.toString("base64");
  };

  const onClickLogout = () => {
    localStorage.removeItem("pubKey");
    localStorage.removeItem("data");
    localStorage.removeItem("secure");
    localStorage.removeItem("locked");
    localStorage.removeItem("srt");
    navigate("/");
  };

  const onClickWalletLocking = () => {
    localStorage.setItem("locked", true);
    navigate("/locked");
  };

  const onClickChangeNetwork = (e) => {
    localStorage.setItem("roacoreconfig", e.currentTarget.dataset.net);
    window.location.reload();
  };

  return (
    <>
      <Modal isModalOpen={openNetwork} setModalOpen={setOpenNetwork}>
        <div className="min-w-320">
          <h1 className="text-3xl">네트워크 변경</h1>
          <div className="mt-10 text-center">
            <ul className="text-left">
              <li className="border-t border-b border-gray-600 py-7">
                <button
                  type="button"
                  className="relative block w-full text-3xl text-left cursor-pointer md:text-xl"
                  data-net="mainnet-beta"
                  onClick={onClickChangeNetwork}
                >
                  Mainnet
                  <p className="text-2xl text-gray-400 md:text-lg">
                    {process.env.REACT_APP_SOLANA_CLUSTER_RPC_ENDPOINT_MAIN}
                  </p>
                  {network === "mainnet-beta" && (
                    <Icon
                      path={mdiCheckCircle}
                      size={1.5}
                      color="#B34354"
                      className="absolute right-0 top-1/2 top--50per"
                    />
                  )}
                </button>
              </li>
              <li className="border-b border-gray-600 py-7">
                <button
                  type="button"
                  className="relative block w-full text-3xl text-left cursor-pointer md:text-xl"
                  data-net="devnet"
                  onClick={onClickChangeNetwork}
                >
                  Devnet
                  <p className="text-2xl text-gray-400 md:text-lg">
                    {process.env.REACT_APP_SOLANA_CLUSTER_RPC_ENDPOINT_DEV}
                  </p>
                  {network === "devnet" && (
                    <Icon
                      path={mdiCheckCircle}
                      size={1.5}
                      color="#B34354"
                      className="absolute right-0 top-1/2 top--50per"
                    />
                  )}
                </button>
              </li>
            </ul>
          </div>
          <button
            type="button"
            className="absolute text-2xl font-medium text-black outline-none top-5 right-5"
            onClick={() => setOpenNetwork(false)}
          >
            <Icon path={mdiClose} size={1.5} color="white" />
          </button>
        </div>
      </Modal>
      <Modal isModalOpen={logoutModal} setModalOpen={setLogoutModal}>
        <div className="max-w-420">
          <h1 className="text-3xl">데이터 삭제 후 로그아웃</h1>
          <p className="mt-10 text-2xl leading-8 md:text-lg">
            이 작업은 ROA CORE에서 모든 계정을 로그아웃하고
            <br /> 브라우저에서 모든 데이터를 제거합니다.
            <br /> 패스워드를 입력해주세요.
          </p>
          <input
            type="password"
            className="mt-10 text-box"
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="mt-12 text-center">
            <button
              type="button"
              className="inline-block w-1/2 h-20 text-2xl font-medium text-white rounded-md lg:text-lg lg:h-12 loa-gradient"
              onClick={handleCheckPassword}
            >
              로그아웃
            </button>
          </div>
          <button
            type="button"
            className="absolute text-2xl font-medium text-black outline-none top-5 right-5"
            onClick={() => setLogoutModal(false)}
          >
            <Icon path={mdiClose} size={1.5} color="white" />
          </button>
        </div>
      </Modal>
      <header className="absolute flex items-center justify-between w-full px-10 bg-black border-b border-gray-600 py-7">
        <h1 className="flex items-center justify-start">
          <img src="/img/ico_logo.svg" alt="" />
        </h1>
        {isLogined && (
          <>
            <div className="relative">
              <button
                className="flex items-center justify-center text-2xl"
                onClick={() => setOpenSetting((prev) => !prev)}
              >
                <Icon path={mdiCogOutline} size={1.5} color="#9CA3AF" />
                <span className="ml-2 lg:text-xl">설정</span>
              </button>
            </div>
            <div
              ref={ref}
              className={cls(
                " absolute flex-col items-start justify-start w-52 p-5 border border-gray-400 bg-card-gray right-10 top-20 text-left min-w-max",
                openSetting ? "flex" : "hidden"
              )}
            >
              <button
                className="py-3 text-2xl text-left md:text-xl"
                onClick={onClickWalletLocking}
              >
                잠금
              </button>
              <button
                className="py-3 text-2xl text-left md:text-xl"
                onClick={() => setOpenNetwork(true)}
              >
                네트워크 : {network === "mainnet-beta" ? "MAINNET" : "DEVNET"}
              </button>
              <button
                className="py-3 text-2xl text-left md:text-xl"
                onClick={() => setLogoutModal(true)}
              >
                로그아웃
              </button>
            </div>
          </>
        )}
      </header>
    </>
  );
}
