import { IncomingMessage, ServerResponse } from "http";
import { firestore } from "../../firebase";
import jwt from "jsonwebtoken";

let rateLimitAccumulator: {
  timestamp: number;
  ip: string;
  times: number;
}[] = [];

export default async (req: IncomingMessage, res: ServerResponse) => {
  // @ts-ignore
  if (req.method !== "POST") return res.status(404).send("Not found!");

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

  const accountsCollection = firestore.collection("accounts");
  const filteredAccounts = await accountsCollection
    .doc(String(decoded.account))
    .get();
  const account = filteredAccounts.data();

  const mattersCollection = await firestore.collection("matters").get();
  const mattersData = mattersCollection.docs.map((doc) => doc.data());

  // @ts-ignore
  if (!req.body?.presentationTimestamp)
    // @ts-ignore
    return res.status(400).send("Bad request!"); // @ts-ignore
  if (!req.body.class) return res.status(400).send("Bad request!"); // @ts-ignore
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

  const activitiesCollection = firestore.collection("activities");
  activitiesCollection.doc(String(Date.now())).set({
    // @ts-ignore
    activity: req.body.activity, // @ts-ignore
    author: req.body.author, // @ts-ignore
    class: req.body.class,
    createdAt: new Date(),
    createdTimestamp: Date.now(),
    id: Date.now(), // @ts-ignore
    matter: req.body.matter, // @ts-ignore
    presentationTimestamp: req.body.presentationTimestamp, // @ts-ignore
    showedTimestamp: req.body.showedTimestamp,
  });

  // @ts-ignore
  return res.status(201).send("OK");
};
