import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
export default function Header() {
  const [isLogined, setIsLogined] = useState(false);
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
  return (
    <header className="absolute flex items-center justify-between w-full px-10 bg-black border-b border-gray-600 py-7">
      <h1 className="flex items-center justify-start">
        <img src="/img/ico_logo.svg" alt="" />
      </h1>
      {isLogined && (
        <div>
          <button className="text-2xl" onClick={onClickLogout}>
            로그아웃
          </button>
        </div>
      )}
    </header>
  );
}
