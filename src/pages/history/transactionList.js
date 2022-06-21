import { Speaner } from "@/components/speaner";
import KeypairContext from "@/context/keypair.context";
import { cls } from "@/utils/utils";
import { mdiChevronLeft, mdiChevronRight } from "@mdi/js";
import Icon from "@mdi/react";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clusterTarget } from "../../utils/utils";
export const TransactionList = () => {
  const { keypair } = useContext(KeypairContext);
  const [connection, setConnection] = useState();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setConnection(new Connection(clusterApiUrl(clusterTarget), "confirmed"));
  }, []);

  useEffect(() => {
    if (keypair.publicKey) {
      if (connection) {
        getTransactions();
      }
    } else {
      navigate("/portfolio");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="absolute w-full px-10 py-8 bg-card-gray xl:py-5">
        <Link to="/portfolio">
          <Icon path={mdiChevronLeft} size={2} color="white" />
        </Link>
      </div>
      {loading ? (
        <Speaner />
      ) : (
        <div className="px-10 pt-48 pb-20 mx-auto max-w-1240 xl:pt-32">
          <h1 className="text-5xl font-bold xl:text-2xl">
            Transaction History
          </h1>
          {transactions.length > 0 ? (
            <ul className="mt-10 xl:mt-5">
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
                      clusterTarget === "devnet" ? "?cluster=devnet" : ""
                    }`}
                    target="_blank"
                    className="flex items-center justify-between w-full px-5 cursor-pointer py-7 xl:py-5"
                    rel="noreferrer"
                  >
                    <div className="truncate">
                      <p className="mr-5 text-2xl truncate md:text-xl xl:text-lg">
                        {item.signature}
                      </p>
                      <p className="mt-3 text-2xl font-medium text-green-500 md:text-xl xl:text-base xl:mt-0">
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
              <p className="p-10 text-3xl text-center ">거래 기록이 없습니다</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};
