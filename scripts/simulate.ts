// Scripted conversation test: `npm run simulate`
import { handleMessage } from "../src/lib/bank/dialogue";
import { store } from "../src/lib/bank/data";
const u = store.users[0];
const convo = [
  "hi", "what's my balance", "how much did i spend on swiggy last month", "what about this month?", "spending breakdown",
  "send money to rohan", "3000", "yes", "transfer 40k to mom", "confirm", "OTP", "pay electricity bill", "yes",
  "emi for 20 lakh home loan", "15 years", "what about 20 years?", "am i eligible for a personal loan", "block my card", "credit", "no",
  "send 500 to Karan", "neha", "800", "actually what are fd rates", "atm near me", "branch in bangalore", "i lost my wallet and someone used my card",
  "who won the ipl", "thanks", "debit card", "yes", "bye",
];
let otp = "";
for (let msg of convo) {
  if (msg === "OTP") msg = otp;
  const r = handleMessage(u, "test", msg);
  console.log(`\n> ${msg}\n  [${r.nlu.intent} ${r.nlu.confidence}] ${r.trace.slice(1).join(" | ")}`);
  for (const m of r.messages) { console.log("  Nova:", m.text, m.card ? `<${m.card.kind}>` : ""); if (m.card?.kind === "otp") otp = m.card.demoOtp; }
  console.log("  chips:", r.suggestions.join(" · "), "| state:", JSON.stringify(r.state));
}
