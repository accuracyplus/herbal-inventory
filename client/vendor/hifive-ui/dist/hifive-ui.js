import { jsx as e, jsxs as i, Fragment as U } from "react/jsx-runtime";
import { useId as fe, useState as x, useRef as q, useMemo as _e, useEffect as O, createElement as Zn, useCallback as xe, useLayoutEffect as gn } from "react";
import { Search as qe, Minus as Oe, Plus as Gn, Check as ae, Building2 as Xn, ChevronsUpDown as Kn, Settings as Nn, User as kn, Briefcase as yn, Calendar as vn, Lock as wn, ChevronRight as G, X as $e, Clock as Re, Award as De, Target as et, Bell as Cn, ShieldCheck as xn, Pin as Sn, ThumbsUp as Bn, Hand as me, Sun as $n, MessageSquare as nt, Star as Dn, BookOpen as Ye, UserPlus as Me, Sparkles as tt, RefreshCw as at, CheckCircle2 as it, BadgeCheck as st, ExternalLink as Se, Users as rt, Hourglass as Ve, LogOut as lt, Info as Mn, ChevronDown as Fn, FileText as Ie, ArrowUp as ct, ArrowDown as ot, AlertTriangle as Be, Circle as ht, Paperclip as dt, ChevronLeft as ft, List as ut } from "lucide-react";
import { createPortal as At } from "react-dom";
const Te = (n) => n.trim().toLowerCase();
function pt(n, t, a = 30) {
  const s = Te(t);
  if (!s) return n.slice(0, a);
  const r = n.filter((o) => {
    var h;
    return (h = o.codes) == null ? void 0 : h.some((f) => Te(f) === s);
  });
  if (r.length) return r.slice(0, a);
  const l = s.split(/\s+/), c = (o) => Te(`${o.label} ${o.keywords ?? ""} ${(o.codes ?? []).join(" ")}`);
  return n.filter((o) => {
    const h = c(o);
    return l.every((f) => h.includes(f));
  }).slice(0, a);
}
function mt(n, t, a = {}) {
  const { min: s = 0, max: r, step: l = 1 } = a, c = Number(n);
  let h = (Number.isFinite(c) ? c : 0) + t * l;
  return h < s && (h = s), r !== void 0 && h > r && (h = r), String(Math.round(h * 1e6) / 1e6);
}
function Ma({ label: n, options: t, onPick: a, placeholder: s, hint: r, error: l, hideLabel: c, limit: o = 30, empty: h, footer: f, id: d }) {
  const m = fe(), A = d ?? m, [k, y] = x(""), [u, p] = x(!1), [_, b] = x(0), $ = q(null), v = _e(() => pt(t, k, o), [t, k, o]);
  O(() => {
    if (!u) return;
    const B = (P) => {
      var C;
      (C = $.current) != null && C.contains(P.target) || p(!1);
    };
    return document.addEventListener("pointerdown", B), () => document.removeEventListener("pointerdown", B);
  }, [u]);
  const F = (B) => {
    a(B), y(""), p(!1), b(0);
  }, H = [r ? `${A}-h` : "", l ? `${A}-e` : ""].filter(Boolean).join(" ") || void 0;
  return /* @__PURE__ */ i("div", { className: "hf-fld hf-pick", ref: $, children: [
    /* @__PURE__ */ e("label", { htmlFor: A, className: c ? "hf-sr" : "hf-fld__l", children: n }),
    r && /* @__PURE__ */ e("span", { id: `${A}-h`, className: "hf-fld__h", children: r }),
    /* @__PURE__ */ i("div", { className: "hf-pick__wrap", children: [
      /* @__PURE__ */ i("div", { className: ["hf-pick__box", u ? "is-open" : "", l ? "is-err" : ""].filter(Boolean).join(" "), children: [
        /* @__PURE__ */ e(qe, { size: 18, "aria-hidden": "true" }),
        /* @__PURE__ */ e(
          "input",
          {
            id: A,
            role: "combobox",
            "aria-expanded": u,
            "aria-controls": `${A}-l`,
            "aria-autocomplete": "list",
            "aria-activedescendant": u && v[_] ? `${A}-o${_}` : void 0,
            "aria-invalid": l ? !0 : void 0,
            "aria-describedby": H,
            autoComplete: "off",
            value: k,
            placeholder: s,
            onFocus: () => p(!0),
            onChange: (B) => {
              y(B.target.value), p(!0), b(0);
            },
            onKeyDown: (B) => {
              B.key === "ArrowDown" ? (B.preventDefault(), p(!0), b((P) => Math.min(P + 1, v.length - 1))) : B.key === "ArrowUp" ? (B.preventDefault(), b((P) => Math.max(P - 1, 0))) : B.key === "Enter" && u && v[_] ? (B.preventDefault(), F(v[_])) : B.key === "Escape" && u && (B.stopPropagation(), p(!1));
            }
          }
        )
      ] }),
      u && /* @__PURE__ */ i("div", { className: "hf-pick__list", children: [
        /* @__PURE__ */ e("div", { id: `${A}-l`, role: "listbox", "aria-label": n, children: v.map((B, P) => /* @__PURE__ */ i(
          "button",
          {
            id: `${A}-o${P}`,
            type: "button",
            role: "option",
            "aria-selected": P === _,
            tabIndex: -1,
            className: P === _ ? "hf-pick__opt is-on" : "hf-pick__opt",
            onPointerDown: (C) => C.preventDefault(),
            onClick: () => F(B),
            onPointerEnter: () => b(P),
            children: [
              /* @__PURE__ */ i("span", { className: "hf-pick__b", children: [
                /* @__PURE__ */ e("span", { className: "hf-pick__t", children: B.label }),
                B.sub && /* @__PURE__ */ e("span", { className: "hf-pick__s", children: B.sub })
              ] }),
              B.end && /* @__PURE__ */ e("span", { className: B.endTone ? `hf-pick__e hf-pick__e--${B.endTone}` : "hf-pick__e", children: B.end })
            ]
          },
          B.value
        )) }),
        v.length === 0 && /* @__PURE__ */ e("p", { className: "hf-pick__none", children: h ? h(k) : `Nothing matches “${k}”.` }),
        f && /* @__PURE__ */ e("div", { className: "hf-pick__foot", children: f })
      ] })
    ] }),
    l && /* @__PURE__ */ e("span", { id: `${A}-e`, className: "hf-fld__e", children: l })
  ] });
}
function Fa({ label: n, value: t, onChange: a, unit: s, min: r = 0, max: l, step: c = 1, bare: o, hint: h, error: f, hideLabel: d, id: m, className: A, ...k }) {
  const y = fe(), u = m ?? y, p = [h ? `${u}-h` : "", f ? `${u}-e` : ""].filter(Boolean).join(" ") || void 0, _ = (b) => a(mt(t, b, { min: r, max: l, step: c }));
  return /* @__PURE__ */ i("div", { className: ["hf-fld hf-qty", A ?? ""].filter(Boolean).join(" "), children: [
    /* @__PURE__ */ e("label", { htmlFor: u, className: d ? "hf-sr" : "hf-fld__l", children: n }),
    h && /* @__PURE__ */ e("span", { id: `${u}-h`, className: "hf-fld__h", children: h }),
    /* @__PURE__ */ i("div", { className: "hf-qty__row", children: [
      !o && /* @__PURE__ */ e("button", { type: "button", className: "hf-qty__b", "aria-label": `Less: ${n}`, onClick: () => _(-1), children: /* @__PURE__ */ e(Oe, { size: 18, "aria-hidden": "true" }) }),
      /* @__PURE__ */ e(
        "input",
        {
          id: u,
          type: "number",
          inputMode: "decimal",
          min: r,
          max: l,
          step: "any",
          value: t ?? "",
          className: f ? "hf-input hf-input--err" : "hf-input",
          "aria-invalid": f ? !0 : void 0,
          "aria-describedby": p,
          onChange: (b) => a(b.target.value),
          onWheel: (b) => b.currentTarget.blur(),
          ...k
        }
      ),
      !o && /* @__PURE__ */ e("button", { type: "button", className: "hf-qty__b", "aria-label": `More: ${n}`, onClick: () => _(1), children: /* @__PURE__ */ e(Gn, { size: 18, "aria-hidden": "true" }) }),
      s && /* @__PURE__ */ e("span", { className: "hf-qty__u", children: s })
    ] }),
    f && /* @__PURE__ */ e("span", { id: `${u}-e`, className: "hf-fld__e", children: f })
  ] });
}
function Wa({ items: n, columns: t = 2 }) {
  const a = n.filter((s) => s.value !== null && s.value !== void 0 && s.value !== "" && s.value !== !1);
  return a.length ? /* @__PURE__ */ e("dl", { className: `hf-kv hf-kv--${t}`, children: a.map((s) => /* @__PURE__ */ i("div", { children: [
    /* @__PURE__ */ e("dt", { children: s.label }),
    /* @__PURE__ */ e("dd", { children: s.value })
  ] }, s.label)) }) : null;
}
function _t({ children: n, icon: t }) {
  return /* @__PURE__ */ i("p", { className: "hf-quiet", children: [
    t ?? /* @__PURE__ */ e(ae, { size: 16, "aria-hidden": "true" }),
    /* @__PURE__ */ e("span", { children: n })
  ] });
}
function La({ name: n, label: t = "Working in", onClick: a, compact: s }) {
  const r = s ? "hf-unit hf-unit--pill" : "hf-unit", l = /* @__PURE__ */ i(U, { children: [
    /* @__PURE__ */ e(Xn, { size: s ? 16 : 20, "aria-hidden": "true" }),
    s ? /* @__PURE__ */ e("span", { className: "hf-unit__n", children: n }) : /* @__PURE__ */ i("span", { className: "hf-unit__b", children: [
      /* @__PURE__ */ e("span", { className: "hf-unit__l", children: t }),
      /* @__PURE__ */ e("span", { className: "hf-unit__n", children: n })
    ] }),
    a && /* @__PURE__ */ e(Kn, { size: 16, "aria-hidden": "true" })
  ] });
  return a ? /* @__PURE__ */ e("button", { type: "button", className: r, onClick: a, "aria-label": `${t}: ${n}. Switch`, children: l }) : /* @__PURE__ */ e("div", { className: r, "aria-label": `${t}: ${n}`, children: l });
}
function Wn(n = /* @__PURE__ */ new Date()) {
  const t = n.getHours();
  return t < 5 ? "Working late" : t < 12 ? "Good morning" : t < 17 ? "Good afternoon" : "Good evening";
}
function Ta({ firstName: n, reportsTo: t, leads: a = 0, tenure: s, quote: r, search: l, onAppearance: c, onPrivacy: o, now: h = /* @__PURE__ */ new Date() }) {
  const f = h.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  return /* @__PURE__ */ i("div", { className: "hf", children: [
    /* @__PURE__ */ i("div", { className: "hf-topbar", children: [
      /* @__PURE__ */ e("p", { className: "hf-topbar__date", children: f }),
      l && /* @__PURE__ */ e("div", { className: "hf-topbar__search", children: l }),
      c && /* @__PURE__ */ e("button", { type: "button", className: "hf-topbar__gear", onClick: c, "aria-label": "Appearance settings", "data-tour": "gear", children: /* @__PURE__ */ e(Nn, { size: 20 }) })
    ] }),
    /* @__PURE__ */ i("header", { className: "hf-greet", "data-tour": "topbar", children: [
      /* @__PURE__ */ i("h1", { className: "hf-display hf-greet__h1", children: [
        Wn(h),
        ", ",
        n
      ] }),
      (t || a > 0 || s) && /* @__PURE__ */ i("div", { className: "hf-greet__meta", children: [
        t && /* @__PURE__ */ i("span", { children: [
          /* @__PURE__ */ e(kn, { size: 14 }),
          "Reports to ",
          t
        ] }),
        a > 0 && /* @__PURE__ */ i("span", { children: [
          /* @__PURE__ */ e(yn, { size: 14 }),
          "Leads ",
          a,
          " ",
          a === 1 ? "person" : "people"
        ] }),
        s && /* @__PURE__ */ i("span", { children: [
          /* @__PURE__ */ e(vn, { size: 14 }),
          s
        ] })
      ] }),
      o && /* @__PURE__ */ i("button", { type: "button", className: "hf-greet__privacy", onClick: o, children: [
        /* @__PURE__ */ e(wn, { size: 12 }),
        /* @__PURE__ */ e("span", { children: "Only you can see this page" }),
        /* @__PURE__ */ e(G, { size: 12 })
      ] }),
      r && /* @__PURE__ */ i("blockquote", { className: "hf-greet__quote", children: [
        "“",
        r.body,
        "”",
        r.author && /* @__PURE__ */ i("footer", { children: [
          "— ",
          r.author
        ] })
      ] })
    ] })
  ] });
}
const he = (n) => `hf-tone-${n}`, R = (...n) => n.filter(Boolean).join(" "), bt = (n) => n.split(" ").filter(Boolean).map((t) => t[0]).slice(0, 2).join("").toUpperCase();
function Ea({ name: n, role: t, company: a, photo: s, onOpen: r }) {
  return s ? /* @__PURE__ */ i("section", { className: "hf hf-card hf-profile hf-profile--photo", "aria-label": "Your profile", "data-tour": "profile", children: [
    /* @__PURE__ */ e("img", { className: "hf-profile__photo", src: s, alt: n }),
    /* @__PURE__ */ i("div", { className: "hf-profile__over", children: [
      /* @__PURE__ */ e("h2", { className: "hf-display hf-profile__name", children: n }),
      (t || a) && /* @__PURE__ */ e("p", { className: "hf-profile__role", children: [t, a].filter(Boolean).join(" · ") })
    ] }),
    r && /* @__PURE__ */ e("button", { type: "button", className: "hf-sr", onClick: r, children: "Open my access" })
  ] }) : /* @__PURE__ */ e("section", { className: "hf hf-card hf-profile", "aria-label": "Your profile", "data-tour": "profile", children: /* @__PURE__ */ i(r ? "button" : "div", { className: R("hf-profile__row", r && "hf-press"), onClick: r, type: r ? "button" : void 0, style: r ? { width: "100%", textAlign: "left" } : void 0, children: [
    /* @__PURE__ */ e("span", { className: "hf-avatar", "aria-hidden": "true", children: bt(n) }),
    /* @__PURE__ */ i("span", { style: { flex: 1, minWidth: 0 }, children: [
      /* @__PURE__ */ e("h2", { className: "hf-display hf-profile__name hf-truncate", title: n, children: n }),
      (t || a) && /* @__PURE__ */ i("p", { className: "hf-profile__role hf-truncate", children: [
        t && /* @__PURE__ */ e("b", { children: t }),
        t && a && /* @__PURE__ */ e("span", { className: "hf-profile__co", children: " · " }),
        a && /* @__PURE__ */ e("span", { className: "hf-profile__co", children: a })
      ] })
    ] }),
    r && /* @__PURE__ */ e("span", { className: "hf-profile__chev", "aria-hidden": "true", children: /* @__PURE__ */ e(G, { size: 18 }) })
  ] }) });
}
function ie({ text: n, label: t = "What does this mean?", align: a = "centre" }) {
  const [s, r] = x(!1), l = fe(), c = q(null), [o, h] = x(a);
  return O(() => {
    if (!s) return;
    const f = c.current;
    if (f && a === "centre") {
      const A = f.getBoundingClientRect();
      A.left + A.width / 2 - 130 < 8 ? h("right") : A.left + A.width / 2 + 130 > window.innerWidth - 8 ? h("left") : h("centre");
    }
    const d = (A) => {
      A.key === "Escape" && r(!1);
    }, m = () => r(!1);
    return document.addEventListener("keydown", d), document.addEventListener("click", m), () => {
      document.removeEventListener("keydown", d), document.removeEventListener("click", m);
    };
  }, [s, a]), /* @__PURE__ */ i("span", { className: "hf-hint", ref: c, children: [
    /* @__PURE__ */ e(
      "button",
      {
        type: "button",
        className: "hf-hint__btn",
        "aria-label": t,
        "aria-expanded": s,
        "aria-describedby": s ? l : void 0,
        onClick: (f) => {
          f.stopPropagation(), r((d) => !d);
        },
        children: "?"
      }
    ),
    s && /* @__PURE__ */ e(
      "span",
      {
        id: l,
        role: "tooltip",
        className: `hf-hint__pop${o === "left" ? " hf-hint__pop--left" : o === "right" ? " hf-hint__pop--right" : ""}`,
        onClick: (f) => f.stopPropagation(),
        children: n
      }
    )
  ] });
}
function Ne({ open: n, title: t, subtitle: a, onClose: s, children: r, wide: l }) {
  const c = fe(), o = q(null), h = q(s);
  return O(() => {
    h.current = s;
  }), O(() => {
    var A;
    if (!n) return;
    const f = document.activeElement;
    (A = o.current) == null || A.focus();
    const d = (k) => {
      k.key === "Escape" && h.current();
    };
    window.addEventListener("keydown", d);
    const m = document.body.style.overflow;
    return document.body.style.overflow = "hidden", () => {
      var k;
      window.removeEventListener("keydown", d), document.body.style.overflow = m, (k = f == null ? void 0 : f.focus) == null || k.call(f);
    };
  }, [n]), n ? /* @__PURE__ */ e("div", { className: "hf hf-scrim", onClick: s, children: /* @__PURE__ */ i("div", { className: l ? "hf-sheet hf-sheet--wide" : "hf-sheet", role: "dialog", "aria-modal": "true", "aria-labelledby": c, onClick: (f) => f.stopPropagation(), children: [
    /* @__PURE__ */ i("div", { className: "hf-sheet__head", children: [
      /* @__PURE__ */ i("div", { children: [
        /* @__PURE__ */ e("h2", { id: c, className: "hf-sheet__title", children: t }),
        a && /* @__PURE__ */ e("p", { className: "hf-sheet__sub", children: a })
      ] }),
      /* @__PURE__ */ e("button", { ref: o, type: "button", className: "hf-sheet__close", onClick: s, "aria-label": "Close", children: /* @__PURE__ */ e($e, { size: 18 }) })
    ] }),
    r
  ] }) }) : null;
}
function gt(n) {
  const t = n.reduce((a, s) => a + s.weight, 0) || 1;
  return Math.round(n.reduce((a, s) => a + s.score / s.max * s.weight, 0) / t * 100);
}
function Nt(n, t) {
  return n >= t.exceeding ? { label: "Exceeding", icon: /* @__PURE__ */ e(De, { size: 12 }), tone: "brand" } : n >= t.onTrack ? { label: "On track", icon: /* @__PURE__ */ e(et, { size: 12 }), tone: "pop" } : { label: "Needs attention", icon: /* @__PURE__ */ e(Cn, { size: 12 }), tone: "coral" };
}
function kt({ history: n }) {
  if (n.length < 2) return null;
  const t = Math.min(...n) - 4, a = Math.max(...n) + 2, s = 120 / (n.length - 1), r = n.map((o, h) => [h * s, 30 - (o - t) / (a - t || 1) * 28]), l = r.map((o, h) => (h ? "L" : "M") + o[0].toFixed(1) + " " + o[1].toFixed(1)).join(" "), c = r[r.length - 1];
  return /* @__PURE__ */ i("svg", { viewBox: "0 0 120 32", role: "img", "aria-label": `Last ${n.length} months: ${n.join(", ")}`, children: [
    /* @__PURE__ */ e("path", { d: `${l} L${c[0]} 32 L0 32 Z`, fill: "rgb(var(--brand-500) / .12)" }),
    /* @__PURE__ */ e("path", { d: l, fill: "none", stroke: "rgb(var(--brand-500))", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ e("circle", { cx: c[0], cy: c[1], r: "3", fill: "rgb(var(--brand-500))" })
  ] });
}
function za({ factors: n, bands: t, conductPolicy: a, status: s, history: r = [], improve: l = [], building: c, title: o = "Your HiFive Factor" }) {
  var Q;
  const [h, f] = x(!1), [d, m] = x(0), [A, k] = x(0), y = gt(n), u = typeof window < "u" && ((Q = window.matchMedia) == null ? void 0 : Q.call(window, "(prefers-reduced-motion: reduce)").matches), p = typeof document < "u" && document.documentElement.getAttribute("data-tier") === "lite", _ = u || p;
  O(() => {
    if (_) {
      m(1), k(y);
      return;
    }
    const w = setTimeout(() => m(1), 100), I = setTimeout(() => {
      let Y = 0;
      const ee = performance.now(), le = (V) => {
        const N = Math.min(1, (V - ee) / 1100);
        k(Math.round(y * (1 - Math.pow(1 - N, 3)))), N < 1 && (Y = requestAnimationFrame(le));
      };
      return Y = requestAnimationFrame(le), () => cancelAnimationFrame(Y);
    }, 650);
    return () => {
      clearTimeout(w), clearTimeout(I);
    };
  }, [y, _]);
  const b = n.reduce((w, I) => w + I.weight, 0) || 1, $ = 45, v = 2 * Math.PI * $;
  let F = 0;
  const H = n.map((w) => {
    const I = w.score / w.max * w.weight / b * v, Y = { ...w, len: I, offset: F };
    return F += I, Y;
  }), B = Nt(y, t), P = n.find((w) => w.balance), C = P && a ? P.score >= a.warn ? "ok" : P.score >= a.formalWarning ? "watch" : "risk" : "ok", E = `${o} ${y} out of 100: ` + n.map((w) => `${w.label} ${w.score} of ${w.max}`).join(", ") + (s ? `. ${s}` : ""), j = r.length >= 2 ? y - r[0] : null;
  return /* @__PURE__ */ i(U, { children: [
    /* @__PURE__ */ i("button", { type: "button", className: "hf hf-card hf-card--hero hf-factor hf-press", onClick: () => f(!0), "data-tour": "factor", "aria-haspopup": "dialog", children: [
      /* @__PURE__ */ i("div", { className: "hf-factor__head", children: [
        /* @__PURE__ */ i("div", { children: [
          /* @__PURE__ */ i("h3", { className: "hf-display hf-factor__title", children: [
            o,
            " ",
            /* @__PURE__ */ e(ie, { text: `One number, 0 to 100, built from ${n.map((w) => `${w.label.toLowerCase()} (${Math.round(w.weight / b * 100)}%)`).join(", ")}. It is never compared with anyone else. Tap the card for the full breakdown.` })
          ] }),
          /* @__PURE__ */ e("p", { className: "hf-factor__tap", children: "Tap to see how it's built" })
        ] }),
        /* @__PURE__ */ e("span", { className: "hf-factor__chev", "aria-hidden": "true", children: /* @__PURE__ */ e(G, { size: 18 }) })
      ] }),
      /* @__PURE__ */ i("div", { className: "hf-factor__row", children: [
        /* @__PURE__ */ i("div", { className: "hf-ring", children: [
          /* @__PURE__ */ i("svg", { viewBox: "0 0 100 100", role: "img", "aria-label": c ? `${o}: building, first score after your first review` : E, children: [
            /* @__PURE__ */ e("circle", { className: "hf-ring__track", cx: "50", cy: "50", r: $, fill: "none", strokeWidth: "8" }),
            !c && H.map((w, I) => /* @__PURE__ */ e(
              "circle",
              {
                className: R("hf-ring__seg", he(w.tone)),
                cx: "50",
                cy: "50",
                r: $,
                fill: "none",
                strokeWidth: "8",
                stroke: "var(--hf-tone-bar)",
                style: { transitionDelay: `${I * 120}ms`, strokeDasharray: `${w.len * d} ${v}`, strokeDashoffset: -w.offset }
              },
              w.key
            ))
          ] }),
          c ? /* @__PURE__ */ e("span", { className: "hf-ring__building", children: "Building — first score after your first review" }) : /* @__PURE__ */ e("span", { className: "hf-ring__num hf-num", "aria-hidden": "true", children: A })
        ] }),
        /* @__PURE__ */ i("div", { style: { flex: 1, minWidth: 0 }, children: [
          !c && /* @__PURE__ */ i("span", { className: R("hf-band", he(B.tone)), children: [
            B.icon,
            " ",
            B.label
          ] }),
          s && /* @__PURE__ */ e("p", { className: "hf-factor__status", children: s }),
          P && a && C !== "ok" && /* @__PURE__ */ i("p", { className: "hf-factor__warn", children: [
            P.score,
            " conduct points left",
            C === "risk" ? " · formal warning stage" : ""
          ] }),
          /* @__PURE__ */ e("div", { className: "hf-legend", children: n.map((w) => /* @__PURE__ */ i("div", { className: he(w.tone), children: [
            /* @__PURE__ */ e("i", { "aria-hidden": "true" }),
            /* @__PURE__ */ e("span", { children: w.label }),
            /* @__PURE__ */ e("span", { className: "hf-legend__n", children: w.balance ? `${w.score}/${w.max} left` : `${w.score}/${w.max}` })
          ] }, w.key)) })
        ] })
      ] }),
      r.length >= 2 && /* @__PURE__ */ i("div", { className: "hf-spark", children: [
        /* @__PURE__ */ e(kt, { history: r }),
        /* @__PURE__ */ e("div", { children: j !== null && /* @__PURE__ */ i(U, { children: [
          /* @__PURE__ */ i("b", { children: [
            j >= 0 ? "+" : "",
            j
          ] }),
          " over ",
          r.length,
          " months"
        ] }) })
      ] }),
      /* @__PURE__ */ i("span", { className: "hf-factor__cta", "aria-hidden": "true", children: [
        /* @__PURE__ */ e("span", { children: "See how it's built" }),
        /* @__PURE__ */ e("span", { children: /* @__PURE__ */ e(G, { size: 20 }) })
      ] })
    ] }),
    /* @__PURE__ */ i(Ne, { open: h, onClose: () => f(!1), title: o, subtitle: c ? "How it will be built" : `How your ${y} is built`, children: [
      /* @__PURE__ */ e("p", { className: "hf-muted", style: { margin: "0 0 20px", fontSize: 14, lineHeight: 1.6 }, children: "One number that brings together your performance, your conduct and your learning. Only you, your management line, HR and the directors can see it, and it is never compared with anyone else." }),
      /* @__PURE__ */ e("div", { className: "hf-break", children: n.map((w) => {
        const I = Math.round(w.score / w.max * 100), Y = Math.round(w.weight / b * 100), ee = w.balance ? C === "ok" ? "brand" : C === "watch" ? "warn" : "danger" : w.tone;
        return /* @__PURE__ */ i("div", { className: he(ee), children: [
          /* @__PURE__ */ i("div", { className: "hf-break__head", children: [
            /* @__PURE__ */ i("b", { children: [
              w.label,
              " ",
              /* @__PURE__ */ i("small", { children: [
                "· ",
                Y,
                "% of score"
              ] })
            ] }),
            /* @__PURE__ */ e("b", { className: "hf-num", style: { fontWeight: 600 }, children: w.balance ? `${w.score} of ${w.max} left` : `${w.score}/${w.max}` })
          ] }),
          /* @__PURE__ */ i("div", { className: "hf-break__bar", role: "img", "aria-label": `${w.label}: ${I}%`, children: [
            /* @__PURE__ */ e("i", { style: { width: `${I}%` } }),
            w.balance && a && /* @__PURE__ */ e("span", { className: "hf-break__mark", style: { left: `${Math.round(a.formalWarning / w.max * 100)}%` }, title: `Below ${a.formalWarning} points: formal warning` })
          ] }),
          /* @__PURE__ */ e("p", { className: "hf-break__hint", children: w.hint })
        ] }, w.key);
      }) }),
      s && /* @__PURE__ */ i("div", { className: "hf-note", children: [
        /* @__PURE__ */ e(Re, { size: 14, style: { flex: "none", marginTop: 2 } }),
        /* @__PURE__ */ i("span", { children: [
          s,
          ". Your reporting manager will confirm each checkpoint with you."
        ] })
      ] }),
      l.length > 0 && /* @__PURE__ */ i("div", { className: "hf-improve", children: [
        /* @__PURE__ */ e("h4", { children: "What would move it up" }),
        /* @__PURE__ */ e("ol", { children: l.map((w, I) => /* @__PURE__ */ i("li", { children: [
          /* @__PURE__ */ e("i", { children: I + 1 }),
          /* @__PURE__ */ e("span", { children: w })
        ] }, I)) })
      ] })
    ] })
  ] });
}
function ve({ tone: n, icon: t, value: a, label: s, pulse: r, hint: l, onClick: c }) {
  return /* @__PURE__ */ i(c ? "button" : "div", { className: R("hf-tile hf-press", he(n)), onClick: c, type: c ? "button" : void 0, children: [
    /* @__PURE__ */ i("div", { className: "hf-tile__top", children: [
      /* @__PURE__ */ i("span", { className: "hf-tile__ic", children: [
        t,
        r && /* @__PURE__ */ e("span", { className: "hf-tile__pulse", "aria-hidden": "true" })
      ] }),
      l && /* @__PURE__ */ e(ie, { text: l })
    ] }),
    /* @__PURE__ */ i("div", { children: [
      /* @__PURE__ */ e("span", { className: "hf-tile__value hf-num", children: a }),
      /* @__PURE__ */ e("span", { className: "hf-tile__label hf-clamp-2", children: s })
    ] })
  ] });
}
function Pa({ score: n, max: t, policy: a, label: s = "Conduct points left", hint: r, onClick: l }) {
  const c = !a || n >= a.warn ? "ok" : n >= a.formalWarning ? "watch" : "risk", o = c === "ok" ? "brand" : c === "watch" ? "warn" : "danger", h = c === "ok" ? "" : c === "watch" ? " · take care" : " · urgent", f = r ?? `Conduct points are a balance. Everyone starts with ${t}. A recorded issue deducts points; at 0 the contract ends. A clean record restores points over time.${a ? ` Fewer than ${a.formalWarning} means a formal warning.` : ""}`;
  return /* @__PURE__ */ i(
    l ? "button" : "div",
    {
      className: R("hf-tile hf-press", he(o)),
      onClick: l,
      type: l ? "button" : void 0,
      "aria-label": `${s}: ${n} of ${t}${h}`,
      children: [
        /* @__PURE__ */ i("div", { className: "hf-tile__top", children: [
          /* @__PURE__ */ e("span", { className: "hf-tile__ic", children: /* @__PURE__ */ e(xn, { size: 18 }) }),
          /* @__PURE__ */ e(ie, { text: f })
        ] }),
        /* @__PURE__ */ i("div", { children: [
          /* @__PURE__ */ i("span", { className: "hf-tile__value hf-num", children: [
            n,
            /* @__PURE__ */ i("small", { children: [
              " / ",
              t
            ] })
          ] }),
          /* @__PURE__ */ e("span", { className: "hf-pips", "aria-hidden": "true", children: Array.from({ length: t }, (m, A) => /* @__PURE__ */ e("i", { className: A < Math.floor(n) ? "on" : "" }, A)) }),
          /* @__PURE__ */ i("span", { className: "hf-tile__label hf-clamp-2", children: [
            s,
            h
          ] })
        ] })
      ]
    }
  );
}
function Ia({ children: n, wrap: t = !0, label: a }) {
  return /* @__PURE__ */ e("div", { className: R("hf-tiles", t && "hf-tiles--wrap"), role: a ? "group" : void 0, "aria-label": a, children: n });
}
const yt = {
  joiner: { icon: /* @__PURE__ */ e(Me, { size: 20 }), tone: "sky" },
  induction: { icon: /* @__PURE__ */ e(De, { size: 20 }), tone: "brand" },
  probation: { icon: /* @__PURE__ */ e(Ye, { size: 20 }), tone: "brand" },
  anniversary: { icon: /* @__PURE__ */ e(Dn, { size: 20 }), tone: "pop" },
  kudos: { icon: /* @__PURE__ */ e(nt, { size: 20 }), tone: "pop" }
};
function rn({ item: n, onReact: t }) {
  var c, o;
  if (n.type === "pinned")
    return /* @__PURE__ */ i("article", { className: "hf hf-card hf-pinned", children: [
      /* @__PURE__ */ i("div", { className: "hf-pinned__tag", children: [
        /* @__PURE__ */ e(Sn, { size: 12 }),
        " Pinned by HR"
      ] }),
      n.title && /* @__PURE__ */ e("h4", { children: n.title }),
      /* @__PURE__ */ e("p", { children: n.text })
    ] });
  const { icon: a, tone: s } = yt[n.type], r = !!((c = n.mine) != null && c.like), l = !!((o = n.mine) != null && o.clap);
  return /* @__PURE__ */ i("article", { className: R("hf hf-card hf-feedcard", he(s)), children: [
    /* @__PURE__ */ i("div", { className: "hf-feedcard__row", children: [
      /* @__PURE__ */ e("span", { className: "hf-feedcard__ic", "aria-hidden": "true", children: a }),
      /* @__PURE__ */ i("div", { style: { minWidth: 0 }, children: [
        /* @__PURE__ */ e("p", { className: "hf-feedcard__text", children: n.text }),
        n.from && /* @__PURE__ */ i("p", { className: "hf-feedcard__from", children: [
          "— from the ",
          n.from
        ] }),
        /* @__PURE__ */ e("p", { className: "hf-feedcard__when", children: n.when })
      ] })
    ] }),
    t && /* @__PURE__ */ i("div", { className: "hf-feedcard__acts", children: [
      /* @__PURE__ */ i("button", { type: "button", className: "hf-react", "aria-pressed": r, "aria-label": `Thumbs up, ${n.likes}`, onClick: () => t(n.id, "like"), children: [
        /* @__PURE__ */ e(Bn, { size: 14 }),
        " ",
        n.likes
      ] }),
      /* @__PURE__ */ i("button", { type: "button", className: "hf-react", "aria-pressed": l, "aria-label": `Clap, ${n.claps}`, onClick: () => t(n.id, "clap"), children: [
        /* @__PURE__ */ e(me, { size: 14 }),
        " ",
        n.claps
      ] })
    ] })
  ] });
}
function vt({ onKudos: n }) {
  return /* @__PURE__ */ i("div", { className: "hf hf-card hf-feed__quiet hf-tone-brand", children: [
    /* @__PURE__ */ e("span", { className: "hf-feedcard__ic", "aria-hidden": "true", children: /* @__PURE__ */ e($n, { size: 20 }) }),
    /* @__PURE__ */ e("p", { className: "hf-display", children: "Nothing new since yesterday" }),
    /* @__PURE__ */ e("p", { className: "hf-muted", children: "A quiet day across HiFive. New joiners, inductions and kudos appear here as they happen." }),
    n && /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: n, children: "Be the first — give kudos" })
  ] });
}
function Ha({ items: n, onReact: t, onKudos: a }) {
  const s = n.filter((l) => l.type === "pinned"), r = n.filter((l) => l.type !== "pinned");
  return /* @__PURE__ */ i("div", { className: "hf-feed", "data-tour": "feed", children: [
    s.map((l) => /* @__PURE__ */ e(rn, { item: l }, l.id)),
    r.length === 0 ? /* @__PURE__ */ e(vt, { onKudos: a }) : r.map((l) => /* @__PURE__ */ e(rn, { item: l, onReact: t }, l.id))
  ] });
}
function wt(n, t, a = 8) {
  const s = t.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return s.length ? n.filter((r) => {
    const l = r.name.toLowerCase().split(/\s+/);
    return s.every((c) => l.some((o) => o.startsWith(c)));
  }).slice(0, a) : [];
}
function Ln(n) {
  const t = n.trim().split(/\s+/).filter(Boolean);
  return t.length ? t[0].endsWith(".") && t[1] ? `${t[0]} ${t[1]}` : t[0] : n;
}
const ln = {
  "hifive-id": { lucide: "shield-check", nodes: [["path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" }], ["path", { d: "m9 12 2 2 4-4" }]] },
  performance: { lucide: "trending-up", nodes: [["polyline", { points: "22 7 13.5 15.5 8.5 10.5 2 17" }], ["polyline", { points: "16 7 22 7 22 13" }]] },
  todo: { lucide: "square-check", nodes: [["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }], ["path", { d: "m9 12 2 2 4-4" }]] },
  recruitment: { lucide: "user-check", nodes: [["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }], ["circle", { cx: "9", cy: "7", r: "4" }], ["polyline", { points: "16 11 18 13 22 9" }]] },
  lms: { lucide: "book-open", nodes: [["path", { d: "M12 7v14" }], ["path", { d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" }]] },
  apml: { lucide: "phone-call", nodes: [["path", { d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" }], ["path", { d: "M14.05 2a9 9 0 0 1 8 7.94" }], ["path", { d: "M14.05 6A5 5 0 0 1 18 10" }]] },
  transport: { lucide: "route", nodes: [["circle", { cx: "6", cy: "19", r: "3" }], ["path", { d: "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" }], ["circle", { cx: "18", cy: "5", r: "3" }]] },
  inventory: { lucide: "package", nodes: [["path", { d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" }], ["path", { d: "M12 22V12" }], ["path", { d: "m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" }], ["path", { d: "m7.5 4.27 9 5.15" }]] },
  perspectives: { lucide: "compass", nodes: [["path", { d: "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z" }], ["circle", { cx: "12", cy: "12", r: "10" }]] }
}, Ct = [
  { key: "hifive-id", short: "HiFive ID", full: "HiFive ID", hub: !0 },
  { key: "performance", short: "Performance", full: "Performance Hub", hub: !0 },
  { key: "todo", short: "To-Do", full: "To-Do", hub: !0 },
  { key: "recruitment", short: "Recruitment", full: "Recruitment Portal", hub: !0 },
  { key: "lms", short: "Learning Point", full: "HiFive Learning Point", hub: !0 },
  { key: "apml", short: "APML Tracker", full: "APML Tracker", hub: !0 },
  { key: "transport", short: "Logistics", full: "Accuracy Plus Logistics", hub: !0 },
  { key: "inventory", short: "Inventory", full: "HiFive Inventory", hub: !0 },
  { key: "perspectives", short: "Perspectives", full: "Leadership Perspectives", hub: !1 }
], Tn = (n) => ln[n] ?? ln["hifive-id"], En = (n) => Ct.find((t) => t.key === n) ?? null, zn = "M50,0 C88,0 100,12 100,50 C100,88 88,100 50,100 C12,100 0,88 0,50 C0,12 12,0 50,0 Z", ge = (n) => String(n).replace(/[&<>"]/g, (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[t]);
function xt(n) {
  return Tn(n).nodes.map(([t, a]) => `<${t} ${Object.entries(a).map(([s, r]) => `${s}="${ge(r)}"`).join(" ")}/>`).join("");
}
function Pn(n = "tile") {
  const t = n === "maskable" ? 42 : 56;
  return { at: (100 - t) / 2, scale: t / 24 };
}
function Ua(n, { size: t = 64, shape: a = "tile", tile: s = "var(--primary, #024ea3)", mark: r = "var(--on-primary, #ffffff)", title: l } = {}) {
  var m;
  const { at: c, scale: o } = Pn(a), h = t <= 24 ? 2.4 : 2, f = a === "tile" ? `<path d="${zn}" fill="${ge(s)}"/>` : `<rect width="100" height="100" fill="${ge(s)}"/>`, d = l ?? ((m = En(n)) == null ? void 0 : m.full) ?? "HiFive";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${t}" height="${t}" viewBox="0 0 100 100" role="img" aria-label="${ge(d)}">` + f + `<g transform="translate(${c} ${c}) scale(${o})" fill="none" stroke="${ge(r)}" stroke-width="${h}" stroke-linecap="round" stroke-linejoin="round">${xt(n)}</g></svg>`;
}
function Qe({ app: n, size: t = 48, label: a, className: s }) {
  const { at: r, scale: l } = Pn("tile"), c = t <= 24 ? 2.4 : 2;
  return /* @__PURE__ */ i(
    "svg",
    {
      className: s ? `hf-applogo ${s}` : "hf-applogo",
      width: t,
      height: t,
      viewBox: "0 0 100 100",
      role: a ? "img" : void 0,
      "aria-label": a,
      "aria-hidden": a ? void 0 : !0,
      focusable: "false",
      children: [
        /* @__PURE__ */ e("path", { d: zn, fill: "var(--primary)" }),
        /* @__PURE__ */ e("g", { transform: `translate(${r} ${r}) scale(${l})`, fill: "none", stroke: "var(--on-primary)", strokeWidth: c, strokeLinecap: "round", strokeLinejoin: "round", children: Tn(n).nodes.map(([o, h], f) => Zn(o, { key: f, ...h })) })
      ]
    }
  );
}
function ja({ app: n, size: t = 52, name: a }) {
  var s;
  return /* @__PURE__ */ i("span", { className: "hf-applogo-tile", children: [
    /* @__PURE__ */ e(Qe, { app: n, size: t }),
    /* @__PURE__ */ e("span", { className: "hf-applogo-tile__name", children: a ?? ((s = En(n)) == null ? void 0 : s.short) ?? n })
  ] });
}
const St = { learning: "lms", logistics: "transport", admin: "hifive-id", "hifive id": "hifive-id" };
function ke({ app: n, size: t = 40, label: a }) {
  const s = String(n ?? "").trim().toLowerCase();
  return /* @__PURE__ */ e(Qe, { app: St[s] ?? s, size: t, label: a });
}
const cn = ["brand", "sky", "pop", "ink"];
function te({ name: n, size: t = 32, ring: a, photo: s }) {
  const l = n.trim().split(/\s+/).slice(0, a || t < 32 ? 1 : 2).map((o) => o[0]).join("").toUpperCase(), c = cn[[...n].reduce((o, h) => o + h.charCodeAt(0), 0) % cn.length];
  return /* @__PURE__ */ e("span", { className: `hf-av hf-av--${c}${a ? " hf-av--ring" : ""}`, style: { width: t, height: t, fontSize: Math.round(t * 0.38) }, "aria-hidden": "true", children: s ? /* @__PURE__ */ e("img", { src: s, alt: "" }) : l });
}
function qa({ onClick: n }) {
  return /* @__PURE__ */ i("button", { type: "button", className: "hf hf-card hf-kudos-btn hf-press", onClick: n, "aria-haspopup": "dialog", children: [
    /* @__PURE__ */ e("span", { className: "hf-kudos-btn__ic", "aria-hidden": "true", children: /* @__PURE__ */ e(me, { size: 16 }) }),
    "Give kudos to a colleague",
    /* @__PURE__ */ e(G, { size: 16 })
  ] });
}
function Oa({ open: n, onClose: t, people: a, onSend: s }) {
  const [r, l] = x(""), [c, o] = x(""), h = _e(() => wt(a, c), [a, c]), f = a.find((_) => _.id === r) ?? null, [d, m] = x(""), [A, k] = x({}), [y, u] = x(!1);
  async function p() {
    const _ = {};
    r || (_.to = "Choose who the kudos is for");
    const b = d.trim();
    if (b.length < 4 && (_.msg = "Add a few words about what they did"), b.length > 280 && (_.msg = "Keep it under 280 characters"), k(_), _.to || _.msg) return;
    const $ = a.find((v) => v.id === r);
    u(!0);
    try {
      await s($, b), l(""), o(""), m(""), t();
    } catch (v) {
      k({ msg: v instanceof Error && v.message ? v.message : "That didn't send. Try again, or tell HR." });
    } finally {
      u(!1);
    }
  }
  return /* @__PURE__ */ i(Ne, { open: n, onClose: t, title: "Give kudos", children: [
    /* @__PURE__ */ i("div", { className: `hf-field${A.to ? " hf-field--error" : ""}`, children: [
      /* @__PURE__ */ e("label", { htmlFor: "hf-kudos-who", children: /* @__PURE__ */ e("span", { children: "Who" }) }),
      f ? /* @__PURE__ */ i("div", { className: "hf-who", children: [
        /* @__PURE__ */ e(te, { name: f.name, size: 32 }),
        /* @__PURE__ */ i("span", { className: "hf-who__txt", children: [
          /* @__PURE__ */ e("b", { children: f.name }),
          f.detail && /* @__PURE__ */ e("span", { children: f.detail })
        ] }),
        /* @__PURE__ */ e("button", { type: "button", className: "hf-who__x", "aria-label": `Change from ${f.name}`, onClick: () => {
          l(""), o("");
        }, children: /* @__PURE__ */ e($e, { size: 16 }) })
      ] }) : /* @__PURE__ */ i(U, { children: [
        /* @__PURE__ */ i("div", { className: "hf-who__search", children: [
          /* @__PURE__ */ e(qe, { size: 16, "aria-hidden": "true" }),
          /* @__PURE__ */ e(
            "input",
            {
              id: "hf-kudos-who",
              type: "search",
              value: c,
              autoComplete: "off",
              placeholder: a.length ? "Type a name" : "Loading colleagues…",
              onChange: (_) => o(_.target.value),
              "aria-invalid": !!A.to,
              "aria-controls": "hf-kudos-matches",
              disabled: !a.length
            }
          )
        ] }),
        c.trim() && /* @__PURE__ */ i("ul", { id: "hf-kudos-matches", className: "hf-who__list", "aria-label": "Matching colleagues", children: [
          h.map((_) => /* @__PURE__ */ e("li", { children: /* @__PURE__ */ i("button", { type: "button", className: "hf-who__opt", onClick: () => {
            l(_.id), k((b) => ({ ...b, to: void 0 }));
          }, children: [
            /* @__PURE__ */ e(te, { name: _.name, size: 28 }),
            /* @__PURE__ */ i("span", { className: "hf-who__txt", children: [
              /* @__PURE__ */ e("b", { children: _.name }),
              _.detail && /* @__PURE__ */ e("span", { children: _.detail })
            ] })
          ] }) }, _.id)),
          !h.length && /* @__PURE__ */ e("li", { className: "hf-who__none", children: "Nobody by that name. Check the spelling, or try their first name." })
        ] })
      ] }),
      A.to && /* @__PURE__ */ e("p", { className: "hf-field__err", role: "alert", children: A.to })
    ] }),
    /* @__PURE__ */ i("label", { className: `hf-field${A.msg ? " hf-field--error" : ""}`, children: [
      /* @__PURE__ */ e("span", { children: "What did they do?" }),
      /* @__PURE__ */ e(
        "textarea",
        {
          value: d,
          onChange: (_) => m(_.target.value),
          rows: 3,
          maxLength: 300,
          "aria-invalid": !!A.msg,
          placeholder: "Stayed late to help a patient find the right product"
        }
      ),
      /* @__PURE__ */ i("p", { className: "hf-field__count", "aria-live": "polite", children: [
        d.trim().length,
        " / 280"
      ] }),
      A.msg && /* @__PURE__ */ e("p", { className: "hf-field__err", role: "alert", children: A.msg })
    ] }),
    /* @__PURE__ */ e("p", { className: "hf-muted", style: { fontSize: 12, margin: "0 0 16px" }, children: "Kudos appear in the feed for everyone in HiFive after HR approves them, usually the same day." }),
    /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--primary", onClick: p, disabled: y, children: y ? "Sending…" : "Send kudos" })
  ] });
}
function Ra({ rows: n, label: t = "Status" }) {
  return n.length ? /* @__PURE__ */ e("section", { className: "hf hf-card hf-rows", "aria-label": t, children: n.map((a) => /* @__PURE__ */ i("div", { className: "hf-row", children: [
    /* @__PURE__ */ e("span", { className: "hf-row__ic", "aria-hidden": "true", children: a.icon }),
    /* @__PURE__ */ i("span", { className: "hf-row__label", children: [
      a.label,
      a.hint && /* @__PURE__ */ e(ie, { text: a.hint })
    ] }),
    a.value && /* @__PURE__ */ e("span", { className: "hf-row__value", children: a.value }),
    a.action && (a.action.href ? /* @__PURE__ */ e("a", { className: "hf-row__action", href: a.action.href, children: a.action.label }) : /* @__PURE__ */ e("button", { type: "button", className: "hf-row__action", onClick: a.action.onClick, children: a.action.label }))
  ] }, a.key)) }) : null;
}
function Ya({ ok: n }) {
  return /* @__PURE__ */ e("span", { className: "hf-dot", style: n ? void 0 : { background: "rgb(var(--warn))" }, "aria-hidden": "true" });
}
const Bt = {
  factor_band: /* @__PURE__ */ e(De, { size: 24 }),
  probation_confirmed: /* @__PURE__ */ e(Dn, { size: 24 }),
  induction_complete: /* @__PURE__ */ e(Ye, { size: 24 }),
  anniversary: /* @__PURE__ */ e(tt, { size: 24 }),
  kudos: /* @__PURE__ */ e(me, { size: 24 })
};
function Va({ type: n, title: t, detail: a, onDismiss: s }) {
  return /* @__PURE__ */ i("section", { className: "hf hf-card hf-celebrate", "aria-live": "polite", "aria-label": "A moment worth noting", children: [
    /* @__PURE__ */ e("div", { className: "hf-confetti", "aria-hidden": "true", children: Array.from({ length: 14 }).map((r, l) => /* @__PURE__ */ e("i", { style: {
      left: `${l * 7.3 % 100}%`,
      animationDelay: `${l % 7 * 0.18}s`,
      background: l % 3 === 0 ? "rgb(var(--pop-400))" : l % 3 === 1 ? "rgb(var(--brand-400))" : "rgb(var(--sky-400))"
    } }, l)) }),
    /* @__PURE__ */ i("div", { className: "hf-celebrate__row", children: [
      /* @__PURE__ */ e("span", { className: "hf-celebrate__ic", "aria-hidden": "true", children: Bt[n] }),
      /* @__PURE__ */ i("div", { className: "hf-celebrate__body", style: { flex: 1, minWidth: 0 }, children: [
        /* @__PURE__ */ i("p", { className: "hf-celebrate__cap", children: [
          "A moment worth noting ",
          /* @__PURE__ */ e(ie, { text: "Shown once a day, only when something changed for you: a Factor band, a probation decision, an induction completed or an anniversary." })
        ] }),
        /* @__PURE__ */ e("h2", { className: "hf-display hf-celebrate__h", children: t }),
        a && /* @__PURE__ */ e("p", { className: "hf-celebrate__p", children: a })
      ] }),
      /* @__PURE__ */ e("button", { type: "button", className: "hf-celebrate__x", onClick: s, "aria-label": "Dismiss", children: /* @__PURE__ */ e($e, { size: 18 }) })
    ] })
  ] });
}
const pe = { side: "hifive-dock-side", top: "hifive-dock-top", tip: "hifive-dock-tip" }, Ee = (n) => {
  try {
    return localStorage.getItem(n);
  } catch {
    return null;
  }
}, ze = (n, t) => {
  try {
    localStorage.setItem(n, t);
  } catch {
  }
};
function Qa({ apps: n }) {
  const t = q(null), a = q(null), [s, r] = x(() => Ee(pe.side) === "left" ? "left" : "right"), [l, c] = x(() => Number(Ee(pe.top)) || 50), [o, h] = x(() => !Ee(pe.tip)), f = q(!1), d = () => {
    h(!1), ze(pe.tip, "1");
  };
  O(() => {
    ze(pe.side, s), ze(pe.top, String(l));
  }, [s, l]);
  const m = (y) => {
    const u = t.current;
    if (!u) return;
    const p = u.getBoundingClientRect();
    a.current = { x: y.clientX, y: y.clientY, left: p.left, top: p.top, moved: !1 };
  }, A = (y) => {
    const u = a.current, p = t.current;
    if (!u || !p) return;
    const _ = y.clientX - u.x, b = y.clientY - u.y;
    if (!u.moved) {
      if (Math.abs(_) + Math.abs(b) <= 6) return;
      u.moved = !0, p.setPointerCapture(y.pointerId), p.classList.add("dragging");
    }
    p.style.transform = "none", p.style.left = `${u.left + _}px`, p.style.right = "auto", p.style.top = `${u.top + b}px`;
  }, k = () => {
    const y = a.current, u = t.current;
    if (a.current = null, !y || !u || !y.moved) return;
    u.classList.remove("dragging");
    const p = u.getBoundingClientRect(), _ = p.left + p.width / 2 < window.innerWidth / 2 ? "left" : "right", b = Math.round(Math.min(90, Math.max(10, (p.top + p.height / 2) / window.innerHeight * 100)));
    u.style.transform = "", u.style.left = "", u.style.right = "", u.style.top = `${b}%`, r(_), c(b), d(), f.current = !0, setTimeout(() => {
      f.current = !1;
    }, 50);
  };
  return /* @__PURE__ */ i(U, { children: [
    o && /* @__PURE__ */ e("div", { className: "hf hf-dock__scrim", "aria-hidden": "true", onClick: d }),
    /* @__PURE__ */ i(
      "nav",
      {
        ref: t,
        className: R("hf hf-dock", `hf-dock--${s}`),
        "aria-label": "Your apps",
        style: { top: `${l}%` },
        onPointerDown: m,
        onPointerMove: A,
        onPointerUp: k,
        onPointerCancel: k,
        "data-tour": "apps",
        children: [
          /* @__PURE__ */ i("span", { className: "hf-dock__grip", "aria-hidden": "true", children: [
            /* @__PURE__ */ e("i", {}),
            /* @__PURE__ */ e("i", {}),
            /* @__PURE__ */ e("i", {})
          ] }),
          o && /* @__PURE__ */ i("div", { className: "hf-dock__tip", role: "status", children: [
            /* @__PURE__ */ e("b", { children: "Your apps live here." }),
            " Drag this bar to move it to the other side.",
            /* @__PURE__ */ e("button", { type: "button", onClick: (y) => {
              y.stopPropagation(), d();
            }, children: "Got it" })
          ] }),
          n.map((y) => /* @__PURE__ */ i(
            "button",
            {
              type: "button",
              className: "hf-dock__btn hf-dock__btn--mark",
              "aria-label": y.label,
              onClick: (u) => {
                if (f.current) {
                  u.preventDefault();
                  return;
                }
                y.onOpen();
              },
              children: [
                /* @__PURE__ */ e(ke, { app: y.key, size: 44 }),
                /* @__PURE__ */ e("span", { className: "hf-dock__label", "aria-hidden": "true", children: y.label })
              ]
            },
            y.key
          ))
        ]
      }
    )
  ] });
}
function Ja({ apps: n, hideOnDesktop: t = !0 }) {
  return /* @__PURE__ */ e("section", { className: R("hf", t && "hf-apps--hide-desktop"), "aria-label": "Your apps", "data-tour": "apps", children: /* @__PURE__ */ i("div", { className: "hf-card hf-apps2", children: [
    /* @__PURE__ */ i("h3", { className: "hf-cap hf-apps2__head", children: [
      "Your apps ",
      /* @__PURE__ */ e(ie, { text: "Every HiFive app you can open. On a computer they sit in the floating dock at the side." })
    ] }),
    /* @__PURE__ */ e("div", { className: "hf-apps2__grid", children: n.map((a) => /* @__PURE__ */ i("button", { type: "button", className: "hf-app2 hf-press", onClick: a.onOpen, children: [
      /* @__PURE__ */ e(ke, { app: a.key, size: 52 }),
      /* @__PURE__ */ e("span", { className: "hf-app2__label hf-truncate", title: a.label, children: a.label })
    ] }, a.key)) })
  ] }) });
}
const $t = [
  ["water", "Water"],
  ["air", "Air"],
  ["earth", "Earth"],
  ["fire", "Fire"],
  ["luna", "Luna"],
  ["sol", "Sol"],
  ["aami", "Aami"],
  ["aadi", "Aadi"]
], on = {
  water: ["#025EC4", "#0ECCED"],
  air: ["#15A898", "#33363B"],
  earth: ["#2F7A5A", "#8A5A34"],
  fire: ["#AF2610", "#4C2325"],
  luna: ["#26658C", "#54ACBF"],
  sol: ["#FBB931", "#EA6113"],
  aami: ["#610C9F", "#DA0C81"],
  aadi: ["#17566F", "#AF3D41"]
}, Ce = { skin: "water", style: "soft", mode: "light" };
function Dt() {
  const n = document.documentElement;
  return {
    skin: n.getAttribute("data-skin") || Ce.skin,
    style: n.getAttribute("data-style") || Ce.style,
    mode: n.getAttribute("data-theme") || Ce.mode
  };
}
function Mt(n) {
  const t = document.documentElement;
  if (window.hifiveTheme) {
    window.hifiveTheme.set(n);
    return;
  }
  n.skin && t.setAttribute("data-skin", n.skin), n.style && t.setAttribute("data-style", n.style), n.mode && (t.setAttribute("data-theme", n.mode), t.classList.toggle("dark", n.mode === "dark"));
}
function hn({ label: n, value: t, options: a, onPick: s }) {
  return /* @__PURE__ */ i("div", { className: "hf-ap__row", children: [
    /* @__PURE__ */ e("p", { className: "hf-cap", style: { margin: "0 0 8px" }, children: n }),
    /* @__PURE__ */ e("div", { className: "hf-seg", role: "group", "aria-label": n, children: a.map(([r, l]) => /* @__PURE__ */ e("button", { type: "button", "aria-pressed": t === r, onClick: () => s(r), children: l }, r)) })
  ] });
}
function Za({ open: n, onClose: t, onSave: a, onReplayTour: s }) {
  const [r, l] = x(() => typeof document > "u" ? Ce : Dt()), [c, o] = x("idle"), h = q(null);
  function f(d) {
    l((m) => ({ ...m, ...d })), Mt(d), a && (o("saving"), h.current && window.clearTimeout(h.current), h.current = window.setTimeout(async () => o(await a(d) ? "saved" : "failed"), 500));
  }
  return /* @__PURE__ */ i(Ne, { open: n, onClose: t, title: "Appearance", children: [
    /* @__PURE__ */ i("div", { className: "hf-ap__row", children: [
      /* @__PURE__ */ e("p", { className: "hf-cap", style: { margin: "0 0 10px" }, children: "Colours" }),
      /* @__PURE__ */ e("div", { className: "hf-swatches", role: "radiogroup", "aria-label": "Colours", children: $t.map(([d, m]) => /* @__PURE__ */ i("button", { type: "button", role: "radio", "aria-checked": r.skin === d, className: "hf-swatch", onClick: () => f({ skin: d }), children: [
        /* @__PURE__ */ e("span", { className: "hf-swatch__dot", style: { background: `linear-gradient(135deg, ${on[d][0]} 0 52%, ${on[d][1]} 52% 100%)` }, children: r.skin === d && /* @__PURE__ */ e(ae, { size: 18, strokeWidth: 3 }) }),
        /* @__PURE__ */ e("span", { className: "hf-swatch__name", children: m })
      ] }, d)) })
    ] }),
    /* @__PURE__ */ i("div", { className: "hf-ap__pair", children: [
      /* @__PURE__ */ e(hn, { label: "Style", value: r.style, options: [["lit", "Lit"], ["soft", "Soft"]], onPick: (d) => f({ style: d }) }),
      /* @__PURE__ */ e(hn, { label: "Mode", value: r.mode, options: [["light", "Light"], ["dark", "Dark"]], onPick: (d) => f({ mode: d }) })
    ] }),
    /* @__PURE__ */ e("p", { className: "hf-ap__note", "aria-live": "polite", children: c === "failed" ? "Changed here, but it didn't save to your profile. Try again, or tell HR." : c === "saved" ? "Saved. Your choice follows you to every HiFive app and device." : "Default is Water · Soft · Light. Your choice is kept on your profile, so it follows you." }),
    s && /* @__PURE__ */ e("div", { className: "hf-ap__replay", children: /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--secondary", onClick: () => {
      t(), s();
    }, children: "Replay the tour" }) })
  ] });
}
function Ga({ onSearch: n, placeholder: t = "Search", id: a }) {
  const [s, r] = x(""), [l, c] = x([]), [o, h] = x(-1), [f, d] = x(!1), m = fe(), A = q(null);
  O(() => {
    if (!s.trim()) {
      c([]), d(!1);
      return;
    }
    return A.current && window.clearTimeout(A.current), A.current = window.setTimeout(async () => {
      try {
        const p = await n(s.trim());
        c(p), d(!0), h(p.length ? 0 : -1);
      } catch {
        c([]), d(!1);
      }
    }, 250), () => {
      A.current && window.clearTimeout(A.current);
    };
  }, [s, n]);
  const k = (p) => {
    d(!1), r(""), p.onPick ? p.onPick() : p.href && (window.location.href = p.href);
  }, y = (p) => {
    f && (p.key === "ArrowDown" && (p.preventDefault(), h((_) => Math.min(l.length - 1, _ + 1))), p.key === "ArrowUp" && (p.preventDefault(), h((_) => Math.max(0, _ - 1))), p.key === "Enter" && o >= 0 && (p.preventDefault(), k(l[o])), p.key === "Escape" && d(!1));
  }, u = ["People", "Apps", "Policies"];
  return /* @__PURE__ */ i("div", { className: "hf hf-search__wrap", children: [
    /* @__PURE__ */ i("form", { role: "search", className: "hf-search", onSubmit: (p) => p.preventDefault(), children: [
      /* @__PURE__ */ e(qe, { size: 18 }),
      /* @__PURE__ */ e(
        "input",
        {
          id: a,
          type: "search",
          value: s,
          onChange: (p) => r(p.target.value),
          onKeyDown: y,
          placeholder: t,
          "aria-label": "Search people, apps and policies",
          "aria-controls": f ? m : void 0,
          "aria-expanded": f,
          "aria-autocomplete": "list",
          role: "combobox"
        }
      ),
      s && /* @__PURE__ */ e("button", { type: "button", className: "hf-search__clear", onClick: () => r(""), "aria-label": "Clear", children: /* @__PURE__ */ e($e, { size: 16 }) })
    ] }),
    f && /* @__PURE__ */ i("div", { className: "hf-search__results", id: m, role: "listbox", children: [
      l.length === 0 && /* @__PURE__ */ i("p", { className: "hf-search__group hf-muted", style: { margin: 0 }, children: [
        "Nothing matches “",
        s,
        "”."
      ] }),
      u.filter((p) => l.some((_) => _.group === p)).map((p) => /* @__PURE__ */ i("div", { children: [
        /* @__PURE__ */ e("p", { className: "hf-cap hf-search__group", style: { margin: 0 }, children: p }),
        l.map((_, b) => _.group === p && /* @__PURE__ */ i("button", { type: "button", role: "option", "aria-selected": b === o, className: "hf-search__item", onMouseEnter: () => h(b), onClick: () => k(_), children: [
          /* @__PURE__ */ e("span", { className: "hf-truncate", title: _.title, children: _.title }),
          _.detail && /* @__PURE__ */ e("small", { className: "hf-truncate", title: _.detail, children: _.detail })
        ] }, `${p}-${b}`))
      ] }, p))
    ] })
  ] });
}
function Xa({ firstName: n, day: t = 1, firstReview: a, top: s, induction: r, steps: l }) {
  const c = r != null && r.total ? Math.round(r.done / r.total * 100) : 0, o = t <= 7 ? `Day ${t} of your first week` : `Week ${Math.ceil(t / 7)} at HiFive`;
  return /* @__PURE__ */ i("section", { className: "hf hf-card hf-card--hero hf-joiner", "aria-label": "Your first week", "data-tour": "factor", children: [
    s === void 0 && /* @__PURE__ */ e("p", { className: "hf-joiner__day", children: o }),
    /* @__PURE__ */ i("h3", { className: "hf-display hf-joiner__h", children: [
      "Welcome, ",
      n
    ] }),
    /* @__PURE__ */ e("p", { className: "hf-joiner__p", children: s !== void 0 ? s : /* @__PURE__ */ i(U, { children: [
      "Your HiFive Factor starts after your first review",
      a ? ` in ${a}` : "",
      ". Until then, this is your week."
    ] }) }),
    r && r.total > 0 && /* @__PURE__ */ i(U, { children: [
      /* @__PURE__ */ i("div", { className: "hf-joiner__prog", children: [
        /* @__PURE__ */ e("span", { children: "Induction" }),
        /* @__PURE__ */ i("span", { className: "hf-num", style: { fontWeight: 600 }, children: [
          r.done,
          " of ",
          r.total,
          " ",
          r.unit ?? "modules"
        ] })
      ] }),
      /* @__PURE__ */ e("div", { className: "hf-bar", role: "progressbar", "aria-valuenow": c, "aria-valuemin": 0, "aria-valuemax": 100, "aria-label": "Induction progress", children: /* @__PURE__ */ e("i", { style: { width: `${c}%` } }) })
    ] }),
    /* @__PURE__ */ e("ul", { className: "hf-check", children: l.map((h) => /* @__PURE__ */ i("li", { className: h.state, children: [
      /* @__PURE__ */ e("span", { className: "hf-check__dot", "aria-hidden": "true", children: h.state === "done" && /* @__PURE__ */ e(ae, { size: 12 }) }),
      /* @__PURE__ */ e("span", { className: "hf-check__text", children: h.text }),
      h.detail && /* @__PURE__ */ e("span", { className: "hf-check__detail", children: h.detail }),
      h.action ? /* @__PURE__ */ e("a", { className: "hf-check__act", href: h.action.href, children: h.action.label }) : h.state === "next" && /* @__PURE__ */ e("span", { className: "hf-check__next", children: "Next" }),
      /* @__PURE__ */ e("span", { className: "hf-sr", children: h.state === "done" ? ", done" : h.state === "next" ? ", next" : ", to do" })
    ] }, h.text)) })
  ] });
}
const Ft = [
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
], Wt = {
  step: "Step {n} of {of}",
  skip: "Skip",
  back: "Back",
  next: "Next",
  finish: "Finish",
  doneTitle: "That’s your home page",
  doneText: "You’ve seen everything on it. You can replay this from the gear any time.",
  dontShow: "I understand, don’t show this again",
  done: "Done"
}, de = 10, we = 300, dn = () => {
  var n;
  return typeof window < "u" && ((n = window.matchMedia) == null ? void 0 : n.call(window, "(prefers-reduced-motion: reduce)").matches);
};
function Lt(n, t) {
  const [a, s] = x(null);
  return gn(() => {
    if (!t || !n) return;
    const r = document.querySelector(n);
    if (!r) {
      s(null);
      return;
    }
    const l = () => {
      const o = r.getBoundingClientRect();
      s({ top: o.top, left: o.left, width: o.width, height: o.height });
    };
    r.scrollIntoView({ behavior: dn() ? "auto" : "smooth", block: "center", inline: "nearest" });
    const c = setTimeout(l, dn() ? 0 : 380);
    return l(), window.addEventListener("resize", l), window.addEventListener("scroll", l, !0), () => {
      clearTimeout(c), window.removeEventListener("resize", l), window.removeEventListener("scroll", l, !0);
    };
  }, [n, t]), a;
}
function Ka({ open: n, steps: t = Ft, context: a = {}, onSkip: s, onDone: r, labels: l, lang: c }) {
  const o = { ...Wt, ...l || {} }, [h, f] = x([]);
  O(() => {
    n && f(t.filter((E) => (!E.when || E.when(a)) && document.querySelector(E.selector)));
  }, [n, t, a]);
  const [d, m] = x(0), [A, k] = x(!1), [y, u] = x(!0), p = h[d], _ = Lt((p == null ? void 0 : p.selector) ?? "", n && !A), b = q(null);
  O(() => {
    n && (m(0), k(!1), u(!0));
  }, [n]);
  const $ = xe(() => {
    d + 1 >= h.length ? k(!0) : m(d + 1);
  }, [d, h.length]), v = xe(() => {
    A ? k(!1) : d > 0 && m(d - 1);
  }, [d, A]);
  if (O(() => {
    if (!n) return;
    const E = (j) => {
      j.key === "Escape" ? (j.preventDefault(), s()) : (j.key === "ArrowRight" || j.key === "Enter") && !A ? (j.preventDefault(), $()) : j.key === "ArrowLeft" && (j.preventDefault(), v());
    };
    return window.addEventListener("keydown", E), () => window.removeEventListener("keydown", E);
  }, [n, A, $, v, s]), O(() => {
    var E;
    n && ((E = b.current) == null || E.focus());
  }, [n, d, A]), !n || !A && !p) return null;
  const F = window.innerWidth < 768, H = window.innerWidth, B = window.innerHeight;
  if (A)
    return /* @__PURE__ */ e("div", { className: "hf hf-tour__scrim hf-tour__scrim--centre", role: "dialog", "aria-modal": "true", "aria-labelledby": "hf-tour-done", children: /* @__PURE__ */ i("div", { ref: b, tabIndex: -1, className: "hf-tour__card hf-tour__card--done", lang: c, children: [
      /* @__PURE__ */ e("h2", { id: "hf-tour-done", className: "hf-display hf-tour__title", style: { fontSize: 22 }, children: o.doneTitle }),
      /* @__PURE__ */ e("p", { className: "hf-tour__text", style: { fontSize: 15 }, children: o.doneText }),
      /* @__PURE__ */ i("label", { className: "hf-tour__tick", children: [
        /* @__PURE__ */ e("input", { type: "checkbox", checked: y, onChange: (E) => u(E.target.checked) }),
        o.dontShow
      ] }),
      /* @__PURE__ */ i("div", { className: "hf-tour__acts", children: [
        /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: v, children: o.back }),
        /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--primary", style: { width: "auto" }, onClick: () => r(y), children: o.done })
      ] })
    ] }) });
  const P = _ ? { top: _.top - de, left: _.left - de, width: _.width + de * 2, height: _.height + de * 2 } : { inset: 0, borderRadius: 0, boxShadow: "none", background: "rgb(var(--ink-900) / .62)" };
  let C;
  if (F || !_)
    C = {
      left: "max(16px, env(safe-area-inset-left, 0px))",
      right: "max(16px, env(safe-area-inset-right, 0px))",
      bottom: _ && _.top + _.height / 2 > B / 2 && _ ? B - _.top + de + 12 : "calc(16px + env(safe-area-inset-bottom, 0px))"
    };
  else {
    const E = _.top + _.height + de + 12, j = B - _.top + de + 12, Q = Math.min(Math.max(16, _.left + _.width / 2 - we / 2), H - we - 16);
    C = E + 160 < B ? { top: E, left: Q, width: we } : { bottom: j, left: Q, width: we };
  }
  return /* @__PURE__ */ i("div", { className: "hf", children: [
    /* @__PURE__ */ e("div", { className: "hf-tour__spot", style: P, "aria-hidden": "true" }),
    /* @__PURE__ */ i("div", { ref: b, tabIndex: -1, role: "dialog", "aria-modal": "true", "aria-labelledby": "hf-tour-title", "aria-describedby": "hf-tour-text", className: "hf-tour__card", style: C, lang: c, children: [
      /* @__PURE__ */ e("p", { className: "hf-cap hf-tour__step", children: o.step.replace("{n}", String(d + 1)).replace("{of}", String(h.length)) }),
      /* @__PURE__ */ e("h2", { id: "hf-tour-title", className: "hf-display hf-tour__title", children: p.title }),
      /* @__PURE__ */ e("p", { id: "hf-tour-text", className: "hf-tour__text", children: p.text }),
      /* @__PURE__ */ i("div", { className: "hf-tour__acts", children: [
        /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: s, children: o.skip }),
        /* @__PURE__ */ i("span", { className: "hf-tour__nav", children: [
          d > 0 && /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--secondary", style: { minHeight: 44 }, onClick: v, children: o.back }),
          /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--primary", style: { width: "auto", minHeight: 44 }, onClick: $, children: d + 1 >= h.length ? o.finish : o.next })
        ] })
      ] })
    ] })
  ] });
}
const Je = (n) => n === "phone" ? 2 : 4;
function Tt(n) {
  return n.map((t, a) => [t, a]).sort((t, a) => a[0].priority - t[0].priority || t[1] - a[1]).map(([t]) => t);
}
function Et(n, t) {
  const a = t === "phone" ? 0 : t === "tablet" ? 1 : 2, s = Je(t), r = n.map((l) => Math.max(1, Math.min(l.size[a], s)));
  if (t !== "desktop") {
    let l = 0;
    const c = (o) => {
      o >= 0 && l % s && (r[o] += s - l);
    };
    for (let o = 0; o < r.length; o++) {
      if (r[o] >= s) {
        c(o - 1), l = 0;
        continue;
      }
      l + r[o] > s && (c(o - 1), l = 0), l += r[o], l === s && (l = 0);
    }
    c(r.length - 1);
  }
  return r;
}
const zt = 44, fn = (n) => n.span === 1 && n.rows <= zt;
function Pt(n, t) {
  const a = n.map((o) => ({ ...o })), s = Math.max(0, ...a.map((o) => o.row - 1 + o.rows)), r = Array.from({ length: t + 1 }, () => new Array(s + 2).fill(!1)), l = (o, h) => {
    for (let f = o.col; f < o.col + o.span; f++) for (let d = o.row; d < o.row + o.rows; d++) r[f][d] = h;
  }, c = (o, h, f) => {
    if (o < 1 || o > t) return !1;
    for (let d = h; d < h + f; d++) if (r[o][d]) return !1;
    return !0;
  };
  a.forEach((o) => l(o, !0));
  for (const o of a) {
    if (!fn(o)) continue;
    l(o, !1);
    let h = !1;
    for (let f = 1; f < o.row && !h; f++)
      for (let d = 1; d <= t && !h; d++)
        (f === 1 || r[d][f - 1]) && c(d, f, o.rows) && (o.col = d, o.row = f, h = !0);
    l(o, !0);
  }
  for (const o of a) {
    if (!fn(o)) continue;
    const h = { col: o.col, span: o.span };
    let f = o.col, d = o.span;
    for (; c(f + d, o.row, o.rows); ) d++;
    for (; c(f - 1, o.row, o.rows); )
      f--, d++;
    d !== h.span && (o.col = f, o.span = d, l(o, !0));
  }
  return a;
}
function It(n, t, a, s = 40) {
  const r = Je(t), l = Et(n, t), c = Array(r).fill(0), o = n.map((h, f) => {
    const d = l[f], m = Math.max(1, a[h.id] ?? s);
    let A = 0, k = 0, y = 1 / 0;
    for (let u = 0; u + d <= r; u++) {
      const p = c.slice(u, u + d), _ = Math.max(...p), b = p.reduce(($, v) => $ + (_ - v), 0);
      _ + b < y && (y = _ + b, k = _, A = u);
    }
    for (let u = A; u < A + d; u++) c[u] = k + m;
    return { id: h.id, col: A + 1, row: k + 1, span: d, rows: m };
  });
  return Pt(o, r);
}
const In = 4, un = () => typeof window > "u" || window.matchMedia("(min-width: 1024px)").matches ? "desktop" : window.matchMedia("(min-width: 768px)").matches ? "tablet" : "phone";
function Ht() {
  const [n, t] = x(un);
  return O(() => {
    const a = ["(min-width: 1024px)", "(min-width: 768px)"].map((r) => window.matchMedia(r)), s = () => t(un());
    return a.forEach((r) => r.addEventListener("change", s)), () => a.forEach((r) => r.removeEventListener("change", s));
  }, []), n;
}
function ei({ blocks: n, label: t = "Your home page", layout: a }) {
  const s = Ht(), r = a ?? s, l = _e(() => Tt(n.filter((m) => m.show)), [n]), [c, o] = x({}), h = xe((m, A) => o((k) => k[m] === A ? k : { ...k, [m]: A }), []), f = {};
  for (const m of l) f[m.id] = c[m.id] ?? Math.ceil((m.reserve ?? 160) / In);
  const d = It(l, r, f);
  return /* @__PURE__ */ e("div", { className: "hf hf-bento", role: "region", "aria-label": t, style: { gridTemplateColumns: `repeat(${Je(r)}, minmax(0, 1fr))` }, children: l.map((m, A) => /* @__PURE__ */ e(
    Ut,
    {
      id: m.id,
      report: h,
      style: { gridColumn: `${d[A].col} / span ${d[A].span}`, gridRow: `${d[A].row} / span ${d[A].rows}` },
      children: m.node
    },
    m.id
  )) });
}
function Ut({ id: n, report: t, style: a, children: s }) {
  const r = q(null);
  return gn(() => {
    const l = r.current;
    if (!l) return;
    const c = () => t(n, Math.max(1, Math.ceil(l.getBoundingClientRect().height / In)));
    c();
    const o = new ResizeObserver(c);
    return o.observe(l), () => o.disconnect();
  }, [n, t]), /* @__PURE__ */ e("div", { className: "hf-bento__item", "data-block": n, style: a, children: /* @__PURE__ */ e("div", { ref: r, className: "hf-bento__inner", children: s }) });
}
function ni({ firstName: n, reportsTo: t, leads: a = 0, tenure: s, quote: r, search: l, onAppearance: c, onPrivacy: o, now: h = /* @__PURE__ */ new Date() }) {
  const f = h.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  return /* @__PURE__ */ i("header", { className: "hf hf-hello", "data-tour": "topbar", children: [
    /* @__PURE__ */ i("div", { className: "hf-hello__top", children: [
      /* @__PURE__ */ e("p", { className: "hf-hello__date", children: f }),
      l && /* @__PURE__ */ e("div", { className: "hf-hello__search", children: l }),
      c && /* @__PURE__ */ e("button", { type: "button", className: "hf-hello__btn", onClick: c, "aria-label": "Appearance settings", "data-tour": "gear", children: /* @__PURE__ */ e(Nn, { size: 20 }) })
    ] }),
    /* @__PURE__ */ i("h1", { className: "hf-display hf-hello__h1", children: [
      Wn(h),
      ", ",
      n
    ] }),
    (t || a > 0 || s) && /* @__PURE__ */ i("div", { className: "hf-hello__meta", children: [
      t && /* @__PURE__ */ i("span", { children: [
        /* @__PURE__ */ e(kn, { size: 14 }),
        "Reports to ",
        t
      ] }),
      a > 0 && /* @__PURE__ */ i("span", { children: [
        /* @__PURE__ */ e(yn, { size: 14 }),
        "Leads ",
        a,
        " ",
        a === 1 ? "person" : "people"
      ] }),
      s && /* @__PURE__ */ i("span", { children: [
        /* @__PURE__ */ e(vn, { size: 14 }),
        s
      ] })
    ] }),
    o && /* @__PURE__ */ i("button", { type: "button", className: "hf-hello__chip", onClick: o, children: [
      /* @__PURE__ */ e(wn, { size: 12 }),
      " Only you can see this page ",
      /* @__PURE__ */ e(G, { size: 12 })
    ] }),
    r && /* @__PURE__ */ i("blockquote", { className: "hf-hello__quote", children: [
      "“",
      r.body,
      "”",
      r.author && /* @__PURE__ */ i("span", { children: [
        " — ",
        r.author
      ] })
    ] })
  ] });
}
function ti({ rows: n, unavailable: t = [], onRetry: a }) {
  const s = n.reduce((r, l) => r + (l.count ?? 1), 0);
  return /* @__PURE__ */ i("section", { className: "hf hf-card hf-wait", id: "waiting", "aria-label": "Waiting for you", children: [
    /* @__PURE__ */ i("div", { className: "hf-wait__head", children: [
      /* @__PURE__ */ e("span", { className: "hf-wait__bell", "aria-hidden": "true", children: /* @__PURE__ */ e(Cn, { size: 16 }) }),
      /* @__PURE__ */ e("h3", { className: "hf-display hf-wait__title", children: "Waiting for you" }),
      s > 0 && /* @__PURE__ */ e("span", { className: "hf-count", "aria-label": `${s} waiting`, children: s }),
      /* @__PURE__ */ e("span", { style: { marginLeft: "auto" }, children: /* @__PURE__ */ e(ie, { align: "left", text: "Only things that are yours to do, from every HiFive app, most urgent first. When it's empty this card shrinks to one line." }) })
    ] }),
    /* @__PURE__ */ e("ul", { className: "hf-wait__list", children: n.map((r) => {
      const l = /* @__PURE__ */ i(U, { children: [
        /* @__PURE__ */ i("span", { className: "hf-wait__logo", children: [
          /* @__PURE__ */ e(ke, { app: r.app, size: 32 }),
          r.overdue && /* @__PURE__ */ e("span", { className: "hf-due", "aria-hidden": "true", children: /* @__PURE__ */ e("span", { className: "hf-due__ping" }) })
        ] }),
        /* @__PURE__ */ i("span", { className: "hf-wait__txt", children: [
          /* @__PURE__ */ e("span", { className: "hf-wait__what", children: r.text }),
          /* @__PURE__ */ i("span", { className: `hf-wait__when${r.overdue ? " is-overdue" : ""}`, children: [
            r.appName,
            r.when ? ` · ${r.when}` : ""
          ] })
        ] }),
        r.action && /* @__PURE__ */ e("span", { className: "hf-wait__verb", children: r.action }),
        /* @__PURE__ */ e(G, { size: 16, className: "hf-wait__chev", "aria-hidden": "true" })
      ] });
      return /* @__PURE__ */ e("li", { children: r.href ? /* @__PURE__ */ e("a", { className: "hf-wait__row", href: r.href, children: l }) : /* @__PURE__ */ e("button", { type: "button", className: "hf-wait__row", onClick: r.onClick, children: l }) }, r.id);
    }) }),
    t.map((r) => /* @__PURE__ */ i("div", { className: "hf-wait__gap", role: "status", children: [
      /* @__PURE__ */ i("span", { children: [
        "We couldn't reach ",
        r,
        " just now. This part will fill in when it's back."
      ] }),
      a && /* @__PURE__ */ i("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: a, children: [
        /* @__PURE__ */ e(at, { size: 14 }),
        " Try again"
      ] })
    ] }, r))
  ] });
}
function ai() {
  return /* @__PURE__ */ i("section", { className: "hf hf-mini hf-tone-brand", "aria-label": "Waiting for you", children: [
    /* @__PURE__ */ e("span", { className: "hf-mini__ic", children: /* @__PURE__ */ e(it, { size: 18 }) }),
    /* @__PURE__ */ i("span", { children: [
      /* @__PURE__ */ e("span", { className: "hf-display hf-mini__t", children: "Nothing waiting" }),
      /* @__PURE__ */ e("span", { className: "hf-mini__s", children: "for you today" })
    ] })
  ] });
}
const jt = { joiners: Me, anniversary: De, kudos: me, induction: Ye, probation: st, pinned: Sn }, Pe = 4;
function ii({ items: n, limit: t = 4, onKudos: a, onReact: s }) {
  const [r, l] = x(!1), [c, o] = x({}), [h, f] = x(!1), d = n.filter((u) => u.kind === "pinned"), m = n.filter((u) => u.kind !== "pinned"), A = [...d, ...m], k = r ? A : A.slice(0, t), y = m.length === 0 && d.length === 0;
  return /* @__PURE__ */ i("section", { className: "hf hf-card hf-happen", "aria-label": "Happening at HiFive", "data-tour": "feed", children: [
    /* @__PURE__ */ i("div", { className: "hf-happen__head", children: [
      /* @__PURE__ */ e("h3", { className: "hf-display hf-happen__title", children: "Happening at HiFive" }),
      /* @__PURE__ */ e("span", { style: { marginLeft: "auto" }, children: /* @__PURE__ */ e(ie, { align: "left", text: "Joiners, anniversaries, inductions and approved kudos from across HiFive. Grouped so one busy day never fills your page." }) })
    ] }),
    y ? /* @__PURE__ */ i("div", { className: "hf-happen__quiet", children: [
      /* @__PURE__ */ e("span", { className: "hf-kind-well hf-kind--quiet", "aria-hidden": "true", children: /* @__PURE__ */ e($n, { size: 18 }) }),
      /* @__PURE__ */ i("p", { children: [
        "Nothing new since yesterday.",
        a && /* @__PURE__ */ i(U, { children: [
          " ",
          /* @__PURE__ */ e("button", { type: "button", className: "hf-link", onClick: a, children: "Be the first to give kudos." })
        ] })
      ] })
    ] }) : /* @__PURE__ */ e("ul", { className: "hf-happen__list", children: k.map((u) => {
      var b, $, v, F, H, B, P;
      const p = jt[u.kind], _ = !!c[u.id];
      return /* @__PURE__ */ i("li", { className: "hf-happen__row", children: [
        /* @__PURE__ */ i("div", { className: "hf-happen__line", children: [
          (b = u.people) != null && b.length ? /* @__PURE__ */ e("span", { className: "hf-happen__stack", "aria-hidden": "true", children: u.people.slice(0, 3).map((C) => /* @__PURE__ */ e(te, { name: C.name, size: 30, ring: !0 }, C.name)) }) : u.person ? /* @__PURE__ */ i("span", { className: "hf-happen__who", "aria-hidden": "true", children: [
            /* @__PURE__ */ e(te, { name: u.person, size: 36 }),
            /* @__PURE__ */ e("span", { className: `hf-kind-badge hf-kind--${u.kind}`, children: /* @__PURE__ */ e(p, { size: 11 }) })
          ] }) : /* @__PURE__ */ e("span", { className: `hf-kind-well hf-kind--${u.kind}`, "aria-hidden": "true", children: /* @__PURE__ */ e(p, { size: 17 }) }),
          /* @__PURE__ */ e("div", { className: "hf-happen__body", children: ($ = u.people) != null && $.length ? /* @__PURE__ */ i("button", { type: "button", className: "hf-happen__toggle", "aria-expanded": _, onClick: () => {
            o((C) => ({ [u.id]: !C[u.id] })), f(!1);
          }, children: [
            /* @__PURE__ */ e("span", { className: "hf-happen__text", children: u.headline ?? /* @__PURE__ */ i(U, { children: [
              /* @__PURE__ */ i("b", { children: [
                u.people.length,
                " ",
                u.people.length === 1 ? "person" : "people",
                " joined"
              ] }),
              " ",
              u.sub ?? "recently"
            ] }) }),
            /* @__PURE__ */ i("span", { className: "hf-happen__sub", children: [
              [...new Set(u.people.map((C) => C.where).filter(Boolean))].join(" · "),
              " · ",
              /* @__PURE__ */ e("span", { className: "hf-link", children: _ ? "Hide" : "See who" })
            ] })
          ] }) : /* @__PURE__ */ i(U, { children: [
            u.kind === "pinned" && /* @__PURE__ */ e("p", { className: "hf-happen__pin", children: "Pinned by HR" }),
            /* @__PURE__ */ e("p", { className: "hf-happen__text", children: u.text }),
            u.sub && /* @__PURE__ */ e("p", { className: "hf-happen__sub", children: u.sub })
          ] }) }),
          u.when && /* @__PURE__ */ e("span", { className: "hf-happen__when", children: u.when })
        ] }),
        _ && !!((v = u.people) != null && v.length) && /* @__PURE__ */ i("ul", { className: "hf-happen__people", children: [
          (h ? u.people : u.people.slice(0, Pe)).map((C) => /* @__PURE__ */ i("li", { children: [
            /* @__PURE__ */ e(te, { name: C.name, size: 28 }),
            /* @__PURE__ */ i("span", { className: "hf-happen__pname", children: [
              /* @__PURE__ */ e("b", { className: "hf-truncate", children: Ln(C.name) }),
              (C.role || C.where) && /* @__PURE__ */ e("span", { className: "hf-truncate", children: [C.role, C.where].filter(Boolean).join(" · ") })
            ] }),
            C.on && /* @__PURE__ */ e("span", { className: "hf-happen__when", children: C.on })
          ] }, C.name)),
          !h && u.people.length > Pe && /* @__PURE__ */ e("li", { children: /* @__PURE__ */ i("button", { type: "button", className: "hf-link hf-happen__more", onClick: () => f(!0), children: [
            "and ",
            u.people.length - Pe,
            " more"
          ] }) })
        ] }),
        u.kind === "kudos" && s && /* @__PURE__ */ i("div", { className: "hf-happen__reacts", children: [
          /* @__PURE__ */ i("button", { type: "button", className: `hf-react2${(F = u.mine) != null && F.like ? " is-on" : ""}`, "aria-pressed": !!((H = u.mine) != null && H.like), onClick: () => s(u.id, "like"), children: [
            /* @__PURE__ */ e(Bn, { size: 14 }),
            " ",
            u.likes ?? 0
          ] }),
          /* @__PURE__ */ i("button", { type: "button", className: `hf-react2${(B = u.mine) != null && B.clap ? " is-on" : ""}`, "aria-pressed": !!((P = u.mine) != null && P.clap), onClick: () => s(u.id, "clap"), children: [
            /* @__PURE__ */ e(me, { size: 14 }),
            " ",
            u.claps ?? 0
          ] })
        ] })
      ] }, u.id);
    }) }),
    (a || A.length > t) && /* @__PURE__ */ i("div", { className: "hf-happen__foot", children: [
      a && /* @__PURE__ */ i("button", { type: "button", className: "hf-kudos-pill", onClick: a, children: [
        /* @__PURE__ */ e(me, { size: 15 }),
        " Give kudos"
      ] }),
      A.length > t && /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", style: { marginLeft: "auto" }, onClick: () => l((u) => !u), children: r ? "Show less" : `See all ${A.length}` })
    ] })
  ] });
}
function si({ tone: n = "brand", icon: t, title: a, sub: s, hint: r, dot: l, action: c, onClick: o, dark: h }) {
  const f = /* @__PURE__ */ i(U, { children: [
    /* @__PURE__ */ i("span", { className: "hf-mini__top", children: [
      /* @__PURE__ */ e("span", { className: "hf-mini__ic", "aria-hidden": "true", children: t }),
      l && /* @__PURE__ */ e("span", { className: `hf-mini__dot hf-mini__dot--${l}`, "aria-hidden": "true" }),
      r && /* @__PURE__ */ e(ie, { align: "left", text: r })
    ] }),
    /* @__PURE__ */ i("span", { children: [
      /* @__PURE__ */ e("span", { className: "hf-display hf-mini__t", children: a }),
      s && /* @__PURE__ */ e("span", { className: "hf-mini__s", children: s }),
      c && (c.href ? /* @__PURE__ */ e("a", { className: "hf-mini__a", href: c.href, children: c.label }) : /* @__PURE__ */ e("button", { type: "button", className: "hf-mini__a", onClick: (m) => {
        var A;
        m.stopPropagation(), (A = c.onClick) == null || A.call(c);
      }, children: c.label }))
    ] })
  ] }), d = R("hf hf-mini hf-press", h ? "hf-mini--dark" : he(n));
  return o ? /* @__PURE__ */ e("button", { type: "button", className: d, onClick: o, children: f }) : /* @__PURE__ */ e("section", { className: d, children: f });
}
function ri({ members: n, total: t }) {
  if (!n.length) return null;
  const a = t ?? n.length;
  return /* @__PURE__ */ i("section", { className: "hf hf-card hf-team", "aria-label": "Your team", "data-tour": "team", children: [
    /* @__PURE__ */ i("h3", { className: "hf-cap hf-team__head", children: [
      "Your team ",
      /* @__PURE__ */ i("span", { children: [
        a,
        " ",
        a === 1 ? "person" : "people"
      ] })
    ] }),
    /* @__PURE__ */ e("ul", { className: "hf-team__list", children: n.map((s) => {
      const r = /* @__PURE__ */ i(U, { children: [
        /* @__PURE__ */ e(te, { name: s.name, size: 36 }),
        /* @__PURE__ */ i("span", { className: "hf-team__txt", children: [
          /* @__PURE__ */ e("span", { className: "hf-team__name hf-truncate", title: s.name, children: s.name }),
          (s.note || s.sub) && /* @__PURE__ */ e("span", { className: `hf-team__sub hf-truncate${s.note ? " is-note" : ""}`, children: s.note || s.sub })
        ] }),
        s.onOpen && /* @__PURE__ */ e(G, { size: 16, className: "hf-team__chev", "aria-hidden": "true" })
      ] });
      return /* @__PURE__ */ e("li", { children: s.onOpen ? /* @__PURE__ */ e("button", { type: "button", className: "hf-team__row", onClick: s.onOpen, children: r }) : /* @__PURE__ */ e("div", { className: "hf-team__row", children: r }) }, s.name);
    }) })
  ] });
}
const qt = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function Ot(n, t = /* @__PURE__ */ new Date()) {
  const a = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(n ?? ""));
  if (!a) return "";
  const s = `${Number(a[3])} ${qt[Number(a[2]) - 1]}`;
  return Number(a[1]) === t.getFullYear() ? s : `${s} ${a[1]}`;
}
const He = (n) => `${n} item${n === 1 ? "" : "s"}`, Rt = (n) => n > 0 ? `Holding ${He(n)}` : "Nothing held";
function Hn(n, t, a = /* @__PURE__ */ new Date()) {
  if (!(n > 0)) return null;
  const s = Ot(t, a);
  return `${n} to account for${s ? ` since ${s}` : ""}`;
}
function Yt(n) {
  const t = n.map((s) => s.hours).filter((s) => s > 0);
  return `To account for: taken more than ${t.length ? Math.min(...t) : 24} hours ago and not yet marked used or returned.`;
}
function Vt(n, t = /* @__PURE__ */ new Date()) {
  const a = Hn(n.unaccounted, n.since, t);
  return a ? `${He(n.holding)}, ${a}` : He(n.holding);
}
function li(n, t) {
  const a = `${n === 1 ? "Item" : "Items"} in hand`;
  return t > 0 ? `${a} · ${t} to account for` : a;
}
function ci(n) {
  return n ? n.state === "down" ? !0 : n.state === "ok" && n.holding > 0 : !1;
}
function Qt(n, t) {
  if (!t) return { single: null, perUnit: !1 };
  const a = n.map((s) => s.href).filter((s) => !!s);
  return a.length ? n.length > 1 ? { single: null, perUnit: !0 } : { single: a[0], perUnit: !1 } : { single: null, perUnit: !1 };
}
function Jt({ stock: n, self: t = !1, onRetry: a, today: s = /* @__PURE__ */ new Date() }) {
  const r = /* @__PURE__ */ e("h3", { className: "hf-cap", children: "Stock in hand" });
  if (n.state === "loading")
    return /* @__PURE__ */ i("section", { className: "hf hf-card hf-stock", "aria-label": "Stock in hand", "aria-busy": "true", children: [
      r,
      /* @__PURE__ */ e("span", { className: "hf-stock__sk", style: { width: "60%" } }),
      /* @__PURE__ */ e("span", { className: "hf-stock__sk", style: { width: "40%" } })
    ] });
  if (n.state === "down")
    return /* @__PURE__ */ i("section", { className: "hf hf-card hf-stock", "aria-label": "Stock in hand", children: [
      r,
      /* @__PURE__ */ e("p", { className: "hf-stock__note", role: "status", children: "Inventory did not answer just now." }),
      a && /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--secondary hf-stock__retry", onClick: a, children: "Try again" })
    ] });
  if (n.holding <= 0)
    return /* @__PURE__ */ i("section", { className: "hf hf-card hf-stock", "aria-label": "Stock in hand", children: [
      r,
      /* @__PURE__ */ e("p", { className: "hf-stock__row", children: /* @__PURE__ */ i("span", { className: "hf-status hf-status--plain", children: [
        /* @__PURE__ */ e(ae, { size: 12, "aria-hidden": "true" }),
        "Nothing held"
      ] }) })
    ] });
  const l = Hn(n.unaccounted, n.since, s), c = Qt(n.units, t);
  return /* @__PURE__ */ i("section", { className: "hf hf-card hf-stock", "aria-label": "Stock in hand", children: [
    r,
    /* @__PURE__ */ e("p", { className: "hf-stock__lead", children: Rt(n.holding) }),
    l && /* @__PURE__ */ i(U, { children: [
      /* @__PURE__ */ e("p", { className: "hf-stock__row", children: /* @__PURE__ */ i("span", { className: "hf-status hf-status--warn", children: [
        /* @__PURE__ */ e(Re, { size: 12, "aria-hidden": "true" }),
        l
      ] }) }),
      /* @__PURE__ */ e("p", { className: "hf-stock__note", children: Yt(n.units) })
    ] }),
    n.units.length > 1 && /* @__PURE__ */ e("ul", { className: "hf-stock__units", children: n.units.map((o) => /* @__PURE__ */ i("li", { className: "hf-stock__unit", children: [
      /* @__PURE__ */ i("span", { className: "hf-stock__txt", children: [
        /* @__PURE__ */ e("span", { className: "hf-stock__name", children: o.unit }),
        /* @__PURE__ */ e("span", { className: "hf-stock__sub", children: Vt(o, s) })
      ] }),
      c.perUnit && o.href && /* @__PURE__ */ i("a", { className: "hf-stock__link", href: o.href, children: [
        "With me",
        /* @__PURE__ */ e(Se, { size: 14, "aria-hidden": "true" }),
        /* @__PURE__ */ i("span", { className: "hf-sr", children: [
          " in Inventory, ",
          o.unit
        ] })
      ] })
    ] }, o.unit)) }),
    c.single && /* @__PURE__ */ i("a", { className: R("hf-stock__link"), href: c.single, children: [
      "Open “With me” in Inventory",
      /* @__PURE__ */ e(Se, { size: 14, "aria-hidden": "true" })
    ] }),
    !t && /* @__PURE__ */ e("p", { className: "hf-stock__note", children: "Counts only. What the items are stays in Inventory, where managers see their team." })
  ] });
}
const Zt = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function Ue(n) {
  const t = /^(\d{4})-(\d{2})-(\d{2})/.exec(n ?? "");
  return t ? `${Number(t[3])} ${Zt[Number(t[2]) - 1]} ${t[1]}` : n ?? "";
}
function Gt(n) {
  if (n == null || n < 0) return "";
  if (n === 0) return "New this month";
  const t = Math.floor(n / 12), a = n % 12, s = (r, l) => r ? `${r} ${l}${r === 1 ? "" : "s"}` : "";
  return [s(t, "year"), s(a, "month")].filter(Boolean).join(" ");
}
function Xt(n) {
  const t = [`${n.headcount} ${n.headcount === 1 ? "person" : "people"}`];
  return n.joined && t.push(`${n.joined} new`), n.probation && t.push(`${n.probation} on probation`), n.leaving && t.push(`${n.leaving} leaving`), t.join(" · ");
}
function Kt(n) {
  return n.waiting ? n.overdue ? `${n.waiting} waiting · ${n.overdue} overdue` : `${n.waiting} waiting` : "Nothing waiting";
}
function ea(n) {
  const t = [], a = (r) => {
    const l = n.filter(r.test).length;
    l > 0 && l < n.length && t.push(r);
  };
  a({ key: "probation", label: "On probation", test: (r) => !!r.probation }), a({ key: "new", label: "New this month", test: (r) => r.joined });
  const s = [...new Set(n.map((r) => (r.designation ?? "").trim()).filter(Boolean))].sort((r, l) => r.localeCompare(l));
  if (s.length > 1 && s.length <= 8) for (const r of s) a({ key: `role:${r}`, label: r, test: (l) => (l.designation ?? "").trim() === r });
  return t;
}
function Un({ crumbs: n, current: t, onCrumb: a }) {
  const s = t === void 0 ? n.length - 1 : n.length;
  return /* @__PURE__ */ e("nav", { className: "hf-crumbs", "aria-label": "Where you are", children: /* @__PURE__ */ i("ol", { children: [
    n.map((r, l) => /* @__PURE__ */ i("li", { children: [
      l < s ? /* @__PURE__ */ e("button", { type: "button", className: "hf-crumbs__up", onClick: () => a(r), children: r.name }) : /* @__PURE__ */ e("span", { "aria-current": "page", children: r.name }),
      (l < n.length - 1 || t !== void 0) && /* @__PURE__ */ e(G, { size: 14, "aria-hidden": "true", className: "hf-crumbs__sep" })
    ] }, `${r.level}-${r.name}`)),
    t !== void 0 && /* @__PURE__ */ e("li", { children: /* @__PURE__ */ e("span", { "aria-current": "page", children: t }) })
  ] }) });
}
function na({ glance: n }) {
  const t = [
    /* @__PURE__ */ e(ve, { tone: "brand", icon: /* @__PURE__ */ e(rt, { size: 18 }), value: n.headcount, label: n.headcount === 1 ? "person" : "people" }, "people"),
    n.joined > 0 && /* @__PURE__ */ e(ve, { tone: "sky", icon: /* @__PURE__ */ e(Me, { size: 18 }), value: n.joined, label: "joined this month" }, "joined"),
    !!n.probation && /* @__PURE__ */ e(ve, { tone: "pop", icon: /* @__PURE__ */ e(Ve, { size: 18 }), value: n.probation, label: "on probation", hint: "People still in their probation period, as Performance Hub had it this morning." }, "probation"),
    n.leaving > 0 && /* @__PURE__ */ e(ve, { tone: "coral", icon: /* @__PURE__ */ e(lt, { size: 18 }), value: n.leaving, label: "leaving", hint: "People with a last working day set, who are still here." }, "leaving")
  ].filter(Boolean);
  return /* @__PURE__ */ i("div", { className: "hf-glance-wrap", children: [
    /* @__PURE__ */ e("div", { className: "hf-glance", role: "group", "aria-label": "People at a glance", style: { "--n": t.length }, children: t }),
    n.probation === null && /* @__PURE__ */ e("p", { className: "hf-unit-month__none", children: "On probation: not known today." })
  ] });
}
function jn({ month: n, title: t = "Waiting this month", footnote: a }) {
  return n ? /* @__PURE__ */ i("section", { className: "hf hf-card hf-unit-month", "aria-label": t, children: [
    /* @__PURE__ */ i("h3", { className: "hf-cap hf-unit-month__head", children: [
      t,
      " ",
      /* @__PURE__ */ i("span", { children: [
        "as of ",
        Ue(n.day)
      ] })
    ] }),
    /* @__PURE__ */ e("ul", { children: n.apps.map((s) => /* @__PURE__ */ i("li", { children: [
      /* @__PURE__ */ e(ke, { app: s.app, size: 32 }),
      /* @__PURE__ */ e("span", { className: "hf-unit-month__app", children: s.label }),
      /* @__PURE__ */ e("span", { className: "hf-unit-month__n hf-num", children: s.waiting ? `${s.waiting} waiting` : Kt(s) }),
      s.overdue > 0 && /* @__PURE__ */ i("span", { className: "hf-status hf-status--warn", children: [
        /* @__PURE__ */ e(Mn, { size: 12, "aria-hidden": "true" }),
        s.overdue,
        " overdue"
      ] })
    ] }, s.app)) }),
    n.unknown.length > 0 && /* @__PURE__ */ i("p", { className: "hf-unit-month__none", children: [
      n.unknown.join(", "),
      " did not answer this morning: not known today."
    ] }),
    a && /* @__PURE__ */ e("p", { className: "hf-unit-month__foot", children: a })
  ] }) : /* @__PURE__ */ i("section", { className: "hf hf-card hf-unit-month", "aria-label": t, children: [
    /* @__PURE__ */ e("h3", { className: "hf-cap", children: t }),
    /* @__PURE__ */ e("p", { className: "hf-unit-month__none", children: "The first count is taken tomorrow morning." })
  ] });
}
function oi({ crumbs: n, onCrumb: t, title: a, note: s, glance: r, month: l, units: c, people: o, onOpenUnit: h, onOpenPerson: f, feed: d, direction: m = "down" }) {
  const A = _e(() => ea(o ?? []), [o]), [k, y] = x(null), u = A.find((b) => b.key === k), p = o ? o.filter((b) => !u || u.test(b)) : [], _ = c ? c.length && c[0].level === "department" ? "Departments" : "Facilities" : "People";
  return /* @__PURE__ */ i("div", { className: R("hf hf-unitpage", `hf-slide--${m}`), children: [
    /* @__PURE__ */ e(Un, { crumbs: n, onCrumb: t }),
    /* @__PURE__ */ i("header", { className: "hf-unitpage__head", children: [
      /* @__PURE__ */ e("h1", { className: "hf-display hf-unitpage__title", children: a }),
      s && /* @__PURE__ */ e("p", { className: "hf-unitpage__note", children: s })
    ] }),
    o && A.length > 0 && /* @__PURE__ */ i("div", { className: "hf-chips", role: "group", "aria-label": "Filter people", children: [
      /* @__PURE__ */ e("button", { type: "button", className: R("hf-chip", !u && "is-on"), "aria-pressed": !u, onClick: () => y(null), children: "Everyone" }),
      A.map((b) => /* @__PURE__ */ e(
        "button",
        {
          type: "button",
          className: R("hf-chip", (u == null ? void 0 : u.key) === b.key && "is-on"),
          "aria-pressed": (u == null ? void 0 : u.key) === b.key,
          onClick: () => y((u == null ? void 0 : u.key) === b.key ? null : b.key),
          children: b.label
        },
        b.key
      ))
    ] }),
    /* @__PURE__ */ e(na, { glance: r }),
    /* @__PURE__ */ i("div", { className: "hf-unitpage__cols", children: [
      /* @__PURE__ */ i("section", { className: "hf-unitpage__kids", "aria-label": _, children: [
        /* @__PURE__ */ i("h2", { className: "hf-cap", children: [
          _,
          o && u ? ` · ${p.length} of ${o.length}` : ""
        ] }),
        c && /* @__PURE__ */ e("ul", { className: "hf-kids", children: c.map((b) => /* @__PURE__ */ e("li", { children: /* @__PURE__ */ i("button", { type: "button", className: "hf hf-card hf-kid hf-press", onClick: () => h == null ? void 0 : h(b), children: [
          /* @__PURE__ */ i("span", { className: "hf-kid__txt", children: [
            /* @__PURE__ */ e("span", { className: "hf-kid__name", children: b.name }),
            b.brand && /* @__PURE__ */ e("span", { className: "hf-kid__brand", children: b.brand }),
            /* @__PURE__ */ e("span", { className: "hf-kid__line", children: Xt(b.glance) })
          ] }),
          /* @__PURE__ */ e(G, { size: 18, "aria-hidden": "true", className: "hf-kid__chev" })
        ] }) }, `${b.entity}-${b.department ?? ""}`)) }),
        o && /* @__PURE__ */ e("ul", { className: "hf-kids hf-kids--people", children: p.map((b) => {
          const $ = /* @__PURE__ */ i(U, { children: [
            /* @__PURE__ */ e(te, { name: b.name, size: 40 }),
            /* @__PURE__ */ i("span", { className: "hf-kid__txt", children: [
              /* @__PURE__ */ e("span", { className: "hf-kid__name hf-truncate", children: b.name }),
              b.designation && /* @__PURE__ */ e("span", { className: "hf-kid__line hf-truncate", children: b.designation }),
              (b.probation || b.joined) && /* @__PURE__ */ i("span", { className: "hf-kid__chips", children: [
                b.joined && /* @__PURE__ */ i("span", { className: "hf-status hf-status--ok", children: [
                  /* @__PURE__ */ e(Me, { size: 12, "aria-hidden": "true" }),
                  "New"
                ] }),
                b.probation && /* @__PURE__ */ i("span", { className: R("hf-status", b.probation === "Extended" ? "hf-status--warn" : "hf-status--plain"), children: [
                  /* @__PURE__ */ e(Ve, { size: 12, "aria-hidden": "true" }),
                  b.probation
                ] })
              ] })
            ] }),
            b.code && f && /* @__PURE__ */ e(G, { size: 18, "aria-hidden": "true", className: "hf-kid__chev" })
          ] });
          return /* @__PURE__ */ e("li", { children: b.code && f ? /* @__PURE__ */ e("button", { type: "button", className: "hf hf-card hf-kid hf-press", onClick: () => f(b), children: $ }) : /* @__PURE__ */ e("div", { className: "hf hf-card hf-kid", children: $ }) }, b.code ?? b.name);
        }) })
      ] }),
      /* @__PURE__ */ i("aside", { className: "hf-unitpage__side", children: [
        /* @__PURE__ */ e(jn, { month: l }),
        d
      ] })
    ] })
  ] });
}
function hi({ crumbs: n, onCrumb: t, self: a, person: s, line: r, onOpenPerson: l, probation: c, waiting: o, direction: h = "down", stock: f, onStockRetry: d }) {
  const m = Gt(s.tenure_months), A = [s.department, s.entity].filter(Boolean).join(" · ");
  return /* @__PURE__ */ i("div", { className: R("hf hf-unitpage hf-person", `hf-slide--${h}`), children: [
    n.length > 0 && /* @__PURE__ */ e(Un, { crumbs: n, current: s.name, onCrumb: t }),
    /* @__PURE__ */ i("section", { className: "hf hf-card hf-person__head", children: [
      /* @__PURE__ */ e(te, { name: s.name, size: 64 }),
      /* @__PURE__ */ i("div", { className: "hf-person__txt", children: [
        /* @__PURE__ */ e("h1", { className: "hf-display hf-unitpage__title", children: a ? "Your page" : s.name }),
        s.designation && /* @__PURE__ */ e("p", { className: "hf-person__job", children: s.designation }),
        A && /* @__PURE__ */ e("p", { className: "hf-person__where", children: A }),
        s.start_date && /* @__PURE__ */ i("p", { className: "hf-person__where", children: [
          "Joined ",
          Ue(s.start_date),
          m ? ` · ${m}` : ""
        ] })
      ] })
    ] }),
    /* @__PURE__ */ i("div", { className: "hf-unitpage__cols", children: [
      /* @__PURE__ */ i("div", { className: "hf-unitpage__kids", children: [
        (!c.known || c.stage) && /* @__PURE__ */ i("section", { className: "hf hf-card hf-person__probation", "aria-label": "Probation", children: [
          /* @__PURE__ */ e("h3", { className: "hf-cap", children: "Probation" }),
          c.known ? /* @__PURE__ */ i(U, { children: [
            /* @__PURE__ */ i("p", { className: "hf-person__stage", children: [
              /* @__PURE__ */ i("span", { className: R("hf-status", c.stage === "Extended" ? "hf-status--warn" : "hf-status--plain"), children: [
                /* @__PURE__ */ e(Ve, { size: 12, "aria-hidden": "true" }),
                c.stage
              ] }),
              c.month_no && c.of_months ? /* @__PURE__ */ i("span", { className: "hf-num", children: [
                "Month ",
                c.month_no,
                " of ",
                c.of_months
              ] }) : null
            ] }),
            c.month_no && c.of_months ? /* @__PURE__ */ e("span", { className: "hf-month-pips", role: "img", "aria-label": `Month ${c.month_no} of ${c.of_months}`, children: Array.from({ length: c.of_months }, (k, y) => /* @__PURE__ */ e("span", { className: R("hf-month-pip", y < c.month_no && "is-on") }, y)) }) : null,
            c.end_date && /* @__PURE__ */ i("p", { className: "hf-person__where", children: [
              "Ends ",
              Ue(c.end_date)
            ] })
          ] }) : /* @__PURE__ */ e("p", { className: "hf-unit-month__none", children: "Not known today: Performance Hub did not answer this morning." })
        ] }),
        f && /* @__PURE__ */ e(Jt, { stock: f, self: !!a, onRetry: d }),
        r.length > 0 && /* @__PURE__ */ i("section", { className: "hf hf-card hf-team", "aria-label": "Reporting line", children: [
          /* @__PURE__ */ e("h3", { className: "hf-cap hf-team__head", children: "Reporting line" }),
          /* @__PURE__ */ e("ul", { className: "hf-team__list", children: r.map((k) => {
            const y = /* @__PURE__ */ i(U, { children: [
              /* @__PURE__ */ e(te, { name: k.name, size: 36 }),
              /* @__PURE__ */ i("span", { className: "hf-team__txt", children: [
                /* @__PURE__ */ e("span", { className: "hf-team__name hf-truncate", children: k.name }),
                k.designation && /* @__PURE__ */ e("span", { className: "hf-team__sub hf-truncate", children: k.designation })
              ] }),
              k.code && l && /* @__PURE__ */ e(G, { size: 16, className: "hf-team__chev", "aria-hidden": "true" })
            ] });
            return /* @__PURE__ */ e("li", { children: k.code && l ? /* @__PURE__ */ e("button", { type: "button", className: "hf-team__row", onClick: () => l(k.code), children: y }) : /* @__PURE__ */ e("div", { className: "hf-team__row", children: y }) }, `${k.name}-${k.code ?? ""}`);
          }) })
        ] })
      ] }),
      /* @__PURE__ */ e("aside", { className: "hf-unitpage__side", children: /* @__PURE__ */ e(
        jn,
        {
          month: o,
          title: a ? "Waiting for you" : `Waiting for ${Ln(s.name)}`,
          footnote: "Counts only. What each one is stays in its app."
        }
      ) })
    ] })
  ] });
}
const re = "__skipped__", An = ["", "Poor", "Below expectations", "Meets expectations", "Strong", "Excellent"], qn = (n, t) => !!n && Object.entries(n).some(([a, s]) => s.includes(String(t[a] ?? ""))), Fe = (n, t) => !n.showWhen || qn(n.showWhen, t), je = (n, t) => Fe(n, t) && (!n.optional || qn(n.requiredWhen, t)), Ze = (n) => n == null || n === "" || n === !1 || typeof n == "string" && !n.trim(), ta = (n) => !Ze(n) && n !== re, On = (n, t) => n.fields.filter((a) => Fe(a, t) && ta(t[a.key])).length;
function aa(n, t) {
  const a = n.minAnswered;
  return !a || On(n, t) >= a.count ? null : `${a.word[0].toUpperCase()}${a.word.slice(1)} at least ${a.count}.`;
}
function ia(n, t) {
  return n.fields.filter((a) => je(a, t) && t[a.key] !== re && Ze(t[a.key]));
}
function sa(n, t) {
  const a = {};
  for (const s of n) for (const r of s.fields) {
    if (!Fe(r, t)) continue;
    const l = t[r.key];
    l !== re && (Ze(l) && r.type !== "check" || (a[r.key] = typeof l == "string" ? l.trim() : l ?? !1));
  }
  return a;
}
function pn(n) {
  if (!n.length) return null;
  const t = n[0], a = t.type === "scale" ? `a score for ${t.label}` : t.type === "check" ? `a tick for "${t.label}"` : `"${t.label}"`;
  return n.length === 1 ? `Still needs ${a}.` : `Still needs ${a} and ${n.length - 1} more.`;
}
function ra({ ctx: n, first: t, open: a }) {
  var c, o, h, f, d, m;
  const [s, r] = x(a);
  return ((c = n.profile) == null ? void 0 : c.length) || n.callout || n.notes || ((o = n.history) == null ? void 0 : o.length) || ((h = n.links) == null ? void 0 : h.length) ? /* @__PURE__ */ i("section", { className: "hf-quick__ctx", "aria-label": `About ${t}`, children: [
    /* @__PURE__ */ i("button", { type: "button", className: "hf-quick__ctxtoggle", "aria-expanded": s, onClick: () => r((A) => !A), children: [
      /* @__PURE__ */ i("span", { children: [
        "About ",
        t
      ] }),
      /* @__PURE__ */ e(Fn, { size: 16, "aria-hidden": "true" })
    ] }),
    s && /* @__PURE__ */ i("div", { className: "hf-quick__ctxbody", children: [
      !!((f = n.profile) != null && f.length) && /* @__PURE__ */ e("dl", { className: "hf-quick__grid", children: n.profile.map((A) => /* @__PURE__ */ i("div", { children: [
        /* @__PURE__ */ e("dt", { children: A.label }),
        /* @__PURE__ */ e("dd", { children: A.value })
      ] }, A.label)) }),
      n.callout && /* @__PURE__ */ i("div", { className: "hf-quick__callout", children: [
        /* @__PURE__ */ e("p", { className: "hf-quick__ctitle", children: n.callout.title }),
        /* @__PURE__ */ e("ul", { children: n.callout.lines.map((A) => /* @__PURE__ */ e("li", { children: A }, A)) }),
        n.callout.note && /* @__PURE__ */ e("p", { className: "hf-quick__cnote", children: n.callout.note })
      ] }),
      n.notes && /* @__PURE__ */ i("div", { className: "hf-quick__notes", children: [
        /* @__PURE__ */ e("p", { className: "hf-quick__ctitle", children: n.notes.title }),
        /* @__PURE__ */ e("p", { children: n.notes.text })
      ] }),
      !!((d = n.history) != null && d.length) && /* @__PURE__ */ i("div", { children: [
        /* @__PURE__ */ e("p", { className: "hf-quick__ctitle", children: "Interview history" }),
        /* @__PURE__ */ e("ul", { className: "hf-quick__hist", children: n.history.map((A, k) => /* @__PURE__ */ i("li", { className: `is-${A.outcome ?? "open"}`, children: [
          /* @__PURE__ */ e("span", { className: "hf-quick__dot", "aria-hidden": "true", children: A.outcome === "pass" ? "✓" : A.outcome === "fail" ? "✕" : "·" }),
          /* @__PURE__ */ i("div", { children: [
            /* @__PURE__ */ e("p", { className: "hf-quick__htitle", children: A.title }),
            A.sub && /* @__PURE__ */ e("p", { className: "hf-quick__sub", children: A.sub }),
            A.quote && /* @__PURE__ */ i("p", { className: "hf-quick__quote", children: [
              "“",
              A.quote,
              "”"
            ] })
          ] })
        ] }, `${A.title}-${k}`)) })
      ] }),
      !!((m = n.links) != null && m.length) && /* @__PURE__ */ e("div", { className: "hf-quick__links", children: n.links.map((A) => /* @__PURE__ */ i("a", { href: A.href, target: "_blank", rel: "noopener", children: [
        /* @__PURE__ */ e(Ie, { size: 14 }),
        " ",
        A.label,
        " ",
        /* @__PURE__ */ e(Se, { size: 12 })
      ] }, A.href)) })
    ] })
  ] }) : null;
}
function di({ form: n, open: t, onSave: a, onClose: s }) {
  var Y, ee, le, V;
  const [r, l] = x([]), [c, o] = x(0), [h, f] = x(0), [d, m] = x({}), [A, k] = x(!1), [y, u] = x([]), [p, _] = x(!1), [b, $] = x(null);
  O(() => {
    !t || !n || (l(n.items), o(0), f(0), m({}), k(!1), u([]), $(null));
  }, [t, n]);
  const v = r[c], F = _e(() => {
    var N;
    return (N = v == null ? void 0 : v.steps) != null && N.length ? v.steps : (n == null ? void 0 : n.steps) ?? [];
  }, [v, n]);
  if (!n || !v || !F.length) return /* @__PURE__ */ e(Ne, { open: t && !!n, onClose: () => s(y), title: (n == null ? void 0 : n.title) ?? "", children: /* @__PURE__ */ e("p", { className: "hf-muted", children: "Nothing is waiting here any more." }) });
  const H = F[h], B = h === F.length - 1, P = c === r.length - 1, C = ia(H, d), E = aa(H, d), j = (N, z) => {
    m((J) => ({ ...J, [N]: z })), $(null);
  }, Q = n.unit.toLowerCase();
  async function w() {
    if (C.length || E) {
      k(!0);
      return;
    }
    if (k(!1), !B) {
      f(h + 1);
      return;
    }
    _(!0);
    try {
      await a(v, sa(F, d));
      const N = [...y, v.id];
      if (u(N), P) {
        s(N);
        return;
      }
      o(c + 1), f(0), m({});
    } catch (N) {
      const z = N;
      if ($({ text: (z == null ? void 0 : z.message) || "That didn't save. Try again, or open it in the app.", field: z == null ? void 0 : z.field }), z != null && z.field) {
        const J = F.findIndex((X) => X.fields.some((ce) => ce.key === z.field));
        J >= 0 && f(J);
      }
    } finally {
      _(!1);
    }
  }
  const I = B ? P ? "Save" : `Save and next ${Q}` : "Next";
  return /* @__PURE__ */ e(Ne, { open: t, onClose: () => s(y), title: n.title, children: /* @__PURE__ */ i("div", { className: "hf-quick", children: [
    /* @__PURE__ */ i("div", { className: "hf-quick__app", children: [
      /* @__PURE__ */ e(ke, { app: n.app, size: 28 }),
      /* @__PURE__ */ e("span", { children: n.appName })
    ] }),
    r.length > 1 && /* @__PURE__ */ i("div", { className: "hf-quick__run", "aria-label": `${n.unit} ${c + 1} of ${r.length}`, children: [
      /* @__PURE__ */ i("span", { children: [
        n.unit,
        " ",
        c + 1,
        " of ",
        r.length
      ] }),
      /* @__PURE__ */ e("span", { className: "hf-quick__dots", "aria-hidden": "true", children: r.map((N, z) => /* @__PURE__ */ e("i", { className: z < c ? "is-done" : z === c ? "is-on" : "" }, N.id)) })
    ] }),
    /* @__PURE__ */ i("div", { className: "hf-quick__who", children: [
      /* @__PURE__ */ e(te, { name: v.name, size: 44 }),
      /* @__PURE__ */ i("div", { children: [
        /* @__PURE__ */ e("p", { className: "hf-quick__name", children: v.name }),
        v.sub && /* @__PURE__ */ e("p", { className: "hf-quick__sub", children: v.sub }),
        v.when && /* @__PURE__ */ e("p", { className: "hf-quick__sub", children: v.when }),
        !!((ee = (Y = v.context) == null ? void 0 : Y.chips) != null && ee.length || (le = v.facts) != null && le.length) && /* @__PURE__ */ e("div", { className: "hf-quick__facts", children: [...((V = v.context) == null ? void 0 : V.chips) ?? [], ...v.facts ?? []].map((N) => /* @__PURE__ */ e("span", { children: N }, N)) })
      ] })
    ] }),
    v.context && /* @__PURE__ */ e(ra, { ctx: v.context, first: v.name.split(" ")[0], open: h === 0 }, `${v.id}-${h === 0}`),
    F.length > 1 && /* @__PURE__ */ e("ol", { className: "hf-quick__steps", children: F.map((N, z) => /* @__PURE__ */ e("li", { className: z === h ? "is-on" : z < h ? "is-done" : "", children: N.title }, N.title)) }),
    (H.legend || H.minAnswered) && /* @__PURE__ */ i("div", { className: "hf-quick__legend", children: [
      H.legend && /* @__PURE__ */ e("span", { children: H.legend }),
      H.minAnswered && /* @__PURE__ */ i("span", { className: A && E ? "is-bad" : "", children: [
        On(H, d),
        " of ",
        H.fields.length,
        " ",
        H.minAnswered.done ?? "answered",
        " · at least ",
        H.minAnswered.count
      ] })
    ] }),
    /* @__PURE__ */ e("div", { className: "hf-quick__fields", children: H.fields.filter((N) => Fe(N, d)).map((N) => {
      var X, ce;
      const z = A && C.includes(N) || (b == null ? void 0 : b.field) === N.key, J = `hf-q-${N.key}`;
      return /* @__PURE__ */ i("div", { className: `hf-quick__f${z ? " is-bad" : ""}`, children: [
        N.type !== "check" && /* @__PURE__ */ i("div", { className: "hf-quick__labelrow", children: [
          /* @__PURE__ */ i("p", { className: "hf-quick__label", id: `${J}-l`, children: [
            N.label,
            !je(N, d) && !N.skipLabel && /* @__PURE__ */ e("span", { children: " (optional)" })
          ] }),
          N.skipLabel && /* @__PURE__ */ e(
            "button",
            {
              type: "button",
              className: `hf-quick__skip${d[N.key] === re ? " is-on" : ""}`,
              "aria-pressed": d[N.key] === re,
              onClick: () => j(N.key, d[N.key] === re ? "" : re),
              children: N.skipLabel
            }
          )
        ] }),
        (((X = v.hints) == null ? void 0 : X[N.key]) ?? N.hint) && /* @__PURE__ */ e("p", { className: "hf-quick__hint", children: ((ce = v.hints) == null ? void 0 : ce[N.key]) ?? N.hint }),
        N.type === "scale" && d[N.key] === re && /* @__PURE__ */ i("p", { className: "hf-quick__skipped", children: [
          N.skipLabel,
          ": left out of the score."
        ] }),
        N.type === "scale" && d[N.key] !== re && /* @__PURE__ */ i(U, { children: [
          /* @__PURE__ */ e("div", { className: `hf-quick__scale${(N.max ?? 5) > 5 ? " hf-quick__scale--wide" : ""}`, role: "radiogroup", "aria-labelledby": `${J}-l`, children: Array.from({ length: N.max ?? 5 }, (T, We) => We + 1).map((T) => /* @__PURE__ */ e(
            "button",
            {
              type: "button",
              role: "radio",
              "aria-checked": d[N.key] === T,
              "aria-label": (N.max ?? 5) === 5 ? `${T}, ${An[T]}` : `${T} of ${N.max}`,
              className: d[N.key] === T ? "is-on" : "",
              onClick: () => j(N.key, d[N.key] === T && !je(N, d) ? "" : T),
              children: T
            },
            T
          )) }),
          (N.max ?? 5) === 5 && /* @__PURE__ */ e("p", { className: "hf-quick__word", "aria-live": "polite", children: d[N.key] ? An[Number(d[N.key])] : "" })
        ] }),
        N.type === "choice" && /* @__PURE__ */ e("div", { className: "hf-quick__pills", role: "radiogroup", "aria-labelledby": `${J}-l`, children: (N.options ?? []).map((T) => /* @__PURE__ */ e("button", { type: "button", role: "radio", "aria-checked": d[N.key] === T, className: d[N.key] === T ? "is-on" : "", onClick: () => j(N.key, T), children: T }, T)) }),
        N.type === "text" && /* @__PURE__ */ e(
          "textarea",
          {
            id: J,
            "aria-labelledby": `${J}-l`,
            rows: 3,
            value: String(d[N.key] ?? ""),
            placeholder: N.placeholder,
            onChange: (T) => j(N.key, T.target.value),
            "aria-invalid": z
          }
        ),
        N.type === "check" && /* @__PURE__ */ i("label", { className: "hf-quick__check", children: [
          /* @__PURE__ */ e("input", { type: "checkbox", checked: !!d[N.key], onChange: (T) => j(N.key, T.target.checked) }),
          " ",
          N.label
        ] }),
        z && !b && /* @__PURE__ */ e("p", { className: "hf-quick__err", role: "alert", children: N.type === "scale" ? `Pick a score from 1 to ${N.max ?? 5}.` : N.type === "text" ? "Add a line or two." : N.type === "check" ? "Tick this to go on." : "Choose one." })
      ] }, N.key);
    }) }),
    b && /* @__PURE__ */ e("p", { className: "hf-quick__err hf-quick__err--save", role: "alert", children: b.text }),
    A && (pn(C) ?? E) && /* @__PURE__ */ e("p", { className: "hf-quick__missing", role: "status", children: pn(C) ?? E }),
    /* @__PURE__ */ i("div", { className: "hf-quick__foot", children: [
      h > 0 && /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: () => f(h - 1), disabled: p, children: "Back" }),
      /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--primary", onClick: w, disabled: p, children: p ? "Saving…" : I })
    ] }),
    n.openUrl && /* @__PURE__ */ i("a", { className: "hf-quick__open", href: n.openUrl, target: "_blank", rel: "noopener", children: [
      "Open in ",
      n.appName,
      " ",
      /* @__PURE__ */ e(Se, { size: 13 })
    ] })
  ] }) });
}
function fi({ text: n, action: t, onDone: a, ms: s = 5e3 }) {
  return O(() => {
    if (!n) return;
    const r = window.setTimeout(a, s);
    return () => window.clearTimeout(r);
  }, [n, s, a]), n ? /* @__PURE__ */ i("div", { className: "hf hf-toast", role: "status", children: [
    /* @__PURE__ */ e("span", { children: n }),
    t && /* @__PURE__ */ e("button", { type: "button", onClick: () => {
      t.onClick(), a();
    }, children: t.label })
  ] }) : null;
}
const ui = {
  performance: "data:image/webp;base64,UklGRgIFAABXRUJQVlA4WAoAAAAgAAAAVwAAVwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggFAMAAPASAJ0BKlgAWAA+USSPRSOiIZVbVKw4BQSxgGoAiR0vg1DQwsfEA6YfmA/gHSl9ADpAN5W/bP9a5q/w52UOiDX1/kBxAdzPG9pGppPkVzS+qT+03sAGPgLIYiXV9ejQwgLcUuNzMWnk1ZI1EH9d4FbWj9ICKNaQ7y0Ue6yQ0SxfKLkjK6TIaVbPETgY2K3ZahH9l87k0rsr9iLuG1P9/AAA/v3Aghu2439Qd9ndP6czgI92SKFEwS5tiwZfn9orR4ghd+3i+wDXXxj/7f/5PvVLW+mUuzj//aPeUUAG30/U1yK0a0SnsdBZuB4JTn5R7gjWKpVH5Ww+NU6SZX+jARJ7/1YH36tmJQ9Ew5MMsyGQK+JkqfKx+37xM7L4V0BYzQkz7Rwp6jCAe1RFI2xVNr+6l6Idg6slM/prv1IaHbl4URcYl5uFbt6ohiM0xvmkO6hexgDu1p+rUeVJjaZqUI7jPJa+EpretNQywg8H2OZ/dcaD1S+jDJXY1IR/sf3fXF/4avpG7HPofHtKo5Gj+vUjTha2ltklbV0BmS5UfzY/hypLTpIuf3HeqcxXidxUBNgdh/HH3MzI5upJnRIxx8iYUPuntMGforRxMnGZSg/uqMKZVo9hCTX0RMOH/06//5zhVXGFQ6zXIg/fIChXJvvfslt0E6Cyo2vW5wnQWVGidPIX8NB1jSOakUlCsg4v6I02BzXPTGZ0O/pb3oVuFblfnIPEafJLCLpY0VXxDvq9KkSrjrN+1msf9H/+fnUyFe1PiJ4cgFfUybZk0S8QFe6T57C0vBLD8+981yMVEGDvUwext8MW8D1ZJs+YuMQcO/2AV61JNOhzxsSbZ9I5514/sMVL2GfeTTYlPe+vj8j/B/d8FBOHrzp8QCereJC/VO33BQNguDqaJTgZOWOihdi0fAvBmh02qRuM69inkOEH1PU8uj1GPubjSExKXCbhuYhZf2EghBf/9kw8B/7tDja5egGGS1HvOLAx5mDdBkg+qzSIhUpc2mx0dxtH9HRyhaZBO+Yx0ibj/h7SU2lg/gAAAAAA",
  recruitment: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='s' x1='10' y1='95' x2='90' y2='5' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%231F2530'/%3E%3Cstop offset='1' stop-color='%2366738C'/%3E%3C/linearGradient%3E%3ClinearGradient id='a' x1='40' y1='62' x2='92' y2='38' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23C2441A'/%3E%3Cstop offset='1' stop-color='%23FFB772'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpolygon points='22,12 70,12 70,28 32,28 32,72 70,72 70,88 14,88 14,20' fill='url(%23s)'/%3E%3Cpolygon points='40,38 76,38 92,50 76,62 40,62' fill='url(%23a)'/%3E%3C/svg%3E",
  apml: "data:image/webp;base64,UklGRmoFAABXRUJQVlA4WAoAAAAgAAAAVwAAVwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggfAMAAPASAJ0BKlgAWAA+USiPRSOioROc/Ug4BQSgDVLTG7hwfRv+wEIB5gOhbvCv7VewB0sb74pxrQ5YGk7meeMqix9cHoS/qqXpY3x655dradJOzRa5ms/yHQwuXAKJQlY5EWIq4//Oa5tIqXEOwztiDQyE8xcj4axcbNsUKo4plJ0P7PptSSZjYTcgKbqkg2WyqrM198RH8JTzOqYGwm6fNwAA/v3Ague+W+LHH/elKq59V8aAMIr3lwXTM8h/+Ll/UftLuAnNo98V+oOrz9t17gWu8hj/dw870eqmFUQkDw4fwHABx11jSq+l/82//xYfugGX8XBAm+Wk9QnM75QRS+dIB7UV5rhoFLcHX7rJfclqN0d2iCJm+1LsxuDpj4rDL97LZJTDrBf+aUnu5ZZGYLWlcqRi4+WwQMZen1XJafOWlb9OJ+l30Ymk2TEBXkTSBK8kIgfGl04AEbXmTKHSG59Qm5h7iGuNHqaw620sjGXnclN2ReYclfZWLO9pJcIUq1ajIyqneO5OfrThtcIPmdpkrzaf0rP6QE3lmmtFZmqvQuEYi+fV/CeA3I1CXZUsV22jItfKqsGVHAuR2uhynXblcw9temOKkq165KpLk1kwgsMUyv3itFYaSmoIl7SIJYPNP2ph6xdqA0aDCllkboZNxSxOUBIHg7ky1M6wL2cTSUZg6p/p6v1dAGDPcIhYIb2SZxQqmdF9tqJLbKMMboxCBQ9q0q6/KGv2SuEX/8eo0Pnx03YBMsZ+CiZA2HfT5LD7jDcr6/S6369hQ+3s3KvjLksNJyz6QH4+giUQWxOe1GOtgbe35kUJjrIfC6IRGng5rr1g4ehimy3EyHo8CoSUMtwNWrG1pt8yAug1jDC4UOZ06CnRlwRX5SZgh2y7w2Opx3LEzUVO/Tov1gegpVKYLem/6yMP88sByGiTOpSziJW5zrW0Mwb7QgPNVBz9wERNFm3Al64zmCqOA43nLHrFT1kOq0ZKOvt/T3hxdP/nwwl9ldfnJi6YReYIyEE8JGtDdfWXDW/7IduWDzwPApwbipHMIo+miBrHrTpOeJF54DQ6XlehVGdalS9BMJyErPHbOSARbQIRh94q7XwUmEhM0hRmJ9W/hi5kmh5L9Y03UcMvUO5qx1HnvgcjJpLajuWVQ8FIsp3nsfN+SgOkvH0XtFgniSgKGoQAAAA=",
  learning: "data:image/webp;base64,UklGRmYMAABXRUJQVlA4WAoAAAAwAAAAPwAAPwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZBTFBIvQYAAA3whv2TIVnbtv0ismoO27Zt27Ztc3GOdZhz2MexcNi2bdu2vY7FWVUR8aGqenqOkx8jYgL4v2N6YPWRWomO71f+VQIkJn9z6kIqNsmTG3rvJNsNn5QashFOrUxKRjX5WtNfnawXpJxqf4J6caUxJGpABg3+RaJ96n0ox2tAokmQOrV5Nz9bvW1aLLQmid5VDn7iXfV2wXFY1ktikx95Au1OxUYTRgYQFQlpComKAMm3H3VvsrZI2dFJCBAiAOpNggARQvW408ZItEN9XyynOnycIFk5RYP/mUqI8SYFUFt+ySHqbZByxl1QIOS7bYdnIcV0SgDBiA3+yEPKSW+dOQSUAdd+K9Ez9YFYBrieTxoLQbP/6hDp50cOcwWxWXfpUu+RFsssiQKef/AcIQABqAMC4AxZdWFXUPZ960X1ngTHYRkQciapoFFMAqISafjgviEgNuHAE4IepnJbrAPw/OVPcZrTsq94UO9cO89KrpB844luSdaSlBP1QajtIpUNWbnDIRfekJV1kcaePZD6Y8/9S6IV9cOwHLD8obFSUp+6V96JS294MlkNJneNv4ElUFtsjQvVW9Birs1QIJKfjkSdFnOcTDH5kGM+U69B/bSBKQSUI+/6VL0JjsIywNPNaEmt2MRXYOPbHOfsNkKixvTJn7Y3BbFp9z+FZi1Xnz0SENmYC2g1PIVAmdFq12ETh0CKPb5+XL1GTI/FKpauIhUNoSN2P33eYvwvBiDe4OmNN/ZwBTw79sRSoqK+O9YBRP7HlYRG1ODpq85LpxxxAKmkXqTk7D2nDoFka8x5lTog5dT7IQCuF5MKSB4VLD139eD9yLqpFS2D9OlDB7oCwqAhP0uAeh8sBzz/9m6cVd/7VZIHgMnNZ2ZSUBU1m2qhZ5wLN5/dFbScd/Nz1NFi4dVRgJBzScbx2w6+5ndJ4UD4m0pV1GyKXQ946jjRH248PARIHPzU2woci2WA5x88jwvFzJ3r3Dr4e1EcQktAxWyGA7YOfgRn6MqLuILY5EeeAL7RhJ4DhJxJKgWlmGW/bR++6DMUx0Exn+uQdYnuDgkiDb+0XwiQfNsx99JxFLXW8eJnONXkNvUeu7923ttIgBiLHr40UaacqnPd3Cu5Uj3+VA7EciASXaSyBlW3Sbff/6tzXgRiub6zE2XK8ZpI3Wd2SgioLbc0+6BU9KPvcZpVwybY7Mjvdu7Ob5qJsJRRlQCMR2ed3wUQ9mbYPq6AxAIzP6YOhFAVjSJf/a2/Jl2GIk/UG0CydQgFCLmMS5ZdzhXEdMBZ4yQgUaoCSKJU3PKMWvcsK0HKrG+d56+9xrhTj6eabOW5r1WXeHqliaJUpZoMUWrd847yOUB9Zyyn9njQe0dvZwkQ+l06XExOuHH/3aaOUhItW+Tpz2suQUzKiQ9AACy/DQVOPHKyEFBbZKVh6iGfXfjYtvvOHIZKg5Hrj0NvQcRR3wfLgchGnAN4evupg10B4Yjrf5QIle8H377uIXNHqZUQy+WLCx5FkgVSTrcjAmDpIlIBztlbzOMKarNvdpE6jqTfrrpy2T6L4Eog2XvnvYIkM0D9ECwHvOOLu3Ag0s9DBoUAykEPfaIO4ZJG3HjR3J3LeIi+3vU5kswAtJhzfRQg5BRSCeBcNcealkDKafc4WwIgXNLYu8+aZVLG7fg9ksyoleiDZYB1PPMFTjW0PPHYLAQSu7/1ujrVcEndz8HIlyWVTr0Wiy2JAqifiFoNrk98tYcpiE186Ok0h6MOak6rA7EMsOxKtKTFU/ebNgQ0tvvpKfU6wAGnxVSsNn0kILLfh9Cqp0/uPtIVxLIBpwXtdzqxius5pKIFnAvWWtQVkm843l3J2pXKzfEc8Py9J3FajTT8nGNDqHae2S3RHinzPjSeSCpbwuTmiTa1BGorznOdenvUd8FywPIHRklJDyVO6JwgBIR+g//SqESTVKSYeH8EiKy7C4meeHrpjf1cQW2RlYeKV1qMisZ+WA64DiUV9Njp2nm2EFAOe/iX8QOxX71Op1GQsdOtiwKR/XANTs8jfXtdf1cQZr510lIi/2mb3yVAYpIHpywksr8DAVy7SGUbcIYsubwrwGQdEGR/OrU6BRlIBIDnr76B085IY047TgAkAhBXGkMCEKnACaSyLZjeO3pbS4BQlWgShEbLb0EL2n5Cn8lC6NXIRpxD+z2988QhlnrH9SJS0Tacs7eY17ROQppCos47Pr8Lp/2Rfhk8SGhUbxKkDk4hlb2AcfUMa/6tFcnKSRri71TW2GSP/4TRu7bhU3iFcUAAwV9L/EZUGMF/nwBWUDggsgMAADATAJ0BKkAAQAA+tUqdSyckIqGsGqwA4BaJbA21LhWIolQtGE0vDb5PfbO5YC/7h6gNsR5gPPE9C/+M9QD9kusK9ADy3P28+C392vSA0oPYj2M/2uWDwW40++tvefXvRA/YBKd9vg9BD/9PQktSkEbcOMNT9uVL+Beocvog0XzI4zDPy7i7uWXj5NvyUOjYGm+E5AUWdgqh86T0r+eTmh1UgAD++Zt//n4WP4vHvTrlJD/TnBehZOgWb13AqBVGdU0Y/TabcvDWQWzsqHD9JNtBHyaSEmxBn99VoMTAPPlei5qGjg/tunXiESVaylzHnjdrjvegfUtTkB5n1sIW2C2h4PQwygxwsKQWlwGUPDePGRv8/99JKq3hu+7EvTzp9IHmJPnPHCm/HVyBpMZGM9wDdfl9bSWaryF6+jMjppiiv0L9PWYIeYqV8uVbFw+pL8iWFovLxssge6f6I1gp5VyjvVbIeZnNB04kqqlIu+pWzCYdl9Y1bU5STFKvL+EGagnPRhARLSkzg0ebb40EwtwYqx9mDjaG8f4MioFXOsRiXsH0NwY6KP63Xu6zT4ourcpoFmn2F3/DXu+vJuZyaIycDa47wtEZdofvd7KsfKzfuXQiBoZhna7yexqHcss81aMXCu4DUStA0IPge7jwaPuFXIJyWItzR6xpYsdDVqO7QfSVGnHHordk86iITCSlFk8KPF02fVzLSVIyMvMsT+Sc2dyjnRvUGVc9pSsYXJNSfOWSVBFNhIe4HH58dblqoCDqPMdb4gr0dxxHeo541xXlJrIYP5Cf8RHYAGzG+kRn62P0diPt/IRe+dkE3jirosp177z5HO5JRSOqJVZQ1XzxqWp0J+TSW5XwQP3H3+yFru35cRkA+xUPXH1q+nP/TCZZVuvsM5W+VEf0aYgkPl6lKIdUjpqCmWj/MswDu3DJQ19AiCTTwOZiTc1ev8az+Tu2NDN7bf1saP2KAokSrZM2gE9eNIaA2QAsinUjVTJ+O5FOPnrax0RxFTXA4AHsN3GV8+4YKPvTDc4z1vs8UqqQGTKvJY7KQni+l/o3//De1Pc7m7PDOX0Iaf+7WX0GnvTTiEaO5g/lSwx7TaZ50mP9txAOc+cAuez4YUpjiioFQslNKEYUJCzF+VgxsGoXFl9tlWQpoEtVPW/eJ/OWfarqbrzaM1ihb//D9055nj7vjmZLNwahDgPf3+5UhOue42UmVPS9QOyahXzQhDTtuDp1ORjX85lUfhMfXHUIXfP4AAA=",
  logistics: "data:image/webp;base64,UklGRmoEAABXRUJQVlA4WAoAAAAgAAAAVwAAVwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggfAIAAPANAJ0BKlgAWAA+USKPRKOsIZVbVYDABQSygGna2A9F1vBuEDubzHOermuHn0RwlXN2YDYXpPkXTScZD3KX1amRirtex3IDM0F+hi7s4wPJyZigXDPJcGBnwPYy5AnDHv6vMSTJeAF4jMjFARb6sXVKOcPP2H9IAAD+/cCARf2S9MbeF/hMv+SG9PgmY/gtrb34dRABGF9e/4jN5E/xiI41rcCbtX5gogrjDDMT9WT58IWBJu+xfFe9BPPRjh3WOZts/9S5UQDe+BUYkAxruDXttiZNucLZJdRhP4G0m0N9jB/V6HCu0s/ZfxY7macldCWFOq4GtdAkq+//Rx7jXs8J6Y6laMmd1s/4Pv/9Y5G/F4o7ACbrf1POgcZe7xYGpEtlsSqmwp3dXRe3/z//aYnLP/agr1/h7/RNNriO5DvBAISOD/Fiv/b2FBeWc1qHHp3dMztltF5d2wUTXKcX3kLMNOpoCILgGGnUT4mQAnEOAcHz0h+Xs67aYCJMn7/Ad7/TdAxRM2S+vOvv9dtvn54HFDrFD9g38DboorIlPTDjrvC+g1uZJ7/kZdzOtoe0hhqJvvZSl7Hqj/j8EfoqSIdtCfwe86yL0IDfG135qjyty7Y8FFREbLSoH6Z5HTXi48qzE1UGFAwjEBhj33y63+DjHoOF1W2sW//tfogu+c9wrMnf7wR506OmzeYn+P15B9zLyxe/WOCbj80Z7AprMDfgU+L/A4CoSZq7PdEDAcFzhZYrC1JKmMaWyMOLXln98lC3QB+1K37fFgDUtFFez4zPqL3P7PZbNWkTOxrhe1XB/av9HrgdCih2jzqFEAJiNj1F2SLZDoYAAAAAAA=="
};
function la(n, t, a) {
  const s = n.slice();
  if (!t) return s;
  const r = t.dir === "asc" ? 1 : -1, l = (c) => c == null || c === "";
  return s.sort((c, o) => {
    const h = a(c, t.key), f = a(o, t.key);
    return l(h) && l(f) ? 0 : l(h) ? 1 : l(f) ? -1 : typeof h == "number" && typeof f == "number" ? (h - f) * r : String(h).localeCompare(String(f), void 0, { numeric: !0, sensitivity: "base" }) * r;
  });
}
function ca(n, t) {
  return !n || n.key !== t ? { key: t, dir: "asc" } : { key: t, dir: n.dir === "asc" ? "desc" : "asc" };
}
function oa(n, t) {
  return n === "done" ? { mark: "tick", words: "done" } : n === "skipped" ? { mark: "dash", words: "not needed" } : n === "current" ? { mark: "number", words: `step ${t + 1}, where the case is now` } : { mark: "number", words: `step ${t + 1}, still to come` };
}
const Rn = {
  rated: "Rated",
  missing: "Not rated",
  skipped: "Skipped",
  future: "Still to come"
};
function ha(n) {
  return n.map((t) => `${t.label}: ${Rn[t.state].toLowerCase()}`).join(", ");
}
function da(n, t) {
  const a = n.indexOf(t);
  if (a < 0) return { index: -1, line: t ? `${t}: not one of the usual stages.` : "Stage not known." };
  const s = n[a + 1];
  return { index: a, line: `Stage ${a + 1} of ${n.length}: ${t}.${s ? ` Next: ${s}.` : ""}` };
}
function fa(n, t, a = "Item") {
  const s = t == null ? -1 : n.indexOf(t);
  return s < 0 ? { index: -1, prev: null, next: n[0] ?? null, line: n.length ? `${n.length} in the list` : "Nothing in the list" } : { index: s, prev: n[s - 1] ?? null, next: n[s + 1] ?? null, line: `${a} ${s + 1} of ${n.length}` };
}
function Ai(n, t) {
  const a = n.indexOf(t);
  return a < 0 ? n[0] ?? null : n[a + 1] ?? n[a - 1] ?? null;
}
function ua(n, t, a) {
  const s = n.indexOf(t);
  return s < 0 ? null : n[s + a] ?? null;
}
function Aa(n, t, a) {
  return !a || !a.to || a.to === a.from ? n : n - (t === a.from ? 1 : 0) + (t === a.to ? 1 : 0);
}
const oe = {
  picked: (n, t) => `Picked up ${n}, in ${t}. Use the left and right arrows to choose a stage, Space to drop, Escape to cancel.`,
  lifted: (n) => `Picked up ${n}. Drop on a stage to move them.`,
  target: (n, t) => t ? `${n}, where they are now.` : `${n}.`,
  moved: (n, t) => `${n} moved to ${t}.`,
  stays: (n, t) => `${n} stays in ${t}.`,
  notMoved: (n) => `${n} was not moved.`
};
function pi({ variant: n = "secondary", fit: t, icon: a, busy: s, className: r, children: l, type: c = "button", ...o }) {
  const h = ["hf-btn", `hf-btn--${n}`, "hf-press", t ? "hf-btn--fit" : "", r ?? ""].filter(Boolean).join(" ");
  return /* @__PURE__ */ i("button", { type: c, className: h, "aria-busy": s || void 0, ...o, children: [
    s ? /* @__PURE__ */ e("span", { className: "hf-spin", "aria-hidden": "true" }) : a,
    l
  ] });
}
function ue(n) {
  const t = fe(), a = n ?? t;
  return { id: a, hint: `${a}-h`, error: `${a}-e` };
}
function Ge({ htmlFor: n, label: t, optional: a, hideLabel: s }) {
  return /* @__PURE__ */ i("label", { htmlFor: n, className: s ? "hf-sr" : "hf-fld__l", children: [
    t,
    a && /* @__PURE__ */ e("span", { className: "hf-fld__opt", children: " (optional)" })
  ] });
}
function be(n, t, a) {
  return [t ? n.hint : "", a ? n.error : ""].filter(Boolean).join(" ") || void 0;
}
function Xe({ ids: n, error: t }) {
  return t ? /* @__PURE__ */ e("span", { id: n.error, className: "hf-fld__e", children: t }) : null;
}
function mi({ label: n, hint: t, error: a, optional: s, hideLabel: r, id: l, className: c, ...o }) {
  const h = ue(l);
  return /* @__PURE__ */ i("div", { className: ["hf-fld", c ?? ""].join(" "), children: [
    /* @__PURE__ */ e(Ge, { htmlFor: h.id, label: n, optional: s, hideLabel: r }),
    t && /* @__PURE__ */ e("span", { id: h.hint, className: "hf-fld__h", children: t }),
    /* @__PURE__ */ e(
      "input",
      {
        id: h.id,
        className: a ? "hf-input hf-input--err" : "hf-input",
        "aria-invalid": a ? !0 : void 0,
        "aria-describedby": be(h, t, a),
        ...o
      }
    ),
    /* @__PURE__ */ e(Xe, { ids: h, hint: t, error: a })
  ] });
}
function _i({ label: n, hint: t, error: a, optional: s, hideLabel: r, id: l, className: c, rows: o = 3, maxLength: h, value: f, ...d }) {
  const m = ue(l), A = typeof f == "string" ? f.length : 0;
  return /* @__PURE__ */ i("div", { className: ["hf-fld", c ?? ""].join(" "), children: [
    /* @__PURE__ */ e(Ge, { htmlFor: m.id, label: n, optional: s, hideLabel: r }),
    t && /* @__PURE__ */ e("span", { id: m.hint, className: "hf-fld__h", children: t }),
    /* @__PURE__ */ e(
      "textarea",
      {
        id: m.id,
        rows: Math.max(3, o),
        maxLength: h,
        value: f,
        className: a ? "hf-input hf-input--area hf-input--err" : "hf-input hf-input--area",
        "aria-invalid": a ? !0 : void 0,
        "aria-describedby": be(m, t, a),
        ...d
      }
    ),
    h ? /* @__PURE__ */ i("span", { className: "hf-fld__count", "aria-live": "polite", children: [
      A,
      " of ",
      h
    ] }) : null,
    /* @__PURE__ */ e(Xe, { ids: m, hint: t, error: a })
  ] });
}
function bi({ label: n, hint: t, error: a, optional: s, hideLabel: r, id: l, className: c, options: o, placeholder: h, ...f }) {
  const d = ue(l);
  return /* @__PURE__ */ i("div", { className: ["hf-fld", c ?? ""].join(" "), children: [
    /* @__PURE__ */ e(Ge, { htmlFor: d.id, label: n, optional: s, hideLabel: r }),
    t && /* @__PURE__ */ e("span", { id: d.hint, className: "hf-fld__h", children: t }),
    /* @__PURE__ */ i("span", { className: "hf-select", children: [
      /* @__PURE__ */ i(
        "select",
        {
          id: d.id,
          className: a ? "hf-input hf-input--err" : "hf-input",
          "aria-invalid": a ? !0 : void 0,
          "aria-describedby": be(d, t, a),
          ...f,
          children: [
            h !== void 0 && /* @__PURE__ */ e("option", { value: "", children: h }),
            o.map((m) => typeof m == "string" ? /* @__PURE__ */ e("option", { value: m, children: m }, m) : /* @__PURE__ */ e("option", { value: m.value, children: m.label }, m.value))
          ]
        }
      ),
      /* @__PURE__ */ e(Fn, { size: 18, "aria-hidden": "true" })
    ] }),
    /* @__PURE__ */ e(Xe, { ids: d, hint: t, error: a })
  ] });
}
function gi({ label: n, sub: t, id: a, className: s, ...r }) {
  const l = fe(), c = a ?? l;
  return /* @__PURE__ */ i("label", { htmlFor: c, className: ["hf-tick", s ?? ""].join(" "), children: [
    /* @__PURE__ */ e("input", { id: c, type: "checkbox", ...r }),
    /* @__PURE__ */ e("span", { className: "hf-tick__box", "aria-hidden": "true", children: /* @__PURE__ */ e(ae, { size: 14, strokeWidth: 3 }) }),
    /* @__PURE__ */ i("span", { className: "hf-tick__t", children: [
      n,
      t && /* @__PURE__ */ e("span", { className: "hf-tick__s", children: t })
    ] })
  ] });
}
function Ni({ label: n, options: t, value: a, onChange: s, hint: r, error: l, optional: c, hideLabel: o, clearable: h, onClear: f }) {
  const d = ue();
  return /* @__PURE__ */ i("div", { className: "hf-fld", role: "group", "aria-labelledby": d.id, "aria-describedby": be(d, r, l), children: [
    /* @__PURE__ */ i("span", { id: d.id, className: o ? "hf-sr" : "hf-fld__l", children: [
      n,
      c && /* @__PURE__ */ e("span", { className: "hf-fld__opt", children: " (optional)" })
    ] }),
    r && /* @__PURE__ */ e("span", { id: d.hint, className: "hf-fld__h", children: r }),
    /* @__PURE__ */ e("div", { className: "hf-seg hf-seg--fill", children: t.map((m) => {
      const A = typeof m == "string" ? m : m.value, k = typeof m == "string" ? m : m.label, y = a === A;
      return /* @__PURE__ */ e(
        "button",
        {
          type: "button",
          "aria-pressed": y,
          onClick: () => y && h ? f == null ? void 0 : f() : s(A),
          children: k
        },
        A
      );
    }) }),
    l && /* @__PURE__ */ e("span", { id: d.error, className: "hf-fld__e", children: l })
  ] });
}
function ki({ label: n, options: t, value: a, onChange: s, hint: r, error: l, hideLabel: c }) {
  const o = ue();
  return /* @__PURE__ */ i("div", { className: "hf-fld", role: "radiogroup", "aria-labelledby": o.id, "aria-describedby": be(o, r, l), children: [
    /* @__PURE__ */ e("span", { id: o.id, className: c ? "hf-sr" : "hf-fld__l", children: n }),
    r && /* @__PURE__ */ e("span", { id: o.hint, className: "hf-fld__h", children: r }),
    t.map((h) => {
      const f = a === h.value;
      return /* @__PURE__ */ i("div", { className: "hf-choice__w", children: [
        /* @__PURE__ */ i("button", { type: "button", role: "radio", "aria-checked": f, className: f ? "hf-choice is-on" : "hf-choice", onClick: () => s(h.value), children: [
          /* @__PURE__ */ e("span", { className: "hf-choice__dot", "aria-hidden": "true" }),
          /* @__PURE__ */ i("span", { className: "hf-choice__b", children: [
            /* @__PURE__ */ i("span", { className: "hf-choice__t", children: [
              h.title,
              h.tag && /* @__PURE__ */ e("span", { className: "hf-choice__tag", children: h.tag })
            ] }),
            h.sub && /* @__PURE__ */ e("span", { className: "hf-choice__s", children: h.sub })
          ] })
        ] }),
        f && h.detail
      ] }, h.value);
    }),
    l && /* @__PURE__ */ e("span", { id: o.error, className: "hf-fld__e", children: l })
  ] });
}
function yi({ label: n, options: t, value: a, onChange: s, onClear: r, hint: l, hideLabel: c, disabled: o }) {
  const h = ue(), f = t.find((d) => d.value === a);
  return /* @__PURE__ */ i("div", { className: "hf-fld", children: [
    /* @__PURE__ */ e("span", { id: h.id, className: c ? "hf-sr" : "hf-fld__l", children: n }),
    l && /* @__PURE__ */ e("span", { id: h.hint, className: "hf-fld__h", children: l }),
    /* @__PURE__ */ e("div", { className: "hf-marks", role: "group", "aria-labelledby": h.id, "aria-describedby": l ? h.hint : void 0, children: t.map((d) => {
      const m = a === d.value;
      return /* @__PURE__ */ i(
        "button",
        {
          type: "button",
          "aria-pressed": m,
          disabled: o,
          onClick: () => m ? r == null ? void 0 : r() : s(d.value),
          children: [
            d.icon && /* @__PURE__ */ e("span", { className: "hf-marks__ic", "aria-hidden": "true", children: d.icon }),
            /* @__PURE__ */ e("span", { children: d.label })
          ]
        },
        d.value
      );
    }) }),
    f == null ? void 0 : f.detail
  ] });
}
function vi({ label: n, value: t, onChange: a, max: s = 5, hint: r, error: l, ends: c = ["1 is lowest", `${s} is highest`], children: o }) {
  const h = ue();
  return /* @__PURE__ */ i("div", { className: "hf-fld", role: "group", "aria-labelledby": h.id, "aria-describedby": be(h, r, l), children: [
    /* @__PURE__ */ e("span", { id: h.id, className: "hf-fld__t", children: n }),
    r && /* @__PURE__ */ e("span", { id: h.hint, className: "hf-fld__h", children: r }),
    /* @__PURE__ */ e("div", { className: "hf-score-box", children: /* @__PURE__ */ e(
      "div",
      {
        className: s > 5 ? "hf-score hf-score--wrap" : "hf-score",
        style: s > 5 ? { "--hf-score-n": s } : { gridTemplateColumns: `repeat(${s}, minmax(0, 1fr))` },
        children: Array.from({ length: s }, (f, d) => d + 1).map((f) => /* @__PURE__ */ e("button", { type: "button", "aria-pressed": t === f, "aria-label": `${f} of ${s}`, onClick: () => a(f), children: f }, f))
      }
    ) }),
    /* @__PURE__ */ i("span", { className: "hf-score__ends", "aria-hidden": "true", children: [
      /* @__PURE__ */ e("span", { children: c[0] }),
      /* @__PURE__ */ e("span", { children: c[1] })
    ] }),
    o,
    l && /* @__PURE__ */ e("span", { id: h.error, className: "hf-fld__e", children: l })
  ] });
}
function mn({ pressed: n, count: t, className: a, children: s, type: r = "button", ...l }) {
  return /* @__PURE__ */ i("button", { type: r, className: ["hf-chip", n ? "is-on" : "", a ?? ""].filter(Boolean).join(" "), "aria-pressed": n, ...l, children: [
    s,
    typeof t == "number" && /* @__PURE__ */ e("span", { className: "hf-chip__n", children: t })
  ] });
}
function pa({ label: n, children: t }) {
  return /* @__PURE__ */ e("div", { className: "hf-chips", role: "group", "aria-label": n, children: t });
}
const ma = {
  ok: /* @__PURE__ */ e(ae, { size: 14, strokeWidth: 2.5, "aria-hidden": "true" }),
  warn: /* @__PURE__ */ e(Re, { size: 14, strokeWidth: 2.5, "aria-hidden": "true" }),
  danger: /* @__PURE__ */ e(Be, { size: 14, strokeWidth: 2.5, "aria-hidden": "true" }),
  plain: /* @__PURE__ */ e(ht, { size: 10, strokeWidth: 3, "aria-hidden": "true" })
};
function wi({ tone: n, icon: t, children: a }) {
  return /* @__PURE__ */ i("span", { className: `hf-status hf-status--${n}`, children: [
    t ?? ma[n],
    a
  ] });
}
const _a = {
  ok: /* @__PURE__ */ e(ae, { size: 18, "aria-hidden": "true" }),
  warn: /* @__PURE__ */ e(Be, { size: 18, "aria-hidden": "true" }),
  danger: /* @__PURE__ */ e(Be, { size: 18, "aria-hidden": "true" }),
  plain: /* @__PURE__ */ e(Mn, { size: 18, "aria-hidden": "true" })
};
function Ci({ tone: n = "plain", icon: t, children: a, role: s, action: r }) {
  return /* @__PURE__ */ i("div", { className: `hf-banner hf-banner--${n}`, role: s, children: [
    t ?? _a[n],
    /* @__PURE__ */ e("div", { className: "hf-banner__t", children: a }),
    r && /* @__PURE__ */ e("div", { className: "hf-banner__a", children: /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: r.onClick, children: r.label }) })
  ] });
}
function ba({ title: n, sub: t, icon: a, trailing: s, below: r, href: l, onClick: c, chevron: o = !!(l || c), current: h }) {
  const f = h ? "hf-lrow is-current" : "hf-lrow", d = h ? { "aria-current": !0 } : {}, m = /* @__PURE__ */ i(U, { children: [
    a && /* @__PURE__ */ e("span", { className: "hf-lrow__ic", "aria-hidden": "true", children: a }),
    /* @__PURE__ */ i("span", { className: "hf-lrow__b", children: [
      /* @__PURE__ */ e("span", { className: "hf-lrow__t", children: n }),
      t && /* @__PURE__ */ e("span", { className: "hf-lrow__s", children: t }),
      r && /* @__PURE__ */ e("span", { className: "hf-lrow__below", children: r })
    ] }),
    (s || o) && /* @__PURE__ */ i("span", { className: "hf-lrow__e", children: [
      s,
      o && /* @__PURE__ */ e(G, { size: 20, "aria-hidden": "true" })
    ] })
  ] });
  return l ? /* @__PURE__ */ e("a", { className: f, ...d, href: l, onClick: c ? (A) => {
    A.preventDefault(), c();
  } : void 0, children: m }) : c ? /* @__PURE__ */ e("button", { type: "button", className: f, ...d, onClick: c, children: m }) : /* @__PURE__ */ e("div", { className: f, ...d, children: m });
}
function ga({ caption: n, children: t, action: a }) {
  return /* @__PURE__ */ i("section", { className: "hf-card hf-listcard", children: [
    (n || a) && /* @__PURE__ */ i("div", { className: "hf-listcard__head", children: [
      n && /* @__PURE__ */ e("span", { className: "hf-cap", children: n }),
      a
    ] }),
    /* @__PURE__ */ e("div", { className: "hf-listcard__rows", children: t })
  ] });
}
function xi({ caption: n, columns: t, rows: a, rowKey: s, onRowClick: r, rowHref: l, empty: c, initialSort: o = null, hideCaption: h, wide: f }) {
  const [d, m] = x(o), A = _e(() => la(a, d, (p, _) => {
    var b, $;
    return ($ = (b = t.find((v) => v.key === _)) == null ? void 0 : b.sortValue) == null ? void 0 : $.call(b, p);
  }), [a, d, t]), k = t.map((p) => p.width ?? "minmax(0, 1fr)").join(" "), y = (p, _) => p.render ? p.render(_) : _[p.key], u = (p) => p == null || p === "" || p === !1;
  return /* @__PURE__ */ i("div", { className: f ? "hf-table hf-table--wide" : "hf-table", role: "table", "aria-label": n, children: [
    !h && /* @__PURE__ */ e("div", { className: "hf-table__cap hf-cap", children: n }),
    A.length > 0 && /* @__PURE__ */ e("div", { className: "hf-table__head", role: "row", style: { gridTemplateColumns: k }, children: t.map((p) => {
      const _ = (d == null ? void 0 : d.key) === p.key, b = _ ? d.dir === "asc" ? "ascending" : "descending" : "none";
      return /* @__PURE__ */ e(
        "span",
        {
          role: "columnheader",
          "aria-sort": p.sortValue ? b : void 0,
          className: p.align === "end" ? "hf-table__th is-end" : "hf-table__th",
          children: p.sortValue ? /* @__PURE__ */ i("button", { type: "button", onClick: () => m(ca(d, p.key)), children: [
            p.label,
            _ ? d.dir === "asc" ? /* @__PURE__ */ e(ct, { size: 14, "aria-hidden": "true" }) : /* @__PURE__ */ e(ot, { size: 14, "aria-hidden": "true" }) : null
          ] }) : p.label
        },
        p.key
      );
    }) }),
    A.length === 0 && c && /* @__PURE__ */ e("div", { className: "hf-table__empty", children: c }),
    A.map((p) => {
      const _ = t.map(($) => {
        const v = y($, p);
        return /* @__PURE__ */ e(
          "span",
          {
            role: "cell",
            "data-label": $.label,
            className: ["hf-table__td", $.lead ? "is-lead" : "", $.align === "end" ? "is-end" : "", u(v) ? "is-blank" : ""].filter(Boolean).join(" "),
            children: v
          },
          $.key
        );
      }), b = l == null ? void 0 : l(p);
      return b ? /* @__PURE__ */ e(
        "a",
        {
          role: "row",
          className: "hf-table__tr is-link",
          style: { gridTemplateColumns: k },
          href: b,
          onClick: r ? ($) => {
            $.preventDefault(), r(p);
          } : void 0,
          children: _
        },
        s(p)
      ) : r ? /* @__PURE__ */ e(
        "button",
        {
          type: "button",
          role: "row",
          className: "hf-table__tr is-link",
          style: { gridTemplateColumns: k },
          onClick: () => r(p),
          children: _
        },
        s(p)
      ) : /* @__PURE__ */ e("div", { role: "row", className: "hf-table__tr", style: { gridTemplateColumns: k }, children: _ }, s(p));
    })
  ] });
}
function Na({ lines: n = 3, height: t = 16, block: a }) {
  return a ? /* @__PURE__ */ e("span", { className: "hf-skel", style: { height: a }, "aria-hidden": "true" }) : /* @__PURE__ */ e("span", { className: "hf-skel-lines", "aria-hidden": "true", children: Array.from({ length: n }, (s, r) => /* @__PURE__ */ e("span", { className: "hf-skel", style: { height: t, width: r === n - 1 && n > 1 ? "60%" : "100%" } }, r)) });
}
function Si({ label: n = "Loading", children: t }) {
  return /* @__PURE__ */ i("div", { className: "hf-loading", role: "status", "aria-live": "polite", children: [
    /* @__PURE__ */ e("span", { className: "hf-sr", children: n }),
    t ?? /* @__PURE__ */ e(Na, { lines: 3 })
  ] });
}
const ka = 320, ya = 6, _n = 72;
function va() {
  const n = "(max-width: 1023px)", [t, a] = x(() => {
    var s;
    return typeof window < "u" && !!((s = window.matchMedia) != null && s.call(window, n).matches);
  });
  return O(() => {
    var l;
    const s = (l = window.matchMedia) == null ? void 0 : l.call(window, n);
    if (!s) return;
    const r = () => a(s.matches);
    return r(), s.addEventListener("change", r), () => s.removeEventListener("change", r);
  }, []), t;
}
function bn({ c: n }) {
  return /* @__PURE__ */ i(U, { children: [
    /* @__PURE__ */ i("span", { className: "hf-lanecard__top", children: [
      n.icon && /* @__PURE__ */ e("span", { className: "hf-lanecard__ic", "aria-hidden": "true", children: n.icon }),
      /* @__PURE__ */ e("span", { className: "hf-lanecard__t", children: n.title }),
      n.extra
    ] }),
    n.sub && /* @__PURE__ */ e("span", { className: "hf-lanecard__s", children: n.sub }),
    n.chips && /* @__PURE__ */ e("span", { className: "hf-lanecard__chips", children: n.chips })
  ] });
}
function Bi(n) {
  const { label: t, lanes: a, items: s, laneOf: r, itemKey: l, itemName: c, card: o, onOpen: h, onMove: f, leading: d, empty: m, initialLane: A } = n, k = va(), y = a.map((g) => g.key), u = (g) => {
    var S;
    return ((S = a.find((D) => D.key === g)) == null ? void 0 : S.label) ?? g;
  }, p = (g) => s.filter((S) => r(S) === g), _ = (g) => s.find((S) => l(S) === g) ?? null, b = y.find((g) => p(g).length) ?? y[0], [$, v] = x(A ?? b ?? ""), [F, H] = x(null), [B, P] = x({ x: 0, y: 0 }), [C, E] = x(null), [j, Q] = x(null), [w, I] = x(""), Y = q(null), ee = q({}), le = q({}), V = q(null), N = q(null), z = q(null), J = q(0), X = q(null), ce = q(!1), T = !!f, We = xe((g, S) => {
    let D = null, M = 1 / 0;
    for (const W of y) {
      const Z = ee.current[W];
      if (!Z) continue;
      const L = Z.getBoundingClientRect();
      if (S < L.top - 40 || S > L.bottom + 40) continue;
      if (g >= L.left && g <= L.right) return W;
      const K = Math.abs(g - (L.left + L.width / 2));
      K < M && (M = K, D = W);
    }
    return D;
  }, [y.join("|")]), Ke = (g, S, D) => {
    const M = { id: g.id, from: g.from, w: g.rect.width, h: g.rect.height, offX: S - g.rect.left, offY: D - g.rect.top };
    if (N.current = M, z.current = g.from, H(M), P({ x: S, y: D }), Q(g.from), E(null), g.touch && navigator.vibrate)
      try {
        navigator.vibrate(12);
      } catch {
      }
    const W = _(g.id);
    I(W ? oe.lifted(c(W)) : "");
  }, Le = (g) => {
    const S = N.current, D = z.current;
    if (N.current = null, z.current = null, J.current = 0, X.current && cancelAnimationFrame(X.current), X.current = null, H(null), Q(null), !S) return;
    ce.current = !0, setTimeout(() => {
      ce.current = !1;
    }, 0);
    const M = _(S.id);
    M && (g && D && D !== S.from && f ? (f(M, D), I(oe.moved(c(M), u(D)))) : I(oe.notMoved(c(M))));
  };
  O(() => {
    if (k || !T) return;
    const g = (L) => {
      var an;
      const K = V.current;
      if (K && !N.current) {
        const sn = Math.hypot(L.clientX - K.x, L.clientY - K.y);
        if (K.touch) {
          sn > 8 && (K.timer && clearTimeout(K.timer), V.current = null);
          return;
        }
        sn >= ya && (V.current = null, Ke(K, L.clientX, L.clientY));
        return;
      }
      if (!N.current) return;
      P({ x: L.clientX, y: L.clientY });
      const Ae = We(L.clientX, L.clientY);
      Ae !== z.current && (z.current = Ae, Q(Ae));
      const ne = (an = Y.current) == null ? void 0 : an.getBoundingClientRect();
      J.current = ne ? L.clientX < ne.left + _n ? -1 : L.clientX > ne.right - _n ? 1 : 0 : 0;
    }, S = () => {
      V.current && (V.current.timer && clearTimeout(V.current.timer), V.current = null);
    }, D = () => {
      S(), N.current && Le(!0);
    }, M = () => {
      S(), N.current && Le(!1);
    }, W = (L) => {
      N.current && L.preventDefault();
    }, Z = (L) => {
      L.key === "Escape" && N.current && Le(!1);
    };
    return window.addEventListener("pointermove", g), window.addEventListener("pointerup", D), window.addEventListener("pointercancel", M), window.addEventListener("touchmove", W, { passive: !1 }), window.addEventListener("keydown", Z), () => {
      window.removeEventListener("pointermove", g), window.removeEventListener("pointerup", D), window.removeEventListener("pointercancel", M), window.removeEventListener("touchmove", W), window.removeEventListener("keydown", Z);
    };
  }), O(() => {
    if (!F) return;
    const g = () => {
      J.current && Y.current && (Y.current.scrollLeft += J.current * 14), X.current = requestAnimationFrame(g);
    };
    return X.current = requestAnimationFrame(g), () => {
      X.current && cancelAnimationFrame(X.current);
    };
  }, [F]);
  const Vn = (g, S, D) => {
    if (!T || g.button !== void 0 && g.button !== 0) return;
    const M = g.pointerType === "touch" || g.pointerType === "pen", W = { id: S, from: D, rect: g.currentTarget.getBoundingClientRect(), x: g.clientX, y: g.clientY, touch: M, timer: null };
    M && (W.timer = setTimeout(() => {
      V.current === W && (V.current = null, Ke(W, W.x, W.y));
    }, ka)), V.current = W;
  }, en = (g) => {
    if (!C) return;
    const { from: S, to: D } = C;
    E(null), Q(null), D !== S && f ? (f(g, D), I(oe.moved(c(g), u(D)))) : I(oe.stays(c(g), u(S)));
    const M = l(g);
    setTimeout(() => {
      var W;
      return (W = le.current[M]) == null ? void 0 : W.focus({ preventScroll: !0 });
    }, 0);
  }, Qn = (g, S, D) => {
    var Z;
    const M = l(S), W = C && C.id === M;
    if (!W && g.key === "Enter") {
      g.preventDefault(), h(S);
      return;
    }
    if (g.key === " " && T) {
      g.preventDefault(), W ? en(S) : (E({ id: M, from: D, to: D }), Q(D), I(oe.picked(c(S), u(D))));
      return;
    }
    if (!(!W || !C)) {
      if (g.key === "Enter") {
        g.preventDefault(), en(S);
        return;
      }
      if (g.key === "Escape") {
        g.preventDefault(), E(null), Q(null), I(oe.stays(c(S), u(C.from)));
        return;
      }
      if (g.key === "ArrowLeft" || g.key === "ArrowRight") {
        g.preventDefault();
        const L = ua(y, C.to, g.key === "ArrowRight" ? 1 : -1);
        if (!L) return;
        E({ ...C, to: L }), Q(L), (Z = ee.current[L]) == null || Z.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" }), I(oe.target(u(L), L === C.from));
      }
    }
  }, Jn = (g) => {
    const S = Y.current, D = g === (d == null ? void 0 : d.key) ? S == null ? void 0 : S.firstElementChild : ee.current[g];
    S && D && S.scrollTo({ left: Math.max(0, D.offsetLeft - S.offsetLeft - 8), behavior: "smooth" });
  }, se = F ? { id: F.id, from: F.from, to: j } : C ? { id: C.id, from: C.from, to: C.to } : null, ye = se ? _(se.id) : null, nn = /* @__PURE__ */ e("div", { className: "hf-sr", role: "status", "aria-live": "polite", children: w }), tn = (g, S, D) => /* @__PURE__ */ i(pa, { label: D, children: [
    d && /* @__PURE__ */ e(mn, { pressed: S(d.key), count: d.count, onClick: () => g(d.key), children: d.label }),
    a.map((M) => /* @__PURE__ */ e(mn, { pressed: S(M.key), count: p(M.key).length, onClick: () => g(M.key), children: M.label ?? M.key }, M.key))
  ] });
  if (k) {
    const g = !!d && $ === d.key, S = g ? [] : p($);
    return /* @__PURE__ */ i("div", { className: "hf-lanes hf-lanes--one", "aria-label": t, role: "region", children: [
      tn(v, (D) => D === $, "Stage"),
      g ? d.render(!0) : S.length ? /* @__PURE__ */ e(ga, { caption: `${u($)}, ${S.length}`, children: S.map((D) => {
        const M = o(D);
        return /* @__PURE__ */ e(ba, { icon: M.icon, title: M.title, sub: M.sub, below: M.chips, onClick: () => h(D) }, l(D));
      }) }) : /* @__PURE__ */ e(_t, { children: m ? m(u($)) : `Nobody in ${u($)}.` }),
      nn
    ] });
  }
  return /* @__PURE__ */ i("div", { className: "hf-lanes", role: "region", "aria-label": t, children: [
    tn(Jn, () => !1, "Jump to a stage"),
    /* @__PURE__ */ i("div", { ref: Y, className: "hf-lanes__track", children: [
      d && d.render(!1),
      a.map((g) => {
        const S = p(g.key), D = !!se && se.to === g.key && se.to !== se.from, M = Aa(S.length, g.key, se && { from: se.from, to: se.to });
        return /* @__PURE__ */ i(
          "section",
          {
            ref: (W) => {
              ee.current[g.key] = W;
            },
            className: D ? "hf-lane is-over" : "hf-lane",
            "aria-label": `${g.label ?? g.key}, ${M} ${M === 1 ? "person" : "people"}`,
            children: [
              /* @__PURE__ */ i("div", { className: "hf-lane__h", children: [
                /* @__PURE__ */ e("span", { children: g.label ?? g.key }),
                /* @__PURE__ */ e("span", { className: "hf-lane__n", children: M })
              ] }),
              /* @__PURE__ */ i("div", { className: "hf-lane__b", children: [
                D && ye && /* @__PURE__ */ i("div", { className: "hf-lane__drop", "aria-hidden": "true", style: F ? { height: Math.min(F.h, 120) } : void 0, children: [
                  "Drop to move ",
                  c(ye).split(" ")[0],
                  " to ",
                  g.label ?? g.key
                ] }),
                S.map((W) => {
                  const Z = l(W), L = o(W), K = (F == null ? void 0 : F.id) === Z, Ae = (C == null ? void 0 : C.id) === Z;
                  return /* @__PURE__ */ e(
                    "div",
                    {
                      ref: (ne) => {
                        le.current[Z] = ne;
                      },
                      role: "button",
                      tabIndex: 0,
                      className: ["hf-lanecard", K ? "is-lifted" : "", Ae ? "is-held" : "", T ? "is-movable" : ""].filter(Boolean).join(" "),
                      "aria-roledescription": T ? "movable card" : void 0,
                      "aria-pressed": T ? Ae : void 0,
                      "aria-label": `${c(W)}, in ${g.label ?? g.key}.${T ? " Enter to open, Space to move." : " Enter to open."}`,
                      onPointerDown: (ne) => Vn(ne, Z, g.key),
                      onKeyDown: (ne) => Qn(ne, W, g.key),
                      onClick: () => {
                        !ce.current && !F && h(W);
                      },
                      onContextMenu: (ne) => {
                        (V.current || F) && ne.preventDefault();
                      },
                      children: /* @__PURE__ */ e(bn, { c: L })
                    },
                    Z
                  );
                }),
                !S.length && !D && /* @__PURE__ */ e("p", { className: "hf-lane__empty", children: m ? m(g.label ?? g.key) : "Nobody here." })
              ] })
            ]
          },
          g.key
        );
      })
    ] }),
    T && /* @__PURE__ */ e("p", { className: "hf-lanes__how", children: "Drag a card to another stage, or press and hold it on a touch screen. With the keyboard: Space to pick it up, the arrows to choose, Space to drop." }),
    F && ye && At(
      /* @__PURE__ */ e(
        "div",
        {
          className: "hf-lanecard is-ghost",
          "aria-hidden": "true",
          style: { width: F.w, transform: `translate(${B.x - F.offX}px, ${B.y - F.offY}px) rotate(1.5deg) scale(1.03)` },
          children: /* @__PURE__ */ e(bn, { c: o(ye) })
        }
      ),
      document.body
    ),
    nn
  ] });
}
const Yn = {
  rated: /* @__PURE__ */ e(ae, { size: 14, strokeWidth: 2.5 }),
  missing: /* @__PURE__ */ e("span", { className: "hf-month__bang", children: "!" }),
  skipped: /* @__PURE__ */ e(Oe, { size: 14, strokeWidth: 2.5 }),
  future: /* @__PURE__ */ e("span", { className: "hf-month__dot" })
};
function $i({ months: n, label: t = "Monthly ratings" }) {
  return /* @__PURE__ */ e("div", { className: "hf-months", role: "img", "aria-label": `${t}. ${ha(n)}`, style: { gridTemplateColumns: `repeat(${Math.max(1, n.length)}, minmax(0, 1fr))` }, children: n.map((a, s) => /* @__PURE__ */ i("span", { className: `hf-month hf-month--${a.state}`, "aria-hidden": "true", children: [
    /* @__PURE__ */ e("span", { className: "hf-month__l", children: a.label }),
    Yn[a.state]
  ] }, s)) });
}
function Di({ hint: n }) {
  return /* @__PURE__ */ i("div", { className: "hf-monthkey", children: [
    ["rated", "missing", "skipped", "future"].map((a) => /* @__PURE__ */ i("span", { className: `hf-monthkey__i hf-monthkey__i--${a}`, children: [
      Yn[a],
      Rn[a]
    ] }, a)),
    n && /* @__PURE__ */ e(ie, { label: "About the month strip", text: n })
  ] });
}
function Mi({ stages: n, current: t, label: a = "Stage" }) {
  const { index: s, line: r } = da(n, t);
  return /* @__PURE__ */ i("div", { className: "hf-stagebar", children: [
    /* @__PURE__ */ e("span", { className: "hf-stagebar__bar", role: "img", "aria-label": `${a}. ${r}`, children: n.map((l, c) => /* @__PURE__ */ e("span", { className: c <= s ? "hf-stagebar__seg hf-stagebar__seg--on" : "hf-stagebar__seg" }, l)) }),
    /* @__PURE__ */ e("span", { className: "hf-stagebar__line", "aria-hidden": "true", children: r })
  ] });
}
function Fi({ steps: n, selected: t, onSelect: a, label: s }) {
  return /* @__PURE__ */ e("ol", { className: "hf-steps", "aria-label": s, children: n.map((r, l) => {
    const c = oa(r.state, l), o = /* @__PURE__ */ i(U, { children: [
      /* @__PURE__ */ i("span", { className: "hf-step__rail", "aria-hidden": "true", children: [
        /* @__PURE__ */ e("span", { className: "hf-step__dot", children: c.mark === "tick" ? /* @__PURE__ */ e(ae, { size: 16, strokeWidth: 3 }) : c.mark === "dash" ? /* @__PURE__ */ e(Oe, { size: 16, strokeWidth: 3 }) : l + 1 }),
        l < n.length - 1 && /* @__PURE__ */ e("span", { className: "hf-step__line" })
      ] }),
      /* @__PURE__ */ i("span", { className: "hf-step__b", children: [
        /* @__PURE__ */ i("span", { className: "hf-step__t", children: [
          r.title,
          /* @__PURE__ */ i("span", { className: "hf-sr", children: [
            ", ",
            c.words
          ] })
        ] }),
        r.sub && /* @__PURE__ */ e("span", { className: "hf-step__s", children: r.sub })
      ] })
    ] });
    return /* @__PURE__ */ e("li", { "aria-current": r.state === "current" ? "step" : void 0, children: a ? /* @__PURE__ */ e("button", { type: "button", className: `hf-step hf-step--${r.state}`, "aria-pressed": t === r.key, onClick: () => a(r.key), children: o }) : /* @__PURE__ */ e("div", { className: `hf-step hf-step--${r.state}`, children: o }) }, r.key);
  }) });
}
function Wi({ items: n, label: t }) {
  return /* @__PURE__ */ e("ol", { className: "hf-tl", "aria-label": t, children: n.map((a) => /* @__PURE__ */ i("li", { className: "hf-tl__i", children: [
    /* @__PURE__ */ e("span", { className: "hf-tl__d", children: a.date }),
    /* @__PURE__ */ i("span", { className: "hf-tl__b", children: [
      /* @__PURE__ */ e("span", { className: "hf-tl__t", children: a.title }),
      a.sub && /* @__PURE__ */ e("span", { className: "hf-tl__s", children: a.sub }),
      a.extra
    ] })
  ] }, a.key)) });
}
function Li({ docs: n, onAdd: t, addLabel: a = "Add a document", accept: s, empty: r = "No documents yet.", busy: l }) {
  return /* @__PURE__ */ i("div", { className: "hf-docs", children: [
    n.length === 0 && /* @__PURE__ */ e("p", { className: "hf-muted hf-docs__empty", children: r }),
    n.map((c) => c.href ? /* @__PURE__ */ i("span", { className: "hf-doc__row", children: [
      /* @__PURE__ */ i("a", { className: "hf-doc", href: c.href, target: "_blank", rel: "noreferrer", children: [
        /* @__PURE__ */ e(Ie, { size: 18, "aria-hidden": "true" }),
        /* @__PURE__ */ e("span", { className: "hf-doc__n", children: c.name }),
        c.meta && /* @__PURE__ */ e("span", { className: "hf-doc__m", children: c.meta })
      ] }),
      c.end
    ] }, c.key) : /* @__PURE__ */ i("span", { className: "hf-doc__row", children: [
      /* @__PURE__ */ i("span", { className: "hf-doc", children: [
        /* @__PURE__ */ e(Ie, { size: 18, "aria-hidden": "true" }),
        /* @__PURE__ */ e("span", { className: "hf-doc__n", children: c.name }),
        c.meta && /* @__PURE__ */ e("span", { className: "hf-doc__m", children: c.meta })
      ] }),
      c.end
    ] }, c.key)),
    t && /* @__PURE__ */ i("label", { className: "hf-btn hf-btn--quiet hf-docs__add", "aria-busy": l || void 0, children: [
      /* @__PURE__ */ e(dt, { size: 18, "aria-hidden": "true" }),
      l ? "Adding…" : a,
      /* @__PURE__ */ e(
        "input",
        {
          type: "file",
          className: "hf-sr",
          accept: s,
          disabled: l,
          onChange: (c) => {
            var h;
            const o = (h = c.target.files) == null ? void 0 : h[0];
            o && t(o), c.target.value = "";
          }
        }
      )
    ] })
  ] });
}
function Ti({ list: n, children: t, keys: a, current: s, onOpen: r, word: l = "Item", listLabel: c }) {
  const [o, h] = x(!1);
  O(() => {
    h(!1);
  }, [s]);
  const { prev: f, next: d, line: m } = fa(a, s, l);
  return /* @__PURE__ */ i("div", { className: o ? "hf-split is-listing" : "hf-split", children: [
    /* @__PURE__ */ e("section", { className: "hf-split__list", "aria-label": c, children: n }),
    /* @__PURE__ */ i("div", { className: "hf-split__doc", children: [
      /* @__PURE__ */ i("div", { className: "hf-split__bar", children: [
        /* @__PURE__ */ i("button", { type: "button", className: "hf-btn hf-btn--secondary hf-press hf-btn--fit", disabled: !f, onClick: () => f && r(f), children: [
          /* @__PURE__ */ e(ft, { size: 18, "aria-hidden": "true" }),
          "Previous"
        ] }),
        /* @__PURE__ */ e("span", { className: "hf-split__pos", "aria-live": "polite", children: m }),
        /* @__PURE__ */ i("button", { type: "button", className: "hf-btn hf-btn--secondary hf-press hf-btn--fit", disabled: !d, onClick: () => d && r(d), children: [
          "Next",
          /* @__PURE__ */ e(G, { size: 18, "aria-hidden": "true" })
        ] })
      ] }),
      /* @__PURE__ */ i("button", { type: "button", className: "hf-btn hf-btn--quiet hf-press hf-btn--fit hf-split__toggle", "aria-expanded": o, onClick: () => h((A) => !A), children: [
        /* @__PURE__ */ e(ut, { size: 18, "aria-hidden": "true" }),
        o ? "Back to this one" : `The list, ${a.length}`
      ] }),
      /* @__PURE__ */ e("div", { className: "hf-split__open", children: t })
    ] })
  ] });
}
const wa = {
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
function Ca(n, t) {
  const a = { ...wa, ...t ?? {} }, s = (r) => r.split("{app}").join(n);
  return { ...a, title: s(a.title), about: s(a.about), ticks: (a.ticks ?? []).map(s) };
}
function xa(n) {
  return `repeat(${Math.max(1, Math.floor(n))}, minmax(min-content, 1fr))`;
}
function Ei(n) {
  const t = Ca(n.short, n.words);
  return /* @__PURE__ */ e("div", { className: "hf-signin", children: /* @__PURE__ */ i("div", { className: "hf-signin__grid", children: [
    /* @__PURE__ */ i("section", { className: "hf-signin__band", "aria-label": t.about, children: [
      /* @__PURE__ */ e("span", { className: "hf-signin__ring", "aria-hidden": "true" }),
      /* @__PURE__ */ i("div", { className: "hf-signin__brand", children: [
        /* @__PURE__ */ e("span", { className: "hf-signin__logo", children: /* @__PURE__ */ e(Qe, { app: n.app, size: 64 }) }),
        /* @__PURE__ */ e("p", { className: "hf-signin__app", lang: n.lang, children: n.name })
      ] }),
      /* @__PURE__ */ e("p", { className: "hf-signin__lede", lang: n.lang, children: n.lede }),
      /* @__PURE__ */ i("div", { className: "hf-signin__one", lang: n.lang, children: [
        /* @__PURE__ */ e("h2", { children: t.oneTitle }),
        /* @__PURE__ */ e("ul", { children: t.ticks.map((a) => /* @__PURE__ */ i("li", { children: [
          /* @__PURE__ */ e("span", { className: "hf-signin__tick", "aria-hidden": "true", children: /* @__PURE__ */ e(ae, { size: 14, strokeWidth: 2.5 }) }),
          a
        ] }, a)) })
      ] })
    ] }),
    /* @__PURE__ */ i("div", { className: "hf-signin__side", children: [
      /* @__PURE__ */ i("section", { className: "hf-signin__card", "aria-labelledby": "hf-signin-h", lang: n.lang, children: [
        /* @__PURE__ */ i("div", { className: "hf-signin__top", children: [
          /* @__PURE__ */ i("div", { children: [
            /* @__PURE__ */ e("h1", { className: "hf-signin__h1", id: "hf-signin-h", children: t.title }),
            /* @__PURE__ */ e("p", { className: "hf-signin__sub", children: t.sub })
          ] }),
          n.languages && n.languages.length > 1 && /* @__PURE__ */ e("div", { className: "hf-signin__seg", role: "group", "aria-label": t.language, children: n.languages.map((a) => /* @__PURE__ */ e("button", { type: "button", lang: a.lang, "aria-pressed": n.language === a.value, onClick: () => {
            var s;
            return (s = n.onLanguage) == null ? void 0 : s.call(n, a.value);
          }, children: a.label }, a.value)) })
        ] }),
        n.error && /* @__PURE__ */ i("div", { className: "hf-signin__err", role: "alert", children: [
          /* @__PURE__ */ e(Be, { size: 20, "aria-hidden": "true" }),
          /* @__PURE__ */ e("span", { children: n.error })
        ] }),
        /* @__PURE__ */ i("button", { type: "button", className: "hf-signin__go", onClick: n.onContinue, disabled: n.busy, "aria-busy": n.busy || void 0, children: [
          /* @__PURE__ */ e(xn, { size: 20, "aria-hidden": "true" }),
          n.busy ? t.busy : t.button
        ] }),
        /* @__PURE__ */ e("p", { className: "hf-signin__hint", children: t.hint }),
        n.note && /* @__PURE__ */ e("p", { className: "hf-signin__note", children: n.note })
      ] }),
      n.help && /* @__PURE__ */ e("footer", { className: "hf-signin__foot", children: n.help })
    ] })
  ] }) });
}
function zi({ items: n, more: t, label: a = "Main", className: s }) {
  const r = t ? [...n, { key: "more", ...t }] : [...n];
  return /* @__PURE__ */ i(U, { children: [
    /* @__PURE__ */ e("div", { className: "hf-tabbar__space", "aria-hidden": "true" }),
    /* @__PURE__ */ e("nav", { className: s ? `hf-tabbar ${s}` : "hf-tabbar", "aria-label": a, style: { gridTemplateColumns: xa(r.length) }, children: r.map((l) => {
      const c = /* @__PURE__ */ i(U, { children: [
        /* @__PURE__ */ e("span", { className: "hf-tabbar__ic", "aria-hidden": "true", children: l.icon }),
        /* @__PURE__ */ e("span", { className: "hf-tabbar__t", children: l.label })
      ] }), o = { className: l.current ? "hf-tabbar__item is-on" : "hf-tabbar__item", "aria-current": l.current ? "page" : void 0, ...l.attrs ?? {} };
      return l.href ? /* @__PURE__ */ e("a", { href: l.href, onClick: l.onClick, ...o, children: c }, l.key) : /* @__PURE__ */ e("button", { type: "button", onClick: l.onClick, ...o, children: c }, l.key);
    }) })
  ] });
}
function Pi({ label: n = "Main", brand: t, head: a, groups: s, foot: r }) {
  return /* @__PURE__ */ i("aside", { className: "hf-side", "aria-label": n, children: [
    t && /* @__PURE__ */ e("div", { className: "hf-side__brand", children: t }),
    a,
    /* @__PURE__ */ e("nav", { className: "hf-side__nav", children: s.map((l) => /* @__PURE__ */ i("div", { className: "hf-side__group", children: [
      l.label && /* @__PURE__ */ e("span", { className: "hf-side__cap", children: l.label }),
      l.items.map((c) => {
        const o = /* @__PURE__ */ i(U, { children: [
          c.icon && /* @__PURE__ */ e("span", { className: "hf-side__ic", "aria-hidden": "true", children: c.icon }),
          /* @__PURE__ */ e("span", { className: "hf-side__t", children: c.label })
        ] }), h = { className: c.current ? "hf-side__item is-on" : "hf-side__item", "aria-current": c.current ? "page" : void 0, ...c.attrs ?? {} };
        return c.href ? /* @__PURE__ */ e("a", { href: c.href, onClick: c.onClick, ...h, children: o }, c.key) : /* @__PURE__ */ e("button", { type: "button", onClick: c.onClick, ...h, children: o }, c.key);
      })
    ] }, l.key)) }),
    r && /* @__PURE__ */ e("div", { className: "hf-side__foot", children: r })
  ] });
}
function Ii({ side: n, top: t, tabs: a, children: s }) {
  return /* @__PURE__ */ i("div", { className: n ? "hf-frame has-side" : "hf-frame", children: [
    /* @__PURE__ */ i("div", { className: "hf-frame__panel", children: [
      n,
      /* @__PURE__ */ i("div", { className: "hf-frame__main", children: [
        t,
        /* @__PURE__ */ e("main", { className: "hf-frame__body", children: s })
      ] })
    ] }),
    a && /* @__PURE__ */ e("div", { className: "hf-frame__tabs", children: a })
  ] });
}
export {
  Ct as APP_FAMILY,
  ui as APP_LOGOS,
  Ii as AppFrame,
  Qe as AppLogo,
  ja as AppLogoTile,
  ke as AppMark,
  Za as Appearance,
  Qa as AppsDock,
  Ja as AppsGrid,
  te as Avatar,
  Pa as BalanceTile,
  Ci as Banner,
  ei as BentoGrid,
  Un as Breadcrumb,
  pi as Button,
  Va as Celebration,
  gi as Checkbox,
  mn as Chip,
  pa as ChipGroup,
  ki as ChoiceCards,
  xi as DataTable,
  Li as DocumentList,
  Ha as Feed,
  rn as FeedCard,
  vt as FeedQuiet,
  Ka as FirstLoginTour,
  qa as GiveKudosButton,
  Oa as GiveKudosSheet,
  na as GlanceStrip,
  Ta as Greeting,
  ni as GreetingBand,
  ii as HappeningCard,
  Ya as HealthDot,
  ie as Hint,
  Wa as KeyValues,
  ga as ListCard,
  ba as ListRow,
  Si as Loading,
  Rn as MONTH_WORDS,
  oe as MOVE_WORDS,
  yi as MarkGroup,
  si as MiniTile,
  Di as MonthKey,
  $i as MonthStrip,
  Xa as NewJoinerCard,
  hi as PersonPage,
  Ma as Picker,
  Ea as ProfileCard,
  Fa as QuantityField,
  di as QuickSheet,
  _t as Quiet,
  An as SCALE_WORDS,
  wa as SIGN_IN_WORDS,
  $t as SKINS,
  re as SKIPPED,
  on as SWATCHES,
  vi as ScoreGroup,
  za as ScoreRing,
  Ga as SearchPill,
  Ni as Segmented,
  bi as Select,
  Ne as Sheet,
  Pi as SideMenu,
  Ei as SignIn,
  Na as Skeleton,
  Ti as SplitView,
  Mi as StageBar,
  Bi as StageLanes,
  wi as StatusChip,
  Ra as StatusRows,
  Fi as Stepper,
  Jt as StockCard,
  Wt as TOUR_LABELS,
  Ft as TOUR_STEPS,
  zi as TabBar,
  ri as TeamCard,
  _i as TextArea,
  mi as TextField,
  ve as Tile,
  Ia as TileStrip,
  Wi as Timeline,
  fi as Toast,
  oi as UnitPage,
  La as UnitSwitch,
  ti as WaitingCard,
  jn as WaitingCounts,
  ai as WaitingQuiet,
  On as answeredCount,
  sa as answersFor,
  Mt as applyPrefs,
  It as arrange,
  Nt as bandFor,
  Je as columnsFor,
  Dt as currentPrefs,
  Ue as dayWords,
  gt as factorTotal,
  Ln as firstName,
  Xt as glanceLine,
  bt as initials,
  je as isRequired,
  Fe as isShown,
  Aa as laneCount,
  ua as laneStep,
  Ua as logoSvg,
  pt as matchOptions,
  wt as matchPeople,
  ia as missingFields,
  pn as missingLine,
  ha as monthLine,
  ca as nextSort,
  ea as peopleFilters,
  ci as showStockTile,
  Ca as signInWords,
  Tt as sortBlocks,
  la as sortRows,
  Et as spansFor,
  Ai as splitAfter,
  fa as splitStep,
  da as stageLine,
  oa as stepMark,
  aa as stepProblem,
  mt as stepQuantity,
  Hn as stockChip,
  Ot as stockDay,
  Rt as stockLead,
  li as stockTileLabel,
  Yt as stockWhy,
  xa as tabColumns,
  Gt as tenureWords,
  Wn as timeGreeting,
  Vt as unitLine,
  Ht as useLayout,
  Kt as waitingLine
};
//# sourceMappingURL=hifive-ui.js.map
