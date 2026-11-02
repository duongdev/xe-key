// HANDOFF › Tokens › sep: lists on bg use `sep`, rows inside an s1 card use `s2`; s1 is never a
// divider (light s1 is white on a light grey bg).
declare const __dirname: string;
const fs = jest.requireActual("fs") as {
  readdirSync: (dir: string) => string[];
  statSync: (path: string) => { isDirectory: () => boolean };
  readFileSync: (path: string, enc: "utf8") => string;
};

const files = (dir: string): string[] =>
  fs.readdirSync(dir).flatMap((f) => {
    const p = `${dir}/${f}`;
    return fs.statSync(p).isDirectory() ? files(p) : /\.tsx$/.test(f) ? [p] : [];
  });

test("no divider uses s1", () => {
  const bad = files(__dirname).filter((f) => {
    const s = fs.readFileSync(f, "utf8");
    return (
      /border(Top|Bottom)Color: c\.s1\b/.test(s) || /height: 1,\s*backgroundColor: c\.s1\b/.test(s)
    );
  });
  expect(bad).toEqual([]);
});
