const pptxgen = require("pptxgenjs");
const React = require("react");
const RDS = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const { applyTheme } = require("/mnt/skills/public/pptx/scripts/apply_theme.js");
const path = require("path");
const IMG = (f) => path.join(__dirname, "img", f);

const THEME = {
  name: "HSC Nilai",
  headFontFace: "Calibri",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1E2A3A", lt1: "FFFFFF", dk2: "1F497D", lt2: "EEF4FA",
    accent1: "0E7C7B", accent2: "E87722", accent3: "1F497D", accent4: "7A3E9D",
    accent5: "2E8B57", accent6: "C0392B", hlink: "0E7C7B", folHlink: "7A3E9D",
  },
};
// hex copies for hex-only options
const H = { navy: "1F497D", deep: "17375E", teal: "0E7C7B", orange: "E87722", ink: "1E2A3A", muted: "556273", tint: "EEF4FA", tealTint: "E5F3F2", orTint: "FDEFE3", line: "D5DEE8", white: "FFFFFF", green: "2E8B57", red: "C0392B", amber: "D68910" };

async function icon(Comp, color, size = 256) {
  const svg = RDS.renderToStaticMarkup(React.createElement(Comp, { color: "#" + color, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 matches the 960x540pt template
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  pres.title = "NILAI – Hack for Social Cause";
  pres.author = "Team Nilai";
  const C = pres.SchemeColor;

  const footer = [
    { image: { x: 11.25, y: 0.12, w: 1.85, h: 0.92, path: IMG("hsc_logo.png") } },
    { text: { text: "@HSC submission- Template", options: { x: 4.4, y: 7.08, w: 4.5, h: 0.3, fontSize: 10, color: H.deep, align: "center", margin: 0 } } },
  ];
  const titlePh = { placeholder: { options: { name: "title", type: "title", x: 2.2, y: 0.28, w: 8.9, h: 0.7, fontSize: 28, bold: true, color: C.text2, align: "center", valign: "middle", fontFace: "Calibri" }, text: "" } };
  pres.defineSlideMaster({
    title: "HSC_COVER", background: { color: H.white },
    objects: [...footer, titlePh],
    slideNumber: { x: 12.45, y: 7.05, w: 0.5, h: 0.3, fontSize: 10, color: "7F7F7F" },
  });
  pres.defineSlideMaster({
    title: "HSC_CONTENT", background: { color: H.white },
    objects: [
      ...footer,
      titlePh,
    ],
    slideNumber: { x: 12.45, y: 7.05, w: 0.5, h: 0.3, fontSize: 10, color: "7F7F7F" },
  });

  // helpers
  const addSlideC = () => {
    const s = pres.addSlide({ masterName: "HSC_CONTENT" });
    s.addShape(pres.shapes.OVAL, { x: 0.35, y: 0.2, w: 1.45, h: 0.78, fill: { color: "FAD3B4" }, line: { color: "E89A62", width: 1 }, objectName: "TeamNameOval" });
    s.addText("Nilai", { x: 0.35, y: 0.2, w: 1.45, h: 0.78, fontSize: 15, bold: true, color: "000000", align: "center", valign: "middle", margin: 0, isTextBox: true });
    return s;
  };
  const label = (s, t, x, y, w, color = H.orange) =>
    s.addText(t.toUpperCase(), { x, y, w, h: 0.28, fontSize: 11, bold: true, color, charSpacing: 1.5, margin: 0, isTextBox: true });
  const card = (s, x, y, w, h, fill = H.tint, name) =>
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { color: fill, width: 0 }, objectName: name });
  const circleIcon = async (s, Comp, x, y, d, bg, fg = H.white) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: bg }, line: { color: bg, width: 0 } });
    const p = d * 0.26;
    s.addImage({ data: await icon(Comp, fg), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p });
  };
  const bullets = (items, opts = {}) => items.map((t, i) => {
    const runs = Array.isArray(t) ? t : [{ text: t }];
    return runs.map((r, j) => ({
      text: r.text,
      options: { ...(j === 0 ? { bullet: { indent: 14 } } : {}), bold: !!r.bold, color: r.color || opts.color || H.ink, fontSize: opts.fontSize || 12.5, ...(j === runs.length - 1 && i < items.length - 1 ? { breakLine: true } : {}), paraSpaceAfter: opts.space ?? 5 },
    }));
  }).flat();

  // ───────────────────────── 1. COVER ─────────────────────────
  {
    const s = pres.addSlide({ masterName: "HSC_COVER" });
    s.addText("Cover Page", { placeholder: "title" });
    s.addText([
      { text: "NILAI", options: { fontSize: 48, bold: true, color: H.teal, charSpacing: 4 } },
      { text: "   நிலை · steadiness", options: { fontSize: 16, color: H.muted, italic: true } },
    ], { x: 0.6, y: 1.1, w: 6.3, h: 0.85, margin: 0, valign: "middle", isTextBox: true });
    s.addText("Senses tremor, separates it from intended movement, suppresses it on demand – and trains steadiness back.",
      { x: 0.6, y: 1.95, w: 6.2, h: 0.6, fontSize: 13.5, color: H.ink, margin: 0, isTextBox: true });

    const rows = [
      ["Problem Statement / Concept Title", "NILAI – a non-invasive AI wearable for real-time hand-tremor detection, on-demand suppression and personalised steadiness training", 1.05],
      ["Theme", "Assistive Technology & Accessibility  (also: Healthcare · Elderly Care)", 0.72],
      ["Team Name (Registered on portal)", "Nilai", 0.62],
      ["Team ID (Registered on portal)", "HSC|TN|00325", 0.62],
      ["State/UT", "Tamil Nadu  ·  Sri Sairam Engineering College, Chennai", 0.62],
    ];
    let y = 2.7;
    for (const [k, v, h] of rows) {
      s.addShape(pres.shapes.OVAL, { x: 0.62, y: y + 0.1, w: 0.1, h: 0.1, fill: { color: H.navy }, line: { color: H.navy, width: 0 } });
      s.addText(k, { x: 0.85, y, w: 6.0, h: 0.3, fontSize: 13, bold: true, color: H.navy, margin: 0, isTextBox: true });
      s.addText(v, { x: 0.85, y: y + 0.3, w: 6.0, h: h - 0.3, fontSize: 14, color: H.ink, margin: 0, valign: "top", isTextBox: true });
      y += h + 0.08;
    }
    s.addImage({ path: IMG("image12.jpg"), x: 7.25, y: 1.25, w: 5.6, h: 4.45, sizing: { type: "cover", w: 5.6, h: 4.45 }, rounding: false, objectName: "Hero" });
    const chips = ["Real-time tremor detection", "On-demand suppression", "No surgery · No drugs"];
    const cw = (5.6 - 0.2) / 3;
    chips.forEach((c, i) => {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.25 + i * (cw + 0.1), y: 5.9, w: cw, h: 0.55, rectRadius: 0.1, fill: { color: i === 2 ? H.orTint : H.tealTint }, line: { color: i === 2 ? H.orTint : H.tealTint, width: 0 } });
      s.addText(c, { x: 7.25 + i * (cw + 0.1), y: 5.9, w: cw, h: 0.55, fontSize: 12, bold: true, color: i === 2 ? "B35A12" : H.teal, align: "center", valign: "middle", margin: 0, isTextBox: true });
    });
  }

  // ───────────────────── 2. PROBLEM – SOLUTION ─────────────────────
  {
    const s = addSlideC();
    s.addText("Problem – Proposed Solution", { placeholder: "title" });
    // problem card
    card(s, 0.5, 1.2, 4.05, 5.7, H.tint, "ProblemCard");
    label(s, "Core problem", 0.75, 1.38, 3.6);
    s.addText("Tremor takes away the steady hand – and the activity that helps", { x: 0.75, y: 1.68, w: 3.6, h: 0.75, fontSize: 16, bold: true, color: H.navy, margin: 0, isTextBox: true });
    const stats = [["~100 M", "people worldwide live with essential tremor (1.3%) [1]"], ["5.8 %", "of adults over 65 are affected – it rises with age [1]"], ["~4.6 M", "estimated in India; eating, writing, holding become hard"]];
    let sy = 2.55;
    for (const [n, t] of stats) {
      s.addText(n, { x: 0.75, y: sy, w: 1.45, h: 0.6, fontSize: 24, bold: true, color: H.teal, margin: 0, valign: "middle", isTextBox: true });
      s.addText(t, { x: 2.2, y: sy, w: 2.2, h: 0.6, fontSize: 11, color: H.ink, margin: 0, valign: "middle", isTextBox: true });
      sy += 0.72;
    }
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.75, y: 4.75, w: 3.6, h: 0.85, rectRadius: 0.1, fill: { color: H.white }, line: { color: H.line, width: 0.75 } });
    s.addText([
      { text: "The vicious loop  ", options: { bold: true, color: H.orange, breakLine: true } },
      { text: "Tremor → stop exercise → weaker control → worse tremor [2][3]", options: { color: H.ink } },
    ], { x: 0.9, y: 4.75, w: 3.35, h: 0.85, fontSize: 11.5, margin: 0, valign: "middle", isTextBox: true });
    s.addText([
      { text: "Today's options: ", options: { bold: true, color: H.navy } },
      { text: "pills that help only some, or brain surgery (DBS) costing lakhs. Severity is judged once in a while with a pen-and-spiral test – nothing at home.", options: { color: H.ink } },
    ], { x: 0.75, y: 5.72, w: 3.6, h: 1.05, fontSize: 11.5, margin: 0, valign: "top", isTextBox: true });

    // solution statement
    const RX = 4.85, RW = 8.0;
    label(s, "Proposed solution", RX, 1.2, RW, H.teal);
    s.addText([
      { text: "NILAI ", options: { bold: true, color: H.teal } },
      { text: "is a washable forearm sleeve with a snap-in sensor pod. It reads muscle (EMG) and motion signals, separates tremor from intended movement with on-device AI, cancels it on demand with a gentle counter-pulse, and coaches steadiness through an app.", options: { color: H.ink } },
    ], { x: RX, y: 1.5, w: RW, h: 0.8, fontSize: 13, margin: 0, valign: "top", isTextBox: true });

    label(s, "Detailed explanation – how it works", RX, 2.45, RW);
    const steps = [
      [fa.FaWaveSquare, "Sense", "3-ch dry EMG + 6-axis IMU + heart-rate on the forearm"],
      [fa.FaBrain, "Distinguish", "On-device AI isolates the 4–12 Hz tremor from voluntary motion"],
      [fa.FaBolt, "Suppress", "Timed counter-pulse (EMS) damps the tremor – only when the user asks"],
      [fa.FaChartLine, "Train", "Personalised exercises + daily tremor score for long-term control"],
    ];
    const sw = (RW - 3 * 0.2) / 4;
    for (let i = 0; i < 4; i++) {
      const x = RX + i * (sw + 0.2);
      card(s, x, 2.78, sw, 1.62, i === 2 ? H.orTint : H.tealTint, "Step" + (i + 1));
      await circleIcon(s, steps[i][0], x + 0.15, 2.92, 0.5, i === 2 ? H.orange : H.teal);
      s.addText(steps[i][1], { x: x + 0.72, y: 2.92, w: sw - 0.8, h: 0.5, fontSize: 15, bold: true, color: i === 2 ? "B35A12" : H.teal, margin: 0, valign: "middle", isTextBox: true });
      s.addText(steps[i][2], { x: x + 0.15, y: 3.5, w: sw - 0.3, h: 0.82, fontSize: 11.5, color: H.ink, margin: 0, valign: "top", isTextBox: true });
    }
    const half = (RW - 0.25) / 2;
    card(s, RX, 4.6, half, 2.3, H.tint, "Addresses");
    label(s, "How it addresses the problem", RX + 0.2, 4.72, half - 0.3, H.navy);
    s.addText(bullets([
      "Steady hands for eating, writing, dressing – on demand",
      "Makes exercise possible again → breaks the loop",
      "Daily objective tremor score instead of a rare spiral test",
      "Caregivers & doctors track progress remotely",
    ], { fontSize: 12.5, space: 6 }), { x: RX + 0.2, y: 5.05, w: half - 0.35, h: 1.75, margin: 0, valign: "top", isTextBox: true });
    card(s, RX + half + 0.25, 4.6, half, 2.3, H.tint, "Innovation");
    label(s, "Innovation & uniqueness", RX + half + 0.45, 4.72, half - 0.3, H.navy);
    s.addText(bullets([
      "Reads the cause (muscle EMG), not just the visible shake",
      "Tremor-vs-intent AI cross-checks EMG with motion – ignores vehicle/tool vibration",
      "One closed loop: detect → suppress → train",
      "Non-invasive, affordable, built in India",
    ], { fontSize: 12.5, space: 6 }), { x: RX + half + 0.45, y: 5.05, w: half - 0.35, h: 1.75, margin: 0, valign: "top", isTextBox: true });
  }

  // ───────────────────── 3. TECHNICAL APPROACH ─────────────────────
  {
    const s = addSlideC();
    s.addText("Technical Approach", { placeholder: "title" });
    const LX = 0.5, LW = 4.3;
    label(s, "Technologies to be used", LX, 1.2, LW);
    const groups = [
      [fa.FaMicrochip, "Hardware", "ESP32-C6 (BLE + Wi-Fi 6) · MPU6050 6-axis IMU · 3-ch dry EMG · MAX30102 heart-rate · biphasic EMS driver · Li-Po"],
      [fa.FaBrain, "AI & signal processing", "Python · NumPy/SciPy (band-pass, Welch PSD) · scikit-learn classifier · WFLC adaptive filter · MediaPipe/OpenCV · C++ firmware"],
      [fa.FaMobileAlt, "App & backend", "React Native app · Flask live dashboard · FastAPI + PostgreSQL · BLE streaming"],
    ];
    let gy = 1.52;
    for (const [ic, t, d] of groups) {
      card(s, LX, gy, LW, 1.0, H.tint);
      await circleIcon(s, ic, LX + 0.12, gy + 0.12, 0.42, H.navy);
      s.addText(t, { x: LX + 0.65, y: gy + 0.1, w: LW - 0.8, h: 0.42, fontSize: 12.5, bold: true, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
      s.addText(d, { x: LX + 0.15, y: gy + 0.52, w: LW - 0.3, h: 0.45, fontSize: 10, color: H.ink, margin: 0, valign: "top", isTextBox: true });
      gy += 1.1;
    }
    // links + AI tools
    const info = [
      [fa.FaGithub, "Github link", "github.com/<your-repo>  ← add link", true],
      [fa.FaPlayCircle, "Demo video", "<YouTube / Drive link>  ← add link", true],
      [fa.FaRobot, "Extent of usage of AI tools", "Gen-AI assistants used only for code help, literature search & slide drafting. Signal pipeline, classifier and hardware designed, trained & tested by the team.", false],
    ];
    let iy = 4.8;
    for (const [ic, t, d, ph] of info) {
      const h = ph ? 0.5 : 1.0;
      s.addImage({ data: await icon(ic, H.teal), x: LX, y: iy + 0.04, w: 0.3, h: 0.3 });
      s.addText(t, { x: LX + 0.42, y: iy, w: LW - 0.42, h: 0.38, fontSize: 12, bold: true, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
      s.addText(d, { x: LX + 0.42, y: iy + 0.3, w: LW - 0.42, h: h - 0.2, fontSize: 10.5, color: ph ? H.orange : H.ink, italic: ph, margin: 0, valign: "top", isTextBox: true });
      iy += h + 0.1;
    }

    // methodology flow
    const RX = 5.1, RW = 7.73;
    label(s, "Methodology & process – data flow", RX, 1.2, RW);
    const flow = [
      ["Acquire", "EMG + IMU + PPG on the forearm"],
      ["Pre-process", "Filter 3.5–12 Hz, PSD band-power, RMS"],
      ["Classify", "Tremor vs voluntary – EMG–gyro coherence"],
      ["Act", "EMS anti-phase pulse, user-triggered"],
      ["Learn", "App: tremor score + training plan"],
    ];
    const fw = (RW - 4 * 0.28) / 5;
    flow.forEach(([t, d], i) => {
      const x = RX + i * (fw + 0.28);
      const hi = i === 2;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.52, w: fw, h: 1.18, rectRadius: 0.1, fill: { color: hi ? H.teal : H.tealTint }, line: { color: H.teal, width: 1 } });
      s.addText(t, { x: x + 0.08, y: 1.58, w: fw - 0.16, h: 0.36, fontSize: 12.5, bold: true, color: hi ? H.white : H.teal, align: "center", margin: 0, valign: "middle", isTextBox: true });
      s.addText(d, { x: x + 0.08, y: 1.94, w: fw - 0.16, h: 0.72, fontSize: 9.5, color: hi ? H.white : H.ink, align: "center", margin: 0, valign: "top", isTextBox: true });
      if (i < 4) s.addShape(pres.shapes.RIGHT_TRIANGLE ? pres.shapes.ISOSCELES_TRIANGLE : pres.shapes.ISOSCELES_TRIANGLE, { x: x + fw + 0.07, y: 2.0, w: 0.16, h: 0.22, rotate: 90, fill: { color: H.orange }, line: { color: H.orange, width: 0 } });
    });

    label(s, "Working prototype", RX, 2.88, RW);
    const ph = 1.42;
    const ims = [["image22.jpg", 1947 / 808, "Sensor pod: ESP32-C6, IMU, EMG, Li-Po"], ["image26.jpg", 287 / 214, "Live EMG waveform"], ["image27.jpg", 347 / 229, "Tremor-analysis dashboard"]];
    const totalW = ims.reduce((a, [, r]) => a + r * ph, 0);
    const gap = (RW - totalW) / 2;
    let ix = RX;
    for (const [f, r, cap] of ims) {
      const w = r * ph;
      s.addImage({ path: IMG(f), x: ix, y: 3.18, w, h: ph });
      s.addText(cap, { x: ix, y: 3.18 + ph + 0.03, w, h: 0.28, fontSize: 9.5, color: H.muted, italic: true, margin: 0, isTextBox: true });
      ix += w + gap;
    }
    label(s, "Build progress", RX, 5.0, RW);
    const stg = [["STAGE 1 · DONE", "Depth-camera + gyro tremor classifier", H.green], ["STAGE 2 · DONE", "Signal-analysis dashboard (tremor vs intent)", H.green], ["STAGE 3 · NOW", "Forearm EMG band with live waveform", H.orange], ["STAGE 4 · NEXT", "EMS suppression in the wearable pod + app", H.muted]];
    const stw = (RW - 3 * 0.2) / 4;
    stg.forEach(([t, d, col], i) => {
      const x = RX + i * (stw + 0.2);
      card(s, x, 5.3, stw, 1.55, H.tint);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.12, y: 5.42, w: stw - 0.24, h: 0.34, rectRadius: 0.08, fill: { color: col }, line: { color: col, width: 0 } });
      s.addText(t, { x: x + 0.12, y: 5.42, w: stw - 0.24, h: 0.34, fontSize: 10, bold: true, color: H.white, align: "center", valign: "middle", margin: 0, isTextBox: true });
      s.addText(d, { x: x + 0.12, y: 5.85, w: stw - 0.24, h: 0.9, fontSize: 11, color: H.ink, margin: 0, valign: "top", isTextBox: true });
    });
  }

  // ───────────────────── 4. IMPACT POTENTIAL ─────────────────────
  {
    const s = addSlideC();
    s.addText("Impact Potential", { placeholder: "title" });
    const tiles = [["~100 M", "people worldwide with essential tremor [1]"], ["~4.6 M", "estimated in India – most never see a specialist"], ["1 in 17", "adults over 65 affected – India is ageing fast [1]"], ["Lakhs → ₹40K", "DBS brain surgery vs. a NILAI device"]];
    const tw = (12.33 - 3 * 0.25) / 4;
    tiles.forEach(([n, t], i) => {
      const x = 0.5 + i * (tw + 0.25);
      card(s, x, 1.2, tw, 1.3, i === 3 ? H.orTint : H.tealTint);
      s.addText(n, { x: x + 0.2, y: 1.28, w: tw - 0.4, h: 0.65, fontSize: 28, bold: true, color: i === 3 ? "B35A12" : H.teal, margin: 0, valign: "middle", isTextBox: true });
      s.addText(t, { x: x + 0.2, y: 1.93, w: tw - 0.4, h: 0.5, fontSize: 11, color: H.ink, margin: 0, valign: "top", isTextBox: true });
    });
    const cw = (12.33 - 2 * 0.25) / 3;
    const cols = [
      [fa.FaUserFriends, "Potential impact on the target audience", [
        "People with essential tremor & Parkinson's, and the elderly",
        "Eat, write, dress and work independently again",
        "Return to exercise – which itself reduces tremor [3][4][5]",
        "Daily progress score builds confidence & adherence",
      ]],
      [fa.FaHandHoldingHeart, "Benefits of the solution", [
        [{ text: "Social: ", bold: true }, { text: "dignity, independence, inclusion of elders; less caregiver burden" }],
        [{ text: "Economic: ", bold: true }, { text: "a fraction of surgery cost; shared kits for rehab centres & PHCs" }],
        [{ text: "Health system: ", bold: true }, { text: "remote monitoring cuts repeat clinic visits" }],
        [{ text: "Jobs: ", bold: true }, { text: "local assembly of sleeves & electrode kits" }],
      ]],
    ];
    for (let i = 0; i < 2; i++) {
      const x = 0.5 + i * (cw + 0.25);
      card(s, x, 2.75, cw, 3.45, H.tint);
      await circleIcon(s, cols[i][0], x + 0.2, 2.9, 0.5, H.navy);
      s.addText(cols[i][1], { x: x + 0.82, y: 2.9, w: cw - 1.0, h: 0.5, fontSize: 13.5, bold: true, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
      s.addText(bullets(cols[i][2], { fontSize: 13.5, space: 9 }), { x: x + 0.2, y: 3.55, w: cw - 0.4, h: 2.55, margin: 0, valign: "top", isTextBox: true });
    }
    // stakeholders
    const x3 = 0.5 + 2 * (cw + 0.25);
    card(s, x3, 2.75, cw, 3.45, H.tint);
    await circleIcon(s, fa.FaSitemap, x3 + 0.2, 2.9, 0.5, H.navy);
    s.addText("Stakeholders", { x: x3 + 0.82, y: 2.9, w: cw - 1.0, h: 0.5, fontSize: 13.5, bold: true, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
    const sh = [[fa.FaUser, "Patients, families & caregivers"], [fa.FaUserMd, "Neurologists & physiotherapists"], [fa.FaHospital, "Rehab centres, PHCs & elder-care homes"], [fa.FaLandmark, "Govt. health schemes & NGOs"], [fa.FaHandsHelping, "CSR funders – kits for rural centres"]];
    let yy = 3.55;
    for (const [ic, t] of sh) {
      s.addImage({ data: await icon(ic, H.teal), x: x3 + 0.25, y: yy + 0.05, w: 0.28, h: 0.28 });
      s.addText(t, { x: x3 + 0.68, y: yy, w: cw - 0.85, h: 0.38, fontSize: 12, color: H.ink, margin: 0, valign: "middle", isTextBox: true });
      yy += 0.5;
    }
    // SDGs
    s.addText("Aligned with UN SDGs", { x: 0.5, y: 6.38, w: 2.4, h: 0.45, fontSize: 12, bold: true, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
    const sdg = [["SDG 3 · Good health & well-being", "4C9F38"], ["SDG 8 · Decent work", "A21942"], ["SDG 9 · Innovation", "FD6925"], ["SDG 10 · Reduced inequalities", "DD1367"]];
    let sx = 2.9;
    sdg.forEach(([t, col]) => {
      const w = t.length * 0.072 + 0.35;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: sx, y: 6.42, w, h: 0.38, rectRadius: 0.08, fill: { color: col }, line: { color: col, width: 0 } });
      s.addText(t, { x: sx, y: 6.42, w, h: 0.38, fontSize: 10.5, bold: true, color: H.white, align: "center", valign: "middle", margin: 0, isTextBox: true });
      sx += w + 0.15;
    });
  }

  // ───────────────────── 5. FEASIBILITY & RISK ─────────────────────
  {
    const s = addSlideC();
    s.addText("Feasibility and Risk Analysis", { placeholder: "title" });
    const LX = 0.5, LW = 4.45;
    label(s, "Analysis of the feasibility", LX, 1.2, LW);
    const fe = [
      [fa.FaCogs, "Technical", "Off-the-shelf parts; classifier, dashboard and EMG band already working (3 of 4 stages)."],
      [fa.FaRupeeSign, "Economic", "Target ₹40K device + annual service & app subscription; CSR funds rural kits."],
      [fa.FaClinicMedical, "Operational", "Pilot with Chennai rehab & physiotherapy centres; app-based remote follow-up."],
      [fa.FaAward, "Validated", "Concept recognised as a Samsung Solve for Tomorrow 2026 national finalist."],
    ];
    let fy = 1.52;
    for (const [ic, t, d] of fe) {
      card(s, LX, fy, LW, 1.22, H.tealTint);
      await circleIcon(s, ic, LX + 0.15, fy + 0.18, 0.48, H.teal);
      s.addText(t, { x: LX + 0.78, y: fy + 0.12, w: LW - 0.95, h: 0.35, fontSize: 13, bold: true, color: H.teal, margin: 0, valign: "middle", isTextBox: true });
      s.addText(d, { x: LX + 0.78, y: fy + 0.47, w: LW - 0.95, h: 0.7, fontSize: 11, color: H.ink, margin: 0, valign: "top", isTextBox: true });
      fy += 1.34;
    }
    const RX = 5.2, RW = 7.63;
    label(s, "Potential challenges & risks  →  strategies for overcoming them", RX, 1.2, RW);
    const hdr = (t) => ({ text: t, options: { bold: true, color: H.white, fill: { color: H.navy }, fontSize: 12, valign: "middle" } });
    const lvl = (t) => {
      const col = t === "High" ? H.red : t === "Medium" ? H.amber : H.green;
      return { text: t, options: { bold: true, color: col, align: "center", valign: "middle", fontSize: 11 } };
    };
    const rowsData = [
      ["False triggers from vehicle / tool vibration at tremor frequency", "High", "Act only when EMG (muscle origin) and gyro agree – coherence check"],
      ["EMS safety & user comfort", "High", "Current-limited driver, clinician-set limits, user-triggered only, physical stop button"],
      ["Noisy dry-electrode EMG", "Medium", "Compression sleeve, reference electrode, signal-quality gate before any action"],
      ["Medical-device approval (CDSCO)", "Medium", "Launch as monitoring & training aid; gather pilot data before suppression claims"],
      ["Affordability in rural India", "Medium", "Shared CSR-funded kits at PHCs & rehab centres; B2B service model"],
      ["Health-data privacy", "Low", "On-device processing; consent-based sharing as per DPDP Act 2023"],
    ];
    const rows = [[hdr("Challenge / risk"), hdr("Level"), hdr("Strategy to overcome")]];
    rowsData.forEach(([a, b, c], i) => {
      const fill = { color: i % 2 ? H.white : H.tint };
      rows.push([{ text: a, options: { fill, fontSize: 11, color: H.ink, valign: "middle" } }, { ...lvl(b), options: { ...lvl(b).options, fill } }, { text: c, options: { fill, fontSize: 11, color: H.ink, valign: "middle" } }]);
    });
    s.addTable(rows, { x: RX, y: 1.52, w: RW, colW: [2.75, 0.9, 3.98], rowH: [0.42, 0.78, 0.78, 0.78, 0.78, 0.78, 0.78], border: { type: "solid", pt: 0.5, color: H.line }, fontFace: "Calibri", margin: [0.05, 0.1, 0.05, 0.1], objectName: "RiskTable" });
  }

  // ───────────────────── 6. TEAM ─────────────────────
  {
    const s = addSlideC();
    s.addText("Team", { placeholder: "title" });
    label(s, "Team composition & roles", 0.5, 1.2, 12.33);
    const members = [
      ["YR", "Yuvabharathi R", "Team Lead", "User research, clinical outreach, project management & pitch"],
      ["SH", "S J Hema Priya", "Hardware & sensing", "EMG / EMS circuits, sensor integration, sleeve & pod design"],
      ["MK", "Manoj Kumar K", "AI/ML & embedded", "Signal pipeline, tremor classifier, ESP32 firmware, dashboard & app"],
    ];
    const mw = (12.33 - 2 * 0.3) / 3;
    members.forEach(([ini, n, r, d], i) => {
      const x = 0.5 + i * (mw + 0.3);
      card(s, x, 1.52, mw, 2.25, H.tint);
      s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: 1.72, w: 0.95, h: 0.95, fill: { color: i === 0 ? H.orange : H.teal }, line: { color: H.white, width: 2 } });
      s.addText(ini, { x: x + 0.25, y: 1.72, w: 0.95, h: 0.95, fontSize: 22, bold: true, color: H.white, align: "center", valign: "middle", margin: 0, isTextBox: true });
      s.addText(n, { x: x + 1.38, y: 1.75, w: mw - 1.5, h: 0.42, fontSize: 16, bold: true, color: H.navy, margin: 0, valign: "middle", isTextBox: true });
      s.addText(r, { x: x + 1.38, y: 2.17, w: mw - 1.5, h: 0.35, fontSize: 12.5, bold: true, color: i === 0 ? "B35A12" : H.teal, margin: 0, valign: "middle", isTextBox: true });
      s.addText(d, { x: x + 0.25, y: 2.85, w: mw - 0.5, h: 0.55, fontSize: 11.5, color: H.ink, margin: 0, valign: "top", isTextBox: true });
      s.addText("Sri Sairam Engineering College", { x: x + 0.25, y: 3.38, w: mw - 0.5, h: 0.3, fontSize: 10, italic: true, color: H.muted, margin: 0, isTextBox: true });
    });
    // challenges
    const hw = (12.33 - 0.3) / 2;
    label(s, "Challenges we faced", 0.5, 4.02, hw);
    const ch = [
      ["Raw EMG too noisy", "pivoted to depth-camera + gyro first, then a dry-electrode compression band"],
      ["Vibration looks like tremor", "added EMG–gyro coherence so only muscle-driven tremor counts"],
      ["Electronics vs. washable wear", "detachable pod with pogo-pin contacts and magnetic alignment"],
    ];
    let cy = 4.32;
    for (const [a, b] of ch) {
      s.addImage({ data: await icon(fa.FaExclamationCircle, H.orange), x: 0.5, y: cy + 0.06, w: 0.3, h: 0.3 });
      s.addText([{ text: a + " → ", options: { bold: true, color: H.navy } }, { text: b, options: { color: H.ink } }], { x: 0.92, y: cy, w: hw - 0.45, h: 0.72, fontSize: 12, margin: 0, valign: "top", isTextBox: true });
      cy += 0.68;
    }
    // journey
    const JX = 0.5 + hw + 0.3;
    label(s, "Our journey", JX, 4.02, hw);
    const jr = [["Idea", "Tremor ↔ inactivity loop"], ["Prototype", "Classifier + dashboard"], ["Wearable", "EMG band, live signals"], ["Recognition", "Samsung SFT 2026 finalist"], ["Next", "EMS pod + clinical pilot"]];
    const jw = (hw - 4 * 0.12) / 5;
    s.addShape(pres.shapes.LINE, { x: JX + jw / 2, y: 4.62, w: hw - jw, h: 0, line: { color: H.line, width: 2 } });
    jr.forEach(([t, d], i) => {
      const x = JX + i * (jw + 0.12);
      const col = i === 4 ? H.orange : H.teal;
      s.addShape(pres.shapes.OVAL, { x: x + jw / 2 - 0.17, y: 4.45, w: 0.34, h: 0.34, fill: { color: col }, line: { color: H.white, width: 2 } });
      s.addText(t, { x, y: 4.9, w: jw, h: 0.35, fontSize: 12, bold: true, color: col, align: "center", margin: 0, isTextBox: true });
      s.addText(d, { x, y: 5.25, w: jw, h: 0.6, fontSize: 10.5, color: H.ink, align: "center", margin: 0, valign: "top", isTextBox: true });
    });
    s.addText("Building an affordable, made-in-India way for people with tremor to stay independent and active.", { x: JX, y: 6.05, w: hw, h: 0.65, fontSize: 12, italic: true, color: H.teal, margin: 0, valign: "middle", isTextBox: true });
  }

  // ───────────────────── 7. REFERENCES ─────────────────────
  {
    const s = addSlideC();
    s.addText("References", { placeholder: "title" });
    const refs = [
      ["Louis ED, McCreary M. How common is essential tremor? Update on the worldwide prevalence of essential tremor. Tremor Other Hyperkinet Mov. 2021;11:28.", "https://pmc.ncbi.nlm.nih.gov/articles/PMC8269764/"],
      ["Louis ED, Collins K, Rohl B, et al. Self-reported physical activity in essential tremor: relationship with tremor, balance and cognitive function. J Neurol Sci. 2016.", "https://pubmed.ncbi.nlm.nih.gov/27288815/"],
      ["Farashi S, Kiani L, Bashirian S. Effect of exercise on Parkinson's disease tremor: a meta-analysis study. Tremor Other Hyperkinet Mov. 2021;11:15.", "https://pubmed.ncbi.nlm.nih.gov/33981478/"],
      ["Kadkhodaie M, Sharifnezhad A, Ebadi S, et al. Effect of eccentric-based rehabilitation on hand tremor intensity in Parkinson disease. Neurol Sci. 2020;41(3):637–643.", "https://pubmed.ncbi.nlm.nih.gov/31735996/"],
      ["Kavanagh JJ, Wedderburn-Bisshop J, Keogh JW. Resistance training reduces force tremor and improves manual dexterity in older individuals with essential tremor. J Mot Behav. 2016;48(1):20–30.", "https://pubmed.ncbi.nlm.nih.gov/25923582/"],
      ["Riviere CN, Rader RS, Thakor NV. Adaptive cancelling of physiological tremor for improved precision in microsurgery (WFLC). IEEE Trans Biomed Eng. 1998;45(7):839–846.", "https://doi.org/10.1109/10.686791"],
      ["MY Bharat – Hack for Social Cause: themes & guidelines.", "https://mybharat.gov.in/pages/hack_social"],
      ["Espressif ESP32-C6 product page; Upside Down Labs bio-potential (EMG) hardware.", "https://www.espressif.com/en/products/socs/esp32-c6"],
    ];
    const half = (12.33 - 0.4) / 2;
    refs.forEach(([t, u], i) => {
      const col = i < 4 ? 0 : 1;
      const row = i % 4;
      const x = 0.5 + col * (half + 0.4);
      const y = 1.25 + row * 1.38;
      card(s, x, y, half, 1.22, H.tint);
      s.addShape(pres.shapes.OVAL, { x: x + 0.15, y: y + 0.15, w: 0.42, h: 0.42, fill: { color: H.navy }, line: { color: H.navy, width: 0 } });
      s.addText(String(i + 1), { x: x + 0.15, y: y + 0.15, w: 0.42, h: 0.42, fontSize: 13, bold: true, color: H.white, align: "center", valign: "middle", margin: 0, isTextBox: true });
      s.addText([
        { text: t, options: { color: H.ink, breakLine: true } },
        { text: u, options: { color: H.teal, hyperlink: { url: u } } },
      ], { x: x + 0.72, y: y + 0.1, w: half - 0.87, h: 1.02, fontSize: 10.5, margin: 0, valign: "middle", isTextBox: true });
    });
  }

  const out = path.join(__dirname, "NILAI_HSC_TN00325.pptx");
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("wrote", out);
})();
