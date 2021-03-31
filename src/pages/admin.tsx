import axios from "axios";
import Head from "next/head";
import { FormEvent, MouseEvent, useContext, useEffect, useState } from "react";
import styles from "../styles/pages/Admin.module.css";
import { useRouter } from "next/router";
import { AccountContext } from "../contexts/AccountContext";
import moment from "moment";

interface INewAccount {
  class?: string;
  firstName?: string;
  middleName?: string;
  surname?: string;
  isAdmin?: boolean;
  isLeader?: boolean;
  isTeacher?: boolean;
  matricula?: string;
}

interface INewMatter {
  name?: string;
  hexColor?: string;
}

export default function Admin() {
  const { account, setAccount } = useContext(AccountContext);
  const [newAccount, setNewAccount] = useState<INewAccount>({});
  const [newMatter, setNewMatter] = useState<INewMatter>({});
  const router = useRouter();

  function createAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!account?.isAdmin) return router.push("/");

    if (!newAccount.isAdmin) newAccount.isAdmin = false;
    if (!newAccount.isLeader) newAccount.isLeader = false;
    if (!newAccount.isTeacher) newAccount.isTeacher = false;
    if (
      !newAccount.class ||
      !newAccount.firstName ||
      !newAccount.middleName ||
      !newAccount.surname ||
      newAccount.isAdmin === undefined ||
      newAccount.isLeader === undefined ||
      newAccount.isTeacher === undefined ||
      !newAccount.matricula
    )
      return alert("Preencha todos os campos");

    axios
      .post("/api/account", newAccount, {
        headers: {
          token: `Bearer ${localStorage.getItem("acessToken")}`,
        },
      })
      .then(({ data: { acessKey } }) => {
        alert("Chave de acesso da nova conta: " + acessKey);
        setNewAccount({});
        router.reload();
      })
      .catch(() => {
        alert("Houve um erro ao criar uma nova conta!");
      });
  }

  function createMatter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!account?.isAdmin) return router.push("/");

    if (!newMatter.name || !newMatter.hexColor)
      return alert("Preencha todos os campos");

    axios
      .post("/api/matter", newMatter, {
        headers: {
          token: `Bearer ${localStorage.getItem("acessToken")}`,
        },
      })
      .then(() => {
        alert("Matéria criada");
        setNewMatter({});
        router.reload();
      })
      .catch(() => {
        alert("Houve um erro ao criar uma nova matéria!");
      });
  }

  useEffect(setAccount, []);
  useEffect(() => {
    if (!account) return;
    if (!account?.isAdmin) {
      router.push("/");
      return;
    }

    axios
      .get("/api/my", {
        headers: {
          token: `Bearer ${localStorage.getItem("acessToken")}`,
        },
      })
      .then(({ data: { account } }) => {
        if (!account?.isAdmin) return router.push("/");
      })
      .catch(() => {
        router.push("/");
      });
  }, [account]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Administrador</title>
      </Head>
      <main className={styles.mainContainer}>
        <a href="/panel" className={styles.backToPanel}>
          &larr; Painel
        </a>
        <form className={styles.accountCreationForm} onSubmit={createAccount}>
          <h2>Criação de conta</h2>
          <div className={styles.inputContainer}>
            <strong>Turma</strong>
            <input
              type="text"
              className={styles.class}
              onChange={(e) =>
                setNewAccount({ ...newAccount, class: e.target.value })
              }
            />
          </div>
          <div className={styles.inputContainer}>
            <strong>Primeiro nome</strong>
            <input
              type="text"
              id="teste"
              className={styles.firstName}
              onChange={(e) =>
                setNewAccount({ ...newAccount, firstName: e.target.value })
              }
            />
          </div>
          <div className={styles.inputContainer}>
            <strong>Nome do meio</strong>
            <input
              type="text"
              className={styles.middleName}
              onChange={(e) =>
                setNewAccount({ ...newAccount, middleName: e.target.value })
              }
            />
          </div>
          <div className={styles.inputContainer}>
            <strong>Ultimo nome</strong>
            <input
              type="text"
              className={styles.surname}
              onChange={(e) =>
                setNewAccount({ ...newAccount, surname: e.target.value })
              }
            />
          </div>
          <div className={styles.inputContainer}>
            <strong>Matrícula</strong>
            <input
              type="text"
              className={styles.matricula}
              onChange={(e) =>
                setNewAccount({ ...newAccount, matricula: e.target.value })
              }
            />
          </div>

          <div className={styles.inputContainer}>
            <strong>Administrador</strong>
            <select
              name=""
              id=""
              onChange={(e) =>
                setNewAccount({
                  ...newAccount,
                  isAdmin: JSON.parse(e.target.value),
                })
              }
            >
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>
          <div className={styles.inputContainer}>
            <strong>Líder</strong>
            <select
              name=""
              id=""
              onChange={(e) =>
                setNewAccount({
                  ...newAccount,
                  isLeader: JSON.parse(e.target.value),
                })
              }
            >
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>
          <div className={styles.inputContainer}>
            <strong>Professor</strong>
            <select
              name=""
              id=""
              onChange={(e) =>
                setNewAccount({
                  ...newAccount,
                  isTeacher: JSON.parse(e.target.value),
                })
              }
            >
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>
          <button type="submit">Criar</button>
        </form>
        <form className={styles.matterCreationForm} onSubmit={createMatter}>
          <h2>Criação de matéria</h2>
          <div className={styles.inputContainer}>
            <strong>Nome</strong>
            <input
              type="text"
              onChange={(e) =>
                setNewMatter({ ...newMatter, name: e.target.value })
              }
            />
          </div>
          <div className={styles.inputContainer}>
            <strong>Cor</strong>
            <input
              type="color"
              onChange={(e) => {
                const arrLetters = e.target.value.split("");
                arrLetters.shift();
                setNewMatter({ ...newMatter, hexColor: arrLetters.join("") });
              }}
            />
          </div>
          <button type="submit">Criar</button>
        </form>
      </main>
    </div>
  );
}
