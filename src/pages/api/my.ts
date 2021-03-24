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

  const accounts = firestore.collection("accounts");
  const filteredAccounts = await accounts.doc(String(decoded.account)).get();
  const account = filteredAccounts.data();
  // @ts-ignore
  if (!account) return res.status(400).send("Bad request!");

  account.acessKey = undefined;
  account.createdAt = undefined;
  // @ts-ignore
  return res.status(200).json({
    account,
  });
};
