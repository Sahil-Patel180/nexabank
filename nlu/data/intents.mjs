// ─────────────────────────────────────────────────────────────
// Nova NLU · training corpus (template grammar)
// Each intent = templates with {slot} placeholders. The generator
// expands them with slot values, adds politeness wrappers and
// synthetic typos, then de-duplicates. The *test* set lives in
// test.mjs and is hand-written separately, so evaluation measures
// generalisation, not template memorisation.
// ─────────────────────────────────────────────────────────────

export const SLOTS = {
  amount: ["500", "1000", "2,500", "5000", "₹10,000", "rs 750", "15k", "20000 rupees", "1.5 lakh", "₹ 3,200", "INR 45000", "300 rs", "60,000", "2 lakh"],
  payee: ["Rohan", "Rohan Mehta", "Neha", "Neha Kapoor", "mom", "dad", "my landlord", "Suresh", "Priya", "Arjun", "my brother", "Kavya"],
  account: ["savings", "savings account", "current account", "salary account", "my account", "main account"],
  period: ["last month", "this month", "last week", "yesterday", "today", "last 30 days", "in august", "this year", "last 3 months", "since monday"],
  category: ["food", "groceries", "shopping", "travel", "fuel", "entertainment", "Swiggy", "Zomato", "Amazon", "Uber", "bills", "dining out", "Flipkart", "movies"],
  bill: ["electricity bill", "mobile bill", "broadband bill", "DTH recharge", "gas bill", "water bill", "postpaid bill", "credit card bill", "wifi bill"],
  card: ["debit card", "credit card", "card", "ATM card", "visa card"],
  loan: ["home loan", "car loan", "personal loan", "education loan", "two wheeler loan", "loan"],
  tenure: ["5 years", "10 years", "20 years", "36 months", "3 years", "15 years", "24 months"],
  city: ["Mumbai", "Delhi", "Bengaluru", "Chennai", "Hyderabad", "Pune", "Kolkata", "Andheri", "Koramangala", "T Nagar"],
  product: ["FD", "fixed deposit", "RD", "recurring deposit", "savings account", "home loan", "personal loan", "car loan"],
};

