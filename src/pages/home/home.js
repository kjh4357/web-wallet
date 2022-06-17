import { Link } from "react-router-dom";

export const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-full p-10 bg-center bg-cover md:bg-intro-pattern bg-intro-pattern-m">
      <div className="relative p-10 text-center bg-try-pattern">
        <img
          className="absolute translate-center left-1/2 top-1/2"
          src="/img/bg-try_pattern.png"
          alt=""
        />
        <img className="relative" src="/img/roacore.png" alt="" />
        {/* <p className="relative font-bold text-7xl">ROA CORE</p> */}
        <p className="relative mt-10 text-4xl font-bold">Wallet</p>
      </div>
      <div className="relative flex flex-col items-center justify-center w-full mt-60 md:mt-20">
        <Link to="/access" className="btn-line md:max-w-640">
          Import Wallet
        </Link>
        <Link to="/create" className="mt-10 btn md:max-w-640">
          Create Wallet
        </Link>
      </div>
    </div>
  );
};
