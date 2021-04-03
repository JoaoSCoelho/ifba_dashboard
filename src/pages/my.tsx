import axios from "axios";
import Head from "next/head";
import { MouseEvent, useContext, useEffect, useState } from "react";
import styles from "../styles/pages/My.module.css";
import { useRouter } from "next/router";
import { AccountContext } from "../contexts/AccountContext";
import moment from "moment";

export default function My() {
  const { account, setAccount } = useContext(AccountContext);
  const router = useRouter();

  function deleteAccount() {
    if (!confirm("Deseja realmente deletar sua conta?")) return;

    axios
      .delete("/api/my", {
        headers: {
          token: `Bearer ${localStorage.getItem("acessToken")}`,
        },
      })
      .then(() => {
        localStorage.removeItem("account");
        localStorage.removeItem("expiresIn");
        localStorage.removeItem("acessToken");
        router.push("/");
      })
      .catch(() => {
        alert("Houve um erro ao deletar sua conta!");
      });
  }

  useEffect(setAccount, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Meus dados</title>
      </Head>
      <main className={styles.mainContainer}>
        <a href="/panel" className={styles.backToPanel}>
          &larr; Painel
        </a>
        <section className={styles.profileContainer}>
          <div className={styles.profile}>
            <h1>
              {account?.firstName} {account?.middleName} {account?.surname}
            </h1>
            <table>
              <tbody>
                <tr>
                  <th>Primeiro nome</th>
                  <td>{account?.firstName}</td>
                </tr>
                <tr>
                  <th>Nome(s) do meio</th>
                  <td>{account?.middleName}</td>
                </tr>
                <tr>
                  <th>Ultimo nome</th>
                  <td>{account?.surname}</td>
                </tr>
                <tr>
                  <th>ID</th>
                  <td className={`${styles.number} ${styles.id}`}>
                    {account?.id}
                  </td>
                </tr>

                <tr>
                  <th>Turma</th>
                  <td className={`${styles.number}`}>
                    <span className={`${styles.class}`}>{account?.class}</span>
                  </td>
                </tr>
                <tr>
                  <th>Professor</th>
                  <td>
                    {account?.isTeacher ? (
                      <div className={styles.yes}>Sim</div>
                    ) : (
                      <div className={styles.no}>Não</div>
                    )}
                  </td>
                </tr>
                <tr>
                  <th>Líder</th>
                  <td>
                    {account?.isLeader ? (
                      <div className={styles.yes}>Sim</div>
                    ) : (
                      <div className={styles.no}>Não</div>
                    )}
                  </td>
                </tr>
                <tr>
                  <th>Administrador</th>
                  <td>
                    {account?.isAdmin ? (
                      <div className={styles.yes}>Sim</div>
                    ) : (
                      <div className={styles.no}>Não</div>
                    )}
                  </td>
                </tr>
                <tr>
                  <th>Conta criada em</th>
                  <td className={`${styles.createdAt}`}>
                    {moment(account?.createdTimestamp)
                      .locale("pt-br")
                      .format("LLLL")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <button onClick={deleteAccount} className={styles.deleteAccount}>
          Deletar conta
        </button>
      </main>
    </div>
  );
}
