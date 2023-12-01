import { useState, useEffect } from "react";
import { ethers } from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

const HomePage = () => {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [accountClosed, setAccountClosed] = useState(false);
  const [ownerName, setOwnerName] = useState("Shashi Pretham");
  const [transactionStatus, setTransactionStatus] = useState("");
  const [balance, setBalance] = useState(undefined);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const atmABI = atm_abi.abi;

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const accounts = await ethWallet.request({ method: "eth_accounts" });
      handleAccount(accounts);
    }
  };

  const handleAccount = (accounts) => {
    if (accounts.length > 0) {
      console.log("Account connected: ", accounts[0]);
      setAccount(accounts[0]);
      setAccountClosed(false);
    } else {
      console.log("No account found");
    }
  };

  const connectAccount = async () => {
    if (!ethWallet) {
      alert("MetaMask wallet is required to connect");
      return;
    }

    const accounts = await ethWallet.request({ method: "eth_requestAccounts" });
    handleAccount(accounts);

    // once the wallet is set, we can get a reference to our deployed contract
    getATMContract();
  };

  const getATMContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(contractAddress, atmABI, signer);

    setATM(atmContract);
  };

  const getBalance = async () => {
    if (atm) {
      try {
        const fetchedBalance = await atm.fetchBalance();
        const formattedBalance = ethers.utils.formatUnits(fetchedBalance, 18);

        // Convert the formattedBalance to a number and limit the decimal places to 2
        const roundedBalance = Number(parseFloat(formattedBalance).toFixed(2));

        // Check if the balance has already been set
        if (balance === undefined) {
          setBalance(roundedBalance);
          setTransactionStatus(`Your account balance is ${roundedBalance} ETH.`);
        }
      } catch (error) {
        setTransactionStatus(`Error fetching balance: ${error.message}`);
      }
    }
  };

  const deposit = async () => {
    if (atm && depositAmount !== "") {
      try {
        let tx = await atm.deposit(ethers.utils.parseUnits(depositAmount, 18));
        setTransactionStatus("Deposit Successful");
        await tx.wait();
        setBalance(undefined);
        setDepositAmount("");
      } catch (error) {
        setTransactionStatus(`Deposit Failed: ${error.message}`);
      }
    } else {
      setTransactionStatus("Please enter a valid deposit amount");
    }
  };

  const withdraw = async () => {
    if (atm && withdrawAmount !== "") {
      try {
        let tx = await atm.withdraw(ethers.utils.parseUnits(withdrawAmount, 18));
        setTransactionStatus("Withdrawal Successful");
        await tx.wait();
        setBalance(undefined);
        setWithdrawAmount("");
      } catch (error) {
        setTransactionStatus(`Withdrawal Failed: ${error.message}`);
      }
    } else {
      setTransactionStatus("Please enter a valid withdrawal amount");
    }
  };

  const closeAccount = async () => {
    if (atm) {
      try {
        let tx = await atm.closeAccount();
        setTransactionStatus("Account Closed");
        await tx.wait();
        setAccountClosed(true);
        setBalance(undefined);
      } catch (error) {
        setTransactionStatus(`Close Account Failed: ${error.message}`);
      }
    }
  };

  const reopenAccount = async () => {
    if (atm) {
      try {
        if (!accountClosed) {
          throw new Error("Close account to reopen");
        }

        let tx = await atm.reopenAccount();
        setTransactionStatus("Account Reopened");
        await tx.wait();
        setAccountClosed(false);
        setBalance(undefined);
      } catch (error) {
        setTransactionStatus(`Reopen Account Failed: ${error.message}`);
      }
    }
  };

  const initUser = () => {
    if (!ethWallet) {
      return <p>Please install Metamask to use this ATM.</p>;
    }

    if (!account) {
      return (
        <button onClick={connectAccount}>
          Please connect your Metamask wallet
        </button>
      );
    }

    if (accountClosed) {
      return (
        <div>
          <p>Your Account: {account}</p>
          <p>Account closed: Reopen account to operate</p>
          <button onClick={reopenAccount} style={{ backgroundColor: "lightgreen" }}>
            Reopen Account
          </button>
        </div>
      );
    }

    return (
      <div>
        <p>Your Account: {account}</p>
        <p>Owner Name: {ownerName}</p>
        <label>
          Deposit Amount (ETH):
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
        </label>
        <button onClick={deposit} style={{ backgroundColor: "lightgreen" }}>
          Deposit
        </button>
        <br />
        <label>
          Withdraw Amount (ETH):
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
        </label>
        <button onClick={withdraw} style={{ backgroundColor: "lightgreen" }}>
          Withdraw
        </button>
        <button onClick={getBalance} style={{ backgroundColor: "lightgreen" }}>
          Fetch Balance
        </button>
        <button onClick={closeAccount} style={{ backgroundColor: "lightgreen" }}>
          Close Account
        </button>
        <button onClick={reopenAccount} style={{ backgroundColor: "lightgreen" }}>
          Reopen Account
        </button>
        {transactionStatus && <p>{transactionStatus}</p>}
        {balance !== undefined && (
          <p>Your account balance is {balance} ETH.</p>
        )}
      </div>
    );
  };

  useEffect(() => {
    getWallet();
  }, []);

  return (
    <main className="container">
      <header>
        <h1>Welcome Shashi pretham</h1>
      </header>
      {initUser()}
      <style jsx>{`
        .container {
          text-align: center;
          background-color: lightgreen;
          padding: 20px;
          border-radius: 10px;
          margin-top: 20px;
        }

        label {
          margin: 5px;
        }

        input {
          margin-left: 5px;
        }

        button {
          margin: 5px;
        }
      `}</style>
    </main>
  );
};

export default HomePage;
