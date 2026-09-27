// ─────────────────────────────────────────────────────────────
// Nova NLU · public API
//   const nlu = createNLU(modelJson)
//   nlu.parse("send 2k to rohan", { payees }) →
//     { intent, confidence, ranking, entities, normalized, latencyMs }
// ─────────────────────────────────────────────────────────────
import { loadModel } from "./classifier.mjs";
import { extractEntities } from "./entities.mjs";
import { normalize } from "./text.mjs";

export const OOS_THRESHOLD = 0.4;

export function createNLU(modelJson) {
  const model = loadModel(modelJson);
  return {
    classes: model.classes,
    /**
     * @param {string} text
     * @param {{ payees?: Array<string | { name: string, aliases: string[] }> }} [ctx]
     */
    parse(text, ctx = {}) {
      const t0 = performance.now();
      const ranking = model.predict(text);
      let { intent, confidence } = ranking[0];
      const fallback = confidence < OOS_THRESHOLD;
      if (fallback) intent = "out_of_scope";
      const entities = extractEntities(text, ctx);
      return {
        text,
        normalized: normalize(text),
        intent,
        confidence: +confidence.toFixed(4),
        fallback,
        ranking: ranking.slice(0, 3).map((r) => ({ intent: r.intent, confidence: +r.confidence.toFixed(4) })),
        entities,
        latencyMs: +(performance.now() - t0).toFixed(2),
      };
    },
  };
}