export const INTENTS = {
  greet: [
    "hi", "hello", "hey", "hey there", "good morning", "good afternoon", "good evening", "hi nova", "hello nova",
    "namaste", "hey nova how are you", "hiya", "yo", "hello there", "hi there, anyone here", "greetings", "morning",
  ],
  goodbye: [
    "bye", "goodbye", "see you", "see you later", "that is all", "that's all for now", "bye nova", "talk later",
    "i am done", "nothing else, bye", "catch you later", "logging off", "ok bye", "good night", "have a good day",
  ],
  thanks: [
    "thanks", "thank you", "thanks a lot", "thank you so much", "great thanks", "cool thanks", "appreciate it",
    "that was helpful", "thanks nova", "awesome thank you", "perfect, thanks", "much appreciated", "thx", "ty",
  ],
  affirm: [
    "yes", "yeah", "yep", "sure", "confirm", "yes confirm", "go ahead", "do it", "ok", "okay", "correct",
    "that is right", "yes please", "proceed", "absolutely", "sounds good", "yes send it", "haan", "right", "affirmative",
  ],
  deny: [
    "no", "nope", "nah", "not now", "no thanks", "wrong", "that is not right", "incorrect", "negative",
    "no don't", "not really", "nahi", "no that is wrong", "i do not think so",
  ],
  cancel: [
    "cancel", "cancel it", "stop", "abort", "forget it", "never mind", "cancel the transfer", "stop this",
    "cancel this transaction", "leave it", "don't send", "undo that", "start over", "reset",
  ],
  bot_capabilities: [
    "what can you do", "help", "what are your features", "how can you help me", "what do you do", "show me options",
    "what services do you offer", "who are you", "what can i ask you", "menu", "list your capabilities",
    "are you a bot", "how does this work", "what are you",
  ],
  check_balance: [
    "what is my balance", "check balance", "show my {account} balance", "how much money do i have",
    "balance in my {account}", "what is the balance of my {account}", "tell me my account balance",
    "how much is left in my {account}", "available balance", "check my {account} balance please",
    "do i have enough money", "current balance", "how much money is there in my account", "balance enquiry",
    "can you show me my balance", "whats left in my account", "account balance", "my balance please",
    "how much do i have in {account}",
  ],
  mini_statement: [
    "show my recent transactions", "mini statement", "last 5 transactions", "show transactions from {period}",
    "transaction history", "what did i spend {period}", "show me my statement", "list my recent payments",
    "recent debits and credits", "get my account statement for {period}", "show last transactions",
    "what are my latest transactions", "show {period} transactions", "passbook entries", "last few transactions on my {account}",
    "download statement", "show credits {period}",
  ],
  spending_analysis: [
    "how much did i spend on {category}", "how much have i spent on {category} {period}",
    "my {category} spending {period}", "spending on {category}", "total spent on {category} {period}",
    "what did i spend the most on", "where is my money going", "analyse my spending {period}",
    "breakdown of my expenses {period}", "spending summary", "how much money went to {category}",
    "expense analysis {period}", "category wise spending", "show my spending insights", "how much did i spend {period}",
    "top spending categories", "how much on {category}",
  ],
  transfer_money: [
    "transfer {amount} to {payee}", "send {amount} to {payee}", "pay {payee} {amount}", "send money to {payee}",
    "i want to transfer money", "transfer money", "make a transfer", "send {amount}", "move {amount} to {payee}",
    "transfer {amount} from my {account} to {payee}", "can you send {payee} {amount}", "fund transfer",
    "neft {amount} to {payee}", "imps {amount} to {payee}", "upi {amount} to {payee}", "i need to pay {payee}",
    "transfer funds to {payee}", "send some money to {payee}", "wire {amount} to {payee}", "please transfer {amount}",
  ],
  pay_bill: [
    "pay my {bill}", "pay {bill}", "i want to pay the {bill}", "pay {bill} of {amount}", "recharge my mobile",
    "bill payment", "pay utility bills", "clear my {bill}", "settle {bill}", "can you pay my {bill} now",
    "make a bill payment", "my {bill} is due, pay it", "pay {amount} towards {bill}", "pay bills",
  ],
  block_card: [
    "block my {card}", "i lost my {card}", "my {card} is stolen", "freeze my {card}", "block card",
    "please block my {card} immediately", "someone stole my wallet", "disable my {card}", "hotlist my {card}",
    "deactivate {card}", "lost card", "i can not find my {card}", "temporarily lock my {card}", "stop my {card}",
  ],
  card_info: [
    "show my cards", "what is my credit card limit", "credit card due date", "card details",
    "how much is my {card} bill", "available limit on {card}", "when is my credit card payment due",
    "list my cards", "{card} status", "what is my card limit", "credit card outstanding", "is my {card} active",
    "increase my {card} limit", "minimum amount due",
  ],
  loan_emi_calc: [
    "calculate emi for {amount} {loan} for {tenure}", "emi for {amount} for {tenure}", "what would be my emi",
    "emi calculator", "calculate {loan} emi", "monthly installment for {amount} {loan}",
    "if i take {amount} {loan} for {tenure} what is the emi", "how much emi for {amount}",
    "compute emi {amount} {tenure}", "emi on {loan} of {amount}", "calculate monthly payment for {loan}",
  ],
  loan_eligibility: [
    "am i eligible for a {loan}", "check {loan} eligibility", "how much {loan} can i get", "loan eligibility",
    "can i get a {loan}", "what is my {loan} eligibility", "i want to apply for a {loan}", "apply for {loan}",
    "pre approved loan offers", "do i qualify for a {loan}", "how much can i borrow", "maximum loan amount for me",
  ],
  loan_status: [
    "my loan details", "outstanding on my {loan}", "how much is left on my {loan}", "loan status",
    "when is my next emi", "show my loans", "remaining {loan} amount", "{loan} balance", "how many emis are left",
    "next emi date", "loan account summary", "pending loan amount",
  ],
  interest_rates: [
    "what are the {product} rates", "{product} interest rate", "current interest rates", "interest rate on {product}",
    "what interest do you give on {product}", "rates for {product} for {tenure}", "best fd rates",
    "savings account interest", "tell me interest rates", "what is the rate of interest for {product}",
    "home loan rate of interest", "senior citizen fd rates",
  ],
  kyc_documents: [
    "what documents are needed for kyc", "kyc requirements", "update my kyc", "documents required to open account",
    "how to do kyc", "is aadhaar enough for kyc", "re kyc process", "what id proof is accepted",
    "kyc pending", "complete my kyc", "documents for {loan}", "address proof documents",
  ],
  open_account: [
    "open a new account", "i want to open a {account}", "how to open {product}", "open {product}",
    "create a new savings account", "start a fixed deposit", "book an fd", "open an rd", "new account opening",
    "i want to invest in {product}", "open a zero balance account", "open current account for business",
  ],
  find_branch: [
    "nearest branch", "find a branch in {city}", "branch near me", "where is your branch in {city}",
    "branch timings", "branches in {city}", "locate branch {city}", "which branch is closest",
    "branch address in {city}", "is the {city} branch open on saturday", "ifsc code of {city} branch", "home branch details",
  ],
  find_atm: [
    "nearest atm", "atm near me", "find atm in {city}", "where can i withdraw cash", "atm locations in {city}",
    "cash deposit machine near me", "atm in {city}", "closest atm", "show atms", "any atm around {city}",
  ],
  human_agent: [
    "talk to a human", "connect me to an agent", "i want to speak to customer care", "customer support",
    "real person please", "call me back", "speak to a representative", "human agent", "escalate this",
    "i need to talk to someone", "customer care number", "raise a complaint", "this is not helping, get me a person",
  ],
  report_fraud: [
    "i got a fraud call", "unauthorised transaction on my account", "someone debited money without my permission",
    "i did not make this transaction", "report fraud", "suspicious transaction", "i was scammed",
    "i shared my otp by mistake", "money deducted fraudulently", "phishing message received",
    "my account is hacked", "dispute a transaction",
  ],
  out_of_scope: [
    "what is the weather today", "tell me a joke", "who won the cricket match", "book a movie ticket",
    "what is the capital of france", "play some music", "order pizza", "how old are you", "write a poem",
    "what is bitcoin price", "recommend a good movie", "translate this to hindi", "set an alarm",
    "who is the prime minister", "how to cook biryani", "what is 2 plus 2", "give me stock tips",
    "sing a song", "what is love", "book a cab", "do you like cricket", "news headlines", "help me with homework",
  ],
};

