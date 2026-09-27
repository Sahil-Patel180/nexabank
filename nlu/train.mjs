// Usage: node nlu/train.mjs [--quiet]
// Generates the corpus, trains the classifier, evaluates on the hold-out
// set and writes nlu/model/model.json + nlu/model/metrics.json.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generate } from "./data/intents.mjs";
import { train, loadModel, mulberry32 } from "./classifier.mjs";
import { evaluate } from "./evaluate.mjs";

const quiet = process.argv.includes("--quiet");
const log = quiet ? () => {} : console.log;
const here = dirname(fileURLToPath(import.meta.url));
const t0 = Date.now();

const data = generate(mulberry32(7));
log(`corpus: ${data.length} utterances across ${new Set(data.map((d) => d.intent)).size} intents`);
const model = train(data, { log });
const m = loadModel(model);
const metrics = evaluate(m, { verbose: !quiet });
metrics.trainSize = data.length;
metrics.features = model.idf.length;
metrics.trainedAt = new Date().toISOString();
metrics.trainMs = Date.now() - t0;

mkdirSync(join(here, "model"), { recursive: true });
writeFileSync(join(here, "model", "model.json"), JSON.stringify(model));
writeFileSync(join(here, "model", "metrics.json"), JSON.stringify(metrics, null, 2));
console.log(`[nova-nlu] trained ${model.classes.length} intents · ${model.idf.length} features · hold-out acc ${(metrics.accuracy * 100).toFixed(1)}% · macro-F1 ${(metrics.macroF1 * 100).toFixed(1)}% · ${metrics.trainMs} ms`);
