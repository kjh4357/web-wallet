import { Speaner } from "@/components/speaner";
import KeypairContext from "@/context/keypair.context";
import { cls } from "@/utils/utils";
import { mdiChevronLeft, mdiChevronRight } from "@mdi/js";
import Icon from "@mdi/react";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { useContext, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

export const TransactionList = () => {
  const { keypair } = useContext(KeypairContext);
  const [connection, setConnection] = useState();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  console.log(keypair);
  useEffect(() => {
    // Solana 네트워크 연결
    setConnection(
      new Connection(
        //clusterApiUrl('mainnet-beta'),
        clusterApiUrl(process.env.REACT_APP_SOLANA_CLUSTER_TARGET),
        "confirmed"
      )
    );
  }, []);

  useEffect(() => {
    if (keypair.publicKey) {
      if (connection) {
        getTransactions();
      }
    } else {
      navigate("/portfolio");
    }
  }, [keypair, connection]);

  const getTransactions = async () => {
    setLoading(true);
    const transactions = await connection.getConfirmedSignaturesForAddress2(
      keypair.publicKey
    );
    setLoading(false);
    setTransactions(transactions);
  };

  return (
    <>
      <div className="absolute w-full px-10 py-8 bg-white">
        <Link to="/portfolio">
          <Icon path={mdiChevronLeft} size={2} color="#000" />
        </Link>
      </div>
      {loading ? (
        <Speaner />
      ) : (
        <div className="px-10 pt-48 pb-20">
          <h1 className="text-5xl font-bold">Transaction List</h1>
          {transactions.length > 0 ? (
            <ul className="mt-10">
              {transactions.map((item, index) => (
                <li
                  key={index.toString()}
                  className={cls(
                    "flex items-center px-5 py-7 bg-white shadow-xl rounded-xl",
                    index !== 0 && "mt-5"
                  )}
                >
                  <div className="truncate">
                    <p className="mr-5 text-2xl truncate">{item.signature}</p>
                    <p className="mt-3 text-2xl font-medium text-green-500">
                      {item.confirmationStatus}
                    </p>
                  </div>
                  <a
                    href={`https://explorer.solana.com/tx/${item.signature}${
                      process.env.development && "?cluster=devnet"
                    }`}
                    target="_blank"
                    className="cursor-pointer"
                    rel="noreferrer"
                  >
                    <Icon path={mdiChevronRight} size={2} color="#ddd" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-full">
              <p className="p-10 text-3xl text-center ">데이터가 없습니다</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};
