import { IncomingMessage, ServerResponse } from "http";
import { firestore } from "../../firebase";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
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
  if (!req.body?.name)
    // @ts-ignore
    return res.status(400).send("Bad request!"); // @ts-ignore
  if (
    // @ts-ignore
    !req.body.hexColor || // @ts-ignore
    typeof req.body.hexColor !== "string" || // @ts-ignore
    req.body.hexColor.startsWith("#")
  )
    // @ts-ignore
    return res.status(400).send("Bad request!"); // @ts-ignore
  // @ts-ignore
  if (!account) return res.status(400).send("Bad request!");
  if (!account.isAdmin && !account.isLeader)
    // @ts-ignore
    return res.status(400).send("Bad request!");
  const timestamp = Date.now();

  await firestore
    .collection("matters")
    .doc(String(timestamp))
    .set({
      createdAt: new Date(timestamp),
      createdTimestamp: timestamp, // @ts-ignore
      hexColor: req.body.hexColor,
      id: timestamp, // @ts-ignore
      name: req.body.name,
    });
  // @ts-ignore
  return res.status(200).send("ok");
};
