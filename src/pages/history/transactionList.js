import { Speaner } from "@/components/speaner";
import KeypairContext from "@/context/keypair.context";
import { cls } from "@/utils/utils";
import { mdiChevronLeft, mdiChevronRight } from "@mdi/js";
import Icon from "@mdi/react";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export const TransactionList = () => {
  const { keypair } = useContext(KeypairContext);
  const [connection, setConnection] = useState();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setConnection(
      new Connection(
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
      <div className="absolute w-full px-10 py-8 bg-card-gray">
        <Link to="/portfolio">
          <Icon path={mdiChevronLeft} size={2} color="white" />
        </Link>
      </div>
      {loading ? (
        <Speaner />
      ) : (
        <div className="px-10 pt-48 pb-20 ">
          <h1 className="text-5xl font-bold">Transaction List</h1>
          {transactions.length > 0 ? (
            <ul className="mt-10">
              {transactions.map((item, index) => (
                <li
                  key={index.toString()}
                  className={cls(
                    "flex items-center bg-card-gray shadow-xl rounded-xl",
                    index !== 0 && "mt-5"
                  )}
                >
                  <a
                    href={`https://explorer.solana.com/tx/${item.signature}${
                      process.env.NODE_ENV === "development" &&
                      "?cluster=devnet"
                    }`}
                    target="_blank"
                    className="flex items-center justify-between w-full px-5 cursor-pointer py-7"
                    rel="noreferrer"
                  >
                    <div className="truncate">
                      <p className="mr-5 text-2xl truncate md:text-xl">
                        {item.signature}
                      </p>
                      <p className="mt-3 text-2xl font-medium text-green-500 md:text-xl">
                        {item.confirmationStatus}
                      </p>
                    </div>

                    <Icon path={mdiChevronRight} size={"30px"} color="#ddd" />
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
