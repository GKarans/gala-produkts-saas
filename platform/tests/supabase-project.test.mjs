import test from "node:test";
import assert from "node:assert/strict";
import {assertSupabaseProjectMatch} from "../shared/supabase-project.js";

const projectRef = "cpweowosocjuccjsyyic";
const authUrl = `https://${projectRef}.supabase.co`;

test("Supabase Auth and Hyperdrive project references must match", () => {
  assert.doesNotThrow(() => assertSupabaseProjectMatch(authUrl, projectRef));
  assert.throws(() => assertSupabaseProjectMatch(authUrl, "mkycfegxlzidaezljutq"), /do not match/);
  assert.throws(() => assertSupabaseProjectMatch(authUrl, "invalid/ref"), /configuration is invalid/);
  assert.throws(() => assertSupabaseProjectMatch("http://example.com", projectRef), /configuration is invalid/);
});
