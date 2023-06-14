import utils from "~/common/lib/utils";
import { Message, Sender } from "~/types";

import keysend from "../ln/keysend";
// TODO: move checkAllowance to some helpers/models?
import { checkAllowance } from "./sendPaymentOrPrompt";

const keysendOrPrompt = async (message: Message, sender: Sender) => {
  let host;
  if (sender.origin) host = new URL(sender.origin).host;
  else if (sender.url) host = new URL(sender.url).host;
  else return;

  const destination = message.args.destination;
  const amount = message.args.amount;
  if (
    typeof destination !== "string" ||
    (typeof amount !== "string" && typeof amount !== "number")
  ) {
    return {
      error: "Destination or amount missing.",
    };
  }
  if (await checkAllowance(host, parseInt(amount as string))) {
    return keysendWithAllowance(message);
  } else {
    return keysendWithPrompt(message);
  }
};

async function keysendWithAllowance(message: Message) {
  try {
    const response = await keysend(message);
    return response;
  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
      return { error: e.message };
    }
  }
}

async function keysendWithPrompt(message: Message) {
  try {
    const response = await utils.openPrompt({
      ...message,
      action: "confirmKeysend",
    });
    return response;
  } catch (e) {
    console.error("Payment cancelled", e);
    if (e instanceof Error) {
      return { error: e.message };
    }
  }
}

export default keysendOrPrompt;
