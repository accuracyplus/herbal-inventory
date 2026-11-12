import { jsx as e, jsxs as i, Fragment as M } from "react/jsx-runtime";
import { useId as Z, useState as v, useRef as U, useMemo as ee, useEffect as L, createElement as wn, useCallback as ye, useLayoutEffect as Qe } from "react";
import { Search as Se, Minus as De, Plus as vn, Check as Y, Building2 as Cn, ChevronsUpDown as xn, Settings as Ve, User as Je, Briefcase as Ze, Calendar as Ge, Lock as Xe, ChevronRight as E, X as ue, Clock as We, Award as pe, Target as Bn, Bell as Ke, ShieldCheck as Sn, Pin as en, ThumbsUp as nn, Hand as K, Sun as an, MessageSquare as Dn, Star as tn, BookOpen as $e, UserPlus as me, Sparkles as Wn, RefreshCw as $n, CheckCircle2 as Fn, BadgeCheck as Mn, ExternalLink as fe, Users as zn, Hourglass as Fe, LogOut as Pn, Info as sn, ChevronDown as ln, FileText as we, ArrowUp as Tn, ArrowDown as In, AlertTriangle as ve, Circle as Ln, Paperclip as En } from "lucide-react";
const be = (n) => n.trim().toLowerCase();
function Un(n, a, t = 30) {
  const s = be(a);
  if (!s) return n.slice(0, t);
  const l = n.filter((c) => {
    var h;
    return (h = c.codes) == null ? void 0 : h.some((A) => be(A) === s);
  });
  if (l.length) return l.slice(0, t);
  const r = s.split(/\s+/), o = (c) => be(`${c.label} ${c.keywords ?? ""} ${(c.codes ?? []).join(" ")}`);
  return n.filter((c) => {
    const h = o(c);
    return r.every((A) => h.includes(A));
  }).slice(0, t);
}
function Hn(n, a, t = {}) {
  const { min: s = 0, max: l, step: r = 1 } = t, o = Number(n);
  let h = (Number.isFinite(o) ? o : 0) + a * r;
  return h < s && (h = s), l !== void 0 && h > l && (h = l), String(Math.round(h * 1e6) / 1e6);
}
function Ha({ label: n, options: a, onPick: t, placeholder: s, hint: l, error: r, hideLabel: o, limit: c = 30, empty: h, footer: A, id: d }) {
  const b = Z(), u = d ?? b, [N, k] = v(""), [f, p] = v(!1), [m, _] = v(0), x = U(null), y = ee(() => Un(a, N, c), [a, N, c]);
  L(() => {
    if (!f) return;
    const C = (S) => {
      var B;
      (B = x.current) != null && B.contains(S.target) || p(!1);
    };
    return document.addEventListener("pointerdown", C), () => document.removeEventListener("pointerdown", C);
  }, [f]);
  const P = (C) => {
    t(C), k(""), p(!1), _(0);
  }, $ = [l ? `${u}-h` : "", r ? `${u}-e` : ""].filter(Boolean).join(" ") || void 0;
  return /* @__PURE__ */ i("div", { className: "hf-fld hf-pick", ref: x, children: [
    /* @__PURE__ */ e("label", { htmlFor: u, className: o ? "hf-sr" : "hf-fld__l", children: n }),
    l && /* @__PURE__ */ e("span", { id: `${u}-h`, className: "hf-fld__h", children: l }),
    /* @__PURE__ */ i("div", { className: "hf-pick__wrap", children: [
      /* @__PURE__ */ i("div", { className: ["hf-pick__box", f ? "is-open" : "", r ? "is-err" : ""].filter(Boolean).join(" "), children: [
        /* @__PURE__ */ e(Se, { size: 18, "aria-hidden": "true" }),
        /* @__PURE__ */ e(
          "input",
          {
            id: u,
            role: "combobox",
            "aria-expanded": f,
            "aria-controls": `${u}-l`,
            "aria-autocomplete": "list",
            "aria-activedescendant": f && y[m] ? `${u}-o${m}` : void 0,
            "aria-invalid": r ? !0 : void 0,
            "aria-describedby": $,
            autoComplete: "off",
            value: N,
            placeholder: s,
            onFocus: () => p(!0),
            onChange: (C) => {
              k(C.target.value), p(!0), _(0);
            },
            onKeyDown: (C) => {
              C.key === "ArrowDown" ? (C.preventDefault(), p(!0), _((S) => Math.min(S + 1, y.length - 1))) : C.key === "ArrowUp" ? (C.preventDefault(), _((S) => Math.max(S - 1, 0))) : C.key === "Enter" && f && y[m] ? (C.preventDefault(), P(y[m])) : C.key === "Escape" && f && (C.stopPropagation(), p(!1));
            }
          }
        )
      ] }),
      f && /* @__PURE__ */ i("div", { className: "hf-pick__list", children: [
        /* @__PURE__ */ e("div", { id: `${u}-l`, role: "listbox", "aria-label": n, children: y.map((C, S) => /* @__PURE__ */ i(
          "button",
          {
            id: `${u}-o${S}`,
            type: "button",
            role: "option",
            "aria-selected": S === m,
            tabIndex: -1,
            className: S === m ? "hf-pick__opt is-on" : "hf-pick__opt",
            onPointerDown: (B) => B.preventDefault(),
            onClick: () => P(C),
            onPointerEnter: () => _(S),
            children: [
              /* @__PURE__ */ i("span", { className: "hf-pick__b", children: [
                /* @__PURE__ */ e("span", { className: "hf-pick__t", children: C.label }),
                C.sub && /* @__PURE__ */ e("span", { className: "hf-pick__s", children: C.sub })
              ] }),
              C.end && /* @__PURE__ */ e("span", { className: C.endTone ? `hf-pick__e hf-pick__e--${C.endTone}` : "hf-pick__e", children: C.end })
            ]
          },
          C.value
        )) }),
        y.length === 0 && /* @__PURE__ */ e("p", { className: "hf-pick__none", children: h ? h(N) : `Nothing matches “${N}”.` }),
        A && /* @__PURE__ */ e("div", { className: "hf-pick__foot", children: A })
      ] })
    ] }),
    r && /* @__PURE__ */ e("span", { id: `${u}-e`, className: "hf-fld__e", children: r })
  ] });
}
function ja({ label: n, value: a, onChange: t, unit: s, min: l = 0, max: r, step: o = 1, bare: c, hint: h, error: A, hideLabel: d, id: b, className: u, ...N }) {
  const k = Z(), f = b ?? k, p = [h ? `${f}-h` : "", A ? `${f}-e` : ""].filter(Boolean).join(" ") || void 0, m = (_) => t(Hn(a, _, { min: l, max: r, step: o }));
  return /* @__PURE__ */ i("div", { className: ["hf-fld hf-qty", u ?? ""].filter(Boolean).join(" "), children: [
    /* @__PURE__ */ e("label", { htmlFor: f, className: d ? "hf-sr" : "hf-fld__l", children: n }),
    h && /* @__PURE__ */ e("span", { id: `${f}-h`, className: "hf-fld__h", children: h }),
    /* @__PURE__ */ i("div", { className: "hf-qty__row", children: [
      !c && /* @__PURE__ */ e("button", { type: "button", className: "hf-qty__b", "aria-label": `Less: ${n}`, onClick: () => m(-1), children: /* @__PURE__ */ e(De, { size: 18, "aria-hidden": "true" }) }),
      /* @__PURE__ */ e(
        "input",
        {
          id: f,
          type: "number",
          inputMode: "decimal",
          min: l,
          max: r,
          step: "any",
          value: a ?? "",
          className: A ? "hf-input hf-input--err" : "hf-input",
          "aria-invalid": A ? !0 : void 0,
          "aria-describedby": p,
          onChange: (_) => t(_.target.value),
          onWheel: (_) => _.currentTarget.blur(),
          ...N
        }
      ),
      !c && /* @__PURE__ */ e("button", { type: "button", className: "hf-qty__b", "aria-label": `More: ${n}`, onClick: () => m(1), children: /* @__PURE__ */ e(vn, { size: 18, "aria-hidden": "true" }) }),
      s && /* @__PURE__ */ e("span", { className: "hf-qty__u", children: s })
    ] }),
    A && /* @__PURE__ */ e("span", { id: `${f}-e`, className: "hf-fld__e", children: A })
  ] });
}
function qa({ items: n, columns: a = 2 }) {
  const t = n.filter((s) => s.value !== null && s.value !== void 0 && s.value !== "" && s.value !== !1);
  return t.length ? /* @__PURE__ */ e("dl", { className: `hf-kv hf-kv--${a}`, children: t.map((s) => /* @__PURE__ */ i("div", { children: [
    /* @__PURE__ */ e("dt", { children: s.label }),
    /* @__PURE__ */ e("dd", { children: s.value })
  ] }, s.label)) }) : null;
}
function Oa({ children: n, icon: a }) {
  return /* @__PURE__ */ i("p", { className: "hf-quiet", children: [
    a ?? /* @__PURE__ */ e(Y, { size: 16, "aria-hidden": "true" }),
    /* @__PURE__ */ e("span", { children: n })
  ] });
}
function Ra({ name: n, label: a = "Working in", onClick: t, compact: s }) {
  const l = s ? "hf-unit hf-unit--pill" : "hf-unit", r = /* @__PURE__ */ i(M, { children: [
    /* @__PURE__ */ e(Cn, { size: s ? 16 : 20, "aria-hidden": "true" }),
    s ? /* @__PURE__ */ e("span", { className: "hf-unit__n", children: n }) : /* @__PURE__ */ i("span", { className: "hf-unit__b", children: [
      /* @__PURE__ */ e("span", { className: "hf-unit__l", children: a }),
      /* @__PURE__ */ e("span", { className: "hf-unit__n", children: n })
    ] }),
    t && /* @__PURE__ */ e(xn, { size: 16, "aria-hidden": "true" })
  ] });
  return t ? /* @__PURE__ */ e("button", { type: "button", className: l, onClick: t, "aria-label": `${a}: ${n}. Switch`, children: r }) : /* @__PURE__ */ e("div", { className: l, "aria-label": `${a}: ${n}`, children: r });
}
function rn(n = /* @__PURE__ */ new Date()) {
  const a = n.getHours();
  return a < 5 ? "Working late" : a < 12 ? "Good morning" : a < 17 ? "Good afternoon" : "Good evening";
}
function Ya({ firstName: n, reportsTo: a, leads: t = 0, tenure: s, quote: l, search: r, onAppearance: o, onPrivacy: c, now: h = /* @__PURE__ */ new Date() }) {
  const A = h.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  return /* @__PURE__ */ i("div", { className: "hf", children: [
    /* @__PURE__ */ i("div", { className: "hf-topbar", children: [
      /* @__PURE__ */ e("p", { className: "hf-topbar__date", children: A }),
      r && /* @__PURE__ */ e("div", { className: "hf-topbar__search", children: r }),
      o && /* @__PURE__ */ e("button", { type: "button", className: "hf-topbar__gear", onClick: o, "aria-label": "Appearance settings", "data-tour": "gear", children: /* @__PURE__ */ e(Ve, { size: 20 }) })
    ] }),
    /* @__PURE__ */ i("header", { className: "hf-greet", "data-tour": "topbar", children: [
      /* @__PURE__ */ i("h1", { className: "hf-display hf-greet__h1", children: [
        rn(h),
        ", ",
        n
      ] }),
      (a || t > 0 || s) && /* @__PURE__ */ i("div", { className: "hf-greet__meta", children: [
        a && /* @__PURE__ */ i("span", { children: [
          /* @__PURE__ */ e(Je, { size: 14 }),
          "Reports to ",
          a
        ] }),
        t > 0 && /* @__PURE__ */ i("span", { children: [
          /* @__PURE__ */ e(Ze, { size: 14 }),
          "Leads ",
          t,
          " ",
          t === 1 ? "person" : "people"
        ] }),
        s && /* @__PURE__ */ i("span", { children: [
          /* @__PURE__ */ e(Ge, { size: 14 }),
          s
        ] })
      ] }),
      c && /* @__PURE__ */ i("button", { type: "button", className: "hf-greet__privacy", onClick: c, children: [
        /* @__PURE__ */ e(Xe, { size: 12 }),
        /* @__PURE__ */ e("span", { children: "Only you can see this page" }),
        /* @__PURE__ */ e(E, { size: 12 })
      ] }),
      l && /* @__PURE__ */ i("blockquote", { className: "hf-greet__quote", children: [
        "“",
        l.body,
        "”",
        l.author && /* @__PURE__ */ i("footer", { children: [
          "— ",
          l.author
        ] })
      ] })
    ] })
  ] });
}
const Q = (n) => `hf-tone-${n}`, T = (...n) => n.filter(Boolean).join(" "), jn = (n) => n.split(" ").filter(Boolean).map((a) => a[0]).slice(0, 2).join("").toUpperCase();
function Qa({ name: n, role: a, company: t, photo: s, onOpen: l }) {
  return s ? /* @__PURE__ */ i("section", { className: "hf hf-card hf-profile hf-profile--photo", "aria-label": "Your profile", "data-tour": "profile", children: [
    /* @__PURE__ */ e("img", { className: "hf-profile__photo", src: s, alt: n }),
    /* @__PURE__ */ i("div", { className: "hf-profile__over", children: [
      /* @__PURE__ */ e("h2", { className: "hf-display hf-profile__name", children: n }),
      (a || t) && /* @__PURE__ */ e("p", { className: "hf-profile__role", children: [a, t].filter(Boolean).join(" · ") })
    ] }),
    l && /* @__PURE__ */ e("button", { type: "button", className: "hf-sr", onClick: l, children: "Open my access" })
  ] }) : /* @__PURE__ */ e("section", { className: "hf hf-card hf-profile", "aria-label": "Your profile", "data-tour": "profile", children: /* @__PURE__ */ i(l ? "button" : "div", { className: T("hf-profile__row", l && "hf-press"), onClick: l, type: l ? "button" : void 0, style: l ? { width: "100%", textAlign: "left" } : void 0, children: [
    /* @__PURE__ */ e("span", { className: "hf-avatar", "aria-hidden": "true", children: jn(n) }),
    /* @__PURE__ */ i("span", { style: { flex: 1, minWidth: 0 }, children: [
      /* @__PURE__ */ e("h2", { className: "hf-display hf-profile__name hf-truncate", title: n, children: n }),
      (a || t) && /* @__PURE__ */ i("p", { className: "hf-profile__role hf-truncate", children: [
        a && /* @__PURE__ */ e("b", { children: a }),
        a && t && /* @__PURE__ */ e("span", { className: "hf-profile__co", children: " · " }),
        t && /* @__PURE__ */ e("span", { className: "hf-profile__co", children: t })
      ] })
    ] }),
    l && /* @__PURE__ */ e("span", { className: "hf-profile__chev", "aria-hidden": "true", children: /* @__PURE__ */ e(E, { size: 18 }) })
  ] }) });
}
function O({ text: n, label: a = "What does this mean?", align: t = "centre" }) {
  const [s, l] = v(!1), r = Z(), o = U(null), [c, h] = v(t);
  return L(() => {
    if (!s) return;
    const A = o.current;
    if (A && t === "centre") {
      const u = A.getBoundingClientRect();
      u.left + u.width / 2 - 130 < 8 ? h("right") : u.left + u.width / 2 + 130 > window.innerWidth - 8 ? h("left") : h("centre");
    }
    const d = (u) => {
      u.key === "Escape" && l(!1);
    }, b = () => l(!1);
    return document.addEventListener("keydown", d), document.addEventListener("click", b), () => {
      document.removeEventListener("keydown", d), document.removeEventListener("click", b);
    };
  }, [s, t]), /* @__PURE__ */ i("span", { className: "hf-hint", ref: o, children: [
    /* @__PURE__ */ e(
      "button",
      {
        type: "button",
        className: "hf-hint__btn",
        "aria-label": a,
        "aria-expanded": s,
        "aria-describedby": s ? r : void 0,
        onClick: (A) => {
          A.stopPropagation(), l((d) => !d);
        },
        children: "?"
      }
    ),
    s && /* @__PURE__ */ e(
      "span",
      {
        id: r,
        role: "tooltip",
        className: `hf-hint__pop${c === "left" ? " hf-hint__pop--left" : c === "right" ? " hf-hint__pop--right" : ""}`,
        onClick: (A) => A.stopPropagation(),
        children: n
      }
    )
  ] });
}
function se({ open: n, title: a, subtitle: t, onClose: s, children: l, wide: r }) {
  const o = Z(), c = U(null), h = U(s);
  return L(() => {
    h.current = s;
  }), L(() => {
    var u;
    if (!n) return;
    const A = document.activeElement;
    (u = c.current) == null || u.focus();
    const d = (N) => {
      N.key === "Escape" && h.current();
    };
    window.addEventListener("keydown", d);
    const b = document.body.style.overflow;
    return document.body.style.overflow = "hidden", () => {
      var N;
      window.removeEventListener("keydown", d), document.body.style.overflow = b, (N = A == null ? void 0 : A.focus) == null || N.call(A);
    };
  }, [n]), n ? /* @__PURE__ */ e("div", { className: "hf hf-scrim", onClick: s, children: /* @__PURE__ */ i("div", { className: r ? "hf-sheet hf-sheet--wide" : "hf-sheet", role: "dialog", "aria-modal": "true", "aria-labelledby": o, onClick: (A) => A.stopPropagation(), children: [
    /* @__PURE__ */ i("div", { className: "hf-sheet__head", children: [
      /* @__PURE__ */ i("div", { children: [
        /* @__PURE__ */ e("h2", { id: o, className: "hf-sheet__title", children: a }),
        t && /* @__PURE__ */ e("p", { className: "hf-sheet__sub", children: t })
      ] }),
      /* @__PURE__ */ e("button", { ref: c, type: "button", className: "hf-sheet__close", onClick: s, "aria-label": "Close", children: /* @__PURE__ */ e(ue, { size: 18 }) })
    ] }),
    l
  ] }) }) : null;
}
function qn(n) {
  const a = n.reduce((t, s) => t + s.weight, 0) || 1;
  return Math.round(n.reduce((t, s) => t + s.score / s.max * s.weight, 0) / a * 100);
}
function On(n, a) {
  return n >= a.exceeding ? { label: "Exceeding", icon: /* @__PURE__ */ e(pe, { size: 12 }), tone: "brand" } : n >= a.onTrack ? { label: "On track", icon: /* @__PURE__ */ e(Bn, { size: 12 }), tone: "pop" } : { label: "Needs attention", icon: /* @__PURE__ */ e(Ke, { size: 12 }), tone: "coral" };
}
function Rn({ history: n }) {
  if (n.length < 2) return null;
  const a = Math.min(...n) - 4, t = Math.max(...n) + 2, s = 120 / (n.length - 1), l = n.map((c, h) => [h * s, 30 - (c - a) / (t - a || 1) * 28]), r = l.map((c, h) => (h ? "L" : "M") + c[0].toFixed(1) + " " + c[1].toFixed(1)).join(" "), o = l[l.length - 1];
  return /* @__PURE__ */ i("svg", { viewBox: "0 0 120 32", role: "img", "aria-label": `Last ${n.length} months: ${n.join(", ")}`, children: [
    /* @__PURE__ */ e("path", { d: `${r} L${o[0]} 32 L0 32 Z`, fill: "rgb(var(--brand-500) / .12)" }),
    /* @__PURE__ */ e("path", { d: r, fill: "none", stroke: "rgb(var(--brand-500))", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ e("circle", { cx: o[0], cy: o[1], r: "3", fill: "rgb(var(--brand-500))" })
  ] });
}
function Va({ factors: n, bands: a, conductPolicy: t, status: s, history: l = [], improve: r = [], building: o, title: c = "Your HiFive Factor" }) {
  var V;
  const [h, A] = v(!1), [d, b] = v(0), [u, N] = v(0), k = qn(n), f = typeof window < "u" && ((V = window.matchMedia) == null ? void 0 : V.call(window, "(prefers-reduced-motion: reduce)").matches), p = typeof document < "u" && document.documentElement.getAttribute("data-tier") === "lite", m = f || p;
  L(() => {
    if (m) {
      b(1), N(k);
      return;
    }
    const w = setTimeout(() => b(1), 100), I = setTimeout(() => {
      let H = 0;
      const G = performance.now(), te = (re) => {
        const g = Math.min(1, (re - G) / 1100);
        N(Math.round(k * (1 - Math.pow(1 - g, 3)))), g < 1 && (H = requestAnimationFrame(te));
      };
      return H = requestAnimationFrame(te), () => cancelAnimationFrame(H);
    }, 650);
    return () => {
      clearTimeout(w), clearTimeout(I);
    };
  }, [k, m]);
  const _ = n.reduce((w, I) => w + I.weight, 0) || 1, x = 45, y = 2 * Math.PI * x;
  let P = 0;
  const $ = n.map((w) => {
    const I = w.score / w.max * w.weight / _ * y, H = { ...w, len: I, offset: P };
    return P += I, H;
  }), C = On(k, a), S = n.find((w) => w.balance), B = S && t ? S.score >= t.warn ? "ok" : S.score >= t.formalWarning ? "watch" : "risk" : "ok", D = `${c} ${k} out of 100: ` + n.map((w) => `${w.label} ${w.score} of ${w.max}`).join(", ") + (s ? `. ${s}` : ""), z = l.length >= 2 ? k - l[0] : null;
  return /* @__PURE__ */ i(M, { children: [
    /* @__PURE__ */ i("button", { type: "button", className: "hf hf-card hf-card--hero hf-factor hf-press", onClick: () => A(!0), "data-tour": "factor", "aria-haspopup": "dialog", children: [
      /* @__PURE__ */ i("div", { className: "hf-factor__head", children: [
        /* @__PURE__ */ i("div", { children: [
          /* @__PURE__ */ i("h3", { className: "hf-display hf-factor__title", children: [
            c,
            " ",
            /* @__PURE__ */ e(O, { text: `One number, 0 to 100, built from ${n.map((w) => `${w.label.toLowerCase()} (${Math.round(w.weight / _ * 100)}%)`).join(", ")}. It is never compared with anyone else. Tap the card for the full breakdown.` })
          ] }),
          /* @__PURE__ */ e("p", { className: "hf-factor__tap", children: "Tap to see how it's built" })
        ] }),
        /* @__PURE__ */ e("span", { className: "hf-factor__chev", "aria-hidden": "true", children: /* @__PURE__ */ e(E, { size: 18 }) })
      ] }),
      /* @__PURE__ */ i("div", { className: "hf-factor__row", children: [
        /* @__PURE__ */ i("div", { className: "hf-ring", children: [
          /* @__PURE__ */ i("svg", { viewBox: "0 0 100 100", role: "img", "aria-label": o ? `${c}: building, first score after your first review` : D, children: [
            /* @__PURE__ */ e("circle", { className: "hf-ring__track", cx: "50", cy: "50", r: x, fill: "none", strokeWidth: "8" }),
            !o && $.map((w, I) => /* @__PURE__ */ e(
              "circle",
              {
                className: T("hf-ring__seg", Q(w.tone)),
                cx: "50",
                cy: "50",
                r: x,
                fill: "none",
                strokeWidth: "8",
                stroke: "var(--hf-tone-bar)",
                style: { transitionDelay: `${I * 120}ms`, strokeDasharray: `${w.len * d} ${y}`, strokeDashoffset: -w.offset }
              },
              w.key
            ))
          ] }),
          o ? /* @__PURE__ */ e("span", { className: "hf-ring__building", children: "Building — first score after your first review" }) : /* @__PURE__ */ e("span", { className: "hf-ring__num hf-num", "aria-hidden": "true", children: u })
        ] }),
        /* @__PURE__ */ i("div", { style: { flex: 1, minWidth: 0 }, children: [
          !o && /* @__PURE__ */ i("span", { className: T("hf-band", Q(C.tone)), children: [
            C.icon,
            " ",
            C.label
          ] }),
          s && /* @__PURE__ */ e("p", { className: "hf-factor__status", children: s }),
          S && t && B !== "ok" && /* @__PURE__ */ i("p", { className: "hf-factor__warn", children: [
            S.score,
            " conduct points left",
            B === "risk" ? " · formal warning stage" : ""
          ] }),
          /* @__PURE__ */ e("div", { className: "hf-legend", children: n.map((w) => /* @__PURE__ */ i("div", { className: Q(w.tone), children: [
            /* @__PURE__ */ e("i", { "aria-hidden": "true" }),
            /* @__PURE__ */ e("span", { children: w.label }),
            /* @__PURE__ */ e("span", { className: "hf-legend__n", children: w.balance ? `${w.score}/${w.max} left` : `${w.score}/${w.max}` })
          ] }, w.key)) })
        ] })
      ] }),
      l.length >= 2 && /* @__PURE__ */ i("div", { className: "hf-spark", children: [
        /* @__PURE__ */ e(Rn, { history: l }),
        /* @__PURE__ */ e("div", { children: z !== null && /* @__PURE__ */ i(M, { children: [
          /* @__PURE__ */ i("b", { children: [
            z >= 0 ? "+" : "",
            z
          ] }),
          " over ",
          l.length,
          " months"
        ] }) })
      ] }),
      /* @__PURE__ */ i("span", { className: "hf-factor__cta", "aria-hidden": "true", children: [
        /* @__PURE__ */ e("span", { children: "See how it's built" }),
        /* @__PURE__ */ e("span", { children: /* @__PURE__ */ e(E, { size: 20 }) })
      ] })
    ] }),
    /* @__PURE__ */ i(se, { open: h, onClose: () => A(!1), title: c, subtitle: o ? "How it will be built" : `How your ${k} is built`, children: [
      /* @__PURE__ */ e("p", { className: "hf-muted", style: { margin: "0 0 20px", fontSize: 14, lineHeight: 1.6 }, children: "One number that brings together your performance, your conduct and your learning. Only you, your management line, HR and the directors can see it, and it is never compared with anyone else." }),
      /* @__PURE__ */ e("div", { className: "hf-break", children: n.map((w) => {
        const I = Math.round(w.score / w.max * 100), H = Math.round(w.weight / _ * 100), G = w.balance ? B === "ok" ? "brand" : B === "watch" ? "warn" : "danger" : w.tone;
        return /* @__PURE__ */ i("div", { className: Q(G), children: [
          /* @__PURE__ */ i("div", { className: "hf-break__head", children: [
            /* @__PURE__ */ i("b", { children: [
              w.label,
              " ",
              /* @__PURE__ */ i("small", { children: [
                "· ",
                H,
                "% of score"
              ] })
            ] }),
            /* @__PURE__ */ e("b", { className: "hf-num", style: { fontWeight: 600 }, children: w.balance ? `${w.score} of ${w.max} left` : `${w.score}/${w.max}` })
          ] }),
          /* @__PURE__ */ i("div", { className: "hf-break__bar", role: "img", "aria-label": `${w.label}: ${I}%`, children: [
            /* @__PURE__ */ e("i", { style: { width: `${I}%` } }),
            w.balance && t && /* @__PURE__ */ e("span", { className: "hf-break__mark", style: { left: `${Math.round(t.formalWarning / w.max * 100)}%` }, title: `Below ${t.formalWarning} points: formal warning` })
          ] }),
          /* @__PURE__ */ e("p", { className: "hf-break__hint", children: w.hint })
        ] }, w.key);
      }) }),
      s && /* @__PURE__ */ i("div", { className: "hf-note", children: [
        /* @__PURE__ */ e(We, { size: 14, style: { flex: "none", marginTop: 2 } }),
        /* @__PURE__ */ i("span", { children: [
          s,
          ". Your reporting manager will confirm each checkpoint with you."
        ] })
      ] }),
      r.length > 0 && /* @__PURE__ */ i("div", { className: "hf-improve", children: [
        /* @__PURE__ */ e("h4", { children: "What would move it up" }),
        /* @__PURE__ */ e("ol", { children: r.map((w, I) => /* @__PURE__ */ i("li", { children: [
          /* @__PURE__ */ e("i", { children: I + 1 }),
          /* @__PURE__ */ e("span", { children: w })
        ] }, I)) })
      ] })
    ] })
  ] });
}
function he({ tone: n, icon: a, value: t, label: s, pulse: l, hint: r, onClick: o }) {
  return /* @__PURE__ */ i(o ? "button" : "div", { className: T("hf-tile hf-press", Q(n)), onClick: o, type: o ? "button" : void 0, children: [
    /* @__PURE__ */ i("div", { className: "hf-tile__top", children: [
      /* @__PURE__ */ i("span", { className: "hf-tile__ic", children: [
        a,
        l && /* @__PURE__ */ e("span", { className: "hf-tile__pulse", "aria-hidden": "true" })
      ] }),
      r && /* @__PURE__ */ e(O, { text: r })
    ] }),
    /* @__PURE__ */ i("div", { children: [
      /* @__PURE__ */ e("span", { className: "hf-tile__value hf-num", children: t }),
      /* @__PURE__ */ e("span", { className: "hf-tile__label hf-clamp-2", children: s })
    ] })
  ] });
}
function Ja({ score: n, max: a, policy: t, label: s = "Conduct points left", hint: l, onClick: r }) {
  const o = !t || n >= t.warn ? "ok" : n >= t.formalWarning ? "watch" : "risk", c = o === "ok" ? "brand" : o === "watch" ? "warn" : "danger", h = o === "ok" ? "" : o === "watch" ? " · take care" : " · urgent", A = l ?? `Conduct points are a balance. Everyone starts with ${a}. A recorded issue deducts points; at 0 the contract ends. A clean record restores points over time.${t ? ` Fewer than ${t.formalWarning} means a formal warning.` : ""}`;
  return /* @__PURE__ */ i(
    r ? "button" : "div",
    {
      className: T("hf-tile hf-press", Q(c)),
      onClick: r,
      type: r ? "button" : void 0,
      "aria-label": `${s}: ${n} of ${a}${h}`,
      children: [
        /* @__PURE__ */ i("div", { className: "hf-tile__top", children: [
          /* @__PURE__ */ e("span", { className: "hf-tile__ic", children: /* @__PURE__ */ e(Sn, { size: 18 }) }),
          /* @__PURE__ */ e(O, { text: A })
        ] }),
        /* @__PURE__ */ i("div", { children: [
          /* @__PURE__ */ i("span", { className: "hf-tile__value hf-num", children: [
            n,
            /* @__PURE__ */ i("small", { children: [
              " / ",
              a
            ] })
          ] }),
          /* @__PURE__ */ e("span", { className: "hf-pips", "aria-hidden": "true", children: Array.from({ length: a }, (b, u) => /* @__PURE__ */ e("i", { className: u < Math.floor(n) ? "on" : "" }, u)) }),
          /* @__PURE__ */ i("span", { className: "hf-tile__label hf-clamp-2", children: [
            s,
            h
          ] })
        ] })
      ]
    }
  );
}
function Za({ children: n, wrap: a = !0, label: t }) {
  return /* @__PURE__ */ e("div", { className: T("hf-tiles", a && "hf-tiles--wrap"), role: t ? "group" : void 0, "aria-label": t, children: n });
}
const Yn = {
  joiner: { icon: /* @__PURE__ */ e(me, { size: 20 }), tone: "sky" },
  induction: { icon: /* @__PURE__ */ e(pe, { size: 20 }), tone: "brand" },
  probation: { icon: /* @__PURE__ */ e($e, { size: 20 }), tone: "brand" },
  anniversary: { icon: /* @__PURE__ */ e(tn, { size: 20 }), tone: "pop" },
  kudos: { icon: /* @__PURE__ */ e(Dn, { size: 20 }), tone: "pop" }
};
function Ie({ item: n, onReact: a }) {
  var o, c;
  if (n.type === "pinned")
    return /* @__PURE__ */ i("article", { className: "hf hf-card hf-pinned", children: [
      /* @__PURE__ */ i("div", { className: "hf-pinned__tag", children: [
        /* @__PURE__ */ e(en, { size: 12 }),
        " Pinned by HR"
      ] }),
      n.title && /* @__PURE__ */ e("h4", { children: n.title }),
      /* @__PURE__ */ e("p", { children: n.text })
    ] });
  const { icon: t, tone: s } = Yn[n.type], l = !!((o = n.mine) != null && o.like), r = !!((c = n.mine) != null && c.clap);
  return /* @__PURE__ */ i("article", { className: T("hf hf-card hf-feedcard", Q(s)), children: [
    /* @__PURE__ */ i("div", { className: "hf-feedcard__row", children: [
      /* @__PURE__ */ e("span", { className: "hf-feedcard__ic", "aria-hidden": "true", children: t }),
      /* @__PURE__ */ i("div", { style: { minWidth: 0 }, children: [
        /* @__PURE__ */ e("p", { className: "hf-feedcard__text", children: n.text }),
        n.from && /* @__PURE__ */ i("p", { className: "hf-feedcard__from", children: [
          "— from the ",
          n.from
        ] }),
        /* @__PURE__ */ e("p", { className: "hf-feedcard__when", children: n.when })
      ] })
    ] }),
    a && /* @__PURE__ */ i("div", { className: "hf-feedcard__acts", children: [
      /* @__PURE__ */ i("button", { type: "button", className: "hf-react", "aria-pressed": l, "aria-label": `Thumbs up, ${n.likes}`, onClick: () => a(n.id, "like"), children: [
        /* @__PURE__ */ e(nn, { size: 14 }),
        " ",
        n.likes
      ] }),
      /* @__PURE__ */ i("button", { type: "button", className: "hf-react", "aria-pressed": r, "aria-label": `Clap, ${n.claps}`, onClick: () => a(n.id, "clap"), children: [
        /* @__PURE__ */ e(K, { size: 14 }),
        " ",
        n.claps
      ] })
    ] })
  ] });
}
function Qn({ onKudos: n }) {
  return /* @__PURE__ */ i("div", { className: "hf hf-card hf-feed__quiet hf-tone-brand", children: [
    /* @__PURE__ */ e("span", { className: "hf-feedcard__ic", "aria-hidden": "true", children: /* @__PURE__ */ e(an, { size: 20 }) }),
    /* @__PURE__ */ e("p", { className: "hf-display", children: "Nothing new since yesterday" }),
    /* @__PURE__ */ e("p", { className: "hf-muted", children: "A quiet day across HiFive. New joiners, inductions and kudos appear here as they happen." }),
    n && /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: n, children: "Be the first — give kudos" })
  ] });
}
function Ga({ items: n, onReact: a, onKudos: t }) {
  const s = n.filter((r) => r.type === "pinned"), l = n.filter((r) => r.type !== "pinned");
  return /* @__PURE__ */ i("div", { className: "hf-feed", "data-tour": "feed", children: [
    s.map((r) => /* @__PURE__ */ e(Ie, { item: r }, r.id)),
    l.length === 0 ? /* @__PURE__ */ e(Qn, { onKudos: t }) : l.map((r) => /* @__PURE__ */ e(Ie, { item: r, onReact: a }, r.id))
  ] });
}
function Vn(n, a, t = 8) {
  const s = a.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return s.length ? n.filter((l) => {
    const r = l.name.toLowerCase().split(/\s+/);
    return s.every((o) => r.some((c) => c.startsWith(o)));
  }).slice(0, t) : [];
}
function cn(n) {
  const a = n.trim().split(/\s+/).filter(Boolean);
  return a.length ? a[0].endsWith(".") && a[1] ? `${a[0]} ${a[1]}` : a[0] : n;
}
const Le = {
  "hifive-id": { lucide: "shield-check", nodes: [["path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" }], ["path", { d: "m9 12 2 2 4-4" }]] },
  performance: { lucide: "trending-up", nodes: [["polyline", { points: "22 7 13.5 15.5 8.5 10.5 2 17" }], ["polyline", { points: "16 7 22 7 22 13" }]] },
  todo: { lucide: "square-check", nodes: [["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }], ["path", { d: "m9 12 2 2 4-4" }]] },
  recruitment: { lucide: "user-check", nodes: [["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }], ["circle", { cx: "9", cy: "7", r: "4" }], ["polyline", { points: "16 11 18 13 22 9" }]] },
  lms: { lucide: "book-open", nodes: [["path", { d: "M12 7v14" }], ["path", { d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" }]] },
  apml: { lucide: "phone-call", nodes: [["path", { d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" }], ["path", { d: "M14.05 2a9 9 0 0 1 8 7.94" }], ["path", { d: "M14.05 6A5 5 0 0 1 18 10" }]] },
  transport: { lucide: "route", nodes: [["circle", { cx: "6", cy: "19", r: "3" }], ["path", { d: "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" }], ["circle", { cx: "18", cy: "5", r: "3" }]] },
  inventory: { lucide: "package", nodes: [["path", { d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" }], ["path", { d: "M12 22V12" }], ["path", { d: "m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" }], ["path", { d: "m7.5 4.27 9 5.15" }]] },
  perspectives: { lucide: "compass", nodes: [["path", { d: "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z" }], ["circle", { cx: "12", cy: "12", r: "10" }]] }
}, Jn = [
  { key: "hifive-id", short: "HiFive ID", full: "HiFive ID", hub: !0 },
  { key: "performance", short: "Performance", full: "Performance Hub", hub: !0 },
  { key: "todo", short: "To-Do", full: "To-Do", hub: !0 },
  { key: "recruitment", short: "Recruitment", full: "Recruitment Portal", hub: !0 },
  { key: "lms", short: "Learning Point", full: "HiFive Learning Point", hub: !0 },
  { key: "apml", short: "APML Tracker", full: "APML Tracker", hub: !0 },
  { key: "transport", short: "Logistics", full: "Accuracy Plus Logistics", hub: !0 },
  { key: "inventory", short: "Inventory", full: "HiFive Inventory", hub: !0 },
  { key: "perspectives", short: "Perspectives", full: "Leadership Perspectives", hub: !1 }
], on = (n) => Le[n] ?? Le["hifive-id"], hn = (n) => Jn.find((a) => a.key === n) ?? null, dn = "M50,0 C88,0 100,12 100,50 C100,88 88,100 50,100 C12,100 0,88 0,50 C0,12 12,0 50,0 Z", ie = (n) => String(n).replace(/[&<>"]/g, (a) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[a]);
function Zn(n) {
  return on(n).nodes.map(([a, t]) => `<${a} ${Object.entries(t).map(([s, l]) => `${s}="${ie(l)}"`).join(" ")}/>`).join("");
}
function An(n = "tile") {
  const a = n === "maskable" ? 42 : 56;
  return { at: (100 - a) / 2, scale: a / 24 };
}
function Xa(n, { size: a = 64, shape: t = "tile", tile: s = "var(--primary, #024ea3)", mark: l = "var(--on-primary, #ffffff)", title: r } = {}) {
  var b;
  const { at: o, scale: c } = An(t), h = a <= 24 ? 2.4 : 2, A = t === "tile" ? `<path d="${dn}" fill="${ie(s)}"/>` : `<rect width="100" height="100" fill="${ie(s)}"/>`, d = r ?? ((b = hn(n)) == null ? void 0 : b.full) ?? "HiFive";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${a}" height="${a}" viewBox="0 0 100 100" role="img" aria-label="${ie(d)}">` + A + `<g transform="translate(${o} ${o}) scale(${c})" fill="none" stroke="${ie(l)}" stroke-width="${h}" stroke-linecap="round" stroke-linejoin="round">${Zn(n)}</g></svg>`;
}
function fn({ app: n, size: a = 48, label: t, className: s }) {
  const { at: l, scale: r } = An("tile"), o = a <= 24 ? 2.4 : 2;
  return /* @__PURE__ */ i(
    "svg",
    {
      className: s ? `hf-applogo ${s}` : "hf-applogo",
      width: a,
      height: a,
      viewBox: "0 0 100 100",
      role: t ? "img" : void 0,
      "aria-label": t,
      "aria-hidden": t ? void 0 : !0,
      focusable: "false",
      children: [
        /* @__PURE__ */ e("path", { d: dn, fill: "var(--primary)" }),
        /* @__PURE__ */ e("g", { transform: `translate(${l} ${l}) scale(${r})`, fill: "none", stroke: "var(--on-primary)", strokeWidth: o, strokeLinecap: "round", strokeLinejoin: "round", children: on(n).nodes.map(([c, h], A) => wn(c, { key: A, ...h })) })
      ]
    }
  );
}
function Ka({ app: n, size: a = 52, name: t }) {
  var s;
  return /* @__PURE__ */ i("span", { className: "hf-applogo-tile", children: [
    /* @__PURE__ */ e(fn, { app: n, size: a }),
    /* @__PURE__ */ e("span", { className: "hf-applogo-tile__name", children: t ?? ((s = hn(n)) == null ? void 0 : s.short) ?? n })
  ] });
}
const Gn = { learning: "lms", logistics: "transport", admin: "hifive-id", "hifive id": "hifive-id" };
function le({ app: n, size: a = 40, label: t }) {
  const s = String(n ?? "").trim().toLowerCase();
  return /* @__PURE__ */ e(fn, { app: Gn[s] ?? s, size: a, label: t });
}
const Ee = ["brand", "sky", "pop", "ink"];
function q({ name: n, size: a = 32, ring: t, photo: s }) {
  const r = n.trim().split(/\s+/).slice(0, t || a < 32 ? 1 : 2).map((c) => c[0]).join("").toUpperCase(), o = Ee[[...n].reduce((c, h) => c + h.charCodeAt(0), 0) % Ee.length];
  return /* @__PURE__ */ e("span", { className: `hf-av hf-av--${o}${t ? " hf-av--ring" : ""}`, style: { width: a, height: a, fontSize: Math.round(a * 0.38) }, "aria-hidden": "true", children: s ? /* @__PURE__ */ e("img", { src: s, alt: "" }) : r });
}
function et({ onClick: n }) {
  return /* @__PURE__ */ i("button", { type: "button", className: "hf hf-card hf-kudos-btn hf-press", onClick: n, "aria-haspopup": "dialog", children: [
    /* @__PURE__ */ e("span", { className: "hf-kudos-btn__ic", "aria-hidden": "true", children: /* @__PURE__ */ e(K, { size: 16 }) }),
    "Give kudos to a colleague",
    /* @__PURE__ */ e(E, { size: 16 })
  ] });
}
function nt({ open: n, onClose: a, people: t, onSend: s }) {
  const [l, r] = v(""), [o, c] = v(""), h = ee(() => Vn(t, o), [t, o]), A = t.find((m) => m.id === l) ?? null, [d, b] = v(""), [u, N] = v({}), [k, f] = v(!1);
  async function p() {
    const m = {};
    l || (m.to = "Choose who the kudos is for");
    const _ = d.trim();
    if (_.length < 4 && (m.msg = "Add a few words about what they did"), _.length > 280 && (m.msg = "Keep it under 280 characters"), N(m), m.to || m.msg) return;
    const x = t.find((y) => y.id === l);
    f(!0);
    try {
      await s(x, _), r(""), c(""), b(""), a();
    } catch (y) {
      N({ msg: y instanceof Error && y.message ? y.message : "That didn't send. Try again, or tell HR." });
    } finally {
      f(!1);
    }
  }
  return /* @__PURE__ */ i(se, { open: n, onClose: a, title: "Give kudos", children: [
    /* @__PURE__ */ i("div", { className: `hf-field${u.to ? " hf-field--error" : ""}`, children: [
      /* @__PURE__ */ e("label", { htmlFor: "hf-kudos-who", children: /* @__PURE__ */ e("span", { children: "Who" }) }),
      A ? /* @__PURE__ */ i("div", { className: "hf-who", children: [
        /* @__PURE__ */ e(q, { name: A.name, size: 32 }),
        /* @__PURE__ */ i("span", { className: "hf-who__txt", children: [
          /* @__PURE__ */ e("b", { children: A.name }),
          A.detail && /* @__PURE__ */ e("span", { children: A.detail })
        ] }),
        /* @__PURE__ */ e("button", { type: "button", className: "hf-who__x", "aria-label": `Change from ${A.name}`, onClick: () => {
          r(""), c("");
        }, children: /* @__PURE__ */ e(ue, { size: 16 }) })
      ] }) : /* @__PURE__ */ i(M, { children: [
        /* @__PURE__ */ i("div", { className: "hf-who__search", children: [
          /* @__PURE__ */ e(Se, { size: 16, "aria-hidden": "true" }),
          /* @__PURE__ */ e(
            "input",
            {
              id: "hf-kudos-who",
              type: "search",
              value: o,
              autoComplete: "off",
              placeholder: t.length ? "Type a name" : "Loading colleagues…",
              onChange: (m) => c(m.target.value),
              "aria-invalid": !!u.to,
              "aria-controls": "hf-kudos-matches",
              disabled: !t.length
            }
          )
        ] }),
        o.trim() && /* @__PURE__ */ i("ul", { id: "hf-kudos-matches", className: "hf-who__list", "aria-label": "Matching colleagues", children: [
          h.map((m) => /* @__PURE__ */ e("li", { children: /* @__PURE__ */ i("button", { type: "button", className: "hf-who__opt", onClick: () => {
            r(m.id), N((_) => ({ ..._, to: void 0 }));
          }, children: [
            /* @__PURE__ */ e(q, { name: m.name, size: 28 }),
            /* @__PURE__ */ i("span", { className: "hf-who__txt", children: [
              /* @__PURE__ */ e("b", { children: m.name }),
              m.detail && /* @__PURE__ */ e("span", { children: m.detail })
            ] })
          ] }) }, m.id)),
          !h.length && /* @__PURE__ */ e("li", { className: "hf-who__none", children: "Nobody by that name. Check the spelling, or try their first name." })
        ] })
      ] }),
      u.to && /* @__PURE__ */ e("p", { className: "hf-field__err", role: "alert", children: u.to })
    ] }),
    /* @__PURE__ */ i("label", { className: `hf-field${u.msg ? " hf-field--error" : ""}`, children: [
      /* @__PURE__ */ e("span", { children: "What did they do?" }),
      /* @__PURE__ */ e(
        "textarea",
        {
          value: d,
          onChange: (m) => b(m.target.value),
          rows: 3,
          maxLength: 300,
          "aria-invalid": !!u.msg,
          placeholder: "Stayed late to help a patient find the right product"
        }
      ),
      /* @__PURE__ */ i("p", { className: "hf-field__count", "aria-live": "polite", children: [
        d.trim().length,
        " / 280"
      ] }),
      u.msg && /* @__PURE__ */ e("p", { className: "hf-field__err", role: "alert", children: u.msg })
    ] }),
    /* @__PURE__ */ e("p", { className: "hf-muted", style: { fontSize: 12, margin: "0 0 16px" }, children: "Kudos appear in the feed for everyone in HiFive after HR approves them, usually the same day." }),
    /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--primary", onClick: p, disabled: k, children: k ? "Sending…" : "Send kudos" })
  ] });
}
function at({ rows: n, label: a = "Status" }) {
  return n.length ? /* @__PURE__ */ e("section", { className: "hf hf-card hf-rows", "aria-label": a, children: n.map((t) => /* @__PURE__ */ i("div", { className: "hf-row", children: [
    /* @__PURE__ */ e("span", { className: "hf-row__ic", "aria-hidden": "true", children: t.icon }),
    /* @__PURE__ */ i("span", { className: "hf-row__label", children: [
      t.label,
      t.hint && /* @__PURE__ */ e(O, { text: t.hint })
    ] }),
    t.value && /* @__PURE__ */ e("span", { className: "hf-row__value", children: t.value }),
    t.action && (t.action.href ? /* @__PURE__ */ e("a", { className: "hf-row__action", href: t.action.href, children: t.action.label }) : /* @__PURE__ */ e("button", { type: "button", className: "hf-row__action", onClick: t.action.onClick, children: t.action.label }))
  ] }, t.key)) }) : null;
}
function tt({ ok: n }) {
  return /* @__PURE__ */ e("span", { className: "hf-dot", style: n ? void 0 : { background: "rgb(var(--warn))" }, "aria-hidden": "true" });
}
const Xn = {
  factor_band: /* @__PURE__ */ e(pe, { size: 24 }),
  probation_confirmed: /* @__PURE__ */ e(tn, { size: 24 }),
  induction_complete: /* @__PURE__ */ e($e, { size: 24 }),
  anniversary: /* @__PURE__ */ e(Wn, { size: 24 }),
  kudos: /* @__PURE__ */ e(K, { size: 24 })
};
function it({ type: n, title: a, detail: t, onDismiss: s }) {
  return /* @__PURE__ */ i("section", { className: "hf hf-card hf-celebrate", "aria-live": "polite", "aria-label": "A moment worth noting", children: [
    /* @__PURE__ */ e("div", { className: "hf-confetti", "aria-hidden": "true", children: Array.from({ length: 14 }).map((l, r) => /* @__PURE__ */ e("i", { style: {
      left: `${r * 7.3 % 100}%`,
      animationDelay: `${r % 7 * 0.18}s`,
      background: r % 3 === 0 ? "rgb(var(--pop-400))" : r % 3 === 1 ? "rgb(var(--brand-400))" : "rgb(var(--sky-400))"
    } }, r)) }),
    /* @__PURE__ */ i("div", { className: "hf-celebrate__row", children: [
      /* @__PURE__ */ e("span", { className: "hf-celebrate__ic", "aria-hidden": "true", children: Xn[n] }),
      /* @__PURE__ */ i("div", { className: "hf-celebrate__body", style: { flex: 1, minWidth: 0 }, children: [
        /* @__PURE__ */ i("p", { className: "hf-celebrate__cap", children: [
          "A moment worth noting ",
          /* @__PURE__ */ e(O, { text: "Shown once a day, only when something changed for you: a Factor band, a probation decision, an induction completed or an anniversary." })
        ] }),
        /* @__PURE__ */ e("h2", { className: "hf-display hf-celebrate__h", children: a }),
        t && /* @__PURE__ */ e("p", { className: "hf-celebrate__p", children: t })
      ] }),
      /* @__PURE__ */ e("button", { type: "button", className: "hf-celebrate__x", onClick: s, "aria-label": "Dismiss", children: /* @__PURE__ */ e(ue, { size: 18 }) })
    ] })
  ] });
}
const X = { side: "hifive-dock-side", top: "hifive-dock-top", tip: "hifive-dock-tip" }, ge = (n) => {
  try {
    return localStorage.getItem(n);
  } catch {
    return null;
  }
}, Ne = (n, a) => {
  try {
    localStorage.setItem(n, a);
  } catch {
  }
};
function st({ apps: n }) {
  const a = U(null), t = U(null), [s, l] = v(() => ge(X.side) === "left" ? "left" : "right"), [r, o] = v(() => Number(ge(X.top)) || 50), [c, h] = v(() => !ge(X.tip)), A = U(!1), d = () => {
    h(!1), Ne(X.tip, "1");
  };
  L(() => {
    Ne(X.side, s), Ne(X.top, String(r));
  }, [s, r]);
  const b = (k) => {
    const f = a.current;
    if (!f) return;
    const p = f.getBoundingClientRect();
    t.current = { x: k.clientX, y: k.clientY, left: p.left, top: p.top, moved: !1 };
  }, u = (k) => {
    const f = t.current, p = a.current;
    if (!f || !p) return;
    const m = k.clientX - f.x, _ = k.clientY - f.y;
    if (!f.moved) {
      if (Math.abs(m) + Math.abs(_) <= 6) return;
      f.moved = !0, p.setPointerCapture(k.pointerId), p.classList.add("dragging");
    }
    p.style.transform = "none", p.style.left = `${f.left + m}px`, p.style.right = "auto", p.style.top = `${f.top + _}px`;
  }, N = () => {
    const k = t.current, f = a.current;
    if (t.current = null, !k || !f || !k.moved) return;
    f.classList.remove("dragging");
    const p = f.getBoundingClientRect(), m = p.left + p.width / 2 < window.innerWidth / 2 ? "left" : "right", _ = Math.round(Math.min(90, Math.max(10, (p.top + p.height / 2) / window.innerHeight * 100)));
    f.style.transform = "", f.style.left = "", f.style.right = "", f.style.top = `${_}%`, l(m), o(_), d(), A.current = !0, setTimeout(() => {
      A.current = !1;
    }, 50);
  };
  return /* @__PURE__ */ i(M, { children: [
    c && /* @__PURE__ */ e("div", { className: "hf hf-dock__scrim", "aria-hidden": "true", onClick: d }),
    /* @__PURE__ */ i(
      "nav",
      {
        ref: a,
        className: T("hf hf-dock", `hf-dock--${s}`),
        "aria-label": "Your apps",
        style: { top: `${r}%` },
        onPointerDown: b,
        onPointerMove: u,
        onPointerUp: N,
        onPointerCancel: N,
        "data-tour": "apps",
        children: [
          /* @__PURE__ */ i("span", { className: "hf-dock__grip", "aria-hidden": "true", children: [
            /* @__PURE__ */ e("i", {}),
            /* @__PURE__ */ e("i", {}),
            /* @__PURE__ */ e("i", {})
          ] }),
          c && /* @__PURE__ */ i("div", { className: "hf-dock__tip", role: "status", children: [
            /* @__PURE__ */ e("b", { children: "Your apps live here." }),
            " Drag this bar to move it to the other side.",
            /* @__PURE__ */ e("button", { type: "button", onClick: (k) => {
              k.stopPropagation(), d();
            }, children: "Got it" })
          ] }),
          n.map((k) => /* @__PURE__ */ i(
            "button",
            {
              type: "button",
              className: "hf-dock__btn hf-dock__btn--mark",
              "aria-label": k.label,
              onClick: (f) => {
                if (A.current) {
                  f.preventDefault();
                  return;
                }
                k.onOpen();
              },
              children: [
                /* @__PURE__ */ e(le, { app: k.key, size: 44 }),
                /* @__PURE__ */ e("span", { className: "hf-dock__label", "aria-hidden": "true", children: k.label })
              ]
            },
            k.key
          ))
        ]
      }
    )
  ] });
}
function lt({ apps: n, hideOnDesktop: a = !0 }) {
  return /* @__PURE__ */ e("section", { className: T("hf", a && "hf-apps--hide-desktop"), "aria-label": "Your apps", "data-tour": "apps", children: /* @__PURE__ */ i("div", { className: "hf-card hf-apps2", children: [
    /* @__PURE__ */ i("h3", { className: "hf-cap hf-apps2__head", children: [
      "Your apps ",
      /* @__PURE__ */ e(O, { text: "Every HiFive app you can open. On a computer they sit in the floating dock at the side." })
    ] }),
    /* @__PURE__ */ e("div", { className: "hf-apps2__grid", children: n.map((t) => /* @__PURE__ */ i("button", { type: "button", className: "hf-app2 hf-press", onClick: t.onOpen, children: [
      /* @__PURE__ */ e(le, { app: t.key, size: 52 }),
      /* @__PURE__ */ e("span", { className: "hf-app2__label hf-truncate", title: t.label, children: t.label })
    ] }, t.key)) })
  ] }) });
}
const Kn = [
  ["water", "Water"],
  ["air", "Air"],
  ["earth", "Earth"],
  ["fire", "Fire"],
  ["luna", "Luna"],
  ["sol", "Sol"],
  ["aami", "Aami"],
  ["aadi", "Aadi"]
], Ue = {
  water: ["#025EC4", "#0ECCED"],
  air: ["#15A898", "#33363B"],
  earth: ["#2F7A5A", "#8A5A34"],
  fire: ["#AF2610", "#4C2325"],
  luna: ["#26658C", "#54ACBF"],
  sol: ["#FBB931", "#EA6113"],
  aami: ["#610C9F", "#DA0C81"],
  aadi: ["#17566F", "#AF3D41"]
}, Ae = { skin: "water", style: "soft", mode: "light" };
function ea() {
  const n = document.documentElement;
  return {
    skin: n.getAttribute("data-skin") || Ae.skin,
    style: n.getAttribute("data-style") || Ae.style,
    mode: n.getAttribute("data-theme") || Ae.mode
  };
}
function na(n) {
  const a = document.documentElement;
  if (window.hifiveTheme) {
    window.hifiveTheme.set(n);
    return;
  }
  n.skin && a.setAttribute("data-skin", n.skin), n.style && a.setAttribute("data-style", n.style), n.mode && (a.setAttribute("data-theme", n.mode), a.classList.toggle("dark", n.mode === "dark"));
}
function He({ label: n, value: a, options: t, onPick: s }) {
  return /* @__PURE__ */ i("div", { className: "hf-ap__row", children: [
    /* @__PURE__ */ e("p", { className: "hf-cap", style: { margin: "0 0 8px" }, children: n }),
    /* @__PURE__ */ e("div", { className: "hf-seg", role: "group", "aria-label": n, children: t.map(([l, r]) => /* @__PURE__ */ e("button", { type: "button", "aria-pressed": a === l, onClick: () => s(l), children: r }, l)) })
  ] });
}
function rt({ open: n, onClose: a, onSave: t, onReplayTour: s }) {
  const [l, r] = v(() => typeof document > "u" ? Ae : ea()), [o, c] = v("idle"), h = U(null);
  function A(d) {
    r((b) => ({ ...b, ...d })), na(d), t && (c("saving"), h.current && window.clearTimeout(h.current), h.current = window.setTimeout(async () => c(await t(d) ? "saved" : "failed"), 500));
  }
  return /* @__PURE__ */ i(se, { open: n, onClose: a, title: "Appearance", children: [
    /* @__PURE__ */ i("div", { className: "hf-ap__row", children: [
      /* @__PURE__ */ e("p", { className: "hf-cap", style: { margin: "0 0 10px" }, children: "Colours" }),
      /* @__PURE__ */ e("div", { className: "hf-swatches", role: "radiogroup", "aria-label": "Colours", children: Kn.map(([d, b]) => /* @__PURE__ */ i("button", { type: "button", role: "radio", "aria-checked": l.skin === d, className: "hf-swatch", onClick: () => A({ skin: d }), children: [
        /* @__PURE__ */ e("span", { className: "hf-swatch__dot", style: { background: `linear-gradient(135deg, ${Ue[d][0]} 0 52%, ${Ue[d][1]} 52% 100%)` }, children: l.skin === d && /* @__PURE__ */ e(Y, { size: 18, strokeWidth: 3 }) }),
        /* @__PURE__ */ e("span", { className: "hf-swatch__name", children: b })
      ] }, d)) })
    ] }),
    /* @__PURE__ */ i("div", { className: "hf-ap__pair", children: [
      /* @__PURE__ */ e(He, { label: "Style", value: l.style, options: [["lit", "Lit"], ["soft", "Soft"]], onPick: (d) => A({ style: d }) }),
      /* @__PURE__ */ e(He, { label: "Mode", value: l.mode, options: [["light", "Light"], ["dark", "Dark"]], onPick: (d) => A({ mode: d }) })
    ] }),
    /* @__PURE__ */ e("p", { className: "hf-ap__note", "aria-live": "polite", children: o === "failed" ? "Changed here, but it didn't save to your profile. Try again, or tell HR." : o === "saved" ? "Saved. Your choice follows you to every HiFive app and device." : "Default is Water · Soft · Light. Your choice is kept on your profile, so it follows you." }),
    s && /* @__PURE__ */ e("div", { className: "hf-ap__replay", children: /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--secondary", onClick: () => {
      a(), s();
    }, children: "Replay the tour" }) })
  ] });
}
function ct({ onSearch: n, placeholder: a = "Search", id: t }) {
  const [s, l] = v(""), [r, o] = v([]), [c, h] = v(-1), [A, d] = v(!1), b = Z(), u = U(null);
  L(() => {
    if (!s.trim()) {
      o([]), d(!1);
      return;
    }
    return u.current && window.clearTimeout(u.current), u.current = window.setTimeout(async () => {
      try {
        const p = await n(s.trim());
        o(p), d(!0), h(p.length ? 0 : -1);
      } catch {
        o([]), d(!1);
      }
    }, 250), () => {
      u.current && window.clearTimeout(u.current);
    };
  }, [s, n]);
  const N = (p) => {
    d(!1), l(""), p.onPick ? p.onPick() : p.href && (window.location.href = p.href);
  }, k = (p) => {
    A && (p.key === "ArrowDown" && (p.preventDefault(), h((m) => Math.min(r.length - 1, m + 1))), p.key === "ArrowUp" && (p.preventDefault(), h((m) => Math.max(0, m - 1))), p.key === "Enter" && c >= 0 && (p.preventDefault(), N(r[c])), p.key === "Escape" && d(!1));
  }, f = ["People", "Apps", "Policies"];
  return /* @__PURE__ */ i("div", { className: "hf hf-search__wrap", children: [
    /* @__PURE__ */ i("form", { role: "search", className: "hf-search", onSubmit: (p) => p.preventDefault(), children: [
      /* @__PURE__ */ e(Se, { size: 18 }),
      /* @__PURE__ */ e(
        "input",
        {
          id: t,
          type: "search",
          value: s,
          onChange: (p) => l(p.target.value),
          onKeyDown: k,
          placeholder: a,
          "aria-label": "Search people, apps and policies",
          "aria-controls": A ? b : void 0,
          "aria-expanded": A,
          "aria-autocomplete": "list",
          role: "combobox"
        }
      ),
      s && /* @__PURE__ */ e("button", { type: "button", className: "hf-search__clear", onClick: () => l(""), "aria-label": "Clear", children: /* @__PURE__ */ e(ue, { size: 16 }) })
    ] }),
    A && /* @__PURE__ */ i("div", { className: "hf-search__results", id: b, role: "listbox", children: [
      r.length === 0 && /* @__PURE__ */ i("p", { className: "hf-search__group hf-muted", style: { margin: 0 }, children: [
        "Nothing matches “",
        s,
        "”."
      ] }),
      f.filter((p) => r.some((m) => m.group === p)).map((p) => /* @__PURE__ */ i("div", { children: [
        /* @__PURE__ */ e("p", { className: "hf-cap hf-search__group", style: { margin: 0 }, children: p }),
        r.map((m, _) => m.group === p && /* @__PURE__ */ i("button", { type: "button", role: "option", "aria-selected": _ === c, className: "hf-search__item", onMouseEnter: () => h(_), onClick: () => N(m), children: [
          /* @__PURE__ */ e("span", { className: "hf-truncate", title: m.title, children: m.title }),
          m.detail && /* @__PURE__ */ e("small", { className: "hf-truncate", title: m.detail, children: m.detail })
        ] }, `${p}-${_}`))
      ] }, p))
    ] })
  ] });
}
function ot({ firstName: n, day: a = 1, firstReview: t, top: s, induction: l, steps: r }) {
  const o = l != null && l.total ? Math.round(l.done / l.total * 100) : 0, c = a <= 7 ? `Day ${a} of your first week` : `Week ${Math.ceil(a / 7)} at HiFive`;
  return /* @__PURE__ */ i("section", { className: "hf hf-card hf-card--hero hf-joiner", "aria-label": "Your first week", "data-tour": "factor", children: [
    s === void 0 && /* @__PURE__ */ e("p", { className: "hf-joiner__day", children: c }),
    /* @__PURE__ */ i("h3", { className: "hf-display hf-joiner__h", children: [
      "Welcome, ",
      n
    ] }),
    /* @__PURE__ */ e("p", { className: "hf-joiner__p", children: s !== void 0 ? s : /* @__PURE__ */ i(M, { children: [
      "Your HiFive Factor starts after your first review",
      t ? ` in ${t}` : "",
      ". Until then, this is your week."
    ] }) }),
    l && l.total > 0 && /* @__PURE__ */ i(M, { children: [
      /* @__PURE__ */ i("div", { className: "hf-joiner__prog", children: [
        /* @__PURE__ */ e("span", { children: "Induction" }),
        /* @__PURE__ */ i("span", { className: "hf-num", style: { fontWeight: 600 }, children: [
          l.done,
          " of ",
          l.total,
          " ",
          l.unit ?? "modules"
        ] })
      ] }),
      /* @__PURE__ */ e("div", { className: "hf-bar", role: "progressbar", "aria-valuenow": o, "aria-valuemin": 0, "aria-valuemax": 100, "aria-label": "Induction progress", children: /* @__PURE__ */ e("i", { style: { width: `${o}%` } }) })
    ] }),
    /* @__PURE__ */ e("ul", { className: "hf-check", children: r.map((h) => /* @__PURE__ */ i("li", { className: h.state, children: [
      /* @__PURE__ */ e("span", { className: "hf-check__dot", "aria-hidden": "true", children: h.state === "done" && /* @__PURE__ */ e(Y, { size: 12 }) }),
      /* @__PURE__ */ e("span", { className: "hf-check__text", children: h.text }),
      h.detail && /* @__PURE__ */ e("span", { className: "hf-check__detail", children: h.detail }),
      h.action ? /* @__PURE__ */ e("a", { className: "hf-check__act", href: h.action.href, children: h.action.label }) : h.state === "next" && /* @__PURE__ */ e("span", { className: "hf-check__next", children: "Next" }),
      /* @__PURE__ */ e("span", { className: "hf-sr", children: h.state === "done" ? ", done" : h.state === "next" ? ", next" : ", to do" })
    ] }, h.text)) })
  ] });
}
const aa = [
  { selector: '[data-tour="topbar"]', title: "Your day, at the top", text: "Today’s date, a search for people and apps, and the gear for appearance settings." },
  { selector: '[data-tour="profile"]', title: "This is you", text: "Your card. Tap it any time to see exactly what you have access to." },
  { selector: '[data-tour="factor"]', title: "Your HiFive Factor", text: "One number built from performance, conduct and learning. Tap it to see how it’s built. Nobody else is compared with you here." },
  { selector: '[data-tour="month"]', title: "This month", text: "Only things that are yours to do or notice this month. When it’s quiet, it says so." },
  { selector: '[data-tour="team"]', title: "Your team", text: "The people who report to you. You see them; they don’t see each other’s standing.", when: (n) => !!n.isManager },
  { selector: '[data-tour="feed"]', title: "Happening at HiFive", text: "Joiners and milestones across the group, and kudos once they arrive. HR approves what is posted." },
  { selector: '[data-tour="apps"]', title: "Your apps", text: "Performance Hub, Recruitment, Learning Point and the rest open from here with your look carried across." },
  { selector: '[data-tour="status"]', title: "Waiting for you", text: "Letters, approvals and anything that needs your tap. Empty means nothing is waiting." },
  { selector: '[data-tour="know"]', title: "Know yourself", text: "Your personality profile from Learning Point. You, HR and the directors; your manager cannot open it." },
  { selector: '[data-tour="gear"]', title: "Make it yours", text: "Palette, Lit or Soft, light or dark. You can replay this tour from here whenever you like." }
], ta = {
  step: "Step {n} of {of}",
  skip: "Skip",
  back: "Back",
  next: "Next",
  finish: "Finish",
  doneTitle: "That’s your home page",
  doneText: "You’ve seen everything on it. You can replay this from the gear any time.",
  dontShow: "I understand, don’t show this again",
  done: "Done"
}, J = 10, de = 300, je = () => {
  var n;
  return typeof window < "u" && ((n = window.matchMedia) == null ? void 0 : n.call(window, "(prefers-reduced-motion: reduce)").matches);
};
function ia(n, a) {
  const [t, s] = v(null);
  return Qe(() => {
    if (!a || !n) return;
    const l = document.querySelector(n);
    if (!l) {
      s(null);
      return;
    }
    const r = () => {
      const c = l.getBoundingClientRect();
      s({ top: c.top, left: c.left, width: c.width, height: c.height });
    };
    l.scrollIntoView({ behavior: je() ? "auto" : "smooth", block: "center", inline: "nearest" });
    const o = setTimeout(r, je() ? 0 : 380);
    return r(), window.addEventListener("resize", r), window.addEventListener("scroll", r, !0), () => {
      clearTimeout(o), window.removeEventListener("resize", r), window.removeEventListener("scroll", r, !0);
    };
  }, [n, a]), t;
}
function ht({ open: n, steps: a = aa, context: t = {}, onSkip: s, onDone: l, labels: r, lang: o }) {
  const c = { ...ta, ...r || {} }, [h, A] = v([]);
  L(() => {
    n && A(a.filter((D) => (!D.when || D.when(t)) && document.querySelector(D.selector)));
  }, [n, a, t]);
  const [d, b] = v(0), [u, N] = v(!1), [k, f] = v(!0), p = h[d], m = ia((p == null ? void 0 : p.selector) ?? "", n && !u), _ = U(null);
  L(() => {
    n && (b(0), N(!1), f(!0));
  }, [n]);
  const x = ye(() => {
    d + 1 >= h.length ? N(!0) : b(d + 1);
  }, [d, h.length]), y = ye(() => {
    u ? N(!1) : d > 0 && b(d - 1);
  }, [d, u]);
  if (L(() => {
    if (!n) return;
    const D = (z) => {
      z.key === "Escape" ? (z.preventDefault(), s()) : (z.key === "ArrowRight" || z.key === "Enter") && !u ? (z.preventDefault(), x()) : z.key === "ArrowLeft" && (z.preventDefault(), y());
    };
    return window.addEventListener("keydown", D), () => window.removeEventListener("keydown", D);
  }, [n, u, x, y, s]), L(() => {
    var D;
    n && ((D = _.current) == null || D.focus());
  }, [n, d, u]), !n || !u && !p) return null;
  const P = window.innerWidth < 768, $ = window.innerWidth, C = window.innerHeight;
  if (u)
    return /* @__PURE__ */ e("div", { className: "hf hf-tour__scrim hf-tour__scrim--centre", role: "dialog", "aria-modal": "true", "aria-labelledby": "hf-tour-done", children: /* @__PURE__ */ i("div", { ref: _, tabIndex: -1, className: "hf-tour__card hf-tour__card--done", lang: o, children: [
      /* @__PURE__ */ e("h2", { id: "hf-tour-done", className: "hf-display hf-tour__title", style: { fontSize: 22 }, children: c.doneTitle }),
      /* @__PURE__ */ e("p", { className: "hf-tour__text", style: { fontSize: 15 }, children: c.doneText }),
      /* @__PURE__ */ i("label", { className: "hf-tour__tick", children: [
        /* @__PURE__ */ e("input", { type: "checkbox", checked: k, onChange: (D) => f(D.target.checked) }),
        c.dontShow
      ] }),
      /* @__PURE__ */ i("div", { className: "hf-tour__acts", children: [
        /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: y, children: c.back }),
        /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--primary", style: { width: "auto" }, onClick: () => l(k), children: c.done })
      ] })
    ] }) });
  const S = m ? { top: m.top - J, left: m.left - J, width: m.width + J * 2, height: m.height + J * 2 } : { inset: 0, borderRadius: 0, boxShadow: "none", background: "rgb(var(--ink-900) / .62)" };
  let B;
  if (P || !m)
    B = {
      left: "max(16px, env(safe-area-inset-left, 0px))",
      right: "max(16px, env(safe-area-inset-right, 0px))",
      bottom: m && m.top + m.height / 2 > C / 2 && m ? C - m.top + J + 12 : "calc(16px + env(safe-area-inset-bottom, 0px))"
    };
  else {
    const D = m.top + m.height + J + 12, z = C - m.top + J + 12, V = Math.min(Math.max(16, m.left + m.width / 2 - de / 2), $ - de - 16);
    B = D + 160 < C ? { top: D, left: V, width: de } : { bottom: z, left: V, width: de };
  }
  return /* @__PURE__ */ i("div", { className: "hf", children: [
    /* @__PURE__ */ e("div", { className: "hf-tour__spot", style: S, "aria-hidden": "true" }),
    /* @__PURE__ */ i("div", { ref: _, tabIndex: -1, role: "dialog", "aria-modal": "true", "aria-labelledby": "hf-tour-title", "aria-describedby": "hf-tour-text", className: "hf-tour__card", style: B, lang: o, children: [
      /* @__PURE__ */ e("p", { className: "hf-cap hf-tour__step", children: c.step.replace("{n}", String(d + 1)).replace("{of}", String(h.length)) }),
      /* @__PURE__ */ e("h2", { id: "hf-tour-title", className: "hf-display hf-tour__title", children: p.title }),
      /* @__PURE__ */ e("p", { id: "hf-tour-text", className: "hf-tour__text", children: p.text }),
      /* @__PURE__ */ i("div", { className: "hf-tour__acts", children: [
        /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: s, children: c.skip }),
        /* @__PURE__ */ i("span", { style: { display: "flex", gap: 8 }, children: [
          d > 0 && /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--secondary", style: { minHeight: 44 }, onClick: y, children: c.back }),
          /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--primary", style: { width: "auto", minHeight: 44 }, onClick: x, children: d + 1 >= h.length ? c.finish : c.next })
        ] })
      ] })
    ] })
  ] });
}
const Me = (n) => n === "phone" ? 2 : 4;
function sa(n) {
  return n.map((a, t) => [a, t]).sort((a, t) => t[0].priority - a[0].priority || a[1] - t[1]).map(([a]) => a);
}
function la(n, a) {
  const t = a === "phone" ? 0 : a === "tablet" ? 1 : 2, s = Me(a), l = n.map((r) => Math.max(1, Math.min(r.size[t], s)));
  if (a !== "desktop") {
    let r = 0;
    const o = (c) => {
      c >= 0 && r % s && (l[c] += s - r);
    };
    for (let c = 0; c < l.length; c++) {
      if (l[c] >= s) {
        o(c - 1), r = 0;
        continue;
      }
      r + l[c] > s && (o(c - 1), r = 0), r += l[c], r === s && (r = 0);
    }
    o(l.length - 1);
  }
  return l;
}
const ra = 44, qe = (n) => n.span === 1 && n.rows <= ra;
function ca(n, a) {
  const t = n.map((c) => ({ ...c })), s = Math.max(0, ...t.map((c) => c.row - 1 + c.rows)), l = Array.from({ length: a + 1 }, () => new Array(s + 2).fill(!1)), r = (c, h) => {
    for (let A = c.col; A < c.col + c.span; A++) for (let d = c.row; d < c.row + c.rows; d++) l[A][d] = h;
  }, o = (c, h, A) => {
    if (c < 1 || c > a) return !1;
    for (let d = h; d < h + A; d++) if (l[c][d]) return !1;
    return !0;
  };
  t.forEach((c) => r(c, !0));
  for (const c of t) {
    if (!qe(c)) continue;
    r(c, !1);
    let h = !1;
    for (let A = 1; A < c.row && !h; A++)
      for (let d = 1; d <= a && !h; d++)
        (A === 1 || l[d][A - 1]) && o(d, A, c.rows) && (c.col = d, c.row = A, h = !0);
    r(c, !0);
  }
  for (const c of t) {
    if (!qe(c)) continue;
    const h = { col: c.col, span: c.span };
    let A = c.col, d = c.span;
    for (; o(A + d, c.row, c.rows); ) d++;
    for (; o(A - 1, c.row, c.rows); )
      A--, d++;
    d !== h.span && (c.col = A, c.span = d, r(c, !0));
  }
  return t;
}
function oa(n, a, t, s = 40) {
  const l = Me(a), r = la(n, a), o = Array(l).fill(0), c = n.map((h, A) => {
    const d = r[A], b = Math.max(1, t[h.id] ?? s);
    let u = 0, N = 0, k = 1 / 0;
    for (let f = 0; f + d <= l; f++) {
      const p = o.slice(f, f + d), m = Math.max(...p), _ = p.reduce((x, y) => x + (m - y), 0);
      m + _ < k && (k = m + _, N = m, u = f);
    }
    for (let f = u; f < u + d; f++) o[f] = N + b;
    return { id: h.id, col: u + 1, row: N + 1, span: d, rows: b };
  });
  return ca(c, l);
}
const un = 4, Oe = () => typeof window > "u" || window.matchMedia("(min-width: 1024px)").matches ? "desktop" : window.matchMedia("(min-width: 768px)").matches ? "tablet" : "phone";
function ha() {
  const [n, a] = v(Oe);
  return L(() => {
    const t = ["(min-width: 1024px)", "(min-width: 768px)"].map((l) => window.matchMedia(l)), s = () => a(Oe());
    return t.forEach((l) => l.addEventListener("change", s)), () => t.forEach((l) => l.removeEventListener("change", s));
  }, []), n;
}
function dt({ blocks: n, label: a = "Your home page", layout: t }) {
  const s = ha(), l = t ?? s, r = ee(() => sa(n.filter((b) => b.show)), [n]), [o, c] = v({}), h = ye((b, u) => c((N) => N[b] === u ? N : { ...N, [b]: u }), []), A = {};
  for (const b of r) A[b.id] = o[b.id] ?? Math.ceil((b.reserve ?? 160) / un);
  const d = oa(r, l, A);
  return /* @__PURE__ */ e("div", { className: "hf hf-bento", role: "region", "aria-label": a, style: { gridTemplateColumns: `repeat(${Me(l)}, minmax(0, 1fr))` }, children: r.map((b, u) => /* @__PURE__ */ e(
    da,
    {
      id: b.id,
      report: h,
      style: { gridColumn: `${d[u].col} / span ${d[u].span}`, gridRow: `${d[u].row} / span ${d[u].rows}` },
      children: b.node
    },
    b.id
  )) });
}
function da({ id: n, report: a, style: t, children: s }) {
  const l = U(null);
  return Qe(() => {
    const r = l.current;
    if (!r) return;
    const o = () => a(n, Math.max(1, Math.ceil(r.getBoundingClientRect().height / un)));
    o();
    const c = new ResizeObserver(o);
    return c.observe(r), () => c.disconnect();
  }, [n, a]), /* @__PURE__ */ e("div", { className: "hf-bento__item", "data-block": n, style: t, children: /* @__PURE__ */ e("div", { ref: l, className: "hf-bento__inner", children: s }) });
}
function At({ firstName: n, reportsTo: a, leads: t = 0, tenure: s, quote: l, search: r, onAppearance: o, onPrivacy: c, now: h = /* @__PURE__ */ new Date() }) {
  const A = h.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  return /* @__PURE__ */ i("header", { className: "hf hf-hello", "data-tour": "topbar", children: [
    /* @__PURE__ */ i("div", { className: "hf-hello__top", children: [
      /* @__PURE__ */ e("p", { className: "hf-hello__date", children: A }),
      r && /* @__PURE__ */ e("div", { className: "hf-hello__search", children: r }),
      o && /* @__PURE__ */ e("button", { type: "button", className: "hf-hello__btn", onClick: o, "aria-label": "Appearance settings", "data-tour": "gear", children: /* @__PURE__ */ e(Ve, { size: 20 }) })
    ] }),
    /* @__PURE__ */ i("h1", { className: "hf-display hf-hello__h1", children: [
      rn(h),
      ", ",
      n
    ] }),
    (a || t > 0 || s) && /* @__PURE__ */ i("div", { className: "hf-hello__meta", children: [
      a && /* @__PURE__ */ i("span", { children: [
        /* @__PURE__ */ e(Je, { size: 14 }),
        "Reports to ",
        a
      ] }),
      t > 0 && /* @__PURE__ */ i("span", { children: [
        /* @__PURE__ */ e(Ze, { size: 14 }),
        "Leads ",
        t,
        " ",
        t === 1 ? "person" : "people"
      ] }),
      s && /* @__PURE__ */ i("span", { children: [
        /* @__PURE__ */ e(Ge, { size: 14 }),
        s
      ] })
    ] }),
    c && /* @__PURE__ */ i("button", { type: "button", className: "hf-hello__chip", onClick: c, children: [
      /* @__PURE__ */ e(Xe, { size: 12 }),
      " Only you can see this page ",
      /* @__PURE__ */ e(E, { size: 12 })
    ] }),
    l && /* @__PURE__ */ i("blockquote", { className: "hf-hello__quote", children: [
      "“",
      l.body,
      "”",
      l.author && /* @__PURE__ */ i("span", { children: [
        " — ",
        l.author
      ] })
    ] })
  ] });
}
function ft({ rows: n, unavailable: a = [], onRetry: t }) {
  const s = n.reduce((l, r) => l + (r.count ?? 1), 0);
  return /* @__PURE__ */ i("section", { className: "hf hf-card hf-wait", id: "waiting", "aria-label": "Waiting for you", children: [
    /* @__PURE__ */ i("div", { className: "hf-wait__head", children: [
      /* @__PURE__ */ e("span", { className: "hf-wait__bell", "aria-hidden": "true", children: /* @__PURE__ */ e(Ke, { size: 16 }) }),
      /* @__PURE__ */ e("h3", { className: "hf-display hf-wait__title", children: "Waiting for you" }),
      s > 0 && /* @__PURE__ */ e("span", { className: "hf-count", "aria-label": `${s} waiting`, children: s }),
      /* @__PURE__ */ e("span", { style: { marginLeft: "auto" }, children: /* @__PURE__ */ e(O, { align: "left", text: "Only things that are yours to do, from every HiFive app, most urgent first. When it's empty this card shrinks to one line." }) })
    ] }),
    /* @__PURE__ */ e("ul", { className: "hf-wait__list", children: n.map((l) => {
      const r = /* @__PURE__ */ i(M, { children: [
        /* @__PURE__ */ i("span", { className: "hf-wait__logo", children: [
          /* @__PURE__ */ e(le, { app: l.app, size: 32 }),
          l.overdue && /* @__PURE__ */ e("span", { className: "hf-due", "aria-hidden": "true", children: /* @__PURE__ */ e("span", { className: "hf-due__ping" }) })
        ] }),
        /* @__PURE__ */ i("span", { className: "hf-wait__txt", children: [
          /* @__PURE__ */ e("span", { className: "hf-wait__what", children: l.text }),
          /* @__PURE__ */ i("span", { className: `hf-wait__when${l.overdue ? " is-overdue" : ""}`, children: [
            l.appName,
            l.when ? ` · ${l.when}` : ""
          ] })
        ] }),
        l.action && /* @__PURE__ */ e("span", { className: "hf-wait__verb", children: l.action }),
        /* @__PURE__ */ e(E, { size: 16, className: "hf-wait__chev", "aria-hidden": "true" })
      ] });
      return /* @__PURE__ */ e("li", { children: l.href ? /* @__PURE__ */ e("a", { className: "hf-wait__row", href: l.href, children: r }) : /* @__PURE__ */ e("button", { type: "button", className: "hf-wait__row", onClick: l.onClick, children: r }) }, l.id);
    }) }),
    a.map((l) => /* @__PURE__ */ i("div", { className: "hf-wait__gap", role: "status", children: [
      /* @__PURE__ */ i("span", { children: [
        "We couldn't reach ",
        l,
        " just now. This part will fill in when it's back."
      ] }),
      t && /* @__PURE__ */ i("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: t, children: [
        /* @__PURE__ */ e($n, { size: 14 }),
        " Try again"
      ] })
    ] }, l))
  ] });
}
function ut() {
  return /* @__PURE__ */ i("section", { className: "hf hf-mini hf-tone-brand", "aria-label": "Waiting for you", children: [
    /* @__PURE__ */ e("span", { className: "hf-mini__ic", children: /* @__PURE__ */ e(Fn, { size: 18 }) }),
    /* @__PURE__ */ i("span", { children: [
      /* @__PURE__ */ e("span", { className: "hf-display hf-mini__t", children: "Nothing waiting" }),
      /* @__PURE__ */ e("span", { className: "hf-mini__s", children: "for you today" })
    ] })
  ] });
}
const Aa = { joiners: me, anniversary: pe, kudos: K, induction: $e, probation: Mn, pinned: en }, ke = 4;
function pt({ items: n, limit: a = 4, onKudos: t, onReact: s }) {
  const [l, r] = v(!1), [o, c] = v({}), [h, A] = v(!1), d = n.filter((f) => f.kind === "pinned"), b = n.filter((f) => f.kind !== "pinned"), u = [...d, ...b], N = l ? u : u.slice(0, a), k = b.length === 0 && d.length === 0;
  return /* @__PURE__ */ i("section", { className: "hf hf-card hf-happen", "aria-label": "Happening at HiFive", "data-tour": "feed", children: [
    /* @__PURE__ */ i("div", { className: "hf-happen__head", children: [
      /* @__PURE__ */ e("h3", { className: "hf-display hf-happen__title", children: "Happening at HiFive" }),
      /* @__PURE__ */ e("span", { style: { marginLeft: "auto" }, children: /* @__PURE__ */ e(O, { align: "left", text: "Joiners, anniversaries, inductions and approved kudos from across HiFive. Grouped so one busy day never fills your page." }) })
    ] }),
    k ? /* @__PURE__ */ i("div", { className: "hf-happen__quiet", children: [
      /* @__PURE__ */ e("span", { className: "hf-kind-well hf-kind--quiet", "aria-hidden": "true", children: /* @__PURE__ */ e(an, { size: 18 }) }),
      /* @__PURE__ */ i("p", { children: [
        "Nothing new since yesterday.",
        t && /* @__PURE__ */ i(M, { children: [
          " ",
          /* @__PURE__ */ e("button", { type: "button", className: "hf-link", onClick: t, children: "Be the first to give kudos." })
        ] })
      ] })
    ] }) : /* @__PURE__ */ e("ul", { className: "hf-happen__list", children: N.map((f) => {
      var _, x, y, P, $, C, S;
      const p = Aa[f.kind], m = !!o[f.id];
      return /* @__PURE__ */ i("li", { className: "hf-happen__row", children: [
        /* @__PURE__ */ i("div", { className: "hf-happen__line", children: [
          (_ = f.people) != null && _.length ? /* @__PURE__ */ e("span", { className: "hf-happen__stack", "aria-hidden": "true", children: f.people.slice(0, 3).map((B) => /* @__PURE__ */ e(q, { name: B.name, size: 30, ring: !0 }, B.name)) }) : f.person ? /* @__PURE__ */ i("span", { className: "hf-happen__who", "aria-hidden": "true", children: [
            /* @__PURE__ */ e(q, { name: f.person, size: 36 }),
            /* @__PURE__ */ e("span", { className: `hf-kind-badge hf-kind--${f.kind}`, children: /* @__PURE__ */ e(p, { size: 11 }) })
          ] }) : /* @__PURE__ */ e("span", { className: `hf-kind-well hf-kind--${f.kind}`, "aria-hidden": "true", children: /* @__PURE__ */ e(p, { size: 17 }) }),
          /* @__PURE__ */ e("div", { className: "hf-happen__body", children: (x = f.people) != null && x.length ? /* @__PURE__ */ i("button", { type: "button", className: "hf-happen__toggle", "aria-expanded": m, onClick: () => {
            c((B) => ({ [f.id]: !B[f.id] })), A(!1);
          }, children: [
            /* @__PURE__ */ e("span", { className: "hf-happen__text", children: f.headline ?? /* @__PURE__ */ i(M, { children: [
              /* @__PURE__ */ i("b", { children: [
                f.people.length,
                " ",
                f.people.length === 1 ? "person" : "people",
                " joined"
              ] }),
              " ",
              f.sub ?? "recently"
            ] }) }),
            /* @__PURE__ */ i("span", { className: "hf-happen__sub", children: [
              [...new Set(f.people.map((B) => B.where).filter(Boolean))].join(" · "),
              " · ",
              /* @__PURE__ */ e("span", { className: "hf-link", children: m ? "Hide" : "See who" })
            ] })
          ] }) : /* @__PURE__ */ i(M, { children: [
            f.kind === "pinned" && /* @__PURE__ */ e("p", { className: "hf-happen__pin", children: "Pinned by HR" }),
            /* @__PURE__ */ e("p", { className: "hf-happen__text", children: f.text }),
            f.sub && /* @__PURE__ */ e("p", { className: "hf-happen__sub", children: f.sub })
          ] }) }),
          f.when && /* @__PURE__ */ e("span", { className: "hf-happen__when", children: f.when })
        ] }),
        m && !!((y = f.people) != null && y.length) && /* @__PURE__ */ i("ul", { className: "hf-happen__people", children: [
          (h ? f.people : f.people.slice(0, ke)).map((B) => /* @__PURE__ */ i("li", { children: [
            /* @__PURE__ */ e(q, { name: B.name, size: 28 }),
            /* @__PURE__ */ i("span", { className: "hf-happen__pname", children: [
              /* @__PURE__ */ e("b", { className: "hf-truncate", children: cn(B.name) }),
              (B.role || B.where) && /* @__PURE__ */ e("span", { className: "hf-truncate", children: [B.role, B.where].filter(Boolean).join(" · ") })
            ] }),
            B.on && /* @__PURE__ */ e("span", { className: "hf-happen__when", children: B.on })
          ] }, B.name)),
          !h && f.people.length > ke && /* @__PURE__ */ e("li", { children: /* @__PURE__ */ i("button", { type: "button", className: "hf-link hf-happen__more", onClick: () => A(!0), children: [
            "and ",
            f.people.length - ke,
            " more"
          ] }) })
        ] }),
        f.kind === "kudos" && s && /* @__PURE__ */ i("div", { className: "hf-happen__reacts", children: [
          /* @__PURE__ */ i("button", { type: "button", className: `hf-react2${(P = f.mine) != null && P.like ? " is-on" : ""}`, "aria-pressed": !!(($ = f.mine) != null && $.like), onClick: () => s(f.id, "like"), children: [
            /* @__PURE__ */ e(nn, { size: 14 }),
            " ",
            f.likes ?? 0
          ] }),
          /* @__PURE__ */ i("button", { type: "button", className: `hf-react2${(C = f.mine) != null && C.clap ? " is-on" : ""}`, "aria-pressed": !!((S = f.mine) != null && S.clap), onClick: () => s(f.id, "clap"), children: [
            /* @__PURE__ */ e(K, { size: 14 }),
            " ",
            f.claps ?? 0
          ] })
        ] })
      ] }, f.id);
    }) }),
    (t || u.length > a) && /* @__PURE__ */ i("div", { className: "hf-happen__foot", children: [
      t && /* @__PURE__ */ i("button", { type: "button", className: "hf-kudos-pill", onClick: t, children: [
        /* @__PURE__ */ e(K, { size: 15 }),
        " Give kudos"
      ] }),
      u.length > a && /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", style: { marginLeft: "auto" }, onClick: () => r((f) => !f), children: l ? "Show less" : `See all ${u.length}` })
    ] })
  ] });
}
function mt({ tone: n = "brand", icon: a, title: t, sub: s, hint: l, dot: r, action: o, onClick: c, dark: h }) {
  const A = /* @__PURE__ */ i(M, { children: [
    /* @__PURE__ */ i("span", { className: "hf-mini__top", children: [
      /* @__PURE__ */ e("span", { className: "hf-mini__ic", "aria-hidden": "true", children: a }),
      r && /* @__PURE__ */ e("span", { className: `hf-mini__dot hf-mini__dot--${r}`, "aria-hidden": "true" }),
      l && /* @__PURE__ */ e(O, { align: "left", text: l })
    ] }),
    /* @__PURE__ */ i("span", { children: [
      /* @__PURE__ */ e("span", { className: "hf-display hf-mini__t", children: t }),
      s && /* @__PURE__ */ e("span", { className: "hf-mini__s", children: s }),
      o && (o.href ? /* @__PURE__ */ e("a", { className: "hf-mini__a", href: o.href, children: o.label }) : /* @__PURE__ */ e("button", { type: "button", className: "hf-mini__a", onClick: (b) => {
        var u;
        b.stopPropagation(), (u = o.onClick) == null || u.call(o);
      }, children: o.label }))
    ] })
  ] }), d = T("hf hf-mini hf-press", h ? "hf-mini--dark" : Q(n));
  return c ? /* @__PURE__ */ e("button", { type: "button", className: d, onClick: c, children: A }) : /* @__PURE__ */ e("section", { className: d, children: A });
}
function _t({ members: n, total: a }) {
  if (!n.length) return null;
  const t = a ?? n.length;
  return /* @__PURE__ */ i("section", { className: "hf hf-card hf-team", "aria-label": "Your team", "data-tour": "team", children: [
    /* @__PURE__ */ i("h3", { className: "hf-cap hf-team__head", children: [
      "Your team ",
      /* @__PURE__ */ i("span", { children: [
        t,
        " ",
        t === 1 ? "person" : "people"
      ] })
    ] }),
    /* @__PURE__ */ e("ul", { className: "hf-team__list", children: n.map((s) => {
      const l = /* @__PURE__ */ i(M, { children: [
        /* @__PURE__ */ e(q, { name: s.name, size: 36 }),
        /* @__PURE__ */ i("span", { className: "hf-team__txt", children: [
          /* @__PURE__ */ e("span", { className: "hf-team__name hf-truncate", title: s.name, children: s.name }),
          (s.note || s.sub) && /* @__PURE__ */ e("span", { className: `hf-team__sub hf-truncate${s.note ? " is-note" : ""}`, children: s.note || s.sub })
        ] }),
        s.onOpen && /* @__PURE__ */ e(E, { size: 16, className: "hf-team__chev", "aria-hidden": "true" })
      ] });
      return /* @__PURE__ */ e("li", { children: s.onOpen ? /* @__PURE__ */ e("button", { type: "button", className: "hf-team__row", onClick: s.onOpen, children: l }) : /* @__PURE__ */ e("div", { className: "hf-team__row", children: l }) }, s.name);
    }) })
  ] });
}
const fa = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function ua(n, a = /* @__PURE__ */ new Date()) {
  const t = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(n ?? ""));
  if (!t) return "";
  const s = `${Number(t[3])} ${fa[Number(t[2]) - 1]}`;
  return Number(t[1]) === a.getFullYear() ? s : `${s} ${t[1]}`;
}
const Ce = (n) => `${n} item${n === 1 ? "" : "s"}`, pa = (n) => n > 0 ? `Holding ${Ce(n)}` : "Nothing held";
function pn(n, a, t = /* @__PURE__ */ new Date()) {
  if (!(n > 0)) return null;
  const s = ua(a, t);
  return `${n} to account for${s ? ` since ${s}` : ""}`;
}
function ma(n) {
  const a = n.map((s) => s.hours).filter((s) => s > 0);
  return `To account for: taken more than ${a.length ? Math.min(...a) : 24} hours ago and not yet marked used or returned.`;
}
function _a(n, a = /* @__PURE__ */ new Date()) {
  const t = pn(n.unaccounted, n.since, a);
  return t ? `${Ce(n.holding)}, ${t}` : Ce(n.holding);
}
function bt(n, a) {
  const t = `${n === 1 ? "Item" : "Items"} in hand`;
  return a > 0 ? `${t} · ${a} to account for` : t;
}
function gt(n) {
  return n ? n.state === "down" ? !0 : n.state === "ok" && n.holding > 0 : !1;
}
function ba(n, a) {
  if (!a) return { single: null, perUnit: !1 };
  const t = n.map((s) => s.href).filter((s) => !!s);
  return t.length ? n.length > 1 ? { single: null, perUnit: !0 } : { single: t[0], perUnit: !1 } : { single: null, perUnit: !1 };
}
function ga({ stock: n, self: a = !1, onRetry: t, today: s = /* @__PURE__ */ new Date() }) {
  const l = /* @__PURE__ */ e("h3", { className: "hf-cap", children: "Stock in hand" });
  if (n.state === "loading")
    return /* @__PURE__ */ i("section", { className: "hf hf-card hf-stock", "aria-label": "Stock in hand", "aria-busy": "true", children: [
      l,
      /* @__PURE__ */ e("span", { className: "hf-stock__sk", style: { width: "60%" } }),
      /* @__PURE__ */ e("span", { className: "hf-stock__sk", style: { width: "40%" } })
    ] });
  if (n.state === "down")
    return /* @__PURE__ */ i("section", { className: "hf hf-card hf-stock", "aria-label": "Stock in hand", children: [
      l,
      /* @__PURE__ */ e("p", { className: "hf-stock__note", role: "status", children: "Inventory did not answer just now." }),
      t && /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--secondary hf-stock__retry", onClick: t, children: "Try again" })
    ] });
  if (n.holding <= 0)
    return /* @__PURE__ */ i("section", { className: "hf hf-card hf-stock", "aria-label": "Stock in hand", children: [
      l,
      /* @__PURE__ */ e("p", { className: "hf-stock__row", children: /* @__PURE__ */ i("span", { className: "hf-status hf-status--plain", children: [
        /* @__PURE__ */ e(Y, { size: 12, "aria-hidden": "true" }),
        "Nothing held"
      ] }) })
    ] });
  const r = pn(n.unaccounted, n.since, s), o = ba(n.units, a);
  return /* @__PURE__ */ i("section", { className: "hf hf-card hf-stock", "aria-label": "Stock in hand", children: [
    l,
    /* @__PURE__ */ e("p", { className: "hf-stock__lead", children: pa(n.holding) }),
    r && /* @__PURE__ */ i(M, { children: [
      /* @__PURE__ */ e("p", { className: "hf-stock__row", children: /* @__PURE__ */ i("span", { className: "hf-status hf-status--warn", children: [
        /* @__PURE__ */ e(We, { size: 12, "aria-hidden": "true" }),
        r
      ] }) }),
      /* @__PURE__ */ e("p", { className: "hf-stock__note", children: ma(n.units) })
    ] }),
    n.units.length > 1 && /* @__PURE__ */ e("ul", { className: "hf-stock__units", children: n.units.map((c) => /* @__PURE__ */ i("li", { className: "hf-stock__unit", children: [
      /* @__PURE__ */ i("span", { className: "hf-stock__txt", children: [
        /* @__PURE__ */ e("span", { className: "hf-stock__name", children: c.unit }),
        /* @__PURE__ */ e("span", { className: "hf-stock__sub", children: _a(c, s) })
      ] }),
      o.perUnit && c.href && /* @__PURE__ */ i("a", { className: "hf-stock__link", href: c.href, children: [
        "With me",
        /* @__PURE__ */ e(fe, { size: 14, "aria-hidden": "true" }),
        /* @__PURE__ */ i("span", { className: "hf-sr", children: [
          " in Inventory, ",
          c.unit
        ] })
      ] })
    ] }, c.unit)) }),
    o.single && /* @__PURE__ */ i("a", { className: T("hf-stock__link"), href: o.single, children: [
      "Open “With me” in Inventory",
      /* @__PURE__ */ e(fe, { size: 14, "aria-hidden": "true" })
    ] }),
    !a && /* @__PURE__ */ e("p", { className: "hf-stock__note", children: "Counts only. What the items are stays in Inventory, where managers see their team." })
  ] });
}
const Na = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function xe(n) {
  const a = /^(\d{4})-(\d{2})-(\d{2})/.exec(n ?? "");
  return a ? `${Number(a[3])} ${Na[Number(a[2]) - 1]} ${a[1]}` : n ?? "";
}
function ka(n) {
  if (n == null || n < 0) return "";
  if (n === 0) return "New this month";
  const a = Math.floor(n / 12), t = n % 12, s = (l, r) => l ? `${l} ${r}${l === 1 ? "" : "s"}` : "";
  return [s(a, "year"), s(t, "month")].filter(Boolean).join(" ");
}
function ya(n) {
  const a = [`${n.headcount} ${n.headcount === 1 ? "person" : "people"}`];
  return n.joined && a.push(`${n.joined} new`), n.probation && a.push(`${n.probation} on probation`), n.leaving && a.push(`${n.leaving} leaving`), a.join(" · ");
}
function wa(n) {
  return n.waiting ? n.overdue ? `${n.waiting} waiting · ${n.overdue} overdue` : `${n.waiting} waiting` : "Nothing waiting";
}
function va(n) {
  const a = [], t = (l) => {
    const r = n.filter(l.test).length;
    r > 0 && r < n.length && a.push(l);
  };
  t({ key: "probation", label: "On probation", test: (l) => !!l.probation }), t({ key: "new", label: "New this month", test: (l) => l.joined });
  const s = [...new Set(n.map((l) => (l.designation ?? "").trim()).filter(Boolean))].sort((l, r) => l.localeCompare(r));
  if (s.length > 1 && s.length <= 8) for (const l of s) t({ key: `role:${l}`, label: l, test: (r) => (r.designation ?? "").trim() === l });
  return a;
}
function mn({ crumbs: n, current: a, onCrumb: t }) {
  const s = a === void 0 ? n.length - 1 : n.length;
  return /* @__PURE__ */ e("nav", { className: "hf-crumbs", "aria-label": "Where you are", children: /* @__PURE__ */ i("ol", { children: [
    n.map((l, r) => /* @__PURE__ */ i("li", { children: [
      r < s ? /* @__PURE__ */ e("button", { type: "button", className: "hf-crumbs__up", onClick: () => t(l), children: l.name }) : /* @__PURE__ */ e("span", { "aria-current": "page", children: l.name }),
      (r < n.length - 1 || a !== void 0) && /* @__PURE__ */ e(E, { size: 14, "aria-hidden": "true", className: "hf-crumbs__sep" })
    ] }, `${l.level}-${l.name}`)),
    a !== void 0 && /* @__PURE__ */ e("li", { children: /* @__PURE__ */ e("span", { "aria-current": "page", children: a }) })
  ] }) });
}
function Ca({ glance: n }) {
  const a = [
    /* @__PURE__ */ e(he, { tone: "brand", icon: /* @__PURE__ */ e(zn, { size: 18 }), value: n.headcount, label: n.headcount === 1 ? "person" : "people" }, "people"),
    n.joined > 0 && /* @__PURE__ */ e(he, { tone: "sky", icon: /* @__PURE__ */ e(me, { size: 18 }), value: n.joined, label: "joined this month" }, "joined"),
    !!n.probation && /* @__PURE__ */ e(he, { tone: "pop", icon: /* @__PURE__ */ e(Fe, { size: 18 }), value: n.probation, label: "on probation", hint: "People still in their probation period, as Performance Hub had it this morning." }, "probation"),
    n.leaving > 0 && /* @__PURE__ */ e(he, { tone: "coral", icon: /* @__PURE__ */ e(Pn, { size: 18 }), value: n.leaving, label: "leaving", hint: "People with a last working day set, who are still here." }, "leaving")
  ].filter(Boolean);
  return /* @__PURE__ */ i("div", { className: "hf-glance-wrap", children: [
    /* @__PURE__ */ e("div", { className: "hf-glance", role: "group", "aria-label": "People at a glance", style: { "--n": a.length }, children: a }),
    n.probation === null && /* @__PURE__ */ e("p", { className: "hf-unit-month__none", children: "On probation: not known today." })
  ] });
}
function _n({ month: n, title: a = "Waiting this month", footnote: t }) {
  return n ? /* @__PURE__ */ i("section", { className: "hf hf-card hf-unit-month", "aria-label": a, children: [
    /* @__PURE__ */ i("h3", { className: "hf-cap hf-unit-month__head", children: [
      a,
      " ",
      /* @__PURE__ */ i("span", { children: [
        "as of ",
        xe(n.day)
      ] })
    ] }),
    /* @__PURE__ */ e("ul", { children: n.apps.map((s) => /* @__PURE__ */ i("li", { children: [
      /* @__PURE__ */ e(le, { app: s.app, size: 32 }),
      /* @__PURE__ */ e("span", { className: "hf-unit-month__app", children: s.label }),
      /* @__PURE__ */ e("span", { className: "hf-unit-month__n hf-num", children: s.waiting ? `${s.waiting} waiting` : wa(s) }),
      s.overdue > 0 && /* @__PURE__ */ i("span", { className: "hf-status hf-status--warn", children: [
        /* @__PURE__ */ e(sn, { size: 12, "aria-hidden": "true" }),
        s.overdue,
        " overdue"
      ] })
    ] }, s.app)) }),
    n.unknown.length > 0 && /* @__PURE__ */ i("p", { className: "hf-unit-month__none", children: [
      n.unknown.join(", "),
      " did not answer this morning: not known today."
    ] }),
    t && /* @__PURE__ */ e("p", { className: "hf-unit-month__foot", children: t })
  ] }) : /* @__PURE__ */ i("section", { className: "hf hf-card hf-unit-month", "aria-label": a, children: [
    /* @__PURE__ */ e("h3", { className: "hf-cap", children: a }),
    /* @__PURE__ */ e("p", { className: "hf-unit-month__none", children: "The first count is taken tomorrow morning." })
  ] });
}
function Nt({ crumbs: n, onCrumb: a, title: t, note: s, glance: l, month: r, units: o, people: c, onOpenUnit: h, onOpenPerson: A, feed: d, direction: b = "down" }) {
  const u = ee(() => va(c ?? []), [c]), [N, k] = v(null), f = u.find((_) => _.key === N), p = c ? c.filter((_) => !f || f.test(_)) : [], m = o ? o.length && o[0].level === "department" ? "Departments" : "Facilities" : "People";
  return /* @__PURE__ */ i("div", { className: T("hf hf-unitpage", `hf-slide--${b}`), children: [
    /* @__PURE__ */ e(mn, { crumbs: n, onCrumb: a }),
    /* @__PURE__ */ i("header", { className: "hf-unitpage__head", children: [
      /* @__PURE__ */ e("h1", { className: "hf-display hf-unitpage__title", children: t }),
      s && /* @__PURE__ */ e("p", { className: "hf-unitpage__note", children: s })
    ] }),
    c && u.length > 0 && /* @__PURE__ */ i("div", { className: "hf-chips", role: "group", "aria-label": "Filter people", children: [
      /* @__PURE__ */ e("button", { type: "button", className: T("hf-chip", !f && "is-on"), "aria-pressed": !f, onClick: () => k(null), children: "Everyone" }),
      u.map((_) => /* @__PURE__ */ e(
        "button",
        {
          type: "button",
          className: T("hf-chip", (f == null ? void 0 : f.key) === _.key && "is-on"),
          "aria-pressed": (f == null ? void 0 : f.key) === _.key,
          onClick: () => k((f == null ? void 0 : f.key) === _.key ? null : _.key),
          children: _.label
        },
        _.key
      ))
    ] }),
    /* @__PURE__ */ e(Ca, { glance: l }),
    /* @__PURE__ */ i("div", { className: "hf-unitpage__cols", children: [
      /* @__PURE__ */ i("section", { className: "hf-unitpage__kids", "aria-label": m, children: [
        /* @__PURE__ */ i("h2", { className: "hf-cap", children: [
          m,
          c && f ? ` · ${p.length} of ${c.length}` : ""
        ] }),
        o && /* @__PURE__ */ e("ul", { className: "hf-kids", children: o.map((_) => /* @__PURE__ */ e("li", { children: /* @__PURE__ */ i("button", { type: "button", className: "hf hf-card hf-kid hf-press", onClick: () => h == null ? void 0 : h(_), children: [
          /* @__PURE__ */ i("span", { className: "hf-kid__txt", children: [
            /* @__PURE__ */ e("span", { className: "hf-kid__name", children: _.name }),
            _.brand && /* @__PURE__ */ e("span", { className: "hf-kid__brand", children: _.brand }),
            /* @__PURE__ */ e("span", { className: "hf-kid__line", children: ya(_.glance) })
          ] }),
          /* @__PURE__ */ e(E, { size: 18, "aria-hidden": "true", className: "hf-kid__chev" })
        ] }) }, `${_.entity}-${_.department ?? ""}`)) }),
        c && /* @__PURE__ */ e("ul", { className: "hf-kids hf-kids--people", children: p.map((_) => {
          const x = /* @__PURE__ */ i(M, { children: [
            /* @__PURE__ */ e(q, { name: _.name, size: 40 }),
            /* @__PURE__ */ i("span", { className: "hf-kid__txt", children: [
              /* @__PURE__ */ e("span", { className: "hf-kid__name hf-truncate", children: _.name }),
              _.designation && /* @__PURE__ */ e("span", { className: "hf-kid__line hf-truncate", children: _.designation }),
              (_.probation || _.joined) && /* @__PURE__ */ i("span", { className: "hf-kid__chips", children: [
                _.joined && /* @__PURE__ */ i("span", { className: "hf-status hf-status--ok", children: [
                  /* @__PURE__ */ e(me, { size: 12, "aria-hidden": "true" }),
                  "New"
                ] }),
                _.probation && /* @__PURE__ */ i("span", { className: T("hf-status", _.probation === "Extended" ? "hf-status--warn" : "hf-status--plain"), children: [
                  /* @__PURE__ */ e(Fe, { size: 12, "aria-hidden": "true" }),
                  _.probation
                ] })
              ] })
            ] }),
            _.code && A && /* @__PURE__ */ e(E, { size: 18, "aria-hidden": "true", className: "hf-kid__chev" })
          ] });
          return /* @__PURE__ */ e("li", { children: _.code && A ? /* @__PURE__ */ e("button", { type: "button", className: "hf hf-card hf-kid hf-press", onClick: () => A(_), children: x }) : /* @__PURE__ */ e("div", { className: "hf hf-card hf-kid", children: x }) }, _.code ?? _.name);
        }) })
      ] }),
      /* @__PURE__ */ i("aside", { className: "hf-unitpage__side", children: [
        /* @__PURE__ */ e(_n, { month: r }),
        d
      ] })
    ] })
  ] });
}
function kt({ crumbs: n, onCrumb: a, self: t, person: s, line: l, onOpenPerson: r, probation: o, waiting: c, direction: h = "down", stock: A, onStockRetry: d }) {
  const b = ka(s.tenure_months), u = [s.department, s.entity].filter(Boolean).join(" · ");
  return /* @__PURE__ */ i("div", { className: T("hf hf-unitpage hf-person", `hf-slide--${h}`), children: [
    n.length > 0 && /* @__PURE__ */ e(mn, { crumbs: n, current: s.name, onCrumb: a }),
    /* @__PURE__ */ i("section", { className: "hf hf-card hf-person__head", children: [
      /* @__PURE__ */ e(q, { name: s.name, size: 64 }),
      /* @__PURE__ */ i("div", { className: "hf-person__txt", children: [
        /* @__PURE__ */ e("h1", { className: "hf-display hf-unitpage__title", children: t ? "Your page" : s.name }),
        s.designation && /* @__PURE__ */ e("p", { className: "hf-person__job", children: s.designation }),
        u && /* @__PURE__ */ e("p", { className: "hf-person__where", children: u }),
        s.start_date && /* @__PURE__ */ i("p", { className: "hf-person__where", children: [
          "Joined ",
          xe(s.start_date),
          b ? ` · ${b}` : ""
        ] })
      ] })
    ] }),
    /* @__PURE__ */ i("div", { className: "hf-unitpage__cols", children: [
      /* @__PURE__ */ i("div", { className: "hf-unitpage__kids", children: [
        (!o.known || o.stage) && /* @__PURE__ */ i("section", { className: "hf hf-card hf-person__probation", "aria-label": "Probation", children: [
          /* @__PURE__ */ e("h3", { className: "hf-cap", children: "Probation" }),
          o.known ? /* @__PURE__ */ i(M, { children: [
            /* @__PURE__ */ i("p", { className: "hf-person__stage", children: [
              /* @__PURE__ */ i("span", { className: T("hf-status", o.stage === "Extended" ? "hf-status--warn" : "hf-status--plain"), children: [
                /* @__PURE__ */ e(Fe, { size: 12, "aria-hidden": "true" }),
                o.stage
              ] }),
              o.month_no && o.of_months ? /* @__PURE__ */ i("span", { className: "hf-num", children: [
                "Month ",
                o.month_no,
                " of ",
                o.of_months
              ] }) : null
            ] }),
            o.month_no && o.of_months ? /* @__PURE__ */ e("span", { className: "hf-month-pips", role: "img", "aria-label": `Month ${o.month_no} of ${o.of_months}`, children: Array.from({ length: o.of_months }, (N, k) => /* @__PURE__ */ e("span", { className: T("hf-month-pip", k < o.month_no && "is-on") }, k)) }) : null,
            o.end_date && /* @__PURE__ */ i("p", { className: "hf-person__where", children: [
              "Ends ",
              xe(o.end_date)
            ] })
          ] }) : /* @__PURE__ */ e("p", { className: "hf-unit-month__none", children: "Not known today: Performance Hub did not answer this morning." })
        ] }),
        A && /* @__PURE__ */ e(ga, { stock: A, self: !!t, onRetry: d }),
        l.length > 0 && /* @__PURE__ */ i("section", { className: "hf hf-card hf-team", "aria-label": "Reporting line", children: [
          /* @__PURE__ */ e("h3", { className: "hf-cap hf-team__head", children: "Reporting line" }),
          /* @__PURE__ */ e("ul", { className: "hf-team__list", children: l.map((N) => {
            const k = /* @__PURE__ */ i(M, { children: [
              /* @__PURE__ */ e(q, { name: N.name, size: 36 }),
              /* @__PURE__ */ i("span", { className: "hf-team__txt", children: [
                /* @__PURE__ */ e("span", { className: "hf-team__name hf-truncate", children: N.name }),
                N.designation && /* @__PURE__ */ e("span", { className: "hf-team__sub hf-truncate", children: N.designation })
              ] }),
              N.code && r && /* @__PURE__ */ e(E, { size: 16, className: "hf-team__chev", "aria-hidden": "true" })
            ] });
            return /* @__PURE__ */ e("li", { children: N.code && r ? /* @__PURE__ */ e("button", { type: "button", className: "hf-team__row", onClick: () => r(N.code), children: k }) : /* @__PURE__ */ e("div", { className: "hf-team__row", children: k }) }, `${N.name}-${N.code ?? ""}`);
          }) })
        ] })
      ] }),
      /* @__PURE__ */ e("aside", { className: "hf-unitpage__side", children: /* @__PURE__ */ e(
        _n,
        {
          month: c,
          title: t ? "Waiting for you" : `Waiting for ${cn(s.name)}`,
          footnote: "Counts only. What each one is stays in its app."
        }
      ) })
    ] })
  ] });
}
const R = "__skipped__", Re = ["", "Poor", "Below expectations", "Meets expectations", "Strong", "Excellent"], bn = (n, a) => !!n && Object.entries(n).some(([t, s]) => s.includes(String(a[t] ?? ""))), _e = (n, a) => !n.showWhen || bn(n.showWhen, a), Be = (n, a) => _e(n, a) && (!n.optional || bn(n.requiredWhen, a)), ze = (n) => n == null || n === "" || n === !1 || typeof n == "string" && !n.trim(), xa = (n) => !ze(n) && n !== R, gn = (n, a) => n.fields.filter((t) => _e(t, a) && xa(a[t.key])).length;
function Ba(n, a) {
  const t = n.minAnswered;
  return !t || gn(n, a) >= t.count ? null : `${t.word[0].toUpperCase()}${t.word.slice(1)} at least ${t.count}.`;
}
function Sa(n, a) {
  return n.fields.filter((t) => Be(t, a) && a[t.key] !== R && ze(a[t.key]));
}
function Da(n, a) {
  const t = {};
  for (const s of n) for (const l of s.fields) {
    if (!_e(l, a)) continue;
    const r = a[l.key];
    r !== R && (ze(r) && l.type !== "check" || (t[l.key] = typeof r == "string" ? r.trim() : r ?? !1));
  }
  return t;
}
function Ye(n) {
  if (!n.length) return null;
  const a = n[0], t = a.type === "scale" ? `a score for ${a.label}` : a.type === "check" ? `a tick for "${a.label}"` : `"${a.label}"`;
  return n.length === 1 ? `Still needs ${t}.` : `Still needs ${t} and ${n.length - 1} more.`;
}
function Wa({ ctx: n, first: a, open: t }) {
  var o, c, h, A, d, b;
  const [s, l] = v(t);
  return ((o = n.profile) == null ? void 0 : o.length) || n.callout || n.notes || ((c = n.history) == null ? void 0 : c.length) || ((h = n.links) == null ? void 0 : h.length) ? /* @__PURE__ */ i("section", { className: "hf-quick__ctx", "aria-label": `About ${a}`, children: [
    /* @__PURE__ */ i("button", { type: "button", className: "hf-quick__ctxtoggle", "aria-expanded": s, onClick: () => l((u) => !u), children: [
      /* @__PURE__ */ i("span", { children: [
        "About ",
        a
      ] }),
      /* @__PURE__ */ e(ln, { size: 16, "aria-hidden": "true" })
    ] }),
    s && /* @__PURE__ */ i("div", { className: "hf-quick__ctxbody", children: [
      !!((A = n.profile) != null && A.length) && /* @__PURE__ */ e("dl", { className: "hf-quick__grid", children: n.profile.map((u) => /* @__PURE__ */ i("div", { children: [
        /* @__PURE__ */ e("dt", { children: u.label }),
        /* @__PURE__ */ e("dd", { children: u.value })
      ] }, u.label)) }),
      n.callout && /* @__PURE__ */ i("div", { className: "hf-quick__callout", children: [
        /* @__PURE__ */ e("p", { className: "hf-quick__ctitle", children: n.callout.title }),
        /* @__PURE__ */ e("ul", { children: n.callout.lines.map((u) => /* @__PURE__ */ e("li", { children: u }, u)) }),
        n.callout.note && /* @__PURE__ */ e("p", { className: "hf-quick__cnote", children: n.callout.note })
      ] }),
      n.notes && /* @__PURE__ */ i("div", { className: "hf-quick__notes", children: [
        /* @__PURE__ */ e("p", { className: "hf-quick__ctitle", children: n.notes.title }),
        /* @__PURE__ */ e("p", { children: n.notes.text })
      ] }),
      !!((d = n.history) != null && d.length) && /* @__PURE__ */ i("div", { children: [
        /* @__PURE__ */ e("p", { className: "hf-quick__ctitle", children: "Interview history" }),
        /* @__PURE__ */ e("ul", { className: "hf-quick__hist", children: n.history.map((u, N) => /* @__PURE__ */ i("li", { className: `is-${u.outcome ?? "open"}`, children: [
          /* @__PURE__ */ e("span", { className: "hf-quick__dot", "aria-hidden": "true", children: u.outcome === "pass" ? "✓" : u.outcome === "fail" ? "✕" : "·" }),
          /* @__PURE__ */ i("div", { children: [
            /* @__PURE__ */ e("p", { className: "hf-quick__htitle", children: u.title }),
            u.sub && /* @__PURE__ */ e("p", { className: "hf-quick__sub", children: u.sub }),
            u.quote && /* @__PURE__ */ i("p", { className: "hf-quick__quote", children: [
              "“",
              u.quote,
              "”"
            ] })
          ] })
        ] }, `${u.title}-${N}`)) })
      ] }),
      !!((b = n.links) != null && b.length) && /* @__PURE__ */ e("div", { className: "hf-quick__links", children: n.links.map((u) => /* @__PURE__ */ i("a", { href: u.href, target: "_blank", rel: "noopener", children: [
        /* @__PURE__ */ e(we, { size: 14 }),
        " ",
        u.label,
        " ",
        /* @__PURE__ */ e(fe, { size: 12 })
      ] }, u.href)) })
    ] })
  ] }) : null;
}
function yt({ form: n, open: a, onSave: t, onClose: s }) {
  var H, G, te, re;
  const [l, r] = v([]), [o, c] = v(0), [h, A] = v(0), [d, b] = v({}), [u, N] = v(!1), [k, f] = v([]), [p, m] = v(!1), [_, x] = v(null);
  L(() => {
    !a || !n || (r(n.items), c(0), A(0), b({}), N(!1), f([]), x(null));
  }, [a, n]);
  const y = l[o], P = ee(() => {
    var g;
    return (g = y == null ? void 0 : y.steps) != null && g.length ? y.steps : (n == null ? void 0 : n.steps) ?? [];
  }, [y, n]);
  if (!n || !y || !P.length) return /* @__PURE__ */ e(se, { open: a && !!n, onClose: () => s(k), title: (n == null ? void 0 : n.title) ?? "", children: /* @__PURE__ */ e("p", { className: "hf-muted", children: "Nothing is waiting here any more." }) });
  const $ = P[h], C = h === P.length - 1, S = o === l.length - 1, B = Sa($, d), D = Ba($, d), z = (g, W) => {
    b((j) => ({ ...j, [g]: W })), x(null);
  }, V = n.unit.toLowerCase();
  async function w() {
    if (B.length || D) {
      N(!0);
      return;
    }
    if (N(!1), !C) {
      A(h + 1);
      return;
    }
    m(!0);
    try {
      await t(y, Da(P, d));
      const g = [...k, y.id];
      if (f(g), S) {
        s(g);
        return;
      }
      c(o + 1), A(0), b({});
    } catch (g) {
      const W = g;
      if (x({ text: (W == null ? void 0 : W.message) || "That didn't save. Try again, or open it in the app.", field: W == null ? void 0 : W.field }), W != null && W.field) {
        const j = P.findIndex((ce) => ce.fields.some((oe) => oe.key === W.field));
        j >= 0 && A(j);
      }
    } finally {
      m(!1);
    }
  }
  const I = C ? S ? "Save" : `Save and next ${V}` : "Next";
  return /* @__PURE__ */ e(se, { open: a, onClose: () => s(k), title: n.title, children: /* @__PURE__ */ i("div", { className: "hf-quick", children: [
    /* @__PURE__ */ i("div", { className: "hf-quick__app", children: [
      /* @__PURE__ */ e(le, { app: n.app, size: 28 }),
      /* @__PURE__ */ e("span", { children: n.appName })
    ] }),
    l.length > 1 && /* @__PURE__ */ i("div", { className: "hf-quick__run", "aria-label": `${n.unit} ${o + 1} of ${l.length}`, children: [
      /* @__PURE__ */ i("span", { children: [
        n.unit,
        " ",
        o + 1,
        " of ",
        l.length
      ] }),
      /* @__PURE__ */ e("span", { className: "hf-quick__dots", "aria-hidden": "true", children: l.map((g, W) => /* @__PURE__ */ e("i", { className: W < o ? "is-done" : W === o ? "is-on" : "" }, g.id)) })
    ] }),
    /* @__PURE__ */ i("div", { className: "hf-quick__who", children: [
      /* @__PURE__ */ e(q, { name: y.name, size: 44 }),
      /* @__PURE__ */ i("div", { children: [
        /* @__PURE__ */ e("p", { className: "hf-quick__name", children: y.name }),
        y.sub && /* @__PURE__ */ e("p", { className: "hf-quick__sub", children: y.sub }),
        y.when && /* @__PURE__ */ e("p", { className: "hf-quick__sub", children: y.when }),
        !!((G = (H = y.context) == null ? void 0 : H.chips) != null && G.length || (te = y.facts) != null && te.length) && /* @__PURE__ */ e("div", { className: "hf-quick__facts", children: [...((re = y.context) == null ? void 0 : re.chips) ?? [], ...y.facts ?? []].map((g) => /* @__PURE__ */ e("span", { children: g }, g)) })
      ] })
    ] }),
    y.context && /* @__PURE__ */ e(Wa, { ctx: y.context, first: y.name.split(" ")[0], open: h === 0 }, `${y.id}-${h === 0}`),
    P.length > 1 && /* @__PURE__ */ e("ol", { className: "hf-quick__steps", children: P.map((g, W) => /* @__PURE__ */ e("li", { className: W === h ? "is-on" : W < h ? "is-done" : "", children: g.title }, g.title)) }),
    ($.legend || $.minAnswered) && /* @__PURE__ */ i("div", { className: "hf-quick__legend", children: [
      $.legend && /* @__PURE__ */ e("span", { children: $.legend }),
      $.minAnswered && /* @__PURE__ */ i("span", { className: u && D ? "is-bad" : "", children: [
        gn($, d),
        " of ",
        $.fields.length,
        " ",
        $.minAnswered.done ?? "answered",
        " · at least ",
        $.minAnswered.count
      ] })
    ] }),
    /* @__PURE__ */ e("div", { className: "hf-quick__fields", children: $.fields.filter((g) => _e(g, d)).map((g) => {
      var ce, oe;
      const W = u && B.includes(g) || (_ == null ? void 0 : _.field) === g.key, j = `hf-q-${g.key}`;
      return /* @__PURE__ */ i("div", { className: `hf-quick__f${W ? " is-bad" : ""}`, children: [
        g.type !== "check" && /* @__PURE__ */ i("div", { className: "hf-quick__labelrow", children: [
          /* @__PURE__ */ i("p", { className: "hf-quick__label", id: `${j}-l`, children: [
            g.label,
            !Be(g, d) && !g.skipLabel && /* @__PURE__ */ e("span", { children: " (optional)" })
          ] }),
          g.skipLabel && /* @__PURE__ */ e(
            "button",
            {
              type: "button",
              className: `hf-quick__skip${d[g.key] === R ? " is-on" : ""}`,
              "aria-pressed": d[g.key] === R,
              onClick: () => z(g.key, d[g.key] === R ? "" : R),
              children: g.skipLabel
            }
          )
        ] }),
        (((ce = y.hints) == null ? void 0 : ce[g.key]) ?? g.hint) && /* @__PURE__ */ e("p", { className: "hf-quick__hint", children: ((oe = y.hints) == null ? void 0 : oe[g.key]) ?? g.hint }),
        g.type === "scale" && d[g.key] === R && /* @__PURE__ */ i("p", { className: "hf-quick__skipped", children: [
          g.skipLabel,
          ": left out of the score."
        ] }),
        g.type === "scale" && d[g.key] !== R && /* @__PURE__ */ i(M, { children: [
          /* @__PURE__ */ e("div", { className: `hf-quick__scale${(g.max ?? 5) > 5 ? " hf-quick__scale--wide" : ""}`, role: "radiogroup", "aria-labelledby": `${j}-l`, children: Array.from({ length: g.max ?? 5 }, (F, yn) => yn + 1).map((F) => /* @__PURE__ */ e(
            "button",
            {
              type: "button",
              role: "radio",
              "aria-checked": d[g.key] === F,
              "aria-label": (g.max ?? 5) === 5 ? `${F}, ${Re[F]}` : `${F} of ${g.max}`,
              className: d[g.key] === F ? "is-on" : "",
              onClick: () => z(g.key, d[g.key] === F && !Be(g, d) ? "" : F),
              children: F
            },
            F
          )) }),
          (g.max ?? 5) === 5 && /* @__PURE__ */ e("p", { className: "hf-quick__word", "aria-live": "polite", children: d[g.key] ? Re[Number(d[g.key])] : "" })
        ] }),
        g.type === "choice" && /* @__PURE__ */ e("div", { className: "hf-quick__pills", role: "radiogroup", "aria-labelledby": `${j}-l`, children: (g.options ?? []).map((F) => /* @__PURE__ */ e("button", { type: "button", role: "radio", "aria-checked": d[g.key] === F, className: d[g.key] === F ? "is-on" : "", onClick: () => z(g.key, F), children: F }, F)) }),
        g.type === "text" && /* @__PURE__ */ e(
          "textarea",
          {
            id: j,
            "aria-labelledby": `${j}-l`,
            rows: 3,
            value: String(d[g.key] ?? ""),
            placeholder: g.placeholder,
            onChange: (F) => z(g.key, F.target.value),
            "aria-invalid": W
          }
        ),
        g.type === "check" && /* @__PURE__ */ i("label", { className: "hf-quick__check", children: [
          /* @__PURE__ */ e("input", { type: "checkbox", checked: !!d[g.key], onChange: (F) => z(g.key, F.target.checked) }),
          " ",
          g.label
        ] }),
        W && !_ && /* @__PURE__ */ e("p", { className: "hf-quick__err", role: "alert", children: g.type === "scale" ? `Pick a score from 1 to ${g.max ?? 5}.` : g.type === "text" ? "Add a line or two." : g.type === "check" ? "Tick this to go on." : "Choose one." })
      ] }, g.key);
    }) }),
    _ && /* @__PURE__ */ e("p", { className: "hf-quick__err hf-quick__err--save", role: "alert", children: _.text }),
    u && (Ye(B) ?? D) && /* @__PURE__ */ e("p", { className: "hf-quick__missing", role: "status", children: Ye(B) ?? D }),
    /* @__PURE__ */ i("div", { className: "hf-quick__foot", children: [
      h > 0 && /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: () => A(h - 1), disabled: p, children: "Back" }),
      /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--primary", onClick: w, disabled: p, children: p ? "Saving…" : I })
    ] }),
    n.openUrl && /* @__PURE__ */ i("a", { className: "hf-quick__open", href: n.openUrl, target: "_blank", rel: "noopener", children: [
      "Open in ",
      n.appName,
      " ",
      /* @__PURE__ */ e(fe, { size: 13 })
    ] })
  ] }) });
}
function wt({ text: n, action: a, onDone: t, ms: s = 5e3 }) {
  return L(() => {
    if (!n) return;
    const l = window.setTimeout(t, s);
    return () => window.clearTimeout(l);
  }, [n, s, t]), n ? /* @__PURE__ */ i("div", { className: "hf hf-toast", role: "status", children: [
    /* @__PURE__ */ e("span", { children: n }),
    a && /* @__PURE__ */ e("button", { type: "button", onClick: () => {
      a.onClick(), t();
    }, children: a.label })
  ] }) : null;
}
const vt = {
  performance: "data:image/webp;base64,UklGRgIFAABXRUJQVlA4WAoAAAAgAAAAVwAAVwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggFAMAAPASAJ0BKlgAWAA+USSPRSOiIZVbVKw4BQSxgGoAiR0vg1DQwsfEA6YfmA/gHSl9ADpAN5W/bP9a5q/w52UOiDX1/kBxAdzPG9pGppPkVzS+qT+03sAGPgLIYiXV9ejQwgLcUuNzMWnk1ZI1EH9d4FbWj9ICKNaQ7y0Ue6yQ0SxfKLkjK6TIaVbPETgY2K3ZahH9l87k0rsr9iLuG1P9/AAA/v3Aghu2439Qd9ndP6czgI92SKFEwS5tiwZfn9orR4ghd+3i+wDXXxj/7f/5PvVLW+mUuzj//aPeUUAG30/U1yK0a0SnsdBZuB4JTn5R7gjWKpVH5Ww+NU6SZX+jARJ7/1YH36tmJQ9Ew5MMsyGQK+JkqfKx+37xM7L4V0BYzQkz7Rwp6jCAe1RFI2xVNr+6l6Idg6slM/prv1IaHbl4URcYl5uFbt6ohiM0xvmkO6hexgDu1p+rUeVJjaZqUI7jPJa+EpretNQywg8H2OZ/dcaD1S+jDJXY1IR/sf3fXF/4avpG7HPofHtKo5Gj+vUjTha2ltklbV0BmS5UfzY/hypLTpIuf3HeqcxXidxUBNgdh/HH3MzI5upJnRIxx8iYUPuntMGforRxMnGZSg/uqMKZVo9hCTX0RMOH/06//5zhVXGFQ6zXIg/fIChXJvvfslt0E6Cyo2vW5wnQWVGidPIX8NB1jSOakUlCsg4v6I02BzXPTGZ0O/pb3oVuFblfnIPEafJLCLpY0VXxDvq9KkSrjrN+1msf9H/+fnUyFe1PiJ4cgFfUybZk0S8QFe6T57C0vBLD8+981yMVEGDvUwext8MW8D1ZJs+YuMQcO/2AV61JNOhzxsSbZ9I5514/sMVL2GfeTTYlPe+vj8j/B/d8FBOHrzp8QCereJC/VO33BQNguDqaJTgZOWOihdi0fAvBmh02qRuM69inkOEH1PU8uj1GPubjSExKXCbhuYhZf2EghBf/9kw8B/7tDja5egGGS1HvOLAx5mDdBkg+qzSIhUpc2mx0dxtH9HRyhaZBO+Yx0ibj/h7SU2lg/gAAAAAA",
  recruitment: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='s' x1='10' y1='95' x2='90' y2='5' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%231F2530'/%3E%3Cstop offset='1' stop-color='%2366738C'/%3E%3C/linearGradient%3E%3ClinearGradient id='a' x1='40' y1='62' x2='92' y2='38' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23C2441A'/%3E%3Cstop offset='1' stop-color='%23FFB772'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpolygon points='22,12 70,12 70,28 32,28 32,72 70,72 70,88 14,88 14,20' fill='url(%23s)'/%3E%3Cpolygon points='40,38 76,38 92,50 76,62 40,62' fill='url(%23a)'/%3E%3C/svg%3E",
  apml: "data:image/webp;base64,UklGRmoFAABXRUJQVlA4WAoAAAAgAAAAVwAAVwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggfAMAAPASAJ0BKlgAWAA+USiPRSOioROc/Ug4BQSgDVLTG7hwfRv+wEIB5gOhbvCv7VewB0sb74pxrQ5YGk7meeMqix9cHoS/qqXpY3x655dradJOzRa5ms/yHQwuXAKJQlY5EWIq4//Oa5tIqXEOwztiDQyE8xcj4axcbNsUKo4plJ0P7PptSSZjYTcgKbqkg2WyqrM198RH8JTzOqYGwm6fNwAA/v3Ague+W+LHH/elKq59V8aAMIr3lwXTM8h/+Ll/UftLuAnNo98V+oOrz9t17gWu8hj/dw870eqmFUQkDw4fwHABx11jSq+l/82//xYfugGX8XBAm+Wk9QnM75QRS+dIB7UV5rhoFLcHX7rJfclqN0d2iCJm+1LsxuDpj4rDL97LZJTDrBf+aUnu5ZZGYLWlcqRi4+WwQMZen1XJafOWlb9OJ+l30Ymk2TEBXkTSBK8kIgfGl04AEbXmTKHSG59Qm5h7iGuNHqaw620sjGXnclN2ReYclfZWLO9pJcIUq1ajIyqneO5OfrThtcIPmdpkrzaf0rP6QE3lmmtFZmqvQuEYi+fV/CeA3I1CXZUsV22jItfKqsGVHAuR2uhynXblcw9temOKkq165KpLk1kwgsMUyv3itFYaSmoIl7SIJYPNP2ph6xdqA0aDCllkboZNxSxOUBIHg7ky1M6wL2cTSUZg6p/p6v1dAGDPcIhYIb2SZxQqmdF9tqJLbKMMboxCBQ9q0q6/KGv2SuEX/8eo0Pnx03YBMsZ+CiZA2HfT5LD7jDcr6/S6369hQ+3s3KvjLksNJyz6QH4+giUQWxOe1GOtgbe35kUJjrIfC6IRGng5rr1g4ehimy3EyHo8CoSUMtwNWrG1pt8yAug1jDC4UOZ06CnRlwRX5SZgh2y7w2Opx3LEzUVO/Tov1gegpVKYLem/6yMP88sByGiTOpSziJW5zrW0Mwb7QgPNVBz9wERNFm3Al64zmCqOA43nLHrFT1kOq0ZKOvt/T3hxdP/nwwl9ldfnJi6YReYIyEE8JGtDdfWXDW/7IduWDzwPApwbipHMIo+miBrHrTpOeJF54DQ6XlehVGdalS9BMJyErPHbOSARbQIRh94q7XwUmEhM0hRmJ9W/hi5kmh5L9Y03UcMvUO5qx1HnvgcjJpLajuWVQ8FIsp3nsfN+SgOkvH0XtFgniSgKGoQAAAA=",
  learning: "data:image/webp;base64,UklGRmYMAABXRUJQVlA4WAoAAAAwAAAAPwAAPwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZBTFBIvQYAAA3whv2TIVnbtv0ismoO27Zt27Ztc3GOdZhz2MexcNi2bdu2vY7FWVUR8aGqenqOkx8jYgL4v2N6YPWRWomO71f+VQIkJn9z6kIqNsmTG3rvJNsNn5QashFOrUxKRjX5WtNfnawXpJxqf4J6caUxJGpABg3+RaJ96n0ox2tAokmQOrV5Nz9bvW1aLLQmid5VDn7iXfV2wXFY1ktikx95Au1OxUYTRgYQFQlpComKAMm3H3VvsrZI2dFJCBAiAOpNggARQvW408ZItEN9XyynOnycIFk5RYP/mUqI8SYFUFt+ySHqbZByxl1QIOS7bYdnIcV0SgDBiA3+yEPKSW+dOQSUAdd+K9Ez9YFYBrieTxoLQbP/6hDp50cOcwWxWXfpUu+RFsssiQKef/AcIQABqAMC4AxZdWFXUPZ960X1ngTHYRkQciapoFFMAqISafjgviEgNuHAE4IepnJbrAPw/OVPcZrTsq94UO9cO89KrpB844luSdaSlBP1QajtIpUNWbnDIRfekJV1kcaePZD6Y8/9S6IV9cOwHLD8obFSUp+6V96JS294MlkNJneNv4ElUFtsjQvVW9Birs1QIJKfjkSdFnOcTDH5kGM+U69B/bSBKQSUI+/6VL0JjsIywNPNaEmt2MRXYOPbHOfsNkKixvTJn7Y3BbFp9z+FZi1Xnz0SENmYC2g1PIVAmdFq12ETh0CKPb5+XL1GTI/FKpauIhUNoSN2P33eYvwvBiDe4OmNN/ZwBTw79sRSoqK+O9YBRP7HlYRG1ODpq85LpxxxAKmkXqTk7D2nDoFka8x5lTog5dT7IQCuF5MKSB4VLD139eD9yLqpFS2D9OlDB7oCwqAhP0uAeh8sBzz/9m6cVd/7VZIHgMnNZ2ZSUBU1m2qhZ5wLN5/dFbScd/Nz1NFi4dVRgJBzScbx2w6+5ndJ4UD4m0pV1GyKXQ946jjRH248PARIHPzU2woci2WA5x88jwvFzJ3r3Dr4e1EcQktAxWyGA7YOfgRn6MqLuILY5EeeAL7RhJ4DhJxJKgWlmGW/bR++6DMUx0Exn+uQdYnuDgkiDb+0XwiQfNsx99JxFLXW8eJnONXkNvUeu7923ttIgBiLHr40UaacqnPd3Cu5Uj3+VA7EciASXaSyBlW3Sbff/6tzXgRiub6zE2XK8ZpI3Wd2SgioLbc0+6BU9KPvcZpVwybY7Mjvdu7Ob5qJsJRRlQCMR2ed3wUQ9mbYPq6AxAIzP6YOhFAVjSJf/a2/Jl2GIk/UG0CydQgFCLmMS5ZdzhXEdMBZ4yQgUaoCSKJU3PKMWvcsK0HKrG+d56+9xrhTj6eabOW5r1WXeHqliaJUpZoMUWrd847yOUB9Zyyn9njQe0dvZwkQ+l06XExOuHH/3aaOUhItW+Tpz2suQUzKiQ9AACy/DQVOPHKyEFBbZKVh6iGfXfjYtvvOHIZKg5Hrj0NvQcRR3wfLgchGnAN4evupg10B4Yjrf5QIle8H377uIXNHqZUQy+WLCx5FkgVSTrcjAmDpIlIBztlbzOMKarNvdpE6jqTfrrpy2T6L4Eog2XvnvYIkM0D9ECwHvOOLu3Ag0s9DBoUAykEPfaIO4ZJG3HjR3J3LeIi+3vU5kswAtJhzfRQg5BRSCeBcNcealkDKafc4WwIgXNLYu8+aZVLG7fg9ksyoleiDZYB1PPMFTjW0PPHYLAQSu7/1ujrVcEndz8HIlyWVTr0Wiy2JAqifiFoNrk98tYcpiE186Ok0h6MOak6rA7EMsOxKtKTFU/ebNgQ0tvvpKfU6wAGnxVSsNn0kILLfh9Cqp0/uPtIVxLIBpwXtdzqxius5pKIFnAvWWtQVkm843l3J2pXKzfEc8Py9J3FajTT8nGNDqHae2S3RHinzPjSeSCpbwuTmiTa1BGorznOdenvUd8FywPIHRklJDyVO6JwgBIR+g//SqESTVKSYeH8EiKy7C4meeHrpjf1cQW2RlYeKV1qMisZ+WA64DiUV9Njp2nm2EFAOe/iX8QOxX71Op1GQsdOtiwKR/XANTs8jfXtdf1cQZr510lIi/2mb3yVAYpIHpywksr8DAVy7SGUbcIYsubwrwGQdEGR/OrU6BRlIBIDnr76B085IY047TgAkAhBXGkMCEKnACaSyLZjeO3pbS4BQlWgShEbLb0EL2n5Cn8lC6NXIRpxD+z2988QhlnrH9SJS0Tacs7eY17ROQppCos47Pr8Lp/2Rfhk8SGhUbxKkDk4hlb2AcfUMa/6tFcnKSRri71TW2GSP/4TRu7bhU3iFcUAAwV9L/EZUGMF/nwBWUDggsgMAADATAJ0BKkAAQAA+tUqdSyckIqGsGqwA4BaJbA21LhWIolQtGE0vDb5PfbO5YC/7h6gNsR5gPPE9C/+M9QD9kusK9ADy3P28+C392vSA0oPYj2M/2uWDwW40++tvefXvRA/YBKd9vg9BD/9PQktSkEbcOMNT9uVL+Beocvog0XzI4zDPy7i7uWXj5NvyUOjYGm+E5AUWdgqh86T0r+eTmh1UgAD++Zt//n4WP4vHvTrlJD/TnBehZOgWb13AqBVGdU0Y/TabcvDWQWzsqHD9JNtBHyaSEmxBn99VoMTAPPlei5qGjg/tunXiESVaylzHnjdrjvegfUtTkB5n1sIW2C2h4PQwygxwsKQWlwGUPDePGRv8/99JKq3hu+7EvTzp9IHmJPnPHCm/HVyBpMZGM9wDdfl9bSWaryF6+jMjppiiv0L9PWYIeYqV8uVbFw+pL8iWFovLxssge6f6I1gp5VyjvVbIeZnNB04kqqlIu+pWzCYdl9Y1bU5STFKvL+EGagnPRhARLSkzg0ebb40EwtwYqx9mDjaG8f4MioFXOsRiXsH0NwY6KP63Xu6zT4ourcpoFmn2F3/DXu+vJuZyaIycDa47wtEZdofvd7KsfKzfuXQiBoZhna7yexqHcss81aMXCu4DUStA0IPge7jwaPuFXIJyWItzR6xpYsdDVqO7QfSVGnHHordk86iITCSlFk8KPF02fVzLSVIyMvMsT+Sc2dyjnRvUGVc9pSsYXJNSfOWSVBFNhIe4HH58dblqoCDqPMdb4gr0dxxHeo541xXlJrIYP5Cf8RHYAGzG+kRn62P0diPt/IRe+dkE3jirosp177z5HO5JRSOqJVZQ1XzxqWp0J+TSW5XwQP3H3+yFru35cRkA+xUPXH1q+nP/TCZZVuvsM5W+VEf0aYgkPl6lKIdUjpqCmWj/MswDu3DJQ19AiCTTwOZiTc1ev8az+Tu2NDN7bf1saP2KAokSrZM2gE9eNIaA2QAsinUjVTJ+O5FOPnrax0RxFTXA4AHsN3GV8+4YKPvTDc4z1vs8UqqQGTKvJY7KQni+l/o3//De1Pc7m7PDOX0Iaf+7WX0GnvTTiEaO5g/lSwx7TaZ50mP9txAOc+cAuez4YUpjiioFQslNKEYUJCzF+VgxsGoXFl9tlWQpoEtVPW/eJ/OWfarqbrzaM1ihb//D9055nj7vjmZLNwahDgPf3+5UhOue42UmVPS9QOyahXzQhDTtuDp1ORjX85lUfhMfXHUIXfP4AAA=",
  logistics: "data:image/webp;base64,UklGRmoEAABXRUJQVlA4WAoAAAAgAAAAVwAAVwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggfAIAAPANAJ0BKlgAWAA+USKPRKOsIZVbVYDABQSygGna2A9F1vBuEDubzHOermuHn0RwlXN2YDYXpPkXTScZD3KX1amRirtex3IDM0F+hi7s4wPJyZigXDPJcGBnwPYy5AnDHv6vMSTJeAF4jMjFARb6sXVKOcPP2H9IAAD+/cCARf2S9MbeF/hMv+SG9PgmY/gtrb34dRABGF9e/4jN5E/xiI41rcCbtX5gogrjDDMT9WT58IWBJu+xfFe9BPPRjh3WOZts/9S5UQDe+BUYkAxruDXttiZNucLZJdRhP4G0m0N9jB/V6HCu0s/ZfxY7macldCWFOq4GtdAkq+//Rx7jXs8J6Y6laMmd1s/4Pv/9Y5G/F4o7ACbrf1POgcZe7xYGpEtlsSqmwp3dXRe3/z//aYnLP/agr1/h7/RNNriO5DvBAISOD/Fiv/b2FBeWc1qHHp3dMztltF5d2wUTXKcX3kLMNOpoCILgGGnUT4mQAnEOAcHz0h+Xs67aYCJMn7/Ad7/TdAxRM2S+vOvv9dtvn54HFDrFD9g38DboorIlPTDjrvC+g1uZJ7/kZdzOtoe0hhqJvvZSl7Hqj/j8EfoqSIdtCfwe86yL0IDfG135qjyty7Y8FFREbLSoH6Z5HTXi48qzE1UGFAwjEBhj33y63+DjHoOF1W2sW//tfogu+c9wrMnf7wR506OmzeYn+P15B9zLyxe/WOCbj80Z7AprMDfgU+L/A4CoSZq7PdEDAcFzhZYrC1JKmMaWyMOLXln98lC3QB+1K37fFgDUtFFez4zPqL3P7PZbNWkTOxrhe1XB/av9HrgdCih2jzqFEAJiNj1F2SLZDoYAAAAAAA=="
};
function $a(n, a, t) {
  const s = n.slice();
  if (!a) return s;
  const l = a.dir === "asc" ? 1 : -1, r = (o) => o == null || o === "";
  return s.sort((o, c) => {
    const h = t(o, a.key), A = t(c, a.key);
    return r(h) && r(A) ? 0 : r(h) ? 1 : r(A) ? -1 : typeof h == "number" && typeof A == "number" ? (h - A) * l : String(h).localeCompare(String(A), void 0, { numeric: !0, sensitivity: "base" }) * l;
  });
}
function Fa(n, a) {
  return !n || n.key !== a ? { key: a, dir: "asc" } : { key: a, dir: n.dir === "asc" ? "desc" : "asc" };
}
function Ma(n, a) {
  return n === "done" ? { mark: "tick", words: "done" } : n === "skipped" ? { mark: "dash", words: "not needed" } : n === "current" ? { mark: "number", words: `step ${a + 1}, where the case is now` } : { mark: "number", words: `step ${a + 1}, still to come` };
}
const Nn = {
  rated: "Rated",
  missing: "Not rated",
  skipped: "Skipped",
  future: "Still to come"
};
function za(n) {
  return n.map((a) => `${a.label}: ${Nn[a.state].toLowerCase()}`).join(", ");
}
function Ct({ variant: n = "secondary", fit: a, icon: t, busy: s, className: l, children: r, type: o = "button", ...c }) {
  const h = ["hf-btn", `hf-btn--${n}`, "hf-press", a ? "hf-btn--fit" : "", l ?? ""].filter(Boolean).join(" ");
  return /* @__PURE__ */ i("button", { type: o, className: h, "aria-busy": s || void 0, ...c, children: [
    s ? /* @__PURE__ */ e("span", { className: "hf-spin", "aria-hidden": "true" }) : t,
    r
  ] });
}
function ne(n) {
  const a = Z(), t = n ?? a;
  return { id: t, hint: `${t}-h`, error: `${t}-e` };
}
function Pe({ htmlFor: n, label: a, optional: t, hideLabel: s }) {
  return /* @__PURE__ */ i("label", { htmlFor: n, className: s ? "hf-sr" : "hf-fld__l", children: [
    a,
    t && /* @__PURE__ */ e("span", { className: "hf-fld__opt", children: " (optional)" })
  ] });
}
function ae(n, a, t) {
  return [a ? n.hint : "", t ? n.error : ""].filter(Boolean).join(" ") || void 0;
}
function Te({ ids: n, error: a }) {
  return a ? /* @__PURE__ */ e("span", { id: n.error, className: "hf-fld__e", children: a }) : null;
}
function xt({ label: n, hint: a, error: t, optional: s, hideLabel: l, id: r, className: o, ...c }) {
  const h = ne(r);
  return /* @__PURE__ */ i("div", { className: ["hf-fld", o ?? ""].join(" "), children: [
    /* @__PURE__ */ e(Pe, { htmlFor: h.id, label: n, optional: s, hideLabel: l }),
    a && /* @__PURE__ */ e("span", { id: h.hint, className: "hf-fld__h", children: a }),
    /* @__PURE__ */ e(
      "input",
      {
        id: h.id,
        className: t ? "hf-input hf-input--err" : "hf-input",
        "aria-invalid": t ? !0 : void 0,
        "aria-describedby": ae(h, a, t),
        ...c
      }
    ),
    /* @__PURE__ */ e(Te, { ids: h, hint: a, error: t })
  ] });
}
function Bt({ label: n, hint: a, error: t, optional: s, hideLabel: l, id: r, className: o, rows: c = 3, maxLength: h, value: A, ...d }) {
  const b = ne(r), u = typeof A == "string" ? A.length : 0;
  return /* @__PURE__ */ i("div", { className: ["hf-fld", o ?? ""].join(" "), children: [
    /* @__PURE__ */ e(Pe, { htmlFor: b.id, label: n, optional: s, hideLabel: l }),
    a && /* @__PURE__ */ e("span", { id: b.hint, className: "hf-fld__h", children: a }),
    /* @__PURE__ */ e(
      "textarea",
      {
        id: b.id,
        rows: Math.max(3, c),
        maxLength: h,
        value: A,
        className: t ? "hf-input hf-input--area hf-input--err" : "hf-input hf-input--area",
        "aria-invalid": t ? !0 : void 0,
        "aria-describedby": ae(b, a, t),
        ...d
      }
    ),
    h ? /* @__PURE__ */ i("span", { className: "hf-fld__count", "aria-live": "polite", children: [
      u,
      " of ",
      h
    ] }) : null,
    /* @__PURE__ */ e(Te, { ids: b, hint: a, error: t })
  ] });
}
function St({ label: n, hint: a, error: t, optional: s, hideLabel: l, id: r, className: o, options: c, placeholder: h, ...A }) {
  const d = ne(r);
  return /* @__PURE__ */ i("div", { className: ["hf-fld", o ?? ""].join(" "), children: [
    /* @__PURE__ */ e(Pe, { htmlFor: d.id, label: n, optional: s, hideLabel: l }),
    a && /* @__PURE__ */ e("span", { id: d.hint, className: "hf-fld__h", children: a }),
    /* @__PURE__ */ i("span", { className: "hf-select", children: [
      /* @__PURE__ */ i(
        "select",
        {
          id: d.id,
          className: t ? "hf-input hf-input--err" : "hf-input",
          "aria-invalid": t ? !0 : void 0,
          "aria-describedby": ae(d, a, t),
          ...A,
          children: [
            h !== void 0 && /* @__PURE__ */ e("option", { value: "", children: h }),
            c.map((b) => typeof b == "string" ? /* @__PURE__ */ e("option", { value: b, children: b }, b) : /* @__PURE__ */ e("option", { value: b.value, children: b.label }, b.value))
          ]
        }
      ),
      /* @__PURE__ */ e(ln, { size: 18, "aria-hidden": "true" })
    ] }),
    /* @__PURE__ */ e(Te, { ids: d, hint: a, error: t })
  ] });
}
function Dt({ label: n, sub: a, id: t, className: s, ...l }) {
  const r = Z(), o = t ?? r;
  return /* @__PURE__ */ i("label", { htmlFor: o, className: ["hf-tick", s ?? ""].join(" "), children: [
    /* @__PURE__ */ e("input", { id: o, type: "checkbox", ...l }),
    /* @__PURE__ */ e("span", { className: "hf-tick__box", "aria-hidden": "true", children: /* @__PURE__ */ e(Y, { size: 14, strokeWidth: 3 }) }),
    /* @__PURE__ */ i("span", { className: "hf-tick__t", children: [
      n,
      a && /* @__PURE__ */ e("span", { className: "hf-tick__s", children: a })
    ] })
  ] });
}
function Wt({ label: n, options: a, value: t, onChange: s, hint: l, error: r, optional: o, hideLabel: c, clearable: h, onClear: A }) {
  const d = ne();
  return /* @__PURE__ */ i("div", { className: "hf-fld", role: "group", "aria-labelledby": d.id, "aria-describedby": ae(d, l, r), children: [
    /* @__PURE__ */ i("span", { id: d.id, className: c ? "hf-sr" : "hf-fld__l", children: [
      n,
      o && /* @__PURE__ */ e("span", { className: "hf-fld__opt", children: " (optional)" })
    ] }),
    l && /* @__PURE__ */ e("span", { id: d.hint, className: "hf-fld__h", children: l }),
    /* @__PURE__ */ e("div", { className: "hf-seg hf-seg--fill", children: a.map((b) => {
      const u = typeof b == "string" ? b : b.value, N = typeof b == "string" ? b : b.label, k = t === u;
      return /* @__PURE__ */ e(
        "button",
        {
          type: "button",
          "aria-pressed": k,
          onClick: () => k && h ? A == null ? void 0 : A() : s(u),
          children: N
        },
        u
      );
    }) }),
    r && /* @__PURE__ */ e("span", { id: d.error, className: "hf-fld__e", children: r })
  ] });
}
function $t({ label: n, options: a, value: t, onChange: s, hint: l, error: r, hideLabel: o }) {
  const c = ne();
  return /* @__PURE__ */ i("div", { className: "hf-fld", role: "radiogroup", "aria-labelledby": c.id, "aria-describedby": ae(c, l, r), children: [
    /* @__PURE__ */ e("span", { id: c.id, className: o ? "hf-sr" : "hf-fld__l", children: n }),
    l && /* @__PURE__ */ e("span", { id: c.hint, className: "hf-fld__h", children: l }),
    a.map((h) => {
      const A = t === h.value;
      return /* @__PURE__ */ i("div", { className: "hf-choice__w", children: [
        /* @__PURE__ */ i("button", { type: "button", role: "radio", "aria-checked": A, className: A ? "hf-choice is-on" : "hf-choice", onClick: () => s(h.value), children: [
          /* @__PURE__ */ e("span", { className: "hf-choice__dot", "aria-hidden": "true" }),
          /* @__PURE__ */ i("span", { className: "hf-choice__b", children: [
            /* @__PURE__ */ i("span", { className: "hf-choice__t", children: [
              h.title,
              h.tag && /* @__PURE__ */ e("span", { className: "hf-choice__tag", children: h.tag })
            ] }),
            h.sub && /* @__PURE__ */ e("span", { className: "hf-choice__s", children: h.sub })
          ] })
        ] }),
        A && h.detail
      ] }, h.value);
    }),
    r && /* @__PURE__ */ e("span", { id: c.error, className: "hf-fld__e", children: r })
  ] });
}
function Ft({ label: n, value: a, onChange: t, max: s = 5, hint: l, error: r, ends: o = ["1 is lowest", `${s} is highest`], children: c }) {
  const h = ne();
  return /* @__PURE__ */ i("div", { className: "hf-fld", role: "group", "aria-labelledby": h.id, "aria-describedby": ae(h, l, r), children: [
    /* @__PURE__ */ e("span", { id: h.id, className: "hf-fld__t", children: n }),
    l && /* @__PURE__ */ e("span", { id: h.hint, className: "hf-fld__h", children: l }),
    /* @__PURE__ */ e("div", { className: "hf-score", style: { gridTemplateColumns: `repeat(${s}, minmax(0, 1fr))` }, children: Array.from({ length: s }, (A, d) => d + 1).map((A) => /* @__PURE__ */ e("button", { type: "button", "aria-pressed": a === A, "aria-label": `${A} of ${s}`, onClick: () => t(A), children: A }, A)) }),
    /* @__PURE__ */ i("span", { className: "hf-score__ends", "aria-hidden": "true", children: [
      /* @__PURE__ */ e("span", { children: o[0] }),
      /* @__PURE__ */ e("span", { children: o[1] })
    ] }),
    c,
    r && /* @__PURE__ */ e("span", { id: h.error, className: "hf-fld__e", children: r })
  ] });
}
function Mt({ pressed: n, count: a, className: t, children: s, type: l = "button", ...r }) {
  return /* @__PURE__ */ i("button", { type: l, className: ["hf-chip", n ? "is-on" : "", t ?? ""].filter(Boolean).join(" "), "aria-pressed": n, ...r, children: [
    s,
    typeof a == "number" && /* @__PURE__ */ e("span", { className: "hf-chip__n", children: a })
  ] });
}
function zt({ label: n, children: a }) {
  return /* @__PURE__ */ e("div", { className: "hf-chips", role: "group", "aria-label": n, children: a });
}
const Pa = {
  ok: /* @__PURE__ */ e(Y, { size: 14, strokeWidth: 2.5, "aria-hidden": "true" }),
  warn: /* @__PURE__ */ e(We, { size: 14, strokeWidth: 2.5, "aria-hidden": "true" }),
  danger: /* @__PURE__ */ e(ve, { size: 14, strokeWidth: 2.5, "aria-hidden": "true" }),
  plain: /* @__PURE__ */ e(Ln, { size: 10, strokeWidth: 3, "aria-hidden": "true" })
};
function Pt({ tone: n, icon: a, children: t }) {
  return /* @__PURE__ */ i("span", { className: `hf-status hf-status--${n}`, children: [
    a ?? Pa[n],
    t
  ] });
}
const Ta = {
  ok: /* @__PURE__ */ e(Y, { size: 18, "aria-hidden": "true" }),
  warn: /* @__PURE__ */ e(ve, { size: 18, "aria-hidden": "true" }),
  danger: /* @__PURE__ */ e(ve, { size: 18, "aria-hidden": "true" }),
  plain: /* @__PURE__ */ e(sn, { size: 18, "aria-hidden": "true" })
};
function Tt({ tone: n = "plain", icon: a, children: t, role: s, action: l }) {
  return /* @__PURE__ */ i("div", { className: `hf-banner hf-banner--${n}`, role: s, children: [
    a ?? Ta[n],
    /* @__PURE__ */ e("div", { className: "hf-banner__t", children: t }),
    l && /* @__PURE__ */ e("div", { className: "hf-banner__a", children: /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: l.onClick, children: l.label }) })
  ] });
}
function It({ title: n, sub: a, icon: t, trailing: s, below: l, href: r, onClick: o, chevron: c = !!(r || o) }) {
  const h = /* @__PURE__ */ i(M, { children: [
    t && /* @__PURE__ */ e("span", { className: "hf-lrow__ic", "aria-hidden": "true", children: t }),
    /* @__PURE__ */ i("span", { className: "hf-lrow__b", children: [
      /* @__PURE__ */ e("span", { className: "hf-lrow__t", children: n }),
      a && /* @__PURE__ */ e("span", { className: "hf-lrow__s", children: a }),
      l && /* @__PURE__ */ e("span", { className: "hf-lrow__below", children: l })
    ] }),
    (s || c) && /* @__PURE__ */ i("span", { className: "hf-lrow__e", children: [
      s,
      c && /* @__PURE__ */ e(E, { size: 20, "aria-hidden": "true" })
    ] })
  ] });
  return r ? /* @__PURE__ */ e("a", { className: "hf-lrow", href: r, onClick: o ? (A) => {
    A.preventDefault(), o();
  } : void 0, children: h }) : o ? /* @__PURE__ */ e("button", { type: "button", className: "hf-lrow", onClick: o, children: h }) : /* @__PURE__ */ e("div", { className: "hf-lrow", children: h });
}
function Lt({ caption: n, children: a, action: t }) {
  return /* @__PURE__ */ i("section", { className: "hf-card hf-listcard", children: [
    (n || t) && /* @__PURE__ */ i("div", { className: "hf-listcard__head", children: [
      n && /* @__PURE__ */ e("span", { className: "hf-cap", children: n }),
      t
    ] }),
    /* @__PURE__ */ e("div", { className: "hf-listcard__rows", children: a })
  ] });
}
function Et({ caption: n, columns: a, rows: t, rowKey: s, onRowClick: l, rowHref: r, empty: o, initialSort: c = null, hideCaption: h, wide: A }) {
  const [d, b] = v(c), u = ee(() => $a(t, d, (p, m) => {
    var _, x;
    return (x = (_ = a.find((y) => y.key === m)) == null ? void 0 : _.sortValue) == null ? void 0 : x.call(_, p);
  }), [t, d, a]), N = a.map((p) => p.width ?? "minmax(0, 1fr)").join(" "), k = (p, m) => p.render ? p.render(m) : m[p.key], f = (p) => p == null || p === "" || p === !1;
  return /* @__PURE__ */ i("div", { className: A ? "hf-table hf-table--wide" : "hf-table", role: "table", "aria-label": n, children: [
    !h && /* @__PURE__ */ e("div", { className: "hf-table__cap hf-cap", children: n }),
    u.length > 0 && /* @__PURE__ */ e("div", { className: "hf-table__head", role: "row", style: { gridTemplateColumns: N }, children: a.map((p) => {
      const m = (d == null ? void 0 : d.key) === p.key, _ = m ? d.dir === "asc" ? "ascending" : "descending" : "none";
      return /* @__PURE__ */ e(
        "span",
        {
          role: "columnheader",
          "aria-sort": p.sortValue ? _ : void 0,
          className: p.align === "end" ? "hf-table__th is-end" : "hf-table__th",
          children: p.sortValue ? /* @__PURE__ */ i("button", { type: "button", onClick: () => b(Fa(d, p.key)), children: [
            p.label,
            m ? d.dir === "asc" ? /* @__PURE__ */ e(Tn, { size: 14, "aria-hidden": "true" }) : /* @__PURE__ */ e(In, { size: 14, "aria-hidden": "true" }) : null
          ] }) : p.label
        },
        p.key
      );
    }) }),
    u.length === 0 && o && /* @__PURE__ */ e("div", { className: "hf-table__empty", children: o }),
    u.map((p) => {
      const m = a.map((x) => {
        const y = k(x, p);
        return /* @__PURE__ */ e(
          "span",
          {
            role: "cell",
            "data-label": x.label,
            className: ["hf-table__td", x.lead ? "is-lead" : "", x.align === "end" ? "is-end" : "", f(y) ? "is-blank" : ""].filter(Boolean).join(" "),
            children: y
          },
          x.key
        );
      }), _ = r == null ? void 0 : r(p);
      return _ ? /* @__PURE__ */ e(
        "a",
        {
          role: "row",
          className: "hf-table__tr is-link",
          style: { gridTemplateColumns: N },
          href: _,
          onClick: l ? (x) => {
            x.preventDefault(), l(p);
          } : void 0,
          children: m
        },
        s(p)
      ) : l ? /* @__PURE__ */ e(
        "button",
        {
          type: "button",
          role: "row",
          className: "hf-table__tr is-link",
          style: { gridTemplateColumns: N },
          onClick: () => l(p),
          children: m
        },
        s(p)
      ) : /* @__PURE__ */ e("div", { role: "row", className: "hf-table__tr", style: { gridTemplateColumns: N }, children: m }, s(p));
    })
  ] });
}
function Ia({ lines: n = 3, height: a = 16, block: t }) {
  return t ? /* @__PURE__ */ e("span", { className: "hf-skel", style: { height: t }, "aria-hidden": "true" }) : /* @__PURE__ */ e("span", { className: "hf-skel-lines", "aria-hidden": "true", children: Array.from({ length: n }, (s, l) => /* @__PURE__ */ e("span", { className: "hf-skel", style: { height: a, width: l === n - 1 && n > 1 ? "60%" : "100%" } }, l)) });
}
function Ut({ label: n = "Loading", children: a }) {
  return /* @__PURE__ */ i("div", { className: "hf-loading", role: "status", "aria-live": "polite", children: [
    /* @__PURE__ */ e("span", { className: "hf-sr", children: n }),
    a ?? /* @__PURE__ */ e(Ia, { lines: 3 })
  ] });
}
const kn = {
  rated: /* @__PURE__ */ e(Y, { size: 14, strokeWidth: 2.5 }),
  missing: /* @__PURE__ */ e("span", { className: "hf-month__bang", children: "!" }),
  skipped: /* @__PURE__ */ e(De, { size: 14, strokeWidth: 2.5 }),
  future: /* @__PURE__ */ e("span", { className: "hf-month__dot" })
};
function Ht({ months: n, label: a = "Monthly ratings" }) {
  return /* @__PURE__ */ e("div", { className: "hf-months", role: "img", "aria-label": `${a}. ${za(n)}`, style: { gridTemplateColumns: `repeat(${Math.max(1, n.length)}, minmax(0, 1fr))` }, children: n.map((t, s) => /* @__PURE__ */ i("span", { className: `hf-month hf-month--${t.state}`, "aria-hidden": "true", children: [
    /* @__PURE__ */ e("span", { className: "hf-month__l", children: t.label }),
    kn[t.state]
  ] }, s)) });
}
function jt({ hint: n }) {
  return /* @__PURE__ */ i("div", { className: "hf-monthkey", children: [
    ["rated", "missing", "skipped", "future"].map((t) => /* @__PURE__ */ i("span", { className: `hf-monthkey__i hf-monthkey__i--${t}`, children: [
      kn[t],
      Nn[t]
    ] }, t)),
    n && /* @__PURE__ */ e(O, { label: "About the month strip", text: n })
  ] });
}
function qt({ steps: n, selected: a, onSelect: t, label: s }) {
  return /* @__PURE__ */ e("ol", { className: "hf-steps", "aria-label": s, children: n.map((l, r) => {
    const o = Ma(l.state, r), c = /* @__PURE__ */ i(M, { children: [
      /* @__PURE__ */ i("span", { className: "hf-step__rail", "aria-hidden": "true", children: [
        /* @__PURE__ */ e("span", { className: "hf-step__dot", children: o.mark === "tick" ? /* @__PURE__ */ e(Y, { size: 16, strokeWidth: 3 }) : o.mark === "dash" ? /* @__PURE__ */ e(De, { size: 16, strokeWidth: 3 }) : r + 1 }),
        r < n.length - 1 && /* @__PURE__ */ e("span", { className: "hf-step__line" })
      ] }),
      /* @__PURE__ */ i("span", { className: "hf-step__b", children: [
        /* @__PURE__ */ i("span", { className: "hf-step__t", children: [
          l.title,
          /* @__PURE__ */ i("span", { className: "hf-sr", children: [
            ", ",
            o.words
          ] })
        ] }),
        l.sub && /* @__PURE__ */ e("span", { className: "hf-step__s", children: l.sub })
      ] })
    ] });
    return /* @__PURE__ */ e("li", { "aria-current": l.state === "current" ? "step" : void 0, children: t ? /* @__PURE__ */ e("button", { type: "button", className: `hf-step hf-step--${l.state}`, "aria-pressed": a === l.key, onClick: () => t(l.key), children: c }) : /* @__PURE__ */ e("div", { className: `hf-step hf-step--${l.state}`, children: c }) }, l.key);
  }) });
}
function Ot({ items: n, label: a }) {
  return /* @__PURE__ */ e("ol", { className: "hf-tl", "aria-label": a, children: n.map((t) => /* @__PURE__ */ i("li", { className: "hf-tl__i", children: [
    /* @__PURE__ */ e("span", { className: "hf-tl__d", children: t.date }),
    /* @__PURE__ */ i("span", { className: "hf-tl__b", children: [
      /* @__PURE__ */ e("span", { className: "hf-tl__t", children: t.title }),
      t.sub && /* @__PURE__ */ e("span", { className: "hf-tl__s", children: t.sub }),
      t.extra
    ] })
  ] }, t.key)) });
}
function Rt({ docs: n, onAdd: a, addLabel: t = "Add a document", accept: s, empty: l = "No documents yet.", busy: r }) {
  return /* @__PURE__ */ i("div", { className: "hf-docs", children: [
    n.length === 0 && /* @__PURE__ */ e("p", { className: "hf-muted hf-docs__empty", children: l }),
    n.map((o) => o.href ? /* @__PURE__ */ i("span", { className: "hf-doc__row", children: [
      /* @__PURE__ */ i("a", { className: "hf-doc", href: o.href, target: "_blank", rel: "noreferrer", children: [
        /* @__PURE__ */ e(we, { size: 18, "aria-hidden": "true" }),
        /* @__PURE__ */ e("span", { className: "hf-doc__n", children: o.name }),
        o.meta && /* @__PURE__ */ e("span", { className: "hf-doc__m", children: o.meta })
      ] }),
      o.end
    ] }, o.key) : /* @__PURE__ */ i("span", { className: "hf-doc__row", children: [
      /* @__PURE__ */ i("span", { className: "hf-doc", children: [
        /* @__PURE__ */ e(we, { size: 18, "aria-hidden": "true" }),
        /* @__PURE__ */ e("span", { className: "hf-doc__n", children: o.name }),
        o.meta && /* @__PURE__ */ e("span", { className: "hf-doc__m", children: o.meta })
      ] }),
      o.end
    ] }, o.key)),
    a && /* @__PURE__ */ i("label", { className: "hf-btn hf-btn--quiet hf-docs__add", "aria-busy": r || void 0, children: [
      /* @__PURE__ */ e(En, { size: 18, "aria-hidden": "true" }),
      r ? "Adding…" : t,
      /* @__PURE__ */ e(
        "input",
        {
          type: "file",
          className: "hf-sr",
          accept: s,
          disabled: r,
          onChange: (o) => {
            var h;
            const c = (h = o.target.files) == null ? void 0 : h[0];
            c && a(c), o.target.value = "";
          }
        }
      )
    ] })
  ] });
}
export {
  Jn as APP_FAMILY,
  vt as APP_LOGOS,
  fn as AppLogo,
  Ka as AppLogoTile,
  le as AppMark,
  rt as Appearance,
  st as AppsDock,
  lt as AppsGrid,
  q as Avatar,
  Ja as BalanceTile,
  Tt as Banner,
  dt as BentoGrid,
  mn as Breadcrumb,
  Ct as Button,
  it as Celebration,
  Dt as Checkbox,
  Mt as Chip,
  zt as ChipGroup,
  $t as ChoiceCards,
  Et as DataTable,
  Rt as DocumentList,
  Ga as Feed,
  Ie as FeedCard,
  Qn as FeedQuiet,
  ht as FirstLoginTour,
  et as GiveKudosButton,
  nt as GiveKudosSheet,
  Ca as GlanceStrip,
  Ya as Greeting,
  At as GreetingBand,
  pt as HappeningCard,
  tt as HealthDot,
  O as Hint,
  qa as KeyValues,
  Lt as ListCard,
  It as ListRow,
  Ut as Loading,
  Nn as MONTH_WORDS,
  mt as MiniTile,
  jt as MonthKey,
  Ht as MonthStrip,
  ot as NewJoinerCard,
  kt as PersonPage,
  Ha as Picker,
  Qa as ProfileCard,
  ja as QuantityField,
  yt as QuickSheet,
  Oa as Quiet,
  Re as SCALE_WORDS,
  Kn as SKINS,
  R as SKIPPED,
  Ue as SWATCHES,
  Ft as ScoreGroup,
  Va as ScoreRing,
  ct as SearchPill,
  Wt as Segmented,
  St as Select,
  se as Sheet,
  Ia as Skeleton,
  Pt as StatusChip,
  at as StatusRows,
  qt as Stepper,
  ga as StockCard,
  ta as TOUR_LABELS,
  aa as TOUR_STEPS,
  _t as TeamCard,
  Bt as TextArea,
  xt as TextField,
  he as Tile,
  Za as TileStrip,
  Ot as Timeline,
  wt as Toast,
  Nt as UnitPage,
  Ra as UnitSwitch,
  ft as WaitingCard,
  _n as WaitingCounts,
  ut as WaitingQuiet,
  gn as answeredCount,
  Da as answersFor,
  na as applyPrefs,
  oa as arrange,
  On as bandFor,
  Me as columnsFor,
  ea as currentPrefs,
  xe as dayWords,
  qn as factorTotal,
  cn as firstName,
  ya as glanceLine,
  jn as initials,
  Be as isRequired,
  _e as isShown,
  Xa as logoSvg,
  Un as matchOptions,
  Vn as matchPeople,
  Sa as missingFields,
  Ye as missingLine,
  za as monthLine,
  Fa as nextSort,
  va as peopleFilters,
  gt as showStockTile,
  sa as sortBlocks,
  $a as sortRows,
  la as spansFor,
  Ma as stepMark,
  Ba as stepProblem,
  Hn as stepQuantity,
  pn as stockChip,
  ua as stockDay,
  pa as stockLead,
  bt as stockTileLabel,
  ma as stockWhy,
  ka as tenureWords,
  rn as timeGreeting,
  _a as unitLine,
  ha as useLayout,
  wa as waitingLine
};
//# sourceMappingURL=hifive-ui.js.map