const PREFIXES = ["", "", "", "", "please ", "can you ", "hey nova ", "nova ", "i want to ", "could you please ", "quickly ", "hi, "];
const SUFFIXES = ["", "", "", "", " please", " now", " asap", " for me", "?", " thanks"];
// wrappers only make sense for task-like intents
const NO_WRAP = new Set(["greet", "goodbye", "thanks", "affirm", "deny", "cancel"]);

function typo(s, rand) {
  const words = s.split(" ");
  const i = Math.floor(rand() * words.length);
  const w = words[i];
  if (w.length < 5 || w.includes("{")) return s;
  const j = 1 + Math.floor(rand() * (w.length - 2));
  const r = rand();
  words[i] = r < 0.34 ? w.slice(0, j) + w.slice(j + 1) // drop
    : r < 0.67 ? w.slice(0, j) + w[j + 1] + w[j] + w.slice(j + 2) // swap
      : w.slice(0, j) + w[j] + w.slice(j); // double
  return words.join(" ");
}

/** Expand grammar → [{text, intent}] */
export function generate(rand, perIntent = 140) {
  const out = [];
  for (const [intent, templates] of Object.entries(INTENTS)) {
    const seen = new Set();
    // every raw template at least once
    const pool = [...templates];
    let guard = 0;
    while (seen.size < perIntent && guard++ < perIntent * 20) {
      const tpl = pool.length ? pool.shift() : templates[Math.floor(rand() * templates.length)];
      let s = tpl.replace(/\{(\w+)\}/g, (_, k) => SLOTS[k][Math.floor(rand() * SLOTS[k].length)]);
      if (!NO_WRAP.has(intent) && intent !== "out_of_scope") {
        s = PREFIXES[Math.floor(rand() * PREFIXES.length)] + s + SUFFIXES[Math.floor(rand() * SUFFIXES.length)];
      }
      if (rand() < 0.12) s = typo(s, rand);
      s = s.toLowerCase().trim();
      if (!seen.has(s)) { seen.add(s); out.push({ text: s, intent }); }
      if (templates.length < 20 && NO_WRAP.has(intent) && seen.size >= templates.length * 2) break;
    }
  }
  return out;
}
