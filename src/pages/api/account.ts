import { IncomingMessage, ServerResponse } from "http";
import { firestore } from "../../firebase";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";

let rateLimitAccumulator: {
  timestamp: number;
  ip: string;
  times: number;
}[] = [];

export default async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== "POST")
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

  const accounts = firestore.collection("accounts");

  const filteredAccounts = await accounts.doc(String(decoded.account)).get();
  const account = filteredAccounts.data();

  // @ts-ignore
  if (!req.body?.firstName)
    // @ts-ignore
    return res.status(400).send("Bad request!"); // @ts-ignore
  if (!req.body.class) return res.status(400).send("Bad request!"); // @ts-ignore
  if (!req.body.middleName) return res.status(400).send("Bad request!"); // @ts-ignore
  if (!req.body.surname) return res.status(400).send("Bad request!"); // @ts-ignore
  if (req.body.isAdmin === undefined)
    // @ts-ignore
    return res.status(400).send("Bad request!"); // @ts-ignore
  if (req.body.isLeader === undefined)
    // @ts-ignore
    return res.status(400).send("Bad request!"); // @ts-ignore
  if (req.body.isTeacher === undefined)
    // @ts-ignore
    return res.status(400).send("Bad request!"); // @ts-ignore
  // @ts-ignore
  if (!account) return res.status(400).send("Bad request!"); // @ts-ignore
  if (!account.isAdmin) return res.status(400).send("Bad request!");
  const timestamp = Date.now();
  const acessKey = bcrypt.hashSync(uuid(), 10);
  await accounts.doc(String(timestamp)).set({
    acessKey, // @ts-ignore
    class: req.body.class,
    concludedActivities: [],
    createdAt: new Date(timestamp),
    createdTimestamp: timestamp, // @ts-ignore
    firstName: req.body.firstName,
    id: timestamp, // @ts-ignore
    isAdmin: req.body.isAdmin, // @ts-ignore
    isLeader: req.body.isLeader, // @ts-ignore
    isTeacher: req.body.isTeacher, // @ts-ignore
    middleName: req.body.middleName, // @ts-ignore
    surname: req.body.surname,
  });
  // @ts-ignore
  return res.status(200).json({
    acessKey,
  });
};
