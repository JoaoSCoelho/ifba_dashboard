import styles from "../styles/components/Header.module.css";
import { IActivity } from "../pages/panel";
import { useRouter } from "next/router";
import { AccountContext } from "../contexts/AccountContext";
import { useContext } from "react";
import Link from "next/link";

interface IHeaderProps {
  activities?: IActivity[];
}

export function Header({ activities }: IHeaderProps) {
  let { account } = useContext(AccountContext);
  const router = useRouter();

  function exitSession() {
    localStorage.removeItem("account");
    localStorage.removeItem("expiresIn");
    localStorage.removeItem("acessToken");
    router.push("/");
  }

  return (
    <header className={styles.pageHeader}>
      {activities && (
        <div className={styles.headerCountersContainer}>
          <input
            type="checkbox"
            name="header-counters-checkbox"
            id="header-counters-checkbox"
            className={styles.headerCountersCheckbox}
          />
          <label htmlFor="header-counters-checkbox">
            <div
              className={`${styles.totalActivitiesCount} ${styles.headerCounter}`}
            >
              <p>Atividades</p>
              <strong>{activities?.length || 0}</strong>
            </div>
            <svg
              version="1.1"
              viewBox="0 0 512 512"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.arrowSvg}
            >
              <path d="M327.3,98.9l-2.1,1.8l-156.5,136c-5.3,4.6-8.6,11.5-8.6,19.2c0,7.7,3.4,14.6,8.6,19.2L324.9,411l2.6,2.3  c2.5,1.7,5.5,2.7,8.7,2.7c8.7,0,15.8-7.4,15.8-16.6h0V112.6h0c0-9.2-7.1-16.6-15.8-16.6C332.9,96,329.8,97.1,327.3,98.9z" />
            </svg>
          </label>
          <ul className={styles.headerCounters}>
            <li>
              <div
                className={`${styles.pendentActivitiesCount} ${styles.headerCounter}`}
              >
                <p>Atividades pendentes</p>
                <strong>
                  {activities?.filter(
                    (activity) =>
                      activity.presentationTimestamp >= Date.now() &&
                      !account.concludedActivities.includes(activity.id)
                  ).length || 0}
                </strong>
              </div>
            </li>
          </ul>
        </div>
      )}

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
            <p className={styles.accountId}>{account?.id}</p>
          </div>
        </label>

        <ul className={styles.options}>
          {account?.isAdmin && (
            <Link href="/admin">
              <a>
                <li>
                  <button>Painel de administrador</button>
                </li>
              </a>
            </Link>
          )}
          <Link href="/panel">
            <a>
              <li>
                <button>Painel</button>
              </li>
            </a>
          </Link>
          <Link href="/my">
            <a>
              <li>
                <button>Meus dados</button>
              </li>
            </a>
          </Link>

          <li>
            <button onClick={exitSession}>Sair</button>
          </li>
        </ul>
      </div>
    </header>
  );
}
