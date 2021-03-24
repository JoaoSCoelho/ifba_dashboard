import styles from "../styles/pages/Panel.module.css";
import Head from "next/head";
import { useContext, useEffect } from "react";
import { AccountContext } from "../contexts/accountContext";

export default function Panel() {
  const { account, setAccount } = useContext(AccountContext);

  useEffect(setAccount, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Painel</title>
      </Head>

      <header className={styles.pageHeader}>
        <div className={styles.headerProfileContainer}>
          <input
            type="checkbox"
            name="header-profile-options-checkbox"
            id="header-profile-options-checkbox"
            className={styles.headerProfileOptionsCheckbox}
          />
          <label htmlFor="header-profile-options-checkbox">
            <svg
              version="1.1"
              viewBox="0 0 512 512"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.arrowSvg}
            >
              <path d="M327.3,98.9l-2.1,1.8l-156.5,136c-5.3,4.6-8.6,11.5-8.6,19.2c0,7.7,3.4,14.6,8.6,19.2L324.9,411l2.6,2.3  c2.5,1.7,5.5,2.7,8.7,2.7c8.7,0,15.8-7.4,15.8-16.6h0V112.6h0c0-9.2-7.1-16.6-15.8-16.6C332.9,96,329.8,97.1,327.3,98.9z" />
            </svg>
            <div className={styles.headerProfile}>
              <strong className={styles.name}>
                <span className={styles.firstName}>{account?.firstName}</span>
                <span className={styles.surname}>{account?.surname}</span>
              </strong>
              <p className={styles.matricula}>{account?.matricula}</p>
            </div>
          </label>

          <ul className={styles.options}>
            {account?.isAdmin && (
              <a href="/admin">
                <li>
                  <button>Painel de administrador</button>
                </li>
              </a>
            )}
            <a href="/my">
              <li>
                <button>Meus dados</button>
              </li>
            </a>
            <li>
              <button>Alterar chave de acesso</button>
            </li>
            <li>
              <button>Sair</button>
            </li>
          </ul>
        </div>
      </header>

      <main className={styles.mainBody}>
        <section className={styles.activities}>
          <header>
            <h2>Atividades</h2>
            <ul className={styles.filterBar}>
              <li>
                <select name="order-by" id="activities-order-selector">
                  <option value="recent">Mais recentes</option>
                  <option value="older">Mais antigos</option>
                  <option value="farthest-presentation">
                    Apresentação mais distante
                  </option>
                  <option value="closest-presentation">
                    Apresentação mais próxima
                  </option>
                </select>
              </li>
              <li>
                <select name="filter" id="activities-filter-selector">
                  <option value="all">Todos</option>
                  <option value="pending">Pendentes</option>
                  <option value="finalized">Finalizados</option>
                </select>
              </li>
              <li className={styles.presentationBetween}>
                <strong>Apresentação entre</strong>
                <div className={styles.dateInputs}>
                  <input
                    type="date"
                    name="start-in"
                    id="activities-presentation-between-start-input"
                    min="1970-01-01"
                  />
                  <input
                    type="date"
                    name="end-in"
                    id="activities-presentation-between-end-input"
                    min="1970-01-02"
                  />
                </div>
              </li>
            </ul>
          </header>
        </section>
      </main>
    </div>
  );
}
