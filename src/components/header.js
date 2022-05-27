import { useNavigate } from "react-router-dom";
export default function Header() {
  const navigate = useNavigate();
  const onClickLogout = () => {
    sessionStorage.removeItem("pubKey");
    navigate("/");
  };
  return (
    <header className="absolute flex items-center justify-between w-full px-10 py-5 bg-white">
      <h1 className="flex items-center justify-start">
        <div className="box-content flex items-center justify-center w-10 h-10 p-3 rounded-full loa-gradient">
          <img src="/img/ico_logo.svg" alt="" />
        </div>
        <em className="ml-5 text-3xl not-italic font-bold">LOA LAND</em>
      </h1>
      <div>
        <button className="text-2xl" onClick={onClickLogout}>
          로그아웃
        </button>
      </div>
    </header>
  );
}
