import styles from "../styles/pages/Panel.module.css";
import Head from "next/head";
import { useContext, useEffect, useState } from "react";
import { AccountContext } from "../contexts/AccountContext";
import axios from "axios";
import moment from "moment";
import { Converter } from "showdown";
import { Header } from "../components/Header";
import { ActivitiesHeader } from "../components/ActivitiesHeader";

export interface IActivity {
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

export interface INewActivity {
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

export interface IMatter {
  name: string;
  id: number;
  hexColor: string;
}

export default function Panel() {
  let { account, setAccount, setLocalAccount } = useContext(AccountContext);
  const localStorage = global.localStorage || undefined;
  const [orderBy, setOrderBy] = useState<
    "recent" | "older" | "farthest-presentation" | "closest-presentation"
  >(
    JSON.parse(localStorage?.getItem("activities-filter") || "null")?.orderBy ||
      "recent"
  );
  const [situation, setSituation] = useState<"all" | "pendind" | "finalized">(
    JSON.parse(localStorage?.getItem("activities-filter") || "null")
      ?.situation || "all"
  );
  const [between, setBetween] = useState<{ start?: number; end?: number }>({});
  const [perPage, setPerPage] = useState<20 | 40 | 100>(
    JSON.parse(localStorage?.getItem("activities-filter") || "null")?.perPage ||
      20
  );
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [matters, setMatters] = useState<IMatter[]>([]);
  let [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [filterAuthor, setFilterAuthor] = useState<"all" | "my" | "others">(
    JSON.parse(localStorage?.getItem("activities-filter") || "null")
      ?.filterAuthor || "all"
  );
  const [state, setState] = useState<"all" | "concluded" | "unconcluded">(
    JSON.parse(localStorage?.getItem("activities-filter") || "null")?.state ||
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
          situation,
          state,
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

  function getMatters() {
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
          console.log(prev, curr);
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
          setLocalAccount({
            ...account,
            concludedActivities: newConcludedActivities,
          });
          localStorage.setItem(
            "account",
            JSON.stringify({
              ...account,
              concludedActivities: newConcludedActivities,
            })
          );

          document
            .getElementById(`activity-${activity.id}`)
            ?.classList.remove(styles.concluded);
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
        setLocalAccount({
          ...account,
          concludedActivities: [...account.concludedActivities, activity.id],
        });
        localStorage.setItem(
          "account",
          JSON.stringify({
            ...account,
            concludedActivities: [...account.concludedActivities, activity.id],
          })
        );
        account.concludedActivities.map((id) =>
          document
            .getElementById(`activity-${id}`)
            ?.classList.add(styles.concluded)
        );

        document
          .getElementById(`activity-${activity.id}`)
          ?.classList.add(styles.concluded);
      })
      .catch(() => {
        alert("Ocorreu um erro ao marcar esta atividade como concluída!");
      });
  }

  useEffect(() => {
    getActivities();
    setAccount();
    getMatters();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "activities-filter",
      JSON.stringify({
        orderBy,
        situation,
        perPage,
        filterAuthor,
        state,
      })
    );
  }, [orderBy, situation, perPage, filterAuthor, state]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Painel</title>
      </Head>

      <Header activities={activities} />

      <main className={styles.mainBody}>
        <section className={styles.activities}>
          <ActivitiesHeader
            getActivities={getActivities}
            setState={setState}
            setFilterAuthor={setFilterAuthor}
            setPerPage={setPerPage}
            setBetween={setBetween}
            setSituation={setSituation}
            setOrderBy={setOrderBy}
            newActivity={newActivity}
            setNewActivity={setNewActivity}
            between={between}
            matters={matters}
            localStorage={localStorage}
          />
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
                        account?.concludedActivities?.includes(activity.id)
                          ? styles.concluded
                          : ""
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
                                {moment(
                                  activity.showedTimestamp + 1000 * 60 * 60 * 3
                                ).format("DD/MM/YYYY")}
                              </div>
                              <span>a</span>
                              <div className={styles.dateEnd}>
                                {moment(
                                  activity.presentationTimestamp +
                                    1000 * 60 * 60 * 3
                                ).format("DD/MM/YYYY")}
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
