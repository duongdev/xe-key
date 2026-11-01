// HANDOFF › Haptics rule 6: shared components own haptics. A screen may call one only for a
// flow no component covers, with a `haptics:` comment on the line or the two lines above.
// The app tsconfig has no Node types, so the fs calls are typed by hand.
declare const __dirname: string;
const fs = jest.requireActual("fs") as {
  readdirSync: (dir: string) => string[];
  statSync: (path: string) => { isDirectory: () => boolean };
  readFileSync: (path: string, enc: "utf8") => string;
};

const files = (dir: string): string[] =>
  fs.readdirSync(dir).flatMap((f) => {
    const p = `${dir}/${f}`;
    return fs.statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) ? [p] : [];
  });

test("screens call haptics only with a haptics: comment", () => {
  const bare: string[] = [];
  for (const file of files(`${__dirname}/app`)) {
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (!/\bhaptics\.\w+\(/.test(line)) return;
      if (!lines.slice(Math.max(0, i - 2), i + 1).some((l) => l.includes("haptics:")))
        bare.push(`${file}:${i + 1}`);
    });
  }
  expect(bare).toEqual([]);
});
