import { IncomingMessage, ServerResponse } from "http";
import { firestore } from "../../firebase";
import jwt from "jsonwebtoken";

let rateLimitAccumulator: {
  timestamp: number;
  ip: string;
  times: number;
}[] = [];

export default async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== "POST" && req.method !== "PUT" && req.method !== "DELETE")
    // @ts-ignore
    return res.status(404).send("Not found!");

  rateLimitAccumulator = rateLimitAccumulator.filter(
    (x) => Date.now() - x.timestamp <= 1000 * 60
  );
  if (
    rateLimitAccumulator.find(
      (x) =>
        x.ip === req.socket.remoteAddress &&
        x.times > 20 &&
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

  const accountsCollection = firestore.collection("accounts");
  const filteredAccounts = await accountsCollection
    .doc(String(decoded.account))
    .get();
  const account = filteredAccounts.data();

  const mattersCollection = await firestore.collection("matters").get();
  const mattersData = mattersCollection.docs.map((doc) => doc.data());

  if (req.method === "POST" || req.method === "PUT") {
    // @ts-ignore
    if (!req.body?.class) return res.status(400).send("Bad request!"); // @ts-ignore
    if (!req.body.presentationTimestamp)
      // @ts-ignore
      req.body.presentationTimestamp = 999999999999999;
    // @ts-ignore
    if (req.body.class !== account.class && !account.isAdmin)
      // @ts-ignore
      return res.status(400).send("Bad request!"); // @ts-ignore
    if (!req.body.showedTimestamp) return res.status(400).send("Bad request!"); // @ts-ignore
    if (!req.body.activity) return res.status(400).send("Bad request!"); // @ts-ignore
    if (!req.body.matter) return res.status(400).send("Bad request!"); // @ts-ignore
    if (!mattersData.map((matter) => matter.id).includes(req.body.matter))
      // @ts-ignore
      return res.status(400).send("Bad request!"); // @ts-ignore
    if (!req.body.author) return res.status(400).send("Bad request!"); // @ts-ignore
    if (req.body.author !== account.id && !account.isAdmin)
      // @ts-ignore
      return res.status(400).send("Bad request!");
    if (req.method === "PUT") {
      //@ts-ignore
      if (!req.body.id) return res.status(400).send("Bad request!");
    }
  } else if (req.method === "DELETE") {
    //@ts-ignore
    if (!req.query?.id) return res.status(400).send("Bad request!");
  }

  const activitiesCollection = firestore.collection("activities");
  const timestamp = Date.now();
  if (req.method === "POST") {
    activitiesCollection.doc(String(timestamp)).set({
      // @ts-ignore
      activity: req.body.activity, // @ts-ignore
      author: req.body.author, // @ts-ignore
      class: req.body.class,
      createdAt: new Date(timestamp),
      createdTimestamp: timestamp,
      updatedTimestamp: timestamp,
      id: timestamp, // @ts-ignore
      matter: req.body.matter, // @ts-ignore
      presentationTimestamp: req.body.presentationTimestamp, // @ts-ignore
      showedTimestamp: req.body.showedTimestamp,
    });
  } else if (req.method === "PUT") {
    // @ts-ignore
    const activityForEdit = ( //@ts-ignore
      await activitiesCollection.doc(String(req.body.id))?.get()
    )?.data(); // @ts-ignore
    if (!activityForEdit) return res.status(400).send("Bad request!");
    //@ts-ignore
    activitiesCollection.doc(String(req.body.id)).update({
      //@ts-ignore
      activity: req.body.activity, //@ts-ignore
      author: req.body.author, // @ts-ignore
      class: req.body.class,
      updatedTimestamp: timestamp, //@ts-ignore
      matter: req.body.matter, // @ts-ignore
      presentationTimestamp: req.body.presentationTimestamp, // @ts-ignore
      showedTimestamp: req.body.showedTimestamp,
    });
  } else if (req.method === "DELETE") {
    // @ts-ignore
    const activityForDelete = ( //@ts-ignore
      await activitiesCollection.doc(String(req.query.id))?.get()
    )?.data();
    if (
      !activityForDelete ||
      (activityForDelete.author !== account.id && !account.isAdmin)
    )
      // @ts-ignore
      return res.status(400).send("Bad request!");
    // @ts-ignore
    activitiesCollection.doc(String(req.query.id)).delete();
  }

  // @ts-ignore
  return res.status(201).send("OK");
};
