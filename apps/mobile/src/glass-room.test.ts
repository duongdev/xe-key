// A GlassButton's native press grows ~7 pt past its 44 pt box. Content drawn after its header row
// covers that growth (Alerts list cut the ✓ flat), so every file that places one must raise the
// row with `zIndex: 1`, put it in a PageHeader (raised), or float it absolutely (the Host has
// zIndex 1). Scroll views clip too: give them top room (see Home).
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

test("every file placing a GlassButton raises its row", () => {
  const missing = files(__dirname).filter((f) => {
    if (f.endsWith("/ui/glass.tsx")) return false;
    const s = fs.readFileSync(f, "utf8");
    if (!s.includes("<GlassButton")) return false;
    // Every GlassButton in the file floats when its props (the next lines) set position absolute.
    const floated = s
      .split("<GlassButton")
      .slice(1)
      .every((props) => props.slice(0, 300).includes('position: "absolute"'));
    return !s.includes("zIndex: 1") && !s.includes("<PageHeader") && !floated;
  });
  expect(missing).toEqual([]);
});
