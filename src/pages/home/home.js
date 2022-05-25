import { Link } from "react-router-dom";

export const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-full p-10 bg-intro-bg">
      <div className="box-content flex items-center justify-center p-10 w-28 h-28 loa-gradient rounded-3xl">
        <img src="/img/ico_logo.svg" alt="" />
      </div>
      <div className="mt-10 font-bold text-7xl">LOA LAND</div>
      <div className="flex flex-col w-full mt-60">
        <Link to="/access" className="btn">
          Import Wallet
        </Link>
        <Link to="/create" className="mt-5 btn">
          Create Wallet
        </Link>
      </div>
    </div>
  );
};
