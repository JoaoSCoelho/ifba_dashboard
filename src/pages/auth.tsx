import axios from "axios";
import Head from "next/head";
import { MouseEvent, useState } from "react";
import styles from "../styles/pages/Auth.module.css";
import { useRouter } from "next/router";

export default function Auth() {
  const [showKey, setShowKey] = useState(false);
  const [inputed, setInputed] = useState(false);
  const [acessKey, setAcessKey] = useState("");
  const [serverError, setServerError] = useState("");
  const [keepConnected, setKeepConnected] = useState(false);
  const router = useRouter();

  function submit(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const loadingContainer = document.getElementById("loading-container");
    loadingContainer.style.display = "flex";

    if (!acessKey) {
      setServerError("");
      setServerError("CHAVE DE ACESSO NEGADA");
      loadingContainer.style.display = "none";
      return;
    }

    axios
      .post("/api/auth", { acessKey }, { params: { keepConnected } })
      .then(({ data: { token, account } }) => {
        setServerError("");
        localStorage.setItem("acessToken", token);
        localStorage.setItem("account", JSON.stringify(account));
        localStorage.setItem(
          "expiresIn",
          JSON.stringify(Date.now() + 1000 * 60 * 60 * 48)
        );
        loadingContainer.style.display = "none";
        router.push("/panel");
      })
      .catch((e) => {
        loadingContainer.style.display = "none";
        if (e.response?.status === 400) {
          setServerError("");
          setServerError("CHAVE DE ACESSO NEGADA!");
        } else if (e.response?.status === 429) {
          setServerError("");
          setServerError("MUITAS REQUISIÇÕES, AGUARDE UM INSTANTE!");
        }

        setAcessKey("");
        (document.getElementById("acess-key-input") as HTMLInputElement).value =
          "";
      });
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Autenticação</title>
      </Head>
      <div
        className={styles.loading}
        id="loading-container"
        style={{ display: "none" }}
      >
        <svg width="180" height="180">
          <circle
            className={styles.loadingCircle}
            fill="none"
            stroke="white"
            strokeWidth="3"
            cx="93"
            cy="93"
            r="84"
          />

          <circle
            className={styles.loadingCircleInter}
            fill="none"
            stroke="white"
            strokeWidth="3"
            cx="93"
            cy="86"
            r="78"
          />
        </svg>
        <p>Verificando...</p>
      </div>

      <main
        className={`${styles.authContainer} ${
          serverError && styles.invalidKey
        }`}
      >
        <header className={styles.authHeader}>
          <svg
            id="Icons"
            version="1.1"
            viewBox="0 0 32 32"
            height="80"
            width="80"
          >
            <g>
              <path d="M11,30H5c-1.7,0-3-1.3-3-3v-6c0-1.7,1.3-3,3-3h6c1.7,0,3,1.3,3,3v6C14,28.7,12.7,30,11,30z" />
            </g>
            <g>
              <path d="M29,6H17c-0.6,0-1-0.4-1-1s0.4-1,1-1h12c0.6,0,1,0.4,1,1S29.6,6,29,6z" />
            </g>
            <g>
              <path d="M24,10h-7c-0.6,0-1-0.4-1-1s0.4-1,1-1h7c0.6,0,1,0.4,1,1S24.6,10,24,10z" />
            </g>

            <path d="M11,2H5C3.3,2,2,3.3,2,5v6c0,1.7,1.3,3,3,3h6c1.7,0,3-1.3,3-3V5C14,3.3,12.7,2,11,2z M11.7,6.7l-3,3C8.5,9.9,8.3,10,8,10  S7.5,9.9,7.3,9.7l-2-2c-0.4-0.4-0.4-1,0-1.4s1-0.4,1.4,0L8,7.6l2.3-2.3c0.4-0.4,1-0.4,1.4,0S12.1,6.3,11.7,6.7z" />
          </svg>
          <div className={styles.text}>
            <strong className={styles.name}>IF Dash</strong>
            <p className={styles.slogan}>Organize-se!</p>
          </div>
        </header>

        <form className={styles.authForm}>
          <div
            className={`${styles.inputKeyContainer} ${
              serverError && styles.invalidKey
            }`}
          >
            <input
              type={showKey ? "text" : "password"}
              className={`${styles.inputKey} ${inputed && styles.inputed}`}
              onChange={(e) => {
                e.target.value.length ? setInputed(true) : setInputed(false);
                setAcessKey(e.target.value);
              }}
              id="acess-key-input"
            />
            <span className={styles.inputPlaceholder}>Chave de acesso</span>
            <button
              type="button"
              className={styles.viewKey}
              onClick={(e) => {
                e.preventDefault();
                setShowKey(!showKey);
              }}
            >
              {showKey ? (
                <img src="/eye-off.svg" alt="Olho fechado" />
              ) : (
                <img src="/eye.svg" alt="Olho aberto" />
              )}
            </button>
            <button
              type="submit"
              className={styles.authButton}
              onClick={submit}
              id="form-auth-submit-button"
            >
              <svg
                id="arrow_right"
                version="1.1"
                viewBox="0 0 96 96"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.arrowRightSvg}
              >
                <path d="M12,52h62.344L52.888,73.456c-1.562,1.562-1.562,4.095-0.001,5.656c1.562,1.562,4.096,1.562,5.658,0l28.283-28.284l0,0  c0.186-0.186,0.352-0.391,0.498-0.609c0.067-0.101,0.114-0.21,0.172-0.315c0.066-0.124,0.142-0.242,0.195-0.373  c0.057-0.135,0.089-0.275,0.129-0.415c0.033-0.111,0.076-0.217,0.099-0.331C87.973,48.525,88,48.263,88,48l0,0  c0-0.003-0.001-0.006-0.001-0.009c-0.001-0.259-0.027-0.519-0.078-0.774c-0.024-0.12-0.069-0.231-0.104-0.349  c-0.039-0.133-0.069-0.268-0.123-0.397c-0.058-0.139-0.136-0.265-0.208-0.396c-0.054-0.098-0.097-0.198-0.159-0.292  c-0.146-0.221-0.314-0.427-0.501-0.614L58.544,16.888c-1.562-1.562-4.095-1.562-5.657-0.001c-1.562,1.562-1.562,4.095,0,5.658  L74.343,44L12,44c-2.209,0-4,1.791-4,4C8,50.209,9.791,52,12,52z" />
              </svg>
            </button>
          </div>

          <div className={styles.keepConnectedContainer}>
            <input
              type="checkbox"
              name="keep-connected-checkbox"
              id="keep-connected-checkbox"
              onChange={(e) => setKeepConnected(e.target.checked)}
            />
            <label htmlFor="keep-connected-checkbox">
              <p>Mantenha-me conectado</p>
            </label>
          </div>

          {serverError && (
            <span className={styles.invalidKeyText}>{serverError}</span>
          )}
        </form>
      </main>
    </div>
  );
}
