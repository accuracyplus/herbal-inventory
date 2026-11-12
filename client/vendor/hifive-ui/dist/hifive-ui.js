import { jsx as e, jsxs as t, Fragment as z } from "react/jsx-runtime";
import { useId as Q, useState as C, useRef as I, useMemo as K, useEffect as T, useCallback as Ne, useLayoutEffect as Le } from "react";
import { Search as Ce, Minus as Be, Plus as mn, Check as Y, Building2 as _n, ChevronsUpDown as bn, Settings as xe, User as Re, Briefcase as Oe, Calendar as Ye, Lock as Qe, ChevronRight as $, X as Ae, Clock as Ve, Award as fe, Target as Ze, Bell as Je, ShieldCheck as gn, Pin as Ge, ThumbsUp as Xe, Hand as X, Sun as Ke, MessageSquare as Nn, Star as en, BookOpen as Se, UserPlus as ue, CheckCircle2 as nn, Sparkles as kn, RefreshCw as yn, BadgeCheck as wn, Users as vn, Hourglass as We, LogOut as Cn, Info as an, ExternalLink as tn, ChevronDown as sn, FileText as ke, ArrowUp as Bn, ArrowDown as xn, AlertTriangle as ye, Circle as Sn, Paperclip as Wn } from "lucide-react";
const me = (n) => n.trim().toLowerCase();
function Dn(n, a, i = 30) {
  const l = me(a);
  if (!l) return n.slice(0, i);
  const s = n.filter((c) => {
    var h;
    return (h = c.codes) == null ? void 0 : h.some((d) => me(d) === l);
  });
  if (s.length) return s.slice(0, i);
  const r = l.split(/\s+/), o = (c) => me(`${c.label} ${c.keywords ?? ""} ${(c.codes ?? []).join(" ")}`);
  return n.filter((c) => {
    const h = o(c);
    return r.every((d) => h.includes(d));
  }).slice(0, i);
}
function Fn(n, a, i = {}) {
  const { min: l = 0, max: s, step: r = 1 } = i, o = Number(n);
  let h = (Number.isFinite(o) ? o : 0) + a * r;
  return h < l && (h = l), s !== void 0 && h > s && (h = s), String(Math.round(h * 1e6) / 1e6);
}
function ya({ label: n, options: a, onPick: i, placeholder: l, hint: s, error: r, hideLabel: o, limit: c = 30, empty: h, footer: d, id: A }) {
  const m = Q(), u = A ?? m, [k, N] = C(""), [f, p] = C(!1), [b, _] = C(0), x = I(null), y = K(() => Dn(a, k, c), [a, k, c]);
  T(() => {
    if (!f) return;
    const v = (S) => {
      var B;
      (B = x.current) != null && B.contains(S.target) || p(!1);
    };
    return document.addEventListener("pointerdown", v), () => document.removeEventListener("pointerdown", v);
  }, [f]);
  const M = (v) => {
    i(v), N(""), p(!1), _(0);
  }, W = [s ? `${u}-h` : "", r ? `${u}-e` : ""].filter(Boolean).join(" ") || void 0;
  return /* @__PURE__ */ t("div", { className: "hf-fld hf-pick", ref: x, children: [
    /* @__PURE__ */ e("label", { htmlFor: u, className: o ? "hf-sr" : "hf-fld__l", children: n }),
    s && /* @__PURE__ */ e("span", { id: `${u}-h`, className: "hf-fld__h", children: s }),
    /* @__PURE__ */ t("div", { className: "hf-pick__wrap", children: [
      /* @__PURE__ */ t("div", { className: ["hf-pick__box", f ? "is-open" : "", r ? "is-err" : ""].filter(Boolean).join(" "), children: [
        /* @__PURE__ */ e(Ce, { size: 18, "aria-hidden": "true" }),
        /* @__PURE__ */ e(
          "input",
          {
            id: u,
            role: "combobox",
            "aria-expanded": f,
            "aria-controls": `${u}-l`,
            "aria-autocomplete": "list",
            "aria-activedescendant": f && y[b] ? `${u}-o${b}` : void 0,
            "aria-invalid": r ? !0 : void 0,
            "aria-describedby": W,
            autoComplete: "off",
            value: k,
            placeholder: l,
            onFocus: () => p(!0),
            onChange: (v) => {
              N(v.target.value), p(!0), _(0);
            },
            onKeyDown: (v) => {
              v.key === "ArrowDown" ? (v.preventDefault(), p(!0), _((S) => Math.min(S + 1, y.length - 1))) : v.key === "ArrowUp" ? (v.preventDefault(), _((S) => Math.max(S - 1, 0))) : v.key === "Enter" && f && y[b] ? (v.preventDefault(), M(y[b])) : v.key === "Escape" && f && (v.stopPropagation(), p(!1));
            }
          }
        )
      ] }),
      f && /* @__PURE__ */ t("div", { className: "hf-pick__list", children: [
        /* @__PURE__ */ e("div", { id: `${u}-l`, role: "listbox", "aria-label": n, children: y.map((v, S) => /* @__PURE__ */ t(
          "button",
          {
            id: `${u}-o${S}`,
            type: "button",
            role: "option",
            "aria-selected": S === b,
            tabIndex: -1,
            className: S === b ? "hf-pick__opt is-on" : "hf-pick__opt",
            onPointerDown: (B) => B.preventDefault(),
            onClick: () => M(v),
            onPointerEnter: () => _(S),
            children: [
              /* @__PURE__ */ t("span", { className: "hf-pick__b", children: [
                /* @__PURE__ */ e("span", { className: "hf-pick__t", children: v.label }),
                v.sub && /* @__PURE__ */ e("span", { className: "hf-pick__s", children: v.sub })
              ] }),
              v.end && /* @__PURE__ */ e("span", { className: v.endTone ? `hf-pick__e hf-pick__e--${v.endTone}` : "hf-pick__e", children: v.end })
            ]
          },
          v.value
        )) }),
        y.length === 0 && /* @__PURE__ */ e("p", { className: "hf-pick__none", children: h ? h(k) : `Nothing matches “${k}”.` }),
        d && /* @__PURE__ */ e("div", { className: "hf-pick__foot", children: d })
      ] })
    ] }),
    r && /* @__PURE__ */ e("span", { id: `${u}-e`, className: "hf-fld__e", children: r })
  ] });
}
function wa({ label: n, value: a, onChange: i, unit: l, min: s = 0, max: r, step: o = 1, bare: c, hint: h, error: d, hideLabel: A, id: m, className: u, ...k }) {
  const N = Q(), f = m ?? N, p = [h ? `${f}-h` : "", d ? `${f}-e` : ""].filter(Boolean).join(" ") || void 0, b = (_) => i(Fn(a, _, { min: s, max: r, step: o }));
  return /* @__PURE__ */ t("div", { className: ["hf-fld hf-qty", u ?? ""].filter(Boolean).join(" "), children: [
    /* @__PURE__ */ e("label", { htmlFor: f, className: A ? "hf-sr" : "hf-fld__l", children: n }),
    h && /* @__PURE__ */ e("span", { id: `${f}-h`, className: "hf-fld__h", children: h }),
    /* @__PURE__ */ t("div", { className: "hf-qty__row", children: [
      !c && /* @__PURE__ */ e("button", { type: "button", className: "hf-qty__b", "aria-label": `Less: ${n}`, onClick: () => b(-1), children: /* @__PURE__ */ e(Be, { size: 18, "aria-hidden": "true" }) }),
      /* @__PURE__ */ e(
        "input",
        {
          id: f,
          type: "number",
          inputMode: "decimal",
          min: s,
          max: r,
          step: "any",
          value: a ?? "",
          className: d ? "hf-input hf-input--err" : "hf-input",
          "aria-invalid": d ? !0 : void 0,
          "aria-describedby": p,
          onChange: (_) => i(_.target.value),
          onWheel: (_) => _.currentTarget.blur(),
          ...k
        }
      ),
      !c && /* @__PURE__ */ e("button", { type: "button", className: "hf-qty__b", "aria-label": `More: ${n}`, onClick: () => b(1), children: /* @__PURE__ */ e(mn, { size: 18, "aria-hidden": "true" }) }),
      l && /* @__PURE__ */ e("span", { className: "hf-qty__u", children: l })
    ] }),
    d && /* @__PURE__ */ e("span", { id: `${f}-e`, className: "hf-fld__e", children: d })
  ] });
}
function va({ items: n, columns: a = 2 }) {
  const i = n.filter((l) => l.value !== null && l.value !== void 0 && l.value !== "" && l.value !== !1);
  return i.length ? /* @__PURE__ */ e("dl", { className: `hf-kv hf-kv--${a}`, children: i.map((l) => /* @__PURE__ */ t("div", { children: [
    /* @__PURE__ */ e("dt", { children: l.label }),
    /* @__PURE__ */ e("dd", { children: l.value })
  ] }, l.label)) }) : null;
}
function Ca({ children: n, icon: a }) {
  return /* @__PURE__ */ t("p", { className: "hf-quiet", children: [
    a ?? /* @__PURE__ */ e(Y, { size: 16, "aria-hidden": "true" }),
    /* @__PURE__ */ e("span", { children: n })
  ] });
}
function Ba({ name: n, label: a = "Working in", onClick: i, compact: l }) {
  const s = l ? "hf-unit hf-unit--pill" : "hf-unit", r = /* @__PURE__ */ t(z, { children: [
    /* @__PURE__ */ e(_n, { size: l ? 16 : 20, "aria-hidden": "true" }),
    l ? /* @__PURE__ */ e("span", { className: "hf-unit__n", children: n }) : /* @__PURE__ */ t("span", { className: "hf-unit__b", children: [
      /* @__PURE__ */ e("span", { className: "hf-unit__l", children: a }),
      /* @__PURE__ */ e("span", { className: "hf-unit__n", children: n })
    ] }),
    i && /* @__PURE__ */ e(bn, { size: 16, "aria-hidden": "true" })
  ] });
  return i ? /* @__PURE__ */ e("button", { type: "button", className: s, onClick: i, "aria-label": `${a}: ${n}. Switch`, children: r }) : /* @__PURE__ */ e("div", { className: s, "aria-label": `${a}: ${n}`, children: r });
}
function ln(n = /* @__PURE__ */ new Date()) {
  const a = n.getHours();
  return a < 5 ? "Working late" : a < 12 ? "Good morning" : a < 17 ? "Good afternoon" : "Good evening";
}
function xa({ firstName: n, reportsTo: a, leads: i = 0, tenure: l, quote: s, search: r, onAppearance: o, onPrivacy: c, now: h = /* @__PURE__ */ new Date() }) {
  const d = h.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  return /* @__PURE__ */ t("div", { className: "hf", children: [
    /* @__PURE__ */ t("div", { className: "hf-topbar", children: [
      /* @__PURE__ */ e("p", { className: "hf-topbar__date", children: d }),
      r && /* @__PURE__ */ e("div", { className: "hf-topbar__search", children: r }),
      o && /* @__PURE__ */ e("button", { type: "button", className: "hf-topbar__gear", onClick: o, "aria-label": "Appearance settings", "data-tour": "gear", children: /* @__PURE__ */ e(xe, { size: 20 }) })
    ] }),
    /* @__PURE__ */ t("header", { className: "hf-greet", "data-tour": "topbar", children: [
      /* @__PURE__ */ t("h1", { className: "hf-display hf-greet__h1", children: [
        ln(h),
        ", ",
        n
      ] }),
      (a || i > 0 || l) && /* @__PURE__ */ t("div", { className: "hf-greet__meta", children: [
        a && /* @__PURE__ */ t("span", { children: [
          /* @__PURE__ */ e(Re, { size: 14 }),
          "Reports to ",
          a
        ] }),
        i > 0 && /* @__PURE__ */ t("span", { children: [
          /* @__PURE__ */ e(Oe, { size: 14 }),
          "Leads ",
          i,
          " ",
          i === 1 ? "person" : "people"
        ] }),
        l && /* @__PURE__ */ t("span", { children: [
          /* @__PURE__ */ e(Ye, { size: 14 }),
          l
        ] })
      ] }),
      c && /* @__PURE__ */ t("button", { type: "button", className: "hf-greet__privacy", onClick: c, children: [
        /* @__PURE__ */ e(Qe, { size: 12 }),
        /* @__PURE__ */ e("span", { children: "Only you can see this page" }),
        /* @__PURE__ */ e($, { size: 12 })
      ] }),
      s && /* @__PURE__ */ t("blockquote", { className: "hf-greet__quote", children: [
        "“",
        s.body,
        "”",
        s.author && /* @__PURE__ */ t("footer", { children: [
          "— ",
          s.author
        ] })
      ] })
    ] })
  ] });
}
const O = (n) => `hf-tone-${n}`, E = (...n) => n.filter(Boolean).join(" "), zn = (n) => n.split(" ").filter(Boolean).map((a) => a[0]).slice(0, 2).join("").toUpperCase();
function Sa({ name: n, role: a, company: i, photo: l, onOpen: s }) {
  return l ? /* @__PURE__ */ t("section", { className: "hf hf-card hf-profile hf-profile--photo", "aria-label": "Your profile", "data-tour": "profile", children: [
    /* @__PURE__ */ e("img", { className: "hf-profile__photo", src: l, alt: n }),
    /* @__PURE__ */ t("div", { className: "hf-profile__over", children: [
      /* @__PURE__ */ e("h2", { className: "hf-display hf-profile__name", children: n }),
      (a || i) && /* @__PURE__ */ e("p", { className: "hf-profile__role", children: [a, i].filter(Boolean).join(" · ") })
    ] }),
    s && /* @__PURE__ */ e("button", { type: "button", className: "hf-sr", onClick: s, children: "Open my access" })
  ] }) : /* @__PURE__ */ e("section", { className: "hf hf-card hf-profile", "aria-label": "Your profile", "data-tour": "profile", children: /* @__PURE__ */ t(s ? "button" : "div", { className: E("hf-profile__row", s && "hf-press"), onClick: s, type: s ? "button" : void 0, style: s ? { width: "100%", textAlign: "left" } : void 0, children: [
    /* @__PURE__ */ e("span", { className: "hf-avatar", "aria-hidden": "true", children: zn(n) }),
    /* @__PURE__ */ t("span", { style: { flex: 1, minWidth: 0 }, children: [
      /* @__PURE__ */ e("h2", { className: "hf-display hf-profile__name hf-truncate", title: n, children: n }),
      (a || i) && /* @__PURE__ */ t("p", { className: "hf-profile__role hf-truncate", children: [
        a && /* @__PURE__ */ e("b", { children: a }),
        a && i && /* @__PURE__ */ e("span", { className: "hf-profile__co", children: " · " }),
        i && /* @__PURE__ */ e("span", { className: "hf-profile__co", children: i })
      ] })
    ] }),
    s && /* @__PURE__ */ e("span", { className: "hf-profile__chev", "aria-hidden": "true", children: /* @__PURE__ */ e($, { size: 18 }) })
  ] }) });
}
function H({ text: n, label: a = "What does this mean?", align: i = "centre" }) {
  const [l, s] = C(!1), r = Q(), o = I(null), [c, h] = C(i);
  return T(() => {
    if (!l) return;
    const d = o.current;
    if (d && i === "centre") {
      const u = d.getBoundingClientRect();
      u.left + u.width / 2 - 130 < 8 ? h("right") : u.left + u.width / 2 + 130 > window.innerWidth - 8 ? h("left") : h("centre");
    }
    const A = (u) => {
      u.key === "Escape" && s(!1);
    }, m = () => s(!1);
    return document.addEventListener("keydown", A), document.addEventListener("click", m), () => {
      document.removeEventListener("keydown", A), document.removeEventListener("click", m);
    };
  }, [l, i]), /* @__PURE__ */ t("span", { className: "hf-hint", ref: o, children: [
    /* @__PURE__ */ e(
      "button",
      {
        type: "button",
        className: "hf-hint__btn",
        "aria-label": a,
        "aria-expanded": l,
        "aria-describedby": l ? r : void 0,
        onClick: (d) => {
          d.stopPropagation(), s((A) => !A);
        },
        children: "?"
      }
    ),
    l && /* @__PURE__ */ e(
      "span",
      {
        id: r,
        role: "tooltip",
        className: `hf-hint__pop${c === "left" ? " hf-hint__pop--left" : c === "right" ? " hf-hint__pop--right" : ""}`,
        onClick: (d) => d.stopPropagation(),
        children: n
      }
    )
  ] });
}
function te({ open: n, title: a, subtitle: i, onClose: l, children: s, wide: r }) {
  const o = Q(), c = I(null), h = I(l);
  return T(() => {
    h.current = l;
  }), T(() => {
    var u;
    if (!n) return;
    const d = document.activeElement;
    (u = c.current) == null || u.focus();
    const A = (k) => {
      k.key === "Escape" && h.current();
    };
    window.addEventListener("keydown", A);
    const m = document.body.style.overflow;
    return document.body.style.overflow = "hidden", () => {
      var k;
      window.removeEventListener("keydown", A), document.body.style.overflow = m, (k = d == null ? void 0 : d.focus) == null || k.call(d);
    };
  }, [n]), n ? /* @__PURE__ */ e("div", { className: "hf hf-scrim", onClick: l, children: /* @__PURE__ */ t("div", { className: r ? "hf-sheet hf-sheet--wide" : "hf-sheet", role: "dialog", "aria-modal": "true", "aria-labelledby": o, onClick: (d) => d.stopPropagation(), children: [
    /* @__PURE__ */ t("div", { className: "hf-sheet__head", children: [
      /* @__PURE__ */ t("div", { children: [
        /* @__PURE__ */ e("h2", { id: o, className: "hf-sheet__title", children: a }),
        i && /* @__PURE__ */ e("p", { className: "hf-sheet__sub", children: i })
      ] }),
      /* @__PURE__ */ e("button", { ref: c, type: "button", className: "hf-sheet__close", onClick: l, "aria-label": "Close", children: /* @__PURE__ */ e(Ae, { size: 18 }) })
    ] }),
    s
  ] }) }) : null;
}
function Mn(n) {
  const a = n.reduce((i, l) => i + l.weight, 0) || 1;
  return Math.round(n.reduce((i, l) => i + l.score / l.max * l.weight, 0) / a * 100);
}
function En(n, a) {
  return n >= a.exceeding ? { label: "Exceeding", icon: /* @__PURE__ */ e(fe, { size: 12 }), tone: "brand" } : n >= a.onTrack ? { label: "On track", icon: /* @__PURE__ */ e(Ze, { size: 12 }), tone: "pop" } : { label: "Needs attention", icon: /* @__PURE__ */ e(Je, { size: 12 }), tone: "coral" };
}
function Pn({ history: n }) {
  if (n.length < 2) return null;
  const a = Math.min(...n) - 4, i = Math.max(...n) + 2, l = 120 / (n.length - 1), s = n.map((c, h) => [h * l, 30 - (c - a) / (i - a || 1) * 28]), r = s.map((c, h) => (h ? "L" : "M") + c[0].toFixed(1) + " " + c[1].toFixed(1)).join(" "), o = s[s.length - 1];
  return /* @__PURE__ */ t("svg", { viewBox: "0 0 120 32", role: "img", "aria-label": `Last ${n.length} months: ${n.join(", ")}`, children: [
    /* @__PURE__ */ e("path", { d: `${r} L${o[0]} 32 L0 32 Z`, fill: "rgb(var(--brand-500) / .12)" }),
    /* @__PURE__ */ e("path", { d: r, fill: "none", stroke: "rgb(var(--brand-500))", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ e("circle", { cx: o[0], cy: o[1], r: "3", fill: "rgb(var(--brand-500))" })
  ] });
}
function Wa({ factors: n, bands: a, conductPolicy: i, status: l, history: s = [], improve: r = [], building: o, title: c = "Your HiFive Factor" }) {
  var se;
  const [h, d] = C(!1), [A, m] = C(0), [u, k] = C(0), N = Mn(n), f = typeof window < "u" && ((se = window.matchMedia) == null ? void 0 : se.call(window, "(prefers-reduced-motion: reduce)").matches), p = typeof document < "u" && document.documentElement.getAttribute("data-tier") === "lite", b = f || p;
  T(() => {
    if (b) {
      m(1), k(N);
      return;
    }
    const w = setTimeout(() => m(1), 100), P = setTimeout(() => {
      let U = 0;
      const Z = performance.now(), ae = (le) => {
        const g = Math.min(1, (le - Z) / 1100);
        k(Math.round(N * (1 - Math.pow(1 - g, 3)))), g < 1 && (U = requestAnimationFrame(ae));
      };
      return U = requestAnimationFrame(ae), () => cancelAnimationFrame(U);
    }, 650);
    return () => {
      clearTimeout(w), clearTimeout(P);
    };
  }, [N, b]);
  const _ = n.reduce((w, P) => w + P.weight, 0) || 1, x = 45, y = 2 * Math.PI * x;
  let M = 0;
  const W = n.map((w) => {
    const P = w.score / w.max * w.weight / _ * y, U = { ...w, len: P, offset: M };
    return M += P, U;
  }), v = En(N, a), S = n.find((w) => w.balance), B = S && i ? S.score >= i.warn ? "ok" : S.score >= i.formalWarning ? "watch" : "risk" : "ok", V = `${c} ${N} out of 100: ` + n.map((w) => `${w.label} ${w.score} of ${w.max}`).join(", ") + (l ? `. ${l}` : ""), L = s.length >= 2 ? N - s[0] : null;
  return /* @__PURE__ */ t(z, { children: [
    /* @__PURE__ */ t("button", { type: "button", className: "hf hf-card hf-card--hero hf-factor hf-press", onClick: () => d(!0), "data-tour": "factor", "aria-haspopup": "dialog", children: [
      /* @__PURE__ */ t("div", { className: "hf-factor__head", children: [
        /* @__PURE__ */ t("div", { children: [
          /* @__PURE__ */ t("h3", { className: "hf-display hf-factor__title", children: [
            c,
            " ",
            /* @__PURE__ */ e(H, { text: `One number, 0 to 100, built from ${n.map((w) => `${w.label.toLowerCase()} (${Math.round(w.weight / _ * 100)}%)`).join(", ")}. It is never compared with anyone else. Tap the card for the full breakdown.` })
          ] }),
          /* @__PURE__ */ e("p", { className: "hf-factor__tap", children: "Tap to see how it's built" })
        ] }),
        /* @__PURE__ */ e("span", { className: "hf-factor__chev", "aria-hidden": "true", children: /* @__PURE__ */ e($, { size: 18 }) })
      ] }),
      /* @__PURE__ */ t("div", { className: "hf-factor__row", children: [
        /* @__PURE__ */ t("div", { className: "hf-ring", children: [
          /* @__PURE__ */ t("svg", { viewBox: "0 0 100 100", role: "img", "aria-label": o ? `${c}: building, first score after your first review` : V, children: [
            /* @__PURE__ */ e("circle", { className: "hf-ring__track", cx: "50", cy: "50", r: x, fill: "none", strokeWidth: "8" }),
            !o && W.map((w, P) => /* @__PURE__ */ e(
              "circle",
              {
                className: E("hf-ring__seg", O(w.tone)),
                cx: "50",
                cy: "50",
                r: x,
                fill: "none",
                strokeWidth: "8",
                stroke: "var(--hf-tone-bar)",
                style: { transitionDelay: `${P * 120}ms`, strokeDasharray: `${w.len * A} ${y}`, strokeDashoffset: -w.offset }
              },
              w.key
            ))
          ] }),
          o ? /* @__PURE__ */ e("span", { className: "hf-ring__building", children: "Building — first score after your first review" }) : /* @__PURE__ */ e("span", { className: "hf-ring__num hf-num", "aria-hidden": "true", children: u })
        ] }),
        /* @__PURE__ */ t("div", { style: { flex: 1, minWidth: 0 }, children: [
          !o && /* @__PURE__ */ t("span", { className: E("hf-band", O(v.tone)), children: [
            v.icon,
            " ",
            v.label
          ] }),
          l && /* @__PURE__ */ e("p", { className: "hf-factor__status", children: l }),
          S && i && B !== "ok" && /* @__PURE__ */ t("p", { className: "hf-factor__warn", children: [
            S.score,
            " conduct points left",
            B === "risk" ? " · formal warning stage" : ""
          ] }),
          /* @__PURE__ */ e("div", { className: "hf-legend", children: n.map((w) => /* @__PURE__ */ t("div", { className: O(w.tone), children: [
            /* @__PURE__ */ e("i", { "aria-hidden": "true" }),
            /* @__PURE__ */ e("span", { children: w.label }),
            /* @__PURE__ */ e("span", { className: "hf-legend__n", children: w.balance ? `${w.score}/${w.max} left` : `${w.score}/${w.max}` })
          ] }, w.key)) })
        ] })
      ] }),
      s.length >= 2 && /* @__PURE__ */ t("div", { className: "hf-spark", children: [
        /* @__PURE__ */ e(Pn, { history: s }),
        /* @__PURE__ */ e("div", { children: L !== null && /* @__PURE__ */ t(z, { children: [
          /* @__PURE__ */ t("b", { children: [
            L >= 0 ? "+" : "",
            L
          ] }),
          " over ",
          s.length,
          " months"
        ] }) })
      ] }),
      /* @__PURE__ */ t("span", { className: "hf-factor__cta", "aria-hidden": "true", children: [
        /* @__PURE__ */ e("span", { children: "See how it's built" }),
        /* @__PURE__ */ e("span", { children: /* @__PURE__ */ e($, { size: 20 }) })
      ] })
    ] }),
    /* @__PURE__ */ t(te, { open: h, onClose: () => d(!1), title: c, subtitle: o ? "How it will be built" : `How your ${N} is built`, children: [
      /* @__PURE__ */ e("p", { className: "hf-muted", style: { margin: "0 0 20px", fontSize: 14, lineHeight: 1.6 }, children: "One number that brings together your performance, your conduct and your learning. Only you, your management line, HR and the directors can see it, and it is never compared with anyone else." }),
      /* @__PURE__ */ e("div", { className: "hf-break", children: n.map((w) => {
        const P = Math.round(w.score / w.max * 100), U = Math.round(w.weight / _ * 100), Z = w.balance ? B === "ok" ? "brand" : B === "watch" ? "warn" : "danger" : w.tone;
        return /* @__PURE__ */ t("div", { className: O(Z), children: [
          /* @__PURE__ */ t("div", { className: "hf-break__head", children: [
            /* @__PURE__ */ t("b", { children: [
              w.label,
              " ",
              /* @__PURE__ */ t("small", { children: [
                "· ",
                U,
                "% of score"
              ] })
            ] }),
            /* @__PURE__ */ e("b", { className: "hf-num", style: { fontWeight: 600 }, children: w.balance ? `${w.score} of ${w.max} left` : `${w.score}/${w.max}` })
          ] }),
          /* @__PURE__ */ t("div", { className: "hf-break__bar", role: "img", "aria-label": `${w.label}: ${P}%`, children: [
            /* @__PURE__ */ e("i", { style: { width: `${P}%` } }),
            w.balance && i && /* @__PURE__ */ e("span", { className: "hf-break__mark", style: { left: `${Math.round(i.formalWarning / w.max * 100)}%` }, title: `Below ${i.formalWarning} points: formal warning` })
          ] }),
          /* @__PURE__ */ e("p", { className: "hf-break__hint", children: w.hint })
        ] }, w.key);
      }) }),
      l && /* @__PURE__ */ t("div", { className: "hf-note", children: [
        /* @__PURE__ */ e(Ve, { size: 14, style: { flex: "none", marginTop: 2 } }),
        /* @__PURE__ */ t("span", { children: [
          l,
          ". Your reporting manager will confirm each checkpoint with you."
        ] })
      ] }),
      r.length > 0 && /* @__PURE__ */ t("div", { className: "hf-improve", children: [
        /* @__PURE__ */ e("h4", { children: "What would move it up" }),
        /* @__PURE__ */ e("ol", { children: r.map((w, P) => /* @__PURE__ */ t("li", { children: [
          /* @__PURE__ */ e("i", { children: P + 1 }),
          /* @__PURE__ */ e("span", { children: w })
        ] }, P)) })
      ] })
    ] })
  ] });
}
function oe({ tone: n, icon: a, value: i, label: l, pulse: s, hint: r, onClick: o }) {
  return /* @__PURE__ */ t(o ? "button" : "div", { className: E("hf-tile hf-press", O(n)), onClick: o, type: o ? "button" : void 0, children: [
    /* @__PURE__ */ t("div", { className: "hf-tile__top", children: [
      /* @__PURE__ */ t("span", { className: "hf-tile__ic", children: [
        a,
        s && /* @__PURE__ */ e("span", { className: "hf-tile__pulse", "aria-hidden": "true" })
      ] }),
      r && /* @__PURE__ */ e(H, { text: r })
    ] }),
    /* @__PURE__ */ t("div", { children: [
      /* @__PURE__ */ e("span", { className: "hf-tile__value hf-num", children: i }),
      /* @__PURE__ */ e("span", { className: "hf-tile__label hf-clamp-2", children: l })
    ] })
  ] });
}
function Da({ score: n, max: a, policy: i, label: l = "Conduct points left", hint: s, onClick: r }) {
  const o = !i || n >= i.warn ? "ok" : n >= i.formalWarning ? "watch" : "risk", c = o === "ok" ? "brand" : o === "watch" ? "warn" : "danger", h = o === "ok" ? "" : o === "watch" ? " · take care" : " · urgent", d = s ?? `Conduct points are a balance. Everyone starts with ${a}. A recorded issue deducts points; at 0 the contract ends. A clean record restores points over time.${i ? ` Fewer than ${i.formalWarning} means a formal warning.` : ""}`;
  return /* @__PURE__ */ t(
    r ? "button" : "div",
    {
      className: E("hf-tile hf-press", O(c)),
      onClick: r,
      type: r ? "button" : void 0,
      "aria-label": `${l}: ${n} of ${a}${h}`,
      children: [
        /* @__PURE__ */ t("div", { className: "hf-tile__top", children: [
          /* @__PURE__ */ e("span", { className: "hf-tile__ic", children: /* @__PURE__ */ e(gn, { size: 18 }) }),
          /* @__PURE__ */ e(H, { text: d })
        ] }),
        /* @__PURE__ */ t("div", { children: [
          /* @__PURE__ */ t("span", { className: "hf-tile__value hf-num", children: [
            n,
            /* @__PURE__ */ t("small", { children: [
              " / ",
              a
            ] })
          ] }),
          /* @__PURE__ */ e("span", { className: "hf-pips", "aria-hidden": "true", children: Array.from({ length: a }, (m, u) => /* @__PURE__ */ e("i", { className: u < Math.floor(n) ? "on" : "" }, u)) }),
          /* @__PURE__ */ t("span", { className: "hf-tile__label hf-clamp-2", children: [
            l,
            h
          ] })
        ] })
      ]
    }
  );
}
function Fa({ children: n, wrap: a = !0, label: i }) {
  return /* @__PURE__ */ e("div", { className: E("hf-tiles", a && "hf-tiles--wrap"), role: i ? "group" : void 0, "aria-label": i, children: n });
}
const Tn = {
  joiner: { icon: /* @__PURE__ */ e(ue, { size: 20 }), tone: "sky" },
  induction: { icon: /* @__PURE__ */ e(fe, { size: 20 }), tone: "brand" },
  probation: { icon: /* @__PURE__ */ e(Se, { size: 20 }), tone: "brand" },
  anniversary: { icon: /* @__PURE__ */ e(en, { size: 20 }), tone: "pop" },
  kudos: { icon: /* @__PURE__ */ e(Nn, { size: 20 }), tone: "pop" }
};
function Ee({ item: n, onReact: a }) {
  var o, c;
  if (n.type === "pinned")
    return /* @__PURE__ */ t("article", { className: "hf hf-card hf-pinned", children: [
      /* @__PURE__ */ t("div", { className: "hf-pinned__tag", children: [
        /* @__PURE__ */ e(Ge, { size: 12 }),
        " Pinned by HR"
      ] }),
      n.title && /* @__PURE__ */ e("h4", { children: n.title }),
      /* @__PURE__ */ e("p", { children: n.text })
    ] });
  const { icon: i, tone: l } = Tn[n.type], s = !!((o = n.mine) != null && o.like), r = !!((c = n.mine) != null && c.clap);
  return /* @__PURE__ */ t("article", { className: E("hf hf-card hf-feedcard", O(l)), children: [
    /* @__PURE__ */ t("div", { className: "hf-feedcard__row", children: [
      /* @__PURE__ */ e("span", { className: "hf-feedcard__ic", "aria-hidden": "true", children: i }),
      /* @__PURE__ */ t("div", { style: { minWidth: 0 }, children: [
        /* @__PURE__ */ e("p", { className: "hf-feedcard__text", children: n.text }),
        n.from && /* @__PURE__ */ t("p", { className: "hf-feedcard__from", children: [
          "— from the ",
          n.from
        ] }),
        /* @__PURE__ */ e("p", { className: "hf-feedcard__when", children: n.when })
      ] })
    ] }),
    a && /* @__PURE__ */ t("div", { className: "hf-feedcard__acts", children: [
      /* @__PURE__ */ t("button", { type: "button", className: "hf-react", "aria-pressed": s, "aria-label": `Thumbs up, ${n.likes}`, onClick: () => a(n.id, "like"), children: [
        /* @__PURE__ */ e(Xe, { size: 14 }),
        " ",
        n.likes
      ] }),
      /* @__PURE__ */ t("button", { type: "button", className: "hf-react", "aria-pressed": r, "aria-label": `Clap, ${n.claps}`, onClick: () => a(n.id, "clap"), children: [
        /* @__PURE__ */ e(X, { size: 14 }),
        " ",
        n.claps
      ] })
    ] })
  ] });
}
function $n({ onKudos: n }) {
  return /* @__PURE__ */ t("div", { className: "hf hf-card hf-feed__quiet hf-tone-brand", children: [
    /* @__PURE__ */ e("span", { className: "hf-feedcard__ic", "aria-hidden": "true", children: /* @__PURE__ */ e(Ke, { size: 20 }) }),
    /* @__PURE__ */ e("p", { className: "hf-display", children: "Nothing new since yesterday" }),
    /* @__PURE__ */ e("p", { className: "hf-muted", children: "A quiet day across HiFive. New joiners, inductions and kudos appear here as they happen." }),
    n && /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: n, children: "Be the first — give kudos" })
  ] });
}
function za({ items: n, onReact: a, onKudos: i }) {
  const l = n.filter((r) => r.type === "pinned"), s = n.filter((r) => r.type !== "pinned");
  return /* @__PURE__ */ t("div", { className: "hf-feed", "data-tour": "feed", children: [
    l.map((r) => /* @__PURE__ */ e(Ee, { item: r }, r.id)),
    s.length === 0 ? /* @__PURE__ */ e($n, { onKudos: i }) : s.map((r) => /* @__PURE__ */ e(Ee, { item: r, onReact: a }, r.id))
  ] });
}
function In(n, a, i = 8) {
  const l = a.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return l.length ? n.filter((s) => {
    const r = s.name.toLowerCase().split(/\s+/);
    return l.every((o) => r.some((c) => c.startsWith(o)));
  }).slice(0, i) : [];
}
function rn(n) {
  const a = n.trim().split(/\s+/).filter(Boolean);
  return a.length ? a[0].endsWith(".") && a[1] ? `${a[0]} ${a[1]}` : a[0] : n;
}
const Un = {
  performance: "data:image/webp;base64,UklGRgIFAABXRUJQVlA4WAoAAAAgAAAAVwAAVwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggFAMAAPASAJ0BKlgAWAA+USSPRSOiIZVbVKw4BQSxgGoAiR0vg1DQwsfEA6YfmA/gHSl9ADpAN5W/bP9a5q/w52UOiDX1/kBxAdzPG9pGppPkVzS+qT+03sAGPgLIYiXV9ejQwgLcUuNzMWnk1ZI1EH9d4FbWj9ICKNaQ7y0Ue6yQ0SxfKLkjK6TIaVbPETgY2K3ZahH9l87k0rsr9iLuG1P9/AAA/v3Aghu2439Qd9ndP6czgI92SKFEwS5tiwZfn9orR4ghd+3i+wDXXxj/7f/5PvVLW+mUuzj//aPeUUAG30/U1yK0a0SnsdBZuB4JTn5R7gjWKpVH5Ww+NU6SZX+jARJ7/1YH36tmJQ9Ew5MMsyGQK+JkqfKx+37xM7L4V0BYzQkz7Rwp6jCAe1RFI2xVNr+6l6Idg6slM/prv1IaHbl4URcYl5uFbt6ohiM0xvmkO6hexgDu1p+rUeVJjaZqUI7jPJa+EpretNQywg8H2OZ/dcaD1S+jDJXY1IR/sf3fXF/4avpG7HPofHtKo5Gj+vUjTha2ltklbV0BmS5UfzY/hypLTpIuf3HeqcxXidxUBNgdh/HH3MzI5upJnRIxx8iYUPuntMGforRxMnGZSg/uqMKZVo9hCTX0RMOH/06//5zhVXGFQ6zXIg/fIChXJvvfslt0E6Cyo2vW5wnQWVGidPIX8NB1jSOakUlCsg4v6I02BzXPTGZ0O/pb3oVuFblfnIPEafJLCLpY0VXxDvq9KkSrjrN+1msf9H/+fnUyFe1PiJ4cgFfUybZk0S8QFe6T57C0vBLD8+981yMVEGDvUwext8MW8D1ZJs+YuMQcO/2AV61JNOhzxsSbZ9I5514/sMVL2GfeTTYlPe+vj8j/B/d8FBOHrzp8QCereJC/VO33BQNguDqaJTgZOWOihdi0fAvBmh02qRuM69inkOEH1PU8uj1GPubjSExKXCbhuYhZf2EghBf/9kw8B/7tDja5egGGS1HvOLAx5mDdBkg+qzSIhUpc2mx0dxtH9HRyhaZBO+Yx0ibj/h7SU2lg/gAAAAAA",
  recruitment: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='s' x1='10' y1='95' x2='90' y2='5' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%231F2530'/%3E%3Cstop offset='1' stop-color='%2366738C'/%3E%3C/linearGradient%3E%3ClinearGradient id='a' x1='40' y1='62' x2='92' y2='38' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23C2441A'/%3E%3Cstop offset='1' stop-color='%23FFB772'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpolygon points='22,12 70,12 70,28 32,28 32,72 70,72 70,88 14,88 14,20' fill='url(%23s)'/%3E%3Cpolygon points='40,38 76,38 92,50 76,62 40,62' fill='url(%23a)'/%3E%3C/svg%3E",
  apml: "data:image/webp;base64,UklGRmoFAABXRUJQVlA4WAoAAAAgAAAAVwAAVwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggfAMAAPASAJ0BKlgAWAA+USiPRSOioROc/Ug4BQSgDVLTG7hwfRv+wEIB5gOhbvCv7VewB0sb74pxrQ5YGk7meeMqix9cHoS/qqXpY3x655dradJOzRa5ms/yHQwuXAKJQlY5EWIq4//Oa5tIqXEOwztiDQyE8xcj4axcbNsUKo4plJ0P7PptSSZjYTcgKbqkg2WyqrM198RH8JTzOqYGwm6fNwAA/v3Ague+W+LHH/elKq59V8aAMIr3lwXTM8h/+Ll/UftLuAnNo98V+oOrz9t17gWu8hj/dw870eqmFUQkDw4fwHABx11jSq+l/82//xYfugGX8XBAm+Wk9QnM75QRS+dIB7UV5rhoFLcHX7rJfclqN0d2iCJm+1LsxuDpj4rDL97LZJTDrBf+aUnu5ZZGYLWlcqRi4+WwQMZen1XJafOWlb9OJ+l30Ymk2TEBXkTSBK8kIgfGl04AEbXmTKHSG59Qm5h7iGuNHqaw620sjGXnclN2ReYclfZWLO9pJcIUq1ajIyqneO5OfrThtcIPmdpkrzaf0rP6QE3lmmtFZmqvQuEYi+fV/CeA3I1CXZUsV22jItfKqsGVHAuR2uhynXblcw9temOKkq165KpLk1kwgsMUyv3itFYaSmoIl7SIJYPNP2ph6xdqA0aDCllkboZNxSxOUBIHg7ky1M6wL2cTSUZg6p/p6v1dAGDPcIhYIb2SZxQqmdF9tqJLbKMMboxCBQ9q0q6/KGv2SuEX/8eo0Pnx03YBMsZ+CiZA2HfT5LD7jDcr6/S6369hQ+3s3KvjLksNJyz6QH4+giUQWxOe1GOtgbe35kUJjrIfC6IRGng5rr1g4ehimy3EyHo8CoSUMtwNWrG1pt8yAug1jDC4UOZ06CnRlwRX5SZgh2y7w2Opx3LEzUVO/Tov1gegpVKYLem/6yMP88sByGiTOpSziJW5zrW0Mwb7QgPNVBz9wERNFm3Al64zmCqOA43nLHrFT1kOq0ZKOvt/T3hxdP/nwwl9ldfnJi6YReYIyEE8JGtDdfWXDW/7IduWDzwPApwbipHMIo+miBrHrTpOeJF54DQ6XlehVGdalS9BMJyErPHbOSARbQIRh94q7XwUmEhM0hRmJ9W/hi5kmh5L9Y03UcMvUO5qx1HnvgcjJpLajuWVQ8FIsp3nsfN+SgOkvH0XtFgniSgKGoQAAAA=",
  learning: "data:image/webp;base64,UklGRmYMAABXRUJQVlA4WAoAAAAwAAAAPwAAPwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZBTFBIvQYAAA3whv2TIVnbtv0ismoO27Zt27Ztc3GOdZhz2MexcNi2bdu2vY7FWVUR8aGqenqOkx8jYgL4v2N6YPWRWomO71f+VQIkJn9z6kIqNsmTG3rvJNsNn5QashFOrUxKRjX5WtNfnawXpJxqf4J6caUxJGpABg3+RaJ96n0ox2tAokmQOrV5Nz9bvW1aLLQmid5VDn7iXfV2wXFY1ktikx95Au1OxUYTRgYQFQlpComKAMm3H3VvsrZI2dFJCBAiAOpNggARQvW408ZItEN9XyynOnycIFk5RYP/mUqI8SYFUFt+ySHqbZByxl1QIOS7bYdnIcV0SgDBiA3+yEPKSW+dOQSUAdd+K9Ez9YFYBrieTxoLQbP/6hDp50cOcwWxWXfpUu+RFsssiQKef/AcIQABqAMC4AxZdWFXUPZ960X1ngTHYRkQciapoFFMAqISafjgviEgNuHAE4IepnJbrAPw/OVPcZrTsq94UO9cO89KrpB844luSdaSlBP1QajtIpUNWbnDIRfekJV1kcaePZD6Y8/9S6IV9cOwHLD8obFSUp+6V96JS294MlkNJneNv4ElUFtsjQvVW9Birs1QIJKfjkSdFnOcTDH5kGM+U69B/bSBKQSUI+/6VL0JjsIywNPNaEmt2MRXYOPbHOfsNkKixvTJn7Y3BbFp9z+FZi1Xnz0SENmYC2g1PIVAmdFq12ETh0CKPb5+XL1GTI/FKpauIhUNoSN2P33eYvwvBiDe4OmNN/ZwBTw79sRSoqK+O9YBRP7HlYRG1ODpq85LpxxxAKmkXqTk7D2nDoFka8x5lTog5dT7IQCuF5MKSB4VLD139eD9yLqpFS2D9OlDB7oCwqAhP0uAeh8sBzz/9m6cVd/7VZIHgMnNZ2ZSUBU1m2qhZ5wLN5/dFbScd/Nz1NFi4dVRgJBzScbx2w6+5ndJ4UD4m0pV1GyKXQ946jjRH248PARIHPzU2woci2WA5x88jwvFzJ3r3Dr4e1EcQktAxWyGA7YOfgRn6MqLuILY5EeeAL7RhJ4DhJxJKgWlmGW/bR++6DMUx0Exn+uQdYnuDgkiDb+0XwiQfNsx99JxFLXW8eJnONXkNvUeu7923ttIgBiLHr40UaacqnPd3Cu5Uj3+VA7EciASXaSyBlW3Sbff/6tzXgRiub6zE2XK8ZpI3Wd2SgioLbc0+6BU9KPvcZpVwybY7Mjvdu7Ob5qJsJRRlQCMR2ed3wUQ9mbYPq6AxAIzP6YOhFAVjSJf/a2/Jl2GIk/UG0CydQgFCLmMS5ZdzhXEdMBZ4yQgUaoCSKJU3PKMWvcsK0HKrG+d56+9xrhTj6eabOW5r1WXeHqliaJUpZoMUWrd847yOUB9Zyyn9njQe0dvZwkQ+l06XExOuHH/3aaOUhItW+Tpz2suQUzKiQ9AACy/DQVOPHKyEFBbZKVh6iGfXfjYtvvOHIZKg5Hrj0NvQcRR3wfLgchGnAN4evupg10B4Yjrf5QIle8H377uIXNHqZUQy+WLCx5FkgVSTrcjAmDpIlIBztlbzOMKarNvdpE6jqTfrrpy2T6L4Eog2XvnvYIkM0D9ECwHvOOLu3Ag0s9DBoUAykEPfaIO4ZJG3HjR3J3LeIi+3vU5kswAtJhzfRQg5BRSCeBcNcealkDKafc4WwIgXNLYu8+aZVLG7fg9ksyoleiDZYB1PPMFTjW0PPHYLAQSu7/1ujrVcEndz8HIlyWVTr0Wiy2JAqifiFoNrk98tYcpiE186Ok0h6MOak6rA7EMsOxKtKTFU/ebNgQ0tvvpKfU6wAGnxVSsNn0kILLfh9Cqp0/uPtIVxLIBpwXtdzqxius5pKIFnAvWWtQVkm843l3J2pXKzfEc8Py9J3FajTT8nGNDqHae2S3RHinzPjSeSCpbwuTmiTa1BGorznOdenvUd8FywPIHRklJDyVO6JwgBIR+g//SqESTVKSYeH8EiKy7C4meeHrpjf1cQW2RlYeKV1qMisZ+WA64DiUV9Njp2nm2EFAOe/iX8QOxX71Op1GQsdOtiwKR/XANTs8jfXtdf1cQZr510lIi/2mb3yVAYpIHpywksr8DAVy7SGUbcIYsubwrwGQdEGR/OrU6BRlIBIDnr76B085IY047TgAkAhBXGkMCEKnACaSyLZjeO3pbS4BQlWgShEbLb0EL2n5Cn8lC6NXIRpxD+z2988QhlnrH9SJS0Tacs7eY17ROQppCos47Pr8Lp/2Rfhk8SGhUbxKkDk4hlb2AcfUMa/6tFcnKSRri71TW2GSP/4TRu7bhU3iFcUAAwV9L/EZUGMF/nwBWUDggsgMAADATAJ0BKkAAQAA+tUqdSyckIqGsGqwA4BaJbA21LhWIolQtGE0vDb5PfbO5YC/7h6gNsR5gPPE9C/+M9QD9kusK9ADy3P28+C392vSA0oPYj2M/2uWDwW40++tvefXvRA/YBKd9vg9BD/9PQktSkEbcOMNT9uVL+Beocvog0XzI4zDPy7i7uWXj5NvyUOjYGm+E5AUWdgqh86T0r+eTmh1UgAD++Zt//n4WP4vHvTrlJD/TnBehZOgWb13AqBVGdU0Y/TabcvDWQWzsqHD9JNtBHyaSEmxBn99VoMTAPPlei5qGjg/tunXiESVaylzHnjdrjvegfUtTkB5n1sIW2C2h4PQwygxwsKQWlwGUPDePGRv8/99JKq3hu+7EvTzp9IHmJPnPHCm/HVyBpMZGM9wDdfl9bSWaryF6+jMjppiiv0L9PWYIeYqV8uVbFw+pL8iWFovLxssge6f6I1gp5VyjvVbIeZnNB04kqqlIu+pWzCYdl9Y1bU5STFKvL+EGagnPRhARLSkzg0ebb40EwtwYqx9mDjaG8f4MioFXOsRiXsH0NwY6KP63Xu6zT4ourcpoFmn2F3/DXu+vJuZyaIycDa47wtEZdofvd7KsfKzfuXQiBoZhna7yexqHcss81aMXCu4DUStA0IPge7jwaPuFXIJyWItzR6xpYsdDVqO7QfSVGnHHordk86iITCSlFk8KPF02fVzLSVIyMvMsT+Sc2dyjnRvUGVc9pSsYXJNSfOWSVBFNhIe4HH58dblqoCDqPMdb4gr0dxxHeo541xXlJrIYP5Cf8RHYAGzG+kRn62P0diPt/IRe+dkE3jirosp177z5HO5JRSOqJVZQ1XzxqWp0J+TSW5XwQP3H3+yFru35cRkA+xUPXH1q+nP/TCZZVuvsM5W+VEf0aYgkPl6lKIdUjpqCmWj/MswDu3DJQ19AiCTTwOZiTc1ev8az+Tu2NDN7bf1saP2KAokSrZM2gE9eNIaA2QAsinUjVTJ+O5FOPnrax0RxFTXA4AHsN3GV8+4YKPvTDc4z1vs8UqqQGTKvJY7KQni+l/o3//De1Pc7m7PDOX0Iaf+7WX0GnvTTiEaO5g/lSwx7TaZ50mP9txAOc+cAuez4YUpjiioFQslNKEYUJCzF+VgxsGoXFl9tlWQpoEtVPW/eJ/OWfarqbrzaM1ihb//D9055nj7vjmZLNwahDgPf3+5UhOue42UmVPS9QOyahXzQhDTtuDp1ORjX85lUfhMfXHUIXfP4AAA=",
  logistics: "data:image/webp;base64,UklGRmoEAABXRUJQVlA4WAoAAAAgAAAAVwAAVwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggfAIAAPANAJ0BKlgAWAA+USKPRKOsIZVbVYDABQSygGna2A9F1vBuEDubzHOermuHn0RwlXN2YDYXpPkXTScZD3KX1amRirtex3IDM0F+hi7s4wPJyZigXDPJcGBnwPYy5AnDHv6vMSTJeAF4jMjFARb6sXVKOcPP2H9IAAD+/cCARf2S9MbeF/hMv+SG9PgmY/gtrb34dRABGF9e/4jN5E/xiI41rcCbtX5gogrjDDMT9WT58IWBJu+xfFe9BPPRjh3WOZts/9S5UQDe+BUYkAxruDXttiZNucLZJdRhP4G0m0N9jB/V6HCu0s/ZfxY7macldCWFOq4GtdAkq+//Rx7jXs8J6Y6laMmd1s/4Pv/9Y5G/F4o7ACbrf1POgcZe7xYGpEtlsSqmwp3dXRe3/z//aYnLP/agr1/h7/RNNriO5DvBAISOD/Fiv/b2FBeWc1qHHp3dMztltF5d2wUTXKcX3kLMNOpoCILgGGnUT4mQAnEOAcHz0h+Xs67aYCJMn7/Ad7/TdAxRM2S+vOvv9dtvn54HFDrFD9g38DboorIlPTDjrvC+g1uZJ7/kZdzOtoe0hhqJvvZSl7Hqj/j8EfoqSIdtCfwe86yL0IDfG135qjyty7Y8FFREbLSoH6Z5HTXi48qzE1UGFAwjEBhj33y63+DjHoOF1W2sW//tfogu+c9wrMnf7wR506OmzeYn+P15B9zLyxe/WOCbj80Z7AprMDfgU+L/A4CoSZq7PdEDAcFzhZYrC1JKmMaWyMOLXln98lC3QB+1K37fFgDUtFFez4zPqL3P7PZbNWkTOxrhe1XB/av9HrgdCih2jzqFEAJiNj1F2SLZDoYAAAAAAA=="
}, jn = { lms: "learning", transport: "logistics", apml: "apml", performance: "performance", recruitment: "recruitment" };
function ie({ app: n, size: a = 40, label: i }) {
  const l = Un[jn[n] ?? n], s = n === "todo" ? nn : n === "admin" ? xe : Ze;
  return /* @__PURE__ */ e("span", { className: "hf-mark", style: { width: a, height: a, borderRadius: a * 0.3 }, role: i ? "img" : void 0, "aria-label": i, "aria-hidden": i ? void 0 : !0, children: l ? /* @__PURE__ */ e("img", { src: l, alt: "", width: Math.round(a * 0.72), height: Math.round(a * 0.72) }) : /* @__PURE__ */ e("span", { className: "hf-mark__ic", children: /* @__PURE__ */ e(s, { size: Math.round(a * 0.5) }) }) });
}
const Pe = ["brand", "sky", "pop", "ink"];
function q({ name: n, size: a = 32, ring: i, photo: l }) {
  const r = n.trim().split(/\s+/).slice(0, i || a < 32 ? 1 : 2).map((c) => c[0]).join("").toUpperCase(), o = Pe[[...n].reduce((c, h) => c + h.charCodeAt(0), 0) % Pe.length];
  return /* @__PURE__ */ e("span", { className: `hf-av hf-av--${o}${i ? " hf-av--ring" : ""}`, style: { width: a, height: a, fontSize: Math.round(a * 0.38) }, "aria-hidden": "true", children: l ? /* @__PURE__ */ e("img", { src: l, alt: "" }) : r });
}
function Ma({ onClick: n }) {
  return /* @__PURE__ */ t("button", { type: "button", className: "hf hf-card hf-kudos-btn hf-press", onClick: n, "aria-haspopup": "dialog", children: [
    /* @__PURE__ */ e("span", { className: "hf-kudos-btn__ic", "aria-hidden": "true", children: /* @__PURE__ */ e(X, { size: 16 }) }),
    "Give kudos to a colleague",
    /* @__PURE__ */ e($, { size: 16 })
  ] });
}
function Ea({ open: n, onClose: a, people: i, onSend: l }) {
  const [s, r] = C(""), [o, c] = C(""), h = K(() => In(i, o), [i, o]), d = i.find((b) => b.id === s) ?? null, [A, m] = C(""), [u, k] = C({}), [N, f] = C(!1);
  async function p() {
    const b = {};
    s || (b.to = "Choose who the kudos is for");
    const _ = A.trim();
    if (_.length < 4 && (b.msg = "Add a few words about what they did"), _.length > 280 && (b.msg = "Keep it under 280 characters"), k(b), b.to || b.msg) return;
    const x = i.find((y) => y.id === s);
    f(!0);
    try {
      await l(x, _), r(""), c(""), m(""), a();
    } catch (y) {
      k({ msg: y instanceof Error && y.message ? y.message : "That didn't send. Try again, or tell HR." });
    } finally {
      f(!1);
    }
  }
  return /* @__PURE__ */ t(te, { open: n, onClose: a, title: "Give kudos", children: [
    /* @__PURE__ */ t("div", { className: `hf-field${u.to ? " hf-field--error" : ""}`, children: [
      /* @__PURE__ */ e("label", { htmlFor: "hf-kudos-who", children: /* @__PURE__ */ e("span", { children: "Who" }) }),
      d ? /* @__PURE__ */ t("div", { className: "hf-who", children: [
        /* @__PURE__ */ e(q, { name: d.name, size: 32 }),
        /* @__PURE__ */ t("span", { className: "hf-who__txt", children: [
          /* @__PURE__ */ e("b", { children: d.name }),
          d.detail && /* @__PURE__ */ e("span", { children: d.detail })
        ] }),
        /* @__PURE__ */ e("button", { type: "button", className: "hf-who__x", "aria-label": `Change from ${d.name}`, onClick: () => {
          r(""), c("");
        }, children: /* @__PURE__ */ e(Ae, { size: 16 }) })
      ] }) : /* @__PURE__ */ t(z, { children: [
        /* @__PURE__ */ t("div", { className: "hf-who__search", children: [
          /* @__PURE__ */ e(Ce, { size: 16, "aria-hidden": "true" }),
          /* @__PURE__ */ e(
            "input",
            {
              id: "hf-kudos-who",
              type: "search",
              value: o,
              autoComplete: "off",
              placeholder: i.length ? "Type a name" : "Loading colleagues…",
              onChange: (b) => c(b.target.value),
              "aria-invalid": !!u.to,
              "aria-controls": "hf-kudos-matches",
              disabled: !i.length
            }
          )
        ] }),
        o.trim() && /* @__PURE__ */ t("ul", { id: "hf-kudos-matches", className: "hf-who__list", "aria-label": "Matching colleagues", children: [
          h.map((b) => /* @__PURE__ */ e("li", { children: /* @__PURE__ */ t("button", { type: "button", className: "hf-who__opt", onClick: () => {
            r(b.id), k((_) => ({ ..._, to: void 0 }));
          }, children: [
            /* @__PURE__ */ e(q, { name: b.name, size: 28 }),
            /* @__PURE__ */ t("span", { className: "hf-who__txt", children: [
              /* @__PURE__ */ e("b", { children: b.name }),
              b.detail && /* @__PURE__ */ e("span", { children: b.detail })
            ] })
          ] }) }, b.id)),
          !h.length && /* @__PURE__ */ e("li", { className: "hf-who__none", children: "Nobody by that name. Check the spelling, or try their first name." })
        ] })
      ] }),
      u.to && /* @__PURE__ */ e("p", { className: "hf-field__err", role: "alert", children: u.to })
    ] }),
    /* @__PURE__ */ t("label", { className: `hf-field${u.msg ? " hf-field--error" : ""}`, children: [
      /* @__PURE__ */ e("span", { children: "What did they do?" }),
      /* @__PURE__ */ e(
        "textarea",
        {
          value: A,
          onChange: (b) => m(b.target.value),
          rows: 3,
          maxLength: 300,
          "aria-invalid": !!u.msg,
          placeholder: "Stayed late to help a patient find the right product"
        }
      ),
      /* @__PURE__ */ t("p", { className: "hf-field__count", "aria-live": "polite", children: [
        A.trim().length,
        " / 280"
      ] }),
      u.msg && /* @__PURE__ */ e("p", { className: "hf-field__err", role: "alert", children: u.msg })
    ] }),
    /* @__PURE__ */ e("p", { className: "hf-muted", style: { fontSize: 12, margin: "0 0 16px" }, children: "Kudos appear in the feed for everyone in HiFive after HR approves them, usually the same day." }),
    /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--primary", onClick: p, disabled: N, children: N ? "Sending…" : "Send kudos" })
  ] });
}
function Pa({ rows: n, label: a = "Status" }) {
  return n.length ? /* @__PURE__ */ e("section", { className: "hf hf-card hf-rows", "aria-label": a, children: n.map((i) => /* @__PURE__ */ t("div", { className: "hf-row", children: [
    /* @__PURE__ */ e("span", { className: "hf-row__ic", "aria-hidden": "true", children: i.icon }),
    /* @__PURE__ */ t("span", { className: "hf-row__label", children: [
      i.label,
      i.hint && /* @__PURE__ */ e(H, { text: i.hint })
    ] }),
    i.value && /* @__PURE__ */ e("span", { className: "hf-row__value", children: i.value }),
    i.action && (i.action.href ? /* @__PURE__ */ e("a", { className: "hf-row__action", href: i.action.href, children: i.action.label }) : /* @__PURE__ */ e("button", { type: "button", className: "hf-row__action", onClick: i.action.onClick, children: i.action.label }))
  ] }, i.key)) }) : null;
}
function Ta({ ok: n }) {
  return /* @__PURE__ */ e("span", { className: "hf-dot", style: n ? void 0 : { background: "rgb(var(--warn))" }, "aria-hidden": "true" });
}
const qn = {
  factor_band: /* @__PURE__ */ e(fe, { size: 24 }),
  probation_confirmed: /* @__PURE__ */ e(en, { size: 24 }),
  induction_complete: /* @__PURE__ */ e(Se, { size: 24 }),
  anniversary: /* @__PURE__ */ e(kn, { size: 24 }),
  kudos: /* @__PURE__ */ e(X, { size: 24 })
};
function $a({ type: n, title: a, detail: i, onDismiss: l }) {
  return /* @__PURE__ */ t("section", { className: "hf hf-card hf-celebrate", "aria-live": "polite", "aria-label": "A moment worth noting", children: [
    /* @__PURE__ */ e("div", { className: "hf-confetti", "aria-hidden": "true", children: Array.from({ length: 14 }).map((s, r) => /* @__PURE__ */ e("i", { style: {
      left: `${r * 7.3 % 100}%`,
      animationDelay: `${r % 7 * 0.18}s`,
      background: r % 3 === 0 ? "rgb(var(--pop-400))" : r % 3 === 1 ? "rgb(var(--brand-400))" : "rgb(var(--sky-400))"
    } }, r)) }),
    /* @__PURE__ */ t("div", { className: "hf-celebrate__row", children: [
      /* @__PURE__ */ e("span", { className: "hf-celebrate__ic", "aria-hidden": "true", children: qn[n] }),
      /* @__PURE__ */ t("div", { className: "hf-celebrate__body", style: { flex: 1, minWidth: 0 }, children: [
        /* @__PURE__ */ t("p", { className: "hf-celebrate__cap", children: [
          "A moment worth noting ",
          /* @__PURE__ */ e(H, { text: "Shown once a day, only when something changed for you: a Factor band, a probation decision, an induction completed or an anniversary." })
        ] }),
        /* @__PURE__ */ e("h2", { className: "hf-display hf-celebrate__h", children: a }),
        i && /* @__PURE__ */ e("p", { className: "hf-celebrate__p", children: i })
      ] }),
      /* @__PURE__ */ e("button", { type: "button", className: "hf-celebrate__x", onClick: l, "aria-label": "Dismiss", children: /* @__PURE__ */ e(Ae, { size: 18 }) })
    ] })
  ] });
}
const J = { side: "hifive-dock-side", top: "hifive-dock-top", tip: "hifive-dock-tip" }, _e = (n) => {
  try {
    return localStorage.getItem(n);
  } catch {
    return null;
  }
}, be = (n, a) => {
  try {
    localStorage.setItem(n, a);
  } catch {
  }
};
function Ia({ apps: n }) {
  const a = I(null), i = I(null), [l, s] = C(() => _e(J.side) === "left" ? "left" : "right"), [r, o] = C(() => Number(_e(J.top)) || 50), [c, h] = C(() => !_e(J.tip)), d = I(!1), A = () => {
    h(!1), be(J.tip, "1");
  };
  T(() => {
    be(J.side, l), be(J.top, String(r));
  }, [l, r]);
  const m = (N) => {
    const f = a.current;
    if (!f) return;
    const p = f.getBoundingClientRect();
    i.current = { x: N.clientX, y: N.clientY, left: p.left, top: p.top, moved: !1 };
  }, u = (N) => {
    const f = i.current, p = a.current;
    if (!f || !p) return;
    const b = N.clientX - f.x, _ = N.clientY - f.y;
    if (!f.moved) {
      if (Math.abs(b) + Math.abs(_) <= 6) return;
      f.moved = !0, p.setPointerCapture(N.pointerId), p.classList.add("dragging");
    }
    p.style.transform = "none", p.style.left = `${f.left + b}px`, p.style.right = "auto", p.style.top = `${f.top + _}px`;
  }, k = () => {
    const N = i.current, f = a.current;
    if (i.current = null, !N || !f || !N.moved) return;
    f.classList.remove("dragging");
    const p = f.getBoundingClientRect(), b = p.left + p.width / 2 < window.innerWidth / 2 ? "left" : "right", _ = Math.round(Math.min(90, Math.max(10, (p.top + p.height / 2) / window.innerHeight * 100)));
    f.style.transform = "", f.style.left = "", f.style.right = "", f.style.top = `${_}%`, s(b), o(_), A(), d.current = !0, setTimeout(() => {
      d.current = !1;
    }, 50);
  };
  return /* @__PURE__ */ t(z, { children: [
    c && /* @__PURE__ */ e("div", { className: "hf hf-dock__scrim", "aria-hidden": "true", onClick: A }),
    /* @__PURE__ */ t(
      "nav",
      {
        ref: a,
        className: E("hf hf-dock", `hf-dock--${l}`),
        "aria-label": "Your apps",
        style: { top: `${r}%` },
        onPointerDown: m,
        onPointerMove: u,
        onPointerUp: k,
        onPointerCancel: k,
        "data-tour": "apps",
        children: [
          /* @__PURE__ */ t("span", { className: "hf-dock__grip", "aria-hidden": "true", children: [
            /* @__PURE__ */ e("i", {}),
            /* @__PURE__ */ e("i", {}),
            /* @__PURE__ */ e("i", {})
          ] }),
          c && /* @__PURE__ */ t("div", { className: "hf-dock__tip", role: "status", children: [
            /* @__PURE__ */ e("b", { children: "Your apps live here." }),
            " Drag this bar to move it to the other side.",
            /* @__PURE__ */ e("button", { type: "button", onClick: (N) => {
              N.stopPropagation(), A();
            }, children: "Got it" })
          ] }),
          n.map((N) => /* @__PURE__ */ t(
            "button",
            {
              type: "button",
              className: "hf-dock__btn hf-dock__btn--mark",
              "aria-label": N.label,
              onClick: (f) => {
                if (d.current) {
                  f.preventDefault();
                  return;
                }
                N.onOpen();
              },
              children: [
                /* @__PURE__ */ e(ie, { app: N.key, size: 44 }),
                /* @__PURE__ */ e("span", { className: "hf-dock__label", "aria-hidden": "true", children: N.label })
              ]
            },
            N.key
          ))
        ]
      }
    )
  ] });
}
function Ua({ apps: n, hideOnDesktop: a = !0 }) {
  return /* @__PURE__ */ e("section", { className: E("hf", a && "hf-apps--hide-desktop"), "aria-label": "Your apps", "data-tour": "apps", children: /* @__PURE__ */ t("div", { className: "hf-card hf-apps2", children: [
    /* @__PURE__ */ t("h3", { className: "hf-cap hf-apps2__head", children: [
      "Your apps ",
      /* @__PURE__ */ e(H, { text: "Every HiFive app you can open. On a computer they sit in the floating dock at the side." })
    ] }),
    /* @__PURE__ */ e("div", { className: "hf-apps2__grid", children: n.map((i) => /* @__PURE__ */ t("button", { type: "button", className: "hf-app2 hf-press", onClick: i.onOpen, children: [
      /* @__PURE__ */ e(ie, { app: i.key, size: 52 }),
      /* @__PURE__ */ e("span", { className: "hf-app2__label hf-truncate", title: i.label, children: i.label })
    ] }, i.key)) })
  ] }) });
}
const Hn = [
  ["water", "Water"],
  ["air", "Air"],
  ["earth", "Earth"],
  ["fire", "Fire"],
  ["luna", "Luna"],
  ["sol", "Sol"],
  ["aami", "Aami"],
  ["aadi", "Aadi"]
], Te = {
  water: ["#025EC4", "#0ECCED"],
  air: ["#15A898", "#33363B"],
  earth: ["#2F7A5A", "#8A5A34"],
  fire: ["#AF2610", "#4C2325"],
  luna: ["#26658C", "#54ACBF"],
  sol: ["#FBB931", "#EA6113"],
  aami: ["#610C9F", "#DA0C81"],
  aadi: ["#17566F", "#AF3D41"]
}, de = { skin: "water", style: "soft", mode: "light" };
function Ln() {
  const n = document.documentElement;
  return {
    skin: n.getAttribute("data-skin") || de.skin,
    style: n.getAttribute("data-style") || de.style,
    mode: n.getAttribute("data-theme") || de.mode
  };
}
function Rn(n) {
  const a = document.documentElement;
  if (window.hifiveTheme) {
    window.hifiveTheme.set(n);
    return;
  }
  n.skin && a.setAttribute("data-skin", n.skin), n.style && a.setAttribute("data-style", n.style), n.mode && (a.setAttribute("data-theme", n.mode), a.classList.toggle("dark", n.mode === "dark"));
}
function $e({ label: n, value: a, options: i, onPick: l }) {
  return /* @__PURE__ */ t("div", { className: "hf-ap__row", children: [
    /* @__PURE__ */ e("p", { className: "hf-cap", style: { margin: "0 0 8px" }, children: n }),
    /* @__PURE__ */ e("div", { className: "hf-seg", role: "group", "aria-label": n, children: i.map(([s, r]) => /* @__PURE__ */ e("button", { type: "button", "aria-pressed": a === s, onClick: () => l(s), children: r }, s)) })
  ] });
}
function ja({ open: n, onClose: a, onSave: i, onReplayTour: l }) {
  const [s, r] = C(() => typeof document > "u" ? de : Ln()), [o, c] = C("idle"), h = I(null);
  function d(A) {
    r((m) => ({ ...m, ...A })), Rn(A), i && (c("saving"), h.current && window.clearTimeout(h.current), h.current = window.setTimeout(async () => c(await i(A) ? "saved" : "failed"), 500));
  }
  return /* @__PURE__ */ t(te, { open: n, onClose: a, title: "Appearance", children: [
    /* @__PURE__ */ t("div", { className: "hf-ap__row", children: [
      /* @__PURE__ */ e("p", { className: "hf-cap", style: { margin: "0 0 10px" }, children: "Colours" }),
      /* @__PURE__ */ e("div", { className: "hf-swatches", role: "radiogroup", "aria-label": "Colours", children: Hn.map(([A, m]) => /* @__PURE__ */ t("button", { type: "button", role: "radio", "aria-checked": s.skin === A, className: "hf-swatch", onClick: () => d({ skin: A }), children: [
        /* @__PURE__ */ e("span", { className: "hf-swatch__dot", style: { background: `linear-gradient(135deg, ${Te[A][0]} 0 52%, ${Te[A][1]} 52% 100%)` }, children: s.skin === A && /* @__PURE__ */ e(Y, { size: 18, strokeWidth: 3 }) }),
        /* @__PURE__ */ e("span", { className: "hf-swatch__name", children: m })
      ] }, A)) })
    ] }),
    /* @__PURE__ */ t("div", { className: "hf-ap__pair", children: [
      /* @__PURE__ */ e($e, { label: "Style", value: s.style, options: [["lit", "Lit"], ["soft", "Soft"]], onPick: (A) => d({ style: A }) }),
      /* @__PURE__ */ e($e, { label: "Mode", value: s.mode, options: [["light", "Light"], ["dark", "Dark"]], onPick: (A) => d({ mode: A }) })
    ] }),
    /* @__PURE__ */ e("p", { className: "hf-ap__note", "aria-live": "polite", children: o === "failed" ? "Changed here, but it didn't save to your profile. Try again, or tell HR." : o === "saved" ? "Saved. Your choice follows you to every HiFive app and device." : "Default is Water · Soft · Light. Your choice is kept on your profile, so it follows you." }),
    l && /* @__PURE__ */ e("div", { className: "hf-ap__replay", children: /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--secondary", onClick: () => {
      a(), l();
    }, children: "Replay the tour" }) })
  ] });
}
function qa({ onSearch: n, placeholder: a = "Search", id: i }) {
  const [l, s] = C(""), [r, o] = C([]), [c, h] = C(-1), [d, A] = C(!1), m = Q(), u = I(null);
  T(() => {
    if (!l.trim()) {
      o([]), A(!1);
      return;
    }
    return u.current && window.clearTimeout(u.current), u.current = window.setTimeout(async () => {
      try {
        const p = await n(l.trim());
        o(p), A(!0), h(p.length ? 0 : -1);
      } catch {
        o([]), A(!1);
      }
    }, 250), () => {
      u.current && window.clearTimeout(u.current);
    };
  }, [l, n]);
  const k = (p) => {
    A(!1), s(""), p.onPick ? p.onPick() : p.href && (window.location.href = p.href);
  }, N = (p) => {
    d && (p.key === "ArrowDown" && (p.preventDefault(), h((b) => Math.min(r.length - 1, b + 1))), p.key === "ArrowUp" && (p.preventDefault(), h((b) => Math.max(0, b - 1))), p.key === "Enter" && c >= 0 && (p.preventDefault(), k(r[c])), p.key === "Escape" && A(!1));
  }, f = ["People", "Apps", "Policies"];
  return /* @__PURE__ */ t("div", { className: "hf hf-search__wrap", children: [
    /* @__PURE__ */ t("form", { role: "search", className: "hf-search", onSubmit: (p) => p.preventDefault(), children: [
      /* @__PURE__ */ e(Ce, { size: 18 }),
      /* @__PURE__ */ e(
        "input",
        {
          id: i,
          type: "search",
          value: l,
          onChange: (p) => s(p.target.value),
          onKeyDown: N,
          placeholder: a,
          "aria-label": "Search people, apps and policies",
          "aria-controls": d ? m : void 0,
          "aria-expanded": d,
          "aria-autocomplete": "list",
          role: "combobox"
        }
      ),
      l && /* @__PURE__ */ e("button", { type: "button", className: "hf-search__clear", onClick: () => s(""), "aria-label": "Clear", children: /* @__PURE__ */ e(Ae, { size: 16 }) })
    ] }),
    d && /* @__PURE__ */ t("div", { className: "hf-search__results", id: m, role: "listbox", children: [
      r.length === 0 && /* @__PURE__ */ t("p", { className: "hf-search__group hf-muted", style: { margin: 0 }, children: [
        "Nothing matches “",
        l,
        "”."
      ] }),
      f.filter((p) => r.some((b) => b.group === p)).map((p) => /* @__PURE__ */ t("div", { children: [
        /* @__PURE__ */ e("p", { className: "hf-cap hf-search__group", style: { margin: 0 }, children: p }),
        r.map((b, _) => b.group === p && /* @__PURE__ */ t("button", { type: "button", role: "option", "aria-selected": _ === c, className: "hf-search__item", onMouseEnter: () => h(_), onClick: () => k(b), children: [
          /* @__PURE__ */ e("span", { className: "hf-truncate", title: b.title, children: b.title }),
          b.detail && /* @__PURE__ */ e("small", { className: "hf-truncate", title: b.detail, children: b.detail })
        ] }, `${p}-${_}`))
      ] }, p))
    ] })
  ] });
}
function Ha({ firstName: n, day: a = 1, firstReview: i, top: l, induction: s, steps: r }) {
  const o = s != null && s.total ? Math.round(s.done / s.total * 100) : 0, c = a <= 7 ? `Day ${a} of your first week` : `Week ${Math.ceil(a / 7)} at HiFive`;
  return /* @__PURE__ */ t("section", { className: "hf hf-card hf-card--hero hf-joiner", "aria-label": "Your first week", "data-tour": "factor", children: [
    l === void 0 && /* @__PURE__ */ e("p", { className: "hf-joiner__day", children: c }),
    /* @__PURE__ */ t("h3", { className: "hf-display hf-joiner__h", children: [
      "Welcome, ",
      n
    ] }),
    /* @__PURE__ */ e("p", { className: "hf-joiner__p", children: l !== void 0 ? l : /* @__PURE__ */ t(z, { children: [
      "Your HiFive Factor starts after your first review",
      i ? ` in ${i}` : "",
      ". Until then, this is your week."
    ] }) }),
    s && s.total > 0 && /* @__PURE__ */ t(z, { children: [
      /* @__PURE__ */ t("div", { className: "hf-joiner__prog", children: [
        /* @__PURE__ */ e("span", { children: "Induction" }),
        /* @__PURE__ */ t("span", { className: "hf-num", style: { fontWeight: 600 }, children: [
          s.done,
          " of ",
          s.total,
          " ",
          s.unit ?? "modules"
        ] })
      ] }),
      /* @__PURE__ */ e("div", { className: "hf-bar", role: "progressbar", "aria-valuenow": o, "aria-valuemin": 0, "aria-valuemax": 100, "aria-label": "Induction progress", children: /* @__PURE__ */ e("i", { style: { width: `${o}%` } }) })
    ] }),
    /* @__PURE__ */ e("ul", { className: "hf-check", children: r.map((h) => /* @__PURE__ */ t("li", { className: h.state, children: [
      /* @__PURE__ */ e("span", { className: "hf-check__dot", "aria-hidden": "true", children: h.state === "done" && /* @__PURE__ */ e(Y, { size: 12 }) }),
      /* @__PURE__ */ e("span", { className: "hf-check__text", children: h.text }),
      h.detail && /* @__PURE__ */ e("span", { className: "hf-check__detail", children: h.detail }),
      h.action ? /* @__PURE__ */ e("a", { className: "hf-check__act", href: h.action.href, children: h.action.label }) : h.state === "next" && /* @__PURE__ */ e("span", { className: "hf-check__next", children: "Next" }),
      /* @__PURE__ */ e("span", { className: "hf-sr", children: h.state === "done" ? ", done" : h.state === "next" ? ", next" : ", to do" })
    ] }, h.text)) })
  ] });
}
const On = [
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
], G = 10, he = 300, Ie = () => {
  var n;
  return typeof window < "u" && ((n = window.matchMedia) == null ? void 0 : n.call(window, "(prefers-reduced-motion: reduce)").matches);
};
function Yn(n, a) {
  const [i, l] = C(null);
  return Le(() => {
    if (!a || !n) return;
    const s = document.querySelector(n);
    if (!s) {
      l(null);
      return;
    }
    const r = () => {
      const c = s.getBoundingClientRect();
      l({ top: c.top, left: c.left, width: c.width, height: c.height });
    };
    s.scrollIntoView({ behavior: Ie() ? "auto" : "smooth", block: "center", inline: "nearest" });
    const o = setTimeout(r, Ie() ? 0 : 380);
    return r(), window.addEventListener("resize", r), window.addEventListener("scroll", r, !0), () => {
      clearTimeout(o), window.removeEventListener("resize", r), window.removeEventListener("scroll", r, !0);
    };
  }, [n, a]), i;
}
function La({ open: n, steps: a = On, context: i = {}, onSkip: l, onDone: s }) {
  const [r, o] = C([]);
  T(() => {
    n && o(a.filter((v) => (!v.when || v.when(i)) && document.querySelector(v.selector)));
  }, [n, a, i]);
  const [c, h] = C(0), [d, A] = C(!1), [m, u] = C(!0), k = r[c], N = Yn((k == null ? void 0 : k.selector) ?? "", n && !d), f = I(null);
  T(() => {
    n && (h(0), A(!1), u(!0));
  }, [n]);
  const p = Ne(() => {
    c + 1 >= r.length ? A(!0) : h(c + 1);
  }, [c, r.length]), b = Ne(() => {
    d ? A(!1) : c > 0 && h(c - 1);
  }, [c, d]);
  if (T(() => {
    if (!n) return;
    const v = (S) => {
      S.key === "Escape" ? (S.preventDefault(), l()) : (S.key === "ArrowRight" || S.key === "Enter") && !d ? (S.preventDefault(), p()) : S.key === "ArrowLeft" && (S.preventDefault(), b());
    };
    return window.addEventListener("keydown", v), () => window.removeEventListener("keydown", v);
  }, [n, d, p, b, l]), T(() => {
    var v;
    n && ((v = f.current) == null || v.focus());
  }, [n, c, d]), !n || !d && !k) return null;
  const _ = window.innerWidth < 768, x = window.innerWidth, y = window.innerHeight;
  if (d)
    return /* @__PURE__ */ e("div", { className: "hf hf-tour__scrim hf-tour__scrim--centre", role: "dialog", "aria-modal": "true", "aria-labelledby": "hf-tour-done", children: /* @__PURE__ */ t("div", { ref: f, tabIndex: -1, className: "hf-tour__card hf-tour__card--done", children: [
      /* @__PURE__ */ e("h2", { id: "hf-tour-done", className: "hf-display hf-tour__title", style: { fontSize: 22 }, children: "That’s your home page" }),
      /* @__PURE__ */ e("p", { className: "hf-tour__text", style: { fontSize: 15 }, children: "You’ve seen everything on it. You can replay this from the gear any time." }),
      /* @__PURE__ */ t("label", { className: "hf-tour__tick", children: [
        /* @__PURE__ */ e("input", { type: "checkbox", checked: m, onChange: (v) => u(v.target.checked) }),
        "I understand, don’t show this again"
      ] }),
      /* @__PURE__ */ t("div", { className: "hf-tour__acts", children: [
        /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: b, children: "Back" }),
        /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--primary", style: { width: "auto" }, onClick: () => s(m), children: "Done" })
      ] })
    ] }) });
  const M = N ? { top: N.top - G, left: N.left - G, width: N.width + G * 2, height: N.height + G * 2 } : { inset: 0, borderRadius: 0, boxShadow: "none", background: "rgb(var(--ink-900) / .62)" };
  let W;
  if (_ || !N)
    W = { left: "max(16px, env(safe-area-inset-left, 0px))", right: "max(16px, env(safe-area-inset-right, 0px))", bottom: "calc(16px + env(safe-area-inset-bottom, 0px))" };
  else {
    const v = N.top + N.height + G + 12, S = y - N.top + G + 12, B = Math.min(Math.max(16, N.left + N.width / 2 - he / 2), x - he - 16);
    W = v + 160 < y ? { top: v, left: B, width: he } : { bottom: S, left: B, width: he };
  }
  return /* @__PURE__ */ t("div", { className: "hf", children: [
    /* @__PURE__ */ e("div", { className: "hf-tour__spot", style: M, "aria-hidden": "true" }),
    /* @__PURE__ */ t("div", { ref: f, tabIndex: -1, role: "dialog", "aria-modal": "true", "aria-labelledby": "hf-tour-title", "aria-describedby": "hf-tour-text", className: "hf-tour__card", style: W, children: [
      /* @__PURE__ */ t("p", { className: "hf-cap hf-tour__step", children: [
        "Step ",
        c + 1,
        " of ",
        r.length
      ] }),
      /* @__PURE__ */ e("h2", { id: "hf-tour-title", className: "hf-display hf-tour__title", children: k.title }),
      /* @__PURE__ */ e("p", { id: "hf-tour-text", className: "hf-tour__text", children: k.text }),
      /* @__PURE__ */ t("div", { className: "hf-tour__acts", children: [
        /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: l, children: "Skip" }),
        /* @__PURE__ */ t("span", { style: { display: "flex", gap: 8 }, children: [
          c > 0 && /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--secondary", style: { minHeight: 44 }, onClick: b, children: "Back" }),
          /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--primary", style: { width: "auto", minHeight: 44 }, onClick: p, children: c + 1 >= r.length ? "Finish" : "Next" })
        ] })
      ] })
    ] })
  ] });
}
const De = (n) => n === "phone" ? 2 : 4;
function Qn(n) {
  return n.map((a, i) => [a, i]).sort((a, i) => i[0].priority - a[0].priority || a[1] - i[1]).map(([a]) => a);
}
function Vn(n, a) {
  const i = a === "phone" ? 0 : a === "tablet" ? 1 : 2, l = De(a), s = n.map((r) => Math.max(1, Math.min(r.size[i], l)));
  if (a !== "desktop") {
    let r = 0;
    const o = (c) => {
      c >= 0 && r % l && (s[c] += l - r);
    };
    for (let c = 0; c < s.length; c++) {
      if (s[c] >= l) {
        o(c - 1), r = 0;
        continue;
      }
      r + s[c] > l && (o(c - 1), r = 0), r += s[c], r === l && (r = 0);
    }
    o(s.length - 1);
  }
  return s;
}
const Zn = 44, Ue = (n) => n.span === 1 && n.rows <= Zn;
function Jn(n, a) {
  const i = n.map((c) => ({ ...c })), l = Math.max(0, ...i.map((c) => c.row - 1 + c.rows)), s = Array.from({ length: a + 1 }, () => new Array(l + 2).fill(!1)), r = (c, h) => {
    for (let d = c.col; d < c.col + c.span; d++) for (let A = c.row; A < c.row + c.rows; A++) s[d][A] = h;
  }, o = (c, h, d) => {
    if (c < 1 || c > a) return !1;
    for (let A = h; A < h + d; A++) if (s[c][A]) return !1;
    return !0;
  };
  i.forEach((c) => r(c, !0));
  for (const c of i) {
    if (!Ue(c)) continue;
    r(c, !1);
    let h = !1;
    for (let d = 1; d < c.row && !h; d++)
      for (let A = 1; A <= a && !h; A++)
        (d === 1 || s[A][d - 1]) && o(A, d, c.rows) && (c.col = A, c.row = d, h = !0);
    r(c, !0);
  }
  for (const c of i) {
    if (!Ue(c)) continue;
    const h = { col: c.col, span: c.span };
    let d = c.col, A = c.span;
    for (; o(d + A, c.row, c.rows); ) A++;
    for (; o(d - 1, c.row, c.rows); )
      d--, A++;
    A !== h.span && (c.col = d, c.span = A, r(c, !0));
  }
  return i;
}
function Gn(n, a, i, l = 40) {
  const s = De(a), r = Vn(n, a), o = Array(s).fill(0), c = n.map((h, d) => {
    const A = r[d], m = Math.max(1, i[h.id] ?? l);
    let u = 0, k = 0, N = 1 / 0;
    for (let f = 0; f + A <= s; f++) {
      const p = o.slice(f, f + A), b = Math.max(...p), _ = p.reduce((x, y) => x + (b - y), 0);
      b + _ < N && (N = b + _, k = b, u = f);
    }
    for (let f = u; f < u + A; f++) o[f] = k + m;
    return { id: h.id, col: u + 1, row: k + 1, span: A, rows: m };
  });
  return Jn(c, s);
}
const cn = 4, je = () => typeof window > "u" || window.matchMedia("(min-width: 1024px)").matches ? "desktop" : window.matchMedia("(min-width: 768px)").matches ? "tablet" : "phone";
function Xn() {
  const [n, a] = C(je);
  return T(() => {
    const i = ["(min-width: 1024px)", "(min-width: 768px)"].map((s) => window.matchMedia(s)), l = () => a(je());
    return i.forEach((s) => s.addEventListener("change", l)), () => i.forEach((s) => s.removeEventListener("change", l));
  }, []), n;
}
function Ra({ blocks: n, label: a = "Your home page", layout: i }) {
  const l = Xn(), s = i ?? l, r = K(() => Qn(n.filter((m) => m.show)), [n]), [o, c] = C({}), h = Ne((m, u) => c((k) => k[m] === u ? k : { ...k, [m]: u }), []), d = {};
  for (const m of r) d[m.id] = o[m.id] ?? Math.ceil((m.reserve ?? 160) / cn);
  const A = Gn(r, s, d);
  return /* @__PURE__ */ e("div", { className: "hf hf-bento", role: "region", "aria-label": a, style: { gridTemplateColumns: `repeat(${De(s)}, minmax(0, 1fr))` }, children: r.map((m, u) => /* @__PURE__ */ e(
    Kn,
    {
      id: m.id,
      report: h,
      style: { gridColumn: `${A[u].col} / span ${A[u].span}`, gridRow: `${A[u].row} / span ${A[u].rows}` },
      children: m.node
    },
    m.id
  )) });
}
function Kn({ id: n, report: a, style: i, children: l }) {
  const s = I(null);
  return Le(() => {
    const r = s.current;
    if (!r) return;
    const o = () => a(n, Math.max(1, Math.ceil(r.getBoundingClientRect().height / cn)));
    o();
    const c = new ResizeObserver(o);
    return c.observe(r), () => c.disconnect();
  }, [n, a]), /* @__PURE__ */ e("div", { className: "hf-bento__item", "data-block": n, style: i, children: /* @__PURE__ */ e("div", { ref: s, className: "hf-bento__inner", children: l }) });
}
function Oa({ firstName: n, reportsTo: a, leads: i = 0, tenure: l, quote: s, search: r, onAppearance: o, onPrivacy: c, now: h = /* @__PURE__ */ new Date() }) {
  const d = h.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  return /* @__PURE__ */ t("header", { className: "hf hf-hello", "data-tour": "topbar", children: [
    /* @__PURE__ */ t("div", { className: "hf-hello__top", children: [
      /* @__PURE__ */ e("p", { className: "hf-hello__date", children: d }),
      r && /* @__PURE__ */ e("div", { className: "hf-hello__search", children: r }),
      o && /* @__PURE__ */ e("button", { type: "button", className: "hf-hello__btn", onClick: o, "aria-label": "Appearance settings", "data-tour": "gear", children: /* @__PURE__ */ e(xe, { size: 20 }) })
    ] }),
    /* @__PURE__ */ t("h1", { className: "hf-display hf-hello__h1", children: [
      ln(h),
      ", ",
      n
    ] }),
    (a || i > 0 || l) && /* @__PURE__ */ t("div", { className: "hf-hello__meta", children: [
      a && /* @__PURE__ */ t("span", { children: [
        /* @__PURE__ */ e(Re, { size: 14 }),
        "Reports to ",
        a
      ] }),
      i > 0 && /* @__PURE__ */ t("span", { children: [
        /* @__PURE__ */ e(Oe, { size: 14 }),
        "Leads ",
        i,
        " ",
        i === 1 ? "person" : "people"
      ] }),
      l && /* @__PURE__ */ t("span", { children: [
        /* @__PURE__ */ e(Ye, { size: 14 }),
        l
      ] })
    ] }),
    c && /* @__PURE__ */ t("button", { type: "button", className: "hf-hello__chip", onClick: c, children: [
      /* @__PURE__ */ e(Qe, { size: 12 }),
      " Only you can see this page ",
      /* @__PURE__ */ e($, { size: 12 })
    ] }),
    s && /* @__PURE__ */ t("blockquote", { className: "hf-hello__quote", children: [
      "“",
      s.body,
      "”",
      s.author && /* @__PURE__ */ t("span", { children: [
        " — ",
        s.author
      ] })
    ] })
  ] });
}
function Ya({ rows: n, unavailable: a = [], onRetry: i }) {
  const l = n.reduce((s, r) => s + (r.count ?? 1), 0);
  return /* @__PURE__ */ t("section", { className: "hf hf-card hf-wait", id: "waiting", "aria-label": "Waiting for you", children: [
    /* @__PURE__ */ t("div", { className: "hf-wait__head", children: [
      /* @__PURE__ */ e("span", { className: "hf-wait__bell", "aria-hidden": "true", children: /* @__PURE__ */ e(Je, { size: 16 }) }),
      /* @__PURE__ */ e("h3", { className: "hf-display hf-wait__title", children: "Waiting for you" }),
      l > 0 && /* @__PURE__ */ e("span", { className: "hf-count", "aria-label": `${l} waiting`, children: l }),
      /* @__PURE__ */ e("span", { style: { marginLeft: "auto" }, children: /* @__PURE__ */ e(H, { align: "left", text: "Only things that are yours to do, from every HiFive app, most urgent first. When it's empty this card shrinks to one line." }) })
    ] }),
    /* @__PURE__ */ e("ul", { className: "hf-wait__list", children: n.map((s) => {
      const r = /* @__PURE__ */ t(z, { children: [
        /* @__PURE__ */ t("span", { className: "hf-wait__logo", children: [
          /* @__PURE__ */ e(ie, { app: s.app, size: 32 }),
          s.overdue && /* @__PURE__ */ e("span", { className: "hf-due", "aria-hidden": "true", children: /* @__PURE__ */ e("span", { className: "hf-due__ping" }) })
        ] }),
        /* @__PURE__ */ t("span", { className: "hf-wait__txt", children: [
          /* @__PURE__ */ e("span", { className: "hf-wait__what", children: s.text }),
          /* @__PURE__ */ t("span", { className: `hf-wait__when${s.overdue ? " is-overdue" : ""}`, children: [
            s.appName,
            s.when ? ` · ${s.when}` : ""
          ] })
        ] }),
        s.action && /* @__PURE__ */ e("span", { className: "hf-wait__verb", children: s.action }),
        /* @__PURE__ */ e($, { size: 16, className: "hf-wait__chev", "aria-hidden": "true" })
      ] });
      return /* @__PURE__ */ e("li", { children: s.href ? /* @__PURE__ */ e("a", { className: "hf-wait__row", href: s.href, children: r }) : /* @__PURE__ */ e("button", { type: "button", className: "hf-wait__row", onClick: s.onClick, children: r }) }, s.id);
    }) }),
    a.map((s) => /* @__PURE__ */ t("div", { className: "hf-wait__gap", role: "status", children: [
      /* @__PURE__ */ t("span", { children: [
        "We couldn't reach ",
        s,
        " just now. This part will fill in when it's back."
      ] }),
      i && /* @__PURE__ */ t("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: i, children: [
        /* @__PURE__ */ e(yn, { size: 14 }),
        " Try again"
      ] })
    ] }, s))
  ] });
}
function Qa() {
  return /* @__PURE__ */ t("section", { className: "hf hf-mini hf-tone-brand", "aria-label": "Waiting for you", children: [
    /* @__PURE__ */ e("span", { className: "hf-mini__ic", children: /* @__PURE__ */ e(nn, { size: 18 }) }),
    /* @__PURE__ */ t("span", { children: [
      /* @__PURE__ */ e("span", { className: "hf-display hf-mini__t", children: "Nothing waiting" }),
      /* @__PURE__ */ e("span", { className: "hf-mini__s", children: "for you today" })
    ] })
  ] });
}
const ea = { joiners: ue, anniversary: fe, kudos: X, induction: Se, probation: wn, pinned: Ge }, ge = 4;
function Va({ items: n, limit: a = 4, onKudos: i, onReact: l }) {
  const [s, r] = C(!1), [o, c] = C({}), [h, d] = C(!1), A = n.filter((f) => f.kind === "pinned"), m = n.filter((f) => f.kind !== "pinned"), u = [...A, ...m], k = s ? u : u.slice(0, a), N = m.length === 0 && A.length === 0;
  return /* @__PURE__ */ t("section", { className: "hf hf-card hf-happen", "aria-label": "Happening at HiFive", "data-tour": "feed", children: [
    /* @__PURE__ */ t("div", { className: "hf-happen__head", children: [
      /* @__PURE__ */ e("h3", { className: "hf-display hf-happen__title", children: "Happening at HiFive" }),
      /* @__PURE__ */ e("span", { style: { marginLeft: "auto" }, children: /* @__PURE__ */ e(H, { align: "left", text: "Joiners, anniversaries, inductions and approved kudos from across HiFive. Grouped so one busy day never fills your page." }) })
    ] }),
    N ? /* @__PURE__ */ t("div", { className: "hf-happen__quiet", children: [
      /* @__PURE__ */ e("span", { className: "hf-kind-well hf-kind--quiet", "aria-hidden": "true", children: /* @__PURE__ */ e(Ke, { size: 18 }) }),
      /* @__PURE__ */ t("p", { children: [
        "Nothing new since yesterday.",
        i && /* @__PURE__ */ t(z, { children: [
          " ",
          /* @__PURE__ */ e("button", { type: "button", className: "hf-link", onClick: i, children: "Be the first to give kudos." })
        ] })
      ] })
    ] }) : /* @__PURE__ */ e("ul", { className: "hf-happen__list", children: k.map((f) => {
      var _, x, y, M, W, v, S;
      const p = ea[f.kind], b = !!o[f.id];
      return /* @__PURE__ */ t("li", { className: "hf-happen__row", children: [
        /* @__PURE__ */ t("div", { className: "hf-happen__line", children: [
          (_ = f.people) != null && _.length ? /* @__PURE__ */ e("span", { className: "hf-happen__stack", "aria-hidden": "true", children: f.people.slice(0, 3).map((B) => /* @__PURE__ */ e(q, { name: B.name, size: 30, ring: !0 }, B.name)) }) : f.person ? /* @__PURE__ */ t("span", { className: "hf-happen__who", "aria-hidden": "true", children: [
            /* @__PURE__ */ e(q, { name: f.person, size: 36 }),
            /* @__PURE__ */ e("span", { className: `hf-kind-badge hf-kind--${f.kind}`, children: /* @__PURE__ */ e(p, { size: 11 }) })
          ] }) : /* @__PURE__ */ e("span", { className: `hf-kind-well hf-kind--${f.kind}`, "aria-hidden": "true", children: /* @__PURE__ */ e(p, { size: 17 }) }),
          /* @__PURE__ */ e("div", { className: "hf-happen__body", children: (x = f.people) != null && x.length ? /* @__PURE__ */ t("button", { type: "button", className: "hf-happen__toggle", "aria-expanded": b, onClick: () => {
            c((B) => ({ [f.id]: !B[f.id] })), d(!1);
          }, children: [
            /* @__PURE__ */ e("span", { className: "hf-happen__text", children: f.headline ?? /* @__PURE__ */ t(z, { children: [
              /* @__PURE__ */ t("b", { children: [
                f.people.length,
                " ",
                f.people.length === 1 ? "person" : "people",
                " joined"
              ] }),
              " ",
              f.sub ?? "recently"
            ] }) }),
            /* @__PURE__ */ t("span", { className: "hf-happen__sub", children: [
              [...new Set(f.people.map((B) => B.where).filter(Boolean))].join(" · "),
              " · ",
              /* @__PURE__ */ e("span", { className: "hf-link", children: b ? "Hide" : "See who" })
            ] })
          ] }) : /* @__PURE__ */ t(z, { children: [
            f.kind === "pinned" && /* @__PURE__ */ e("p", { className: "hf-happen__pin", children: "Pinned by HR" }),
            /* @__PURE__ */ e("p", { className: "hf-happen__text", children: f.text }),
            f.sub && /* @__PURE__ */ e("p", { className: "hf-happen__sub", children: f.sub })
          ] }) }),
          f.when && /* @__PURE__ */ e("span", { className: "hf-happen__when", children: f.when })
        ] }),
        b && !!((y = f.people) != null && y.length) && /* @__PURE__ */ t("ul", { className: "hf-happen__people", children: [
          (h ? f.people : f.people.slice(0, ge)).map((B) => /* @__PURE__ */ t("li", { children: [
            /* @__PURE__ */ e(q, { name: B.name, size: 28 }),
            /* @__PURE__ */ t("span", { className: "hf-happen__pname", children: [
              /* @__PURE__ */ e("b", { className: "hf-truncate", children: rn(B.name) }),
              (B.role || B.where) && /* @__PURE__ */ e("span", { className: "hf-truncate", children: [B.role, B.where].filter(Boolean).join(" · ") })
            ] }),
            B.on && /* @__PURE__ */ e("span", { className: "hf-happen__when", children: B.on })
          ] }, B.name)),
          !h && f.people.length > ge && /* @__PURE__ */ e("li", { children: /* @__PURE__ */ t("button", { type: "button", className: "hf-link hf-happen__more", onClick: () => d(!0), children: [
            "and ",
            f.people.length - ge,
            " more"
          ] }) })
        ] }),
        f.kind === "kudos" && l && /* @__PURE__ */ t("div", { className: "hf-happen__reacts", children: [
          /* @__PURE__ */ t("button", { type: "button", className: `hf-react2${(M = f.mine) != null && M.like ? " is-on" : ""}`, "aria-pressed": !!((W = f.mine) != null && W.like), onClick: () => l(f.id, "like"), children: [
            /* @__PURE__ */ e(Xe, { size: 14 }),
            " ",
            f.likes ?? 0
          ] }),
          /* @__PURE__ */ t("button", { type: "button", className: `hf-react2${(v = f.mine) != null && v.clap ? " is-on" : ""}`, "aria-pressed": !!((S = f.mine) != null && S.clap), onClick: () => l(f.id, "clap"), children: [
            /* @__PURE__ */ e(X, { size: 14 }),
            " ",
            f.claps ?? 0
          ] })
        ] })
      ] }, f.id);
    }) }),
    (i || u.length > a) && /* @__PURE__ */ t("div", { className: "hf-happen__foot", children: [
      i && /* @__PURE__ */ t("button", { type: "button", className: "hf-kudos-pill", onClick: i, children: [
        /* @__PURE__ */ e(X, { size: 15 }),
        " Give kudos"
      ] }),
      u.length > a && /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", style: { marginLeft: "auto" }, onClick: () => r((f) => !f), children: s ? "Show less" : `See all ${u.length}` })
    ] })
  ] });
}
function Za({ tone: n = "brand", icon: a, title: i, sub: l, hint: s, dot: r, action: o, onClick: c, dark: h }) {
  const d = /* @__PURE__ */ t(z, { children: [
    /* @__PURE__ */ t("span", { className: "hf-mini__top", children: [
      /* @__PURE__ */ e("span", { className: "hf-mini__ic", "aria-hidden": "true", children: a }),
      r && /* @__PURE__ */ e("span", { className: `hf-mini__dot hf-mini__dot--${r}`, "aria-hidden": "true" }),
      s && /* @__PURE__ */ e(H, { align: "left", text: s })
    ] }),
    /* @__PURE__ */ t("span", { children: [
      /* @__PURE__ */ e("span", { className: "hf-display hf-mini__t", children: i }),
      l && /* @__PURE__ */ e("span", { className: "hf-mini__s", children: l }),
      o && (o.href ? /* @__PURE__ */ e("a", { className: "hf-mini__a", href: o.href, children: o.label }) : /* @__PURE__ */ e("button", { type: "button", className: "hf-mini__a", onClick: (m) => {
        var u;
        m.stopPropagation(), (u = o.onClick) == null || u.call(o);
      }, children: o.label }))
    ] })
  ] }), A = E("hf hf-mini hf-press", h ? "hf-mini--dark" : O(n));
  return c ? /* @__PURE__ */ e("button", { type: "button", className: A, onClick: c, children: d }) : /* @__PURE__ */ e("section", { className: A, children: d });
}
function Ja({ members: n, total: a }) {
  if (!n.length) return null;
  const i = a ?? n.length;
  return /* @__PURE__ */ t("section", { className: "hf hf-card hf-team", "aria-label": "Your team", "data-tour": "team", children: [
    /* @__PURE__ */ t("h3", { className: "hf-cap hf-team__head", children: [
      "Your team ",
      /* @__PURE__ */ t("span", { children: [
        i,
        " ",
        i === 1 ? "person" : "people"
      ] })
    ] }),
    /* @__PURE__ */ e("ul", { className: "hf-team__list", children: n.map((l) => {
      const s = /* @__PURE__ */ t(z, { children: [
        /* @__PURE__ */ e(q, { name: l.name, size: 36 }),
        /* @__PURE__ */ t("span", { className: "hf-team__txt", children: [
          /* @__PURE__ */ e("span", { className: "hf-team__name hf-truncate", title: l.name, children: l.name }),
          (l.note || l.sub) && /* @__PURE__ */ e("span", { className: `hf-team__sub hf-truncate${l.note ? " is-note" : ""}`, children: l.note || l.sub })
        ] }),
        l.onOpen && /* @__PURE__ */ e($, { size: 16, className: "hf-team__chev", "aria-hidden": "true" })
      ] });
      return /* @__PURE__ */ e("li", { children: l.onOpen ? /* @__PURE__ */ e("button", { type: "button", className: "hf-team__row", onClick: l.onOpen, children: s }) : /* @__PURE__ */ e("div", { className: "hf-team__row", children: s }) }, l.name);
    }) })
  ] });
}
const na = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function we(n) {
  const a = /^(\d{4})-(\d{2})-(\d{2})/.exec(n ?? "");
  return a ? `${Number(a[3])} ${na[Number(a[2]) - 1]} ${a[1]}` : n ?? "";
}
function aa(n) {
  if (n == null || n < 0) return "";
  if (n === 0) return "New this month";
  const a = Math.floor(n / 12), i = n % 12, l = (s, r) => s ? `${s} ${r}${s === 1 ? "" : "s"}` : "";
  return [l(a, "year"), l(i, "month")].filter(Boolean).join(" ");
}
function ta(n) {
  const a = [`${n.headcount} ${n.headcount === 1 ? "person" : "people"}`];
  return n.joined && a.push(`${n.joined} new`), n.probation && a.push(`${n.probation} on probation`), n.leaving && a.push(`${n.leaving} leaving`), a.join(" · ");
}
function ia(n) {
  return n.waiting ? n.overdue ? `${n.waiting} waiting · ${n.overdue} overdue` : `${n.waiting} waiting` : "Nothing waiting";
}
function sa(n) {
  const a = [], i = (s) => {
    const r = n.filter(s.test).length;
    r > 0 && r < n.length && a.push(s);
  };
  i({ key: "probation", label: "On probation", test: (s) => !!s.probation }), i({ key: "new", label: "New this month", test: (s) => s.joined });
  const l = [...new Set(n.map((s) => (s.designation ?? "").trim()).filter(Boolean))].sort((s, r) => s.localeCompare(r));
  if (l.length > 1 && l.length <= 8) for (const s of l) i({ key: `role:${s}`, label: s, test: (r) => (r.designation ?? "").trim() === s });
  return a;
}
function on({ crumbs: n, current: a, onCrumb: i }) {
  const l = a === void 0 ? n.length - 1 : n.length;
  return /* @__PURE__ */ e("nav", { className: "hf-crumbs", "aria-label": "Where you are", children: /* @__PURE__ */ t("ol", { children: [
    n.map((s, r) => /* @__PURE__ */ t("li", { children: [
      r < l ? /* @__PURE__ */ e("button", { type: "button", className: "hf-crumbs__up", onClick: () => i(s), children: s.name }) : /* @__PURE__ */ e("span", { "aria-current": "page", children: s.name }),
      (r < n.length - 1 || a !== void 0) && /* @__PURE__ */ e($, { size: 14, "aria-hidden": "true", className: "hf-crumbs__sep" })
    ] }, `${s.level}-${s.name}`)),
    a !== void 0 && /* @__PURE__ */ e("li", { children: /* @__PURE__ */ e("span", { "aria-current": "page", children: a }) })
  ] }) });
}
function la({ glance: n }) {
  const a = [
    /* @__PURE__ */ e(oe, { tone: "brand", icon: /* @__PURE__ */ e(vn, { size: 18 }), value: n.headcount, label: n.headcount === 1 ? "person" : "people" }, "people"),
    n.joined > 0 && /* @__PURE__ */ e(oe, { tone: "sky", icon: /* @__PURE__ */ e(ue, { size: 18 }), value: n.joined, label: "joined this month" }, "joined"),
    !!n.probation && /* @__PURE__ */ e(oe, { tone: "pop", icon: /* @__PURE__ */ e(We, { size: 18 }), value: n.probation, label: "on probation", hint: "People still in their probation period, as Performance Hub had it this morning." }, "probation"),
    n.leaving > 0 && /* @__PURE__ */ e(oe, { tone: "coral", icon: /* @__PURE__ */ e(Cn, { size: 18 }), value: n.leaving, label: "leaving", hint: "People with a last working day set, who are still here." }, "leaving")
  ].filter(Boolean);
  return /* @__PURE__ */ t("div", { className: "hf-glance-wrap", children: [
    /* @__PURE__ */ e("div", { className: "hf-glance", role: "group", "aria-label": "People at a glance", style: { "--n": a.length }, children: a }),
    n.probation === null && /* @__PURE__ */ e("p", { className: "hf-unit-month__none", children: "On probation: not known today." })
  ] });
}
function hn({ month: n, title: a = "Waiting this month", footnote: i }) {
  return n ? /* @__PURE__ */ t("section", { className: "hf hf-card hf-unit-month", "aria-label": a, children: [
    /* @__PURE__ */ t("h3", { className: "hf-cap hf-unit-month__head", children: [
      a,
      " ",
      /* @__PURE__ */ t("span", { children: [
        "as of ",
        we(n.day)
      ] })
    ] }),
    /* @__PURE__ */ e("ul", { children: n.apps.map((l) => /* @__PURE__ */ t("li", { children: [
      /* @__PURE__ */ e(ie, { app: l.app, size: 32 }),
      /* @__PURE__ */ e("span", { className: "hf-unit-month__app", children: l.label }),
      /* @__PURE__ */ e("span", { className: "hf-unit-month__n hf-num", children: l.waiting ? `${l.waiting} waiting` : ia(l) }),
      l.overdue > 0 && /* @__PURE__ */ t("span", { className: "hf-status hf-status--warn", children: [
        /* @__PURE__ */ e(an, { size: 12, "aria-hidden": "true" }),
        l.overdue,
        " overdue"
      ] })
    ] }, l.app)) }),
    n.unknown.length > 0 && /* @__PURE__ */ t("p", { className: "hf-unit-month__none", children: [
      n.unknown.join(", "),
      " did not answer this morning: not known today."
    ] }),
    i && /* @__PURE__ */ e("p", { className: "hf-unit-month__foot", children: i })
  ] }) : /* @__PURE__ */ t("section", { className: "hf hf-card hf-unit-month", "aria-label": a, children: [
    /* @__PURE__ */ e("h3", { className: "hf-cap", children: a }),
    /* @__PURE__ */ e("p", { className: "hf-unit-month__none", children: "The first count is taken tomorrow morning." })
  ] });
}
function Ga({ crumbs: n, onCrumb: a, title: i, note: l, glance: s, month: r, units: o, people: c, onOpenUnit: h, onOpenPerson: d, feed: A, direction: m = "down" }) {
  const u = K(() => sa(c ?? []), [c]), [k, N] = C(null), f = u.find((_) => _.key === k), p = c ? c.filter((_) => !f || f.test(_)) : [], b = o ? o.length && o[0].level === "department" ? "Departments" : "Facilities" : "People";
  return /* @__PURE__ */ t("div", { className: E("hf hf-unitpage", `hf-slide--${m}`), children: [
    /* @__PURE__ */ e(on, { crumbs: n, onCrumb: a }),
    /* @__PURE__ */ t("header", { className: "hf-unitpage__head", children: [
      /* @__PURE__ */ e("h1", { className: "hf-display hf-unitpage__title", children: i }),
      l && /* @__PURE__ */ e("p", { className: "hf-unitpage__note", children: l })
    ] }),
    c && u.length > 0 && /* @__PURE__ */ t("div", { className: "hf-chips", role: "group", "aria-label": "Filter people", children: [
      /* @__PURE__ */ e("button", { type: "button", className: E("hf-chip", !f && "is-on"), "aria-pressed": !f, onClick: () => N(null), children: "Everyone" }),
      u.map((_) => /* @__PURE__ */ e(
        "button",
        {
          type: "button",
          className: E("hf-chip", (f == null ? void 0 : f.key) === _.key && "is-on"),
          "aria-pressed": (f == null ? void 0 : f.key) === _.key,
          onClick: () => N((f == null ? void 0 : f.key) === _.key ? null : _.key),
          children: _.label
        },
        _.key
      ))
    ] }),
    /* @__PURE__ */ e(la, { glance: s }),
    /* @__PURE__ */ t("div", { className: "hf-unitpage__cols", children: [
      /* @__PURE__ */ t("section", { className: "hf-unitpage__kids", "aria-label": b, children: [
        /* @__PURE__ */ t("h2", { className: "hf-cap", children: [
          b,
          c && f ? ` · ${p.length} of ${c.length}` : ""
        ] }),
        o && /* @__PURE__ */ e("ul", { className: "hf-kids", children: o.map((_) => /* @__PURE__ */ e("li", { children: /* @__PURE__ */ t("button", { type: "button", className: "hf hf-card hf-kid hf-press", onClick: () => h == null ? void 0 : h(_), children: [
          /* @__PURE__ */ t("span", { className: "hf-kid__txt", children: [
            /* @__PURE__ */ e("span", { className: "hf-kid__name", children: _.name }),
            _.brand && /* @__PURE__ */ e("span", { className: "hf-kid__brand", children: _.brand }),
            /* @__PURE__ */ e("span", { className: "hf-kid__line", children: ta(_.glance) })
          ] }),
          /* @__PURE__ */ e($, { size: 18, "aria-hidden": "true", className: "hf-kid__chev" })
        ] }) }, `${_.entity}-${_.department ?? ""}`)) }),
        c && /* @__PURE__ */ e("ul", { className: "hf-kids hf-kids--people", children: p.map((_) => {
          const x = /* @__PURE__ */ t(z, { children: [
            /* @__PURE__ */ e(q, { name: _.name, size: 40 }),
            /* @__PURE__ */ t("span", { className: "hf-kid__txt", children: [
              /* @__PURE__ */ e("span", { className: "hf-kid__name hf-truncate", children: _.name }),
              _.designation && /* @__PURE__ */ e("span", { className: "hf-kid__line hf-truncate", children: _.designation }),
              (_.probation || _.joined) && /* @__PURE__ */ t("span", { className: "hf-kid__chips", children: [
                _.joined && /* @__PURE__ */ t("span", { className: "hf-status hf-status--ok", children: [
                  /* @__PURE__ */ e(ue, { size: 12, "aria-hidden": "true" }),
                  "New"
                ] }),
                _.probation && /* @__PURE__ */ t("span", { className: E("hf-status", _.probation === "Extended" ? "hf-status--warn" : "hf-status--plain"), children: [
                  /* @__PURE__ */ e(We, { size: 12, "aria-hidden": "true" }),
                  _.probation
                ] })
              ] })
            ] }),
            _.code && d && /* @__PURE__ */ e($, { size: 18, "aria-hidden": "true", className: "hf-kid__chev" })
          ] });
          return /* @__PURE__ */ e("li", { children: _.code && d ? /* @__PURE__ */ e("button", { type: "button", className: "hf hf-card hf-kid hf-press", onClick: () => d(_), children: x }) : /* @__PURE__ */ e("div", { className: "hf hf-card hf-kid", children: x }) }, _.code ?? _.name);
        }) })
      ] }),
      /* @__PURE__ */ t("aside", { className: "hf-unitpage__side", children: [
        /* @__PURE__ */ e(hn, { month: r }),
        A
      ] })
    ] })
  ] });
}
function Xa({ crumbs: n, onCrumb: a, self: i, person: l, line: s, onOpenPerson: r, probation: o, waiting: c, direction: h = "down" }) {
  const d = aa(l.tenure_months), A = [l.department, l.entity].filter(Boolean).join(" · ");
  return /* @__PURE__ */ t("div", { className: E("hf hf-unitpage hf-person", `hf-slide--${h}`), children: [
    n.length > 0 && /* @__PURE__ */ e(on, { crumbs: n, current: l.name, onCrumb: a }),
    /* @__PURE__ */ t("section", { className: "hf hf-card hf-person__head", children: [
      /* @__PURE__ */ e(q, { name: l.name, size: 64 }),
      /* @__PURE__ */ t("div", { className: "hf-person__txt", children: [
        /* @__PURE__ */ e("h1", { className: "hf-display hf-unitpage__title", children: i ? "Your page" : l.name }),
        l.designation && /* @__PURE__ */ e("p", { className: "hf-person__job", children: l.designation }),
        A && /* @__PURE__ */ e("p", { className: "hf-person__where", children: A }),
        l.start_date && /* @__PURE__ */ t("p", { className: "hf-person__where", children: [
          "Joined ",
          we(l.start_date),
          d ? ` · ${d}` : ""
        ] })
      ] })
    ] }),
    /* @__PURE__ */ t("div", { className: "hf-unitpage__cols", children: [
      /* @__PURE__ */ t("div", { className: "hf-unitpage__kids", children: [
        (!o.known || o.stage) && /* @__PURE__ */ t("section", { className: "hf hf-card hf-person__probation", "aria-label": "Probation", children: [
          /* @__PURE__ */ e("h3", { className: "hf-cap", children: "Probation" }),
          o.known ? /* @__PURE__ */ t(z, { children: [
            /* @__PURE__ */ t("p", { className: "hf-person__stage", children: [
              /* @__PURE__ */ t("span", { className: E("hf-status", o.stage === "Extended" ? "hf-status--warn" : "hf-status--plain"), children: [
                /* @__PURE__ */ e(We, { size: 12, "aria-hidden": "true" }),
                o.stage
              ] }),
              o.month_no && o.of_months ? /* @__PURE__ */ t("span", { className: "hf-num", children: [
                "Month ",
                o.month_no,
                " of ",
                o.of_months
              ] }) : null
            ] }),
            o.month_no && o.of_months ? /* @__PURE__ */ e("span", { className: "hf-month-pips", role: "img", "aria-label": `Month ${o.month_no} of ${o.of_months}`, children: Array.from({ length: o.of_months }, (m, u) => /* @__PURE__ */ e("span", { className: E("hf-month-pip", u < o.month_no && "is-on") }, u)) }) : null,
            o.end_date && /* @__PURE__ */ t("p", { className: "hf-person__where", children: [
              "Ends ",
              we(o.end_date)
            ] })
          ] }) : /* @__PURE__ */ e("p", { className: "hf-unit-month__none", children: "Not known today: Performance Hub did not answer this morning." })
        ] }),
        s.length > 0 && /* @__PURE__ */ t("section", { className: "hf hf-card hf-team", "aria-label": "Reporting line", children: [
          /* @__PURE__ */ e("h3", { className: "hf-cap hf-team__head", children: "Reporting line" }),
          /* @__PURE__ */ e("ul", { className: "hf-team__list", children: s.map((m) => {
            const u = /* @__PURE__ */ t(z, { children: [
              /* @__PURE__ */ e(q, { name: m.name, size: 36 }),
              /* @__PURE__ */ t("span", { className: "hf-team__txt", children: [
                /* @__PURE__ */ e("span", { className: "hf-team__name hf-truncate", children: m.name }),
                m.designation && /* @__PURE__ */ e("span", { className: "hf-team__sub hf-truncate", children: m.designation })
              ] }),
              m.code && r && /* @__PURE__ */ e($, { size: 16, className: "hf-team__chev", "aria-hidden": "true" })
            ] });
            return /* @__PURE__ */ e("li", { children: m.code && r ? /* @__PURE__ */ e("button", { type: "button", className: "hf-team__row", onClick: () => r(m.code), children: u }) : /* @__PURE__ */ e("div", { className: "hf-team__row", children: u }) }, `${m.name}-${m.code ?? ""}`);
          }) })
        ] })
      ] }),
      /* @__PURE__ */ e("aside", { className: "hf-unitpage__side", children: /* @__PURE__ */ e(
        hn,
        {
          month: c,
          title: i ? "Waiting for you" : `Waiting for ${rn(l.name)}`,
          footnote: "Counts only. What each one is stays in its app."
        }
      ) })
    ] })
  ] });
}
const R = "__skipped__", qe = ["", "Poor", "Below expectations", "Meets expectations", "Strong", "Excellent"], dn = (n, a) => !!n && Object.entries(n).some(([i, l]) => l.includes(String(a[i] ?? ""))), pe = (n, a) => !n.showWhen || dn(n.showWhen, a), ve = (n, a) => pe(n, a) && (!n.optional || dn(n.requiredWhen, a)), Fe = (n) => n == null || n === "" || n === !1 || typeof n == "string" && !n.trim(), ra = (n) => !Fe(n) && n !== R, An = (n, a) => n.fields.filter((i) => pe(i, a) && ra(a[i.key])).length;
function ca(n, a) {
  const i = n.minAnswered;
  return !i || An(n, a) >= i.count ? null : `${i.word[0].toUpperCase()}${i.word.slice(1)} at least ${i.count}.`;
}
function oa(n, a) {
  return n.fields.filter((i) => ve(i, a) && a[i.key] !== R && Fe(a[i.key]));
}
function ha(n, a) {
  const i = {};
  for (const l of n) for (const s of l.fields) {
    if (!pe(s, a)) continue;
    const r = a[s.key];
    r !== R && (Fe(r) && s.type !== "check" || (i[s.key] = typeof r == "string" ? r.trim() : r ?? !1));
  }
  return i;
}
function He(n) {
  if (!n.length) return null;
  const a = n[0], i = a.type === "scale" ? `a score for ${a.label}` : a.type === "check" ? `a tick for "${a.label}"` : `"${a.label}"`;
  return n.length === 1 ? `Still needs ${i}.` : `Still needs ${i} and ${n.length - 1} more.`;
}
function da({ ctx: n, first: a, open: i }) {
  var o, c, h, d, A, m;
  const [l, s] = C(i);
  return ((o = n.profile) == null ? void 0 : o.length) || n.callout || n.notes || ((c = n.history) == null ? void 0 : c.length) || ((h = n.links) == null ? void 0 : h.length) ? /* @__PURE__ */ t("section", { className: "hf-quick__ctx", "aria-label": `About ${a}`, children: [
    /* @__PURE__ */ t("button", { type: "button", className: "hf-quick__ctxtoggle", "aria-expanded": l, onClick: () => s((u) => !u), children: [
      /* @__PURE__ */ t("span", { children: [
        "About ",
        a
      ] }),
      /* @__PURE__ */ e(sn, { size: 16, "aria-hidden": "true" })
    ] }),
    l && /* @__PURE__ */ t("div", { className: "hf-quick__ctxbody", children: [
      !!((d = n.profile) != null && d.length) && /* @__PURE__ */ e("dl", { className: "hf-quick__grid", children: n.profile.map((u) => /* @__PURE__ */ t("div", { children: [
        /* @__PURE__ */ e("dt", { children: u.label }),
        /* @__PURE__ */ e("dd", { children: u.value })
      ] }, u.label)) }),
      n.callout && /* @__PURE__ */ t("div", { className: "hf-quick__callout", children: [
        /* @__PURE__ */ e("p", { className: "hf-quick__ctitle", children: n.callout.title }),
        /* @__PURE__ */ e("ul", { children: n.callout.lines.map((u) => /* @__PURE__ */ e("li", { children: u }, u)) }),
        n.callout.note && /* @__PURE__ */ e("p", { className: "hf-quick__cnote", children: n.callout.note })
      ] }),
      n.notes && /* @__PURE__ */ t("div", { className: "hf-quick__notes", children: [
        /* @__PURE__ */ e("p", { className: "hf-quick__ctitle", children: n.notes.title }),
        /* @__PURE__ */ e("p", { children: n.notes.text })
      ] }),
      !!((A = n.history) != null && A.length) && /* @__PURE__ */ t("div", { children: [
        /* @__PURE__ */ e("p", { className: "hf-quick__ctitle", children: "Interview history" }),
        /* @__PURE__ */ e("ul", { className: "hf-quick__hist", children: n.history.map((u, k) => /* @__PURE__ */ t("li", { className: `is-${u.outcome ?? "open"}`, children: [
          /* @__PURE__ */ e("span", { className: "hf-quick__dot", "aria-hidden": "true", children: u.outcome === "pass" ? "✓" : u.outcome === "fail" ? "✕" : "·" }),
          /* @__PURE__ */ t("div", { children: [
            /* @__PURE__ */ e("p", { className: "hf-quick__htitle", children: u.title }),
            u.sub && /* @__PURE__ */ e("p", { className: "hf-quick__sub", children: u.sub }),
            u.quote && /* @__PURE__ */ t("p", { className: "hf-quick__quote", children: [
              "“",
              u.quote,
              "”"
            ] })
          ] })
        ] }, `${u.title}-${k}`)) })
      ] }),
      !!((m = n.links) != null && m.length) && /* @__PURE__ */ e("div", { className: "hf-quick__links", children: n.links.map((u) => /* @__PURE__ */ t("a", { href: u.href, target: "_blank", rel: "noopener", children: [
        /* @__PURE__ */ e(ke, { size: 14 }),
        " ",
        u.label,
        " ",
        /* @__PURE__ */ e(tn, { size: 12 })
      ] }, u.href)) })
    ] })
  ] }) : null;
}
function Ka({ form: n, open: a, onSave: i, onClose: l }) {
  var U, Z, ae, le;
  const [s, r] = C([]), [o, c] = C(0), [h, d] = C(0), [A, m] = C({}), [u, k] = C(!1), [N, f] = C([]), [p, b] = C(!1), [_, x] = C(null);
  T(() => {
    !a || !n || (r(n.items), c(0), d(0), m({}), k(!1), f([]), x(null));
  }, [a, n]);
  const y = s[o], M = K(() => {
    var g;
    return (g = y == null ? void 0 : y.steps) != null && g.length ? y.steps : (n == null ? void 0 : n.steps) ?? [];
  }, [y, n]);
  if (!n || !y || !M.length) return /* @__PURE__ */ e(te, { open: a && !!n, onClose: () => l(N), title: (n == null ? void 0 : n.title) ?? "", children: /* @__PURE__ */ e("p", { className: "hf-muted", children: "Nothing is waiting here any more." }) });
  const W = M[h], v = h === M.length - 1, S = o === s.length - 1, B = oa(W, A), V = ca(W, A), L = (g, D) => {
    m((j) => ({ ...j, [g]: D })), x(null);
  }, se = n.unit.toLowerCase();
  async function w() {
    if (B.length || V) {
      k(!0);
      return;
    }
    if (k(!1), !v) {
      d(h + 1);
      return;
    }
    b(!0);
    try {
      await i(y, ha(M, A));
      const g = [...N, y.id];
      if (f(g), S) {
        l(g);
        return;
      }
      c(o + 1), d(0), m({});
    } catch (g) {
      const D = g;
      if (x({ text: (D == null ? void 0 : D.message) || "That didn't save. Try again, or open it in the app.", field: D == null ? void 0 : D.field }), D != null && D.field) {
        const j = M.findIndex((re) => re.fields.some((ce) => ce.key === D.field));
        j >= 0 && d(j);
      }
    } finally {
      b(!1);
    }
  }
  const P = v ? S ? "Save" : `Save and next ${se}` : "Next";
  return /* @__PURE__ */ e(te, { open: a, onClose: () => l(N), title: n.title, children: /* @__PURE__ */ t("div", { className: "hf-quick", children: [
    /* @__PURE__ */ t("div", { className: "hf-quick__app", children: [
      /* @__PURE__ */ e(ie, { app: n.app, size: 28 }),
      /* @__PURE__ */ e("span", { children: n.appName })
    ] }),
    s.length > 1 && /* @__PURE__ */ t("div", { className: "hf-quick__run", "aria-label": `${n.unit} ${o + 1} of ${s.length}`, children: [
      /* @__PURE__ */ t("span", { children: [
        n.unit,
        " ",
        o + 1,
        " of ",
        s.length
      ] }),
      /* @__PURE__ */ e("span", { className: "hf-quick__dots", "aria-hidden": "true", children: s.map((g, D) => /* @__PURE__ */ e("i", { className: D < o ? "is-done" : D === o ? "is-on" : "" }, g.id)) })
    ] }),
    /* @__PURE__ */ t("div", { className: "hf-quick__who", children: [
      /* @__PURE__ */ e(q, { name: y.name, size: 44 }),
      /* @__PURE__ */ t("div", { children: [
        /* @__PURE__ */ e("p", { className: "hf-quick__name", children: y.name }),
        y.sub && /* @__PURE__ */ e("p", { className: "hf-quick__sub", children: y.sub }),
        y.when && /* @__PURE__ */ e("p", { className: "hf-quick__sub", children: y.when }),
        !!((Z = (U = y.context) == null ? void 0 : U.chips) != null && Z.length || (ae = y.facts) != null && ae.length) && /* @__PURE__ */ e("div", { className: "hf-quick__facts", children: [...((le = y.context) == null ? void 0 : le.chips) ?? [], ...y.facts ?? []].map((g) => /* @__PURE__ */ e("span", { children: g }, g)) })
      ] })
    ] }),
    y.context && /* @__PURE__ */ e(da, { ctx: y.context, first: y.name.split(" ")[0], open: h === 0 }, `${y.id}-${h === 0}`),
    M.length > 1 && /* @__PURE__ */ e("ol", { className: "hf-quick__steps", children: M.map((g, D) => /* @__PURE__ */ e("li", { className: D === h ? "is-on" : D < h ? "is-done" : "", children: g.title }, g.title)) }),
    (W.legend || W.minAnswered) && /* @__PURE__ */ t("div", { className: "hf-quick__legend", children: [
      W.legend && /* @__PURE__ */ e("span", { children: W.legend }),
      W.minAnswered && /* @__PURE__ */ t("span", { className: u && V ? "is-bad" : "", children: [
        An(W, A),
        " of ",
        W.fields.length,
        " ",
        W.minAnswered.done ?? "answered",
        " · at least ",
        W.minAnswered.count
      ] })
    ] }),
    /* @__PURE__ */ e("div", { className: "hf-quick__fields", children: W.fields.filter((g) => pe(g, A)).map((g) => {
      var re, ce;
      const D = u && B.includes(g) || (_ == null ? void 0 : _.field) === g.key, j = `hf-q-${g.key}`;
      return /* @__PURE__ */ t("div", { className: `hf-quick__f${D ? " is-bad" : ""}`, children: [
        g.type !== "check" && /* @__PURE__ */ t("div", { className: "hf-quick__labelrow", children: [
          /* @__PURE__ */ t("p", { className: "hf-quick__label", id: `${j}-l`, children: [
            g.label,
            !ve(g, A) && !g.skipLabel && /* @__PURE__ */ e("span", { children: " (optional)" })
          ] }),
          g.skipLabel && /* @__PURE__ */ e(
            "button",
            {
              type: "button",
              className: `hf-quick__skip${A[g.key] === R ? " is-on" : ""}`,
              "aria-pressed": A[g.key] === R,
              onClick: () => L(g.key, A[g.key] === R ? "" : R),
              children: g.skipLabel
            }
          )
        ] }),
        (((re = y.hints) == null ? void 0 : re[g.key]) ?? g.hint) && /* @__PURE__ */ e("p", { className: "hf-quick__hint", children: ((ce = y.hints) == null ? void 0 : ce[g.key]) ?? g.hint }),
        g.type === "scale" && A[g.key] === R && /* @__PURE__ */ t("p", { className: "hf-quick__skipped", children: [
          g.skipLabel,
          ": left out of the score."
        ] }),
        g.type === "scale" && A[g.key] !== R && /* @__PURE__ */ t(z, { children: [
          /* @__PURE__ */ e("div", { className: `hf-quick__scale${(g.max ?? 5) > 5 ? " hf-quick__scale--wide" : ""}`, role: "radiogroup", "aria-labelledby": `${j}-l`, children: Array.from({ length: g.max ?? 5 }, (F, pn) => pn + 1).map((F) => /* @__PURE__ */ e(
            "button",
            {
              type: "button",
              role: "radio",
              "aria-checked": A[g.key] === F,
              "aria-label": (g.max ?? 5) === 5 ? `${F}, ${qe[F]}` : `${F} of ${g.max}`,
              className: A[g.key] === F ? "is-on" : "",
              onClick: () => L(g.key, A[g.key] === F && !ve(g, A) ? "" : F),
              children: F
            },
            F
          )) }),
          (g.max ?? 5) === 5 && /* @__PURE__ */ e("p", { className: "hf-quick__word", "aria-live": "polite", children: A[g.key] ? qe[Number(A[g.key])] : "" })
        ] }),
        g.type === "choice" && /* @__PURE__ */ e("div", { className: "hf-quick__pills", role: "radiogroup", "aria-labelledby": `${j}-l`, children: (g.options ?? []).map((F) => /* @__PURE__ */ e("button", { type: "button", role: "radio", "aria-checked": A[g.key] === F, className: A[g.key] === F ? "is-on" : "", onClick: () => L(g.key, F), children: F }, F)) }),
        g.type === "text" && /* @__PURE__ */ e(
          "textarea",
          {
            id: j,
            "aria-labelledby": `${j}-l`,
            rows: 3,
            value: String(A[g.key] ?? ""),
            placeholder: g.placeholder,
            onChange: (F) => L(g.key, F.target.value),
            "aria-invalid": D
          }
        ),
        g.type === "check" && /* @__PURE__ */ t("label", { className: "hf-quick__check", children: [
          /* @__PURE__ */ e("input", { type: "checkbox", checked: !!A[g.key], onChange: (F) => L(g.key, F.target.checked) }),
          " ",
          g.label
        ] }),
        D && !_ && /* @__PURE__ */ e("p", { className: "hf-quick__err", role: "alert", children: g.type === "scale" ? `Pick a score from 1 to ${g.max ?? 5}.` : g.type === "text" ? "Add a line or two." : g.type === "check" ? "Tick this to go on." : "Choose one." })
      ] }, g.key);
    }) }),
    _ && /* @__PURE__ */ e("p", { className: "hf-quick__err hf-quick__err--save", role: "alert", children: _.text }),
    u && (He(B) ?? V) && /* @__PURE__ */ e("p", { className: "hf-quick__missing", role: "status", children: He(B) ?? V }),
    /* @__PURE__ */ t("div", { className: "hf-quick__foot", children: [
      h > 0 && /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: () => d(h - 1), disabled: p, children: "Back" }),
      /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--primary", onClick: w, disabled: p, children: p ? "Saving…" : P })
    ] }),
    n.openUrl && /* @__PURE__ */ t("a", { className: "hf-quick__open", href: n.openUrl, target: "_blank", rel: "noopener", children: [
      "Open in ",
      n.appName,
      " ",
      /* @__PURE__ */ e(tn, { size: 13 })
    ] })
  ] }) });
}
function et({ text: n, action: a, onDone: i, ms: l = 5e3 }) {
  return T(() => {
    if (!n) return;
    const s = window.setTimeout(i, l);
    return () => window.clearTimeout(s);
  }, [n, l, i]), n ? /* @__PURE__ */ t("div", { className: "hf hf-toast", role: "status", children: [
    /* @__PURE__ */ e("span", { children: n }),
    a && /* @__PURE__ */ e("button", { type: "button", onClick: () => {
      a.onClick(), i();
    }, children: a.label })
  ] }) : null;
}
function Aa(n, a, i) {
  const l = n.slice();
  if (!a) return l;
  const s = a.dir === "asc" ? 1 : -1, r = (o) => o == null || o === "";
  return l.sort((o, c) => {
    const h = i(o, a.key), d = i(c, a.key);
    return r(h) && r(d) ? 0 : r(h) ? 1 : r(d) ? -1 : typeof h == "number" && typeof d == "number" ? (h - d) * s : String(h).localeCompare(String(d), void 0, { numeric: !0, sensitivity: "base" }) * s;
  });
}
function fa(n, a) {
  return !n || n.key !== a ? { key: a, dir: "asc" } : { key: a, dir: n.dir === "asc" ? "desc" : "asc" };
}
function ua(n, a) {
  return n === "done" ? { mark: "tick", words: "done" } : n === "skipped" ? { mark: "dash", words: "not needed" } : n === "current" ? { mark: "number", words: `step ${a + 1}, where the case is now` } : { mark: "number", words: `step ${a + 1}, still to come` };
}
const fn = {
  rated: "Rated",
  missing: "Not rated",
  skipped: "Skipped",
  future: "Still to come"
};
function pa(n) {
  return n.map((a) => `${a.label}: ${fn[a.state].toLowerCase()}`).join(", ");
}
function nt({ variant: n = "secondary", fit: a, icon: i, busy: l, className: s, children: r, type: o = "button", ...c }) {
  const h = ["hf-btn", `hf-btn--${n}`, "hf-press", a ? "hf-btn--fit" : "", s ?? ""].filter(Boolean).join(" ");
  return /* @__PURE__ */ t("button", { type: o, className: h, "aria-busy": l || void 0, ...c, children: [
    l ? /* @__PURE__ */ e("span", { className: "hf-spin", "aria-hidden": "true" }) : i,
    r
  ] });
}
function ee(n) {
  const a = Q(), i = n ?? a;
  return { id: i, hint: `${i}-h`, error: `${i}-e` };
}
function ze({ htmlFor: n, label: a, optional: i, hideLabel: l }) {
  return /* @__PURE__ */ t("label", { htmlFor: n, className: l ? "hf-sr" : "hf-fld__l", children: [
    a,
    i && /* @__PURE__ */ e("span", { className: "hf-fld__opt", children: " (optional)" })
  ] });
}
function ne(n, a, i) {
  return [a ? n.hint : "", i ? n.error : ""].filter(Boolean).join(" ") || void 0;
}
function Me({ ids: n, error: a }) {
  return a ? /* @__PURE__ */ e("span", { id: n.error, className: "hf-fld__e", children: a }) : null;
}
function at({ label: n, hint: a, error: i, optional: l, hideLabel: s, id: r, className: o, ...c }) {
  const h = ee(r);
  return /* @__PURE__ */ t("div", { className: ["hf-fld", o ?? ""].join(" "), children: [
    /* @__PURE__ */ e(ze, { htmlFor: h.id, label: n, optional: l, hideLabel: s }),
    a && /* @__PURE__ */ e("span", { id: h.hint, className: "hf-fld__h", children: a }),
    /* @__PURE__ */ e(
      "input",
      {
        id: h.id,
        className: i ? "hf-input hf-input--err" : "hf-input",
        "aria-invalid": i ? !0 : void 0,
        "aria-describedby": ne(h, a, i),
        ...c
      }
    ),
    /* @__PURE__ */ e(Me, { ids: h, hint: a, error: i })
  ] });
}
function tt({ label: n, hint: a, error: i, optional: l, hideLabel: s, id: r, className: o, rows: c = 3, maxLength: h, value: d, ...A }) {
  const m = ee(r), u = typeof d == "string" ? d.length : 0;
  return /* @__PURE__ */ t("div", { className: ["hf-fld", o ?? ""].join(" "), children: [
    /* @__PURE__ */ e(ze, { htmlFor: m.id, label: n, optional: l, hideLabel: s }),
    a && /* @__PURE__ */ e("span", { id: m.hint, className: "hf-fld__h", children: a }),
    /* @__PURE__ */ e(
      "textarea",
      {
        id: m.id,
        rows: Math.max(3, c),
        maxLength: h,
        value: d,
        className: i ? "hf-input hf-input--area hf-input--err" : "hf-input hf-input--area",
        "aria-invalid": i ? !0 : void 0,
        "aria-describedby": ne(m, a, i),
        ...A
      }
    ),
    h ? /* @__PURE__ */ t("span", { className: "hf-fld__count", "aria-live": "polite", children: [
      u,
      " of ",
      h
    ] }) : null,
    /* @__PURE__ */ e(Me, { ids: m, hint: a, error: i })
  ] });
}
function it({ label: n, hint: a, error: i, optional: l, hideLabel: s, id: r, className: o, options: c, placeholder: h, ...d }) {
  const A = ee(r);
  return /* @__PURE__ */ t("div", { className: ["hf-fld", o ?? ""].join(" "), children: [
    /* @__PURE__ */ e(ze, { htmlFor: A.id, label: n, optional: l, hideLabel: s }),
    a && /* @__PURE__ */ e("span", { id: A.hint, className: "hf-fld__h", children: a }),
    /* @__PURE__ */ t("span", { className: "hf-select", children: [
      /* @__PURE__ */ t(
        "select",
        {
          id: A.id,
          className: i ? "hf-input hf-input--err" : "hf-input",
          "aria-invalid": i ? !0 : void 0,
          "aria-describedby": ne(A, a, i),
          ...d,
          children: [
            h !== void 0 && /* @__PURE__ */ e("option", { value: "", children: h }),
            c.map((m) => typeof m == "string" ? /* @__PURE__ */ e("option", { value: m, children: m }, m) : /* @__PURE__ */ e("option", { value: m.value, children: m.label }, m.value))
          ]
        }
      ),
      /* @__PURE__ */ e(sn, { size: 18, "aria-hidden": "true" })
    ] }),
    /* @__PURE__ */ e(Me, { ids: A, hint: a, error: i })
  ] });
}
function st({ label: n, sub: a, id: i, className: l, ...s }) {
  const r = Q(), o = i ?? r;
  return /* @__PURE__ */ t("label", { htmlFor: o, className: ["hf-tick", l ?? ""].join(" "), children: [
    /* @__PURE__ */ e("input", { id: o, type: "checkbox", ...s }),
    /* @__PURE__ */ e("span", { className: "hf-tick__box", "aria-hidden": "true", children: /* @__PURE__ */ e(Y, { size: 14, strokeWidth: 3 }) }),
    /* @__PURE__ */ t("span", { className: "hf-tick__t", children: [
      n,
      a && /* @__PURE__ */ e("span", { className: "hf-tick__s", children: a })
    ] })
  ] });
}
function lt({ label: n, options: a, value: i, onChange: l, hint: s, error: r, optional: o, hideLabel: c, clearable: h, onClear: d }) {
  const A = ee();
  return /* @__PURE__ */ t("div", { className: "hf-fld", role: "group", "aria-labelledby": A.id, "aria-describedby": ne(A, s, r), children: [
    /* @__PURE__ */ t("span", { id: A.id, className: c ? "hf-sr" : "hf-fld__l", children: [
      n,
      o && /* @__PURE__ */ e("span", { className: "hf-fld__opt", children: " (optional)" })
    ] }),
    s && /* @__PURE__ */ e("span", { id: A.hint, className: "hf-fld__h", children: s }),
    /* @__PURE__ */ e("div", { className: "hf-seg hf-seg--fill", children: a.map((m) => {
      const u = typeof m == "string" ? m : m.value, k = typeof m == "string" ? m : m.label, N = i === u;
      return /* @__PURE__ */ e(
        "button",
        {
          type: "button",
          "aria-pressed": N,
          onClick: () => N && h ? d == null ? void 0 : d() : l(u),
          children: k
        },
        u
      );
    }) }),
    r && /* @__PURE__ */ e("span", { id: A.error, className: "hf-fld__e", children: r })
  ] });
}
function rt({ label: n, options: a, value: i, onChange: l, hint: s, error: r, hideLabel: o }) {
  const c = ee();
  return /* @__PURE__ */ t("div", { className: "hf-fld", role: "radiogroup", "aria-labelledby": c.id, "aria-describedby": ne(c, s, r), children: [
    /* @__PURE__ */ e("span", { id: c.id, className: o ? "hf-sr" : "hf-fld__l", children: n }),
    s && /* @__PURE__ */ e("span", { id: c.hint, className: "hf-fld__h", children: s }),
    a.map((h) => {
      const d = i === h.value;
      return /* @__PURE__ */ t("div", { className: "hf-choice__w", children: [
        /* @__PURE__ */ t("button", { type: "button", role: "radio", "aria-checked": d, className: d ? "hf-choice is-on" : "hf-choice", onClick: () => l(h.value), children: [
          /* @__PURE__ */ e("span", { className: "hf-choice__dot", "aria-hidden": "true" }),
          /* @__PURE__ */ t("span", { className: "hf-choice__b", children: [
            /* @__PURE__ */ t("span", { className: "hf-choice__t", children: [
              h.title,
              h.tag && /* @__PURE__ */ e("span", { className: "hf-choice__tag", children: h.tag })
            ] }),
            h.sub && /* @__PURE__ */ e("span", { className: "hf-choice__s", children: h.sub })
          ] })
        ] }),
        d && h.detail
      ] }, h.value);
    }),
    r && /* @__PURE__ */ e("span", { id: c.error, className: "hf-fld__e", children: r })
  ] });
}
function ct({ label: n, value: a, onChange: i, max: l = 5, hint: s, error: r, ends: o = ["1 is lowest", `${l} is highest`], children: c }) {
  const h = ee();
  return /* @__PURE__ */ t("div", { className: "hf-fld", role: "group", "aria-labelledby": h.id, "aria-describedby": ne(h, s, r), children: [
    /* @__PURE__ */ e("span", { id: h.id, className: "hf-fld__t", children: n }),
    s && /* @__PURE__ */ e("span", { id: h.hint, className: "hf-fld__h", children: s }),
    /* @__PURE__ */ e("div", { className: "hf-score", style: { gridTemplateColumns: `repeat(${l}, minmax(0, 1fr))` }, children: Array.from({ length: l }, (d, A) => A + 1).map((d) => /* @__PURE__ */ e("button", { type: "button", "aria-pressed": a === d, "aria-label": `${d} of ${l}`, onClick: () => i(d), children: d }, d)) }),
    /* @__PURE__ */ t("span", { className: "hf-score__ends", "aria-hidden": "true", children: [
      /* @__PURE__ */ e("span", { children: o[0] }),
      /* @__PURE__ */ e("span", { children: o[1] })
    ] }),
    c,
    r && /* @__PURE__ */ e("span", { id: h.error, className: "hf-fld__e", children: r })
  ] });
}
function ot({ pressed: n, count: a, className: i, children: l, type: s = "button", ...r }) {
  return /* @__PURE__ */ t("button", { type: s, className: ["hf-chip", n ? "is-on" : "", i ?? ""].filter(Boolean).join(" "), "aria-pressed": n, ...r, children: [
    l,
    typeof a == "number" && /* @__PURE__ */ e("span", { className: "hf-chip__n", children: a })
  ] });
}
function ht({ label: n, children: a }) {
  return /* @__PURE__ */ e("div", { className: "hf-chips", role: "group", "aria-label": n, children: a });
}
const ma = {
  ok: /* @__PURE__ */ e(Y, { size: 14, strokeWidth: 2.5, "aria-hidden": "true" }),
  warn: /* @__PURE__ */ e(Ve, { size: 14, strokeWidth: 2.5, "aria-hidden": "true" }),
  danger: /* @__PURE__ */ e(ye, { size: 14, strokeWidth: 2.5, "aria-hidden": "true" }),
  plain: /* @__PURE__ */ e(Sn, { size: 10, strokeWidth: 3, "aria-hidden": "true" })
};
function dt({ tone: n, icon: a, children: i }) {
  return /* @__PURE__ */ t("span", { className: `hf-status hf-status--${n}`, children: [
    a ?? ma[n],
    i
  ] });
}
const _a = {
  ok: /* @__PURE__ */ e(Y, { size: 18, "aria-hidden": "true" }),
  warn: /* @__PURE__ */ e(ye, { size: 18, "aria-hidden": "true" }),
  danger: /* @__PURE__ */ e(ye, { size: 18, "aria-hidden": "true" }),
  plain: /* @__PURE__ */ e(an, { size: 18, "aria-hidden": "true" })
};
function At({ tone: n = "plain", icon: a, children: i, role: l, action: s }) {
  return /* @__PURE__ */ t("div", { className: `hf-banner hf-banner--${n}`, role: l, children: [
    a ?? _a[n],
    /* @__PURE__ */ e("div", { className: "hf-banner__t", children: i }),
    s && /* @__PURE__ */ e("div", { className: "hf-banner__a", children: /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: s.onClick, children: s.label }) })
  ] });
}
function ft({ title: n, sub: a, icon: i, trailing: l, below: s, href: r, onClick: o, chevron: c = !!(r || o) }) {
  const h = /* @__PURE__ */ t(z, { children: [
    i && /* @__PURE__ */ e("span", { className: "hf-lrow__ic", "aria-hidden": "true", children: i }),
    /* @__PURE__ */ t("span", { className: "hf-lrow__b", children: [
      /* @__PURE__ */ e("span", { className: "hf-lrow__t", children: n }),
      a && /* @__PURE__ */ e("span", { className: "hf-lrow__s", children: a }),
      s && /* @__PURE__ */ e("span", { className: "hf-lrow__below", children: s })
    ] }),
    (l || c) && /* @__PURE__ */ t("span", { className: "hf-lrow__e", children: [
      l,
      c && /* @__PURE__ */ e($, { size: 20, "aria-hidden": "true" })
    ] })
  ] });
  return r ? /* @__PURE__ */ e("a", { className: "hf-lrow", href: r, onClick: o ? (d) => {
    d.preventDefault(), o();
  } : void 0, children: h }) : o ? /* @__PURE__ */ e("button", { type: "button", className: "hf-lrow", onClick: o, children: h }) : /* @__PURE__ */ e("div", { className: "hf-lrow", children: h });
}
function ut({ caption: n, children: a, action: i }) {
  return /* @__PURE__ */ t("section", { className: "hf-card hf-listcard", children: [
    (n || i) && /* @__PURE__ */ t("div", { className: "hf-listcard__head", children: [
      n && /* @__PURE__ */ e("span", { className: "hf-cap", children: n }),
      i
    ] }),
    /* @__PURE__ */ e("div", { className: "hf-listcard__rows", children: a })
  ] });
}
function pt({ caption: n, columns: a, rows: i, rowKey: l, onRowClick: s, rowHref: r, empty: o, initialSort: c = null, hideCaption: h, wide: d }) {
  const [A, m] = C(c), u = K(() => Aa(i, A, (p, b) => {
    var _, x;
    return (x = (_ = a.find((y) => y.key === b)) == null ? void 0 : _.sortValue) == null ? void 0 : x.call(_, p);
  }), [i, A, a]), k = a.map((p) => p.width ?? "minmax(0, 1fr)").join(" "), N = (p, b) => p.render ? p.render(b) : b[p.key], f = (p) => p == null || p === "" || p === !1;
  return /* @__PURE__ */ t("div", { className: d ? "hf-table hf-table--wide" : "hf-table", role: "table", "aria-label": n, children: [
    !h && /* @__PURE__ */ e("div", { className: "hf-table__cap hf-cap", children: n }),
    u.length > 0 && /* @__PURE__ */ e("div", { className: "hf-table__head", role: "row", style: { gridTemplateColumns: k }, children: a.map((p) => {
      const b = (A == null ? void 0 : A.key) === p.key, _ = b ? A.dir === "asc" ? "ascending" : "descending" : "none";
      return /* @__PURE__ */ e(
        "span",
        {
          role: "columnheader",
          "aria-sort": p.sortValue ? _ : void 0,
          className: p.align === "end" ? "hf-table__th is-end" : "hf-table__th",
          children: p.sortValue ? /* @__PURE__ */ t("button", { type: "button", onClick: () => m(fa(A, p.key)), children: [
            p.label,
            b ? A.dir === "asc" ? /* @__PURE__ */ e(Bn, { size: 14, "aria-hidden": "true" }) : /* @__PURE__ */ e(xn, { size: 14, "aria-hidden": "true" }) : null
          ] }) : p.label
        },
        p.key
      );
    }) }),
    u.length === 0 && o && /* @__PURE__ */ e("div", { className: "hf-table__empty", children: o }),
    u.map((p) => {
      const b = a.map((x) => {
        const y = N(x, p);
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
          style: { gridTemplateColumns: k },
          href: _,
          onClick: s ? (x) => {
            x.preventDefault(), s(p);
          } : void 0,
          children: b
        },
        l(p)
      ) : s ? /* @__PURE__ */ e(
        "button",
        {
          type: "button",
          role: "row",
          className: "hf-table__tr is-link",
          style: { gridTemplateColumns: k },
          onClick: () => s(p),
          children: b
        },
        l(p)
      ) : /* @__PURE__ */ e("div", { role: "row", className: "hf-table__tr", style: { gridTemplateColumns: k }, children: b }, l(p));
    })
  ] });
}
function ba({ lines: n = 3, height: a = 16, block: i }) {
  return i ? /* @__PURE__ */ e("span", { className: "hf-skel", style: { height: i }, "aria-hidden": "true" }) : /* @__PURE__ */ e("span", { className: "hf-skel-lines", "aria-hidden": "true", children: Array.from({ length: n }, (l, s) => /* @__PURE__ */ e("span", { className: "hf-skel", style: { height: a, width: s === n - 1 && n > 1 ? "60%" : "100%" } }, s)) });
}
function mt({ label: n = "Loading", children: a }) {
  return /* @__PURE__ */ t("div", { className: "hf-loading", role: "status", "aria-live": "polite", children: [
    /* @__PURE__ */ e("span", { className: "hf-sr", children: n }),
    a ?? /* @__PURE__ */ e(ba, { lines: 3 })
  ] });
}
const un = {
  rated: /* @__PURE__ */ e(Y, { size: 14, strokeWidth: 2.5 }),
  missing: /* @__PURE__ */ e("span", { className: "hf-month__bang", children: "!" }),
  skipped: /* @__PURE__ */ e(Be, { size: 14, strokeWidth: 2.5 }),
  future: /* @__PURE__ */ e("span", { className: "hf-month__dot" })
};
function _t({ months: n, label: a = "Monthly ratings" }) {
  return /* @__PURE__ */ e("div", { className: "hf-months", role: "img", "aria-label": `${a}. ${pa(n)}`, style: { gridTemplateColumns: `repeat(${Math.max(1, n.length)}, minmax(0, 1fr))` }, children: n.map((i, l) => /* @__PURE__ */ t("span", { className: `hf-month hf-month--${i.state}`, "aria-hidden": "true", children: [
    /* @__PURE__ */ e("span", { className: "hf-month__l", children: i.label }),
    un[i.state]
  ] }, l)) });
}
function bt({ hint: n }) {
  return /* @__PURE__ */ t("div", { className: "hf-monthkey", children: [
    ["rated", "missing", "skipped", "future"].map((i) => /* @__PURE__ */ t("span", { className: `hf-monthkey__i hf-monthkey__i--${i}`, children: [
      un[i],
      fn[i]
    ] }, i)),
    n && /* @__PURE__ */ e(H, { label: "About the month strip", text: n })
  ] });
}
function gt({ steps: n, selected: a, onSelect: i, label: l }) {
  return /* @__PURE__ */ e("ol", { className: "hf-steps", "aria-label": l, children: n.map((s, r) => {
    const o = ua(s.state, r), c = /* @__PURE__ */ t(z, { children: [
      /* @__PURE__ */ t("span", { className: "hf-step__rail", "aria-hidden": "true", children: [
        /* @__PURE__ */ e("span", { className: "hf-step__dot", children: o.mark === "tick" ? /* @__PURE__ */ e(Y, { size: 16, strokeWidth: 3 }) : o.mark === "dash" ? /* @__PURE__ */ e(Be, { size: 16, strokeWidth: 3 }) : r + 1 }),
        r < n.length - 1 && /* @__PURE__ */ e("span", { className: "hf-step__line" })
      ] }),
      /* @__PURE__ */ t("span", { className: "hf-step__b", children: [
        /* @__PURE__ */ t("span", { className: "hf-step__t", children: [
          s.title,
          /* @__PURE__ */ t("span", { className: "hf-sr", children: [
            ", ",
            o.words
          ] })
        ] }),
        s.sub && /* @__PURE__ */ e("span", { className: "hf-step__s", children: s.sub })
      ] })
    ] });
    return /* @__PURE__ */ e("li", { "aria-current": s.state === "current" ? "step" : void 0, children: i ? /* @__PURE__ */ e("button", { type: "button", className: `hf-step hf-step--${s.state}`, "aria-pressed": a === s.key, onClick: () => i(s.key), children: c }) : /* @__PURE__ */ e("div", { className: `hf-step hf-step--${s.state}`, children: c }) }, s.key);
  }) });
}
function Nt({ items: n, label: a }) {
  return /* @__PURE__ */ e("ol", { className: "hf-tl", "aria-label": a, children: n.map((i) => /* @__PURE__ */ t("li", { className: "hf-tl__i", children: [
    /* @__PURE__ */ e("span", { className: "hf-tl__d", children: i.date }),
    /* @__PURE__ */ t("span", { className: "hf-tl__b", children: [
      /* @__PURE__ */ e("span", { className: "hf-tl__t", children: i.title }),
      i.sub && /* @__PURE__ */ e("span", { className: "hf-tl__s", children: i.sub }),
      i.extra
    ] })
  ] }, i.key)) });
}
function kt({ docs: n, onAdd: a, addLabel: i = "Add a document", accept: l, empty: s = "No documents yet.", busy: r }) {
  return /* @__PURE__ */ t("div", { className: "hf-docs", children: [
    n.length === 0 && /* @__PURE__ */ e("p", { className: "hf-muted hf-docs__empty", children: s }),
    n.map((o) => o.href ? /* @__PURE__ */ t("span", { className: "hf-doc__row", children: [
      /* @__PURE__ */ t("a", { className: "hf-doc", href: o.href, target: "_blank", rel: "noreferrer", children: [
        /* @__PURE__ */ e(ke, { size: 18, "aria-hidden": "true" }),
        /* @__PURE__ */ e("span", { className: "hf-doc__n", children: o.name }),
        o.meta && /* @__PURE__ */ e("span", { className: "hf-doc__m", children: o.meta })
      ] }),
      o.end
    ] }, o.key) : /* @__PURE__ */ t("span", { className: "hf-doc__row", children: [
      /* @__PURE__ */ t("span", { className: "hf-doc", children: [
        /* @__PURE__ */ e(ke, { size: 18, "aria-hidden": "true" }),
        /* @__PURE__ */ e("span", { className: "hf-doc__n", children: o.name }),
        o.meta && /* @__PURE__ */ e("span", { className: "hf-doc__m", children: o.meta })
      ] }),
      o.end
    ] }, o.key)),
    a && /* @__PURE__ */ t("label", { className: "hf-btn hf-btn--quiet hf-docs__add", "aria-busy": r || void 0, children: [
      /* @__PURE__ */ e(Wn, { size: 18, "aria-hidden": "true" }),
      r ? "Adding…" : i,
      /* @__PURE__ */ e(
        "input",
        {
          type: "file",
          className: "hf-sr",
          accept: l,
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
  Un as APP_LOGOS,
  ie as AppMark,
  ja as Appearance,
  Ia as AppsDock,
  Ua as AppsGrid,
  q as Avatar,
  Da as BalanceTile,
  At as Banner,
  Ra as BentoGrid,
  on as Breadcrumb,
  nt as Button,
  $a as Celebration,
  st as Checkbox,
  ot as Chip,
  ht as ChipGroup,
  rt as ChoiceCards,
  pt as DataTable,
  kt as DocumentList,
  za as Feed,
  Ee as FeedCard,
  $n as FeedQuiet,
  La as FirstLoginTour,
  Ma as GiveKudosButton,
  Ea as GiveKudosSheet,
  la as GlanceStrip,
  xa as Greeting,
  Oa as GreetingBand,
  Va as HappeningCard,
  Ta as HealthDot,
  H as Hint,
  va as KeyValues,
  ut as ListCard,
  ft as ListRow,
  mt as Loading,
  fn as MONTH_WORDS,
  Za as MiniTile,
  bt as MonthKey,
  _t as MonthStrip,
  Ha as NewJoinerCard,
  Xa as PersonPage,
  ya as Picker,
  Sa as ProfileCard,
  wa as QuantityField,
  Ka as QuickSheet,
  Ca as Quiet,
  qe as SCALE_WORDS,
  Hn as SKINS,
  R as SKIPPED,
  Te as SWATCHES,
  ct as ScoreGroup,
  Wa as ScoreRing,
  qa as SearchPill,
  lt as Segmented,
  it as Select,
  te as Sheet,
  ba as Skeleton,
  dt as StatusChip,
  Pa as StatusRows,
  gt as Stepper,
  On as TOUR_STEPS,
  Ja as TeamCard,
  tt as TextArea,
  at as TextField,
  oe as Tile,
  Fa as TileStrip,
  Nt as Timeline,
  et as Toast,
  Ga as UnitPage,
  Ba as UnitSwitch,
  Ya as WaitingCard,
  hn as WaitingCounts,
  Qa as WaitingQuiet,
  An as answeredCount,
  ha as answersFor,
  Rn as applyPrefs,
  Gn as arrange,
  En as bandFor,
  De as columnsFor,
  Ln as currentPrefs,
  we as dayWords,
  Mn as factorTotal,
  rn as firstName,
  ta as glanceLine,
  zn as initials,
  ve as isRequired,
  pe as isShown,
  Dn as matchOptions,
  In as matchPeople,
  oa as missingFields,
  He as missingLine,
  pa as monthLine,
  fa as nextSort,
  sa as peopleFilters,
  Qn as sortBlocks,
  Aa as sortRows,
  Vn as spansFor,
  ua as stepMark,
  ca as stepProblem,
  Fn as stepQuantity,
  aa as tenureWords,
  ln as timeGreeting,
  Xn as useLayout,
  ia as waitingLine
};
//# sourceMappingURL=hifive-ui.js.map
