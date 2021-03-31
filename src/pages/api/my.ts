import { IncomingMessage, ServerResponse } from "http";
import { firestore } from "../../firebase";
import jwt from "jsonwebtoken";

let rateLimitAccumulator: {
  timestamp: number;
  ip: string;
  times: number;
}[] = [];

export default async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== "GET" && req.method !== "PUT" && req.method !== "DELETE")
    // @ts-ignore
    return res.status(404).send("Not found!");

  rateLimitAccumulator = rateLimitAccumulator.filter(
    (x) => Date.now() - x.timestamp <= 1000 * 60
  );
  if (
    rateLimitAccumulator.find(
      (x) =>
        x.ip === req.socket.remoteAddress &&
        x.times > 30 &&
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
  if (req.method === "DELETE") {
    accounts.doc(String(decoded.account)).delete(); //@ts-ignore
    return res.status(200).send("OK");
  }
  const filteredAccounts = await accounts.doc(String(decoded.account)).get();
  const account = filteredAccounts.data();
  // @ts-ignore
  if (!account) return res.status(400).send("Bad request!");
  if (req.method === "GET") {
    account.acessKey = undefined;
    account.createdAt = undefined;
    // @ts-ignore
    return res.status(200).json({
      account,
    });
  } else if (req.method === "PUT") {
    // @ts-ignore
    const attKeys = Object.keys(req.body).filter((key) =>
      ["concludedActivities"].includes(key)
    );
    const attObject = attKeys.reduce((prev, curr) => {
      // @ts-ignore
      prev = { ...prev, [curr]: req.body[curr] };
      return prev;
    }, {});

    accounts.doc(String(decoded.account)).update(attObject);
    // @ts-ignore
    return res.status(200).send("OK");
  }
};
