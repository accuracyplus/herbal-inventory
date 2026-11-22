import { jsx as t, jsxs as s, Fragment as j } from "react/jsx-runtime";
import { useId as ve, useState as z, useRef as Y, useMemo as ke, useEffect as q, useLayoutEffect as mt, createElement as ea, useSyncExternalStore as ta, useCallback as Ae } from "react";
import { Search as At, Minus as Re, Plus as sn, Check as he, Building2 as na, ChevronsUpDown as aa, Settings as ln, User as on, Briefcase as cn, Calendar as hn, Lock as dn, ChevronRight as te, X as qe, Clock as _t, Award as Ye, Target as ia, Bell as fn, ShieldCheck as un, Pin as pn, ThumbsUp as mn, Hand as Le, Sun as An, MessageSquare as ra, Star as _n, BookOpen as gt, UserPlus as Ve, Sparkles as sa, MoreHorizontal as gn, RefreshCw as la, CheckCircle2 as oa, BadgeCheck as ca, MapPin as ha, ExternalLink as We, ArrowUp as Tt, ArrowDown as Dt, ChevronDown as bt, Info as bn, AlertTriangle as je, Circle as da, SlidersHorizontal as fa, Users as ua, Hourglass as yt, LogOut as pa, FileText as ot, ChevronLeft as yn, Paperclip as ma, List as Aa, RotateCw as _a, Undo2 as ga } from "lucide-react";
import { createPortal as vn } from "react-dom";
import { createRoot as ba } from "react-dom/client";
const tt = (e) => e.trim().toLowerCase();
function ya(e, n, a = 30) {
  const i = tt(n);
  if (!i) return e.slice(0, a);
  const r = e.filter((c) => {
    var h;
    return (h = c.codes) == null ? void 0 : h.some((u) => tt(u) === i);
  });
  if (r.length) return r.slice(0, a);
  const l = i.split(/\s+/), o = (c) => tt(`${c.label} ${c.keywords ?? ""} ${(c.codes ?? []).join(" ")}`);
  return e.filter((c) => {
    const h = o(c);
    return l.every((u) => h.includes(u));
  }).slice(0, a);
}
function va(e, n, a = {}) {
  const { min: i = 0, max: r, step: l = 1 } = a, o = Number(e);
  let h = (Number.isFinite(o) ? o : 0) + n * l;
  return h < i && (h = i), r !== void 0 && h > r && (h = r), String(Math.round(h * 1e6) / 1e6);
}
function ka({ label: e, options: n, onPick: a, placeholder: i, hint: r, error: l, hideLabel: o, limit: c = 30, empty: h, footer: u, id: f }) {
  const d = ve(), p = f ?? d, [g, k] = z(""), [m, y] = z(!1), [b, A] = z(0), G = Y(null), N = ke(() => ya(n, g, c), [n, g, c]);
  q(() => {
    if (!m) return;
    const w = (T) => {
      var P;
      (P = G.current) != null && P.contains(T.target) || y(!1);
    };
    return document.addEventListener("pointerdown", w), () => document.removeEventListener("pointerdown", w);
  }, [m]);
  const $ = (w) => {
    a(w), k(""), y(!1), A(0);
  }, C = [r ? `${p}-h` : "", l ? `${p}-e` : ""].filter(Boolean).join(" ") || void 0;
  return /* @__PURE__ */ s("div", { className: "hf-fld hf-pick", ref: G, children: [
    /* @__PURE__ */ t("label", { htmlFor: p, className: o ? "hf-sr" : "hf-fld__l", children: e }),
    r && /* @__PURE__ */ t("span", { id: `${p}-h`, className: "hf-fld__h", children: r }),
    /* @__PURE__ */ s("div", { className: "hf-pick__wrap", children: [
      /* @__PURE__ */ s("div", { className: ["hf-pick__box", m ? "is-open" : "", l ? "is-err" : ""].filter(Boolean).join(" "), children: [
        /* @__PURE__ */ t(At, { size: 18, "aria-hidden": "true" }),
        /* @__PURE__ */ t(
          "input",
          {
            id: p,
            role: "combobox",
            "aria-expanded": m,
            "aria-controls": `${p}-l`,
            "aria-autocomplete": "list",
            "aria-activedescendant": m && N[b] ? `${p}-o${b}` : void 0,
            "aria-invalid": l ? !0 : void 0,
            "aria-describedby": C,
            autoComplete: "off",
            value: g,
            placeholder: i,
            onFocus: () => y(!0),
            onChange: (w) => {
              k(w.target.value), y(!0), A(0);
            },
            onKeyDown: (w) => {
              w.key === "ArrowDown" ? (w.preventDefault(), y(!0), A((T) => Math.min(T + 1, N.length - 1))) : w.key === "ArrowUp" ? (w.preventDefault(), A((T) => Math.max(T - 1, 0))) : w.key === "Enter" && m && N[b] ? (w.preventDefault(), $(N[b])) : w.key === "Escape" && m && (w.stopPropagation(), y(!1));
            }
          }
        )
      ] }),
      m && /* @__PURE__ */ s("div", { className: "hf-pick__list", children: [
        /* @__PURE__ */ t("div", { id: `${p}-l`, role: "listbox", "aria-label": e, children: N.map((w, T) => /* @__PURE__ */ s(
          "button",
          {
            id: `${p}-o${T}`,
            type: "button",
            role: "option",
            "aria-selected": T === b,
            tabIndex: -1,
            className: T === b ? "hf-pick__opt is-on" : "hf-pick__opt",
            onPointerDown: (P) => P.preventDefault(),
            onClick: () => $(w),
            onPointerEnter: () => A(T),
            children: [
              /* @__PURE__ */ s("span", { className: "hf-pick__b", children: [
                /* @__PURE__ */ t("span", { className: "hf-pick__t", children: w.label }),
                w.sub && /* @__PURE__ */ t("span", { className: "hf-pick__s", children: w.sub })
              ] }),
              w.end && /* @__PURE__ */ t("span", { className: w.endTone ? `hf-pick__e hf-pick__e--${w.endTone}` : "hf-pick__e", children: w.end })
            ]
          },
          w.value
        )) }),
        N.length === 0 && /* @__PURE__ */ t("p", { className: "hf-pick__none", children: h ? h(g) : `Nothing matches “${g}”.` }),
        u && /* @__PURE__ */ t("div", { className: "hf-pick__foot", children: u })
      ] })
    ] }),
    l && /* @__PURE__ */ t("span", { id: `${p}-e`, className: "hf-fld__e", children: l })
  ] });
}
function $r({ label: e, value: n, onChange: a, unit: i, min: r = 0, max: l, step: o = 1, bare: c, hint: h, error: u, hideLabel: f, id: d, className: p, ...g }) {
  const k = ve(), m = d ?? k, y = [h ? `${m}-h` : "", u ? `${m}-e` : ""].filter(Boolean).join(" ") || void 0, b = (A) => a(va(n, A, { min: r, max: l, step: o }));
  return /* @__PURE__ */ s("div", { className: ["hf-fld hf-qty", p ?? ""].filter(Boolean).join(" "), children: [
    /* @__PURE__ */ t("label", { htmlFor: m, className: f ? "hf-sr" : "hf-fld__l", children: e }),
    h && /* @__PURE__ */ t("span", { id: `${m}-h`, className: "hf-fld__h", children: h }),
    /* @__PURE__ */ s("div", { className: "hf-qty__row", children: [
      !c && /* @__PURE__ */ t("button", { type: "button", className: "hf-qty__b", "aria-label": `Less: ${e}`, onClick: () => b(-1), children: /* @__PURE__ */ t(Re, { size: 18, "aria-hidden": "true" }) }),
      /* @__PURE__ */ t(
        "input",
        {
          id: m,
          type: "number",
          inputMode: "decimal",
          min: r,
          max: l,
          step: "any",
          value: n ?? "",
          className: u ? "hf-input hf-input--err" : "hf-input",
          "aria-invalid": u ? !0 : void 0,
          "aria-describedby": y,
          onChange: (A) => a(A.target.value),
          onWheel: (A) => A.currentTarget.blur(),
          ...g
        }
      ),
      !c && /* @__PURE__ */ t("button", { type: "button", className: "hf-qty__b", "aria-label": `More: ${e}`, onClick: () => b(1), children: /* @__PURE__ */ t(sn, { size: 18, "aria-hidden": "true" }) }),
      i && /* @__PURE__ */ t("span", { className: "hf-qty__u", children: i })
    ] }),
    u && /* @__PURE__ */ t("span", { id: `${m}-e`, className: "hf-fld__e", children: u })
  ] });
}
function Tr({ items: e, columns: n = 2 }) {
  const a = e.filter((i) => i.value !== null && i.value !== void 0 && i.value !== "" && i.value !== !1);
  return a.length ? /* @__PURE__ */ t("dl", { className: `hf-kv hf-kv--${n}`, children: a.map((i) => /* @__PURE__ */ s("div", { children: [
    /* @__PURE__ */ t("dt", { children: i.label }),
    /* @__PURE__ */ t("dd", { children: i.value })
  ] }, i.label)) }) : null;
}
function wa({ children: e, icon: n }) {
  return /* @__PURE__ */ s("p", { className: "hf-quiet", children: [
    n ?? /* @__PURE__ */ t(he, { size: 16, "aria-hidden": "true" }),
    /* @__PURE__ */ t("span", { children: e })
  ] });
}
function Dr({ name: e, label: n = "Working in", onClick: a, compact: i }) {
  const r = i ? "hf-unit hf-unit--pill" : "hf-unit", l = /* @__PURE__ */ s(j, { children: [
    /* @__PURE__ */ t(na, { size: i ? 16 : 20, "aria-hidden": "true" }),
    i ? /* @__PURE__ */ t("span", { className: "hf-unit__n", children: e }) : /* @__PURE__ */ s("span", { className: "hf-unit__b", children: [
      /* @__PURE__ */ t("span", { className: "hf-unit__l", children: n }),
      /* @__PURE__ */ t("span", { className: "hf-unit__n", children: e })
    ] }),
    a && /* @__PURE__ */ t(aa, { size: 16, "aria-hidden": "true" })
  ] });
  return a ? /* @__PURE__ */ t("button", { type: "button", className: r, onClick: a, "aria-label": `${n}: ${e}. Switch`, children: l }) : /* @__PURE__ */ t("div", { className: r, "aria-label": `${n}: ${e}`, children: l });
}
function kn(e = /* @__PURE__ */ new Date()) {
  const n = e.getHours();
  return n < 5 ? "Working late" : n < 12 ? "Good morning" : n < 17 ? "Good afternoon" : "Good evening";
}
function Gr({ firstName: e, reportsTo: n, leads: a = 0, tenure: i, quote: r, search: l, onAppearance: o, onPrivacy: c, now: h = /* @__PURE__ */ new Date() }) {
  const u = h.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  return /* @__PURE__ */ s("div", { className: "hf", children: [
    /* @__PURE__ */ s("div", { className: "hf-topbar", children: [
      /* @__PURE__ */ t("p", { className: "hf-topbar__date", children: u }),
      l && /* @__PURE__ */ t("div", { className: "hf-topbar__search", children: l }),
      o && /* @__PURE__ */ t("button", { type: "button", className: "hf-topbar__gear", onClick: o, "aria-label": "Appearance settings", "data-tour": "gear", children: /* @__PURE__ */ t(ln, { size: 20 }) })
    ] }),
    /* @__PURE__ */ s("header", { className: "hf-greet", "data-tour": "topbar", children: [
      /* @__PURE__ */ s("h1", { className: "hf-display hf-greet__h1", children: [
        kn(h),
        ", ",
        e
      ] }),
      (n || a > 0 || i) && /* @__PURE__ */ s("div", { className: "hf-greet__meta", children: [
        n && /* @__PURE__ */ s("span", { children: [
          /* @__PURE__ */ t(on, { size: 14 }),
          "Reports to ",
          n
        ] }),
        a > 0 && /* @__PURE__ */ s("span", { children: [
          /* @__PURE__ */ t(cn, { size: 14 }),
          "Leads ",
          a,
          " ",
          a === 1 ? "person" : "people"
        ] }),
        i && /* @__PURE__ */ s("span", { children: [
          /* @__PURE__ */ t(hn, { size: 14 }),
          i
        ] })
      ] }),
      c && /* @__PURE__ */ s("button", { type: "button", className: "hf-greet__privacy", onClick: c, children: [
        /* @__PURE__ */ t(dn, { size: 12 }),
        /* @__PURE__ */ t("span", { children: "Only you can see this page" }),
        /* @__PURE__ */ t(te, { size: 12 })
      ] }),
      r && /* @__PURE__ */ s("blockquote", { className: "hf-greet__quote", children: [
        "“",
        r.body,
        "”",
        r.author && /* @__PURE__ */ s("footer", { children: [
          "— ",
          r.author
        ] })
      ] })
    ] })
  ] });
}
const _e = (e) => `hf-tone-${e}`, K = (...e) => e.filter(Boolean).join(" "), Na = (e) => e.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();
function Pr({ name: e, role: n, company: a, photo: i, onOpen: r }) {
  return i ? /* @__PURE__ */ s("section", { className: "hf hf-card hf-profile hf-profile--photo", "aria-label": "Your profile", "data-tour": "profile", children: [
    /* @__PURE__ */ t("img", { className: "hf-profile__photo", src: i, alt: e }),
    /* @__PURE__ */ s("div", { className: "hf-profile__over", children: [
      /* @__PURE__ */ t("h2", { className: "hf-display hf-profile__name", children: e }),
      (n || a) && /* @__PURE__ */ t("p", { className: "hf-profile__role", children: [n, a].filter(Boolean).join(" · ") })
    ] }),
    r && /* @__PURE__ */ t("button", { type: "button", className: "hf-sr", onClick: r, children: "Open my access" })
  ] }) : /* @__PURE__ */ t("section", { className: "hf hf-card hf-profile", "aria-label": "Your profile", "data-tour": "profile", children: /* @__PURE__ */ s(r ? "button" : "div", { className: K("hf-profile__row", r && "hf-press"), onClick: r, type: r ? "button" : void 0, style: r ? { width: "100%", textAlign: "left" } : void 0, children: [
    /* @__PURE__ */ t("span", { className: "hf-avatar", "aria-hidden": "true", children: Na(e) }),
    /* @__PURE__ */ s("span", { style: { flex: 1, minWidth: 0 }, children: [
      /* @__PURE__ */ t("h2", { className: "hf-display hf-profile__name hf-truncate", title: e, children: e }),
      (n || a) && /* @__PURE__ */ s("p", { className: "hf-profile__role hf-truncate", children: [
        n && /* @__PURE__ */ t("b", { children: n }),
        n && a && /* @__PURE__ */ t("span", { className: "hf-profile__dot", children: " · " }),
        a && /* @__PURE__ */ t("span", { className: "hf-profile__co", children: a })
      ] })
    ] }),
    r && /* @__PURE__ */ t("span", { className: "hf-profile__chev", "aria-hidden": "true", children: /* @__PURE__ */ t(te, { size: 18 }) })
  ] }) });
}
function fe({ text: e, label: n = "What does this mean?", align: a = "centre" }) {
  const [i, r] = z(!1), l = ve(), o = Y(null), [c, h] = z(a);
  return q(() => {
    if (!i) return;
    const u = o.current;
    if (u && a === "centre") {
      const p = u.getBoundingClientRect();
      p.left + p.width / 2 - 130 < 8 ? h("right") : p.left + p.width / 2 + 130 > window.innerWidth - 8 ? h("left") : h("centre");
    }
    const f = (p) => {
      p.key === "Escape" && r(!1);
    }, d = () => r(!1);
    return document.addEventListener("keydown", f), document.addEventListener("click", d), () => {
      document.removeEventListener("keydown", f), document.removeEventListener("click", d);
    };
  }, [i, a]), /* @__PURE__ */ s("span", { className: "hf-hint", ref: o, children: [
    /* @__PURE__ */ t(
      "button",
      {
        type: "button",
        className: "hf-hint__btn",
        "aria-label": n,
        "aria-expanded": i,
        "aria-describedby": i ? l : void 0,
        onClick: (u) => {
          u.stopPropagation(), r((f) => !f);
        },
        children: "?"
      }
    ),
    i && /* @__PURE__ */ t(
      "span",
      {
        id: l,
        role: "tooltip",
        className: `hf-hint__pop${c === "left" ? " hf-hint__pop--left" : c === "right" ? " hf-hint__pop--right" : ""}`,
        onClick: (u) => u.stopPropagation(),
        children: e
      }
    )
  ] });
}
const xa = "[data-hf-keep-on-submit]";
function Ma(e) {
  return !e || typeof e.closest != "function" ? !1 : !e.closest(xa);
}
const za = "You have changes that are not saved. Leave this page and lose them?", Sa = /^(text|search|email|tel|url|number|password)$/;
function Ca(e, n, a, i) {
  if (!n) return !1;
  if (e === "input") return !0;
  if (e !== "change") return !1;
  const r = a.toUpperCase();
  return !(r === "TEXTAREA" || r === "INPUT" && Sa.test(i || "text"));
}
function ye(e = typeof window < "u" ? window : void 0) {
  if (!e || !e.document) return null;
  if (e.HiFiveSuite && typeof e.HiFiveSuite.isUnsaved == "function") return e.HiFiveSuite;
  const n = e.document, a = {};
  let i = [], r = !1;
  const l = (p) => !!p && typeof p.closest == "function", o = (p) => l(p) ? p.closest("[data-hf-guard]") : null, c = (p) => {
    const g = p.target;
    if (!l(g) || !Ca(p.type, p.isTrusted, g.tagName, g.type) || g.closest("[data-hf-no-guard]")) return;
    const k = o(g);
    k && !i.includes(k) && i.push(k);
  }, h = (p) => {
    p && (i = i.filter((g) => g !== p && !p.contains(g)));
  }, u = () => r ? !1 : (i = i.filter((p) => p.isConnected), i.length || Object.values(a).some(Boolean) ? !0 : !!n.querySelector('[data-hf-unsaved="true"]')), f = (p) => {
    if (!u()) return !0;
    const g = e.confirm(p || za);
    if (g) {
      i = [];
      for (const k of Object.keys(a)) a[k] = !1;
      r = !0, e.setTimeout(() => {
        r = !1;
      }, 1500);
    }
    return g;
  };
  n.addEventListener("input", c, !0), n.addEventListener("change", c, !0), n.addEventListener("submit", (p) => {
    Ma(p.target) && h(o(p.target));
  }, !0), e.addEventListener("beforeunload", (p) => {
    u() && (p.preventDefault(), p.returnValue = "");
  }), e.addEventListener("pageshow", () => {
    r = !1;
  });
  const d = { setUnsaved: (p, g) => {
    a[String(p)] = !!g;
  }, saved: h, isUnsaved: u, confirmLeave: f };
  return e.HiFiveSuite = { ...e.HiFiveSuite || {}, ...d }, d;
}
function Ba(e) {
  if (typeof document > "u") return null;
  const n = e == null ? void 0 : e.closest("[data-hf-portal], [data-theme], .dark, [data-skin], [data-style]");
  return n && n !== document.documentElement ? n : document.body;
}
function ge({ open: e, title: n, subtitle: a, onClose: i, children: r, wide: l, guard: o }) {
  const c = ve(), h = Y(null), u = Y(null), [f, d] = z(null), p = Y(i);
  q(() => {
    p.current = i;
  }), q(() => {
    o && ye();
  }, [o]), mt(() => {
    d(e ? Ba(u.current) : null);
  }, [e]), q(() => {
    var m;
    e && f && ((m = h.current) == null || m.focus());
  }, [e, f]), q(() => {
    if (!e) return;
    const m = document.activeElement, y = (A) => {
      A.key === "Escape" && p.current();
    };
    window.addEventListener("keydown", y);
    const b = document.body.style.overflow;
    return document.body.style.overflow = "hidden", () => {
      var A;
      window.removeEventListener("keydown", y), document.body.style.overflow = b, (A = m == null ? void 0 : m.focus) == null || A.call(m);
    };
  }, [e]);
  const g = /* @__PURE__ */ t("span", { ref: u, hidden: !0 });
  return e ? /* @__PURE__ */ s(j, { children: [
    g,
    f ? vn(/* @__PURE__ */ t("div", { className: "hf hf-scrim", onClick: i, children: /* @__PURE__ */ s("div", { className: l ? "hf-sheet hf-sheet--wide" : "hf-sheet", role: "dialog", "aria-modal": "true", "aria-labelledby": c, "data-hf-guard": o ? "" : void 0, onClick: (m) => m.stopPropagation(), children: [
      /* @__PURE__ */ s("div", { className: "hf-sheet__head", children: [
        /* @__PURE__ */ s("div", { children: [
          /* @__PURE__ */ t("h2", { id: c, className: "hf-sheet__title", children: n }),
          a && /* @__PURE__ */ t("p", { className: "hf-sheet__sub", children: a })
        ] }),
        /* @__PURE__ */ t("button", { ref: h, type: "button", className: "hf-sheet__close", onClick: i, "aria-label": "Close", children: /* @__PURE__ */ t(qe, { size: 18 }) })
      ] }),
      r
    ] }) }), f) : null
  ] }) : g;
}
function La(e) {
  const n = e.reduce((a, i) => a + i.weight, 0) || 1;
  return Math.round(e.reduce((a, i) => a + i.score / i.max * i.weight, 0) / n * 100);
}
function $a(e, n) {
  return e >= n.exceeding ? { label: "Exceeding", icon: /* @__PURE__ */ t(Ye, { size: 12 }), tone: "brand" } : e >= n.onTrack ? { label: "On track", icon: /* @__PURE__ */ t(ia, { size: 12 }), tone: "pop" } : { label: "Needs attention", icon: /* @__PURE__ */ t(fn, { size: 12 }), tone: "coral" };
}
function Ta({ history: e }) {
  if (e.length < 2) return null;
  const n = Math.min(...e) - 4, a = Math.max(...e) + 2, i = 120 / (e.length - 1), r = e.map((c, h) => [h * i, 30 - (c - n) / (a - n || 1) * 28]), l = r.map((c, h) => (h ? "L" : "M") + c[0].toFixed(1) + " " + c[1].toFixed(1)).join(" "), o = r[r.length - 1];
  return /* @__PURE__ */ s("svg", { viewBox: "0 0 120 32", role: "img", "aria-label": `Last ${e.length} months: ${e.join(", ")}`, children: [
    /* @__PURE__ */ t("path", { d: `${l} L${o[0]} 32 L0 32 Z`, fill: "rgb(var(--brand-500) / .12)" }),
    /* @__PURE__ */ t("path", { d: l, fill: "none", stroke: "rgb(var(--brand-500))", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ t("circle", { cx: o[0], cy: o[1], r: "3", fill: "rgb(var(--brand-500))" })
  ] });
}
function Fr({ factors: e, bands: n, conductPolicy: a, status: i, history: r = [], improve: l = [], building: o, title: c = "Your HiFive Factor" }) {
  var ne;
  const [h, u] = z(!1), [f, d] = z(0), [p, g] = z(0), k = La(e), m = typeof window < "u" && ((ne = window.matchMedia) == null ? void 0 : ne.call(window, "(prefers-reduced-motion: reduce)").matches), y = typeof document < "u" && document.documentElement.getAttribute("data-tier") === "lite", b = m || y;
  q(() => {
    if (b) {
      d(1), g(k);
      return;
    }
    const M = setTimeout(() => d(1), 100), J = setTimeout(() => {
      let Q = 0;
      const Z = performance.now(), re = (de) => {
        const v = Math.min(1, (de - Z) / 1100);
        g(Math.round(k * (1 - Math.pow(1 - v, 3)))), v < 1 && (Q = requestAnimationFrame(re));
      };
      return Q = requestAnimationFrame(re), () => cancelAnimationFrame(Q);
    }, 650);
    return () => {
      clearTimeout(M), clearTimeout(J);
    };
  }, [k, b]);
  const A = e.reduce((M, J) => M + J.weight, 0) || 1, G = 45, N = 2 * Math.PI * G;
  let $ = 0;
  const C = e.map((M) => {
    const J = M.score / M.max * M.weight / A * N, Q = { ...M, len: J, offset: $ };
    return $ += J, Q;
  }), w = $a(k, n), T = e.find((M) => M.balance), P = T && a ? T.score >= a.warn ? "ok" : T.score >= a.formalWarning ? "watch" : "risk" : "ok", B = `${c} ${k} out of 100: ` + e.map((M) => `${M.label} ${M.score} of ${M.max}`).join(", ") + (i ? `. ${i}` : ""), I = r.length >= 2 ? k - r[0] : null;
  return /* @__PURE__ */ s(j, { children: [
    /* @__PURE__ */ s("button", { type: "button", className: "hf hf-card hf-card--hero hf-factor hf-press", onClick: () => u(!0), "data-tour": "factor", "aria-haspopup": "dialog", children: [
      /* @__PURE__ */ s("div", { className: "hf-factor__head", children: [
        /* @__PURE__ */ s("div", { children: [
          /* @__PURE__ */ s("h3", { className: "hf-display hf-factor__title", children: [
            c,
            " ",
            /* @__PURE__ */ t(fe, { text: `One number, 0 to 100, built from ${e.map((M) => `${M.label.toLowerCase()} (${Math.round(M.weight / A * 100)}%)`).join(", ")}. It is never compared with anyone else. Tap the card for the full breakdown.` })
          ] }),
          /* @__PURE__ */ t("p", { className: "hf-factor__tap", children: "Tap to see how it's built" })
        ] }),
        /* @__PURE__ */ t("span", { className: "hf-factor__chev", "aria-hidden": "true", children: /* @__PURE__ */ t(te, { size: 18 }) })
      ] }),
      /* @__PURE__ */ s("div", { className: "hf-factor__row", children: [
        /* @__PURE__ */ s("div", { className: "hf-ring", children: [
          /* @__PURE__ */ s("svg", { viewBox: "0 0 100 100", role: "img", "aria-label": o ? `${c}: building, first score after your first review` : B, children: [
            /* @__PURE__ */ t("circle", { className: "hf-ring__track", cx: "50", cy: "50", r: G, fill: "none", strokeWidth: "8" }),
            !o && C.map((M, J) => /* @__PURE__ */ t(
              "circle",
              {
                className: K("hf-ring__seg", _e(M.tone)),
                cx: "50",
                cy: "50",
                r: G,
                fill: "none",
                strokeWidth: "8",
                stroke: "var(--hf-tone-bar)",
                style: { transitionDelay: `${J * 120}ms`, strokeDasharray: `${M.len * f} ${N}`, strokeDashoffset: -M.offset }
              },
              M.key
            ))
          ] }),
          o ? /* @__PURE__ */ t("span", { className: "hf-ring__building", children: "Building — first score after your first review" }) : /* @__PURE__ */ t("span", { className: "hf-ring__num hf-num", "aria-hidden": "true", children: p })
        ] }),
        /* @__PURE__ */ s("div", { style: { flex: 1, minWidth: 0 }, children: [
          !o && /* @__PURE__ */ s("span", { className: K("hf-band", _e(w.tone)), children: [
            w.icon,
            " ",
            w.label
          ] }),
          i && /* @__PURE__ */ t("p", { className: "hf-factor__status", children: i }),
          T && a && P !== "ok" && /* @__PURE__ */ s("p", { className: "hf-factor__warn", children: [
            T.score,
            " conduct points left",
            P === "risk" ? " · formal warning stage" : ""
          ] }),
          /* @__PURE__ */ t("div", { className: "hf-legend", children: e.map((M) => /* @__PURE__ */ s("div", { className: _e(M.tone), children: [
            /* @__PURE__ */ t("i", { "aria-hidden": "true" }),
            /* @__PURE__ */ t("span", { children: M.label }),
            /* @__PURE__ */ t("span", { className: "hf-legend__n", children: M.balance ? `${M.score}/${M.max} left` : `${M.score}/${M.max}` })
          ] }, M.key)) })
        ] })
      ] }),
      r.length >= 2 && /* @__PURE__ */ s("div", { className: "hf-spark", children: [
        /* @__PURE__ */ t(Ta, { history: r }),
        /* @__PURE__ */ t("div", { children: I !== null && /* @__PURE__ */ s(j, { children: [
          /* @__PURE__ */ s("b", { children: [
            I >= 0 ? "+" : "",
            I
          ] }),
          " over ",
          r.length,
          " months"
        ] }) })
      ] }),
      /* @__PURE__ */ s("span", { className: "hf-factor__cta", "aria-hidden": "true", children: [
        /* @__PURE__ */ t("span", { children: "See how it's built" }),
        /* @__PURE__ */ t("span", { children: /* @__PURE__ */ t(te, { size: 20 }) })
      ] })
    ] }),
    /* @__PURE__ */ s(ge, { open: h, onClose: () => u(!1), title: c, subtitle: o ? "How it will be built" : `How your ${k} is built`, children: [
      /* @__PURE__ */ t("p", { className: "hf-muted", style: { margin: "0 0 20px", fontSize: 14, lineHeight: 1.6 }, children: "One number that brings together your performance, your conduct and your learning. Only you, your management line, HR and the directors can see it, and it is never compared with anyone else." }),
      /* @__PURE__ */ t("div", { className: "hf-break", children: e.map((M) => {
        const J = Math.round(M.score / M.max * 100), Q = Math.round(M.weight / A * 100), Z = M.balance ? P === "ok" ? "brand" : P === "watch" ? "warn" : "danger" : M.tone;
        return /* @__PURE__ */ s("div", { className: _e(Z), children: [
          /* @__PURE__ */ s("div", { className: "hf-break__head", children: [
            /* @__PURE__ */ s("b", { children: [
              M.label,
              " ",
              /* @__PURE__ */ s("small", { children: [
                "· ",
                Q,
                "% of score"
              ] })
            ] }),
            /* @__PURE__ */ t("b", { className: "hf-num", style: { fontWeight: 600 }, children: M.balance ? `${M.score} of ${M.max} left` : `${M.score}/${M.max}` })
          ] }),
          /* @__PURE__ */ s("div", { className: "hf-break__bar", role: "img", "aria-label": `${M.label}: ${J}%`, children: [
            /* @__PURE__ */ t("i", { style: { width: `${J}%` } }),
            M.balance && a && /* @__PURE__ */ t("span", { className: "hf-break__mark", style: { left: `${Math.round(a.formalWarning / M.max * 100)}%` }, title: `Below ${a.formalWarning} points: formal warning` })
          ] }),
          /* @__PURE__ */ t("p", { className: "hf-break__hint", children: M.hint })
        ] }, M.key);
      }) }),
      i && /* @__PURE__ */ s("div", { className: "hf-note", children: [
        /* @__PURE__ */ t(_t, { size: 14, style: { flex: "none", marginTop: 2 } }),
        /* @__PURE__ */ s("span", { children: [
          i,
          ". Your reporting manager will confirm each checkpoint with you."
        ] })
      ] }),
      l.length > 0 && /* @__PURE__ */ s("div", { className: "hf-improve", children: [
        /* @__PURE__ */ t("h4", { children: "What would move it up" }),
        /* @__PURE__ */ t("ol", { children: l.map((M, J) => /* @__PURE__ */ s("li", { children: [
          /* @__PURE__ */ t("i", { children: J + 1 }),
          /* @__PURE__ */ t("span", { children: M })
        ] }, J)) })
      ] })
    ] })
  ] });
}
function Ie({ tone: e, icon: n, value: a, label: i, pulse: r, hint: l, onClick: o }) {
  return /* @__PURE__ */ s(o ? "button" : "div", { className: K("hf-tile hf-press", _e(e)), onClick: o, type: o ? "button" : void 0, children: [
    /* @__PURE__ */ s("div", { className: "hf-tile__top", children: [
      /* @__PURE__ */ s("span", { className: "hf-tile__ic", children: [
        n,
        r && /* @__PURE__ */ t("span", { className: "hf-tile__pulse", "aria-hidden": "true" })
      ] }),
      l && /* @__PURE__ */ t(fe, { text: l })
    ] }),
    /* @__PURE__ */ s("div", { children: [
      /* @__PURE__ */ t("span", { className: "hf-tile__value hf-num", children: a }),
      /* @__PURE__ */ t("span", { className: "hf-tile__label hf-clamp-2", children: i })
    ] })
  ] });
}
function Ir({ score: e, max: n, policy: a, label: i = "Conduct points left", hint: r, onClick: l }) {
  const o = !a || e >= a.warn ? "ok" : e >= a.formalWarning ? "watch" : "risk", c = o === "ok" ? "brand" : o === "watch" ? "warn" : "danger", h = o === "ok" ? "" : o === "watch" ? " · take care" : " · urgent", u = r ?? `Conduct points are a balance. Everyone starts with ${n}. A recorded issue deducts points; at 0 the contract ends. A clean record restores points over time.${a ? ` Fewer than ${a.formalWarning} means a formal warning.` : ""}`;
  return /* @__PURE__ */ s(
    l ? "button" : "div",
    {
      className: K("hf-tile hf-press", _e(c)),
      onClick: l,
      type: l ? "button" : void 0,
      "aria-label": `${i}: ${e} of ${n}${h}`,
      children: [
        /* @__PURE__ */ s("div", { className: "hf-tile__top", children: [
          /* @__PURE__ */ t("span", { className: "hf-tile__ic", children: /* @__PURE__ */ t(un, { size: 18 }) }),
          /* @__PURE__ */ t(fe, { text: u })
        ] }),
        /* @__PURE__ */ s("div", { children: [
          /* @__PURE__ */ s("span", { className: "hf-tile__value hf-num", children: [
            e,
            /* @__PURE__ */ s("small", { children: [
              " / ",
              n
            ] })
          ] }),
          /* @__PURE__ */ t("span", { className: "hf-pips", "aria-hidden": "true", children: Array.from({ length: n }, (d, p) => /* @__PURE__ */ t("i", { className: p < Math.floor(e) ? "on" : "" }, p)) }),
          /* @__PURE__ */ s("span", { className: "hf-tile__label hf-clamp-2", children: [
            i,
            h
          ] })
        ] })
      ]
    }
  );
}
function Er({ children: e, wrap: n = !0, label: a }) {
  return /* @__PURE__ */ t("div", { className: K("hf-tiles", n && "hf-tiles--wrap"), role: a ? "group" : void 0, "aria-label": a, children: e });
}
const Da = {
  joiner: { icon: /* @__PURE__ */ t(Ve, { size: 20 }), tone: "sky" },
  induction: { icon: /* @__PURE__ */ t(Ye, { size: 20 }), tone: "brand" },
  probation: { icon: /* @__PURE__ */ t(gt, { size: 20 }), tone: "brand" },
  anniversary: { icon: /* @__PURE__ */ t(_n, { size: 20 }), tone: "pop" },
  kudos: { icon: /* @__PURE__ */ t(ra, { size: 20 }), tone: "pop" }
};
function Gt({ item: e, onReact: n }) {
  var o, c;
  if (e.type === "pinned")
    return /* @__PURE__ */ s("article", { className: "hf hf-card hf-pinned", children: [
      /* @__PURE__ */ s("div", { className: "hf-pinned__tag", children: [
        /* @__PURE__ */ t(pn, { size: 12 }),
        " Pinned by HR"
      ] }),
      e.title && /* @__PURE__ */ t("h4", { children: e.title }),
      /* @__PURE__ */ t("p", { children: e.text })
    ] });
  const { icon: a, tone: i } = Da[e.type], r = !!((o = e.mine) != null && o.like), l = !!((c = e.mine) != null && c.clap);
  return /* @__PURE__ */ s("article", { className: K("hf hf-card hf-feedcard", _e(i)), children: [
    /* @__PURE__ */ s("div", { className: "hf-feedcard__row", children: [
      /* @__PURE__ */ t("span", { className: "hf-feedcard__ic", "aria-hidden": "true", children: a }),
      /* @__PURE__ */ s("div", { style: { minWidth: 0 }, children: [
        /* @__PURE__ */ t("p", { className: "hf-feedcard__text", children: e.text }),
        e.from && /* @__PURE__ */ s("p", { className: "hf-feedcard__from", children: [
          "— from the ",
          e.from
        ] }),
        /* @__PURE__ */ t("p", { className: "hf-feedcard__when", children: e.when })
      ] })
    ] }),
    n && /* @__PURE__ */ s("div", { className: "hf-feedcard__acts", children: [
      /* @__PURE__ */ s("button", { type: "button", className: "hf-react", "aria-pressed": r, "aria-label": `Thumbs up, ${e.likes}`, onClick: () => n(e.id, "like"), children: [
        /* @__PURE__ */ t(mn, { size: 14 }),
        " ",
        e.likes
      ] }),
      /* @__PURE__ */ s("button", { type: "button", className: "hf-react", "aria-pressed": l, "aria-label": `Clap, ${e.claps}`, onClick: () => n(e.id, "clap"), children: [
        /* @__PURE__ */ t(Le, { size: 14 }),
        " ",
        e.claps
      ] })
    ] })
  ] });
}
function Ga({ onKudos: e }) {
  return /* @__PURE__ */ s("div", { className: "hf hf-card hf-feed__quiet hf-tone-brand", children: [
    /* @__PURE__ */ t("span", { className: "hf-feedcard__ic", "aria-hidden": "true", children: /* @__PURE__ */ t(An, { size: 20 }) }),
    /* @__PURE__ */ t("p", { className: "hf-display", children: "Nothing new since yesterday" }),
    /* @__PURE__ */ t("p", { className: "hf-muted", children: "A quiet day across HiFive. New joiners, inductions and kudos appear here as they happen." }),
    e && /* @__PURE__ */ t("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: e, children: "Be the first — give kudos" })
  ] });
}
function Ur({ items: e, onReact: n, onKudos: a }) {
  const i = e.filter((l) => l.type === "pinned"), r = e.filter((l) => l.type !== "pinned");
  return /* @__PURE__ */ s("div", { className: "hf-feed", "data-tour": "feed", children: [
    i.map((l) => /* @__PURE__ */ t(Gt, { item: l }, l.id)),
    r.length === 0 ? /* @__PURE__ */ t(Ga, { onKudos: a }) : r.map((l) => /* @__PURE__ */ t(Gt, { item: l, onReact: n }, l.id))
  ] });
}
function Pa(e, n, a = 8) {
  const i = n.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return i.length ? e.filter((r) => {
    const l = r.name.toLowerCase().split(/\s+/);
    return i.every((o) => l.some((c) => c.startsWith(o)));
  }).slice(0, a) : [];
}
function wn(e) {
  const n = e.trim().split(/\s+/).filter(Boolean);
  return n.length ? n[0].endsWith(".") && n[1] ? `${n[0]} ${n[1]}` : n[0] : e;
}
const Pt = {
  "hifive-id": { lucide: "shield-check", nodes: [["path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" }], ["path", { d: "m9 12 2 2 4-4" }]] },
  performance: { lucide: "trending-up", nodes: [["polyline", { points: "22 7 13.5 15.5 8.5 10.5 2 17" }], ["polyline", { points: "16 7 22 7 22 13" }]] },
  todo: { lucide: "square-check", nodes: [["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }], ["path", { d: "m9 12 2 2 4-4" }]] },
  recruitment: { lucide: "user-check", nodes: [["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }], ["circle", { cx: "9", cy: "7", r: "4" }], ["polyline", { points: "16 11 18 13 22 9" }]] },
  lms: { lucide: "book-open", nodes: [["path", { d: "M12 7v14" }], ["path", { d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" }]] },
  apml: { lucide: "phone-call", nodes: [["path", { d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" }], ["path", { d: "M14.05 2a9 9 0 0 1 8 7.94" }], ["path", { d: "M14.05 6A5 5 0 0 1 18 10" }]] },
  transport: { lucide: "route", nodes: [["circle", { cx: "6", cy: "19", r: "3" }], ["path", { d: "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" }], ["circle", { cx: "18", cy: "5", r: "3" }]] },
  inventory: { lucide: "package", nodes: [["path", { d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" }], ["path", { d: "M12 22V12" }], ["path", { d: "m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" }], ["path", { d: "m7.5 4.27 9 5.15" }]] },
  perspectives: { lucide: "compass", nodes: [["path", { d: "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z" }], ["circle", { cx: "12", cy: "12", r: "10" }]] },
  reach: { lucide: "target", nodes: [["circle", { cx: "12", cy: "12", r: "10" }], ["circle", { cx: "12", cy: "12", r: "6" }], ["circle", { cx: "12", cy: "12", r: "2" }]] }
}, Fa = [
  { key: "hifive-id", short: "HiFive ID", full: "HiFive ID", hub: !0 },
  { key: "performance", short: "Performance", full: "Performance Hub", hub: !0 },
  { key: "todo", short: "To-Do", full: "To-Do", hub: !0 },
  { key: "recruitment", short: "Recruitment", full: "Recruitment Portal", hub: !0 },
  { key: "lms", short: "Learning Point", full: "HiFive Learning Point", hub: !0 },
  { key: "apml", short: "APML Tracker", full: "APML Tracker", hub: !0 },
  { key: "transport", short: "Logistics", full: "Accuracy Plus Logistics", hub: !0 },
  { key: "inventory", short: "Inventory", full: "HiFive Inventory", hub: !0 },
  { key: "reach", short: "Reach", full: "HiFive Reach", hub: !0 },
  // BD field visits (Sinu chose option A, 20 Nov 2026)
  { key: "perspectives", short: "Perspectives", full: "Leadership Perspectives", hub: !1 }
], Nn = (e) => Pt[e] ?? Pt["hifive-id"], xn = (e) => Fa.find((n) => n.key === e) ?? null, Mn = "M50,0 C88,0 100,12 100,50 C100,88 88,100 50,100 C12,100 0,88 0,50 C0,12 12,0 50,0 Z", Ge = (e) => String(e).replace(/[&<>"]/g, (n) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[n]);
function Ia(e) {
  return Nn(e).nodes.map(([n, a]) => `<${n} ${Object.entries(a).map(([i, r]) => `${i}="${Ge(r)}"`).join(" ")}/>`).join("");
}
function zn(e = "tile") {
  const n = e === "maskable" ? 42 : 56;
  return { at: (100 - n) / 2, scale: n / 24 };
}
function Or(e, { size: n = 64, shape: a = "tile", tile: i = "var(--primary, #024ea3)", mark: r = "var(--on-primary, #ffffff)", title: l } = {}) {
  var d;
  const { at: o, scale: c } = zn(a), h = n <= 24 ? 2.4 : 2, u = a === "tile" ? `<path d="${Mn}" fill="${Ge(i)}"/>` : `<rect width="100" height="100" fill="${Ge(i)}"/>`, f = l ?? ((d = xn(e)) == null ? void 0 : d.full) ?? "HiFive";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}" viewBox="0 0 100 100" role="img" aria-label="${Ge(f)}">` + u + `<g transform="translate(${o} ${o}) scale(${c})" fill="none" stroke="${Ge(r)}" stroke-width="${h}" stroke-linecap="round" stroke-linejoin="round">${Ia(e)}</g></svg>`;
}
const vt = {
  water: ["#3a86ff", "#012f6b"],
  earth: ["#2fa067", "#123a28"],
  air: ["#11958f", "#063f3e"],
  fire: ["#ea4f2c", "#5e1307"],
  luna: ["#3182bd", "#0f2f45"],
  sol: ["#c78410", "#6b4404"],
  aami: ["#9d4bf0", "#3d066a"],
  aadi: ["#2387aa", "#082833"]
}, Ea = "M100 50L99.9 68.8L99.7 74.8L99.3 79.1L98.8 82.6L98.1 85.4L97.2 87.9L96.2 90L94.9 91.9L93.5 93.5L91.9 94.9L90 96.2L87.9 97.2L85.4 98.1L82.6 98.8L79.1 99.3L74.8 99.7L68.8 99.9L50 100L31.2 99.9L25.2 99.7L20.9 99.3L17.4 98.8L14.6 98.1L12.1 97.2L10 96.2L8.1 94.9L6.5 93.5L5.1 91.9L3.8 90L2.8 87.9L1.9 85.4L1.2 82.6L0.7 79.1L0.3 74.8L0.1 68.8L0 50L0.1 31.2L0.3 25.2L0.7 20.9L1.2 17.4L1.9 14.6L2.8 12.1L3.8 10L5.1 8.1L6.5 6.5L8.1 5.1L10 3.8L12.1 2.8L14.6 1.9L17.4 1.2L20.9 0.7L25.2 0.3L31.2 0.1L50 0L68.8 0.1L74.8 0.3L79.1 0.7L82.6 1.2L85.4 1.9L87.9 2.8L90 3.8L91.9 5.1L93.5 6.5L94.9 8.1L96.2 10L97.2 12.1L98.1 14.6L98.8 17.4L99.3 20.9L99.7 25.2L99.9 31.2Z", Ua = {
  "apml-tracker": {
    small: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8b4fe"/><stop offset="1" stop-color="#7e22ce"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#c9d1de" stroke-width="2.5"/><g><path d="M44 14h34a8 8 0 0 1 8 8v22a8 8 0 0 1-8 8h-6l-10 10V52H44a8 8 0 0 1-8-8V22a8 8 0 0 1 8-8z" fill="url(#b)"/><path d="M56 33h.1 M64 33h.1 M72 33h.1" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round"/><path d="M25 32h16a9 9 0 0 1 9 9v36a9 9 0 0 1 -9 9h-16a9 9 0 0 1 -9 -9v-36a9 9 0 0 1 9 -9z" fill="#fff" fill-opacity="0.88"/><path d="M25 32h16a9 9 0 0 1 9 9v36a9 9 0 0 1 -9 9h-16a9 9 0 0 1 -9 -9v-36a9 9 0 0 1 9 -9z" fill="#d8b4fe" fill-opacity=".14"/><path d="M25 32h16a9 9 0 0 1 9 9v36a9 9 0 0 1 -9 9h-16a9 9 0 0 1 -9 -9v-36a9 9 0 0 1 9 -9z" fill="none" stroke="#c3cbd8" stroke-width="3"/><path d="M28 76h10" fill="none" stroke="url(#s)" stroke-width="4.86" stroke-linecap="round" stroke-linejoin="round"/></g></svg>',
    full: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8b4fe"/><stop offset="1" stop-color="#7e22ce"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient><linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient><clipPath id="c"><path d="M25 32h16a9 9 0 0 1 9 9v36a9 9 0 0 1 -9 9h-16a9 9 0 0 1 -9 -9v-36a9 9 0 0 1 9 -9z"/></clipPath><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5"/></filter></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#dfe5ee" stroke-width="1.2"/><g><path d="M44 14h34a8 8 0 0 1 8 8v22a8 8 0 0 1-8 8h-6l-10 10V52H44a8 8 0 0 1-8-8V22a8 8 0 0 1 8-8z" fill="url(#b)" opacity=".35" filter="url(#f)" transform="translate(0 5)"/><path d="M44 14h34a8 8 0 0 1 8 8v22a8 8 0 0 1-8 8h-6l-10 10V52H44a8 8 0 0 1-8-8V22a8 8 0 0 1 8-8z" fill="url(#b)"/><path d="M56 33h.1 M64 33h.1 M72 33h.1" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round"/><g clip-path="url(#c)"><path d="M44 14h34a8 8 0 0 1 8 8v22a8 8 0 0 1-8 8h-6l-10 10V52H44a8 8 0 0 1-8-8V22a8 8 0 0 1 8-8z" fill="url(#b)" filter="url(#f)"/></g><path d="M25 32h16a9 9 0 0 1 9 9v36a9 9 0 0 1 -9 9h-16a9 9 0 0 1 -9 -9v-36a9 9 0 0 1 9 -9z" fill="#fff" fill-opacity="0.22"/><path d="M25 32h16a9 9 0 0 1 9 9v36a9 9 0 0 1 -9 9h-16a9 9 0 0 1 -9 -9v-36a9 9 0 0 1 9 -9z" fill="#d8b4fe" fill-opacity=".14"/><path d="M25 32h16a9 9 0 0 1 9 9v36a9 9 0 0 1 -9 9h-16a9 9 0 0 1 -9 -9v-36a9 9 0 0 1 9 -9z" fill="url(#h)"/><path d="M25 32h16a9 9 0 0 1 9 9v36a9 9 0 0 1 -9 9h-16a9 9 0 0 1 -9 -9v-36a9 9 0 0 1 9 -9z" fill="none" stroke="#fff" stroke-width="1.3"/><path d="M28 76h10" fill="none" stroke="url(#s)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></g></svg>'
  },
  "hifive-id": {
    small: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#1d4ed8"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#c9d1de" stroke-width="2.5"/><g><path d="M60 14L82 22.5v17.5c0 15.5-10 26-22 31.5c-12-5.5-22-16-22-31.5V22.5z" fill="url(#b)"/><path d="M19 60a21 21 0 1 0 42 0a21 21 0 1 0 -42 0z" fill="#fff" fill-opacity="0.88"/><path d="M19 60a21 21 0 1 0 42 0a21 21 0 1 0 -42 0z" fill="#60a5fa" fill-opacity=".14"/><path d="M19 60a21 21 0 1 0 42 0a21 21 0 1 0 -42 0z" fill="none" stroke="#c3cbd8" stroke-width="3"/><path d="M30.5 60l6.5 6.5l13-14" fill="none" stroke="url(#s)" stroke-width="6.075" stroke-linecap="round" stroke-linejoin="round"/></g></svg>',
    full: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#1d4ed8"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient><linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient><clipPath id="c"><path d="M19 60a21 21 0 1 0 42 0a21 21 0 1 0 -42 0z"/></clipPath><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5"/></filter></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#dfe5ee" stroke-width="1.2"/><g><path d="M60 14L82 22.5v17.5c0 15.5-10 26-22 31.5c-12-5.5-22-16-22-31.5V22.5z" fill="url(#b)" opacity=".35" filter="url(#f)" transform="translate(0 5)"/><path d="M60 14L82 22.5v17.5c0 15.5-10 26-22 31.5c-12-5.5-22-16-22-31.5V22.5z" fill="url(#b)"/><g clip-path="url(#c)"><path d="M60 14L82 22.5v17.5c0 15.5-10 26-22 31.5c-12-5.5-22-16-22-31.5V22.5z" fill="url(#b)" filter="url(#f)"/></g><path d="M19 60a21 21 0 1 0 42 0a21 21 0 1 0 -42 0z" fill="#fff" fill-opacity="0.22"/><path d="M19 60a21 21 0 1 0 42 0a21 21 0 1 0 -42 0z" fill="#60a5fa" fill-opacity=".14"/><path d="M19 60a21 21 0 1 0 42 0a21 21 0 1 0 -42 0z" fill="url(#h)"/><path d="M19 60a21 21 0 1 0 42 0a21 21 0 1 0 -42 0z" fill="none" stroke="#fff" stroke-width="1.3"/><path d="M30.5 60l6.5 6.5l13-14" fill="none" stroke="url(#s)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></g></svg>'
  },
  "hifive-mark": {
    small: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#7c3aed"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#c9d1de" stroke-width="2.5"/><g><path d="M38 38a24 24 0 1 0 48 0a24 24 0 1 0 -48 0z" fill="url(#b)"/><path d="M28 36h28a12 12 0 0 1 12 12v26a12 12 0 0 1 -12 12h-28a12 12 0 0 1 -12 -12v-26a12 12 0 0 1 12 -12z" fill="#fff" fill-opacity="0.88"/><path d="M28 36h28a12 12 0 0 1 12 12v26a12 12 0 0 1 -12 12h-28a12 12 0 0 1 -12 -12v-26a12 12 0 0 1 12 -12z" fill="#60a5fa" fill-opacity=".14"/><path d="M28 36h28a12 12 0 0 1 12 12v26a12 12 0 0 1 -12 12h-28a12 12 0 0 1 -12 -12v-26a12 12 0 0 1 12 -12z" fill="none" stroke="#c3cbd8" stroke-width="3"/><path d="M25.8 49a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0 -8.4 0z M49.8 49a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0 -8.4 0z M37.8 61a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0 -8.4 0z M25.8 73a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0 -8.4 0z M49.8 73a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0 -8.4 0z" fill="url(#s)"/></g></svg>',
    full: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#7c3aed"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient><linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient><clipPath id="c"><path d="M28 36h28a12 12 0 0 1 12 12v26a12 12 0 0 1 -12 12h-28a12 12 0 0 1 -12 -12v-26a12 12 0 0 1 12 -12z"/></clipPath><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5"/></filter></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#dfe5ee" stroke-width="1.2"/><g><path d="M38 38a24 24 0 1 0 48 0a24 24 0 1 0 -48 0z" fill="url(#b)" opacity=".35" filter="url(#f)" transform="translate(0 5)"/><path d="M38 38a24 24 0 1 0 48 0a24 24 0 1 0 -48 0z" fill="url(#b)"/><g clip-path="url(#c)"><path d="M38 38a24 24 0 1 0 48 0a24 24 0 1 0 -48 0z" fill="url(#b)" filter="url(#f)"/></g><path d="M28 36h28a12 12 0 0 1 12 12v26a12 12 0 0 1 -12 12h-28a12 12 0 0 1 -12 -12v-26a12 12 0 0 1 12 -12z" fill="#fff" fill-opacity="0.22"/><path d="M28 36h28a12 12 0 0 1 12 12v26a12 12 0 0 1 -12 12h-28a12 12 0 0 1 -12 -12v-26a12 12 0 0 1 12 -12z" fill="#60a5fa" fill-opacity=".14"/><path d="M28 36h28a12 12 0 0 1 12 12v26a12 12 0 0 1 -12 12h-28a12 12 0 0 1 -12 -12v-26a12 12 0 0 1 12 -12z" fill="url(#h)"/><path d="M28 36h28a12 12 0 0 1 12 12v26a12 12 0 0 1 -12 12h-28a12 12 0 0 1 -12 -12v-26a12 12 0 0 1 12 -12z" fill="none" stroke="#fff" stroke-width="1.3"/><path d="M25.8 49a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0 -8.4 0z M49.8 49a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0 -8.4 0z M37.8 61a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0 -8.4 0z M25.8 73a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0 -8.4 0z M49.8 73a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0 -8.4 0z" fill="url(#s)"/></g></svg>'
  },
  inventory: {
    small: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde047"/><stop offset="1" stop-color="#d97706"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#c9d1de" stroke-width="2.5"/><g><path d="M47 14h28a9 9 0 0 1 9 9v26a9 9 0 0 1 -9 9h-28a9 9 0 0 1 -9 -9v-26a9 9 0 0 1 9 -9z" fill="url(#b)"/><path d="M52 14v14" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/><path d="M26 40h28a10 10 0 0 1 10 10v24a10 10 0 0 1 -10 10h-28a10 10 0 0 1 -10 -10v-24a10 10 0 0 1 10 -10z" fill="#fff" fill-opacity="0.88"/><path d="M26 40h28a10 10 0 0 1 10 10v24a10 10 0 0 1 -10 10h-28a10 10 0 0 1 -10 -10v-24a10 10 0 0 1 10 -10z" fill="#fde047" fill-opacity=".14"/><path d="M26 40h28a10 10 0 0 1 10 10v24a10 10 0 0 1 -10 10h-28a10 10 0 0 1 -10 -10v-24a10 10 0 0 1 10 -10z" fill="none" stroke="#c3cbd8" stroke-width="3"/><path d="M40 52v20 M30 62h20" fill="none" stroke="url(#s)" stroke-width="6.075" stroke-linecap="round" stroke-linejoin="round"/></g></svg>',
    full: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde047"/><stop offset="1" stop-color="#d97706"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient><linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient><clipPath id="c"><path d="M26 40h28a10 10 0 0 1 10 10v24a10 10 0 0 1 -10 10h-28a10 10 0 0 1 -10 -10v-24a10 10 0 0 1 10 -10z"/></clipPath><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5"/></filter></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#dfe5ee" stroke-width="1.2"/><g><path d="M47 14h28a9 9 0 0 1 9 9v26a9 9 0 0 1 -9 9h-28a9 9 0 0 1 -9 -9v-26a9 9 0 0 1 9 -9z" fill="url(#b)" opacity=".35" filter="url(#f)" transform="translate(0 5)"/><path d="M47 14h28a9 9 0 0 1 9 9v26a9 9 0 0 1 -9 9h-28a9 9 0 0 1 -9 -9v-26a9 9 0 0 1 9 -9z" fill="url(#b)"/><path d="M52 14v14" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/><g clip-path="url(#c)"><path d="M47 14h28a9 9 0 0 1 9 9v26a9 9 0 0 1 -9 9h-28a9 9 0 0 1 -9 -9v-26a9 9 0 0 1 9 -9z" fill="url(#b)" filter="url(#f)"/></g><path d="M26 40h28a10 10 0 0 1 10 10v24a10 10 0 0 1 -10 10h-28a10 10 0 0 1 -10 -10v-24a10 10 0 0 1 10 -10z" fill="#fff" fill-opacity="0.22"/><path d="M26 40h28a10 10 0 0 1 10 10v24a10 10 0 0 1 -10 10h-28a10 10 0 0 1 -10 -10v-24a10 10 0 0 1 10 -10z" fill="#fde047" fill-opacity=".14"/><path d="M26 40h28a10 10 0 0 1 10 10v24a10 10 0 0 1 -10 10h-28a10 10 0 0 1 -10 -10v-24a10 10 0 0 1 10 -10z" fill="url(#h)"/><path d="M26 40h28a10 10 0 0 1 10 10v24a10 10 0 0 1 -10 10h-28a10 10 0 0 1 -10 -10v-24a10 10 0 0 1 10 -10z" fill="none" stroke="#fff" stroke-width="1.3"/><path d="M40 52v20 M30 62h20" fill="none" stroke="url(#s)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></g></svg>'
  },
  "learning-point": {
    small: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f9a8d4"/><stop offset="1" stop-color="#db2777"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#c9d1de" stroke-width="2.5"/><g><path d="M47 14h28a7 7 0 0 1 7 7v40a7 7 0 0 1 -7 7h-28a7 7 0 0 1 -7 -7v-40a7 7 0 0 1 7 -7z" fill="url(#b)"/><path d="M50 26h22 M50 34h16" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/><path d="M26 28h28a8 8 0 0 1 8 8v40a8 8 0 0 1 -8 8h-28a8 8 0 0 1 -8 -8v-40a8 8 0 0 1 8 -8z" fill="#fff" fill-opacity="0.88"/><path d="M26 28h28a8 8 0 0 1 8 8v40a8 8 0 0 1 -8 8h-28a8 8 0 0 1 -8 -8v-40a8 8 0 0 1 8 -8z" fill="#f9a8d4" fill-opacity=".14"/><path d="M26 28h28a8 8 0 0 1 8 8v40a8 8 0 0 1 -8 8h-28a8 8 0 0 1 -8 -8v-40a8 8 0 0 1 8 -8z" fill="none" stroke="#c3cbd8" stroke-width="3"/><path d="M40 45L42.7 52.28L50.46 52.6L44.37 57.42L46.47 64.9L40 60.6L33.53 64.9L35.63 57.42L29.54 52.6L37.3 52.28Z" fill="url(#s)"/></g></svg>',
    full: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f9a8d4"/><stop offset="1" stop-color="#db2777"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient><linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient><clipPath id="c"><path d="M26 28h28a8 8 0 0 1 8 8v40a8 8 0 0 1 -8 8h-28a8 8 0 0 1 -8 -8v-40a8 8 0 0 1 8 -8z"/></clipPath><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5"/></filter></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#dfe5ee" stroke-width="1.2"/><g><path d="M47 14h28a7 7 0 0 1 7 7v40a7 7 0 0 1 -7 7h-28a7 7 0 0 1 -7 -7v-40a7 7 0 0 1 7 -7z" fill="url(#b)" opacity=".35" filter="url(#f)" transform="translate(0 5)"/><path d="M47 14h28a7 7 0 0 1 7 7v40a7 7 0 0 1 -7 7h-28a7 7 0 0 1 -7 -7v-40a7 7 0 0 1 7 -7z" fill="url(#b)"/><path d="M50 26h22 M50 34h16" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/><g clip-path="url(#c)"><path d="M47 14h28a7 7 0 0 1 7 7v40a7 7 0 0 1 -7 7h-28a7 7 0 0 1 -7 -7v-40a7 7 0 0 1 7 -7z" fill="url(#b)" filter="url(#f)"/></g><path d="M26 28h28a8 8 0 0 1 8 8v40a8 8 0 0 1 -8 8h-28a8 8 0 0 1 -8 -8v-40a8 8 0 0 1 8 -8z" fill="#fff" fill-opacity="0.22"/><path d="M26 28h28a8 8 0 0 1 8 8v40a8 8 0 0 1 -8 8h-28a8 8 0 0 1 -8 -8v-40a8 8 0 0 1 8 -8z" fill="#f9a8d4" fill-opacity=".14"/><path d="M26 28h28a8 8 0 0 1 8 8v40a8 8 0 0 1 -8 8h-28a8 8 0 0 1 -8 -8v-40a8 8 0 0 1 8 -8z" fill="url(#h)"/><path d="M26 28h28a8 8 0 0 1 8 8v40a8 8 0 0 1 -8 8h-28a8 8 0 0 1 -8 -8v-40a8 8 0 0 1 8 -8z" fill="none" stroke="#fff" stroke-width="1.3"/><path d="M40 45L42.7 52.28L50.46 52.6L44.37 57.42L46.47 64.9L40 60.6L33.53 64.9L35.63 57.42L29.54 52.6L37.3 52.28Z" fill="url(#s)"/></g></svg>'
  },
  logistics: {
    small: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#67e8f9"/><stop offset="1" stop-color="#0e7490"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#c9d1de" stroke-width="2.5"/><g><path d="M60 12a19 19 0 0 1 19 19c0 14.5-19 33-19 33S41 45.5 41 31a19 19 0 0 1 19-19z" fill="url(#b)"/><path d="M53.5 31a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0z" fill="#fff"/><path d="M24 50h36a10 10 0 0 1 10 10v12a10 10 0 0 1 -10 10h-36a10 10 0 0 1 -10 -10v-12a10 10 0 0 1 10 -10z" fill="#fff" fill-opacity="0.88"/><path d="M24 50h36a10 10 0 0 1 10 10v12a10 10 0 0 1 -10 10h-36a10 10 0 0 1 -10 -10v-12a10 10 0 0 1 10 -10z" fill="#67e8f9" fill-opacity=".14"/><path d="M24 50h36a10 10 0 0 1 10 10v12a10 10 0 0 1 -10 10h-36a10 10 0 0 1 -10 -10v-12a10 10 0 0 1 10 -10z" fill="none" stroke="#c3cbd8" stroke-width="3"/><path d="M21.5 70a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0z M55.5 62a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0z" fill="url(#s)"/><path d="M28.5 70c8 0 10-9 15-9s9 1 12 1" fill="none" stroke="url(#s)" stroke-width="4.050000000000001" stroke-linecap="round" stroke-linejoin="round"/></g></svg>',
    full: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#67e8f9"/><stop offset="1" stop-color="#0e7490"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient><linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient><clipPath id="c"><path d="M24 50h36a10 10 0 0 1 10 10v12a10 10 0 0 1 -10 10h-36a10 10 0 0 1 -10 -10v-12a10 10 0 0 1 10 -10z"/></clipPath><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5"/></filter></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#dfe5ee" stroke-width="1.2"/><g><path d="M60 12a19 19 0 0 1 19 19c0 14.5-19 33-19 33S41 45.5 41 31a19 19 0 0 1 19-19z" fill="url(#b)" opacity=".35" filter="url(#f)" transform="translate(0 5)"/><path d="M60 12a19 19 0 0 1 19 19c0 14.5-19 33-19 33S41 45.5 41 31a19 19 0 0 1 19-19z" fill="url(#b)"/><path d="M53.5 31a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0z" fill="#fff"/><g clip-path="url(#c)"><path d="M60 12a19 19 0 0 1 19 19c0 14.5-19 33-19 33S41 45.5 41 31a19 19 0 0 1 19-19z" fill="url(#b)" filter="url(#f)"/></g><path d="M24 50h36a10 10 0 0 1 10 10v12a10 10 0 0 1 -10 10h-36a10 10 0 0 1 -10 -10v-12a10 10 0 0 1 10 -10z" fill="#fff" fill-opacity="0.22"/><path d="M24 50h36a10 10 0 0 1 10 10v12a10 10 0 0 1 -10 10h-36a10 10 0 0 1 -10 -10v-12a10 10 0 0 1 10 -10z" fill="#67e8f9" fill-opacity=".14"/><path d="M24 50h36a10 10 0 0 1 10 10v12a10 10 0 0 1 -10 10h-36a10 10 0 0 1 -10 -10v-12a10 10 0 0 1 10 -10z" fill="url(#h)"/><path d="M24 50h36a10 10 0 0 1 10 10v12a10 10 0 0 1 -10 10h-36a10 10 0 0 1 -10 -10v-12a10 10 0 0 1 10 -10z" fill="none" stroke="#fff" stroke-width="1.3"/><path d="M21.5 70a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0z M55.5 62a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0z" fill="url(#s)"/><path d="M28.5 70c8 0 10-9 15-9s9 1 12 1" fill="none" stroke="url(#s)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0.5 5.5"/></g></svg>'
  },
  performance: {
    small: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#86efac"/><stop offset="1" stop-color="#15a34a"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#c9d1de" stroke-width="2.5"/><g><path d="M40 38a22 22 0 1 0 44 0a22 22 0 1 0 -44 0z" fill="url(#b)"/><path d="M25 46h34a9 9 0 0 1 9 9v18a9 9 0 0 1 -9 9h-34a9 9 0 0 1 -9 -9v-18a9 9 0 0 1 9 -9z" fill="#fff" fill-opacity="0.88"/><path d="M25 46h34a9 9 0 0 1 9 9v18a9 9 0 0 1 -9 9h-34a9 9 0 0 1 -9 -9v-18a9 9 0 0 1 9 -9z" fill="#86efac" fill-opacity=".14"/><path d="M25 46h34a9 9 0 0 1 9 9v18a9 9 0 0 1 -9 9h-34a9 9 0 0 1 -9 -9v-18a9 9 0 0 1 9 -9z" fill="none" stroke="#c3cbd8" stroke-width="3"/><path d="M26 72l10-9l8 6l15-13 M53 56h6v6" fill="none" stroke="url(#s)" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round"/></g></svg>',
    full: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#86efac"/><stop offset="1" stop-color="#15a34a"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient><linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient><clipPath id="c"><path d="M25 46h34a9 9 0 0 1 9 9v18a9 9 0 0 1 -9 9h-34a9 9 0 0 1 -9 -9v-18a9 9 0 0 1 9 -9z"/></clipPath><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5"/></filter></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#dfe5ee" stroke-width="1.2"/><g><path d="M40 38a22 22 0 1 0 44 0a22 22 0 1 0 -44 0z" fill="url(#b)" opacity=".35" filter="url(#f)" transform="translate(0 5)"/><path d="M40 38a22 22 0 1 0 44 0a22 22 0 1 0 -44 0z" fill="url(#b)"/><g clip-path="url(#c)"><path d="M40 38a22 22 0 1 0 44 0a22 22 0 1 0 -44 0z" fill="url(#b)" filter="url(#f)"/></g><path d="M25 46h34a9 9 0 0 1 9 9v18a9 9 0 0 1 -9 9h-34a9 9 0 0 1 -9 -9v-18a9 9 0 0 1 9 -9z" fill="#fff" fill-opacity="0.22"/><path d="M25 46h34a9 9 0 0 1 9 9v18a9 9 0 0 1 -9 9h-34a9 9 0 0 1 -9 -9v-18a9 9 0 0 1 9 -9z" fill="#86efac" fill-opacity=".14"/><path d="M25 46h34a9 9 0 0 1 9 9v18a9 9 0 0 1 -9 9h-34a9 9 0 0 1 -9 -9v-18a9 9 0 0 1 9 -9z" fill="url(#h)"/><path d="M25 46h34a9 9 0 0 1 9 9v18a9 9 0 0 1 -9 9h-34a9 9 0 0 1 -9 -9v-18a9 9 0 0 1 9 -9z" fill="none" stroke="#fff" stroke-width="1.3"/><path d="M26 72l10-9l8 6l15-13 M53 56h6v6" fill="none" stroke="url(#s)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g></svg>'
  },
  perspectives: {
    small: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#f59e0b"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#c9d1de" stroke-width="2.5"/><g><path d="M43 36a19 19 0 1 0 38 0a19 19 0 1 0 -38 0z" fill="url(#b)"/><path d="M30 80h38a13 13 0 0 0 1-26a19 19 0 0 0-36-3.5A14.5 14.5 0 0 0 30 80z" fill="#fff" fill-opacity="0.88"/><path d="M30 80h38a13 13 0 0 0 1-26a19 19 0 0 0-36-3.5A14.5 14.5 0 0 0 30 80z" fill="#fde68a" fill-opacity=".14"/><path d="M30 80h38a13 13 0 0 0 1-26a19 19 0 0 0-36-3.5A14.5 14.5 0 0 0 30 80z" fill="none" stroke="#c3cbd8" stroke-width="3"/><path d="M35.6 68a3.4 3.4 0 1 0 6.8 0a3.4 3.4 0 1 0 -6.8 0z M45.6 68a3.4 3.4 0 1 0 6.8 0a3.4 3.4 0 1 0 -6.8 0z M55.6 68a3.4 3.4 0 1 0 6.8 0a3.4 3.4 0 1 0 -6.8 0z" fill="url(#s)"/></g></svg>',
    full: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#f59e0b"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient><linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient><clipPath id="c"><path d="M30 80h38a13 13 0 0 0 1-26a19 19 0 0 0-36-3.5A14.5 14.5 0 0 0 30 80z"/></clipPath><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5"/></filter></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#dfe5ee" stroke-width="1.2"/><g><path d="M43 36a19 19 0 1 0 38 0a19 19 0 1 0 -38 0z" fill="url(#b)" opacity=".35" filter="url(#f)" transform="translate(0 5)"/><path d="M43 36a19 19 0 1 0 38 0a19 19 0 1 0 -38 0z" fill="url(#b)"/><g clip-path="url(#c)"><path d="M43 36a19 19 0 1 0 38 0a19 19 0 1 0 -38 0z" fill="url(#b)" filter="url(#f)"/></g><path d="M30 80h38a13 13 0 0 0 1-26a19 19 0 0 0-36-3.5A14.5 14.5 0 0 0 30 80z" fill="#fff" fill-opacity="0.22"/><path d="M30 80h38a13 13 0 0 0 1-26a19 19 0 0 0-36-3.5A14.5 14.5 0 0 0 30 80z" fill="#fde68a" fill-opacity=".14"/><path d="M30 80h38a13 13 0 0 0 1-26a19 19 0 0 0-36-3.5A14.5 14.5 0 0 0 30 80z" fill="url(#h)"/><path d="M30 80h38a13 13 0 0 0 1-26a19 19 0 0 0-36-3.5A14.5 14.5 0 0 0 30 80z" fill="none" stroke="#fff" stroke-width="1.3"/><path d="M35.6 68a3.4 3.4 0 1 0 6.8 0a3.4 3.4 0 1 0 -6.8 0z M45.6 68a3.4 3.4 0 1 0 6.8 0a3.4 3.4 0 1 0 -6.8 0z M55.6 68a3.4 3.4 0 1 0 6.8 0a3.4 3.4 0 1 0 -6.8 0z" fill="url(#s)"/></g></svg>'
  },
  reach: {
    small: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fca5a5"/><stop offset="1" stop-color="#dc2626"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#c9d1de" stroke-width="2.5"/><g><path d="M60 11a21 21 0 1 0 0.01 0z" fill="url(#b)"/><circle cx="60" cy="32" r="13.5" fill="none" stroke="#fff" stroke-width="4"/><circle cx="60" cy="32" r="6" fill="#fff"/><path d="M24 50h36a10 10 0 0 1 10 10v12a10 10 0 0 1 -10 10h-36a10 10 0 0 1 -10 -10v-12a10 10 0 0 1 10 -10z" fill="#fff" fill-opacity="0.88"/><path d="M24 50h36a10 10 0 0 1 10 10v12a10 10 0 0 1 -10 10h-36a10 10 0 0 1 -10 -10v-12a10 10 0 0 1 10 -10z" fill="#fca5a5" fill-opacity=".14"/><path d="M24 50h36a10 10 0 0 1 10 10v12a10 10 0 0 1 -10 10h-36a10 10 0 0 1 -10 -10v-12a10 10 0 0 1 10 -10z" fill="none" stroke="#c3cbd8" stroke-width="3"/><path d="M42 54a9 9 0 0 1 9 9c0 6.5-9 14-9 14s-9-7.5-9-14a9 9 0 0 1 9-9z" fill="url(#s)"/><circle cx="42" cy="63" r="3.3" fill="#fff"/></g></svg>',
    full: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fca5a5"/><stop offset="1" stop-color="#dc2626"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient><linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient><clipPath id="c"><path d="M24 50h36a10 10 0 0 1 10 10v12a10 10 0 0 1 -10 10h-36a10 10 0 0 1 -10 -10v-12a10 10 0 0 1 10 -10z"/></clipPath><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5"/></filter></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#dfe5ee" stroke-width="1.2"/><g><path d="M60 11a21 21 0 1 0 0.01 0z" fill="url(#b)" opacity=".35" filter="url(#f)" transform="translate(0 5)"/><path d="M60 11a21 21 0 1 0 0.01 0z" fill="url(#b)"/><circle cx="60" cy="32" r="13.5" fill="none" stroke="#fff" stroke-width="3.2"/><circle cx="60" cy="32" r="5.5" fill="#fff"/><g clip-path="url(#c)"><path d="M60 11a21 21 0 1 0 0.01 0z" fill="url(#b)" filter="url(#f)"/></g><path d="M24 50h36a10 10 0 0 1 10 10v12a10 10 0 0 1 -10 10h-36a10 10 0 0 1 -10 -10v-12a10 10 0 0 1 10 -10z" fill="#fff" fill-opacity="0.22"/><path d="M24 50h36a10 10 0 0 1 10 10v12a10 10 0 0 1 -10 10h-36a10 10 0 0 1 -10 -10v-12a10 10 0 0 1 10 -10z" fill="#fca5a5" fill-opacity=".14"/><path d="M24 50h36a10 10 0 0 1 10 10v12a10 10 0 0 1 -10 10h-36a10 10 0 0 1 -10 -10v-12a10 10 0 0 1 10 -10z" fill="url(#h)"/><path d="M24 50h36a10 10 0 0 1 10 10v12a10 10 0 0 1 -10 10h-36a10 10 0 0 1 -10 -10v-12a10 10 0 0 1 10 -10z" fill="none" stroke="#fff" stroke-width="1.3"/><path d="M42 55a8 8 0 0 1 8 8c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 8-8z" fill="url(#s)"/><circle cx="42" cy="63" r="3" fill="#fff"/></g></svg>'
  },
  recruitment: {
    small: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c4b5fd"/><stop offset="1" stop-color="#6d28d9"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#c9d1de" stroke-width="2.5"/><g><path d="M25.5 31a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0z M15 80c0-14.5 10.5-25 23-25s23 10.5 23 25z" fill="url(#b)"/><path d="M53 38h24a9 9 0 0 1 9 9v16a9 9 0 0 1 -9 9h-24a9 9 0 0 1 -9 -9v-16a9 9 0 0 1 9 -9z" fill="#fff" fill-opacity="0.88"/><path d="M53 38h24a9 9 0 0 1 9 9v16a9 9 0 0 1 -9 9h-24a9 9 0 0 1 -9 -9v-16a9 9 0 0 1 9 -9z" fill="#c4b5fd" fill-opacity=".14"/><path d="M53 38h24a9 9 0 0 1 9 9v16a9 9 0 0 1 -9 9h-24a9 9 0 0 1 -9 -9v-16a9 9 0 0 1 9 -9z" fill="none" stroke="#c3cbd8" stroke-width="3"/><path d="M53 49h24 M53 56h17 M53 63h10" fill="none" stroke="url(#s)" stroke-width="4.86" stroke-linecap="round" stroke-linejoin="round"/></g></svg>',
    full: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c4b5fd"/><stop offset="1" stop-color="#6d28d9"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient><linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient><clipPath id="c"><path d="M53 38h24a9 9 0 0 1 9 9v16a9 9 0 0 1 -9 9h-24a9 9 0 0 1 -9 -9v-16a9 9 0 0 1 9 -9z"/></clipPath><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5"/></filter></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#dfe5ee" stroke-width="1.2"/><g><path d="M25.5 31a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0z M15 80c0-14.5 10.5-25 23-25s23 10.5 23 25z" fill="url(#b)" opacity=".35" filter="url(#f)" transform="translate(0 5)"/><path d="M25.5 31a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0z M15 80c0-14.5 10.5-25 23-25s23 10.5 23 25z" fill="url(#b)"/><g clip-path="url(#c)"><path d="M25.5 31a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0z M15 80c0-14.5 10.5-25 23-25s23 10.5 23 25z" fill="url(#b)" filter="url(#f)"/></g><path d="M53 38h24a9 9 0 0 1 9 9v16a9 9 0 0 1 -9 9h-24a9 9 0 0 1 -9 -9v-16a9 9 0 0 1 9 -9z" fill="#fff" fill-opacity="0.22"/><path d="M53 38h24a9 9 0 0 1 9 9v16a9 9 0 0 1 -9 9h-24a9 9 0 0 1 -9 -9v-16a9 9 0 0 1 9 -9z" fill="#c4b5fd" fill-opacity=".14"/><path d="M53 38h24a9 9 0 0 1 9 9v16a9 9 0 0 1 -9 9h-24a9 9 0 0 1 -9 -9v-16a9 9 0 0 1 9 -9z" fill="url(#h)"/><path d="M53 38h24a9 9 0 0 1 9 9v16a9 9 0 0 1 -9 9h-24a9 9 0 0 1 -9 -9v-16a9 9 0 0 1 9 -9z" fill="none" stroke="#fff" stroke-width="1.3"/><path d="M53 49h24 M53 56h17 M53 63h10" fill="none" stroke="url(#s)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></g></svg>'
  },
  todo: {
    small: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fdba74"/><stop offset="1" stop-color="#ea580c"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#c9d1de" stroke-width="2.5"/><g><path d="M53 14h20a11 11 0 0 1 11 11v20a11 11 0 0 1 -11 11h-20a11 11 0 0 1 -11 -11v-20a11 11 0 0 1 11 -11z" fill="url(#b)"/><path d="M28 30h26a10 10 0 0 1 10 10v34a10 10 0 0 1 -10 10h-26a10 10 0 0 1 -10 -10v-34a10 10 0 0 1 10 -10z" fill="#fff" fill-opacity="0.88"/><path d="M28 30h26a10 10 0 0 1 10 10v34a10 10 0 0 1 -10 10h-26a10 10 0 0 1 -10 -10v-34a10 10 0 0 1 10 -10z" fill="#fdba74" fill-opacity=".14"/><path d="M28 30h26a10 10 0 0 1 10 10v34a10 10 0 0 1 -10 10h-26a10 10 0 0 1 -10 -10v-34a10 10 0 0 1 10 -10z" fill="none" stroke="#c3cbd8" stroke-width="3"/><path d="M28 60l7.5 7.5l16-17 M28 44h22" fill="none" stroke="url(#s)" stroke-width="6.075" stroke-linecap="round" stroke-linejoin="round"/></g></svg>',
    full: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fdba74"/><stop offset="1" stop-color="#ea580c"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient><linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient><clipPath id="c"><path d="M28 30h26a10 10 0 0 1 10 10v34a10 10 0 0 1 -10 10h-26a10 10 0 0 1 -10 -10v-34a10 10 0 0 1 10 -10z"/></clipPath><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5"/></filter></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#dfe5ee" stroke-width="1.2"/><g><path d="M53 14h20a11 11 0 0 1 11 11v20a11 11 0 0 1 -11 11h-20a11 11 0 0 1 -11 -11v-20a11 11 0 0 1 11 -11z" fill="url(#b)" opacity=".35" filter="url(#f)" transform="translate(0 5)"/><path d="M53 14h20a11 11 0 0 1 11 11v20a11 11 0 0 1 -11 11h-20a11 11 0 0 1 -11 -11v-20a11 11 0 0 1 11 -11z" fill="url(#b)"/><g clip-path="url(#c)"><path d="M53 14h20a11 11 0 0 1 11 11v20a11 11 0 0 1 -11 11h-20a11 11 0 0 1 -11 -11v-20a11 11 0 0 1 11 -11z" fill="url(#b)" filter="url(#f)"/></g><path d="M28 30h26a10 10 0 0 1 10 10v34a10 10 0 0 1 -10 10h-26a10 10 0 0 1 -10 -10v-34a10 10 0 0 1 10 -10z" fill="#fff" fill-opacity="0.22"/><path d="M28 30h26a10 10 0 0 1 10 10v34a10 10 0 0 1 -10 10h-26a10 10 0 0 1 -10 -10v-34a10 10 0 0 1 10 -10z" fill="#fdba74" fill-opacity=".14"/><path d="M28 30h26a10 10 0 0 1 10 10v34a10 10 0 0 1 -10 10h-26a10 10 0 0 1 -10 -10v-34a10 10 0 0 1 10 -10z" fill="url(#h)"/><path d="M28 30h26a10 10 0 0 1 10 10v34a10 10 0 0 1 -10 10h-26a10 10 0 0 1 -10 -10v-34a10 10 0 0 1 10 -10z" fill="none" stroke="#fff" stroke-width="1.3"/><path d="M28 60l7.5 7.5l16-17 M28 44h22" fill="none" stroke="url(#s)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></g></svg>'
  }
}, Oa = {
  "hifive-id": "hifive-id",
  performance: "performance",
  todo: "todo",
  recruitment: "recruitment",
  lms: "learning-point",
  apml: "apml-tracker",
  transport: "logistics",
  inventory: "inventory",
  perspectives: "perspectives",
  reach: "reach",
  hifive: "hifive-mark",
  // kit names and old aliases also resolve
  "learning-point": "learning-point",
  learning: "learning-point",
  "apml-tracker": "apml-tracker",
  logistics: "logistics",
  "hifive-reach": "reach",
  "hifive-mark": "hifive-mark",
  admin: "hifive-id",
  "hifive id": "hifive-id"
}, Wr = Object.keys(vt), Sn = 32;
function Cn(e) {
  return Oa[String(e ?? "").trim().toLowerCase()] ?? null;
}
function Bn(e) {
  const n = String(e ?? "").trim().toLowerCase();
  return vt[n] ? n : "water";
}
function Wa(e, n = {}) {
  const a = Cn(e);
  if (!a) return null;
  const i = Ua[a], [r, l] = vt[Bn(n.theme)];
  return ((n.size ?? 48) < Sn ? i.small : i.full).split("__T__").join(Ea).replace("__A__", r).replace("__B__", l);
}
const Ft = /* @__PURE__ */ new Map();
function ja(e, n = {}) {
  const a = Cn(e);
  if (!a) return null;
  const i = `${a}|${(n.size ?? 48) < Sn ? "s" : "f"}|${Bn(n.theme)}`;
  let r = Ft.get(i);
  return r === void 0 && (r = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(Wa(e, n)), Ft.set(i, r)), r;
}
const Ha = "{app} is slow right now. We're on it.";
function $e(e, n = Ha) {
  const a = String(e ?? "").trim() || "This app";
  return n.replace("{app}", a);
}
const Ra = () => typeof document > "u" ? null : document.documentElement.getAttribute("data-skin"), qa = (e) => {
  if (typeof MutationObserver > "u" || typeof document > "u") return () => {
  };
  const n = new MutationObserver(e);
  return n.observe(document.documentElement, { attributes: !0, attributeFilter: ["data-skin"] }), () => n.disconnect();
};
function Ya() {
  return ta(qa, Ra, () => null);
}
function Je({ app: e, size: n = 48, label: a, className: i }) {
  const r = Ya(), l = ja(e, { size: n, theme: r }), o = i ? `hf-applogo ${i}` : "hf-applogo";
  if (l)
    return /* @__PURE__ */ t(
      "img",
      {
        className: o,
        src: l,
        width: n,
        height: n,
        alt: a ?? "",
        "aria-hidden": a ? void 0 : !0,
        draggable: !1,
        decoding: "async"
      }
    );
  const { at: c, scale: h } = zn("tile"), u = n <= 24 ? 2.4 : 2;
  return /* @__PURE__ */ s(
    "svg",
    {
      className: o,
      width: n,
      height: n,
      viewBox: "0 0 100 100",
      role: a ? "img" : void 0,
      "aria-label": a,
      "aria-hidden": a ? void 0 : !0,
      focusable: "false",
      children: [
        /* @__PURE__ */ t("path", { d: Mn, fill: "var(--primary)" }),
        /* @__PURE__ */ t("g", { transform: `translate(${c} ${c}) scale(${h})`, fill: "none", stroke: "var(--on-primary)", strokeWidth: u, strokeLinecap: "round", strokeLinejoin: "round", children: Nn(e).nodes.map(([f, d], p) => ea(f, { key: p, ...d })) })
      ]
    }
  );
}
function Qe() {
  return /* @__PURE__ */ t("span", { className: "hf-attn", "aria-hidden": "true" });
}
function jr({ app: e, size: n = 52, name: a, attention: i }) {
  var l;
  const r = a ?? ((l = xn(e)) == null ? void 0 : l.short) ?? e;
  return /* @__PURE__ */ s("span", { className: "hf-applogo-tile", title: i ? $e(r) : void 0, children: [
    /* @__PURE__ */ s("span", { className: "hf-attn-host", children: [
      /* @__PURE__ */ t(Je, { app: e, size: n }),
      i && /* @__PURE__ */ t(Qe, {})
    ] }),
    /* @__PURE__ */ t("span", { className: "hf-applogo-tile__name", children: r }),
    i && /* @__PURE__ */ t("span", { className: "hf-sr", children: $e(r) })
  ] });
}
const Va = { learning: "lms", logistics: "transport", admin: "hifive-id", "hifive id": "hifive-id" };
function Pe({ app: e, size: n = 40, label: a }) {
  const i = String(e ?? "").trim().toLowerCase();
  return /* @__PURE__ */ t(Je, { app: Va[i] ?? i, size: n, label: a });
}
const It = ["brand", "sky", "pop", "ink"];
function oe({ name: e, size: n = 32, ring: a, photo: i }) {
  const l = e.trim().split(/\s+/).slice(0, a || n < 32 ? 1 : 2).map((c) => c[0]).join("").toUpperCase(), o = It[[...e].reduce((c, h) => c + h.charCodeAt(0), 0) % It.length];
  return /* @__PURE__ */ t("span", { className: `hf-av hf-av--${o}${a ? " hf-av--ring" : ""}`, style: { width: n, height: n, fontSize: Math.round(n * 0.38) }, "aria-hidden": "true", children: i ? /* @__PURE__ */ t("img", { src: i, alt: "" }) : l });
}
function Hr({ onClick: e }) {
  return /* @__PURE__ */ s("button", { type: "button", className: "hf hf-card hf-kudos-btn hf-press", onClick: e, "aria-haspopup": "dialog", children: [
    /* @__PURE__ */ t("span", { className: "hf-kudos-btn__ic", "aria-hidden": "true", children: /* @__PURE__ */ t(Le, { size: 16 }) }),
    "Give kudos to a colleague",
    /* @__PURE__ */ t(te, { size: 16 })
  ] });
}
function Rr({ open: e, onClose: n, people: a, onSend: i }) {
  const [r, l] = z(""), [o, c] = z(""), h = ke(() => Pa(a, o), [a, o]), u = a.find((b) => b.id === r) ?? null, [f, d] = z(""), [p, g] = z({}), [k, m] = z(!1);
  async function y() {
    const b = {};
    r || (b.to = "Choose who the kudos is for");
    const A = f.trim();
    if (A.length < 4 && (b.msg = "Add a few words about what they did"), A.length > 280 && (b.msg = "Keep it under 280 characters"), g(b), b.to || b.msg) return;
    const G = a.find((N) => N.id === r);
    m(!0);
    try {
      await i(G, A), l(""), c(""), d(""), n();
    } catch (N) {
      g({ msg: N instanceof Error && N.message ? N.message : "That didn't send. Try again, or tell HR." });
    } finally {
      m(!1);
    }
  }
  return /* @__PURE__ */ s(ge, { open: e, onClose: n, title: "Give kudos", guard: !0, children: [
    /* @__PURE__ */ s("div", { className: `hf-field${p.to ? " hf-field--error" : ""}`, children: [
      /* @__PURE__ */ t("label", { htmlFor: "hf-kudos-who", children: /* @__PURE__ */ t("span", { children: "Who" }) }),
      u ? /* @__PURE__ */ s("div", { className: "hf-who", children: [
        /* @__PURE__ */ t(oe, { name: u.name, size: 32 }),
        /* @__PURE__ */ s("span", { className: "hf-who__txt", children: [
          /* @__PURE__ */ t("b", { children: u.name }),
          u.detail && /* @__PURE__ */ t("span", { children: u.detail })
        ] }),
        /* @__PURE__ */ t("button", { type: "button", className: "hf-who__x", "aria-label": `Change from ${u.name}`, onClick: () => {
          l(""), c("");
        }, children: /* @__PURE__ */ t(qe, { size: 16 }) })
      ] }) : /* @__PURE__ */ s(j, { children: [
        /* @__PURE__ */ s("div", { className: "hf-who__search", children: [
          /* @__PURE__ */ t(At, { size: 16, "aria-hidden": "true" }),
          /* @__PURE__ */ t(
            "input",
            {
              id: "hf-kudos-who",
              type: "search",
              value: o,
              autoComplete: "off",
              placeholder: a.length ? "Type a name" : "Loading colleagues…",
              onChange: (b) => c(b.target.value),
              "aria-invalid": !!p.to,
              "aria-controls": "hf-kudos-matches",
              disabled: !a.length
            }
          )
        ] }),
        o.trim() && /* @__PURE__ */ s("ul", { id: "hf-kudos-matches", className: "hf-who__list", "aria-label": "Matching colleagues", children: [
          h.map((b) => /* @__PURE__ */ t("li", { children: /* @__PURE__ */ s("button", { type: "button", className: "hf-who__opt", onClick: () => {
            l(b.id), g((A) => ({ ...A, to: void 0 }));
          }, children: [
            /* @__PURE__ */ t(oe, { name: b.name, size: 28 }),
            /* @__PURE__ */ s("span", { className: "hf-who__txt", children: [
              /* @__PURE__ */ t("b", { children: b.name }),
              b.detail && /* @__PURE__ */ t("span", { children: b.detail })
            ] })
          ] }) }, b.id)),
          !h.length && /* @__PURE__ */ t("li", { className: "hf-who__none", children: "Nobody by that name. Check the spelling, or try their first name." })
        ] })
      ] }),
      p.to && /* @__PURE__ */ t("p", { className: "hf-field__err", role: "alert", children: p.to })
    ] }),
    /* @__PURE__ */ s("label", { className: `hf-field${p.msg ? " hf-field--error" : ""}`, children: [
      /* @__PURE__ */ t("span", { children: "What did they do?" }),
      /* @__PURE__ */ t(
        "textarea",
        {
          value: f,
          onChange: (b) => d(b.target.value),
          rows: 3,
          maxLength: 300,
          "aria-invalid": !!p.msg,
          placeholder: "Stayed late to help a patient find the right product"
        }
      ),
      /* @__PURE__ */ s("p", { className: "hf-field__count", "aria-live": "polite", children: [
        f.trim().length,
        " / 280"
      ] }),
      p.msg && /* @__PURE__ */ t("p", { className: "hf-field__err", role: "alert", children: p.msg })
    ] }),
    /* @__PURE__ */ t("p", { className: "hf-muted", style: { fontSize: 12, margin: "0 0 16px" }, children: "Kudos appear in the feed for everyone in HiFive after HR approves them, usually the same day." }),
    /* @__PURE__ */ t("button", { type: "button", className: "hf-btn hf-btn--primary", onClick: y, disabled: k, children: k ? "Sending…" : "Send kudos" })
  ] });
}
function qr({ rows: e, label: n = "Status" }) {
  return e.length ? /* @__PURE__ */ t("section", { className: "hf hf-card hf-rows", "aria-label": n, children: e.map((a) => /* @__PURE__ */ s("div", { className: "hf-row", children: [
    /* @__PURE__ */ t("span", { className: "hf-row__ic", "aria-hidden": "true", children: a.icon }),
    /* @__PURE__ */ s("span", { className: "hf-row__label", children: [
      a.label,
      a.hint && /* @__PURE__ */ t(fe, { text: a.hint })
    ] }),
    a.value && /* @__PURE__ */ t("span", { className: "hf-row__value", children: a.value }),
    a.action && (a.action.href ? /* @__PURE__ */ t("a", { className: "hf-row__action", href: a.action.href, children: a.action.label }) : /* @__PURE__ */ t("button", { type: "button", className: "hf-row__action", onClick: a.action.onClick, children: a.action.label }))
  ] }, a.key)) }) : null;
}
function Yr({ ok: e }) {
  return /* @__PURE__ */ t("span", { className: "hf-dot", style: e ? void 0 : { background: "rgb(var(--warn))" }, "aria-hidden": "true" });
}
const Ja = {
  factor_band: /* @__PURE__ */ t(Ye, { size: 24 }),
  probation_confirmed: /* @__PURE__ */ t(_n, { size: 24 }),
  induction_complete: /* @__PURE__ */ t(gt, { size: 24 }),
  anniversary: /* @__PURE__ */ t(sa, { size: 24 }),
  kudos: /* @__PURE__ */ t(Le, { size: 24 })
};
function Vr({ type: e, title: n, detail: a, onDismiss: i }) {
  return /* @__PURE__ */ s("section", { className: "hf hf-card hf-celebrate", "aria-live": "polite", "aria-label": "A moment worth noting", children: [
    /* @__PURE__ */ t("div", { className: "hf-confetti", "aria-hidden": "true", children: Array.from({ length: 14 }).map((r, l) => /* @__PURE__ */ t("i", { style: {
      left: `${l * 7.3 % 100}%`,
      animationDelay: `${l % 7 * 0.18}s`,
      background: l % 3 === 0 ? "rgb(var(--pop-400))" : l % 3 === 1 ? "rgb(var(--brand-400))" : "rgb(var(--sky-400))"
    } }, l)) }),
    /* @__PURE__ */ s("div", { className: "hf-celebrate__row", children: [
      /* @__PURE__ */ t("span", { className: "hf-celebrate__ic", "aria-hidden": "true", children: Ja[e] }),
      /* @__PURE__ */ s("div", { className: "hf-celebrate__body", style: { flex: 1, minWidth: 0 }, children: [
        /* @__PURE__ */ s("p", { className: "hf-celebrate__cap", children: [
          "A moment worth noting ",
          /* @__PURE__ */ t(fe, { text: "Shown once a day, only when something changed for you: a Factor band, a probation decision, an induction completed or an anniversary." })
        ] }),
        /* @__PURE__ */ t("h2", { className: "hf-display hf-celebrate__h", children: n }),
        a && /* @__PURE__ */ t("p", { className: "hf-celebrate__p", children: a })
      ] }),
      /* @__PURE__ */ t("button", { type: "button", className: "hf-celebrate__x", onClick: i, "aria-label": "Dismiss", children: /* @__PURE__ */ t(qe, { size: 18 }) })
    ] })
  ] });
}
const Me = { side: "hifive-dock-side", top: "hifive-dock-top", tip: "hifive-dock-tip" }, nt = (e) => {
  try {
    return localStorage.getItem(e);
  } catch {
    return null;
  }
}, at = (e, n) => {
  try {
    localStorage.setItem(e, n);
  } catch {
  }
};
function Jr({ apps: e }) {
  const n = Y(null), a = Y(null), [i, r] = z(() => nt(Me.side) === "left" ? "left" : "right"), [l, o] = z(() => Number(nt(Me.top)) || 50), [c, h] = z(() => !nt(Me.tip)), u = Y(!1), f = () => {
    h(!1), at(Me.tip, "1");
  };
  q(() => {
    at(Me.side, i), at(Me.top, String(l));
  }, [i, l]);
  const d = (k) => {
    const m = n.current;
    if (!m) return;
    const y = m.getBoundingClientRect();
    a.current = { x: k.clientX, y: k.clientY, left: y.left, top: y.top, moved: !1 };
  }, p = (k) => {
    const m = a.current, y = n.current;
    if (!m || !y) return;
    const b = k.clientX - m.x, A = k.clientY - m.y;
    if (!m.moved) {
      if (Math.abs(b) + Math.abs(A) <= 6) return;
      m.moved = !0, y.setPointerCapture(k.pointerId), y.classList.add("dragging");
    }
    y.style.transform = "none", y.style.left = `${m.left + b}px`, y.style.right = "auto", y.style.top = `${m.top + A}px`;
  }, g = () => {
    const k = a.current, m = n.current;
    if (a.current = null, !k || !m || !k.moved) return;
    m.classList.remove("dragging");
    const y = m.getBoundingClientRect(), b = y.left + y.width / 2 < window.innerWidth / 2 ? "left" : "right", A = Math.round(Math.min(90, Math.max(10, (y.top + y.height / 2) / window.innerHeight * 100)));
    m.style.transform = "", m.style.left = "", m.style.right = "", m.style.top = `${A}%`, r(b), o(A), f(), u.current = !0, setTimeout(() => {
      u.current = !1;
    }, 50);
  };
  return /* @__PURE__ */ s(j, { children: [
    c && /* @__PURE__ */ t("div", { className: "hf hf-dock__scrim", "aria-hidden": "true", onClick: f }),
    /* @__PURE__ */ s(
      "nav",
      {
        ref: n,
        className: K("hf hf-dock", `hf-dock--${i}`),
        "aria-label": "Your apps",
        style: { top: `${l}%` },
        onPointerDown: d,
        onPointerMove: p,
        onPointerUp: g,
        onPointerCancel: g,
        "data-tour": "apps",
        children: [
          /* @__PURE__ */ s("span", { className: "hf-dock__grip", "aria-hidden": "true", children: [
            /* @__PURE__ */ t("i", {}),
            /* @__PURE__ */ t("i", {}),
            /* @__PURE__ */ t("i", {})
          ] }),
          c && /* @__PURE__ */ s("div", { className: "hf-dock__tip", role: "status", children: [
            /* @__PURE__ */ t("b", { children: "Your apps live here." }),
            " Drag this bar to move it to the other side.",
            /* @__PURE__ */ t("button", { type: "button", onClick: (k) => {
              k.stopPropagation(), f();
            }, children: "Got it" })
          ] }),
          e.map((k) => /* @__PURE__ */ s(
            "button",
            {
              type: "button",
              className: "hf-dock__btn hf-dock__btn--mark",
              "aria-label": k.attention ? `${k.label}. ${$e(k.label)}` : k.label,
              onClick: (m) => {
                if (u.current) {
                  m.preventDefault();
                  return;
                }
                k.onOpen();
              },
              children: [
                /* @__PURE__ */ t(Pe, { app: k.key, size: 44 }),
                k.attention && /* @__PURE__ */ t(Qe, {}),
                /* @__PURE__ */ s("span", { className: "hf-dock__label", "aria-hidden": "true", children: [
                  k.label,
                  k.attention && /* @__PURE__ */ t("span", { className: "hf-attn-line", children: $e(k.label) })
                ] })
              ]
            },
            k.key
          ))
        ]
      }
    )
  ] });
}
function Qr({ apps: e, hideOnDesktop: n = !0 }) {
  return /* @__PURE__ */ t("section", { className: K("hf", n && "hf-apps--hide-desktop"), "aria-label": "Your apps", "data-tour": "apps", children: /* @__PURE__ */ s("div", { className: "hf-card hf-apps2", children: [
    /* @__PURE__ */ s("h3", { className: "hf-cap hf-apps2__head", children: [
      "Your apps ",
      /* @__PURE__ */ t(fe, { text: "Every HiFive app you can open. On a computer they sit in the floating dock at the side." })
    ] }),
    /* @__PURE__ */ t("div", { className: "hf-apps2__grid", children: e.map((a) => /* @__PURE__ */ s("button", { type: "button", className: "hf-app2 hf-press", onClick: a.onOpen, children: [
      /* @__PURE__ */ s("span", { className: "hf-attn-host", children: [
        /* @__PURE__ */ t(Pe, { app: a.key, size: 52 }),
        a.attention && /* @__PURE__ */ t(Qe, {})
      ] }),
      /* @__PURE__ */ t("span", { className: "hf-app2__label hf-truncate", title: a.label, children: a.label }),
      a.attention && /* @__PURE__ */ t("span", { className: "hf-attn-line hf-app2__slow", children: $e(a.label) })
    ] }, a.key)) })
  ] }) });
}
const Qa = [
  ["water", "Water"],
  ["air", "Air"],
  ["earth", "Earth"],
  ["fire", "Fire"],
  ["luna", "Luna"],
  ["sol", "Sol"],
  ["aami", "Aami"],
  ["aadi", "Aadi"]
], Et = {
  water: ["#025EC4", "#0ECCED"],
  air: ["#15A898", "#33363B"],
  earth: ["#2F7A5A", "#8A5A34"],
  fire: ["#AF2610", "#4C2325"],
  luna: ["#26658C", "#54ACBF"],
  sol: ["#FBB931", "#EA6113"],
  aami: ["#610C9F", "#DA0C81"],
  aadi: ["#17566F", "#AF3D41"]
}, Ue = { skin: "water", style: "soft", mode: "light" };
function Za() {
  const e = document.documentElement;
  return {
    skin: e.getAttribute("data-skin") || Ue.skin,
    style: e.getAttribute("data-style") || Ue.style,
    mode: e.getAttribute("data-theme") || Ue.mode
  };
}
function Zr(e) {
  const n = document.documentElement;
  n.setAttribute("data-skin", e);
  const a = new MutationObserver(() => {
    n.getAttribute("data-skin") !== e && n.setAttribute("data-skin", e);
  });
  return a.observe(n, { attributes: !0, attributeFilter: ["data-skin"] }), () => a.disconnect();
}
function Xa(e) {
  const n = document.documentElement;
  if (window.hifiveTheme) {
    window.hifiveTheme.set(e);
    return;
  }
  e.skin && n.setAttribute("data-skin", e.skin), e.style && n.setAttribute("data-style", e.style), e.mode && (n.setAttribute("data-theme", e.mode), n.classList.toggle("dark", e.mode === "dark"));
}
function Ut({ label: e, value: n, options: a, onPick: i }) {
  return /* @__PURE__ */ s("div", { className: "hf-ap__row", children: [
    /* @__PURE__ */ t("p", { className: "hf-cap", style: { margin: "0 0 8px" }, children: e }),
    /* @__PURE__ */ t("div", { className: "hf-seg", role: "group", "aria-label": e, children: a.map(([r, l]) => /* @__PURE__ */ t("button", { type: "button", "aria-pressed": n === r, onClick: () => i(r), children: l }, r)) })
  ] });
}
function Xr({ open: e, onClose: n, onSave: a, onReplayTour: i }) {
  const [r, l] = z(() => typeof document > "u" ? Ue : Za()), [o, c] = z("idle"), h = Y(null);
  function u(f) {
    l((d) => ({ ...d, ...f })), Xa(f), a && (c("saving"), h.current && window.clearTimeout(h.current), h.current = window.setTimeout(async () => c(await a(f) ? "saved" : "failed"), 500));
  }
  return /* @__PURE__ */ s(ge, { open: e, onClose: n, title: "Appearance", children: [
    /* @__PURE__ */ s("div", { className: "hf-ap__row", children: [
      /* @__PURE__ */ t("p", { className: "hf-cap", style: { margin: "0 0 10px" }, children: "Colours" }),
      /* @__PURE__ */ t("div", { className: "hf-swatches", role: "radiogroup", "aria-label": "Colours", children: Qa.map(([f, d]) => /* @__PURE__ */ s("button", { type: "button", role: "radio", "aria-checked": r.skin === f, className: "hf-swatch", onClick: () => u({ skin: f }), children: [
        /* @__PURE__ */ t("span", { className: "hf-swatch__dot", style: { background: `linear-gradient(135deg, ${Et[f][0]} 0 52%, ${Et[f][1]} 52% 100%)` }, children: r.skin === f && /* @__PURE__ */ t(he, { size: 18, strokeWidth: 3 }) }),
        /* @__PURE__ */ t("span", { className: "hf-swatch__name", children: d })
      ] }, f)) })
    ] }),
    /* @__PURE__ */ s("div", { className: "hf-ap__pair", children: [
      /* @__PURE__ */ t(Ut, { label: "Style", value: r.style, options: [["lit", "Lit"], ["soft", "Soft"]], onPick: (f) => u({ style: f }) }),
      /* @__PURE__ */ t(Ut, { label: "Mode", value: r.mode, options: [["light", "Light"], ["dark", "Dark"]], onPick: (f) => u({ mode: f }) })
    ] }),
    /* @__PURE__ */ t("p", { className: "hf-ap__note", "aria-live": "polite", children: o === "failed" ? "Changed here, but it didn't save to your profile. Try again, or tell HR." : o === "saved" ? "Saved. Your choice follows you to every HiFive app and device." : "Default is Water · Soft · Light. Your choice is kept on your profile, so it follows you." }),
    i && /* @__PURE__ */ t("div", { className: "hf-ap__replay", children: /* @__PURE__ */ t("button", { type: "button", className: "hf-btn hf-btn--secondary", onClick: () => {
      n(), i();
    }, children: "Replay the tour" }) })
  ] });
}
function Kr({ onSearch: e, placeholder: n = "Search", id: a }) {
  const [i, r] = z(""), [l, o] = z([]), [c, h] = z(-1), [u, f] = z(!1), d = ve(), p = Y(null);
  q(() => {
    if (!i.trim()) {
      o([]), f(!1);
      return;
    }
    return p.current && window.clearTimeout(p.current), p.current = window.setTimeout(async () => {
      try {
        const y = await e(i.trim());
        o(y), f(!0), h(y.length ? 0 : -1);
      } catch {
        o([]), f(!1);
      }
    }, 250), () => {
      p.current && window.clearTimeout(p.current);
    };
  }, [i, e]);
  const g = (y) => {
    f(!1), r(""), y.onPick ? y.onPick() : y.href && (window.location.href = y.href);
  }, k = (y) => {
    u && (y.key === "ArrowDown" && (y.preventDefault(), h((b) => Math.min(l.length - 1, b + 1))), y.key === "ArrowUp" && (y.preventDefault(), h((b) => Math.max(0, b - 1))), y.key === "Enter" && c >= 0 && (y.preventDefault(), g(l[c])), y.key === "Escape" && f(!1));
  }, m = ["People", "Apps", "Policies"];
  return /* @__PURE__ */ s("div", { className: "hf hf-search__wrap", children: [
    /* @__PURE__ */ s("form", { role: "search", className: "hf-search", onSubmit: (y) => y.preventDefault(), children: [
      /* @__PURE__ */ t(At, { size: 18 }),
      /* @__PURE__ */ t(
        "input",
        {
          id: a,
          type: "search",
          value: i,
          onChange: (y) => r(y.target.value),
          onKeyDown: k,
          placeholder: n,
          "aria-label": "Search people, apps and policies",
          "aria-controls": u ? d : void 0,
          "aria-expanded": u,
          "aria-autocomplete": "list",
          role: "combobox"
        }
      ),
      i && /* @__PURE__ */ t("button", { type: "button", className: "hf-search__clear", onClick: () => r(""), "aria-label": "Clear", children: /* @__PURE__ */ t(qe, { size: 16 }) })
    ] }),
    u && /* @__PURE__ */ s("div", { className: "hf-search__results", id: d, role: "listbox", children: [
      l.length === 0 && /* @__PURE__ */ s("p", { className: "hf-search__group hf-muted", style: { margin: 0 }, children: [
        "Nothing matches “",
        i,
        "”."
      ] }),
      m.filter((y) => l.some((b) => b.group === y)).map((y) => /* @__PURE__ */ s("div", { children: [
        /* @__PURE__ */ t("p", { className: "hf-cap hf-search__group", style: { margin: 0 }, children: y }),
        l.map((b, A) => b.group === y && /* @__PURE__ */ s("button", { type: "button", role: "option", "aria-selected": A === c, className: "hf-search__item", onMouseEnter: () => h(A), onClick: () => g(b), children: [
          /* @__PURE__ */ t("span", { className: "hf-truncate", title: b.title, children: b.title }),
          b.detail && /* @__PURE__ */ t("small", { className: "hf-truncate", title: b.detail, children: b.detail })
        ] }, `${y}-${A}`))
      ] }, y))
    ] })
  ] });
}
function es({ firstName: e, day: n = 1, firstReview: a, top: i, induction: r, steps: l }) {
  const o = r != null && r.total ? Math.round(r.done / r.total * 100) : 0, c = n <= 7 ? `Day ${n} of your first week` : `Week ${Math.ceil(n / 7)} at HiFive`;
  return /* @__PURE__ */ s("section", { className: "hf hf-card hf-card--hero hf-joiner", "aria-label": "Your first week", "data-tour": "factor", children: [
    i === void 0 && /* @__PURE__ */ t("p", { className: "hf-joiner__day", children: c }),
    /* @__PURE__ */ s("h3", { className: "hf-display hf-joiner__h", children: [
      "Welcome, ",
      e
    ] }),
    /* @__PURE__ */ t("p", { className: "hf-joiner__p", children: i !== void 0 ? i : /* @__PURE__ */ s(j, { children: [
      "Your HiFive Factor starts after your first review",
      a ? ` in ${a}` : "",
      ". Until then, this is your week."
    ] }) }),
    r && r.total > 0 && /* @__PURE__ */ s(j, { children: [
      /* @__PURE__ */ s("div", { className: "hf-joiner__prog", children: [
        /* @__PURE__ */ t("span", { children: "Induction" }),
        /* @__PURE__ */ s("span", { className: "hf-num", style: { fontWeight: 600 }, children: [
          r.done,
          " of ",
          r.total,
          " ",
          r.unit ?? "modules"
        ] })
      ] }),
      /* @__PURE__ */ t("div", { className: "hf-bar", role: "progressbar", "aria-valuenow": o, "aria-valuemin": 0, "aria-valuemax": 100, "aria-label": "Induction progress", children: /* @__PURE__ */ t("i", { style: { width: `${o}%` } }) })
    ] }),
    /* @__PURE__ */ t("ul", { className: "hf-check", children: l.map((h) => /* @__PURE__ */ s("li", { className: h.state, children: [
      /* @__PURE__ */ t("span", { className: "hf-check__dot", "aria-hidden": "true", children: h.state === "done" && /* @__PURE__ */ t(he, { size: 12 }) }),
      /* @__PURE__ */ t("span", { className: "hf-check__text", children: h.text }),
      h.detail && /* @__PURE__ */ t("span", { className: "hf-check__detail", children: h.detail }),
      h.action ? /* @__PURE__ */ t("a", { className: "hf-check__act", href: h.action.href, children: h.action.label }) : h.state === "next" && /* @__PURE__ */ t("span", { className: "hf-check__next", children: "Next" }),
      /* @__PURE__ */ t("span", { className: "hf-sr", children: h.state === "done" ? ", done" : h.state === "next" ? ", next" : ", to do" })
    ] }, h.text)) })
  ] });
}
const Ka = [
  { selector: '[data-tour="topbar"]', title: "Your day, at the top", text: "Today’s date, a search for people and apps, and the gear for appearance settings." },
  { selector: '[data-tour="profile"]', title: "This is you", text: "Your card. Tap it any time to see exactly what you have access to." },
  { selector: '[data-tour="factor"]', title: "Your HiFive Factor", text: "One number built from performance, conduct and learning. Tap it to see how it’s built. Nobody else is compared with you here." },
  { selector: '[data-tour="month"]', title: "This month", text: "Only things that are yours to do or notice this month. When it’s quiet, it says so." },
  { selector: '[data-tour="team"]', title: "Your team", text: "The people who report to you. You see them; they don’t see each other’s standing.", when: (e) => !!e.isManager },
  { selector: '[data-tour="feed"]', title: "Happening at HiFive", text: "Joiners and milestones across the group, and kudos once they arrive. HR approves what is posted." },
  { selector: '[data-tour="apps"]', title: "Your apps", text: "Performance Hub, Recruitment, Learning Point and the rest open from here with your look carried across." },
  { selector: '[data-tour="status"]', title: "Waiting for you", text: "Letters, approvals and anything that needs your tap. Empty means nothing is waiting." },
  { selector: '[data-tour="know"]', title: "Know yourself", text: "Your personality profile from Learning Point. You, HR and the directors; your manager cannot open it." },
  { selector: '[data-tour="gear"]', title: "Make it yours", text: "Palette, Lit or Soft, light or dark. You can replay this tour from here whenever you like." }
], ei = {
  step: "Step {n} of {of}",
  skip: "Skip",
  back: "Back",
  next: "Next",
  finish: "Finish",
  doneTitle: "That’s your home page",
  doneText: "You’ve seen everything on it. You can replay this from the gear any time.",
  dontShow: "I understand, don’t show this again",
  done: "Done"
}, be = 10, Ee = 300, Ot = () => {
  var e;
  return typeof window < "u" && ((e = window.matchMedia) == null ? void 0 : e.call(window, "(prefers-reduced-motion: reduce)").matches);
};
function ti(e, n) {
  const [a, i] = z(null);
  return mt(() => {
    if (!n || !e) return;
    const r = document.querySelector(e);
    if (!r) {
      i(null);
      return;
    }
    const l = () => {
      const c = r.getBoundingClientRect();
      i({ top: c.top, left: c.left, width: c.width, height: c.height });
    };
    r.scrollIntoView({ behavior: Ot() ? "auto" : "smooth", block: "center", inline: "nearest" });
    const o = setTimeout(l, Ot() ? 0 : 380);
    return l(), window.addEventListener("resize", l), window.addEventListener("scroll", l, !0), () => {
      clearTimeout(o), window.removeEventListener("resize", l), window.removeEventListener("scroll", l, !0);
    };
  }, [e, n]), a;
}
function ts({ open: e, steps: n = Ka, context: a = {}, onSkip: i, onDone: r, labels: l, lang: o }) {
  const c = { ...ei, ...l || {} }, [h, u] = z([]);
  q(() => {
    e && u(n.filter((B) => (!B.when || B.when(a)) && document.querySelector(B.selector)));
  }, [e, n, a]);
  const [f, d] = z(0), [p, g] = z(!1), [k, m] = z(!0), y = h[f], b = ti((y == null ? void 0 : y.selector) ?? "", e && !p), A = Y(null);
  q(() => {
    e && (d(0), g(!1), m(!0));
  }, [e]);
  const G = Ae(() => {
    f + 1 >= h.length ? g(!0) : d(f + 1);
  }, [f, h.length]), N = Ae(() => {
    p ? g(!1) : f > 0 && d(f - 1);
  }, [f, p]);
  if (q(() => {
    if (!e) return;
    const B = (I) => {
      I.key === "Escape" ? (I.preventDefault(), i()) : (I.key === "ArrowRight" || I.key === "Enter") && !p ? (I.preventDefault(), G()) : I.key === "ArrowLeft" && (I.preventDefault(), N());
    };
    return window.addEventListener("keydown", B), () => window.removeEventListener("keydown", B);
  }, [e, p, G, N, i]), q(() => {
    var B;
    e && ((B = A.current) == null || B.focus());
  }, [e, f, p]), !e || !p && !y) return null;
  const $ = window.innerWidth < 768, C = window.innerWidth, w = window.innerHeight;
  if (p)
    return /* @__PURE__ */ t("div", { className: "hf hf-tour__scrim hf-tour__scrim--centre", role: "dialog", "aria-modal": "true", "aria-labelledby": "hf-tour-done", children: /* @__PURE__ */ s("div", { ref: A, tabIndex: -1, className: "hf-tour__card hf-tour__card--done", lang: o, children: [
      /* @__PURE__ */ t("h2", { id: "hf-tour-done", className: "hf-display hf-tour__title", style: { fontSize: 22 }, children: c.doneTitle }),
      /* @__PURE__ */ t("p", { className: "hf-tour__text", style: { fontSize: 15 }, children: c.doneText }),
      /* @__PURE__ */ s("label", { className: "hf-tour__tick", children: [
        /* @__PURE__ */ t("input", { type: "checkbox", checked: k, onChange: (B) => m(B.target.checked) }),
        c.dontShow
      ] }),
      /* @__PURE__ */ s("div", { className: "hf-tour__acts", children: [
        /* @__PURE__ */ t("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: N, children: c.back }),
        /* @__PURE__ */ t("button", { type: "button", className: "hf-btn hf-btn--primary", style: { width: "auto" }, onClick: () => r(k), children: c.done })
      ] })
    ] }) });
  const T = b ? { top: b.top - be, left: b.left - be, width: b.width + be * 2, height: b.height + be * 2 } : { inset: 0, borderRadius: 0, boxShadow: "none", background: "rgb(var(--ink-900) / .62)" };
  let P;
  if ($ || !b)
    P = {
      left: "max(16px, env(safe-area-inset-left, 0px))",
      right: "max(16px, env(safe-area-inset-right, 0px))",
      bottom: b && b.top + b.height / 2 > w / 2 && b ? w - b.top + be + 12 : "calc(16px + env(safe-area-inset-bottom, 0px))"
    };
  else {
    const B = b.top + b.height + be + 12, I = w - b.top + be + 12, ne = Math.min(Math.max(16, b.left + b.width / 2 - Ee / 2), C - Ee - 16);
    P = B + 160 < w ? { top: B, left: ne, width: Ee } : { bottom: I, left: ne, width: Ee };
  }
  return /* @__PURE__ */ s("div", { className: "hf", children: [
    /* @__PURE__ */ t("div", { className: "hf-tour__spot", style: T, "aria-hidden": "true" }),
    /* @__PURE__ */ s("div", { ref: A, tabIndex: -1, role: "dialog", "aria-modal": "true", "aria-labelledby": "hf-tour-title", "aria-describedby": "hf-tour-text", className: "hf-tour__card", style: P, lang: o, children: [
      /* @__PURE__ */ t("p", { className: "hf-cap hf-tour__step", children: c.step.replace("{n}", String(f + 1)).replace("{of}", String(h.length)) }),
      /* @__PURE__ */ t("h2", { id: "hf-tour-title", className: "hf-display hf-tour__title", children: y.title }),
      /* @__PURE__ */ t("p", { id: "hf-tour-text", className: "hf-tour__text", children: y.text }),
      /* @__PURE__ */ s("div", { className: "hf-tour__acts", children: [
        /* @__PURE__ */ t("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: i, children: c.skip }),
        /* @__PURE__ */ s("span", { className: "hf-tour__nav", children: [
          f > 0 && /* @__PURE__ */ t("button", { type: "button", className: "hf-btn hf-btn--secondary", style: { minHeight: 44 }, onClick: N, children: c.back }),
          /* @__PURE__ */ t("button", { type: "button", className: "hf-btn hf-btn--primary", style: { width: "auto", minHeight: 44 }, onClick: G, children: f + 1 >= h.length ? c.finish : c.next })
        ] })
      ] })
    ] })
  ] });
}
const kt = (e) => e === "phone" ? 2 : 4;
function ni(e) {
  return e.map((n, a) => [n, a]).sort((n, a) => a[0].priority - n[0].priority || n[1] - a[1]).map(([n]) => n);
}
function ai(e, n) {
  const a = n === "phone" ? 0 : n === "tablet" ? 1 : 2, i = kt(n), r = e.map((l) => Math.max(1, Math.min(l.size[a], i)));
  if (n !== "desktop") {
    let l = 0;
    const o = (c) => {
      c >= 0 && l % i && (r[c] += i - l);
    };
    for (let c = 0; c < r.length; c++) {
      if (r[c] >= i) {
        o(c - 1), l = 0;
        continue;
      }
      l + r[c] > i && (o(c - 1), l = 0), l += r[c], l === i && (l = 0);
    }
    o(r.length - 1);
  }
  return r;
}
const ii = 44, Wt = (e) => e.span === 1 && e.rows <= ii;
function ri(e, n) {
  const a = e.map((c) => ({ ...c })), i = Math.max(0, ...a.map((c) => c.row - 1 + c.rows)), r = Array.from({ length: n + 1 }, () => new Array(i + 2).fill(!1)), l = (c, h) => {
    for (let u = c.col; u < c.col + c.span; u++) for (let f = c.row; f < c.row + c.rows; f++) r[u][f] = h;
  }, o = (c, h, u) => {
    if (c < 1 || c > n) return !1;
    for (let f = h; f < h + u; f++) if (r[c][f]) return !1;
    return !0;
  };
  a.forEach((c) => l(c, !0));
  for (const c of a) {
    if (!Wt(c)) continue;
    l(c, !1);
    let h = !1;
    for (let u = 1; u < c.row && !h; u++)
      for (let f = 1; f <= n && !h; f++)
        (u === 1 || r[f][u - 1]) && o(f, u, c.rows) && (c.col = f, c.row = u, h = !0);
    l(c, !0);
  }
  for (const c of a) {
    if (!Wt(c)) continue;
    const h = { col: c.col, span: c.span };
    let u = c.col, f = c.span;
    for (; o(u + f, c.row, c.rows); ) f++;
    for (; o(u - 1, c.row, c.rows); )
      u--, f++;
    f !== h.span && (c.col = u, c.span = f, l(c, !0));
  }
  return a;
}
function si(e, n, a, i = 40) {
  const r = kt(n), l = ai(e, n), o = Array(r).fill(0), c = e.map((h, u) => {
    const f = l[u], d = Math.max(1, a[h.id] ?? i);
    let p = 0, g = 0, k = 1 / 0;
    for (let m = 0; m + f <= r; m++) {
      const y = o.slice(m, m + f), b = Math.max(...y), A = y.reduce((G, N) => G + (b - N), 0);
      b + A < k && (k = b + A, g = b, p = m);
    }
    for (let m = p; m < p + f; m++) o[m] = g + d;
    return { id: h.id, col: p + 1, row: g + 1, span: f, rows: d };
  });
  return ri(c, r);
}
const Ln = 4, jt = () => typeof window > "u" || window.matchMedia("(min-width: 1024px)").matches ? "desktop" : window.matchMedia("(min-width: 768px)").matches ? "tablet" : "phone";
function li() {
  const [e, n] = z(jt);
  return q(() => {
    const a = ["(min-width: 1024px)", "(min-width: 768px)"].map((r) => window.matchMedia(r)), i = () => n(jt());
    return a.forEach((r) => r.addEventListener("change", i)), () => a.forEach((r) => r.removeEventListener("change", i));
  }, []), e;
}
function ns({ blocks: e, label: n = "Your home page", layout: a }) {
  const i = li(), r = a ?? i, l = ke(() => ni(e.filter((d) => d.show)), [e]), [o, c] = z({}), h = Ae((d, p) => c((g) => g[d] === p ? g : { ...g, [d]: p }), []), u = {};
  for (const d of l) u[d.id] = o[d.id] ?? Math.ceil((d.reserve ?? 160) / Ln);
  const f = si(l, r, u);
  return /* @__PURE__ */ t("div", { className: "hf hf-bento", role: "region", "aria-label": n, style: { gridTemplateColumns: `repeat(${kt(r)}, minmax(0, 1fr))` }, children: l.map((d, p) => /* @__PURE__ */ t(
    oi,
    {
      id: d.id,
      report: h,
      style: { gridColumn: `${f[p].col} / span ${f[p].span}`, gridRow: `${f[p].row} / span ${f[p].rows}` },
      children: d.node
    },
    d.id
  )) });
}
function oi({ id: e, report: n, style: a, children: i }) {
  const r = Y(null);
  return mt(() => {
    const l = r.current;
    if (!l) return;
    const o = () => n(e, Math.max(1, Math.ceil(l.getBoundingClientRect().height / Ln)));
    o();
    const c = new ResizeObserver(o);
    return c.observe(l), () => c.disconnect();
  }, [e, n]), /* @__PURE__ */ t("div", { className: "hf-bento__item", "data-block": e, style: a, children: /* @__PURE__ */ t("div", { ref: r, className: "hf-bento__inner", children: i }) });
}
function as({ firstName: e, reportsTo: n, leads: a = 0, tenure: i, quote: r, search: l, onAppearance: o, onPrivacy: c, onMore: h, now: u = /* @__PURE__ */ new Date() }) {
  const f = u.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  return /* @__PURE__ */ s("header", { className: "hf hf-hello", "data-tour": "topbar", children: [
    /* @__PURE__ */ s("div", { className: "hf-hello__top", children: [
      /* @__PURE__ */ t("p", { className: "hf-hello__date", children: f }),
      l && /* @__PURE__ */ t("div", { className: "hf-hello__search", children: l }),
      o && /* @__PURE__ */ t("button", { type: "button", className: "hf-hello__btn", onClick: o, "aria-label": "Appearance settings", "data-tour": "gear", children: /* @__PURE__ */ t(ln, { size: 20 }) }),
      h && /* @__PURE__ */ t("button", { type: "button", className: "hf-hello__btn", onClick: h, "aria-label": "More", "aria-haspopup": "dialog", children: /* @__PURE__ */ t(gn, { size: 20 }) })
    ] }),
    /* @__PURE__ */ s("h1", { className: "hf-display hf-hello__h1", children: [
      kn(u),
      ", ",
      e
    ] }),
    (n || a > 0 || i) && /* @__PURE__ */ s("div", { className: "hf-hello__meta", children: [
      n && /* @__PURE__ */ s("span", { children: [
        /* @__PURE__ */ t(on, { size: 14 }),
        "Reports to ",
        n
      ] }),
      a > 0 && /* @__PURE__ */ s("span", { children: [
        /* @__PURE__ */ t(cn, { size: 14 }),
        "Leads ",
        a,
        " ",
        a === 1 ? "person" : "people"
      ] }),
      i && /* @__PURE__ */ s("span", { children: [
        /* @__PURE__ */ t(hn, { size: 14 }),
        i
      ] })
    ] }),
    c && /* @__PURE__ */ s("button", { type: "button", className: "hf-hello__chip", onClick: c, children: [
      /* @__PURE__ */ t(dn, { size: 12 }),
      " Only you can see this page ",
      /* @__PURE__ */ t(te, { size: 12 })
    ] }),
    r && /* @__PURE__ */ s("blockquote", { className: "hf-hello__quote", children: [
      "“",
      r.body,
      "”",
      r.author && /* @__PURE__ */ s("span", { children: [
        " — ",
        r.author
      ] })
    ] })
  ] });
}
function is({ rows: e, unavailable: n = [], onRetry: a }) {
  const i = e.reduce((r, l) => r + (l.count ?? 1), 0);
  return /* @__PURE__ */ s("section", { className: "hf hf-card hf-wait", id: "waiting", "aria-label": "Waiting for you", children: [
    /* @__PURE__ */ s("div", { className: "hf-wait__head", children: [
      /* @__PURE__ */ t("span", { className: "hf-wait__bell", "aria-hidden": "true", children: /* @__PURE__ */ t(fn, { size: 16 }) }),
      /* @__PURE__ */ t("h3", { className: "hf-display hf-wait__title", children: "Waiting for you" }),
      i > 0 && /* @__PURE__ */ t("span", { className: "hf-count", "aria-label": `${i} waiting`, children: i }),
      /* @__PURE__ */ t("span", { style: { marginLeft: "auto" }, children: /* @__PURE__ */ t(fe, { align: "left", text: "Only things that are yours to do, from every HiFive app, most urgent first. When it's empty this card shrinks to one line." }) })
    ] }),
    /* @__PURE__ */ t("ul", { className: "hf-wait__list", children: e.map((r) => {
      const l = /* @__PURE__ */ s(j, { children: [
        /* @__PURE__ */ s("span", { className: "hf-wait__logo", children: [
          /* @__PURE__ */ t(Pe, { app: r.app, size: 32 }),
          r.overdue && /* @__PURE__ */ t("span", { className: "hf-due", "aria-hidden": "true", children: /* @__PURE__ */ t("span", { className: "hf-due__ping" }) }),
          r.attention && /* @__PURE__ */ t(Qe, {})
        ] }),
        /* @__PURE__ */ s("span", { className: "hf-wait__txt", children: [
          /* @__PURE__ */ t("span", { className: "hf-wait__what", children: r.text }),
          /* @__PURE__ */ s("span", { className: `hf-wait__when${r.overdue ? " is-overdue" : ""}`, children: [
            r.appName,
            r.when ? ` · ${r.when}` : ""
          ] }),
          r.attention && /* @__PURE__ */ t("span", { className: "hf-attn-line", children: $e(r.appName) })
        ] }),
        r.action && /* @__PURE__ */ t("span", { className: "hf-wait__verb", children: r.action }),
        /* @__PURE__ */ t(te, { size: 16, className: "hf-wait__chev", "aria-hidden": "true" })
      ] });
      return /* @__PURE__ */ t("li", { children: r.href ? /* @__PURE__ */ t("a", { className: "hf-wait__row", href: r.href, children: l }) : /* @__PURE__ */ t("button", { type: "button", className: "hf-wait__row", onClick: r.onClick, children: l }) }, r.id);
    }) }),
    n.map((r) => /* @__PURE__ */ s("div", { className: "hf-wait__gap", role: "status", children: [
      /* @__PURE__ */ s("span", { children: [
        "We couldn't reach ",
        r,
        " just now. This part will fill in when it's back."
      ] }),
      a && /* @__PURE__ */ s("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: a, children: [
        /* @__PURE__ */ t(la, { size: 14 }),
        " Try again"
      ] })
    ] }, r))
  ] });
}
function rs() {
  return /* @__PURE__ */ s("section", { className: "hf hf-mini hf-tone-brand", "aria-label": "Waiting for you", children: [
    /* @__PURE__ */ t("span", { className: "hf-mini__ic", children: /* @__PURE__ */ t(oa, { size: 18 }) }),
    /* @__PURE__ */ s("span", { children: [
      /* @__PURE__ */ t("span", { className: "hf-display hf-mini__t", children: "Nothing waiting" }),
      /* @__PURE__ */ t("span", { className: "hf-mini__s", children: "for you today" })
    ] })
  ] });
}
const ci = { joiners: Ve, anniversary: Ye, kudos: Le, induction: gt, probation: ca, pinned: pn }, it = 4;
function ss({ items: e, limit: n = 4, onKudos: a, onReact: i }) {
  const [r, l] = z(!1), [o, c] = z({}), [h, u] = z(!1), f = e.filter((m) => m.kind === "pinned"), d = e.filter((m) => m.kind !== "pinned"), p = [...f, ...d], g = r ? p : p.slice(0, n), k = d.length === 0 && f.length === 0;
  return /* @__PURE__ */ s("section", { className: "hf hf-card hf-happen", "aria-label": "Happening at HiFive", "data-tour": "feed", children: [
    /* @__PURE__ */ s("div", { className: "hf-happen__head", children: [
      /* @__PURE__ */ t("h3", { className: "hf-display hf-happen__title", children: "Happening at HiFive" }),
      /* @__PURE__ */ t("span", { style: { marginLeft: "auto" }, children: /* @__PURE__ */ t(fe, { align: "left", text: "Joiners, anniversaries, inductions and approved kudos from across HiFive. Grouped so one busy day never fills your page." }) })
    ] }),
    k ? /* @__PURE__ */ s("div", { className: "hf-happen__quiet", children: [
      /* @__PURE__ */ t("span", { className: "hf-kind-well hf-kind--quiet", "aria-hidden": "true", children: /* @__PURE__ */ t(An, { size: 18 }) }),
      /* @__PURE__ */ s("p", { children: [
        "Nothing new since yesterday.",
        a && /* @__PURE__ */ s(j, { children: [
          " ",
          /* @__PURE__ */ t("button", { type: "button", className: "hf-link", onClick: a, children: "Be the first to give kudos." })
        ] })
      ] })
    ] }) : /* @__PURE__ */ t("ul", { className: "hf-happen__list", children: g.map((m) => {
      var A, G, N, $, C, w, T;
      const y = ci[m.kind], b = !!o[m.id];
      return /* @__PURE__ */ s("li", { className: "hf-happen__row", children: [
        /* @__PURE__ */ s("div", { className: "hf-happen__line", children: [
          (A = m.people) != null && A.length ? /* @__PURE__ */ t("span", { className: "hf-happen__stack", "aria-hidden": "true", children: m.people.slice(0, 3).map((P) => /* @__PURE__ */ t(oe, { name: P.name, size: 30, ring: !0 }, P.name)) }) : m.person ? /* @__PURE__ */ s("span", { className: "hf-happen__who", "aria-hidden": "true", children: [
            /* @__PURE__ */ t(oe, { name: m.person, size: 36 }),
            /* @__PURE__ */ t("span", { className: `hf-kind-badge hf-kind--${m.kind}`, children: /* @__PURE__ */ t(y, { size: 11 }) })
          ] }) : /* @__PURE__ */ t("span", { className: `hf-kind-well hf-kind--${m.kind}`, "aria-hidden": "true", children: /* @__PURE__ */ t(y, { size: 17 }) }),
          /* @__PURE__ */ t("div", { className: "hf-happen__body", children: (G = m.people) != null && G.length ? /* @__PURE__ */ s("button", { type: "button", className: "hf-happen__toggle", "aria-expanded": b, onClick: () => {
            c((P) => ({ [m.id]: !P[m.id] })), u(!1);
          }, children: [
            /* @__PURE__ */ t("span", { className: "hf-happen__text", children: m.headline ?? /* @__PURE__ */ s(j, { children: [
              /* @__PURE__ */ s("b", { children: [
                m.people.length,
                " ",
                m.people.length === 1 ? "person" : "people",
                " joined"
              ] }),
              " ",
              m.sub ?? "recently"
            ] }) }),
            /* @__PURE__ */ s("span", { className: "hf-happen__sub", children: [
              [...new Set(m.people.map((P) => P.where).filter(Boolean))].join(" · "),
              " · ",
              /* @__PURE__ */ t("span", { className: "hf-link", children: b ? "Hide" : "See who" })
            ] })
          ] }) : /* @__PURE__ */ s(j, { children: [
            m.kind === "pinned" && /* @__PURE__ */ t("p", { className: "hf-happen__pin", children: "Pinned by HR" }),
            /* @__PURE__ */ t("p", { className: "hf-happen__text", children: m.text }),
            m.sub && /* @__PURE__ */ t("p", { className: "hf-happen__sub", children: m.sub })
          ] }) }),
          m.when && /* @__PURE__ */ t("span", { className: "hf-happen__when", children: m.when })
        ] }),
        b && !!((N = m.people) != null && N.length) && /* @__PURE__ */ s("ul", { className: "hf-happen__people", children: [
          (h ? m.people : m.people.slice(0, it)).map((P) => /* @__PURE__ */ s("li", { children: [
            /* @__PURE__ */ t(oe, { name: P.name, size: 28 }),
            /* @__PURE__ */ s("span", { className: "hf-happen__pname", children: [
              /* @__PURE__ */ t("b", { className: "hf-truncate", children: wn(P.name) }),
              (P.role || P.where) && /* @__PURE__ */ t("span", { className: "hf-truncate", children: [P.role, P.where].filter(Boolean).join(" · ") })
            ] }),
            P.on && /* @__PURE__ */ t("span", { className: "hf-happen__when", children: P.on })
          ] }, P.name)),
          !h && m.people.length > it && /* @__PURE__ */ t("li", { children: /* @__PURE__ */ s("button", { type: "button", className: "hf-link hf-happen__more", onClick: () => u(!0), children: [
            "and ",
            m.people.length - it,
            " more"
          ] }) })
        ] }),
        m.kind === "kudos" && i && /* @__PURE__ */ s("div", { className: "hf-happen__reacts", children: [
          /* @__PURE__ */ s("button", { type: "button", className: `hf-react2${($ = m.mine) != null && $.like ? " is-on" : ""}`, "aria-pressed": !!((C = m.mine) != null && C.like), onClick: () => i(m.id, "like"), children: [
            /* @__PURE__ */ t(mn, { size: 14 }),
            " ",
            m.likes ?? 0
          ] }),
          /* @__PURE__ */ s("button", { type: "button", className: `hf-react2${(w = m.mine) != null && w.clap ? " is-on" : ""}`, "aria-pressed": !!((T = m.mine) != null && T.clap), onClick: () => i(m.id, "clap"), children: [
            /* @__PURE__ */ t(Le, { size: 14 }),
            " ",
            m.claps ?? 0
          ] })
        ] })
      ] }, m.id);
    }) }),
    (a || p.length > n) && /* @__PURE__ */ s("div", { className: "hf-happen__foot", children: [
      a && /* @__PURE__ */ s("button", { type: "button", className: "hf-kudos-pill", onClick: a, children: [
        /* @__PURE__ */ t(Le, { size: 15 }),
        " Give kudos"
      ] }),
      p.length > n && /* @__PURE__ */ t("button", { type: "button", className: "hf-btn hf-btn--quiet", style: { marginLeft: "auto" }, onClick: () => l((m) => !m), children: r ? "Show less" : `See all ${p.length}` })
    ] })
  ] });
}
function ls({ tone: e = "brand", icon: n, title: a, sub: i, hint: r, dot: l, action: o, onClick: c, dark: h }) {
  const u = /* @__PURE__ */ s(j, { children: [
    /* @__PURE__ */ s("span", { className: "hf-mini__top", children: [
      /* @__PURE__ */ t("span", { className: "hf-mini__ic", "aria-hidden": "true", children: n }),
      l && /* @__PURE__ */ t("span", { className: `hf-mini__dot hf-mini__dot--${l}`, "aria-hidden": "true" }),
      r && /* @__PURE__ */ t(fe, { align: "left", text: r })
    ] }),
    /* @__PURE__ */ s("span", { children: [
      /* @__PURE__ */ t("span", { className: "hf-display hf-mini__t", children: a }),
      i && /* @__PURE__ */ t("span", { className: "hf-mini__s", children: i }),
      o && (o.href ? /* @__PURE__ */ t("a", { className: "hf-mini__a", href: o.href, children: o.label }) : /* @__PURE__ */ t("button", { type: "button", className: "hf-mini__a", onClick: (d) => {
        var p;
        d.stopPropagation(), (p = o.onClick) == null || p.call(o);
      }, children: o.label }))
    ] })
  ] }), f = K("hf hf-mini hf-press", h ? "hf-mini--dark" : _e(e));
  return c ? /* @__PURE__ */ t("button", { type: "button", className: f, onClick: c, children: u }) : /* @__PURE__ */ t("section", { className: f, children: u });
}
function os({ members: e, total: n }) {
  if (!e.length) return null;
  const a = n ?? e.length;
  return /* @__PURE__ */ s("section", { className: "hf hf-card hf-team", "aria-label": "Your team", "data-tour": "team", children: [
    /* @__PURE__ */ s("h3", { className: "hf-cap hf-team__head", children: [
      "Your team ",
      /* @__PURE__ */ s("span", { children: [
        a,
        " ",
        a === 1 ? "person" : "people"
      ] })
    ] }),
    /* @__PURE__ */ t("ul", { className: "hf-team__list", children: e.map((i) => {
      const r = /* @__PURE__ */ s(j, { children: [
        /* @__PURE__ */ t(oe, { name: i.name, size: 36 }),
        /* @__PURE__ */ s("span", { className: "hf-team__txt", children: [
          /* @__PURE__ */ t("span", { className: "hf-team__name hf-truncate", title: i.name, children: i.name }),
          (i.note || i.sub) && /* @__PURE__ */ t("span", { className: `hf-team__sub hf-truncate${i.note ? " is-note" : ""}`, children: i.note || i.sub })
        ] }),
        i.onOpen && /* @__PURE__ */ t(te, { size: 16, className: "hf-team__chev", "aria-hidden": "true" })
      ] });
      return /* @__PURE__ */ t("li", { children: i.onOpen ? /* @__PURE__ */ t("button", { type: "button", className: "hf-team__row", onClick: i.onOpen, children: r }) : /* @__PURE__ */ t("div", { className: "hf-team__row", children: r }) }, i.name);
    }) })
  ] });
}
const hi = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], di = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function wt(e) {
  const n = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(e ?? ""));
  return n ? new Date(Number(n[1]), Number(n[2]) - 1, Number(n[3])) : null;
}
function Ht(e) {
  return new Date(e.getFullYear(), e.getMonth(), e.getDate());
}
function $n(e, n) {
  return Math.round((Ht(n).getTime() - Ht(e).getTime()) / 864e5);
}
function He(e) {
  const n = wt(e);
  return n ? `${hi[n.getDay()]} ${n.getDate()} ${di[n.getMonth()]}` : "";
}
function Rt(e, n = /* @__PURE__ */ new Date()) {
  const a = wt(e);
  if (!a) return "";
  const i = $n(n, a);
  return i === 0 ? "Joins today" : i === 1 ? `Joins tomorrow, ${He(e)}` : i > 1 ? `Joins ${He(e)} (in ${i} days)` : i === -1 ? "Joined yesterday" : `Joined ${-i} days ago`;
}
function Tn(e, n = /* @__PURE__ */ new Date()) {
  const a = e.due ? wt(e.due) : null;
  return !!a && e.state !== "ready" && $n(n, a) < 0;
}
function ct(e) {
  return e.setup.filter((n) => n.state === "held").length;
}
function Dn(e) {
  if (!e.setup.length) return null;
  const n = e.setup.filter((i) => i.state === "ready").length, a = ct(e);
  return { line: `Setup ${n} of ${e.setup.length} ready`, held: a ? `${a} held up` : null };
}
function Gn(e) {
  if (!e.documents.length) return null;
  const n = e.documents.filter((r) => r.state === "done").length, a = e.documents.length - n;
  return `Documents ${[n ? `${n} done` : null, a ? `${a} in progress` : null].filter(Boolean).join(" · ")}`;
}
function fi(e, n = /* @__PURE__ */ new Date()) {
  var r;
  const a = (r = e.holder) == null ? void 0 : r.trim(), i = Tn(e, n) && e.due ? ` · was due ${He(e.due).replace(/^\w+ /, "")}` : "";
  return e.state === "ready" ? "Ready" : e.state === "held" ? `Held up${a ? ` · ${a} is on it` : ""}${i}` : `${a ? `Being arranged by ${a}` : "Being arranged"}${i}`;
}
function ui(e) {
  return [...e].sort((n, a) => (ct(a) > 0 ? 1 : 0) - (ct(n) > 0 ? 1 : 0) || (a.urgent ? 1 : 0) - (n.urgent ? 1 : 0) || String(n.joins).localeCompare(String(a.joins)) || n.name.localeCompare(a.name));
}
function cs(e, n) {
  const a = (Array.isArray(n) ? n : [n]).map((r) => String(r ?? "").trim()).filter(Boolean).join(","), i = `About ${e.name}, joining ${He(e.joins)}`;
  return `mailto:${a}?subject=${encodeURIComponent(i)}`;
}
function ht({ kind: e, small: n }) {
  return /* @__PURE__ */ t("span", { className: `hf-jt__mark is-${e}${n ? " hf-jt__mark--sm" : ""}`, "aria-hidden": "true", children: e === "done" ? /* @__PURE__ */ t(he, { size: 12, strokeWidth: 3 }) : e === "held" ? "!" : null });
}
const pi = (e) => e.state === "ready" ? "done" : e.state === "held" ? "held" : "open", mi = (e) => e.state === "done" ? "done" : "open";
function Ai({ j: e }) {
  const n = Dn(e), a = Gn(e);
  return !n && !a ? null : /* @__PURE__ */ s("span", { className: "hf-jt__prog", children: [
    n && /* @__PURE__ */ s("span", { className: "hf-jt__part", children: [
      n.line,
      n.held && /* @__PURE__ */ s(j, { children: [
        " · ",
        /* @__PURE__ */ s("b", { className: "hf-jt__held", children: [
          /* @__PURE__ */ t(ht, { kind: "held", small: !0 }),
          n.held
        ] })
      ] })
    ] }),
    a && /* @__PURE__ */ t("span", { className: "hf-jt__part", children: a })
  ] });
}
function hs({ joiners: e, max: n = 3, askHr: a, today: i = /* @__PURE__ */ new Date() }) {
  const [r, l] = z(null), [o, c] = z(!1);
  if (!e.length) return null;
  const h = ui(e), u = o ? h : h.slice(0, n), f = h.length - u.length, d = h.find((g) => g.id === r) ?? null, p = h.length;
  return /* @__PURE__ */ s("section", { className: "hf hf-card hf-team hf-jt", "aria-label": "Joining your team", children: [
    /* @__PURE__ */ s("h3", { className: "hf-cap hf-team__head", children: [
      "Joining your team ",
      /* @__PURE__ */ s("span", { children: [
        p,
        " ",
        p === 1 ? "person" : "people"
      ] })
    ] }),
    /* @__PURE__ */ t("ul", { className: "hf-team__list hf-jt__list", children: u.map((g) => /* @__PURE__ */ t("li", { children: /* @__PURE__ */ s("button", { type: "button", className: "hf-team__row hf-jt__row", onClick: () => l(g.id), children: [
      /* @__PURE__ */ t(oe, { name: g.name, size: 36 }),
      /* @__PURE__ */ s("span", { className: "hf-team__txt", children: [
        /* @__PURE__ */ t("span", { className: "hf-team__name hf-truncate", title: g.name, children: g.name }),
        /* @__PURE__ */ t("span", { className: "hf-team__sub hf-truncate", children: [g.job, g.facility].filter(Boolean).join(" · ") }),
        /* @__PURE__ */ t("span", { className: "hf-jt__when", children: Rt(g.joins, i) }),
        /* @__PURE__ */ t(Ai, { j: g })
      ] }),
      /* @__PURE__ */ t(te, { size: 16, className: "hf-team__chev", "aria-hidden": "true" })
    ] }) }, g.id)) }),
    f > 0 && /* @__PURE__ */ s("button", { type: "button", className: "hf-jt__more", onClick: () => c(!0), children: [
      "Show ",
      f,
      " more"
    ] }),
    /* @__PURE__ */ t(
      ge,
      {
        open: !!d,
        onClose: () => l(null),
        title: (d == null ? void 0 : d.name) ?? "",
        subtitle: d ? [[d.job, d.facility].filter(Boolean).join(" · "), Rt(d.joins, i)].filter(Boolean).join(" · ") : void 0,
        children: d && /* @__PURE__ */ t(_i, { j: d, today: i, askHr: (a == null ? void 0 : a(d)) ?? null })
      }
    )
  ] });
}
function _i({ j: e, today: n, askHr: a }) {
  const i = Dn(e), r = Gn(e);
  return /* @__PURE__ */ s("div", { className: "hf-jt__detail", children: [
    e.dayOne && /* @__PURE__ */ s("div", { className: "hf-jt__dayone", children: [
      /* @__PURE__ */ t(ha, { size: 18, "aria-hidden": "true" }),
      /* @__PURE__ */ s("div", { children: [
        /* @__PURE__ */ t("p", { className: "hf-cap", children: "Day one" }),
        /* @__PURE__ */ t("p", { children: e.dayOne })
      ] })
    ] }),
    e.setup.length > 0 && /* @__PURE__ */ s("section", { "aria-label": "Setup", children: [
      /* @__PURE__ */ s("h4", { className: "hf-cap hf-jt__h", children: [
        "Setup ",
        /* @__PURE__ */ s("span", { children: [
          i == null ? void 0 : i.line.replace(/^Setup /, ""),
          i != null && i.held ? ` · ${i.held}` : ""
        ] })
      ] }),
      /* @__PURE__ */ t("ul", { className: "hf-jt__items", children: e.setup.map((l) => {
        const o = pi(l);
        return /* @__PURE__ */ s("li", { className: `is-${o}`, children: [
          /* @__PURE__ */ t(ht, { kind: o }),
          /* @__PURE__ */ t("span", { className: "hf-jt__item", children: l.item }),
          /* @__PURE__ */ t("span", { className: `hf-jt__state${o === "held" || Tn(l, n) ? " is-attn" : ""}`, children: fi(l, n) })
        ] }, l.item);
      }) })
    ] }),
    e.documents.length > 0 && /* @__PURE__ */ s("section", { "aria-label": "Documents", children: [
      /* @__PURE__ */ s("h4", { className: "hf-cap hf-jt__h", children: [
        "Documents ",
        /* @__PURE__ */ t("span", { children: r == null ? void 0 : r.replace(/^Documents /, "") })
      ] }),
      /* @__PURE__ */ t("ul", { className: "hf-jt__items", children: e.documents.map((l) => {
        const o = mi(l);
        return /* @__PURE__ */ s("li", { className: `is-${o}`, children: [
          /* @__PURE__ */ t(ht, { kind: o }),
          /* @__PURE__ */ t("span", { className: "hf-jt__item", children: l.stage }),
          /* @__PURE__ */ t("span", { className: "hf-jt__state", children: l.state === "done" ? "Done" : "In progress" })
        ] }, l.stage);
      }) }),
      /* @__PURE__ */ t("p", { className: "hf-jt__note", children: "Later steps appear here when they start." })
    ] }),
    /* @__PURE__ */ t("p", { className: "hf-jt__foot", children: "Nothing for you to do here. HR and the people named are arranging it." }),
    a && /* @__PURE__ */ t("a", { className: "hf-btn hf-btn--secondary hf-jt__ask", href: a.href, children: a.to ? `Ask HR · ${a.to}` : "Ask HR" })
  ] });
}
const gi = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function bi(e, n = /* @__PURE__ */ new Date()) {
  const a = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(e ?? ""));
  if (!a) return "";
  const i = `${Number(a[3])} ${gi[Number(a[2]) - 1]}`;
  return Number(a[1]) === n.getFullYear() ? i : `${i} ${a[1]}`;
}
const dt = (e) => `${e} item${e === 1 ? "" : "s"}`, yi = (e) => e > 0 ? `Holding ${dt(e)}` : "Nothing held";
function Pn(e, n, a = /* @__PURE__ */ new Date()) {
  if (!(e > 0)) return null;
  const i = bi(n, a);
  return `${e} to account for${i ? ` since ${i}` : ""}`;
}
function vi(e) {
  const n = e.map((i) => i.hours).filter((i) => i > 0);
  return `To account for: taken more than ${n.length ? Math.min(...n) : 24} hours ago and not yet marked used or returned.`;
}
function ki(e, n = /* @__PURE__ */ new Date()) {
  const a = Pn(e.unaccounted, e.since, n);
  return a ? `${dt(e.holding)}, ${a}` : dt(e.holding);
}
function ds(e, n) {
  const a = `${e === 1 ? "Item" : "Items"} in hand`;
  return n > 0 ? `${a} · ${n} to account for` : a;
}
function fs(e) {
  return e ? e.state === "down" ? !0 : e.state === "ok" && e.holding > 0 : !1;
}
function wi(e, n) {
  if (!n) return { single: null, perUnit: !1 };
  const a = e.map((i) => i.href).filter((i) => !!i);
  return a.length ? e.length > 1 ? { single: null, perUnit: !0 } : { single: a[0], perUnit: !1 } : { single: null, perUnit: !1 };
}
function Ni({ stock: e, self: n = !1, onRetry: a, today: i = /* @__PURE__ */ new Date() }) {
  const r = /* @__PURE__ */ t("h3", { className: "hf-cap", children: "Stock in hand" });
  if (e.state === "loading")
    return /* @__PURE__ */ s("section", { className: "hf hf-card hf-stock", "aria-label": "Stock in hand", "aria-busy": "true", children: [
      r,
      /* @__PURE__ */ t("span", { className: "hf-stock__sk", style: { width: "60%" } }),
      /* @__PURE__ */ t("span", { className: "hf-stock__sk", style: { width: "40%" } })
    ] });
  if (e.state === "down")
    return /* @__PURE__ */ s("section", { className: "hf hf-card hf-stock", "aria-label": "Stock in hand", children: [
      r,
      /* @__PURE__ */ t("p", { className: "hf-stock__note", role: "status", children: "Inventory did not answer just now." }),
      a && /* @__PURE__ */ t("button", { type: "button", className: "hf-btn hf-btn--secondary hf-stock__retry", onClick: a, children: "Try again" })
    ] });
  if (e.holding <= 0)
    return /* @__PURE__ */ s("section", { className: "hf hf-card hf-stock", "aria-label": "Stock in hand", children: [
      r,
      /* @__PURE__ */ t("p", { className: "hf-stock__row", children: /* @__PURE__ */ s("span", { className: "hf-status hf-status--plain", children: [
        /* @__PURE__ */ t(he, { size: 12, "aria-hidden": "true" }),
        "Nothing held"
      ] }) })
    ] });
  const l = Pn(e.unaccounted, e.since, i), o = wi(e.units, n);
  return /* @__PURE__ */ s("section", { className: "hf hf-card hf-stock", "aria-label": "Stock in hand", children: [
    r,
    /* @__PURE__ */ t("p", { className: "hf-stock__lead", children: yi(e.holding) }),
    l && /* @__PURE__ */ s(j, { children: [
      /* @__PURE__ */ t("p", { className: "hf-stock__row", children: /* @__PURE__ */ s("span", { className: "hf-status hf-status--warn", children: [
        /* @__PURE__ */ t(_t, { size: 12, "aria-hidden": "true" }),
        l
      ] }) }),
      /* @__PURE__ */ t("p", { className: "hf-stock__note", children: vi(e.units) })
    ] }),
    e.units.length > 1 && /* @__PURE__ */ t("ul", { className: "hf-stock__units", children: e.units.map((c) => /* @__PURE__ */ s("li", { className: "hf-stock__unit", children: [
      /* @__PURE__ */ s("span", { className: "hf-stock__txt", children: [
        /* @__PURE__ */ t("span", { className: "hf-stock__name", children: c.unit }),
        /* @__PURE__ */ t("span", { className: "hf-stock__sub", children: ki(c, i) })
      ] }),
      o.perUnit && c.href && /* @__PURE__ */ s("a", { className: "hf-stock__link", href: c.href, children: [
        "With me",
        /* @__PURE__ */ t(We, { size: 14, "aria-hidden": "true" }),
        /* @__PURE__ */ s("span", { className: "hf-sr", children: [
          " in Inventory, ",
          c.unit
        ] })
      ] })
    ] }, c.unit)) }),
    o.single && /* @__PURE__ */ s("a", { className: K("hf-stock__link"), href: o.single, children: [
      "Open “With me” in Inventory",
      /* @__PURE__ */ t(We, { size: 14, "aria-hidden": "true" })
    ] }),
    !n && /* @__PURE__ */ t("p", { className: "hf-stock__note", children: "Counts only. What the items are stays in Inventory, where managers see their team." })
  ] });
}
const xi = 900, qt = `(max-width: ${xi}px)`;
function Mi(e, n = "Filters") {
  return e > 0 ? `${n}, ${e} on` : n;
}
function zi(e) {
  return e.filter((n) => n.sortable).map((n) => ({ key: n.key, label: n.label }));
}
function Si(e, n = ["result", "results"]) {
  return e == null ? "Done" : e === 0 ? "Close" : `Show ${e} ${e === 1 ? n[0] : n[1]}`;
}
function Ci(e, n, a) {
  const i = e.slice();
  if (!n) return i;
  const r = n.dir === "asc" ? 1 : -1, l = (o) => o == null || o === "";
  return i.sort((o, c) => {
    const h = a(o, n.key), u = a(c, n.key);
    return l(h) && l(u) ? 0 : l(h) ? 1 : l(u) ? -1 : typeof h == "number" && typeof u == "number" ? (h - u) * r : String(h).localeCompare(String(u), void 0, { numeric: !0, sensitivity: "base" }) * r;
  });
}
function Bi(e, n) {
  return !e || e.key !== n ? { key: n, dir: "asc" } : { key: n, dir: e.dir === "asc" ? "desc" : "asc" };
}
function Li(e, n) {
  return e === "done" ? { mark: "tick", words: "done" } : e === "skipped" ? { mark: "dash", words: "not needed" } : e === "current" ? { mark: "number", words: `step ${n + 1}, where the case is now` } : { mark: "number", words: `step ${n + 1}, still to come` };
}
const Fn = {
  rated: "Rated",
  missing: "Not rated",
  skipped: "Skipped",
  future: "Still to come"
};
function $i(e) {
  return e.map((n) => `${n.label}: ${Fn[n.state].toLowerCase()}`).join(", ");
}
function Ti(e, n) {
  const a = e.indexOf(n);
  if (a < 0) return { index: -1, line: n ? `${n}: not one of the usual stages.` : "Stage not known." };
  const i = e[a + 1];
  return { index: a, line: `Stage ${a + 1} of ${e.length}: ${n}.${i ? ` Next: ${i}.` : ""}` };
}
function Di(e, n, a = "Item") {
  const i = n == null ? -1 : e.indexOf(n);
  return i < 0 ? { index: -1, prev: null, next: e[0] ?? null, line: e.length ? `${e.length} in the list` : "Nothing in the list" } : { index: i, prev: e[i - 1] ?? null, next: e[i + 1] ?? null, line: `${a} ${i + 1} of ${e.length}` };
}
function us(e, n) {
  const a = e.indexOf(n);
  return a < 0 ? e[0] ?? null : e[a + 1] ?? e[a - 1] ?? null;
}
function Gi(e, n, a) {
  const i = e.indexOf(n);
  return i < 0 ? null : e[i + a] ?? null;
}
function Pi(e, n, a) {
  return !a || !a.to || a.to === a.from ? e : e - (n === a.from ? 1 : 0) + (n === a.to ? 1 : 0);
}
const me = {
  picked: (e, n) => `Picked up ${e}, in ${n}. Use the left and right arrows to choose a stage, Space to drop, Escape to cancel.`,
  lifted: (e) => `Picked up ${e}. Drop on a stage to move them.`,
  target: (e, n) => n ? `${e}, where they are now.` : `${e}.`,
  moved: (e, n) => `${e} moved to ${n}.`,
  stays: (e, n) => `${e} stays in ${n}.`,
  notMoved: (e) => `${e} was not moved.`
};
function Ce({ variant: e = "secondary", fit: n, icon: a, busy: i, className: r, children: l, type: o = "button", ...c }) {
  const h = ["hf-btn", `hf-btn--${e}`, "hf-press", n ? "hf-btn--fit" : "", r ?? ""].filter(Boolean).join(" ");
  return /* @__PURE__ */ s("button", { type: o, className: h, "aria-busy": i || void 0, ...c, children: [
    i ? /* @__PURE__ */ t("span", { className: "hf-spin", "aria-hidden": "true" }) : a,
    l
  ] });
}
function we(e) {
  const n = ve(), a = e ?? n;
  return { id: a, hint: `${a}-h`, error: `${a}-e` };
}
function Nt({ htmlFor: e, label: n, optional: a, hideLabel: i }) {
  return /* @__PURE__ */ s("label", { htmlFor: e, className: i ? "hf-sr" : "hf-fld__l", children: [
    n,
    a && /* @__PURE__ */ t("span", { className: "hf-fld__opt", children: " (optional)" })
  ] });
}
function Te(e, n, a) {
  return [n ? e.hint : "", a ? e.error : ""].filter(Boolean).join(" ") || void 0;
}
function xt({ ids: e, error: n }) {
  return n ? /* @__PURE__ */ t("span", { id: e.error, className: "hf-fld__e", children: n }) : null;
}
function ps({ label: e, hint: n, error: a, optional: i, hideLabel: r, id: l, className: o, ...c }) {
  const h = we(l);
  return /* @__PURE__ */ s("div", { className: ["hf-fld", o ?? ""].join(" "), children: [
    /* @__PURE__ */ t(Nt, { htmlFor: h.id, label: e, optional: i, hideLabel: r }),
    n && /* @__PURE__ */ t("span", { id: h.hint, className: "hf-fld__h", children: n }),
    /* @__PURE__ */ t(
      "input",
      {
        id: h.id,
        className: a ? "hf-input hf-input--err" : "hf-input",
        "aria-invalid": a ? !0 : void 0,
        "aria-describedby": Te(h, n, a),
        ...c
      }
    ),
    /* @__PURE__ */ t(xt, { ids: h, hint: n, error: a })
  ] });
}
function ms({ label: e, hint: n, error: a, optional: i, hideLabel: r, id: l, className: o, rows: c = 3, maxLength: h, value: u, ...f }) {
  const d = we(l), p = typeof u == "string" ? u.length : 0;
  return /* @__PURE__ */ s("div", { className: ["hf-fld", o ?? ""].join(" "), children: [
    /* @__PURE__ */ t(Nt, { htmlFor: d.id, label: e, optional: i, hideLabel: r }),
    n && /* @__PURE__ */ t("span", { id: d.hint, className: "hf-fld__h", children: n }),
    /* @__PURE__ */ t(
      "textarea",
      {
        id: d.id,
        rows: Math.max(3, c),
        maxLength: h,
        value: u,
        className: a ? "hf-input hf-input--area hf-input--err" : "hf-input hf-input--area",
        "aria-invalid": a ? !0 : void 0,
        "aria-describedby": Te(d, n, a),
        ...f
      }
    ),
    h ? /* @__PURE__ */ s("span", { className: "hf-fld__count", "aria-live": "polite", children: [
      p,
      " of ",
      h
    ] }) : null,
    /* @__PURE__ */ t(xt, { ids: d, hint: n, error: a })
  ] });
}
function As({ label: e, hint: n, error: a, optional: i, hideLabel: r, id: l, className: o, options: c, placeholder: h, ...u }) {
  const f = we(l);
  return /* @__PURE__ */ s("div", { className: ["hf-fld", o ?? ""].join(" "), children: [
    /* @__PURE__ */ t(Nt, { htmlFor: f.id, label: e, optional: i, hideLabel: r }),
    n && /* @__PURE__ */ t("span", { id: f.hint, className: "hf-fld__h", children: n }),
    /* @__PURE__ */ s("span", { className: "hf-select", children: [
      /* @__PURE__ */ s(
        "select",
        {
          id: f.id,
          className: a ? "hf-input hf-input--err" : "hf-input",
          "aria-invalid": a ? !0 : void 0,
          "aria-describedby": Te(f, n, a),
          ...u,
          children: [
            h !== void 0 && /* @__PURE__ */ t("option", { value: "", children: h }),
            c.map((d) => typeof d == "string" ? /* @__PURE__ */ t("option", { value: d, children: d }, d) : /* @__PURE__ */ t("option", { value: d.value, children: d.label }, d.value))
          ]
        }
      ),
      /* @__PURE__ */ t(bt, { size: 18, "aria-hidden": "true" })
    ] }),
    /* @__PURE__ */ t(xt, { ids: f, hint: n, error: a })
  ] });
}
function _s({ label: e, sub: n, id: a, className: i, ...r }) {
  const l = ve(), o = a ?? l;
  return /* @__PURE__ */ s("label", { htmlFor: o, className: ["hf-tick", i ?? ""].join(" "), children: [
    /* @__PURE__ */ t("input", { id: o, type: "checkbox", ...r }),
    /* @__PURE__ */ t("span", { className: "hf-tick__box", "aria-hidden": "true", children: /* @__PURE__ */ t(he, { size: 14, strokeWidth: 3 }) }),
    /* @__PURE__ */ s("span", { className: "hf-tick__t", children: [
      e,
      n && /* @__PURE__ */ t("span", { className: "hf-tick__s", children: n })
    ] })
  ] });
}
function gs({ label: e, options: n, value: a, onChange: i, hint: r, error: l, optional: o, hideLabel: c, clearable: h, onClear: u }) {
  const f = we();
  return /* @__PURE__ */ s("div", { className: "hf-fld", role: "group", "aria-labelledby": f.id, "aria-describedby": Te(f, r, l), children: [
    /* @__PURE__ */ s("span", { id: f.id, className: c ? "hf-sr" : "hf-fld__l", children: [
      e,
      o && /* @__PURE__ */ t("span", { className: "hf-fld__opt", children: " (optional)" })
    ] }),
    r && /* @__PURE__ */ t("span", { id: f.hint, className: "hf-fld__h", children: r }),
    /* @__PURE__ */ t("div", { className: "hf-seg hf-seg--fill", children: n.map((d) => {
      const p = typeof d == "string" ? d : d.value, g = typeof d == "string" ? d : d.label, k = a === p;
      return /* @__PURE__ */ t(
        "button",
        {
          type: "button",
          "aria-pressed": k,
          onClick: () => k && h ? u == null ? void 0 : u() : i(p),
          children: g
        },
        p
      );
    }) }),
    l && /* @__PURE__ */ t("span", { id: f.error, className: "hf-fld__e", children: l })
  ] });
}
function bs({ label: e, options: n, value: a, onChange: i, hint: r, error: l, hideLabel: o }) {
  const c = we();
  return /* @__PURE__ */ s("div", { className: "hf-fld", role: "radiogroup", "aria-labelledby": c.id, "aria-describedby": Te(c, r, l), children: [
    /* @__PURE__ */ t("span", { id: c.id, className: o ? "hf-sr" : "hf-fld__l", children: e }),
    r && /* @__PURE__ */ t("span", { id: c.hint, className: "hf-fld__h", children: r }),
    n.map((h) => {
      const u = a === h.value;
      return /* @__PURE__ */ s("div", { className: "hf-choice__w", children: [
        /* @__PURE__ */ s("button", { type: "button", role: "radio", "aria-checked": u, className: u ? "hf-choice is-on" : "hf-choice", onClick: () => i(h.value), children: [
          /* @__PURE__ */ t("span", { className: "hf-choice__dot", "aria-hidden": "true" }),
          /* @__PURE__ */ s("span", { className: "hf-choice__b", children: [
            /* @__PURE__ */ s("span", { className: "hf-choice__t", children: [
              h.title,
              h.tag && /* @__PURE__ */ t("span", { className: "hf-choice__tag", children: h.tag })
            ] }),
            h.sub && /* @__PURE__ */ t("span", { className: "hf-choice__s", children: h.sub })
          ] })
        ] }),
        u && h.detail
      ] }, h.value);
    }),
    l && /* @__PURE__ */ t("span", { id: c.error, className: "hf-fld__e", children: l })
  ] });
}
function ys({ label: e, options: n, value: a, onChange: i, onClear: r, hint: l, hideLabel: o, disabled: c }) {
  const h = we(), u = n.find((f) => f.value === a);
  return /* @__PURE__ */ s("div", { className: "hf-fld", children: [
    /* @__PURE__ */ t("span", { id: h.id, className: o ? "hf-sr" : "hf-fld__l", children: e }),
    l && /* @__PURE__ */ t("span", { id: h.hint, className: "hf-fld__h", children: l }),
    /* @__PURE__ */ t("div", { className: "hf-marks", role: "group", "aria-labelledby": h.id, "aria-describedby": l ? h.hint : void 0, children: n.map((f) => {
      const d = a === f.value;
      return /* @__PURE__ */ s(
        "button",
        {
          type: "button",
          "aria-pressed": d,
          disabled: c,
          onClick: () => d ? r == null ? void 0 : r() : i(f.value),
          children: [
            f.icon && /* @__PURE__ */ t("span", { className: "hf-marks__ic", "aria-hidden": "true", children: f.icon }),
            /* @__PURE__ */ t("span", { children: f.label })
          ]
        },
        f.value
      );
    }) }),
    u == null ? void 0 : u.detail
  ] });
}
function vs({ label: e, value: n, onChange: a, max: i = 5, hint: r, error: l, ends: o = ["1 is lowest", `${i} is highest`], children: c }) {
  const h = we();
  return /* @__PURE__ */ s("div", { className: "hf-fld", role: "group", "aria-labelledby": h.id, "aria-describedby": Te(h, r, l), children: [
    /* @__PURE__ */ t("span", { id: h.id, className: "hf-fld__t", children: e }),
    r && /* @__PURE__ */ t("span", { id: h.hint, className: "hf-fld__h", children: r }),
    /* @__PURE__ */ t("div", { className: "hf-score-box", children: /* @__PURE__ */ t(
      "div",
      {
        className: i > 5 ? "hf-score hf-score--wrap" : "hf-score",
        style: i > 5 ? { "--hf-score-n": i } : { gridTemplateColumns: `repeat(${i}, minmax(0, 1fr))` },
        children: Array.from({ length: i }, (u, f) => f + 1).map((u) => /* @__PURE__ */ t("button", { type: "button", "aria-pressed": n === u, "aria-label": `${u} of ${i}`, onClick: () => a(u), children: u }, u))
      }
    ) }),
    /* @__PURE__ */ s("span", { className: "hf-score__ends", "aria-hidden": "true", children: [
      /* @__PURE__ */ t("span", { children: o[0] }),
      /* @__PURE__ */ t("span", { children: o[1] })
    ] }),
    c,
    l && /* @__PURE__ */ t("span", { id: h.error, className: "hf-fld__e", children: l })
  ] });
}
function Yt({ pressed: e, count: n, className: a, children: i, type: r = "button", ...l }) {
  return /* @__PURE__ */ s("button", { type: r, className: ["hf-chip", e ? "is-on" : "", a ?? ""].filter(Boolean).join(" "), "aria-pressed": e, ...l, children: [
    i,
    (typeof n == "number" || typeof n == "string" && n !== "") && /* @__PURE__ */ t("span", { className: "hf-chip__n", children: n })
  ] });
}
function Fi({ label: e, children: n }) {
  return /* @__PURE__ */ t("div", { className: "hf-chips", role: "group", "aria-label": e, children: n });
}
const Ii = {
  ok: /* @__PURE__ */ t(he, { size: 14, strokeWidth: 2.5, "aria-hidden": "true" }),
  warn: /* @__PURE__ */ t(_t, { size: 14, strokeWidth: 2.5, "aria-hidden": "true" }),
  danger: /* @__PURE__ */ t(je, { size: 14, strokeWidth: 2.5, "aria-hidden": "true" }),
  plain: /* @__PURE__ */ t(da, { size: 10, strokeWidth: 3, "aria-hidden": "true" })
};
function ks({ tone: e, icon: n, children: a }) {
  return /* @__PURE__ */ s("span", { className: `hf-status hf-status--${e}`, children: [
    n ?? Ii[e],
    a
  ] });
}
const Ei = {
  ok: /* @__PURE__ */ t(he, { size: 18, "aria-hidden": "true" }),
  warn: /* @__PURE__ */ t(je, { size: 18, "aria-hidden": "true" }),
  danger: /* @__PURE__ */ t(je, { size: 18, "aria-hidden": "true" }),
  plain: /* @__PURE__ */ t(bn, { size: 18, "aria-hidden": "true" })
};
function ws({ tone: e = "plain", icon: n, children: a, role: i, action: r }) {
  return /* @__PURE__ */ s("div", { className: `hf-banner hf-banner--${e}`, role: i, children: [
    n ?? Ei[e],
    /* @__PURE__ */ t("div", { className: "hf-banner__t", children: a }),
    r && /* @__PURE__ */ t("div", { className: "hf-banner__a", children: /* @__PURE__ */ t("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: r.onClick, children: r.label }) })
  ] });
}
function rt({ title: e, sub: n, icon: a, trailing: i, below: r, href: l, onClick: o, chevron: c = !!(l || o), current: h }) {
  const u = h ? "hf-lrow is-current" : "hf-lrow", f = h ? { "aria-current": !0 } : {}, d = /* @__PURE__ */ s(j, { children: [
    a && /* @__PURE__ */ t("span", { className: "hf-lrow__ic", "aria-hidden": "true", children: a }),
    /* @__PURE__ */ s("span", { className: "hf-lrow__b", children: [
      /* @__PURE__ */ t("span", { className: "hf-lrow__t", children: e }),
      n && /* @__PURE__ */ t("span", { className: "hf-lrow__s", children: n }),
      r && /* @__PURE__ */ t("span", { className: "hf-lrow__below", children: r })
    ] }),
    (i || c) && /* @__PURE__ */ s("span", { className: "hf-lrow__e", children: [
      i,
      c && /* @__PURE__ */ t(te, { size: 20, "aria-hidden": "true" })
    ] })
  ] });
  return l ? /* @__PURE__ */ t("a", { className: u, ...f, href: l, onClick: o ? (p) => {
    p.preventDefault(), o();
  } : void 0, children: d }) : o ? /* @__PURE__ */ t("button", { type: "button", className: u, ...f, onClick: o, children: d }) : /* @__PURE__ */ t("div", { className: u, ...f, children: d });
}
function Ui({ caption: e, children: n, action: a }) {
  return /* @__PURE__ */ s("section", { className: "hf-card hf-listcard", children: [
    (e || a) && /* @__PURE__ */ s("div", { className: "hf-listcard__head", children: [
      e && /* @__PURE__ */ t("span", { className: "hf-cap", children: e }),
      a
    ] }),
    /* @__PURE__ */ t("div", { className: "hf-listcard__rows", children: n })
  ] });
}
function Ns({ caption: e, columns: n, rows: a, rowKey: i, onRowClick: r, rowHref: l, empty: o, initialSort: c = null, onSortChange: h, hideCaption: u, wide: f }) {
  const [d, p] = z(c), g = ke(() => Ci(a, d, (A, G) => {
    var N, $;
    return ($ = (N = n.find((C) => C.key === G)) == null ? void 0 : N.sortValue) == null ? void 0 : $.call(N, A);
  }), [a, d, n]), k = n.map((A) => A.width ?? "minmax(0, 1fr)").join(" "), m = (A, G) => A.render ? A.render(G) : G[A.key], y = (A) => A == null || A === "" || A === !1, b = zi(n.map((A) => ({ key: A.key, label: typeof A.label == "string" ? A.label : A.key, sortable: !!A.sortValue })));
  return /* @__PURE__ */ s("div", { className: f ? "hf-table hf-table--wide" : "hf-table", role: "table", "aria-label": e, children: [
    !u && /* @__PURE__ */ t("div", { className: "hf-table__cap hf-cap", children: e }),
    g.length > 0 && /* @__PURE__ */ t("div", { className: "hf-table__head", role: "row", style: { gridTemplateColumns: k }, children: n.map((A) => {
      const G = (d == null ? void 0 : d.key) === A.key, N = G ? d.dir === "asc" ? "ascending" : "descending" : "none";
      return /* @__PURE__ */ t(
        "span",
        {
          role: "columnheader",
          "aria-sort": A.sortValue ? N : void 0,
          className: A.align === "end" ? "hf-table__th is-end" : "hf-table__th",
          children: A.sortValue ? /* @__PURE__ */ s("button", { type: "button", onClick: () => {
            const $ = Bi(d, A.key);
            p($), h == null || h($);
          }, children: [
            A.label,
            G ? d.dir === "asc" ? /* @__PURE__ */ t(Tt, { size: 14, "aria-hidden": "true" }) : /* @__PURE__ */ t(Dt, { size: 14, "aria-hidden": "true" }) : null
          ] }) : A.label
        },
        A.key
      );
    }) }),
    g.length > 1 && b.length > 0 && /* @__PURE__ */ s("div", { className: "hf-table__sortbar", children: [
      /* @__PURE__ */ s("label", { className: "hf-table__sortby", children: [
        /* @__PURE__ */ t("span", { children: "Sort by" }),
        /* @__PURE__ */ s("select", { value: (d == null ? void 0 : d.key) ?? "", onChange: (A) => {
          const G = A.target.value, N = G ? { key: G, dir: (d == null ? void 0 : d.dir) ?? "asc" } : null;
          p(N), h == null || h(N);
        }, children: [
          /* @__PURE__ */ t("option", { value: "", children: "As listed" }),
          b.map((A) => /* @__PURE__ */ t("option", { value: A.key, children: A.label }, A.key))
        ] })
      ] }),
      d && /* @__PURE__ */ t(
        "button",
        {
          type: "button",
          className: "hf-table__dir",
          "aria-label": d.dir === "asc" ? "Ascending order, change to descending" : "Descending order, change to ascending",
          onClick: () => {
            const A = { key: d.key, dir: d.dir === "asc" ? "desc" : "asc" };
            p(A), h == null || h(A);
          },
          children: d.dir === "asc" ? /* @__PURE__ */ t(Tt, { size: 18, "aria-hidden": "true" }) : /* @__PURE__ */ t(Dt, { size: 18, "aria-hidden": "true" })
        }
      )
    ] }),
    g.length === 0 && o && /* @__PURE__ */ t("div", { className: "hf-table__empty", children: o }),
    g.map((A) => {
      const G = n.map(($) => {
        const C = m($, A);
        return /* @__PURE__ */ t(
          "span",
          {
            role: "cell",
            "data-label": $.label,
            className: ["hf-table__td", $.lead ? "is-lead" : "", $.align === "end" ? "is-end" : "", y(C) ? "is-blank" : ""].filter(Boolean).join(" "),
            children: C
          },
          $.key
        );
      }), N = l == null ? void 0 : l(A);
      return N ? /* @__PURE__ */ t(
        "a",
        {
          role: "row",
          className: "hf-table__tr is-link",
          style: { gridTemplateColumns: k },
          href: N,
          onClick: r ? ($) => {
            $.preventDefault(), r(A);
          } : void 0,
          children: G
        },
        i(A)
      ) : r ? /* @__PURE__ */ t(
        "button",
        {
          type: "button",
          role: "row",
          className: "hf-table__tr is-link",
          style: { gridTemplateColumns: k },
          onClick: () => r(A),
          children: G
        },
        i(A)
      ) : /* @__PURE__ */ t("div", { role: "row", className: "hf-table__tr", style: { gridTemplateColumns: k }, children: G }, i(A));
    })
  ] });
}
function Oi({ lines: e = 3, height: n = 16, block: a }) {
  return a ? /* @__PURE__ */ t("span", { className: "hf-skel", style: { height: a }, "aria-hidden": "true" }) : /* @__PURE__ */ t("span", { className: "hf-skel-lines", "aria-hidden": "true", children: Array.from({ length: e }, (i, r) => /* @__PURE__ */ t("span", { className: "hf-skel", style: { height: n, width: r === e - 1 && e > 1 ? "60%" : "100%" } }, r)) });
}
function xs({ label: e = "Loading", children: n }) {
  return /* @__PURE__ */ s("div", { className: "hf-loading", role: "status", "aria-live": "polite", children: [
    /* @__PURE__ */ t("span", { className: "hf-sr", children: e }),
    n ?? /* @__PURE__ */ t(Oi, { lines: 3 })
  ] });
}
function Wi() {
  const e = () => {
    var i;
    return typeof window < "u" && !!((i = window.matchMedia) != null && i.call(window, qt).matches);
  }, [n, a] = z(e);
  return q(() => {
    var l;
    const i = typeof window < "u" ? (l = window.matchMedia) == null ? void 0 : l.call(window, qt) : void 0;
    if (!i) return;
    const r = () => a(i.matches);
    return r(), i.addEventListener("change", r), () => i.removeEventListener("change", r);
  }, []), n;
}
function ji({ count: e = 0, onClick: n, label: a = "Filters" }) {
  return /* @__PURE__ */ s("button", { type: "button", className: e > 0 ? "hf-phonebtn is-on" : "hf-phonebtn", onClick: n, "aria-label": Mi(e, a), "aria-haspopup": "dialog", children: [
    /* @__PURE__ */ t(fa, { size: 18, "aria-hidden": "true" }),
    /* @__PURE__ */ t("span", { "aria-hidden": "true", children: a }),
    e > 0 && /* @__PURE__ */ t("span", { className: "hf-count", "aria-hidden": "true", children: e })
  ] });
}
function Ms({ onClick: e, label: n = "More" }) {
  return /* @__PURE__ */ t("button", { type: "button", className: "hf-phonebtn hf-phonebtn--icon", onClick: e, "aria-label": n, "aria-haspopup": "dialog", children: /* @__PURE__ */ t(gn, { size: 20, "aria-hidden": "true" }) });
}
function zs({ icon: e, children: n, sub: a, onClick: i, href: r, disabled: l, danger: o }) {
  const c = `hf-sheetitem${o ? " hf-sheetitem--danger" : ""}`, h = /* @__PURE__ */ s(j, { children: [
    e && /* @__PURE__ */ t("span", { className: "hf-sheetitem__ic", "aria-hidden": "true", children: e }),
    /* @__PURE__ */ s("span", { className: "hf-sheetitem__words", children: [
      /* @__PURE__ */ t("span", { children: n }),
      a && /* @__PURE__ */ t("small", { children: a })
    ] })
  ] });
  return r && !l ? /* @__PURE__ */ t("a", { className: c, href: r, onClick: i, children: h }) : /* @__PURE__ */ t("button", { type: "button", className: c, onClick: i, disabled: l, children: h });
}
function Ss({ label: e, children: n }) {
  return /* @__PURE__ */ s("label", { className: "hf-field hf-sheetfield", children: [
    /* @__PURE__ */ t("span", { children: e }),
    n
  ] });
}
function Vt({ title: e, count: n, defaultOpen: a, children: i }) {
  return /* @__PURE__ */ s("details", { className: "hf hf-card hf-fold", open: a, children: [
    /* @__PURE__ */ s("summary", { className: "hf-fold__sum", children: [
      /* @__PURE__ */ t("span", { className: "hf-fold__t", children: e }),
      n != null && n !== "" && /* @__PURE__ */ t("span", { className: "hf-fold__n", children: n }),
      /* @__PURE__ */ t(bt, { size: 18, "aria-hidden": "true", className: "hf-fold__chev" })
    ] }),
    /* @__PURE__ */ t("div", { className: "hf-fold__body", children: i })
  ] });
}
function Cs({ count: e, onClear: n, shown: a, noun: i, onShow: r }) {
  return /* @__PURE__ */ s("div", { className: "hf-sheetfoot", children: [
    a === 0 && /* @__PURE__ */ t("p", { className: "hf-sheetfoot__none", role: "status", children: "Nothing matches these filters." }),
    /* @__PURE__ */ s("div", { className: "hf-sheetfoot__row", children: [
      /* @__PURE__ */ t(Ce, { variant: "secondary", onClick: n, disabled: e === 0, children: "Clear" }),
      /* @__PURE__ */ t(Ce, { variant: "primary", onClick: r, "aria-live": "polite", children: Si(a, i) })
    ] })
  ] });
}
const Hi = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function ft(e) {
  const n = /^(\d{4})-(\d{2})-(\d{2})/.exec(e ?? "");
  return n ? `${Number(n[3])} ${Hi[Number(n[2]) - 1]} ${n[1]}` : e ?? "";
}
function Ri(e) {
  if (e == null || e < 0) return "";
  if (e === 0) return "New this month";
  const n = Math.floor(e / 12), a = e % 12, i = (r, l) => r ? `${r} ${l}${r === 1 ? "" : "s"}` : "";
  return [i(n, "year"), i(a, "month")].filter(Boolean).join(" ");
}
function qi(e) {
  const n = [`${e.headcount} ${e.headcount === 1 ? "person" : "people"}`];
  return e.joined && n.push(`${e.joined} new`), e.probation && n.push(`${e.probation} on probation`), e.leaving && n.push(`${e.leaving} leaving`), n.join(" · ");
}
function Yi(e) {
  return e.waiting ? e.overdue ? `${e.waiting} waiting · ${e.overdue} overdue` : `${e.waiting} waiting` : "Nothing waiting";
}
function Vi(e) {
  const n = [], a = (r) => {
    const l = e.filter(r.test).length;
    l > 0 && l < e.length && n.push(r);
  };
  a({ key: "probation", label: "On probation", test: (r) => !!r.probation }), a({ key: "new", label: "New this month", test: (r) => r.joined });
  const i = [...new Set(e.map((r) => (r.designation ?? "").trim()).filter(Boolean))].sort((r, l) => r.localeCompare(l));
  if (i.length > 1 && i.length <= 8) for (const r of i) a({ key: `role:${r}`, label: r, test: (l) => (l.designation ?? "").trim() === r });
  return n;
}
function In({ crumbs: e, current: n, onCrumb: a }) {
  const i = n === void 0 ? e.length - 1 : e.length;
  return /* @__PURE__ */ t("nav", { className: "hf-crumbs", "aria-label": "Where you are", children: /* @__PURE__ */ s("ol", { children: [
    e.map((r, l) => /* @__PURE__ */ s("li", { children: [
      l < i ? /* @__PURE__ */ t("button", { type: "button", className: "hf-crumbs__up", onClick: () => a(r), children: r.name }) : /* @__PURE__ */ t("span", { "aria-current": "page", children: r.name }),
      (l < e.length - 1 || n !== void 0) && /* @__PURE__ */ t(te, { size: 14, "aria-hidden": "true", className: "hf-crumbs__sep" })
    ] }, `${r.level}-${r.name}`)),
    n !== void 0 && /* @__PURE__ */ t("li", { children: /* @__PURE__ */ t("span", { "aria-current": "page", children: n }) })
  ] }) });
}
function Ji({ glance: e }) {
  const n = [
    /* @__PURE__ */ t(Ie, { tone: "brand", icon: /* @__PURE__ */ t(ua, { size: 18 }), value: e.headcount, label: e.headcount === 1 ? "person" : "people" }, "people"),
    e.joined > 0 && /* @__PURE__ */ t(Ie, { tone: "sky", icon: /* @__PURE__ */ t(Ve, { size: 18 }), value: e.joined, label: "joined this month" }, "joined"),
    !!e.probation && /* @__PURE__ */ t(Ie, { tone: "pop", icon: /* @__PURE__ */ t(yt, { size: 18 }), value: e.probation, label: "on probation", hint: "People still in their probation period, as Performance Hub had it this morning." }, "probation"),
    e.leaving > 0 && /* @__PURE__ */ t(Ie, { tone: "coral", icon: /* @__PURE__ */ t(pa, { size: 18 }), value: e.leaving, label: "leaving", hint: "People with a last working day set, who are still here." }, "leaving")
  ].filter(Boolean);
  return /* @__PURE__ */ s("div", { className: "hf-glance-wrap", children: [
    /* @__PURE__ */ t("div", { className: "hf-glance", role: "group", "aria-label": "People at a glance", style: { "--n": n.length }, children: n }),
    e.probation === null && /* @__PURE__ */ t("p", { className: "hf-unit-month__none", children: "On probation: not known today." })
  ] });
}
function ut({ month: e, title: n = "Waiting this month", footnote: a }) {
  return e ? /* @__PURE__ */ s("section", { className: "hf hf-card hf-unit-month", "aria-label": n, children: [
    /* @__PURE__ */ s("h3", { className: "hf-cap hf-unit-month__head", children: [
      n,
      " ",
      /* @__PURE__ */ s("span", { children: [
        "as of ",
        ft(e.day)
      ] })
    ] }),
    /* @__PURE__ */ t("ul", { children: e.apps.map((i) => /* @__PURE__ */ s("li", { children: [
      /* @__PURE__ */ t(Pe, { app: i.app, size: 32 }),
      /* @__PURE__ */ t("span", { className: "hf-unit-month__app", children: i.label }),
      /* @__PURE__ */ t("span", { className: "hf-unit-month__n hf-num", children: i.waiting ? `${i.waiting} waiting` : Yi(i) }),
      i.overdue > 0 && /* @__PURE__ */ s("span", { className: "hf-status hf-status--warn", children: [
        /* @__PURE__ */ t(bn, { size: 12, "aria-hidden": "true" }),
        i.overdue,
        " overdue"
      ] })
    ] }, i.app)) }),
    e.unknown.length > 0 && /* @__PURE__ */ s("p", { className: "hf-unit-month__none", children: [
      e.unknown.join(", "),
      " did not answer this morning: not known today."
    ] }),
    a && /* @__PURE__ */ t("p", { className: "hf-unit-month__foot", children: a })
  ] }) : /* @__PURE__ */ s("section", { className: "hf hf-card hf-unit-month", "aria-label": n, children: [
    /* @__PURE__ */ t("h3", { className: "hf-cap", children: n }),
    /* @__PURE__ */ t("p", { className: "hf-unit-month__none", children: "The first count is taken tomorrow morning." })
  ] });
}
function Bs({ crumbs: e, onCrumb: n, title: a, note: i, glance: r, month: l, units: o, people: c, onOpenUnit: h, onOpenPerson: u, feed: f, direction: d = "down" }) {
  const p = ke(() => Vi(c ?? []), [c]), [g, k] = z(null), m = p.find((w) => w.key === g), y = c ? c.filter((w) => !m || m.test(w)) : [], b = o ? o.length && o[0].level === "department" ? "Departments" : "Facilities" : "People", A = Wi(), [G, N] = z(!1), $ = l ? l.apps.reduce((w, T) => w + (T.waiting || 0), 0) : null, C = (w) => /* @__PURE__ */ s(j, { children: [
    /* @__PURE__ */ t("button", { type: "button", className: K("hf-chip", !m && "is-on"), "aria-pressed": !m, onClick: () => {
      k(null), w == null || w();
    }, children: "Everyone" }),
    p.map((T) => /* @__PURE__ */ t(
      "button",
      {
        type: "button",
        className: K("hf-chip", (m == null ? void 0 : m.key) === T.key && "is-on"),
        "aria-pressed": (m == null ? void 0 : m.key) === T.key,
        onClick: () => {
          k((m == null ? void 0 : m.key) === T.key ? null : T.key), w == null || w();
        },
        children: T.label
      },
      T.key
    ))
  ] });
  return /* @__PURE__ */ s("div", { className: K("hf hf-unitpage", `hf-slide--${d}`), children: [
    /* @__PURE__ */ t(In, { crumbs: e, onCrumb: n }),
    /* @__PURE__ */ s("header", { className: "hf-unitpage__head", children: [
      /* @__PURE__ */ t("h1", { className: "hf-display hf-unitpage__title", children: a }),
      i && /* @__PURE__ */ t("p", { className: "hf-unitpage__note", children: i })
    ] }),
    c && p.length > 0 && !A && /* @__PURE__ */ t("div", { className: "hf-chips", role: "group", "aria-label": "Filter people", children: C() }),
    c && p.length > 0 && A && /* @__PURE__ */ s("div", { className: "hf-chips hf-chips--phone", children: [
      /* @__PURE__ */ t("span", { className: "hf-chip is-on", "aria-live": "polite", children: m ? m.label : "Everyone" }),
      /* @__PURE__ */ t(ji, { count: m ? 1 : 0, onClick: () => N(!0) }),
      /* @__PURE__ */ t(ge, { open: G, onClose: () => N(!1), title: "Filter people", children: /* @__PURE__ */ t("div", { className: "hf-chips", role: "group", "aria-label": "Filter people", children: C(() => N(!1)) }) })
    ] }),
    /* @__PURE__ */ t(Ji, { glance: r }),
    /* @__PURE__ */ s("div", { className: "hf-unitpage__cols", children: [
      /* @__PURE__ */ s("section", { className: "hf-unitpage__kids", "aria-label": b, children: [
        /* @__PURE__ */ s("h2", { className: "hf-cap", children: [
          b,
          c && m ? ` · ${y.length} of ${c.length}` : ""
        ] }),
        o && /* @__PURE__ */ t("ul", { className: "hf-kids", children: o.map((w) => /* @__PURE__ */ t("li", { children: /* @__PURE__ */ s("button", { type: "button", className: "hf hf-card hf-kid hf-press", onClick: () => h == null ? void 0 : h(w), children: [
          /* @__PURE__ */ s("span", { className: "hf-kid__txt", children: [
            /* @__PURE__ */ t("span", { className: "hf-kid__name", children: w.name }),
            w.brand && /* @__PURE__ */ t("span", { className: "hf-kid__brand", children: w.brand }),
            /* @__PURE__ */ t("span", { className: "hf-kid__line", children: qi(w.glance) })
          ] }),
          /* @__PURE__ */ t(te, { size: 18, "aria-hidden": "true", className: "hf-kid__chev" })
        ] }) }, `${w.entity}-${w.department ?? ""}`)) }),
        c && /* @__PURE__ */ t("ul", { className: "hf-kids hf-kids--people", children: y.map((w) => {
          const T = /* @__PURE__ */ s(j, { children: [
            /* @__PURE__ */ t(oe, { name: w.name, size: 40 }),
            /* @__PURE__ */ s("span", { className: "hf-kid__txt", children: [
              /* @__PURE__ */ t("span", { className: "hf-kid__name hf-truncate", children: w.name }),
              w.designation && /* @__PURE__ */ t("span", { className: "hf-kid__line hf-truncate", children: w.designation }),
              (w.probation || w.joined) && /* @__PURE__ */ s("span", { className: "hf-kid__chips", children: [
                w.joined && /* @__PURE__ */ s("span", { className: "hf-status hf-status--ok", children: [
                  /* @__PURE__ */ t(Ve, { size: 12, "aria-hidden": "true" }),
                  "New"
                ] }),
                w.probation && /* @__PURE__ */ s("span", { className: K("hf-status", w.probation === "Extended" ? "hf-status--warn" : "hf-status--plain"), children: [
                  /* @__PURE__ */ t(yt, { size: 12, "aria-hidden": "true" }),
                  w.probation
                ] })
              ] })
            ] }),
            w.code && u && /* @__PURE__ */ t(te, { size: 18, "aria-hidden": "true", className: "hf-kid__chev" })
          ] });
          return /* @__PURE__ */ t("li", { children: w.code && u ? /* @__PURE__ */ t("button", { type: "button", className: "hf hf-card hf-kid hf-press", onClick: () => u(w), children: T }) : /* @__PURE__ */ t("div", { className: "hf hf-card hf-kid", children: T }) }, w.code ?? w.name);
        }) })
      ] }),
      A ? /* @__PURE__ */ s("aside", { className: "hf-unitpage__side hf-unitpage__side--phone", children: [
        /* @__PURE__ */ t(Vt, { title: "Waiting this month", count: $ != null ? `${$} waiting` : void 0, children: /* @__PURE__ */ t(ut, { month: l }) }),
        f && /* @__PURE__ */ t(Vt, { title: "What's happening", children: f })
      ] }) : /* @__PURE__ */ s("aside", { className: "hf-unitpage__side", children: [
        /* @__PURE__ */ t(ut, { month: l }),
        f
      ] })
    ] })
  ] });
}
function Ls({ crumbs: e, onCrumb: n, self: a, person: i, line: r, onOpenPerson: l, probation: o, waiting: c, direction: h = "down", stock: u, onStockRetry: f }) {
  const d = Ri(i.tenure_months), p = [i.department, i.entity].filter(Boolean).join(" · ");
  return /* @__PURE__ */ s("div", { className: K("hf hf-unitpage hf-person", `hf-slide--${h}`), children: [
    e.length > 0 && /* @__PURE__ */ t(In, { crumbs: e, current: i.name, onCrumb: n }),
    /* @__PURE__ */ s("section", { className: "hf hf-card hf-person__head", children: [
      /* @__PURE__ */ t(oe, { name: i.name, size: 64 }),
      /* @__PURE__ */ s("div", { className: "hf-person__txt", children: [
        /* @__PURE__ */ t("h1", { className: "hf-display hf-unitpage__title", children: a ? "Your page" : i.name }),
        i.designation && /* @__PURE__ */ t("p", { className: "hf-person__job", children: i.designation }),
        p && /* @__PURE__ */ t("p", { className: "hf-person__where", children: p }),
        i.start_date && /* @__PURE__ */ s("p", { className: "hf-person__where", children: [
          "Joined ",
          ft(i.start_date),
          d ? ` · ${d}` : ""
        ] })
      ] })
    ] }),
    /* @__PURE__ */ s("div", { className: "hf-unitpage__cols", children: [
      /* @__PURE__ */ s("div", { className: "hf-unitpage__kids", children: [
        (!o.known || o.stage) && /* @__PURE__ */ s("section", { className: "hf hf-card hf-person__probation", "aria-label": "Probation", children: [
          /* @__PURE__ */ t("h3", { className: "hf-cap", children: "Probation" }),
          o.known ? /* @__PURE__ */ s(j, { children: [
            /* @__PURE__ */ s("p", { className: "hf-person__stage", children: [
              /* @__PURE__ */ s("span", { className: K("hf-status", o.stage === "Extended" ? "hf-status--warn" : "hf-status--plain"), children: [
                /* @__PURE__ */ t(yt, { size: 12, "aria-hidden": "true" }),
                o.stage
              ] }),
              o.month_no && o.of_months ? /* @__PURE__ */ s("span", { className: "hf-num", children: [
                "Month ",
                o.month_no,
                " of ",
                o.of_months
              ] }) : null
            ] }),
            o.month_no && o.of_months ? /* @__PURE__ */ t("span", { className: "hf-month-pips", role: "img", "aria-label": `Month ${o.month_no} of ${o.of_months}`, children: Array.from({ length: o.of_months }, (g, k) => /* @__PURE__ */ t("span", { className: K("hf-month-pip", k < o.month_no && "is-on") }, k)) }) : null,
            o.end_date && /* @__PURE__ */ s("p", { className: "hf-person__where", children: [
              "Ends ",
              ft(o.end_date)
            ] })
          ] }) : /* @__PURE__ */ t("p", { className: "hf-unit-month__none", children: "Not known today: Performance Hub did not answer this morning." })
        ] }),
        u && /* @__PURE__ */ t(Ni, { stock: u, self: !!a, onRetry: f }),
        r.length > 0 && /* @__PURE__ */ s("section", { className: "hf hf-card hf-team", "aria-label": "Reporting line", children: [
          /* @__PURE__ */ t("h3", { className: "hf-cap hf-team__head", children: "Reporting line" }),
          /* @__PURE__ */ t("ul", { className: "hf-team__list", children: r.map((g) => {
            const k = /* @__PURE__ */ s(j, { children: [
              /* @__PURE__ */ t(oe, { name: g.name, size: 36 }),
              /* @__PURE__ */ s("span", { className: "hf-team__txt", children: [
                /* @__PURE__ */ t("span", { className: "hf-team__name hf-truncate", children: g.name }),
                g.designation && /* @__PURE__ */ t("span", { className: "hf-team__sub hf-truncate", children: g.designation })
              ] }),
              g.code && l && /* @__PURE__ */ t(te, { size: 16, className: "hf-team__chev", "aria-hidden": "true" })
            ] });
            return /* @__PURE__ */ t("li", { children: g.code && l ? /* @__PURE__ */ t("button", { type: "button", className: "hf-team__row", onClick: () => l(g.code), children: k }) : /* @__PURE__ */ t("div", { className: "hf-team__row", children: k }) }, `${g.name}-${g.code ?? ""}`);
          }) })
        ] })
      ] }),
      /* @__PURE__ */ t("aside", { className: "hf-unitpage__side", children: /* @__PURE__ */ t(
        ut,
        {
          month: c,
          title: a ? "Waiting for you" : `Waiting for ${wn(i.name)}`,
          footnote: "Counts only. What each one is stays in its app."
        }
      ) })
    ] })
  ] });
}
const pe = "__skipped__", Jt = ["", "Poor", "Below expectations", "Meets expectations", "Strong", "Excellent"], En = (e, n) => !!e && Object.entries(e).some(([a, i]) => i.includes(String(n[a] ?? ""))), Ze = (e, n) => !e.showWhen || En(e.showWhen, n), Oe = (e, n) => Ze(e, n) && (!e.optional || En(e.requiredWhen, n)), Be = (e) => e == null || e === "" || e === !1 || typeof e == "string" && !e.trim(), Qi = (e) => !Be(e) && e !== pe, Un = (e, n) => e.fields.filter((a) => Ze(a, n) && Qi(n[a.key])).length;
function Zi(e, n) {
  const a = e.minAnswered;
  return !a || Un(e, n) >= a.count ? null : `${a.word[0].toUpperCase()}${a.word.slice(1)} at least ${a.count}.`;
}
function Xi(e, n) {
  return e.fields.filter((a) => Oe(a, n) && n[a.key] !== pe && Be(n[a.key]));
}
function Qt(e) {
  const n = {};
  for (const a of e) for (const i of a.fields) i.value !== void 0 && i.value !== null && (n[i.key] = i.value);
  return n;
}
function Ki(e, n) {
  if (Be(n)) return null;
  const a = String(n).trim().toLowerCase();
  return (e ?? []).find((i) => i.code.trim().toLowerCase() === a) ?? null;
}
function er(e, n) {
  const a = {};
  for (const i of e) for (const r of i.fields) {
    if (!Ze(r, n)) continue;
    const l = n[r.key];
    if (l !== pe) {
      if (Be(l) && r.type === "person" && !Be(r.value)) {
        a[r.key] = "";
        continue;
      }
      Be(l) && r.type !== "check" || (a[r.key] = typeof l == "string" ? l.trim() : l ?? !1);
    }
  }
  return a;
}
function Zt(e) {
  if (!e.length) return null;
  const n = e[0], a = n.type === "scale" ? `a score for ${n.label}` : n.type === "check" ? `a tick for "${n.label}"` : n.type === "person" ? `someone for ${n.label}` : `"${n.label}"`;
  return e.length === 1 ? `Still needs ${a}.` : `Still needs ${a} and ${e.length - 1} more.`;
}
const st = (e, n) => {
  var a;
  return (a = e == null ? void 0 : e.steps) != null && a.length ? e.steps : (n == null ? void 0 : n.steps) ?? [];
};
function tr({ f: e, id: n, value: a, people: i, canClear: r, onChange: l }) {
  const [o, c] = z(!1);
  q(() => {
    var d;
    o && ((d = document.getElementById(n)) == null || d.focus());
  }, [o, n]);
  const h = Ki(i, a), u = ke(() => (i ?? []).map((d) => ({
    value: d.code,
    label: d.name,
    sub: d.sub ? `${d.code} · ${d.sub}` : d.code,
    codes: [d.code],
    keywords: d.sub ?? ""
  })), [i]);
  if (a != null && String(a).trim() !== "" && !o) {
    const d = (h == null ? void 0 : h.name) ?? String(a);
    return /* @__PURE__ */ s("div", { className: "hf-quick__person", children: [
      /* @__PURE__ */ t(oe, { name: d, size: 36 }),
      /* @__PURE__ */ s("span", { className: "hf-quick__pbody", children: [
        /* @__PURE__ */ t("span", { className: "hf-quick__pname", children: d }),
        /* @__PURE__ */ t("span", { className: "hf-quick__sub", children: h ? h.sub ? `${h.code} · ${h.sub}` : h.code : "Not on the staff list" })
      ] }),
      /* @__PURE__ */ t("button", { type: "button", className: "hf-btn hf-btn--quiet", "aria-label": `Change ${e.label}`, onClick: () => c(!0), children: "Change" }),
      r && /* @__PURE__ */ t("button", { type: "button", className: "hf-btn hf-btn--quiet", "aria-label": `Clear ${e.label}`, onClick: () => l(""), children: "Clear" })
    ] });
  }
  return /* @__PURE__ */ s(j, { children: [
    /* @__PURE__ */ t(
      ka,
      {
        id: n,
        label: e.label,
        hideLabel: !0,
        options: u,
        limit: 8,
        placeholder: e.placeholder ?? "Type a name or employee code",
        onPick: (d) => {
          l(d.value), c(!1);
        },
        empty: (d) => d.trim() ? `Nobody on the staff list matches “${d.trim()}”.` : "Type a name or employee code."
      }
    ),
    o && /* @__PURE__ */ s("button", { type: "button", className: "hf-btn hf-btn--quiet hf-quick__keep", onClick: () => c(!1), children: [
      "Keep ",
      (h == null ? void 0 : h.name) ?? String(a)
    ] })
  ] });
}
function nr({ ctx: e, first: n, open: a }) {
  var o, c, h, u, f, d;
  const [i, r] = z(a);
  return ((o = e.profile) == null ? void 0 : o.length) || e.callout || e.notes || ((c = e.history) == null ? void 0 : c.length) || ((h = e.links) == null ? void 0 : h.length) ? /* @__PURE__ */ s("section", { className: "hf-quick__ctx", "aria-label": `About ${n}`, children: [
    /* @__PURE__ */ s("button", { type: "button", className: "hf-quick__ctxtoggle", "aria-expanded": i, onClick: () => r((p) => !p), children: [
      /* @__PURE__ */ s("span", { children: [
        "About ",
        n
      ] }),
      /* @__PURE__ */ t(bt, { size: 16, "aria-hidden": "true" })
    ] }),
    i && /* @__PURE__ */ s("div", { className: "hf-quick__ctxbody", children: [
      !!((u = e.profile) != null && u.length) && /* @__PURE__ */ t("dl", { className: "hf-quick__grid", children: e.profile.map((p) => /* @__PURE__ */ s("div", { children: [
        /* @__PURE__ */ t("dt", { children: p.label }),
        /* @__PURE__ */ t("dd", { children: p.value })
      ] }, p.label)) }),
      e.callout && /* @__PURE__ */ s("div", { className: "hf-quick__callout", children: [
        /* @__PURE__ */ t("p", { className: "hf-quick__ctitle", children: e.callout.title }),
        /* @__PURE__ */ t("ul", { children: e.callout.lines.map((p) => /* @__PURE__ */ t("li", { children: p }, p)) }),
        e.callout.note && /* @__PURE__ */ t("p", { className: "hf-quick__cnote", children: e.callout.note })
      ] }),
      e.notes && /* @__PURE__ */ s("div", { className: "hf-quick__notes", children: [
        /* @__PURE__ */ t("p", { className: "hf-quick__ctitle", children: e.notes.title }),
        /* @__PURE__ */ t("p", { children: e.notes.text })
      ] }),
      !!((f = e.history) != null && f.length) && /* @__PURE__ */ s("div", { children: [
        /* @__PURE__ */ t("p", { className: "hf-quick__ctitle", children: "Interview history" }),
        /* @__PURE__ */ t("ul", { className: "hf-quick__hist", children: e.history.map((p, g) => /* @__PURE__ */ s("li", { className: `is-${p.outcome ?? "open"}`, children: [
          /* @__PURE__ */ t("span", { className: "hf-quick__dot", "aria-hidden": "true", children: p.outcome === "pass" ? "✓" : p.outcome === "fail" ? "✕" : "·" }),
          /* @__PURE__ */ s("div", { children: [
            /* @__PURE__ */ t("p", { className: "hf-quick__htitle", children: p.title }),
            p.sub && /* @__PURE__ */ t("p", { className: "hf-quick__sub", children: p.sub }),
            p.quote && /* @__PURE__ */ s("p", { className: "hf-quick__quote", children: [
              "“",
              p.quote,
              "”"
            ] })
          ] })
        ] }, `${p.title}-${g}`)) })
      ] }),
      !!((d = e.links) != null && d.length) && /* @__PURE__ */ t("div", { className: "hf-quick__links", children: e.links.map((p) => /* @__PURE__ */ s("a", { href: p.href, target: "_blank", rel: "noopener", children: [
        /* @__PURE__ */ t(ot, { size: 14 }),
        " ",
        p.label,
        " ",
        /* @__PURE__ */ t(We, { size: 12 })
      ] }, p.href)) })
    ] })
  ] }) : null;
}
function $s({ form: e, open: n, onSave: a, onClose: i }) {
  var Q, Z, re, de;
  const [r, l] = z([]), [o, c] = z(0), [h, u] = z(0), [f, d] = z({}), [p, g] = z(!1), [k, m] = z([]), [y, b] = z(!1), [A, G] = z(null);
  q(() => {
    !n || !e || (l(e.items), c(0), u(0), d(Qt(st(e.items[0], e))), g(!1), m([]), G(null));
  }, [n, e]);
  const N = r[o], $ = ke(() => st(N, e), [N, e]);
  if (!e || !N || !$.length) return /* @__PURE__ */ t(ge, { open: n && !!e, onClose: () => i(k), title: (e == null ? void 0 : e.title) ?? "", children: /* @__PURE__ */ t("p", { className: "hf-muted", children: "Nothing is waiting here any more." }) });
  const C = $[h], w = h === $.length - 1, T = o === r.length - 1, P = Xi(C, f), B = Zi(C, f), I = (v, E) => {
    d((X) => ({ ...X, [v]: E })), G(null);
  }, ne = e.unit.toLowerCase();
  async function M() {
    if (P.length || B) {
      g(!0);
      return;
    }
    if (g(!1), !w) {
      u(h + 1);
      return;
    }
    b(!0);
    try {
      await a(N, er($, f));
      const v = [...k, N.id];
      if (m(v), T) {
        i(v);
        return;
      }
      c(o + 1), u(0), d(Qt(st(r[o + 1], e)));
    } catch (v) {
      const E = v;
      if (G({ text: (E == null ? void 0 : E.message) || "That didn't save. Try again, or open it in the app.", field: E == null ? void 0 : E.field }), E != null && E.field) {
        const X = $.findIndex((se) => se.fields.some((ae) => ae.key === E.field));
        X >= 0 && u(X);
      }
    } finally {
      b(!1);
    }
  }
  const J = w ? T ? "Save" : `Save and next ${ne}` : "Next";
  return /* @__PURE__ */ t(ge, { open: n, onClose: () => i(k), title: e.title, guard: !0, children: /* @__PURE__ */ s("div", { className: "hf-quick", children: [
    /* @__PURE__ */ s("div", { className: "hf-quick__app", children: [
      /* @__PURE__ */ t(Pe, { app: e.app, size: 28 }),
      /* @__PURE__ */ t("span", { children: e.appName })
    ] }),
    r.length > 1 && /* @__PURE__ */ s("div", { className: "hf-quick__run", "aria-label": `${e.unit} ${o + 1} of ${r.length}`, children: [
      /* @__PURE__ */ s("span", { children: [
        e.unit,
        " ",
        o + 1,
        " of ",
        r.length
      ] }),
      /* @__PURE__ */ t("span", { className: "hf-quick__dots", "aria-hidden": "true", children: r.map((v, E) => /* @__PURE__ */ t("i", { className: E < o ? "is-done" : E === o ? "is-on" : "" }, v.id)) })
    ] }),
    /* @__PURE__ */ s("div", { className: "hf-quick__who", children: [
      /* @__PURE__ */ t(oe, { name: N.name, size: 44 }),
      /* @__PURE__ */ s("div", { children: [
        /* @__PURE__ */ t("p", { className: "hf-quick__name", children: N.name }),
        N.sub && /* @__PURE__ */ t("p", { className: "hf-quick__sub", children: N.sub }),
        N.when && /* @__PURE__ */ t("p", { className: "hf-quick__sub", children: N.when }),
        !!((Z = (Q = N.context) == null ? void 0 : Q.chips) != null && Z.length || (re = N.facts) != null && re.length) && /* @__PURE__ */ t("div", { className: "hf-quick__facts", children: [...((de = N.context) == null ? void 0 : de.chips) ?? [], ...N.facts ?? []].map((v) => /* @__PURE__ */ t("span", { children: v }, v)) })
      ] })
    ] }),
    N.context && /* @__PURE__ */ t(nr, { ctx: N.context, first: N.name.split(" ")[0], open: h === 0 }, `${N.id}-${h === 0}`),
    $.length > 1 && /* @__PURE__ */ t("ol", { className: "hf-quick__steps", children: $.map((v, E) => /* @__PURE__ */ t("li", { className: E === h ? "is-on" : E < h ? "is-done" : "", children: v.title }, v.title)) }),
    (C.legend || C.minAnswered) && /* @__PURE__ */ s("div", { className: "hf-quick__legend", children: [
      C.legend && /* @__PURE__ */ t("span", { children: C.legend }),
      C.minAnswered && /* @__PURE__ */ s("span", { className: p && B ? "is-bad" : "", children: [
        Un(C, f),
        " of ",
        C.fields.length,
        " ",
        C.minAnswered.done ?? "answered",
        " · at least ",
        C.minAnswered.count
      ] })
    ] }),
    /* @__PURE__ */ t("div", { className: "hf-quick__fields", children: C.fields.filter((v) => Ze(v, f)).map((v) => {
      var se, ae;
      const E = p && P.includes(v) || (A == null ? void 0 : A.field) === v.key, X = `hf-q-${v.key}`;
      return /* @__PURE__ */ s("div", { className: `hf-quick__f${E ? " is-bad" : ""}`, children: [
        v.type !== "check" && /* @__PURE__ */ s("div", { className: "hf-quick__labelrow", children: [
          /* @__PURE__ */ s("p", { className: "hf-quick__label", id: `${X}-l`, children: [
            v.label,
            !Oe(v, f) && !v.skipLabel && /* @__PURE__ */ t("span", { children: " (optional)" })
          ] }),
          v.skipLabel && /* @__PURE__ */ t(
            "button",
            {
              type: "button",
              className: `hf-quick__skip${f[v.key] === pe ? " is-on" : ""}`,
              "aria-pressed": f[v.key] === pe,
              onClick: () => I(v.key, f[v.key] === pe ? "" : pe),
              children: v.skipLabel
            }
          )
        ] }),
        (((se = N.hints) == null ? void 0 : se[v.key]) ?? v.hint) && /* @__PURE__ */ t("p", { className: "hf-quick__hint", children: ((ae = N.hints) == null ? void 0 : ae[v.key]) ?? v.hint }),
        v.type === "scale" && f[v.key] === pe && /* @__PURE__ */ s("p", { className: "hf-quick__skipped", children: [
          v.skipLabel,
          ": left out of the score."
        ] }),
        v.type === "scale" && f[v.key] !== pe && /* @__PURE__ */ s(j, { children: [
          /* @__PURE__ */ t("div", { className: `hf-quick__scale${(v.max ?? 5) > 5 ? " hf-quick__scale--wide" : ""}`, role: "radiogroup", "aria-labelledby": `${X}-l`, children: Array.from({ length: v.max ?? 5 }, (R, x) => x + 1).map((R) => /* @__PURE__ */ t(
            "button",
            {
              type: "button",
              role: "radio",
              "aria-checked": f[v.key] === R,
              "aria-label": (v.max ?? 5) === 5 ? `${R}, ${Jt[R]}` : `${R} of ${v.max}`,
              className: f[v.key] === R ? "is-on" : "",
              onClick: () => I(v.key, f[v.key] === R && !Oe(v, f) ? "" : R),
              children: R
            },
            R
          )) }),
          (v.max ?? 5) === 5 && /* @__PURE__ */ t("p", { className: "hf-quick__word", "aria-live": "polite", children: f[v.key] ? Jt[Number(f[v.key])] : "" })
        ] }),
        v.type === "choice" && /* @__PURE__ */ t("div", { className: "hf-quick__pills", role: "radiogroup", "aria-labelledby": `${X}-l`, children: (v.options ?? []).map((R) => /* @__PURE__ */ t("button", { type: "button", role: "radio", "aria-checked": f[v.key] === R, className: f[v.key] === R ? "is-on" : "", onClick: () => I(v.key, R), children: R }, R)) }),
        v.type === "text" && /* @__PURE__ */ t(
          "textarea",
          {
            id: X,
            "aria-labelledby": `${X}-l`,
            rows: 3,
            value: String(f[v.key] ?? ""),
            placeholder: v.placeholder,
            onChange: (R) => I(v.key, R.target.value),
            "aria-invalid": E
          }
        ),
        v.type === "person" && /* @__PURE__ */ t(tr, { f: v, id: X, value: f[v.key], people: e.people, canClear: !Oe(v, f), onChange: (R) => I(v.key, R) }),
        v.type === "check" && /* @__PURE__ */ s("label", { className: "hf-quick__check", children: [
          /* @__PURE__ */ t("input", { type: "checkbox", checked: !!f[v.key], onChange: (R) => I(v.key, R.target.checked) }),
          " ",
          v.label
        ] }),
        E && !A && /* @__PURE__ */ t("p", { className: "hf-quick__err", role: "alert", children: v.type === "scale" ? `Pick a score from 1 to ${v.max ?? 5}.` : v.type === "text" ? "Add a line or two." : v.type === "check" ? "Tick this to go on." : v.type === "person" ? "Choose someone." : "Choose one." })
      ] }, `${N.id}-${v.key}`);
    }) }),
    A && /* @__PURE__ */ t("p", { className: "hf-quick__err hf-quick__err--save", role: "alert", children: A.text }),
    p && (Zt(P) ?? B) && /* @__PURE__ */ t("p", { className: "hf-quick__missing", role: "status", children: Zt(P) ?? B }),
    /* @__PURE__ */ s("div", { className: "hf-quick__foot", children: [
      h > 0 && /* @__PURE__ */ t("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: () => u(h - 1), disabled: y, children: "Back" }),
      /* @__PURE__ */ t("button", { type: "button", className: "hf-btn hf-btn--primary", onClick: M, disabled: y, children: y ? "Saving…" : J })
    ] }),
    e.openUrl && /* @__PURE__ */ s("a", { className: "hf-quick__open", href: e.openUrl, target: "_blank", rel: "noopener", children: [
      "Open in ",
      e.appName,
      " ",
      /* @__PURE__ */ t(We, { size: 13 })
    ] })
  ] }) });
}
function Ts({ text: e, action: n, onDone: a, ms: i = 5e3 }) {
  return q(() => {
    if (!e) return;
    const r = window.setTimeout(a, i);
    return () => window.clearTimeout(r);
  }, [e, i, a]), e ? /* @__PURE__ */ s("div", { className: "hf hf-toast", role: "status", children: [
    /* @__PURE__ */ t("span", { children: e }),
    n && /* @__PURE__ */ t("button", { type: "button", onClick: () => {
      n.onClick(), a();
    }, children: n.label })
  ] }) : null;
}
const Ds = {
  performance: "data:image/webp;base64,UklGRgIFAABXRUJQVlA4WAoAAAAgAAAAVwAAVwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggFAMAAPASAJ0BKlgAWAA+USSPRSOiIZVbVKw4BQSxgGoAiR0vg1DQwsfEA6YfmA/gHSl9ADpAN5W/bP9a5q/w52UOiDX1/kBxAdzPG9pGppPkVzS+qT+03sAGPgLIYiXV9ejQwgLcUuNzMWnk1ZI1EH9d4FbWj9ICKNaQ7y0Ue6yQ0SxfKLkjK6TIaVbPETgY2K3ZahH9l87k0rsr9iLuG1P9/AAA/v3Aghu2439Qd9ndP6czgI92SKFEwS5tiwZfn9orR4ghd+3i+wDXXxj/7f/5PvVLW+mUuzj//aPeUUAG30/U1yK0a0SnsdBZuB4JTn5R7gjWKpVH5Ww+NU6SZX+jARJ7/1YH36tmJQ9Ew5MMsyGQK+JkqfKx+37xM7L4V0BYzQkz7Rwp6jCAe1RFI2xVNr+6l6Idg6slM/prv1IaHbl4URcYl5uFbt6ohiM0xvmkO6hexgDu1p+rUeVJjaZqUI7jPJa+EpretNQywg8H2OZ/dcaD1S+jDJXY1IR/sf3fXF/4avpG7HPofHtKo5Gj+vUjTha2ltklbV0BmS5UfzY/hypLTpIuf3HeqcxXidxUBNgdh/HH3MzI5upJnRIxx8iYUPuntMGforRxMnGZSg/uqMKZVo9hCTX0RMOH/06//5zhVXGFQ6zXIg/fIChXJvvfslt0E6Cyo2vW5wnQWVGidPIX8NB1jSOakUlCsg4v6I02BzXPTGZ0O/pb3oVuFblfnIPEafJLCLpY0VXxDvq9KkSrjrN+1msf9H/+fnUyFe1PiJ4cgFfUybZk0S8QFe6T57C0vBLD8+981yMVEGDvUwext8MW8D1ZJs+YuMQcO/2AV61JNOhzxsSbZ9I5514/sMVL2GfeTTYlPe+vj8j/B/d8FBOHrzp8QCereJC/VO33BQNguDqaJTgZOWOihdi0fAvBmh02qRuM69inkOEH1PU8uj1GPubjSExKXCbhuYhZf2EghBf/9kw8B/7tDja5egGGS1HvOLAx5mDdBkg+qzSIhUpc2mx0dxtH9HRyhaZBO+Yx0ibj/h7SU2lg/gAAAAAA",
  recruitment: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='s' x1='10' y1='95' x2='90' y2='5' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%231F2530'/%3E%3Cstop offset='1' stop-color='%2366738C'/%3E%3C/linearGradient%3E%3ClinearGradient id='a' x1='40' y1='62' x2='92' y2='38' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23C2441A'/%3E%3Cstop offset='1' stop-color='%23FFB772'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpolygon points='22,12 70,12 70,28 32,28 32,72 70,72 70,88 14,88 14,20' fill='url(%23s)'/%3E%3Cpolygon points='40,38 76,38 92,50 76,62 40,62' fill='url(%23a)'/%3E%3C/svg%3E",
  apml: "data:image/webp;base64,UklGRmoFAABXRUJQVlA4WAoAAAAgAAAAVwAAVwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggfAMAAPASAJ0BKlgAWAA+USiPRSOioROc/Ug4BQSgDVLTG7hwfRv+wEIB5gOhbvCv7VewB0sb74pxrQ5YGk7meeMqix9cHoS/qqXpY3x655dradJOzRa5ms/yHQwuXAKJQlY5EWIq4//Oa5tIqXEOwztiDQyE8xcj4axcbNsUKo4plJ0P7PptSSZjYTcgKbqkg2WyqrM198RH8JTzOqYGwm6fNwAA/v3Ague+W+LHH/elKq59V8aAMIr3lwXTM8h/+Ll/UftLuAnNo98V+oOrz9t17gWu8hj/dw870eqmFUQkDw4fwHABx11jSq+l/82//xYfugGX8XBAm+Wk9QnM75QRS+dIB7UV5rhoFLcHX7rJfclqN0d2iCJm+1LsxuDpj4rDL97LZJTDrBf+aUnu5ZZGYLWlcqRi4+WwQMZen1XJafOWlb9OJ+l30Ymk2TEBXkTSBK8kIgfGl04AEbXmTKHSG59Qm5h7iGuNHqaw620sjGXnclN2ReYclfZWLO9pJcIUq1ajIyqneO5OfrThtcIPmdpkrzaf0rP6QE3lmmtFZmqvQuEYi+fV/CeA3I1CXZUsV22jItfKqsGVHAuR2uhynXblcw9temOKkq165KpLk1kwgsMUyv3itFYaSmoIl7SIJYPNP2ph6xdqA0aDCllkboZNxSxOUBIHg7ky1M6wL2cTSUZg6p/p6v1dAGDPcIhYIb2SZxQqmdF9tqJLbKMMboxCBQ9q0q6/KGv2SuEX/8eo0Pnx03YBMsZ+CiZA2HfT5LD7jDcr6/S6369hQ+3s3KvjLksNJyz6QH4+giUQWxOe1GOtgbe35kUJjrIfC6IRGng5rr1g4ehimy3EyHo8CoSUMtwNWrG1pt8yAug1jDC4UOZ06CnRlwRX5SZgh2y7w2Opx3LEzUVO/Tov1gegpVKYLem/6yMP88sByGiTOpSziJW5zrW0Mwb7QgPNVBz9wERNFm3Al64zmCqOA43nLHrFT1kOq0ZKOvt/T3hxdP/nwwl9ldfnJi6YReYIyEE8JGtDdfWXDW/7IduWDzwPApwbipHMIo+miBrHrTpOeJF54DQ6XlehVGdalS9BMJyErPHbOSARbQIRh94q7XwUmEhM0hRmJ9W/hi5kmh5L9Y03UcMvUO5qx1HnvgcjJpLajuWVQ8FIsp3nsfN+SgOkvH0XtFgniSgKGoQAAAA=",
  learning: "data:image/webp;base64,UklGRmYMAABXRUJQVlA4WAoAAAAwAAAAPwAAPwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZBTFBIvQYAAA3whv2TIVnbtv0ismoO27Zt27Ztc3GOdZhz2MexcNi2bdu2vY7FWVUR8aGqenqOkx8jYgL4v2N6YPWRWomO71f+VQIkJn9z6kIqNsmTG3rvJNsNn5QashFOrUxKRjX5WtNfnawXpJxqf4J6caUxJGpABg3+RaJ96n0ox2tAokmQOrV5Nz9bvW1aLLQmid5VDn7iXfV2wXFY1ktikx95Au1OxUYTRgYQFQlpComKAMm3H3VvsrZI2dFJCBAiAOpNggARQvW408ZItEN9XyynOnycIFk5RYP/mUqI8SYFUFt+ySHqbZByxl1QIOS7bYdnIcV0SgDBiA3+yEPKSW+dOQSUAdd+K9Ez9YFYBrieTxoLQbP/6hDp50cOcwWxWXfpUu+RFsssiQKef/AcIQABqAMC4AxZdWFXUPZ960X1ngTHYRkQciapoFFMAqISafjgviEgNuHAE4IepnJbrAPw/OVPcZrTsq94UO9cO89KrpB844luSdaSlBP1QajtIpUNWbnDIRfekJV1kcaePZD6Y8/9S6IV9cOwHLD8obFSUp+6V96JS294MlkNJneNv4ElUFtsjQvVW9Birs1QIJKfjkSdFnOcTDH5kGM+U69B/bSBKQSUI+/6VL0JjsIywNPNaEmt2MRXYOPbHOfsNkKixvTJn7Y3BbFp9z+FZi1Xnz0SENmYC2g1PIVAmdFq12ETh0CKPb5+XL1GTI/FKpauIhUNoSN2P33eYvwvBiDe4OmNN/ZwBTw79sRSoqK+O9YBRP7HlYRG1ODpq85LpxxxAKmkXqTk7D2nDoFka8x5lTog5dT7IQCuF5MKSB4VLD139eD9yLqpFS2D9OlDB7oCwqAhP0uAeh8sBzz/9m6cVd/7VZIHgMnNZ2ZSUBU1m2qhZ5wLN5/dFbScd/Nz1NFi4dVRgJBzScbx2w6+5ndJ4UD4m0pV1GyKXQ946jjRH248PARIHPzU2woci2WA5x88jwvFzJ3r3Dr4e1EcQktAxWyGA7YOfgRn6MqLuILY5EeeAL7RhJ4DhJxJKgWlmGW/bR++6DMUx0Exn+uQdYnuDgkiDb+0XwiQfNsx99JxFLXW8eJnONXkNvUeu7923ttIgBiLHr40UaacqnPd3Cu5Uj3+VA7EciASXaSyBlW3Sbff/6tzXgRiub6zE2XK8ZpI3Wd2SgioLbc0+6BU9KPvcZpVwybY7Mjvdu7Ob5qJsJRRlQCMR2ed3wUQ9mbYPq6AxAIzP6YOhFAVjSJf/a2/Jl2GIk/UG0CydQgFCLmMS5ZdzhXEdMBZ4yQgUaoCSKJU3PKMWvcsK0HKrG+d56+9xrhTj6eabOW5r1WXeHqliaJUpZoMUWrd847yOUB9Zyyn9njQe0dvZwkQ+l06XExOuHH/3aaOUhItW+Tpz2suQUzKiQ9AACy/DQVOPHKyEFBbZKVh6iGfXfjYtvvOHIZKg5Hrj0NvQcRR3wfLgchGnAN4evupg10B4Yjrf5QIle8H377uIXNHqZUQy+WLCx5FkgVSTrcjAmDpIlIBztlbzOMKarNvdpE6jqTfrrpy2T6L4Eog2XvnvYIkM0D9ECwHvOOLu3Ag0s9DBoUAykEPfaIO4ZJG3HjR3J3LeIi+3vU5kswAtJhzfRQg5BRSCeBcNcealkDKafc4WwIgXNLYu8+aZVLG7fg9ksyoleiDZYB1PPMFTjW0PPHYLAQSu7/1ujrVcEndz8HIlyWVTr0Wiy2JAqifiFoNrk98tYcpiE186Ok0h6MOak6rA7EMsOxKtKTFU/ebNgQ0tvvpKfU6wAGnxVSsNn0kILLfh9Cqp0/uPtIVxLIBpwXtdzqxius5pKIFnAvWWtQVkm843l3J2pXKzfEc8Py9J3FajTT8nGNDqHae2S3RHinzPjSeSCpbwuTmiTa1BGorznOdenvUd8FywPIHRklJDyVO6JwgBIR+g//SqESTVKSYeH8EiKy7C4meeHrpjf1cQW2RlYeKV1qMisZ+WA64DiUV9Njp2nm2EFAOe/iX8QOxX71Op1GQsdOtiwKR/XANTs8jfXtdf1cQZr510lIi/2mb3yVAYpIHpywksr8DAVy7SGUbcIYsubwrwGQdEGR/OrU6BRlIBIDnr76B085IY047TgAkAhBXGkMCEKnACaSyLZjeO3pbS4BQlWgShEbLb0EL2n5Cn8lC6NXIRpxD+z2988QhlnrH9SJS0Tacs7eY17ROQppCos47Pr8Lp/2Rfhk8SGhUbxKkDk4hlb2AcfUMa/6tFcnKSRri71TW2GSP/4TRu7bhU3iFcUAAwV9L/EZUGMF/nwBWUDggsgMAADATAJ0BKkAAQAA+tUqdSyckIqGsGqwA4BaJbA21LhWIolQtGE0vDb5PfbO5YC/7h6gNsR5gPPE9C/+M9QD9kusK9ADy3P28+C392vSA0oPYj2M/2uWDwW40++tvefXvRA/YBKd9vg9BD/9PQktSkEbcOMNT9uVL+Beocvog0XzI4zDPy7i7uWXj5NvyUOjYGm+E5AUWdgqh86T0r+eTmh1UgAD++Zt//n4WP4vHvTrlJD/TnBehZOgWb13AqBVGdU0Y/TabcvDWQWzsqHD9JNtBHyaSEmxBn99VoMTAPPlei5qGjg/tunXiESVaylzHnjdrjvegfUtTkB5n1sIW2C2h4PQwygxwsKQWlwGUPDePGRv8/99JKq3hu+7EvTzp9IHmJPnPHCm/HVyBpMZGM9wDdfl9bSWaryF6+jMjppiiv0L9PWYIeYqV8uVbFw+pL8iWFovLxssge6f6I1gp5VyjvVbIeZnNB04kqqlIu+pWzCYdl9Y1bU5STFKvL+EGagnPRhARLSkzg0ebb40EwtwYqx9mDjaG8f4MioFXOsRiXsH0NwY6KP63Xu6zT4ourcpoFmn2F3/DXu+vJuZyaIycDa47wtEZdofvd7KsfKzfuXQiBoZhna7yexqHcss81aMXCu4DUStA0IPge7jwaPuFXIJyWItzR6xpYsdDVqO7QfSVGnHHordk86iITCSlFk8KPF02fVzLSVIyMvMsT+Sc2dyjnRvUGVc9pSsYXJNSfOWSVBFNhIe4HH58dblqoCDqPMdb4gr0dxxHeo541xXlJrIYP5Cf8RHYAGzG+kRn62P0diPt/IRe+dkE3jirosp177z5HO5JRSOqJVZQ1XzxqWp0J+TSW5XwQP3H3+yFru35cRkA+xUPXH1q+nP/TCZZVuvsM5W+VEf0aYgkPl6lKIdUjpqCmWj/MswDu3DJQ19AiCTTwOZiTc1ev8az+Tu2NDN7bf1saP2KAokSrZM2gE9eNIaA2QAsinUjVTJ+O5FOPnrax0RxFTXA4AHsN3GV8+4YKPvTDc4z1vs8UqqQGTKvJY7KQni+l/o3//De1Pc7m7PDOX0Iaf+7WX0GnvTTiEaO5g/lSwx7TaZ50mP9txAOc+cAuez4YUpjiioFQslNKEYUJCzF+VgxsGoXFl9tlWQpoEtVPW/eJ/OWfarqbrzaM1ihb//D9055nj7vjmZLNwahDgPf3+5UhOue42UmVPS9QOyahXzQhDTtuDp1ORjX85lUfhMfXHUIXfP4AAA=",
  logistics: "data:image/webp;base64,UklGRmoEAABXRUJQVlA4WAoAAAAgAAAAVwAAVwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggfAIAAPANAJ0BKlgAWAA+USKPRKOsIZVbVYDABQSygGna2A9F1vBuEDubzHOermuHn0RwlXN2YDYXpPkXTScZD3KX1amRirtex3IDM0F+hi7s4wPJyZigXDPJcGBnwPYy5AnDHv6vMSTJeAF4jMjFARb6sXVKOcPP2H9IAAD+/cCARf2S9MbeF/hMv+SG9PgmY/gtrb34dRABGF9e/4jN5E/xiI41rcCbtX5gogrjDDMT9WT58IWBJu+xfFe9BPPRjh3WOZts/9S5UQDe+BUYkAxruDXttiZNucLZJdRhP4G0m0N9jB/V6HCu0s/ZfxY7macldCWFOq4GtdAkq+//Rx7jXs8J6Y6laMmd1s/4Pv/9Y5G/F4o7ACbrf1POgcZe7xYGpEtlsSqmwp3dXRe3/z//aYnLP/agr1/h7/RNNriO5DvBAISOD/Fiv/b2FBeWc1qHHp3dMztltF5d2wUTXKcX3kLMNOpoCILgGGnUT4mQAnEOAcHz0h+Xs67aYCJMn7/Ad7/TdAxRM2S+vOvv9dtvn54HFDrFD9g38DboorIlPTDjrvC+g1uZJ7/kZdzOtoe0hhqJvvZSl7Hqj/j8EfoqSIdtCfwe86yL0IDfG135qjyty7Y8FFREbLSoH6Z5HTXi48qzE1UGFAwjEBhj33y63+DjHoOF1W2sW//tfogu+c9wrMnf7wR506OmzeYn+P15B9zLyxe/WOCbj80Z7AprMDfgU+L/A4CoSZq7PdEDAcFzhZYrC1JKmMaWyMOLXln98lC3QB+1K37fFgDUtFFez4zPqL3P7PZbNWkTOxrhe1XB/av9HrgdCih2jzqFEAJiNj1F2SLZDoYAAAAAAA=="
};
function On({ h: e, className: n }) {
  return /* @__PURE__ */ s("span", { className: n, style: { background: e.bg, color: e.fg }, children: [
    /* @__PURE__ */ t("span", { className: "hf-lanehead__t", children: e.text }),
    e.aside != null && /* @__PURE__ */ t("span", { className: "hf-lanehead__a", children: e.aside })
  ] });
}
const ar = 320, ir = 6, Xt = 72;
function rr() {
  const e = "(max-width: 1023px)", [n, a] = z(() => {
    var i;
    return typeof window < "u" && !!((i = window.matchMedia) != null && i.call(window, e).matches);
  });
  return q(() => {
    var l;
    const i = (l = window.matchMedia) == null ? void 0 : l.call(window, e);
    if (!i) return;
    const r = () => a(i.matches);
    return r(), i.addEventListener("change", r), () => i.removeEventListener("change", r);
  }, []), n;
}
function Kt({ c: e }) {
  return /* @__PURE__ */ s(j, { children: [
    e.head && /* @__PURE__ */ t(On, { h: e.head, className: "hf-lanehead" }),
    /* @__PURE__ */ s("span", { className: "hf-lanecard__top", children: [
      e.icon && /* @__PURE__ */ t("span", { className: "hf-lanecard__ic", "aria-hidden": "true", children: e.icon }),
      /* @__PURE__ */ t("span", { className: "hf-lanecard__t", children: e.title }),
      e.extra
    ] }),
    e.sub && /* @__PURE__ */ t("span", { className: "hf-lanecard__s", children: e.sub }),
    e.chips && /* @__PURE__ */ t("span", { className: "hf-lanecard__chips", children: e.chips })
  ] });
}
function Gs(e) {
  const { label: n, lanes: a, items: i, laneOf: r, itemKey: l, itemName: o, card: c, onOpen: h, onMove: u, leading: f, empty: d, initialLane: p, totalOf: g } = e, k = rr(), m = a.map((_) => _.key), y = (_) => {
    var S;
    return ((S = a.find((D) => D.key === _)) == null ? void 0 : S.label) ?? _;
  }, b = (_) => i.filter((S) => r(S) === _), A = (_) => i.find((S) => l(S) === _) ?? null, G = m.find((_) => b(_).length) ?? m[0], [N, $] = z(p ?? G ?? ""), [C, w] = z(null), [T, P] = z({ x: 0, y: 0 }), [B, I] = z(null), [ne, M] = z(null), [J, Q] = z(""), Z = Y(null), re = Y({}), de = Y({}), v = Y(null), E = Y(null), X = Y(null), se = Y(0), ae = Y(null), R = Y(!1), x = !!u, F = Ae((_, S) => {
    let D = null, L = 1 / 0;
    for (const U of m) {
      const ie = re.current[U];
      if (!ie) continue;
      const H = ie.getBoundingClientRect();
      if (S < H.top - 40 || S > H.bottom + 40) continue;
      if (_ >= H.left && _ <= H.right) return U;
      const le = Math.abs(_ - (H.left + H.width / 2));
      le < L && (L = le, D = U);
    }
    return D;
  }, [m.join("|")]), W = (_, S, D) => {
    const L = { id: _.id, from: _.from, w: _.rect.width, h: _.rect.height, offX: S - _.rect.left, offY: D - _.rect.top };
    if (E.current = L, X.current = _.from, w(L), P({ x: S, y: D }), M(_.from), I(null), _.touch && navigator.vibrate)
      try {
        navigator.vibrate(12);
      } catch {
      }
    const U = A(_.id);
    Q(U ? me.lifted(o(U)) : "");
  }, O = (_) => {
    const S = E.current, D = X.current;
    if (E.current = null, X.current = null, se.current = 0, ae.current && cancelAnimationFrame(ae.current), ae.current = null, w(null), M(null), !S) return;
    R.current = !0, setTimeout(() => {
      R.current = !1;
    }, 0);
    const L = A(S.id);
    L && (_ && D && D !== S.from && u ? (u(L, D), Q(me.moved(o(L), y(D)))) : Q(me.notMoved(o(L))));
  };
  q(() => {
    if (k || !x) return;
    const _ = (H) => {
      var Lt;
      const le = v.current;
      if (le && !E.current) {
        const $t = Math.hypot(H.clientX - le.x, H.clientY - le.y);
        if (le.touch) {
          $t > 8 && (le.timer && clearTimeout(le.timer), v.current = null);
          return;
        }
        $t >= ir && (v.current = null, W(le, H.clientX, H.clientY));
        return;
      }
      if (!E.current) return;
      P({ x: H.clientX, y: H.clientY });
      const xe = F(H.clientX, H.clientY);
      xe !== X.current && (X.current = xe, M(xe));
      const ce = (Lt = Z.current) == null ? void 0 : Lt.getBoundingClientRect();
      se.current = ce ? H.clientX < ce.left + Xt ? -1 : H.clientX > ce.right - Xt ? 1 : 0 : 0;
    }, S = () => {
      v.current && (v.current.timer && clearTimeout(v.current.timer), v.current = null);
    }, D = () => {
      S(), E.current && O(!0);
    }, L = () => {
      S(), E.current && O(!1);
    }, U = (H) => {
      E.current && H.preventDefault();
    }, ie = (H) => {
      H.key === "Escape" && E.current && O(!1);
    };
    return window.addEventListener("pointermove", _), window.addEventListener("pointerup", D), window.addEventListener("pointercancel", L), window.addEventListener("touchmove", U, { passive: !1 }), window.addEventListener("keydown", ie), () => {
      window.removeEventListener("pointermove", _), window.removeEventListener("pointerup", D), window.removeEventListener("pointercancel", L), window.removeEventListener("touchmove", U), window.removeEventListener("keydown", ie);
    };
  }), q(() => {
    if (!C) return;
    const _ = () => {
      se.current && Z.current && (Z.current.scrollLeft += se.current * 14), ae.current = requestAnimationFrame(_);
    };
    return ae.current = requestAnimationFrame(_), () => {
      ae.current && cancelAnimationFrame(ae.current);
    };
  }, [C]);
  const V = (_, S, D) => {
    if (!x || _.button !== void 0 && _.button !== 0) return;
    const L = _.pointerType === "touch" || _.pointerType === "pen", U = { id: S, from: D, rect: _.currentTarget.getBoundingClientRect(), x: _.clientX, y: _.clientY, touch: L, timer: null };
    L && (U.timer = setTimeout(() => {
      v.current === U && (v.current = null, W(U, U.x, U.y));
    }, ar)), v.current = U;
  }, ee = (_) => {
    if (!B) return;
    const { from: S, to: D } = B;
    I(null), M(null), D !== S && u ? (u(_, D), Q(me.moved(o(_), y(D)))) : Q(me.stays(o(_), y(S)));
    const L = l(_);
    setTimeout(() => {
      var U;
      return (U = de.current[L]) == null ? void 0 : U.focus({ preventScroll: !0 });
    }, 0);
  }, Ne = (_, S, D) => {
    var ie;
    const L = l(S), U = B && B.id === L;
    if (!U && _.key === "Enter") {
      _.preventDefault(), h(S);
      return;
    }
    if (_.key === " " && x) {
      _.preventDefault(), U ? ee(S) : (I({ id: L, from: D, to: D }), M(D), Q(me.picked(o(S), y(D))));
      return;
    }
    if (!(!U || !B)) {
      if (_.key === "Enter") {
        _.preventDefault(), ee(S);
        return;
      }
      if (_.key === "Escape") {
        _.preventDefault(), I(null), M(null), Q(me.stays(o(S), y(B.from)));
        return;
      }
      if (_.key === "ArrowLeft" || _.key === "ArrowRight") {
        _.preventDefault();
        const H = Gi(m, B.to, _.key === "ArrowRight" ? 1 : -1);
        if (!H) return;
        I({ ...B, to: H }), M(H), (ie = re.current[H]) == null || ie.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" }), Q(me.target(y(H), H === B.from));
      }
    }
  }, Ke = (_) => {
    const S = Z.current, D = _ === (f == null ? void 0 : f.key) ? S == null ? void 0 : S.firstElementChild : re.current[_];
    S && D && S.scrollTo({ left: Math.max(0, D.offsetLeft - S.offsetLeft - 8), behavior: "smooth" });
  }, [St, Kn] = z({ left: !1, right: !1 }), De = () => {
    const _ = Z.current;
    if (!_) return;
    const S = _.scrollLeft > 4, D = _.scrollLeft + _.clientWidth < _.scrollWidth - 4;
    Kn((L) => L.left === S && L.right === D ? L : { left: S, right: D });
  };
  q(() => {
    if (k) return;
    De();
    const _ = Z.current;
    if (!_ || typeof ResizeObserver > "u") return;
    const S = new ResizeObserver(De);
    return S.observe(_), () => S.disconnect();
  }, [k, i.length, a.length]);
  const ue = C ? { id: C.id, from: C.from, to: ne } : B ? { id: B.id, from: B.from, to: B.to } : null, Fe = ue ? A(ue.id) : null, Ct = /* @__PURE__ */ t("div", { className: "hf-sr", role: "status", "aria-live": "polite", children: J }), et = (_, S) => {
    const D = g == null ? void 0 : g(S);
    return D != null && D > _ ? `${_} of ${D}` : _;
  }, Bt = (_, S, D) => /* @__PURE__ */ s(Fi, { label: D, children: [
    f && /* @__PURE__ */ t(Yt, { pressed: S(f.key), count: f.count, onClick: () => _(f.key), children: f.label }),
    a.map((L) => /* @__PURE__ */ t(Yt, { pressed: S(L.key), count: et(b(L.key).length, L.key), onClick: () => _(L.key), children: L.label ?? L.key }, L.key))
  ] });
  if (k) {
    const _ = !!f && N === f.key, S = _ ? [] : b(N);
    return /* @__PURE__ */ s("div", { className: "hf-lanes hf-lanes--one", "aria-label": n, role: "region", children: [
      Bt($, (D) => D === N, "Stage"),
      _ ? f.render(!0) : S.length ? /* @__PURE__ */ t(Ui, { caption: `${y(N)}, ${S.length}`, children: S.map((D) => {
        const L = c(D);
        if (!L.extra && !L.head) return /* @__PURE__ */ t(rt, { icon: L.icon, title: L.title, sub: L.sub, below: L.chips, onClick: () => h(D) }, l(D));
        const U = L.extra ? /* @__PURE__ */ s("div", { className: "hf-lanes__row", children: [
          /* @__PURE__ */ t(rt, { icon: L.icon, title: L.title, sub: L.sub, below: L.chips, onClick: () => h(D) }),
          /* @__PURE__ */ t("span", { className: "hf-lanes__extra", children: L.extra })
        ] }, L.head ? void 0 : l(D)) : /* @__PURE__ */ t(rt, { icon: L.icon, title: L.title, sub: L.sub, below: L.chips, onClick: () => h(D) });
        return L.head ? /* @__PURE__ */ s("div", { className: "hf-lanes__item", children: [
          /* @__PURE__ */ t(On, { h: L.head, className: "hf-lanehead hf-lanehead--row" }),
          U
        ] }, l(D)) : U;
      }) }) : /* @__PURE__ */ t(wa, { children: d ? d(y(N)) : `Nobody in ${y(N)}.` }),
      Ct
    ] });
  }
  return /* @__PURE__ */ s("div", { className: "hf-lanes", role: "region", "aria-label": n, children: [
    Bt(Ke, () => !1, "Jump to a stage"),
    /* @__PURE__ */ s("div", { className: "hf-lanes__wrap", children: [
      /* @__PURE__ */ t(
        "button",
        {
          type: "button",
          className: "hf-lanes__arrow is-left",
          "aria-label": "Scroll the stages left",
          hidden: !St.left,
          onClick: () => {
            var _, S;
            (S = Z.current) == null || S.scrollBy({ left: -Math.round((((_ = Z.current) == null ? void 0 : _.clientWidth) ?? 600) * 0.8), behavior: "smooth" }), setTimeout(De, 450);
          },
          children: /* @__PURE__ */ t(yn, { size: 20, "aria-hidden": "true" })
        }
      ),
      /* @__PURE__ */ t(
        "button",
        {
          type: "button",
          className: "hf-lanes__arrow is-right",
          "aria-label": "Scroll the stages right",
          hidden: !St.right,
          onClick: () => {
            var _, S;
            (S = Z.current) == null || S.scrollBy({ left: Math.round((((_ = Z.current) == null ? void 0 : _.clientWidth) ?? 600) * 0.8), behavior: "smooth" }), setTimeout(De, 450);
          },
          children: /* @__PURE__ */ t(te, { size: 20, "aria-hidden": "true" })
        }
      ),
      /* @__PURE__ */ s("div", { ref: Z, className: "hf-lanes__track", onScroll: De, children: [
        f && f.render(!1),
        a.map((_) => {
          const S = b(_.key), D = !!ue && ue.to === _.key && ue.to !== ue.from, L = Pi(S.length, _.key, ue && { from: ue.from, to: ue.to });
          return /* @__PURE__ */ s(
            "section",
            {
              ref: (U) => {
                re.current[_.key] = U;
              },
              className: D ? "hf-lane is-over" : "hf-lane",
              "aria-label": `${_.label ?? _.key}, ${et(L, _.key)} ${L === 1 && (g == null ? void 0 : g(_.key)) == null ? "person" : "people"}`,
              children: [
                /* @__PURE__ */ s("div", { className: "hf-lane__h", children: [
                  /* @__PURE__ */ t("span", { children: _.label ?? _.key }),
                  /* @__PURE__ */ t("span", { className: "hf-lane__n", children: et(L, _.key) })
                ] }),
                /* @__PURE__ */ s("div", { className: "hf-lane__b", children: [
                  D && Fe && /* @__PURE__ */ s("div", { className: "hf-lane__drop", "aria-hidden": "true", style: C ? { height: Math.min(C.h, 120) } : void 0, children: [
                    "Drop to move ",
                    o(Fe).split(" ")[0],
                    " to ",
                    _.label ?? _.key
                  ] }),
                  S.map((U) => {
                    const ie = l(U), H = c(U), le = (C == null ? void 0 : C.id) === ie, xe = (B == null ? void 0 : B.id) === ie;
                    return /* @__PURE__ */ t(
                      "div",
                      {
                        ref: (ce) => {
                          de.current[ie] = ce;
                        },
                        role: "button",
                        tabIndex: 0,
                        className: ["hf-lanecard", le ? "is-lifted" : "", xe ? "is-held" : "", x ? "is-movable" : ""].filter(Boolean).join(" "),
                        "aria-roledescription": x ? "movable card" : void 0,
                        "aria-pressed": x ? xe : void 0,
                        "aria-label": `${o(U)}, in ${_.label ?? _.key}.${x ? " Enter to open, Space to move." : " Enter to open."}`,
                        onPointerDown: (ce) => V(ce, ie, _.key),
                        onKeyDown: (ce) => Ne(ce, U, _.key),
                        onClick: () => {
                          !R.current && !C && h(U);
                        },
                        onContextMenu: (ce) => {
                          (v.current || C) && ce.preventDefault();
                        },
                        children: /* @__PURE__ */ t(Kt, { c: H })
                      },
                      ie
                    );
                  }),
                  !S.length && !D && /* @__PURE__ */ t("p", { className: "hf-lane__empty", children: d ? d(_.label ?? _.key) : "Nobody here." })
                ] })
              ]
            },
            _.key
          );
        })
      ] })
    ] }),
    x && /* @__PURE__ */ t("p", { className: "hf-lanes__how", children: "Drag a card to another stage, or press and hold it on a touch screen. With the keyboard: Space to pick it up, the arrows to choose, Space to drop." }),
    C && Fe && vn(
      /* @__PURE__ */ t(
        "div",
        {
          className: "hf-lanecard is-ghost",
          "aria-hidden": "true",
          style: { width: C.w, transform: `translate(${T.x - C.offX}px, ${T.y - C.offY}px) rotate(1.5deg) scale(1.03)` },
          children: /* @__PURE__ */ t(Kt, { c: c(Fe) })
        }
      ),
      document.body
    ),
    Ct
  ] });
}
const Wn = {
  rated: /* @__PURE__ */ t(he, { size: 14, strokeWidth: 2.5 }),
  missing: /* @__PURE__ */ t("span", { className: "hf-month__bang", children: "!" }),
  skipped: /* @__PURE__ */ t(Re, { size: 14, strokeWidth: 2.5 }),
  future: /* @__PURE__ */ t("span", { className: "hf-month__dot" })
};
function Ps({ months: e, label: n = "Monthly ratings" }) {
  return /* @__PURE__ */ t("div", { className: "hf-months", role: "img", "aria-label": `${n}. ${$i(e)}`, style: { gridTemplateColumns: `repeat(${Math.max(1, e.length)}, minmax(0, 1fr))` }, children: e.map((a, i) => /* @__PURE__ */ s("span", { className: `hf-month hf-month--${a.state}`, "aria-hidden": "true", children: [
    /* @__PURE__ */ t("span", { className: "hf-month__l", children: a.label }),
    Wn[a.state]
  ] }, i)) });
}
function Fs({ hint: e }) {
  return /* @__PURE__ */ s("div", { className: "hf-monthkey", children: [
    ["rated", "missing", "skipped", "future"].map((a) => /* @__PURE__ */ s("span", { className: `hf-monthkey__i hf-monthkey__i--${a}`, children: [
      Wn[a],
      Fn[a]
    ] }, a)),
    e && /* @__PURE__ */ t(fe, { label: "About the month strip", text: e })
  ] });
}
function Is({ stages: e, current: n, label: a = "Stage" }) {
  const { index: i, line: r } = Ti(e, n);
  return /* @__PURE__ */ s("div", { className: "hf-stagebar", children: [
    /* @__PURE__ */ t("span", { className: "hf-stagebar__bar", role: "img", "aria-label": `${a}. ${r}`, children: e.map((l, o) => /* @__PURE__ */ t("span", { className: o <= i ? "hf-stagebar__seg hf-stagebar__seg--on" : "hf-stagebar__seg" }, l)) }),
    /* @__PURE__ */ t("span", { className: "hf-stagebar__line", "aria-hidden": "true", children: r })
  ] });
}
function Es({ steps: e, selected: n, onSelect: a, label: i }) {
  return /* @__PURE__ */ t("ol", { className: "hf-steps", "aria-label": i, children: e.map((r, l) => {
    const o = Li(r.state, l), c = /* @__PURE__ */ s(j, { children: [
      /* @__PURE__ */ s("span", { className: "hf-step__rail", "aria-hidden": "true", children: [
        /* @__PURE__ */ t("span", { className: "hf-step__dot", children: o.mark === "tick" ? /* @__PURE__ */ t(he, { size: 16, strokeWidth: 3 }) : o.mark === "dash" ? /* @__PURE__ */ t(Re, { size: 16, strokeWidth: 3 }) : l + 1 }),
        l < e.length - 1 && /* @__PURE__ */ t("span", { className: "hf-step__line" })
      ] }),
      /* @__PURE__ */ s("span", { className: "hf-step__b", children: [
        /* @__PURE__ */ s("span", { className: "hf-step__t", children: [
          r.title,
          /* @__PURE__ */ s("span", { className: "hf-sr", children: [
            ", ",
            o.words
          ] })
        ] }),
        r.sub && /* @__PURE__ */ t("span", { className: "hf-step__s", children: r.sub })
      ] })
    ] });
    return /* @__PURE__ */ t("li", { "aria-current": r.state === "current" ? "step" : void 0, children: a ? /* @__PURE__ */ t("button", { type: "button", className: `hf-step hf-step--${r.state}`, "aria-pressed": n === r.key, onClick: () => a(r.key), children: c }) : /* @__PURE__ */ t("div", { className: `hf-step hf-step--${r.state}`, children: c }) }, r.key);
  }) });
}
function Us({ items: e, label: n }) {
  return /* @__PURE__ */ t("ol", { className: "hf-tl", "aria-label": n, children: e.map((a) => /* @__PURE__ */ s("li", { className: "hf-tl__i", children: [
    /* @__PURE__ */ t("span", { className: "hf-tl__d", children: a.date }),
    /* @__PURE__ */ s("span", { className: "hf-tl__b", children: [
      /* @__PURE__ */ t("span", { className: "hf-tl__t", children: a.title }),
      a.sub && /* @__PURE__ */ t("span", { className: "hf-tl__s", children: a.sub }),
      a.extra
    ] })
  ] }, a.key)) });
}
function Os({ docs: e, onAdd: n, addLabel: a = "Add a document", accept: i, empty: r = "No documents yet.", busy: l }) {
  return /* @__PURE__ */ s("div", { className: "hf-docs", children: [
    e.length === 0 && /* @__PURE__ */ t("p", { className: "hf-muted hf-docs__empty", children: r }),
    e.map((o) => o.href ? /* @__PURE__ */ s("span", { className: "hf-doc__row", children: [
      /* @__PURE__ */ s("a", { className: "hf-doc", href: o.href, target: "_blank", rel: "noreferrer", children: [
        /* @__PURE__ */ t(ot, { size: 18, "aria-hidden": "true" }),
        /* @__PURE__ */ t("span", { className: "hf-doc__n", children: o.name }),
        o.meta && /* @__PURE__ */ t("span", { className: "hf-doc__m", children: o.meta })
      ] }),
      o.end
    ] }, o.key) : /* @__PURE__ */ s("span", { className: "hf-doc__row", children: [
      /* @__PURE__ */ s("span", { className: "hf-doc", children: [
        /* @__PURE__ */ t(ot, { size: 18, "aria-hidden": "true" }),
        /* @__PURE__ */ t("span", { className: "hf-doc__n", children: o.name }),
        o.meta && /* @__PURE__ */ t("span", { className: "hf-doc__m", children: o.meta })
      ] }),
      o.end
    ] }, o.key)),
    n && /* @__PURE__ */ s("label", { className: "hf-btn hf-btn--quiet hf-docs__add", "aria-busy": l || void 0, children: [
      /* @__PURE__ */ t(ma, { size: 18, "aria-hidden": "true" }),
      l ? "Adding…" : a,
      /* @__PURE__ */ t(
        "input",
        {
          type: "file",
          className: "hf-sr",
          accept: i,
          disabled: l,
          onChange: (o) => {
            var h;
            const c = (h = o.target.files) == null ? void 0 : h[0];
            c && n(c), o.target.value = "";
          }
        }
      )
    ] })
  ] });
}
function Ws({ list: e, children: n, keys: a, current: i, onOpen: r, word: l = "Item", listLabel: o }) {
  const [c, h] = z(!1);
  q(() => {
    h(!1);
  }, [i]);
  const { prev: u, next: f, line: d } = Di(a, i, l);
  return /* @__PURE__ */ s("div", { className: c ? "hf-split is-listing" : "hf-split", children: [
    /* @__PURE__ */ t("section", { className: "hf-split__list", "aria-label": o, children: e }),
    /* @__PURE__ */ s("div", { className: "hf-split__doc", children: [
      /* @__PURE__ */ s("div", { className: "hf-split__bar", children: [
        /* @__PURE__ */ s("button", { type: "button", className: "hf-btn hf-btn--secondary hf-press hf-btn--fit", disabled: !u, onClick: () => u && r(u), children: [
          /* @__PURE__ */ t(yn, { size: 18, "aria-hidden": "true" }),
          "Previous"
        ] }),
        /* @__PURE__ */ t("span", { className: "hf-split__pos", "aria-live": "polite", children: d }),
        /* @__PURE__ */ s("button", { type: "button", className: "hf-btn hf-btn--secondary hf-press hf-btn--fit", disabled: !f, onClick: () => f && r(f), children: [
          "Next",
          /* @__PURE__ */ t(te, { size: 18, "aria-hidden": "true" })
        ] })
      ] }),
      /* @__PURE__ */ s("button", { type: "button", className: "hf-btn hf-btn--quiet hf-press hf-btn--fit hf-split__toggle", "aria-expanded": c, onClick: () => h((p) => !p), children: [
        /* @__PURE__ */ t(Aa, { size: 18, "aria-hidden": "true" }),
        c ? "Back to this one" : `The list, ${a.length}`
      ] }),
      /* @__PURE__ */ t("div", { className: "hf-split__open", children: n })
    ] })
  ] });
}
function js({ app: e, name: n, onHome: a, href: i, size: r = 28, iconOnly: l, className: o }) {
  const c = `hf-apphome${l ? " hf-apphome--icon" : ""}${o ? ` ${o}` : ""}`, h = /* @__PURE__ */ s(j, { children: [
    /* @__PURE__ */ t(Je, { app: e, size: r }),
    /* @__PURE__ */ t("span", { className: l ? "hf-sr" : "hf-apphome__name", children: n })
  ] }), u = `${n}, home`;
  return i ? /* @__PURE__ */ t("a", { className: c, href: i, onClick: a ? (d) => {
    d.preventDefault(), a();
  } : void 0, "aria-label": u, children: h }) : /* @__PURE__ */ t("button", { type: "button", className: c, onClick: a, "aria-label": u, children: h });
}
const jn = "https://hifive-id-portal.pages.dev/legal/", Mt = {
  owner: "HiFive Holdings LLC",
  /** The link's words; the page itself is titled "Terms of Use" (D-057, 15 Nov 2026). */
  terms: "Terms",
  privacy: "Privacy",
  disclaimer: "Disclaimer",
  copyright: "Copyright",
  newTab: "(opens in a new tab)",
  label: "Legal"
};
function sr(e = jn, n = {}) {
  const a = { ...Mt, ...n }, i = e.endsWith("/") ? e : `${e}/`;
  return ["terms", "privacy", "disclaimer", "copyright"].map((r) => ({ key: r, label: a[r], href: `${i}${r}` }));
}
function lr(e = (/* @__PURE__ */ new Date()).getFullYear(), n = {}) {
  return `© ${e} ${n.owner ?? Mt.owner}`;
}
function Hn({ base: e = jn, year: n, words: a, lang: i, className: r }) {
  const l = { ...Mt, ...a }, o = sr(e, l);
  return /* @__PURE__ */ s("nav", { className: r ? `hf hf-legal ${r}` : "hf hf-legal", "aria-label": l.label, lang: i, children: [
    /* @__PURE__ */ s("p", { className: "hf-legal__copy", children: [
      lr(n, l),
      /* @__PURE__ */ t("span", { className: "hf-legal__dot hf-legal__dot--wide", "aria-hidden": "true", children: "·" })
    ] }),
    /* @__PURE__ */ t("ul", { className: "hf-legal__links", children: o.map((c, h) => /* @__PURE__ */ s("li", { className: "hf-legal__item", children: [
      /* @__PURE__ */ s("a", { href: c.href, target: "_blank", rel: "noopener noreferrer", children: [
        c.label,
        /* @__PURE__ */ s("span", { className: "hf-sr", children: [
          " ",
          l.newTab
        ] })
      ] }),
      h < o.length - 1 && /* @__PURE__ */ t("span", { className: "hf-legal__dot", "aria-hidden": "true", children: "·" })
    ] }, c.key)) })
  ] });
}
const or = {
  title: "Sign in to {app}",
  sub: "With your HiFive ID.",
  button: "Continue with HiFive ID",
  busy: "Opening HiFive ID…",
  hint: "Use the Microsoft or Google account linked to your HiFive ID.",
  oneTitle: "One sign-in for every HiFive app",
  ticks: [
    "The same account for every HiFive app you use",
    "Your colours and language follow you from app to app",
    "HR decides which apps you can open"
  ],
  language: "Language",
  about: "About {app}"
};
function cr(e, n) {
  const a = { ...or, ...n ?? {} }, i = (r) => r.split("{app}").join(e);
  return { ...a, title: i(a.title), about: i(a.about), ticks: (a.ticks ?? []).map(i) };
}
function hr(e) {
  return `repeat(${Math.max(1, Math.floor(e))}, minmax(min-content, 1fr))`;
}
function Hs(e) {
  const n = cr(e.short, e.words);
  return /* @__PURE__ */ t("div", { className: "hf-signin", children: /* @__PURE__ */ s("div", { className: "hf-signin__grid", children: [
    /* @__PURE__ */ s("section", { className: "hf-signin__band", "aria-label": n.about, children: [
      /* @__PURE__ */ t("span", { className: "hf-signin__ring", "aria-hidden": "true" }),
      /* @__PURE__ */ s("div", { className: "hf-signin__brand", children: [
        /* @__PURE__ */ t("span", { className: "hf-signin__logo", children: /* @__PURE__ */ t(Je, { app: e.app, size: 64 }) }),
        /* @__PURE__ */ t("p", { className: "hf-signin__app", lang: e.lang, children: e.name })
      ] }),
      /* @__PURE__ */ t("p", { className: "hf-signin__lede", lang: e.lang, children: e.lede }),
      /* @__PURE__ */ s("div", { className: "hf-signin__one", lang: e.lang, children: [
        /* @__PURE__ */ t("h2", { children: n.oneTitle }),
        /* @__PURE__ */ t("ul", { children: n.ticks.map((a) => /* @__PURE__ */ s("li", { children: [
          /* @__PURE__ */ t("span", { className: "hf-signin__tick", "aria-hidden": "true", children: /* @__PURE__ */ t(he, { size: 14, strokeWidth: 2.5 }) }),
          a
        ] }, a)) })
      ] })
    ] }),
    /* @__PURE__ */ s("div", { className: "hf-signin__side", children: [
      /* @__PURE__ */ s("section", { className: "hf-signin__card", "aria-labelledby": "hf-signin-h", lang: e.lang, children: [
        /* @__PURE__ */ s("div", { className: "hf-signin__top", children: [
          /* @__PURE__ */ s("div", { children: [
            /* @__PURE__ */ t("h1", { className: "hf-signin__h1", id: "hf-signin-h", children: n.title }),
            /* @__PURE__ */ t("p", { className: "hf-signin__sub", children: n.sub })
          ] }),
          e.languages && e.languages.length > 1 && /* @__PURE__ */ t("div", { className: "hf-signin__seg", role: "group", "aria-label": n.language, children: e.languages.map((a) => /* @__PURE__ */ t("button", { type: "button", lang: a.lang, "aria-pressed": e.language === a.value, onClick: () => {
            var i;
            return (i = e.onLanguage) == null ? void 0 : i.call(e, a.value);
          }, children: a.label }, a.value)) })
        ] }),
        e.error && /* @__PURE__ */ s("div", { className: "hf-signin__err", role: "alert", children: [
          /* @__PURE__ */ t(je, { size: 20, "aria-hidden": "true" }),
          /* @__PURE__ */ t("span", { children: e.error })
        ] }),
        /* @__PURE__ */ s("button", { type: "button", className: "hf-signin__go", onClick: e.onContinue, disabled: e.busy, "aria-busy": e.busy || void 0, children: [
          /* @__PURE__ */ t(un, { size: 20, "aria-hidden": "true" }),
          e.busy ? n.busy : n.button
        ] }),
        /* @__PURE__ */ t("p", { className: "hf-signin__hint", children: n.hint }),
        e.note && /* @__PURE__ */ t("p", { className: "hf-signin__note", children: e.note })
      ] }),
      e.help && /* @__PURE__ */ t("footer", { className: "hf-signin__foot", children: e.help }),
      e.legal === void 0 ? /* @__PURE__ */ t(Hn, {}) : e.legal || null
    ] })
  ] }) });
}
function Rs({ items: e, more: n, label: a = "Main", className: i }) {
  const r = n ? [...e, { key: "more", ...n }] : [...e];
  return /* @__PURE__ */ s(j, { children: [
    /* @__PURE__ */ t("div", { className: "hf-tabbar__space", "aria-hidden": "true" }),
    /* @__PURE__ */ t("nav", { className: i ? `hf-tabbar ${i}` : "hf-tabbar", "aria-label": a, style: { gridTemplateColumns: hr(r.length) }, children: r.map((l) => {
      const o = /* @__PURE__ */ s(j, { children: [
        /* @__PURE__ */ t("span", { className: "hf-tabbar__ic", "aria-hidden": "true", children: l.icon }),
        /* @__PURE__ */ t("span", { className: "hf-tabbar__t", children: l.label })
      ] }), c = { className: l.current ? "hf-tabbar__item is-on" : "hf-tabbar__item", "aria-current": l.current ? "page" : void 0, ...l.attrs ?? {} };
      return l.href ? /* @__PURE__ */ t("a", { href: l.href, onClick: l.onClick, ...c, children: o }, l.key) : /* @__PURE__ */ t("button", { type: "button", onClick: l.onClick, ...c, children: o }, l.key);
    }) })
  ] });
}
function qs({ label: e = "Main", brand: n, head: a, groups: i, foot: r }) {
  return /* @__PURE__ */ s("aside", { className: "hf-side", "aria-label": e, children: [
    n && /* @__PURE__ */ t("div", { className: "hf-side__brand", children: n }),
    a,
    /* @__PURE__ */ t("nav", { className: "hf-side__nav", children: i.map((l) => /* @__PURE__ */ s("div", { className: "hf-side__group", children: [
      l.label && /* @__PURE__ */ t("span", { className: "hf-side__cap", children: l.label }),
      l.items.map((o) => {
        const c = /* @__PURE__ */ s(j, { children: [
          o.icon && /* @__PURE__ */ t("span", { className: "hf-side__ic", "aria-hidden": "true", children: o.icon }),
          /* @__PURE__ */ t("span", { className: "hf-side__t", children: o.label })
        ] }), h = { className: o.current ? "hf-side__item is-on" : "hf-side__item", "aria-current": o.current ? "page" : void 0, ...o.attrs ?? {} };
        return o.href ? /* @__PURE__ */ t("a", { href: o.href, onClick: o.onClick, ...h, children: c }, o.key) : /* @__PURE__ */ t("button", { type: "button", onClick: o.onClick, ...h, children: c }, o.key);
      })
    ] }, l.key)) }),
    r && /* @__PURE__ */ t("div", { className: "hf-side__foot", children: r })
  ] });
}
function Rn(e, n) {
  const a = { className: e.current ? `${n} is-on` : n, "aria-current": e.current ? "page" : void 0, ...e.attrs ?? {} };
  return e.href ? /* @__PURE__ */ t("a", { href: e.href, onClick: e.onClick, ...a, children: e.label }, e.key) : /* @__PURE__ */ t("button", { type: "button", onClick: e.onClick, ...a, children: e.label }, e.key);
}
function Ys({ brand: e, items: n, end: a, label: i = "Main" }) {
  return /* @__PURE__ */ s("header", { className: "hf-topnav", children: [
    /* @__PURE__ */ t("div", { className: "hf-topnav__brand", children: e }),
    n && n.length > 0 && /* @__PURE__ */ t("nav", { className: "hf-topnav__nav", "aria-label": i, children: n.map((r) => Rn(r, "hf-topnav__item")) }),
    a && /* @__PURE__ */ t("div", { className: "hf-topnav__end", children: a })
  ] });
}
function Vs({ items: e, label: n }) {
  return e.length < 2 ? null : /* @__PURE__ */ t("nav", { className: "hf-subtabs", "aria-label": n, children: e.map((a) => Rn(a, "hf-subtabs__item")) });
}
function Js({ side: e, top: n, tabs: a, legal: i, children: r }) {
  return q(() => {
    ye();
  }, []), /* @__PURE__ */ s("div", { className: e ? "hf-frame has-side" : "hf-frame", children: [
    /* @__PURE__ */ s("div", { className: "hf-frame__panel", children: [
      e,
      /* @__PURE__ */ s("div", { className: "hf-frame__main", children: [
        n,
        /* @__PURE__ */ t("main", { className: "hf-frame__body", children: r }),
        i === void 0 ? /* @__PURE__ */ t(Hn, {}) : i || null
      ] })
    ] }),
    a && /* @__PURE__ */ t("div", { className: "hf-frame__tabs", children: a })
  ] });
}
const dr = "https://hifive-id.sinusuresh.workers.dev/logos", qn = {
  atomic: { key: "atomic", name: "Atomic Drugstore", bg: "#d3f1f1", fg: "#003c78", logo: "Atomic Drugstore" },
  apml: { key: "apml", name: "Accuracy Plus Medical Laboratory", bg: "#ffe1e3", fg: "#8b0818", logo: "Accuracy Plus Medical Laboratory" },
  herbal: { key: "herbal", name: "Herbal Park Ayurvedic Health Center", bg: "#f8efc4", fg: "#2d5a1e", logo: "Herbal Park Ayurvedic Health Center" },
  aljebal: { key: "aljebal", name: "Al Jebal Opticals", bg: "#dcf2ff", fg: "#4a1e8c", logo: "Al Jebal Opticals - Fujairah" },
  perfumes: { key: "perfumes", name: "Al Jebal Perfumes", bg: "#ece3f5", fg: "#6f2c53", logo: null },
  pine: { key: "pine", name: "Pine Pharmacy", bg: "#daf6ec", fg: "#14600c", logo: null },
  hifive: { key: "hifive", name: "HiFive Holdings", bg: "#e4dfdc", fg: "#6e0b2a", logo: "HiFive Holdings" }
}, fr = [
  [/accuracy plus|\bapml\b/i, "apml"],
  [/herbal park/i, "herbal"],
  [/atomic/i, "atomic"],
  [/al jebal opticals/i, "aljebal"],
  [/al jebal perfumes/i, "perfumes"],
  [/pine pharmacy/i, "pine"],
  [/hifive holdings/i, "hifive"]
];
function Yn(...e) {
  for (const n of e)
    for (const [a, i] of fr) if (a.test(String(n || ""))) return i;
  return "hifive";
}
const ur = {
  "Accuracy Plus Medical Laboratory": { v: "2026-11-03T10:52:32.438Z", W: 1200, H: 400, x: 47, y: 131, w: 209, h: 151 },
  "Al Jebal Opticals - Fujairah": { v: "2026-11-03T10:53:20.524Z", W: 1200, H: 400, x: 179, y: 42, w: 325, h: 326 },
  "Al Jebal Opticals - Kalba": { v: "2026-11-03T10:53:46.694Z", W: 1200, H: 400, x: 179, y: 42, w: 325, h: 326 },
  "Al Jebal Opticals - Masafi": { v: "2026-11-03T10:53:27.844Z", W: 1200, H: 400, x: 179, y: 42, w: 325, h: 326 },
  "Al Jebal Opticals - SKHF": { v: "2026-11-03T10:53:54.744Z", W: 1200, H: 400, x: 179, y: 42, w: 325, h: 326 },
  "Atomic Drugstore": { v: "2026-11-03T10:56:50.435Z", W: 1200, H: 400, x: 35, y: 148, w: 220, h: 97 },
  "Herbal Park Ayurvedic Health Center": { v: "2026-11-03T10:52:51.331Z", W: 1200, H: 400, x: 53, y: 109, w: 199, h: 198 },
  "HiFive Holdings": { v: "2026-10-08T05:51:31.888Z", W: 505, H: 468, x: 60, y: 43, w: 402, h: 310 }
}, ze = (e) => Math.round(e * 100) / 100;
function en(e, { size: n = 40, inset: a = 5, logos: i } = {}) {
  if (!e) return null;
  const r = ur[e];
  if (!r) return null;
  if (i) {
    const c = i.find((h) => h.key === e && (!h.variant || h.variant === "lockup"));
    if (!c || c.updated_at !== r.v) return null;
  }
  const l = `${dr}/${encodeURIComponent(e)}/lockup?v=${encodeURIComponent(r.v)}`, o = (n - a * 2) / Math.max(r.w, r.h);
  return {
    logo: e,
    url: l,
    style: {
      width: `${ze(r.w * o)}px`,
      height: `${ze(r.h * o)}px`,
      backgroundImage: `url("${l}")`,
      backgroundSize: `${ze(r.W * o)}px ${ze(r.H * o)}px`,
      backgroundPosition: `${ze(-r.x * o)}px ${ze(-r.y * o)}px`,
      backgroundRepeat: "no-repeat"
    }
  };
}
function Vn(e, n = {}) {
  const { branch: a, logo: i, ...r } = n, l = qn[Yn(a, e)], o = l.key === "aljebal" && a ? `Al Jebal Opticals - ${String(a).trim()}` : null, c = [i, o, l.logo].map((u) => en(u, r)).find(Boolean) ?? en("HiFive Holdings", r), h = String(e || "").trim() || l.name;
  return { key: l.key, name: h, bg: l.bg, fg: l.fg, mark: c };
}
function Qs(e, n, a = {}) {
  const i = qn[Yn(a.branch, e)];
  return { text: String(e || "").trim() || a.empty || "No facility", aside: n || void 0, bg: i.bg, fg: i.fg };
}
function pr(e) {
  const n = String(e || "").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  return (n.length > 1 ? n[0][0] + n[1][0] : (n[0] || "?").slice(0, 2)).toUpperCase();
}
function mr({ facility: e, className: n, size: a = 40, ...i }) {
  const r = Vn(e, { ...i, size: a }), l = { width: a, height: a };
  return /* @__PURE__ */ t("span", { className: `hf-facmark${n ? ` ${n}` : ""}`, style: l, "aria-hidden": "true", children: r.mark ? /* @__PURE__ */ t("span", { className: "hf-facmark__img", style: r.mark.style }) : /* @__PURE__ */ t("span", { className: "hf-facmark__mono", style: { background: r.fg, color: r.bg }, children: pr(r.name) }) });
}
function Zs({ facility: e, detail: n, aside: a, noMark: i, className: r, ...l }) {
  const o = Vn(e, l), c = n ?? (l.branch ? l.branch : null);
  return /* @__PURE__ */ s("div", { className: `hf-facstrip${r ? ` ${r}` : ""}`, style: { background: o.bg, color: o.fg }, children: [
    !i && /* @__PURE__ */ t(mr, { facility: e, ...l }),
    /* @__PURE__ */ s("span", { className: "hf-facstrip__where", children: [
      /* @__PURE__ */ t("span", { className: "hf-facstrip__name", children: o.name }),
      c ? /* @__PURE__ */ t("b", { className: "hf-facstrip__detail", children: c }) : null
    ] }),
    a ? /* @__PURE__ */ t("span", { className: "hf-facstrip__aside", children: a }) : null
  ] });
}
const Jn = 1, Qn = 4;
function zt(e, n, a) {
  return e / n > a ? { w: n * a, h: n } : { w: e, h: e / a };
}
const Zn = (e) => Math.min(Qn, Math.max(Jn, Number.isFinite(e) ? e : 1));
function Xe(e, n, a, i) {
  const r = Zn(e.zoom), { w: l, h: o } = zt(n, a, i), c = l / r, h = o / r, u = Math.min(n - c / 2, Math.max(c / 2, e.cx)), f = Math.min(a - h / 2, Math.max(h / 2, e.cy));
  return { zoom: r, cx: u, cy: f };
}
function Ar(e, n, a, i) {
  const r = { zoom: 1, cx: e / 2, cy: n / 2 };
  if (a == null || i == null || !Number.isFinite(i)) return r;
  const { h: l } = zt(e, n, a);
  return Xe({ ...r, cy: i * n + l / 2 }, e, n, a);
}
function pt(e, n, a, i) {
  const r = Xe(e, n, a, i), { w: l, h: o } = zt(n, a, i), c = l / r.zoom, h = o / r.zoom;
  return { sx: r.cx - c / 2, sy: r.cy - h / 2, sw: c, sh: h };
}
function tn(e, n, a, i, r, l, o) {
  const { sw: c } = pt(e, r, l, o), h = c / i;
  return Xe({ ...e, cx: e.cx - n * h, cy: e.cy - a * h }, r, l, o);
}
function Se(e, n, a, i, r) {
  return Xe({ ...e, zoom: Zn(n) }, a, i, r);
}
const Xn = (e, n) => Math.max(24, Math.min(e, n) / 10);
function lt(e, n) {
  return { sx: 0, sy: 0, sw: e, sh: n };
}
function _r(e, n, a) {
  const i = Xn(n, a), r = Math.min(n, Math.max(i, e.sw)), l = Math.min(a, Math.max(i, e.sh)), o = Math.min(n - r, Math.max(0, e.sx)), c = Math.min(a - l, Math.max(0, e.sy));
  return { sx: o, sy: c, sw: r, sh: l };
}
function nn(e, n, a, i, r) {
  return _r({ ...e, sx: e.sx + n, sy: e.sy + a }, i, r);
}
function an(e, n, a, i, r, l) {
  const o = Xn(r, l);
  let c = e.sx, h = e.sy, u = e.sx + e.sw, f = e.sy + e.sh;
  return n === "nw" || n === "sw" ? c = Math.min(u - o, Math.max(0, c + a)) : u = Math.max(c + o, Math.min(r, u + a)), n === "nw" || n === "ne" ? h = Math.min(f - o, Math.max(0, h + i)) : f = Math.max(h + o, Math.min(l, f + i)), { sx: c, sy: h, sw: u - c, sh: f - h };
}
function gr(e, n, a, i) {
  const r = Math.min(a / e, i / n), l = e * r, o = n * r;
  return { x: (a - l) / 2, y: (i - o) / 2, w: l, h: o, scale: r };
}
function br(e, n) {
  const a = ["image/png", "image/jpeg", "image/webp"];
  return e === "original" ? n && a.includes(n) ? n : "image/jpeg" : e && a.includes(e) ? e : "image/jpeg";
}
function yr(e, n) {
  const a = n === "image/png" ? "png" : n === "image/webp" ? "webp" : "jpg";
  return `${(e || "photo").replace(/\.[^.]+$/, "") || "photo"}-cropped.${a}`;
}
function vr(e, n, a, i = {}) {
  if (a) {
    const o = Math.round(i.width ?? 800);
    return { width: o, height: Math.round(o / a) };
  }
  const r = i.maxSide ?? 1600, l = Number.isFinite(r) ? Math.min(1, r / Math.max(e, n)) : 1;
  return { width: Math.max(1, Math.round(e * l)), height: Math.max(1, Math.round(n * l)) };
}
const rn = {
  title: "Crop the photo",
  hintFixed: "Drag to move it. Pinch, scroll or use the slider to zoom.",
  hintFree: "Drag the corners to choose what to keep, or drag inside to move.",
  frame: "The photo in the crop frame. Drag, or use the arrow keys, to move it.",
  zoom: "Zoom",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  turn: "Turn",
  reset: "Reset",
  cancel: "Cancel",
  use: "Use this photo",
  unreadable: "This photo could not be opened. Try another one.",
  corner: { nw: "Top-left corner", ne: "Top-right corner", sw: "Bottom-left corner", se: "Bottom-right corner" }
};
async function kr(e) {
  return typeof ImageBitmap < "u" && e instanceof ImageBitmap ? e : createImageBitmap(e, { imageOrientation: "from-image" });
}
async function wr(e) {
  const n = document.createElement("canvas");
  n.width = e.height, n.height = e.width;
  const a = n.getContext("2d");
  return a.translate(n.width, 0), a.rotate(Math.PI / 2), a.drawImage(e, 0, 0), createImageBitmap(n);
}
async function Nr(e, n, a, i = {}, r) {
  const { width: l, height: o } = vr(n.sw, n.sh, a, i), c = document.createElement("canvas");
  c.width = l, c.height = o;
  const h = c.getContext("2d");
  if (!h) return null;
  const u = br(i.type, r);
  return u === "image/jpeg" && (h.fillStyle = "#fff", h.fillRect(0, 0, l, o)), h.imageSmoothingQuality = "high", h.drawImage(e, n.sx, n.sy, n.sw, n.sh, 0, 0, l, o), new Promise((f) => c.toBlob(f, u, i.quality ?? 0.92));
}
function xr() {
  const e = Y(null), n = Y(null), [a, i] = z({ w: 0, h: 0 }), r = (l) => {
    var o;
    e.current = l, (o = n.current) == null || o.disconnect(), l && l.clientWidth && i((c) => c.w === l.clientWidth && c.h === l.clientHeight ? c : { w: l.clientWidth, h: l.clientHeight }), l && typeof ResizeObserver < "u" && (n.current = new ResizeObserver(() => i({ w: l.clientWidth, h: l.clientHeight })), n.current.observe(l));
  };
  return q(() => () => {
    var l;
    return (l = n.current) == null ? void 0 : l.disconnect();
  }, []), { el: e, ref: r, size: a };
}
function Mr({ open: e, image: n, aspect: a = 4 / 5, output: i, title: r, words: l, guide: o, startTop: c, onCancel: h, onUse: u }) {
  const f = { ...rn, ...l, corner: { ...rn.corner, ...l == null ? void 0 : l.corner } }, [d, p] = z(null), [g, k] = z(!1), [m, y] = z(!1), [b, A] = z({ zoom: 1, cx: 0, cy: 0 }), [G, N] = z({ sx: 0, sy: 0, sw: 0, sh: 0 }), $ = a != null && a > 0, C = $ ? a : 1, w = (x) => Ar(x.width, x.height, $ ? C : void 0, c);
  q(() => {
    let x = !0;
    if (p(null), k(!1), !(!e || !n))
      return kr(n).then((F) => {
        x && (p(F), A(w(F)), N(lt(F.width, F.height)));
      }).catch(() => {
        x && k(!0);
      }), () => {
        x = !1;
      };
  }, [e, n]);
  const T = xr(), P = Y(null), B = d && T.size.w ? gr(d.width, d.height, T.size.w, T.size.h) : null;
  q(() => {
    const x = P.current;
    if (!x || !d || !T.size.w || !T.size.h) return;
    const F = window.devicePixelRatio || 1, W = Math.round(T.size.w * F), O = Math.round(T.size.h * F);
    (x.width !== W || x.height !== O) && (x.width = W, x.height = O);
    const V = x.getContext("2d");
    if (V)
      if (V.imageSmoothingQuality = "high", V.clearRect(0, 0, W, O), $) {
        const ee = pt(b, d.width, d.height, C);
        V.drawImage(d, ee.sx, ee.sy, ee.sw, ee.sh, 0, 0, W, O);
      } else B && V.drawImage(d, 0, 0, d.width, d.height, B.x * F, B.y * F, B.w * F, B.h * F);
  }, [d, b, T.size.w, T.size.h, $, C, B == null ? void 0 : B.scale]);
  const I = Y(/* @__PURE__ */ new Map()), ne = Y(null), M = Y(null), J = (x, F = null) => {
    var W, O;
    try {
      (O = (W = x.currentTarget).setPointerCapture) == null || O.call(W, x.pointerId);
    } catch {
    }
    if (I.current.set(x.pointerId, { x: x.clientX, y: x.clientY }), M.current = F, $ && I.current.size === 2) {
      const [V, ee] = [...I.current.values()];
      ne.current = { d: Math.hypot(V.x - ee.x, V.y - ee.y) || 1, zoom: b.zoom };
    }
    x.stopPropagation();
  }, Q = (x) => {
    const F = I.current.get(x.pointerId);
    if (!F || !d) return;
    I.current.set(x.pointerId, { x: x.clientX, y: x.clientY });
    const W = x.clientX - F.x, O = x.clientY - F.y;
    if ($)
      if (I.current.size >= 2 && ne.current) {
        const [V, ee] = [...I.current.values()], Ne = Math.hypot(V.x - ee.x, V.y - ee.y);
        A((Ke) => Se(Ke, ne.current.zoom * (Ne / ne.current.d), d.width, d.height, C));
      } else A((V) => tn(V, W, O, T.size.w || 280, d.width, d.height, C));
    else if (B && M.current) {
      const V = 1 / B.scale, ee = M.current;
      N((Ne) => ee === "move" ? nn(Ne, W * V, O * V, d.width, d.height) : an(Ne, ee, W * V, O * V, d.width, d.height));
    }
  }, Z = (x) => {
    I.current.delete(x.pointerId), I.current.size < 2 && (ne.current = null), I.current.size || (M.current = null);
  }, re = (x) => {
    !$ || !d || A((F) => Se(F, F.zoom * (x.deltaY < 0 ? 1.08 : 1 / 1.08), d.width, d.height, C));
  }, de = (x) => {
    if (!d) return;
    const F = x.shiftKey ? 40 : 10, W = { ArrowLeft: [-F, 0], ArrowRight: [F, 0], ArrowUp: [0, -F], ArrowDown: [0, F] }[x.key];
    if ($)
      if (W) A((O) => tn(O, -W[0], -W[1], T.size.w || 280, d.width, d.height, C));
      else if (x.key === "+" || x.key === "=") A((O) => Se(O, O.zoom + 0.2, d.width, d.height, C));
      else if (x.key === "-") A((O) => Se(O, O.zoom - 0.2, d.width, d.height, C));
      else return;
    else if (W && B) {
      const O = 1 / B.scale;
      N((V) => nn(V, W[0] * O, W[1] * O, d.width, d.height));
    } else return;
    x.preventDefault();
  }, v = (x) => (F) => {
    if (!d || !B) return;
    const W = (F.shiftKey ? 40 : 10) / B.scale, O = { ArrowLeft: [-W, 0], ArrowRight: [W, 0], ArrowUp: [0, -W], ArrowDown: [0, W] }[F.key];
    O && (F.preventDefault(), F.stopPropagation(), N((V) => an(V, x, O[0], O[1], d.width, d.height)));
  }, E = async () => {
    if (!d) return;
    const x = await wr(d);
    p(x), A(w(x)), N(lt(x.width, x.height));
  }, X = () => {
    d && (A(w(d)), N(lt(d.width, d.height)));
  }, se = (x) => {
    d && A((F) => Se(F, F.zoom + x, d.width, d.height, C));
  }, ae = async () => {
    if (!d) return;
    y(!0);
    const x = $ ? pt(b, d.width, d.height, C) : G, F = n && !(typeof ImageBitmap < "u" && n instanceof ImageBitmap) ? n.type : void 0, W = await Nr(d, x, $ ? C : null, i, F);
    if (y(!1), !W) return;
    const O = typeof File < "u" && n instanceof File ? n.name : void 0;
    u(O !== void 0 ? new File([W], yr(O, W.type), { type: W.type, lastModified: Date.now() }) : W);
  }, R = !$ && B ? { left: B.x + G.sx * B.scale, top: B.y + G.sy * B.scale, width: G.sw * B.scale, height: G.sh * B.scale } : null;
  return /* @__PURE__ */ t(ge, { open: e, title: r ?? f.title, subtitle: $ ? f.hintFixed : f.hintFree, onClose: h, children: /* @__PURE__ */ s("div", { className: "hf-crop", children: [
    g ? /* @__PURE__ */ t("p", { className: "hf-crop__bad", role: "alert", children: f.unreadable }) : /* @__PURE__ */ s(
      "div",
      {
        ref: T.ref,
        className: $ ? "hf-crop__stage" : "hf-crop__stage hf-crop__stage--free",
        style: $ ? { aspectRatio: String(C), width: `min(100%, calc(52vh * ${C}), ${Math.round(360)}px)` } : void 0,
        onPointerDown: $ ? (x) => J(x) : void 0,
        onPointerMove: Q,
        onPointerUp: Z,
        onPointerCancel: Z,
        onWheel: re,
        children: [
          /* @__PURE__ */ t("canvas", { ref: P, className: "hf-crop__canvas", "aria-hidden": "true" }),
          $ ? /* @__PURE__ */ s(j, { children: [
            o && /* @__PURE__ */ t("div", { className: "hf-crop__guide", "aria-hidden": "true", children: o }),
            /* @__PURE__ */ t("div", { className: "hf-crop__frame", tabIndex: 0, role: "img", "aria-label": f.frame, onKeyDown: de })
          ] }) : R && /* @__PURE__ */ t(
            "div",
            {
              className: "hf-crop__box",
              style: R,
              tabIndex: 0,
              role: "img",
              "aria-label": f.frame,
              onKeyDown: de,
              onPointerDown: (x) => J(x, "move"),
              children: ["nw", "ne", "sw", "se"].map((x) => /* @__PURE__ */ t(
                "button",
                {
                  type: "button",
                  className: `hf-crop__handle hf-crop__handle--${x}`,
                  "aria-label": f.corner[x],
                  onPointerDown: (F) => J(F, x),
                  onKeyDown: v(x)
                },
                x
              ))
            }
          )
        ]
      }
    ),
    $ && !g && /* @__PURE__ */ s("div", { className: "hf-crop__zoom", children: [
      /* @__PURE__ */ t("button", { type: "button", className: "hf-crop__ic", "aria-label": f.zoomOut, onClick: () => se(-0.2), children: /* @__PURE__ */ t(Re, { size: 18, "aria-hidden": "true" }) }),
      /* @__PURE__ */ t(
        "input",
        {
          type: "range",
          min: Jn,
          max: Qn,
          step: 0.01,
          value: b.zoom,
          "aria-label": f.zoom,
          onChange: (x) => d && A((F) => Se(F, Number(x.target.value), d.width, d.height, C))
        }
      ),
      /* @__PURE__ */ t("button", { type: "button", className: "hf-crop__ic", "aria-label": f.zoomIn, onClick: () => se(0.2), children: /* @__PURE__ */ t(sn, { size: 18, "aria-hidden": "true" }) })
    ] }),
    !g && /* @__PURE__ */ s("div", { className: "hf-crop__row", children: [
      /* @__PURE__ */ t(Ce, { variant: "secondary", icon: /* @__PURE__ */ t(_a, { size: 16, "aria-hidden": "true" }), onClick: () => void E(), disabled: !d, children: f.turn }),
      /* @__PURE__ */ t(Ce, { variant: "secondary", icon: /* @__PURE__ */ t(ga, { size: 16, "aria-hidden": "true" }), onClick: X, disabled: !d, children: f.reset })
    ] }),
    /* @__PURE__ */ s("div", { className: "hf-crop__row", children: [
      /* @__PURE__ */ t(Ce, { variant: "secondary", onClick: h, children: f.cancel }),
      /* @__PURE__ */ t(Ce, { variant: "primary", onClick: () => void ae(), disabled: !d || g, busy: m, children: f.use })
    ] })
  ] }) });
}
function Xs(e, n = {}) {
  return new Promise((a) => {
    const i = document.createElement("div");
    document.body.appendChild(i);
    const r = ba(i), l = (o) => {
      r.unmount(), i.remove(), a(o);
    };
    r.render(/* @__PURE__ */ t(Mr, { ...n, open: !0, image: e, onCancel: () => l(null), onUse: (o) => l(o) }));
  });
}
function Ks() {
  q(() => {
    ye();
  }, []);
  const e = Ae((r) => {
    var l;
    return ((l = ye()) == null ? void 0 : l.confirmLeave(r)) ?? !0;
  }, []), n = Ae(() => {
    var r;
    return ((r = ye()) == null ? void 0 : r.isUnsaved()) ?? !1;
  }, []), a = Ae((r) => {
    var l;
    return (l = ye()) == null ? void 0 : l.saved(r ?? null);
  }, []), i = Ae((r, l) => {
    var o;
    return (o = ye()) == null ? void 0 : o.setUnsaved(r, l);
  }, []);
  return { confirmLeave: e, isUnsaved: n, saved: a, setUnsaved: i };
}
export {
  Fa as APP_FAMILY,
  Wr as APP_ICON_THEMES,
  Ds as APP_LOGOS,
  Ha as ATTENTION_WORDS,
  Js as AppFrame,
  js as AppHome,
  Je as AppLogo,
  jr as AppLogoTile,
  Pe as AppMark,
  Xr as Appearance,
  Jr as AppsDock,
  Qr as AppsGrid,
  Qe as AttentionDot,
  oe as Avatar,
  Ir as BalanceTile,
  ws as Banner,
  ns as BentoGrid,
  In as Breadcrumb,
  Ce as Button,
  rn as CROP_WORDS,
  Vr as Celebration,
  _s as Checkbox,
  Yt as Chip,
  Fi as ChipGroup,
  bs as ChoiceCards,
  Ns as DataTable,
  Os as DocumentList,
  qn as FACILITY_BRANDS,
  dr as FACILITY_LOGO_BASE,
  mr as FacilityMark,
  Zs as FacilityStrip,
  Ur as Feed,
  Gt as FeedCard,
  Ga as FeedQuiet,
  ji as FiltersButton,
  Cs as FiltersFooter,
  ts as FirstLoginTour,
  Vt as Fold,
  Hr as GiveKudosButton,
  Rr as GiveKudosSheet,
  Ji as GlanceStrip,
  Gr as Greeting,
  as as GreetingBand,
  ss as HappeningCard,
  Yr as HealthDot,
  fe as Hint,
  Mr as ImageCropper,
  hs as JoiningCard,
  xa as KEEP_ON_SUBMIT,
  Tr as KeyValues,
  za as LEAVE_WORDS,
  jn as LEGAL_BASE,
  Mt as LEGAL_WORDS,
  Hn as LegalLinks,
  Ui as ListCard,
  rt as ListRow,
  xs as Loading,
  ur as MARK_BOXES,
  Qn as MAX_ZOOM,
  Jn as MIN_ZOOM,
  Fn as MONTH_WORDS,
  me as MOVE_WORDS,
  ys as MarkGroup,
  ls as MiniTile,
  Fs as MonthKey,
  Ps as MonthStrip,
  Ms as MoreButton,
  es as NewJoinerCard,
  xi as PHONE_MAX,
  qt as PHONE_QUERY,
  Ls as PersonPage,
  ka as Picker,
  Pr as ProfileCard,
  $r as QuantityField,
  $s as QuickSheet,
  wa as Quiet,
  Jt as SCALE_WORDS,
  or as SIGN_IN_WORDS,
  Qa as SKINS,
  pe as SKIPPED,
  Et as SWATCHES,
  vs as ScoreGroup,
  Fr as ScoreRing,
  Kr as SearchPill,
  gs as Segmented,
  As as Select,
  ge as Sheet,
  Ss as SheetField,
  zs as SheetItem,
  qs as SideMenu,
  Hs as SignIn,
  Oi as Skeleton,
  Ws as SplitView,
  Is as StageBar,
  Gs as StageLanes,
  ks as StatusChip,
  qr as StatusRows,
  Es as Stepper,
  Ni as StockCard,
  Vs as SubTabs,
  ei as TOUR_LABELS,
  Ka as TOUR_STEPS,
  Rs as TabBar,
  os as TeamCard,
  ms as TextArea,
  ps as TextField,
  Ie as Tile,
  Er as TileStrip,
  Us as Timeline,
  Ts as Toast,
  Ys as TopBar,
  Bs as UnitPage,
  Dr as UnitSwitch,
  is as WaitingCard,
  ut as WaitingCounts,
  rs as WaitingQuiet,
  Un as answeredCount,
  er as answersFor,
  Cn as appIconKey,
  ja as appIconSrc,
  Wa as appIconSvg,
  Xa as applyPrefs,
  si as arrange,
  cs as askHrMailto,
  $a as bandFor,
  _r as clampBox,
  Xe as clampView,
  kt as columnsFor,
  lr as copyrightLine,
  Ca as countsAsEdit,
  Xs as cropImage,
  pt as cropRect,
  yr as croppedName,
  Za as currentPrefs,
  ft as dayWords,
  Gn as documentsLine,
  tn as dragView,
  Qs as facilityHead,
  pr as facilityInitials,
  Yn as facilityKey,
  en as facilityMark,
  Vn as facilityStrip,
  La as factorTotal,
  Mi as filtersWords,
  wn as firstName,
  gr as fitInside,
  qi as glanceLine,
  lt as initialBox,
  Ar as initialView,
  Na as initials,
  ye as installLeaveGuard,
  Oe as isRequired,
  Ze as isShown,
  ui as joinerOrder,
  Pi as laneCount,
  Gi as laneStep,
  sr as legalLinks,
  Zr as lockSkin,
  Or as logoSvg,
  ya as matchOptions,
  Pa as matchPeople,
  Xi as missingFields,
  Zt as missingLine,
  $i as monthLine,
  nn as moveBox,
  Bi as nextSort,
  vr as outputSize,
  br as outputType,
  Vi as peopleFilters,
  Ki as personFor,
  Nr as renderCrop,
  an as resizeBox,
  fi as setupDetail,
  Dn as setupLine,
  Ba as sheetHost,
  fs as showStockTile,
  Si as showWords,
  cr as signInWords,
  $e as slowLine,
  ni as sortBlocks,
  zi as sortChoices,
  Ci as sortRows,
  ai as spansFor,
  us as splitAfter,
  Di as splitStep,
  Ti as stageLine,
  Qt as startingValues,
  Li as stepMark,
  Zi as stepProblem,
  va as stepQuantity,
  Pn as stockChip,
  bi as stockDay,
  yi as stockLead,
  ds as stockTileLabel,
  vi as stockWhy,
  Ma as submitClears,
  hr as tabColumns,
  Ri as tenureWords,
  kn as timeGreeting,
  ki as unitLine,
  li as useLayout,
  Ks as useLeaveGuard,
  Wi as usePhone,
  Ya as useSkin,
  Yi as waitingLine,
  Rt as whenLine,
  Se as zoomView
};
//# sourceMappingURL=hifive-ui.js.map
