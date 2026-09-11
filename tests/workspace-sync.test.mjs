import assert from "node:assert/strict";
import test from "node:test";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(
  new URL("../lib/workspace-sync.ts", import.meta.url).pathname,
);
const { mergeWorkspace } = await import(moduleUrl);

test("preserves unrelated remote collections", () => {
  const base = {
    tasks: [{ id: 1, title: "old" }],
    clients: [{ id: 1, name: "A" }],
  };
  const local = { ...base, tasks: [{ id: 1, title: "local" }] };
  const remote = { ...base, clients: [{ id: 1, name: "remote" }] };
  assert.deepEqual(mergeWorkspace(base, local, remote), {
    tasks: [{ id: 1, title: "local" }],
    clients: [{ id: 1, name: "remote" }],
  });
});

test("replays additions, edits and deletions by id", () => {
  const base = {
    tasks: [
      { id: 1, title: "one" },
      { id: 2, title: "two" },
    ],
  };
  const local = {
    tasks: [
      { id: 1, title: "edited" },
      { id: 3, title: "new" },
    ],
  };
  const remote = { tasks: [...base.tasks, { id: 4, title: "remote" }] };
  assert.deepEqual(mergeWorkspace(base, local, remote), {
    tasks: [
      { id: 1, title: "edited" },
      { id: 4, title: "remote" },
      { id: 3, title: "new" },
    ],
  });
});

test("keeps simultaneous attendance records from different employees", () => {
  const base = { attendance: [] };
  const employeeOne = {
    attendance: [
      { id: 101, memberId: 1, date: "۱۴۰۵/۰۶/۲۰", checkIn: "۰۹:۰۰" },
    ],
  };
  const employeeTwoSaved = {
    attendance: [
      { id: 202, memberId: 2, date: "۱۴۰۵/۰۶/۲۰", checkIn: "۰۹:۰۱" },
    ],
  };
  assert.deepEqual(mergeWorkspace(base, employeeOne, employeeTwoSaved), {
    attendance: [
      { id: 202, memberId: 2, date: "۱۴۰۵/۰۶/۲۰", checkIn: "۰۹:۰۱" },
      { id: 101, memberId: 1, date: "۱۴۰۵/۰۶/۲۰", checkIn: "۰۹:۰۰" },
    ],
  });
});
