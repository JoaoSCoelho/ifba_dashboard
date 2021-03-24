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

  if (!req.body || !req.body.acessKey || typeof req.body.acessKey !== "string")
    return res.status(400).send("Bad request!");

  const accounts = firestore.collection("accounts");
  const filteredAccounts = await accounts
    .where("acessKey", "==", req.body.acessKey)
    .get();
  const account = filteredAccounts.docs[0]?.data();

  if (!account) return res.status(400).send("Bad request!");

  account.acessKey = undefined;
  account.createdAt = undefined;

  return res.status(200).json({
    account,
    // @ts-ignore
    token: jwt.sign({ account: account.id }, process.env.SECRET, {
      // @ts-ignore
      expiresIn: `${process.env.TOKEN_EXPIRES_TIME}h`,
    }),
  });
};
