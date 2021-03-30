import { IncomingMessage, ServerResponse } from "http";
import { firestore } from "../../../firebase";
import jwt from "jsonwebtoken";

let rateLimitAccumulator: {
  timestamp: number;
  ip: string;
  times: number;
}[] = [];

export default async (req: IncomingMessage, res: ServerResponse) => {
  // @ts-ignore
  if (req.method !== "GET") return res.status(404).send("Not found!");

  rateLimitAccumulator = rateLimitAccumulator.filter(
    (x) => Date.now() - x.timestamp <= 1000 * 60
  );
  if (
    rateLimitAccumulator.find(
      (x) =>
        x.ip === req.socket.remoteAddress &&
        x.times > 5 &&
        Date.now() - x.timestamp < 1000 * 60
    )
  )
    // @ts-ignore
    return res.status(429).send("To many requests");
  else if (
    rateLimitAccumulator.find((x) => x.ip === req.socket.remoteAddress)
  ) {
    rateLimitAccumulator.find((x) => x.ip === req.socket.remoteAddress).times++;
  } else {
    rateLimitAccumulator.push({
      ip: req.socket.remoteAddress,
      times: 1,
      timestamp: Date.now(),
    });
  }

  if (
    !req.headers?.token ||
    typeof req.headers.token !== "string" ||
    !/Bearer .+/g.test(req.headers.token)
  )
    // @ts-ignore
    return res.status(400).send("Bad request!");

  let decoded;

  try {
    decoded = jwt.verify(req.headers.token.slice(7), process.env.SECRET);
  } catch (error) {
    // @ts-ignore
    return res.status(400).send("Bad request!");
  }

  // @ts-ignore

  const page = Number(req.query?.page) || 1; // @ts-ignore
  const order = req.query?.order || "recent"; // @ts-ignore
  const filter = req.query?.filter || "all"; // @ts-ignore
  const between = JSON.parse(req.query?.between) || null; // @ts-ignore
  const activitiesPerPage = Number(req.query?.activitiesPerPage) || 20;
  const accounts = firestore.collection("accounts");
  const filteredAccounts = await accounts.doc(String(decoded.account)).get();
  const account = filteredAccounts.data();
  // @ts-ignore
  if (!account) return res.status(400).send("Bad request!");

  const activitiesCollection = firestore.collection("activities");

  const filteredActivities = await activitiesCollection
    .where("class", "==", account.class)
    .where("presentationTimestamp", ">=", between?.start || 0)
    .where("presentationTimestamp", "<=", between?.end || 999999999999999)
    .get();
  const activitiesData = filteredActivities.docs.map((doc) => doc.data());
  const activitiesDataSorted = activitiesData.sort((a, b) => {
    if (order === "recent") return b.createdTimestamp - a.createdTimestamp;
    if (order === "older") return a.createdTimestamp - b.createdTimestamp;
    if (order === "farthest-presentation")
      return (
        Math.abs(b.presentationTimestamp - Date.now()) -
        Math.abs(a.presentationTimestamp - Date.now())
      );
    if (order === "closest-presentation")
      return (
        Math.abs(a.presentationTimestamp - Date.now()) -
        Math.abs(b.presentationTimestamp - Date.now())
      );
    else return b.createdTimestamp - a.createdTimestamp;
  });
  const activitiesDataSortedFiltered = activitiesDataSorted.filter((x) => {
    if (x.presentationTimestamp < (between?.start || 0)) return false;
    if (x.presentationTimestamp > (between?.end || 999999999999999))
      return false;
    if (filter === "all") return true;
    if (filter === "pending") return x.presentationTimestamp > Date.now();
    console.log(x.presentationTimestamp, Date.now());
    if (filter === "finalized") return x.presentationTimestamp <= Date.now();
  });
  const activitiesDataPaginated = activitiesDataSortedFiltered.reduce(
    (prev, curr, index) => {
      if (
        prev[
          Math.floor(activitiesPerPage > 100 ? 100 : index / activitiesPerPage)
        ]
      )
        prev[
          Math.floor(activitiesPerPage > 100 ? 100 : index / activitiesPerPage)
        ].push(curr);
      else
        prev[
          Math.floor(activitiesPerPage > 100 ? 100 : index / activitiesPerPage)
        ] = [curr];

      return prev;
    },
    []
  );
  const matters = firestore.collection("matters");
  const filteredMatters = await matters
    .where(
      "id",
      "in",
      activitiesDataPaginated[
        page >= activitiesDataPaginated.length
          ? activitiesDataPaginated.length - 1
          : page
      ]?.map((x) => x.matter) || [0]
    )
    .get();
  const mattersData = filteredMatters.docs.map((doc) => doc.data());
  const accountsCollection = await firestore.collection("accounts").get();
  const accountsData = accountsCollection.docs.map((doc) => doc.data());
  const formatedActivitiesData = activitiesDataPaginated[
    page >= activitiesDataPaginated.length
      ? activitiesDataPaginated.length - 1
      : page
  ]?.map((activity) => ({
    ...activity,
    matter: mattersData.find((x) => x.id === activity.matter),
    author: accountsData.find((x) => x.id === activity.author),
  }));
  // @ts-ignore
  return res.status(200).json({
    activities: formatedActivitiesData,
    pages: [
      page >= activitiesDataPaginated.length
        ? activitiesDataPaginated.length - 1
        : page,
      activitiesDataPaginated.length - 1,
    ],
  });
};
