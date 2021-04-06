import axios from "axios";
import styles from "../styles/components/ActivitiesHeader.module.css";
import { INewActivity, IMatter } from "../pages/panel";
import { AccountContext } from "../contexts/AccountContext";
import { Dispatch, SetStateAction, useContext, useEffect } from "react";

interface IActivitiesHeaderProps {
  getActivities: () => void;
  setState: Dispatch<SetStateAction<"all" | "concluded" | "unconcluded">>;
  setFilterAuthor: Dispatch<SetStateAction<"all" | "my" | "others">>;
  setPerPage: Dispatch<SetStateAction<20 | 40 | 100>>;
  setBetween: Dispatch<SetStateAction<{ start?: number; end?: number }>>;
  setSituation: Dispatch<SetStateAction<"all" | "pendind" | "finalized">>;
  setOrderBy: Dispatch<
    SetStateAction<
      "recent" | "older" | "farthest-presentation" | "closest-presentation"
    >
  >;
  newActivity: INewActivity;
  setNewActivity: Dispatch<SetStateAction<INewActivity>>;
  between: { start?: number; end?: number };
  matters: IMatter[];
  localStorage: Storage;
}

export function ActivitiesHeader({
  getActivities,
  setState,
  setFilterAuthor,
  setPerPage,
  setBetween,
  setSituation,
  setOrderBy,
  newActivity,
  setNewActivity,
  between,
  matters,
  localStorage,
}: IActivitiesHeaderProps) {
  const { account } = useContext(AccountContext);

  function createActivity() {
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

  useEffect(() => {
    try {
      (document.getElementById(
        "activities-order-selector"
      ) as HTMLSelectElement).value = JSON.parse(
        localStorage?.getItem("activities-filter") || "null"
      )?.orderBy;
      (document.getElementById(
        "activities-situation-selector"
      ) as HTMLSelectElement).value = JSON.parse(
        localStorage?.getItem("activities-filter") || "null"
      )?.situation;
      (document.getElementById(
        "activities-state-selector"
      ) as HTMLSelectElement).value = JSON.parse(
        localStorage?.getItem("activities-filter") || "null"
      )?.state;
      (document.getElementById(
        "activities-per-page-selector"
      ) as HTMLSelectElement).value = JSON.parse(
        localStorage?.getItem("activities-filter") || "null"
      )?.perPage;
      (document.getElementById(
        "activities-filter-author-selector"
      ) as HTMLSelectElement).value = JSON.parse(
        localStorage?.getItem("activities-filter") || "null"
      )?.filterAuthor;
    } catch (err) {
      console.log(err);
    }
  }, []);

  return (
    <header className={styles.activitiesHeader}>
      <h2>Atividades</h2>
      <div className={styles.buttonsContainer}>
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
                <strong>Situação</strong>
                <select
                  name="situation"
                  id="activities-situation-selector" // @ts-ignore
                  onChange={(e) => setSituation(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendentes</option>
                  <option value="finalized">Finalizados</option>
                </select>
              </li>
              <li>
                <strong>Estado</strong>
                <select
                  name="state"
                  id="activities-state-selector" // @ts-ignore
                  onChange={(e) => setState(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="concluded">Concluídos</option>
                  <option value="unconcluded">Não concluídos</option>
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
                    setFilterAuthor(e.target.value as "all" | "my" | "others")
                  }
                >
                  <option value="all">Todos</option>
                  <option value="my">Eu</option>
                  <option value="others">Outros</option>
                </select>
              </li>
              <div className={styles.buttonsContainer}>
                <button className={styles.cancel}>
                  <label htmlFor="activities-filter-checkbox">Cancelar</label>
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
                createActivity();
              }}
            >
              <div className={styles.inputsContainer}>
                <div className={styles.inputActivityContainer}>
                  <textarea
                    name="activity"
                    id="new-activity-input-activity"
                    className={newActivity.activity?.length && styles.inputed}
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
                        showedTimestamp: new Date(e.target.value).getTime(),
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
  );
}
