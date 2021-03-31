import axios from "axios";
import { createContext, ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";

export interface IAccount {
  class: string;
  createdTimestamp: number;
  firstName: string;
  middleName?: string;
  surname: string;
  id: number;
  isAdmin: boolean;
  isTeatcher: boolean;
  matricula: string;
  concludedActivities: number[];
}

export interface IAccountContextData {
  account?: IAccount;
  setAccount(): void;
}

export const AccountContext = createContext<IAccountContextData>({
  setAccount() {},
});

export interface IAccountProviderProps {
  children: ReactNode;
}

export function AccountProvider({ children }: IAccountProviderProps) {
  const router = useRouter();
  const [account, setAccount] = useState<IAccount>();

  const setAccountWithDatabase = () => {
    const token = localStorage.getItem("acessToken");
    const accountOrUndefined = JSON.parse(localStorage.getItem("account"));
    const expiresIn: number = JSON.parse(localStorage.getItem("expiresIn"));

    if (!token) {
      router.push("/auth");
      return;
    }

    if (!accountOrUndefined || Date.now() > expiresIn) {
      axios
        .get("/api/my", {
          headers: {
            token: "Bearer " + token,
          },
        })
        .then(({ data: { account } }) => {
          localStorage.setItem("account", JSON.stringify(account));
          localStorage.setItem(
            "expiresIn",
            JSON.stringify(Date.now() + 1000 * 60 * 60 * 48)
          );
          setAccount(JSON.parse(localStorage.getItem("account")));
          router.reload();
        })
        .catch((e) => {
          router.push("/auth");
        });
    }

    setAccount(JSON.parse(localStorage.getItem("account")));
  };

  return (
    <AccountContext.Provider
      value={{ account, setAccount: setAccountWithDatabase }}
    >
      {children}
    </AccountContext.Provider>
  );
}
