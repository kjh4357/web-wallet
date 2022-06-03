import { cls } from "@/utils/utils";
import { mdiCogOutline } from "@mdi/js";
import Icon from "@mdi/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
export default function Header() {
  const [isLogined, setIsLogined] = useState(false);
  const [openSetting, setOpenSetting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLogined(localStorage.getItem("data") ? true : false);
  }, []);

  const onClickLogout = () => {
    localStorage.removeItem("pubKey");
    localStorage.removeItem("data");
    localStorage.removeItem("secure");
    navigate("/");
  };

  const onClickWalletLocking = () => {
    localStorage.setItem("locked", true);
  };

  return (
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
            className={cls(
              " absolute flex-col items-start justify-start w-32 p-5 border border-gray-400 bg-card-gray right-10 top-20",
              openSetting ? "flex" : "hidden"
            )}
          >
            <button className="py-3" onClick={onClickWalletLocking}>
              잠금
            </button>
            <button className="py-3" onClick={onClickLogout}>
              로그아웃
            </button>
          </div>
        </>
      )}
    </header>
  );
}
