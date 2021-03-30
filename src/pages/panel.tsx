import styles from "../styles/pages/Panel.module.css";
import Head from "next/head";
import {
  ChangeEvent,
  createElement,
  FormEvent,
  SyntheticEvent,
  useContext,
  useEffect,
  useState,
} from "react";
import { AccountContext } from "../contexts/AccountContext";
import axios from "axios";
import moment from "moment";
import { Converter } from "showdown";

interface IActivity {
  id: number;
  createdTimestamp: number;
  presentationTimestamp: number;
  class: string;
  showedTimestamp: number;
  activity: string;
  matter?: IMatter;
  author?: {
    firstName: string;
    surname: string;
  };
}

interface INewActivity {
  presentationTimestamp?: number;
  class: string;
  showedTimestamp?: number;
  activity?: string;
  matter?: number;
  author: number;
}

interface IMatter {
  name: string;
  id: number;
  hexColor: string;
}

export default function Panel() {
  const { account, setAccount } = useContext(AccountContext);
  const [orderBy, setOrderBy] = useState<
    "recent" | "older" | "farthest-presentation" | "closest-presentation"
  >("recent");
  const [filter, setFilter] = useState<"all" | "pendind" | "finalized">("all");
  const [between, setBetween] = useState<{ start?: number; end?: number }>({});
  const [perPage, setPerPage] = useState<20 | 40 | 100>(20);
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [matters, setMatters] = useState<IMatter[]>([]);
  const [page, setPage] = useState(1);
  const [newActivity, setNewActivity] = useState<INewActivity>({
    author: account?.id,
    class: account?.class,
  });
  const mdConverter = new Converter();

  function getActivities() {
    axios
      .get("/api/user/activities", {
        headers: { token: `Bearer ${localStorage.getItem("acessToken")}` },
        params: {
          page,
          order: orderBy,
          filter,
          between,
          activitiesPerPage: perPage,
        },
      })
      .then(({ data: { activities } }) => {
        setActivities(activities);
        activities.map((activity) => {
          document.getElementById(
            "activity-activity-text-" + activity.id
          ).innerHTML = mdConverter.makeHtml(activity.activity);
        });
      })
      .catch(() => {});
  }

  function getMatters(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      axios
        .get("/api/matters")
        .then(({ data: { matters } }) => {
          setMatters(matters);
          setNewActivity({
            ...newActivity,
            matter: matters?.[0]?.id,
          });
        })
        .catch(() => {});
    }
  }

  function createActivity(e: FormEvent<HTMLFormElement>) {
    if (
      !newActivity.activity ||
      !newActivity.presentationTimestamp ||
      !newActivity.showedTimestamp ||
      !newActivity.matter
    )
      return alert("Você precisa preencher todos os campos");
    if (!newActivity.author) newActivity.author = account.id;
    if (!newActivity.class) newActivity.class = account.class;
    if (newActivity.author !== account?.id && !account?.isAdmin) return;
    if (newActivity.class !== account?.class && !account?.isAdmin) return;

    axios
      .post("/api/activities", newActivity, {
        headers: {
          token: `Bearer ${localStorage.getItem("acessToken")}`,
        },
      })
      .then(() => {
        setNewActivity({ author: account?.id, class: account?.class });
        (document.getElementById(
          "new-activity-input-activity"
        ) as HTMLTextAreaElement).value = "";
        (document.getElementById(
          "new-activity-select-matter"
        ) as HTMLSelectElement).value = "";
        (document.getElementById(
          "new-activity-input-showed-timestamp"
        ) as HTMLInputElement).value = "";
        (document.getElementById(
          "new-activity-input-presentation-timestamp"
        ) as HTMLInputElement).value = "";
        getActivities();
        document.getElementById("new-activity-checkbox").click();
      })
      .catch((e) => {
        alert("Ocorreu um erro ao criar uma nova atividade!");
        document.getElementById("new-activity-checkbox").click();
      });
  }

  useEffect(setAccount, []);
  useEffect(getActivities, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Painel</title>
      </Head>

      <header className={styles.pageHeader}>
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
                    (activity) => activity.presentationTimestamp > Date.now()
                  ).length || 0}
                </strong>
              </div>
            </li>
          </ul>
        </div>

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
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <div className={styles.filterBarContainer}>
                <input
                  type="checkbox"
                  name="activities-filter-checkbox"
                  id="activities-filter-checkbox"
                  className={styles.activitiesFilterCheckbox}
                />
                <div className={styles.labelContainer}>
                  <label htmlFor="activities-filter-checkbox">
                    <svg
                      height="12px"
                      version="1.1"
                      viewBox="0 0 18 12"
                      width="18px"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <title />
                      <desc />
                      <defs />
                      <g
                        fill="none"
                        fillRule="evenodd"
                        id="Page-1"
                        stroke="none"
                        strokeWidth="1"
                      >
                        <g
                          fill="#000000"
                          id="Core"
                          transform="translate(-465.000000, -216.000000)"
                        >
                          <g
                            id="filter"
                            transform="translate(465.000000, 216.000000)"
                          >
                            <path
                              d="M7,12 L11,12 L11,10 L7,10 L7,12 L7,12 Z M0,0 L0,2 L18,2 L18,0 L0,0 L0,0 Z M3,7 L15,7 L15,5 L3,5 L3,7 L3,7 Z"
                              id="Shape"
                            />
                          </g>
                        </g>
                      </g>
                    </svg>
                    <p>Filtros</p>
                  </label>
                </div>
                <div className={styles.filterBarListContainer}>
                  <label htmlFor="activities-filter-checkbox"></label>
                  <ul className={styles.filterBar}>
                    <li>
                      <strong>Ordenar por</strong>
                      <select
                        name="order-by"
                        id="activities-order-selector" // @ts-ignore
                        onChange={(e) => setOrderBy(e.target.value)}
                      >
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
                      <strong>Filtro</strong>
                      <select
                        name="filter"
                        id="activities-filter-selector" // @ts-ignore
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        <option value="all">Todos</option>
                        <option value="pending">Pendentes</option>
                        <option value="finalized">Finalizados</option>
                      </select>
                    </li>
                    <li
                      className={`${styles.presentationBetween} ${styles.haveTitle}`}
                    >
                      <strong>Apresentação entre</strong>
                      <div className={styles.dateInputs}>
                        <input
                          type="date"
                          name="start-in"
                          id="activities-presentation-between-start-input"
                          min="1970-01-01"
                          onChange={(e) =>
                            setBetween({
                              start: new Date(e.target.value).getTime(),
                              end: between.end,
                            })
                          }
                        />
                        e
                        <input
                          type="date"
                          name="end-in"
                          id="activities-presentation-between-end-input"
                          min="1970-01-02"
                          onChange={(e) =>
                            setBetween({
                              start: between.start,
                              end: new Date(e.target.value).getTime(),
                            })
                          }
                        />
                      </div>
                    </li>
                    <li className={styles.haveTitle}>
                      <strong>Exibir</strong>
                      <select
                        name="perPage"
                        id="activities-per-page-selector" // @ts-ignore
                        onChange={(e) => setPerPage(Number(e.target.value))}
                      >
                        <option value="20">20</option>
                        <option value="40">40</option>
                        <option value="100">100</option>
                      </select>
                    </li>
                    <div className={styles.buttonsContainer}>
                      <button className={styles.cancel}>
                        <label htmlFor="activities-filter-checkbox">
                          Cancelar
                        </label>
                      </button>
                      <button
                        className={styles.aply}
                        onClick={() => {
                          getActivities();
                          document
                            .getElementById("activities-filter-checkbox")
                            .click();
                        }}
                      >
                        <p>Aplicar</p>
                      </button>
                    </div>
                  </ul>
                </div>
              </div>
              <div className={styles.newActivityContainer}>
                <input
                  type="checkbox"
                  name="new-activity-checkbox"
                  id="new-activity-checkbox"
                  onChange={getMatters}
                  className={styles.newActivityCheckbox}
                />
                <div className={styles.labelContainer}>
                  <label htmlFor="new-activity-checkbox">
                    <svg
                      height="512px"
                      version="1.1"
                      viewBox="0 0 512 512"
                      width="512px"
                    >
                      <polygon points="448,224 288,224 288,64 224,64 224,224 64,224 64,288 224,288 224,448 288,448 288,288 448,288 " />
                    </svg>
                    <p>Novo</p>
                  </label>
                </div>
                <div className={styles.newActivityFormContainer}>
                  <label htmlFor="new-activity-checkbox"></label>
                  <form
                    className={styles.newActivityForm}
                    onSubmit={(e) => {
                      e.preventDefault();
                      createActivity(e);
                    }}
                  >
                    <div className={styles.inputsContainer}>
                      <div className={styles.inputActivityContainer}>
                        <textarea
                          name="activity"
                          id="new-activity-input-activity"
                          className={
                            newActivity.activity?.length && styles.inputed
                          }
                          onChange={(e) =>
                            setNewActivity({
                              ...newActivity,
                              activity: e.target.value,
                            })
                          }
                        />
                        <span className={styles.inputActivityPlaceholder}>
                          Atividade
                        </span>
                        <p className={styles.inputActivityObservation}>
                          <em>
                            <strong>Markdown</strong> permitido
                          </em>
                        </p>
                      </div>
                      <div className={styles.selectMatterContainer}>
                        <strong>Matéria</strong>
                        <select
                          name="new-activity-select-matter"
                          id="new-activity-select-matter"
                          onChange={(e) =>
                            setNewActivity({
                              ...newActivity,
                              matter: Number(e.target.value),
                            })
                          }
                          value={matters[0]?.id}
                        >
                          {matters?.map((matter, i) => (
                            <option key={matter.id} value={matter.id}>
                              {matter.name
                                .split("")
                                .map((letter, index) => {
                                  if (!index) return letter.toUpperCase();
                                  else return letter;
                                })
                                .join("")}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.showedTimestampContainer}>
                        <strong>Data em que foi passado</strong>
                        <input
                          type="date"
                          name="new-activity-input-showed-timestamp"
                          id="new-activity-input-showed-timestamp"
                          onChange={(e) =>
                            setNewActivity({
                              ...newActivity,
                              showedTimestamp: new Date(
                                e.target.value
                              ).getTime(),
                            })
                          }
                        />
                      </div>
                      <div className={styles.presentationTimestampContainer}>
                        <strong>Data de apresentação</strong>
                        <input
                          type="date"
                          name="new-activity-input-presentation-timestamp"
                          id="new-activity-input-presentation-timestamp"
                          onChange={(e) =>
                            setNewActivity({
                              ...newActivity,
                              presentationTimestamp: new Date(
                                e.target.value
                              ).getTime(),
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className={styles.buttonsContainer}>
                      <button className={styles.cancel} type="button">
                        <label htmlFor="new-activity-checkbox">Cancelar</label>
                      </button>
                      <button className={styles.create} type="submit">
                        <p>Criar</p>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </header>

          <div className={styles.activitiesCards}>
            {!activities ? (
              <p className={styles.activitiesPreMessage}>Sem resultados</p>
            ) : activities.length ? (
              activities?.map((activity) => {
                return (
                  <div
                    key={activity.id}
                    className={styles.activityCardContainer}
                  >
                    <div
                      className={`${styles.activityCard} ${
                        Date.now() >= activity.presentationTimestamp
                          ? styles.finalized
                          : styles.pending
                      }`}
                    >
                      <ul>
                        <li className={styles.activityName}>
                          <strong>Atividade</strong>
                          <p id={`activity-activity-text-${activity.id}`}></p>
                        </li>
                        <li className={styles.period}>
                          <strong>Período</strong>
                          <div className={styles.datesContainer}>
                            <div className={styles.dates}>
                              <div className={styles.dateStart}>
                                {moment(activity.showedTimestamp)
                                  .locale("pt-br")
                                  .format("L")}
                              </div>
                              <span>a</span>
                              <div className={styles.dateEnd}>
                                {moment(activity.presentationTimestamp)
                                  .locale("pt-br")
                                  .format("L")}
                              </div>
                            </div>
                          </div>
                        </li>
                        <li className={styles.matter || ""}>
                          <strong>Matéria</strong>
                          <div>
                            <p
                              style={{
                                backgroundColor:
                                  "#" + (activity.matter?.hexColor || "808080"),
                              }}
                            >
                              {activity.matter?.name
                                .split("")
                                .map((letter, index) => {
                                  if (!index) return letter.toUpperCase();
                                  else return letter;
                                })
                                .join("") || "Sem matéria"}
                            </p>
                          </div>
                        </li>
                        <li>
                          <strong>Situação</strong>
                          <p>
                            {Date.now() >= activity.presentationTimestamp
                              ? "Finalizado"
                              : "Pendente"}
                          </p>
                        </li>
                      </ul>

                      <div className={styles.createdByInDate}>
                        <p>
                          Em{" "}
                          <em>
                            {moment(activity.createdTimestamp)
                              .locale("pt-br")
                              .format("LLLL")}
                          </em>{" "}
                          por{" "}
                          {activity.author ? (
                            <strong>
                              {activity.author.firstName}{" "}
                              {activity.author.surname}
                            </strong>
                          ) : (
                            <em>Conta excluída</em>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className={styles.activitiesPreMessage}>Carregando...</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
