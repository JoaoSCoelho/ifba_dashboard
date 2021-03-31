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
    id: number;
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

interface IEditActivity extends INewActivity {
  id: number;
}

interface IMatter {
  name: string;
  id: number;
  hexColor: string;
}

export default function Panel() {
  let { account, setAccount } = useContext(AccountContext);
  const [orderBy, setOrderBy] = useState<
    "recent" | "older" | "farthest-presentation" | "closest-presentation"
  >("recent");
  const [filter, setFilter] = useState<"all" | "pendind" | "finalized">("all");
  const [between, setBetween] = useState<{ start?: number; end?: number }>({});
  const [perPage, setPerPage] = useState<20 | 40 | 100>(20);
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [matters, setMatters] = useState<IMatter[]>([]);
  let [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [filterAuthor, setFilterAuthor] = useState<"all" | "my" | "others">(
    "all"
  );
  const [newActivity, setNewActivity] = useState<INewActivity>({
    author: account?.id,
    class: account?.class,
  });
  const [editActivity, setEditActivity] = useState<IEditActivity>();
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
          author: filterAuthor,
          activitiesPerPage: perPage,
        },
      })
      .then(({ data: { activities, pages } }) => {
        setPages(pages[1]);
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

  function editActivityFunc() {
    if (
      !editActivity.activity ||
      !editActivity.presentationTimestamp ||
      !editActivity.showedTimestamp ||
      !editActivity.matter
    )
      return alert("Você precisa preencher todos os campos");

    if (!editActivity.author) editActivity.author = account.id;
    if (!editActivity.class) editActivity.class = account.class;
    if (editActivity.author !== account?.id && !account?.isAdmin) return;
    if (editActivity.class !== account?.class && !account?.isAdmin) return;

    axios
      .put("/api/activities", editActivity, {
        headers: {
          token: `Bearer ${localStorage.getItem("acessToken")}`,
        },
      })
      .then(() => {
        setEditActivity(undefined);
        getActivities();
      })
      .catch((e) => {
        alert("Ocorreu um erro ao editar esta atividade!");
        setEditActivity(undefined);
      });
  }

  function deleteActivity(activity: IActivity) {
    if (!confirm("Deseja realmente excluir essa atividade?")) return;
    if (!activity.author) return;
    if (!activity.class) return;
    if (activity.author.id !== account?.id && !account?.isAdmin) return;
    if (activity.class !== account?.class && !account?.isAdmin) return;

    axios
      .delete("/api/activities", {
        headers: {
          token: `Bearer ${localStorage.getItem("acessToken")}`,
        },
        params: {
          id: activity.id,
        },
      })
      .then(() => {
        getActivities();
      })
      .catch(() => {
        alert("Ocorreu um erro ao excluir esta atividade!");
      });
  }

  function checkActivity(activity: IActivity) {
    if (account.concludedActivities?.includes(activity.id)) {
      const newConcludedActivities = account.concludedActivities.reduce(
        (prev, curr) => {
          curr !== activity.id ? prev.push(curr) : prev;
          return prev;
        },
        [] as number[]
      );

      axios
        .put(
          "/api/my",
          {
            concludedActivities: newConcludedActivities,
          },
          {
            headers: {
              token: `Bearer ${localStorage.getItem("acessToken")}`,
            },
          }
        )
        .then(() => {
          account = { ...account, concludedActivities: newConcludedActivities };
          localStorage.setItem("account", JSON.stringify(account));
          account.concludedActivities.map((id) =>
            document
              .getElementById(`activity-${activity.id}`)
              ?.classList.remove(styles.concluded)
          );
        })
        .catch(() => {
          alert("Ocorreu um erro ao desmarcar esta atividade como concluída!");
        });
      return;
    }

    axios
      .put(
        "/api/my",
        {
          concludedActivities: [...account.concludedActivities, activity.id],
        },
        {
          headers: {
            token: `Bearer ${localStorage.getItem("acessToken")}`,
          },
        }
      )
      .then(() => {
        account = {
          ...account,
          concludedActivities: [...account.concludedActivities, activity.id],
        };
        localStorage.setItem("account", JSON.stringify(account));
        account.concludedActivities.map((id) =>
          document
            .getElementById(`activity-${activity.id}`)
            ?.classList.add(styles.concluded)
        );
      })
      .catch(() => {
        alert("Ocorreu um erro ao marcar esta atividade como concluída!");
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
                    <li>
                      <strong>Autor</strong>
                      <select
                        name="activities-filter-author-selector"
                        id="activities-filter-author-selector"
                        onChange={(e) =>
                          setFilterAuthor(
                            e.target.value as "all" | "my" | "others"
                          )
                        }
                      >
                        <option value="all">Todos</option>
                        <option value="my">Eu</option>
                        <option value="others">Outros</option>
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
                      id={`activity-${activity.id}`}
                      className={`${styles.activityCard} ${
                        Date.now() >= activity.presentationTimestamp
                          ? styles.finalized
                          : styles.pending
                      } ${
                        account?.concludedActivities?.includes(activity.id) &&
                        styles.concluded
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

                      <div className={styles.activityCardFooterContainer}>
                        <div className={styles.activityCardFooter}>
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

                          {
                            <div className={styles.buttonsContainer}>
                              <button
                                title={
                                  account.concludedActivities?.includes(
                                    activity.id
                                  )
                                    ? "Marcar como não concluída"
                                    : "Concluir atividade"
                                }
                                className={styles.checkActivity}
                                onClick={(e) => checkActivity(activity)}
                              >
                                <svg
                                  fill="none"
                                  height="15"
                                  stroke="#000"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                  width="15"
                                >
                                  <path d="M22 11.07V12a10 10 0 1 1-5.93-9.14" />
                                  <polyline points="23 3 12 14 9 11" />
                                </svg>
                              </button>
                              {(activity.author.id === account.id ||
                                account.isAdmin) && (
                                <button
                                  title="Editar atividade"
                                  className={styles.editActivity}
                                  onClick={(e) => {
                                    setEditActivity({
                                      class: activity.class,
                                      author: activity.author?.id,
                                      id: activity.id,
                                      activity: activity.activity,
                                      matter: activity.matter.id,
                                      presentationTimestamp:
                                        activity.presentationTimestamp,
                                      showedTimestamp: activity.showedTimestamp,
                                    });
                                    getMatters(({
                                      target: { checked: true },
                                    } as unknown) as ChangeEvent<HTMLInputElement>);
                                  }}
                                >
                                  <svg
                                    viewBox="0 0 32 32"
                                    width="15"
                                    height="15"
                                  >
                                    <title />
                                    <g data-name="Layer 42" id="Layer_42">
                                      <path d="M2,29a1,1,0,0,1-1-1.11l.77-7a1,1,0,0,1,.29-.59L18.42,3.94a3.2,3.2,0,0,1,4.53,0l3.11,3.11a3.2,3.2,0,0,1,0,4.53L9.71,27.93a1,1,0,0,1-.59.29l-7,.77Zm7-1.78H9ZM3.73,21.45l-.6,5.42,5.42-.6,16.1-16.1a1.2,1.2,0,0,0,0-1.7L21.53,5.35a1.2,1.2,0,0,0-1.7,0Z" />
                                      <path d="M23,14.21a1,1,0,0,1-.71-.29L16.08,7.69A1,1,0,0,1,17.5,6.27l6.23,6.23a1,1,0,0,1,0,1.42A1,1,0,0,1,23,14.21Z" />
                                      <rect
                                        height="2"
                                        transform="translate(-8.31 14.13) rotate(-45)"
                                        width="11.01"
                                        x="7.39"
                                        y="16.1"
                                      />
                                      <path d="M30,29H14a1,1,0,0,1,0-2H30a1,1,0,0,1,0,2Z" />
                                    </g>
                                  </svg>
                                </button>
                              )}
                              {(activity.author.id === account.id ||
                                account.isAdmin) && (
                                <button
                                  className={styles.excludeActivity}
                                  title="Excluir atividade"
                                  onClick={(e) => deleteActivity(activity)}
                                >
                                  <svg
                                    fill="none"
                                    height="15"
                                    stroke="#000"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    width="15"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    <line x1="10" x2="10" y1="11" y2="17" />
                                    <line x1="14" x2="14" y1="11" y2="17" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className={styles.activitiesPreMessage}>Carregando...</p>
            )}
          </div>

          <div
            className={styles.activityEditionContainer}
            style={{ display: editActivity ? "flex" : "none" }}
          >
            <form
              className={styles.activityEditionForm}
              onSubmit={(e) => {
                e.preventDefault();
                editActivityFunc();
              }}
            >
              <div className={styles.inputsContainer}>
                <div className={styles.inputActivityContainer}>
                  <textarea
                    name="activity"
                    id="activity-edition-input-activity"
                    className={editActivity?.activity?.length && styles.inputed}
                    value={editActivity?.activity}
                    onChange={(e) =>
                      setEditActivity({
                        ...editActivity,
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
                    name="activity-edition-select-matter"
                    id="activity-edition-select-matter"
                    value={editActivity?.matter}
                    onChange={(e) =>
                      setEditActivity({
                        ...editActivity,
                        matter: Number(e.target.value),
                      })
                    }
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
                    name="activity-edition-input-showed-timestamp"
                    id="activity-edition-input-showed-timestamp"
                    value={moment(editActivity?.showedTimestamp).format(
                      "YYYY-MM-DD"
                    )}
                    onChange={(e) =>
                      setEditActivity({
                        ...editActivity,
                        showedTimestamp: new Date(e.target.value).getTime(),
                      })
                    }
                  />
                </div>
                <div className={styles.presentationTimestampContainer}>
                  <strong>Data de apresentação</strong>
                  <input
                    type="date"
                    name="activity-edition-input-presentation-timestamp"
                    id="activity-edition-input-presentation-timestamp"
                    value={moment(editActivity?.presentationTimestamp).format(
                      "YYYY-MM-DD"
                    )}
                    onChange={(e) =>
                      setEditActivity({
                        ...editActivity,
                        presentationTimestamp: new Date(
                          e.target.value
                        ).getTime(),
                      })
                    }
                  />
                </div>
              </div>
              <div className={styles.buttonsContainer}>
                <button
                  className={styles.cancel}
                  type="button"
                  onClick={(e) => setEditActivity(undefined)}
                >
                  <p>Cancelar</p>
                </button>
                <button className={styles.confirm} type="submit">
                  <p>Confirmar</p>
                </button>
              </div>
            </form>
          </div>

          <footer className={styles.activitiesFooter}>
            <button
              className={styles.prevPage}
              disabled={page - 1 < 1 ? true : false}
              onClick={(e) => {
                if (!e.currentTarget.disabled) {
                  page = page - 1;
                  getActivities();
                  setPage(page);
                  (document.getElementById(
                    "activities-page-input"
                  ) as HTMLInputElement).value = String(page);
                }
              }}
            >
              &lt;
            </button>
            <input
              type="number"
              name="activities-page-input"
              id="activities-page-input"
              defaultValue={page}
              onChange={(e) => {
                e.target.value = String(parseInt(e.target.value));
                if (Number(e.target.value) > pages) e.target.value = `${pages}`;
                if (Number(e.target.value) < 1) e.target.value = "1";
                setPage(Number(e.target.value));
              }}
              onKeyPress={(e) => (e.code === "Enter" ? getActivities() : "")}
              max={pages}
              className={styles.pageInput}
            />
            <p>de {pages}</p>
            <button
              className={styles.nextPage}
              disabled={page + 1 > pages ? true : false}
              onClick={(e) => {
                if (!e.currentTarget.disabled) {
                  page = page + 1;
                  getActivities();
                  setPage(page);
                  (document.getElementById(
                    "activities-page-input"
                  ) as HTMLInputElement).value = String(page);
                }
              }}
            >
              &gt;
            </button>
          </footer>
        </section>
      </main>
    </div>
  );
}
