import { jsx as e, jsxs as i, Fragment as I } from "react/jsx-runtime";
import { useId as fe, useState as M, useRef as j, useMemo as _e, useEffect as H, createElement as na, useSyncExternalStore as ia, useCallback as Me, useLayoutEffect as yt, Fragment as sa } from "react";
import { Search as je, Minus as He, Plus as la, Check as ne, Building2 as ra, ChevronsUpDown as oa, Settings as kt, User as wt, Briefcase as Nt, Calendar as xt, Lock as Mt, ChevronRight as J, X as Be, Clock as qe, Award as Se, Target as ca, Bell as zt, ShieldCheck as Lt, Pin as Bt, ThumbsUp as St, Hand as me, Sun as Ct, MessageSquare as ha, Star as Gt, BookOpen as Re, UserPlus as Ce, Sparkles as da, RefreshCw as fa, CheckCircle2 as pa, BadgeCheck as ua, ExternalLink as ze, Users as Aa, Hourglass as Ye, LogOut as ma, Info as Tt, ChevronDown as $t, FileText as We, ArrowUp as _a, ArrowDown as ga, AlertTriangle as Le, Circle as ba, Paperclip as va, ChevronLeft as ya, List as ka } from "lucide-react";
import { createPortal as wa } from "react-dom";
const De = (t) => t.trim().toLowerCase();
function Na(t, a, n = 30) {
  const s = De(a);
  if (!s) return t.slice(0, n);
  const l = t.filter((c) => {
    var h;
    return (h = c.codes) == null ? void 0 : h.some((f) => De(f) === s);
  });
  if (l.length) return l.slice(0, n);
  const r = s.split(/\s+/), o = (c) => De(`${c.label} ${c.keywords ?? ""} ${(c.codes ?? []).join(" ")}`);
  return t.filter((c) => {
    const h = o(c);
    return r.every((f) => h.includes(f));
  }).slice(0, n);
}
function xa(t, a, n = {}) {
  const { min: s = 0, max: l, step: r = 1 } = n, o = Number(t);
  let h = (Number.isFinite(o) ? o : 0) + a * r;
  return h < s && (h = s), l !== void 0 && h > l && (h = l), String(Math.round(h * 1e6) / 1e6);
}
function Jn({ label: t, options: a, onPick: n, placeholder: s, hint: l, error: r, hideLabel: o, limit: c = 30, empty: h, footer: f, id: d }) {
  const m = fe(), u = d ?? m, [y, k] = M(""), [p, A] = M(!1), [_, g] = M(0), B = j(null), w = _e(() => Na(a, y, c), [a, y, c]);
  H(() => {
    if (!p) return;
    const L = (U) => {
      var x;
      (x = B.current) != null && x.contains(U.target) || A(!1);
    };
    return document.addEventListener("pointerdown", L), () => document.removeEventListener("pointerdown", L);
  }, [p]);
  const G = (L) => {
    n(L), k(""), A(!1), g(0);
  }, E = [l ? `${u}-h` : "", r ? `${u}-e` : ""].filter(Boolean).join(" ") || void 0;
  return /* @__PURE__ */ i("div", { className: "hf-fld hf-pick", ref: B, children: [
    /* @__PURE__ */ e("label", { htmlFor: u, className: o ? "hf-sr" : "hf-fld__l", children: t }),
    l && /* @__PURE__ */ e("span", { id: `${u}-h`, className: "hf-fld__h", children: l }),
    /* @__PURE__ */ i("div", { className: "hf-pick__wrap", children: [
      /* @__PURE__ */ i("div", { className: ["hf-pick__box", p ? "is-open" : "", r ? "is-err" : ""].filter(Boolean).join(" "), children: [
        /* @__PURE__ */ e(je, { size: 18, "aria-hidden": "true" }),
        /* @__PURE__ */ e(
          "input",
          {
            id: u,
            role: "combobox",
            "aria-expanded": p,
            "aria-controls": `${u}-l`,
            "aria-autocomplete": "list",
            "aria-activedescendant": p && w[_] ? `${u}-o${_}` : void 0,
            "aria-invalid": r ? !0 : void 0,
            "aria-describedby": E,
            autoComplete: "off",
            value: y,
            placeholder: s,
            onFocus: () => A(!0),
            onChange: (L) => {
              k(L.target.value), A(!0), g(0);
            },
            onKeyDown: (L) => {
              L.key === "ArrowDown" ? (L.preventDefault(), A(!0), g((U) => Math.min(U + 1, w.length - 1))) : L.key === "ArrowUp" ? (L.preventDefault(), g((U) => Math.max(U - 1, 0))) : L.key === "Enter" && p && w[_] ? (L.preventDefault(), G(w[_])) : L.key === "Escape" && p && (L.stopPropagation(), A(!1));
            }
          }
        )
      ] }),
      p && /* @__PURE__ */ i("div", { className: "hf-pick__list", children: [
        /* @__PURE__ */ e("div", { id: `${u}-l`, role: "listbox", "aria-label": t, children: w.map((L, U) => /* @__PURE__ */ i(
          "button",
          {
            id: `${u}-o${U}`,
            type: "button",
            role: "option",
            "aria-selected": U === _,
            tabIndex: -1,
            className: U === _ ? "hf-pick__opt is-on" : "hf-pick__opt",
            onPointerDown: (x) => x.preventDefault(),
            onClick: () => G(L),
            onPointerEnter: () => g(U),
            children: [
              /* @__PURE__ */ i("span", { className: "hf-pick__b", children: [
                /* @__PURE__ */ e("span", { className: "hf-pick__t", children: L.label }),
                L.sub && /* @__PURE__ */ e("span", { className: "hf-pick__s", children: L.sub })
              ] }),
              L.end && /* @__PURE__ */ e("span", { className: L.endTone ? `hf-pick__e hf-pick__e--${L.endTone}` : "hf-pick__e", children: L.end })
            ]
          },
          L.value
        )) }),
        w.length === 0 && /* @__PURE__ */ e("p", { className: "hf-pick__none", children: h ? h(y) : `Nothing matches “${y}”.` }),
        f && /* @__PURE__ */ e("div", { className: "hf-pick__foot", children: f })
      ] })
    ] }),
    r && /* @__PURE__ */ e("span", { id: `${u}-e`, className: "hf-fld__e", children: r })
  ] });
}
function Xn({ label: t, value: a, onChange: n, unit: s, min: l = 0, max: r, step: o = 1, bare: c, hint: h, error: f, hideLabel: d, id: m, className: u, ...y }) {
  const k = fe(), p = m ?? k, A = [h ? `${p}-h` : "", f ? `${p}-e` : ""].filter(Boolean).join(" ") || void 0, _ = (g) => n(xa(a, g, { min: l, max: r, step: o }));
  return /* @__PURE__ */ i("div", { className: ["hf-fld hf-qty", u ?? ""].filter(Boolean).join(" "), children: [
    /* @__PURE__ */ e("label", { htmlFor: p, className: d ? "hf-sr" : "hf-fld__l", children: t }),
    h && /* @__PURE__ */ e("span", { id: `${p}-h`, className: "hf-fld__h", children: h }),
    /* @__PURE__ */ i("div", { className: "hf-qty__row", children: [
      !c && /* @__PURE__ */ e("button", { type: "button", className: "hf-qty__b", "aria-label": `Less: ${t}`, onClick: () => _(-1), children: /* @__PURE__ */ e(He, { size: 18, "aria-hidden": "true" }) }),
      /* @__PURE__ */ e(
        "input",
        {
          id: p,
          type: "number",
          inputMode: "decimal",
          min: l,
          max: r,
          step: "any",
          value: a ?? "",
          className: f ? "hf-input hf-input--err" : "hf-input",
          "aria-invalid": f ? !0 : void 0,
          "aria-describedby": A,
          onChange: (g) => n(g.target.value),
          onWheel: (g) => g.currentTarget.blur(),
          ...y
        }
      ),
      !c && /* @__PURE__ */ e("button", { type: "button", className: "hf-qty__b", "aria-label": `More: ${t}`, onClick: () => _(1), children: /* @__PURE__ */ e(la, { size: 18, "aria-hidden": "true" }) }),
      s && /* @__PURE__ */ e("span", { className: "hf-qty__u", children: s })
    ] }),
    f && /* @__PURE__ */ e("span", { id: `${p}-e`, className: "hf-fld__e", children: f })
  ] });
}
function Kn({ items: t, columns: a = 2 }) {
  const n = t.filter((s) => s.value !== null && s.value !== void 0 && s.value !== "" && s.value !== !1);
  return n.length ? /* @__PURE__ */ e("dl", { className: `hf-kv hf-kv--${a}`, children: n.map((s) => /* @__PURE__ */ i("div", { children: [
    /* @__PURE__ */ e("dt", { children: s.label }),
    /* @__PURE__ */ e("dd", { children: s.value })
  ] }, s.label)) }) : null;
}
function Ma({ children: t, icon: a }) {
  return /* @__PURE__ */ i("p", { className: "hf-quiet", children: [
    a ?? /* @__PURE__ */ e(ne, { size: 16, "aria-hidden": "true" }),
    /* @__PURE__ */ e("span", { children: t })
  ] });
}
function ei({ name: t, label: a = "Working in", onClick: n, compact: s }) {
  const l = s ? "hf-unit hf-unit--pill" : "hf-unit", r = /* @__PURE__ */ i(I, { children: [
    /* @__PURE__ */ e(ra, { size: s ? 16 : 20, "aria-hidden": "true" }),
    s ? /* @__PURE__ */ e("span", { className: "hf-unit__n", children: t }) : /* @__PURE__ */ i("span", { className: "hf-unit__b", children: [
      /* @__PURE__ */ e("span", { className: "hf-unit__l", children: a }),
      /* @__PURE__ */ e("span", { className: "hf-unit__n", children: t })
    ] }),
    n && /* @__PURE__ */ e(oa, { size: 16, "aria-hidden": "true" })
  ] });
  return n ? /* @__PURE__ */ e("button", { type: "button", className: l, onClick: n, "aria-label": `${a}: ${t}. Switch`, children: r }) : /* @__PURE__ */ e("div", { className: l, "aria-label": `${a}: ${t}`, children: r });
}
function Dt(t = /* @__PURE__ */ new Date()) {
  const a = t.getHours();
  return a < 5 ? "Working late" : a < 12 ? "Good morning" : a < 17 ? "Good afternoon" : "Good evening";
}
function ti({ firstName: t, reportsTo: a, leads: n = 0, tenure: s, quote: l, search: r, onAppearance: o, onPrivacy: c, now: h = /* @__PURE__ */ new Date() }) {
  const f = h.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  return /* @__PURE__ */ i("div", { className: "hf", children: [
    /* @__PURE__ */ i("div", { className: "hf-topbar", children: [
      /* @__PURE__ */ e("p", { className: "hf-topbar__date", children: f }),
      r && /* @__PURE__ */ e("div", { className: "hf-topbar__search", children: r }),
      o && /* @__PURE__ */ e("button", { type: "button", className: "hf-topbar__gear", onClick: o, "aria-label": "Appearance settings", "data-tour": "gear", children: /* @__PURE__ */ e(kt, { size: 20 }) })
    ] }),
    /* @__PURE__ */ i("header", { className: "hf-greet", "data-tour": "topbar", children: [
      /* @__PURE__ */ i("h1", { className: "hf-display hf-greet__h1", children: [
        Dt(h),
        ", ",
        t
      ] }),
      (a || n > 0 || s) && /* @__PURE__ */ i("div", { className: "hf-greet__meta", children: [
        a && /* @__PURE__ */ i("span", { children: [
          /* @__PURE__ */ e(wt, { size: 14 }),
          "Reports to ",
          a
        ] }),
        n > 0 && /* @__PURE__ */ i("span", { children: [
          /* @__PURE__ */ e(Nt, { size: 14 }),
          "Leads ",
          n,
          " ",
          n === 1 ? "person" : "people"
        ] }),
        s && /* @__PURE__ */ i("span", { children: [
          /* @__PURE__ */ e(xt, { size: 14 }),
          s
        ] })
      ] }),
      c && /* @__PURE__ */ i("button", { type: "button", className: "hf-greet__privacy", onClick: c, children: [
        /* @__PURE__ */ e(Mt, { size: 12 }),
        /* @__PURE__ */ e("span", { children: "Only you can see this page" }),
        /* @__PURE__ */ e(J, { size: 12 })
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
const he = (t) => `hf-tone-${t}`, q = (...t) => t.filter(Boolean).join(" "), za = (t) => t.split(" ").filter(Boolean).map((a) => a[0]).slice(0, 2).join("").toUpperCase();
function ai({ name: t, role: a, company: n, photo: s, onOpen: l }) {
  return s ? /* @__PURE__ */ i("section", { className: "hf hf-card hf-profile hf-profile--photo", "aria-label": "Your profile", "data-tour": "profile", children: [
    /* @__PURE__ */ e("img", { className: "hf-profile__photo", src: s, alt: t }),
    /* @__PURE__ */ i("div", { className: "hf-profile__over", children: [
      /* @__PURE__ */ e("h2", { className: "hf-display hf-profile__name", children: t }),
      (a || n) && /* @__PURE__ */ e("p", { className: "hf-profile__role", children: [a, n].filter(Boolean).join(" · ") })
    ] }),
    l && /* @__PURE__ */ e("button", { type: "button", className: "hf-sr", onClick: l, children: "Open my access" })
  ] }) : /* @__PURE__ */ e("section", { className: "hf hf-card hf-profile", "aria-label": "Your profile", "data-tour": "profile", children: /* @__PURE__ */ i(l ? "button" : "div", { className: q("hf-profile__row", l && "hf-press"), onClick: l, type: l ? "button" : void 0, style: l ? { width: "100%", textAlign: "left" } : void 0, children: [
    /* @__PURE__ */ e("span", { className: "hf-avatar", "aria-hidden": "true", children: za(t) }),
    /* @__PURE__ */ i("span", { style: { flex: 1, minWidth: 0 }, children: [
      /* @__PURE__ */ e("h2", { className: "hf-display hf-profile__name hf-truncate", title: t, children: t }),
      (a || n) && /* @__PURE__ */ i("p", { className: "hf-profile__role hf-truncate", children: [
        a && /* @__PURE__ */ e("b", { children: a }),
        a && n && /* @__PURE__ */ e("span", { className: "hf-profile__co", children: " · " }),
        n && /* @__PURE__ */ e("span", { className: "hf-profile__co", children: n })
      ] })
    ] }),
    l && /* @__PURE__ */ e("span", { className: "hf-profile__chev", "aria-hidden": "true", children: /* @__PURE__ */ e(J, { size: 18 }) })
  ] }) });
}
function ie({ text: t, label: a = "What does this mean?", align: n = "centre" }) {
  const [s, l] = M(!1), r = fe(), o = j(null), [c, h] = M(n);
  return H(() => {
    if (!s) return;
    const f = o.current;
    if (f && n === "centre") {
      const u = f.getBoundingClientRect();
      u.left + u.width / 2 - 130 < 8 ? h("right") : u.left + u.width / 2 + 130 > window.innerWidth - 8 ? h("left") : h("centre");
    }
    const d = (u) => {
      u.key === "Escape" && l(!1);
    }, m = () => l(!1);
    return document.addEventListener("keydown", d), document.addEventListener("click", m), () => {
      document.removeEventListener("keydown", d), document.removeEventListener("click", m);
    };
  }, [s, n]), /* @__PURE__ */ i("span", { className: "hf-hint", ref: o, children: [
    /* @__PURE__ */ e(
      "button",
      {
        type: "button",
        className: "hf-hint__btn",
        "aria-label": a,
        "aria-expanded": s,
        "aria-describedby": s ? r : void 0,
        onClick: (f) => {
          f.stopPropagation(), l((d) => !d);
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
        onClick: (f) => f.stopPropagation(),
        children: t
      }
    )
  ] });
}
function ve({ open: t, title: a, subtitle: n, onClose: s, children: l, wide: r }) {
  const o = fe(), c = j(null), h = j(s);
  return H(() => {
    h.current = s;
  }), H(() => {
    var u;
    if (!t) return;
    const f = document.activeElement;
    (u = c.current) == null || u.focus();
    const d = (y) => {
      y.key === "Escape" && h.current();
    };
    window.addEventListener("keydown", d);
    const m = document.body.style.overflow;
    return document.body.style.overflow = "hidden", () => {
      var y;
      window.removeEventListener("keydown", d), document.body.style.overflow = m, (y = f == null ? void 0 : f.focus) == null || y.call(f);
    };
  }, [t]), t ? /* @__PURE__ */ e("div", { className: "hf hf-scrim", onClick: s, children: /* @__PURE__ */ i("div", { className: r ? "hf-sheet hf-sheet--wide" : "hf-sheet", role: "dialog", "aria-modal": "true", "aria-labelledby": o, onClick: (f) => f.stopPropagation(), children: [
    /* @__PURE__ */ i("div", { className: "hf-sheet__head", children: [
      /* @__PURE__ */ i("div", { children: [
        /* @__PURE__ */ e("h2", { id: o, className: "hf-sheet__title", children: a }),
        n && /* @__PURE__ */ e("p", { className: "hf-sheet__sub", children: n })
      ] }),
      /* @__PURE__ */ e("button", { ref: c, type: "button", className: "hf-sheet__close", onClick: s, "aria-label": "Close", children: /* @__PURE__ */ e(Be, { size: 18 }) })
    ] }),
    l
  ] }) }) : null;
}
function La(t) {
  const a = t.reduce((n, s) => n + s.weight, 0) || 1;
  return Math.round(t.reduce((n, s) => n + s.score / s.max * s.weight, 0) / a * 100);
}
function Ba(t, a) {
  return t >= a.exceeding ? { label: "Exceeding", icon: /* @__PURE__ */ e(Se, { size: 12 }), tone: "brand" } : t >= a.onTrack ? { label: "On track", icon: /* @__PURE__ */ e(ca, { size: 12 }), tone: "pop" } : { label: "Needs attention", icon: /* @__PURE__ */ e(zt, { size: 12 }), tone: "coral" };
}
function Sa({ history: t }) {
  if (t.length < 2) return null;
  const a = Math.min(...t) - 4, n = Math.max(...t) + 2, s = 120 / (t.length - 1), l = t.map((c, h) => [h * s, 30 - (c - a) / (n - a || 1) * 28]), r = l.map((c, h) => (h ? "L" : "M") + c[0].toFixed(1) + " " + c[1].toFixed(1)).join(" "), o = l[l.length - 1];
  return /* @__PURE__ */ i("svg", { viewBox: "0 0 120 32", role: "img", "aria-label": `Last ${t.length} months: ${t.join(", ")}`, children: [
    /* @__PURE__ */ e("path", { d: `${r} L${o[0]} 32 L0 32 Z`, fill: "rgb(var(--brand-500) / .12)" }),
    /* @__PURE__ */ e("path", { d: r, fill: "none", stroke: "rgb(var(--brand-500))", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }),
    /* @__PURE__ */ e("circle", { cx: o[0], cy: o[1], r: "3", fill: "rgb(var(--brand-500))" })
  ] });
}
function ni({ factors: t, bands: a, conductPolicy: n, status: s, history: l = [], improve: r = [], building: o, title: c = "Your HiFive Factor" }) {
  var V;
  const [h, f] = M(!1), [d, m] = M(0), [u, y] = M(0), k = La(t), p = typeof window < "u" && ((V = window.matchMedia) == null ? void 0 : V.call(window, "(prefers-reduced-motion: reduce)").matches), A = typeof document < "u" && document.documentElement.getAttribute("data-tier") === "lite", _ = p || A;
  H(() => {
    if (_) {
      m(1), y(k);
      return;
    }
    const N = setTimeout(() => m(1), 100), W = setTimeout(() => {
      let R = 0;
      const ee = performance.now(), re = (Y) => {
        const v = Math.min(1, (Y - ee) / 1100);
        y(Math.round(k * (1 - Math.pow(1 - v, 3)))), v < 1 && (R = requestAnimationFrame(re));
      };
      return R = requestAnimationFrame(re), () => cancelAnimationFrame(R);
    }, 650);
    return () => {
      clearTimeout(N), clearTimeout(W);
    };
  }, [k, _]);
  const g = t.reduce((N, W) => N + W.weight, 0) || 1, B = 45, w = 2 * Math.PI * B;
  let G = 0;
  const E = t.map((N) => {
    const W = N.score / N.max * N.weight / g * w, R = { ...N, len: W, offset: G };
    return G += W, R;
  }), L = Ba(k, a), U = t.find((N) => N.balance), x = U && n ? U.score >= n.warn ? "ok" : U.score >= n.formalWarning ? "watch" : "risk" : "ok", P = `${c} ${k} out of 100: ` + t.map((N) => `${N.label} ${N.score} of ${N.max}`).join(", ") + (s ? `. ${s}` : ""), O = l.length >= 2 ? k - l[0] : null;
  return /* @__PURE__ */ i(I, { children: [
    /* @__PURE__ */ i("button", { type: "button", className: "hf hf-card hf-card--hero hf-factor hf-press", onClick: () => f(!0), "data-tour": "factor", "aria-haspopup": "dialog", children: [
      /* @__PURE__ */ i("div", { className: "hf-factor__head", children: [
        /* @__PURE__ */ i("div", { children: [
          /* @__PURE__ */ i("h3", { className: "hf-display hf-factor__title", children: [
            c,
            " ",
            /* @__PURE__ */ e(ie, { text: `One number, 0 to 100, built from ${t.map((N) => `${N.label.toLowerCase()} (${Math.round(N.weight / g * 100)}%)`).join(", ")}. It is never compared with anyone else. Tap the card for the full breakdown.` })
          ] }),
          /* @__PURE__ */ e("p", { className: "hf-factor__tap", children: "Tap to see how it's built" })
        ] }),
        /* @__PURE__ */ e("span", { className: "hf-factor__chev", "aria-hidden": "true", children: /* @__PURE__ */ e(J, { size: 18 }) })
      ] }),
      /* @__PURE__ */ i("div", { className: "hf-factor__row", children: [
        /* @__PURE__ */ i("div", { className: "hf-ring", children: [
          /* @__PURE__ */ i("svg", { viewBox: "0 0 100 100", role: "img", "aria-label": o ? `${c}: building, first score after your first review` : P, children: [
            /* @__PURE__ */ e("circle", { className: "hf-ring__track", cx: "50", cy: "50", r: B, fill: "none", strokeWidth: "8" }),
            !o && E.map((N, W) => /* @__PURE__ */ e(
              "circle",
              {
                className: q("hf-ring__seg", he(N.tone)),
                cx: "50",
                cy: "50",
                r: B,
                fill: "none",
                strokeWidth: "8",
                stroke: "var(--hf-tone-bar)",
                style: { transitionDelay: `${W * 120}ms`, strokeDasharray: `${N.len * d} ${w}`, strokeDashoffset: -N.offset }
              },
              N.key
            ))
          ] }),
          o ? /* @__PURE__ */ e("span", { className: "hf-ring__building", children: "Building — first score after your first review" }) : /* @__PURE__ */ e("span", { className: "hf-ring__num hf-num", "aria-hidden": "true", children: u })
        ] }),
        /* @__PURE__ */ i("div", { style: { flex: 1, minWidth: 0 }, children: [
          !o && /* @__PURE__ */ i("span", { className: q("hf-band", he(L.tone)), children: [
            L.icon,
            " ",
            L.label
          ] }),
          s && /* @__PURE__ */ e("p", { className: "hf-factor__status", children: s }),
          U && n && x !== "ok" && /* @__PURE__ */ i("p", { className: "hf-factor__warn", children: [
            U.score,
            " conduct points left",
            x === "risk" ? " · formal warning stage" : ""
          ] }),
          /* @__PURE__ */ e("div", { className: "hf-legend", children: t.map((N) => /* @__PURE__ */ i("div", { className: he(N.tone), children: [
            /* @__PURE__ */ e("i", { "aria-hidden": "true" }),
            /* @__PURE__ */ e("span", { children: N.label }),
            /* @__PURE__ */ e("span", { className: "hf-legend__n", children: N.balance ? `${N.score}/${N.max} left` : `${N.score}/${N.max}` })
          ] }, N.key)) })
        ] })
      ] }),
      l.length >= 2 && /* @__PURE__ */ i("div", { className: "hf-spark", children: [
        /* @__PURE__ */ e(Sa, { history: l }),
        /* @__PURE__ */ e("div", { children: O !== null && /* @__PURE__ */ i(I, { children: [
          /* @__PURE__ */ i("b", { children: [
            O >= 0 ? "+" : "",
            O
          ] }),
          " over ",
          l.length,
          " months"
        ] }) })
      ] }),
      /* @__PURE__ */ i("span", { className: "hf-factor__cta", "aria-hidden": "true", children: [
        /* @__PURE__ */ e("span", { children: "See how it's built" }),
        /* @__PURE__ */ e("span", { children: /* @__PURE__ */ e(J, { size: 20 }) })
      ] })
    ] }),
    /* @__PURE__ */ i(ve, { open: h, onClose: () => f(!1), title: c, subtitle: o ? "How it will be built" : `How your ${k} is built`, children: [
      /* @__PURE__ */ e("p", { className: "hf-muted", style: { margin: "0 0 20px", fontSize: 14, lineHeight: 1.6 }, children: "One number that brings together your performance, your conduct and your learning. Only you, your management line, HR and the directors can see it, and it is never compared with anyone else." }),
      /* @__PURE__ */ e("div", { className: "hf-break", children: t.map((N) => {
        const W = Math.round(N.score / N.max * 100), R = Math.round(N.weight / g * 100), ee = N.balance ? x === "ok" ? "brand" : x === "watch" ? "warn" : "danger" : N.tone;
        return /* @__PURE__ */ i("div", { className: he(ee), children: [
          /* @__PURE__ */ i("div", { className: "hf-break__head", children: [
            /* @__PURE__ */ i("b", { children: [
              N.label,
              " ",
              /* @__PURE__ */ i("small", { children: [
                "· ",
                R,
                "% of score"
              ] })
            ] }),
            /* @__PURE__ */ e("b", { className: "hf-num", style: { fontWeight: 600 }, children: N.balance ? `${N.score} of ${N.max} left` : `${N.score}/${N.max}` })
          ] }),
          /* @__PURE__ */ i("div", { className: "hf-break__bar", role: "img", "aria-label": `${N.label}: ${W}%`, children: [
            /* @__PURE__ */ e("i", { style: { width: `${W}%` } }),
            N.balance && n && /* @__PURE__ */ e("span", { className: "hf-break__mark", style: { left: `${Math.round(n.formalWarning / N.max * 100)}%` }, title: `Below ${n.formalWarning} points: formal warning` })
          ] }),
          /* @__PURE__ */ e("p", { className: "hf-break__hint", children: N.hint })
        ] }, N.key);
      }) }),
      s && /* @__PURE__ */ i("div", { className: "hf-note", children: [
        /* @__PURE__ */ e(qe, { size: 14, style: { flex: "none", marginTop: 2 } }),
        /* @__PURE__ */ i("span", { children: [
          s,
          ". Your reporting manager will confirm each checkpoint with you."
        ] })
      ] }),
      r.length > 0 && /* @__PURE__ */ i("div", { className: "hf-improve", children: [
        /* @__PURE__ */ e("h4", { children: "What would move it up" }),
        /* @__PURE__ */ e("ol", { children: r.map((N, W) => /* @__PURE__ */ i("li", { children: [
          /* @__PURE__ */ e("i", { children: W + 1 }),
          /* @__PURE__ */ e("span", { children: N })
        ] }, W)) })
      ] })
    ] })
  ] });
}
function we({ tone: t, icon: a, value: n, label: s, pulse: l, hint: r, onClick: o }) {
  return /* @__PURE__ */ i(o ? "button" : "div", { className: q("hf-tile hf-press", he(t)), onClick: o, type: o ? "button" : void 0, children: [
    /* @__PURE__ */ i("div", { className: "hf-tile__top", children: [
      /* @__PURE__ */ i("span", { className: "hf-tile__ic", children: [
        a,
        l && /* @__PURE__ */ e("span", { className: "hf-tile__pulse", "aria-hidden": "true" })
      ] }),
      r && /* @__PURE__ */ e(ie, { text: r })
    ] }),
    /* @__PURE__ */ i("div", { children: [
      /* @__PURE__ */ e("span", { className: "hf-tile__value hf-num", children: n }),
      /* @__PURE__ */ e("span", { className: "hf-tile__label hf-clamp-2", children: s })
    ] })
  ] });
}
function ii({ score: t, max: a, policy: n, label: s = "Conduct points left", hint: l, onClick: r }) {
  const o = !n || t >= n.warn ? "ok" : t >= n.formalWarning ? "watch" : "risk", c = o === "ok" ? "brand" : o === "watch" ? "warn" : "danger", h = o === "ok" ? "" : o === "watch" ? " · take care" : " · urgent", f = l ?? `Conduct points are a balance. Everyone starts with ${a}. A recorded issue deducts points; at 0 the contract ends. A clean record restores points over time.${n ? ` Fewer than ${n.formalWarning} means a formal warning.` : ""}`;
  return /* @__PURE__ */ i(
    r ? "button" : "div",
    {
      className: q("hf-tile hf-press", he(c)),
      onClick: r,
      type: r ? "button" : void 0,
      "aria-label": `${s}: ${t} of ${a}${h}`,
      children: [
        /* @__PURE__ */ i("div", { className: "hf-tile__top", children: [
          /* @__PURE__ */ e("span", { className: "hf-tile__ic", children: /* @__PURE__ */ e(Lt, { size: 18 }) }),
          /* @__PURE__ */ e(ie, { text: f })
        ] }),
        /* @__PURE__ */ i("div", { children: [
          /* @__PURE__ */ i("span", { className: "hf-tile__value hf-num", children: [
            t,
            /* @__PURE__ */ i("small", { children: [
              " / ",
              a
            ] })
          ] }),
          /* @__PURE__ */ e("span", { className: "hf-pips", "aria-hidden": "true", children: Array.from({ length: a }, (m, u) => /* @__PURE__ */ e("i", { className: u < Math.floor(t) ? "on" : "" }, u)) }),
          /* @__PURE__ */ i("span", { className: "hf-tile__label hf-clamp-2", children: [
            s,
            h
          ] })
        ] })
      ]
    }
  );
}
function si({ children: t, wrap: a = !0, label: n }) {
  return /* @__PURE__ */ e("div", { className: q("hf-tiles", a && "hf-tiles--wrap"), role: n ? "group" : void 0, "aria-label": n, children: t });
}
const Ca = {
  joiner: { icon: /* @__PURE__ */ e(Ce, { size: 20 }), tone: "sky" },
  induction: { icon: /* @__PURE__ */ e(Se, { size: 20 }), tone: "brand" },
  probation: { icon: /* @__PURE__ */ e(Re, { size: 20 }), tone: "brand" },
  anniversary: { icon: /* @__PURE__ */ e(Gt, { size: 20 }), tone: "pop" },
  kudos: { icon: /* @__PURE__ */ e(ha, { size: 20 }), tone: "pop" }
};
function rt({ item: t, onReact: a }) {
  var o, c;
  if (t.type === "pinned")
    return /* @__PURE__ */ i("article", { className: "hf hf-card hf-pinned", children: [
      /* @__PURE__ */ i("div", { className: "hf-pinned__tag", children: [
        /* @__PURE__ */ e(Bt, { size: 12 }),
        " Pinned by HR"
      ] }),
      t.title && /* @__PURE__ */ e("h4", { children: t.title }),
      /* @__PURE__ */ e("p", { children: t.text })
    ] });
  const { icon: n, tone: s } = Ca[t.type], l = !!((o = t.mine) != null && o.like), r = !!((c = t.mine) != null && c.clap);
  return /* @__PURE__ */ i("article", { className: q("hf hf-card hf-feedcard", he(s)), children: [
    /* @__PURE__ */ i("div", { className: "hf-feedcard__row", children: [
      /* @__PURE__ */ e("span", { className: "hf-feedcard__ic", "aria-hidden": "true", children: n }),
      /* @__PURE__ */ i("div", { style: { minWidth: 0 }, children: [
        /* @__PURE__ */ e("p", { className: "hf-feedcard__text", children: t.text }),
        t.from && /* @__PURE__ */ i("p", { className: "hf-feedcard__from", children: [
          "— from the ",
          t.from
        ] }),
        /* @__PURE__ */ e("p", { className: "hf-feedcard__when", children: t.when })
      ] })
    ] }),
    a && /* @__PURE__ */ i("div", { className: "hf-feedcard__acts", children: [
      /* @__PURE__ */ i("button", { type: "button", className: "hf-react", "aria-pressed": l, "aria-label": `Thumbs up, ${t.likes}`, onClick: () => a(t.id, "like"), children: [
        /* @__PURE__ */ e(St, { size: 14 }),
        " ",
        t.likes
      ] }),
      /* @__PURE__ */ i("button", { type: "button", className: "hf-react", "aria-pressed": r, "aria-label": `Clap, ${t.claps}`, onClick: () => a(t.id, "clap"), children: [
        /* @__PURE__ */ e(me, { size: 14 }),
        " ",
        t.claps
      ] })
    ] })
  ] });
}
function Ga({ onKudos: t }) {
  return /* @__PURE__ */ i("div", { className: "hf hf-card hf-feed__quiet hf-tone-brand", children: [
    /* @__PURE__ */ e("span", { className: "hf-feedcard__ic", "aria-hidden": "true", children: /* @__PURE__ */ e(Ct, { size: 20 }) }),
    /* @__PURE__ */ e("p", { className: "hf-display", children: "Nothing new since yesterday" }),
    /* @__PURE__ */ e("p", { className: "hf-muted", children: "A quiet day across HiFive. New joiners, inductions and kudos appear here as they happen." }),
    t && /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: t, children: "Be the first — give kudos" })
  ] });
}
function li({ items: t, onReact: a, onKudos: n }) {
  const s = t.filter((r) => r.type === "pinned"), l = t.filter((r) => r.type !== "pinned");
  return /* @__PURE__ */ i("div", { className: "hf-feed", "data-tour": "feed", children: [
    s.map((r) => /* @__PURE__ */ e(rt, { item: r }, r.id)),
    l.length === 0 ? /* @__PURE__ */ e(Ga, { onKudos: n }) : l.map((r) => /* @__PURE__ */ e(rt, { item: r, onReact: a }, r.id))
  ] });
}
function Ta(t, a, n = 8) {
  const s = a.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return s.length ? t.filter((l) => {
    const r = l.name.toLowerCase().split(/\s+/);
    return s.every((o) => r.some((c) => c.startsWith(o)));
  }).slice(0, n) : [];
}
function Pt(t) {
  const a = t.trim().split(/\s+/).filter(Boolean);
  return a.length ? a[0].endsWith(".") && a[1] ? `${a[0]} ${a[1]}` : a[0] : t;
}
const ot = {
  "hifive-id": { lucide: "shield-check", nodes: [["path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" }], ["path", { d: "m9 12 2 2 4-4" }]] },
  performance: { lucide: "trending-up", nodes: [["polyline", { points: "22 7 13.5 15.5 8.5 10.5 2 17" }], ["polyline", { points: "16 7 22 7 22 13" }]] },
  todo: { lucide: "square-check", nodes: [["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }], ["path", { d: "m9 12 2 2 4-4" }]] },
  recruitment: { lucide: "user-check", nodes: [["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }], ["circle", { cx: "9", cy: "7", r: "4" }], ["polyline", { points: "16 11 18 13 22 9" }]] },
  lms: { lucide: "book-open", nodes: [["path", { d: "M12 7v14" }], ["path", { d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" }]] },
  apml: { lucide: "phone-call", nodes: [["path", { d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" }], ["path", { d: "M14.05 2a9 9 0 0 1 8 7.94" }], ["path", { d: "M14.05 6A5 5 0 0 1 18 10" }]] },
  transport: { lucide: "route", nodes: [["circle", { cx: "6", cy: "19", r: "3" }], ["path", { d: "M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" }], ["circle", { cx: "18", cy: "5", r: "3" }]] },
  inventory: { lucide: "package", nodes: [["path", { d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" }], ["path", { d: "M12 22V12" }], ["path", { d: "m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" }], ["path", { d: "m7.5 4.27 9 5.15" }]] },
  perspectives: { lucide: "compass", nodes: [["path", { d: "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z" }], ["circle", { cx: "12", cy: "12", r: "10" }]] }
}, $a = [
  { key: "hifive-id", short: "HiFive ID", full: "HiFive ID", hub: !0 },
  { key: "performance", short: "Performance", full: "Performance Hub", hub: !0 },
  { key: "todo", short: "To-Do", full: "To-Do", hub: !0 },
  { key: "recruitment", short: "Recruitment", full: "Recruitment Portal", hub: !0 },
  { key: "lms", short: "Learning Point", full: "HiFive Learning Point", hub: !0 },
  { key: "apml", short: "APML Tracker", full: "APML Tracker", hub: !0 },
  { key: "transport", short: "Logistics", full: "Accuracy Plus Logistics", hub: !0 },
  { key: "inventory", short: "Inventory", full: "HiFive Inventory", hub: !0 },
  { key: "perspectives", short: "Perspectives", full: "Leadership Perspectives", hub: !1 }
], Ft = (t) => ot[t] ?? ot["hifive-id"], Ut = (t) => $a.find((a) => a.key === t) ?? null, Wt = "M50,0 C88,0 100,12 100,50 C100,88 88,100 50,100 C12,100 0,88 0,50 C0,12 12,0 50,0 Z", be = (t) => String(t).replace(/[&<>"]/g, (a) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[a]);
function Da(t) {
  return Ft(t).nodes.map(([a, n]) => `<${a} ${Object.entries(n).map(([s, l]) => `${s}="${be(l)}"`).join(" ")}/>`).join("");
}
function Et(t = "tile") {
  const a = t === "maskable" ? 42 : 56;
  return { at: (100 - a) / 2, scale: a / 24 };
}
function ri(t, { size: a = 64, shape: n = "tile", tile: s = "var(--primary, #024ea3)", mark: l = "var(--on-primary, #ffffff)", title: r } = {}) {
  var m;
  const { at: o, scale: c } = Et(n), h = a <= 24 ? 2.4 : 2, f = n === "tile" ? `<path d="${Wt}" fill="${be(s)}"/>` : `<rect width="100" height="100" fill="${be(s)}"/>`, d = r ?? ((m = Ut(t)) == null ? void 0 : m.full) ?? "HiFive";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${a}" height="${a}" viewBox="0 0 100 100" role="img" aria-label="${be(d)}">` + f + `<g transform="translate(${o} ${o}) scale(${c})" fill="none" stroke="${be(l)}" stroke-width="${h}" stroke-linecap="round" stroke-linejoin="round">${Da(t)}</g></svg>`;
}
const Ve = {
  water: ["#3a86ff", "#012f6b"],
  earth: ["#2fa067", "#123a28"],
  air: ["#11958f", "#063f3e"],
  fire: ["#ea4f2c", "#5e1307"],
  luna: ["#3182bd", "#0f2f45"],
  sol: ["#c78410", "#6b4404"],
  aami: ["#9d4bf0", "#3d066a"],
  aadi: ["#2387aa", "#082833"]
}, Pa = "M100 50L99.9 68.8L99.7 74.8L99.3 79.1L98.8 82.6L98.1 85.4L97.2 87.9L96.2 90L94.9 91.9L93.5 93.5L91.9 94.9L90 96.2L87.9 97.2L85.4 98.1L82.6 98.8L79.1 99.3L74.8 99.7L68.8 99.9L50 100L31.2 99.9L25.2 99.7L20.9 99.3L17.4 98.8L14.6 98.1L12.1 97.2L10 96.2L8.1 94.9L6.5 93.5L5.1 91.9L3.8 90L2.8 87.9L1.9 85.4L1.2 82.6L0.7 79.1L0.3 74.8L0.1 68.8L0 50L0.1 31.2L0.3 25.2L0.7 20.9L1.2 17.4L1.9 14.6L2.8 12.1L3.8 10L5.1 8.1L6.5 6.5L8.1 5.1L10 3.8L12.1 2.8L14.6 1.9L17.4 1.2L20.9 0.7L25.2 0.3L31.2 0.1L50 0L68.8 0.1L74.8 0.3L79.1 0.7L82.6 1.2L85.4 1.9L87.9 2.8L90 3.8L91.9 5.1L93.5 6.5L94.9 8.1L96.2 10L97.2 12.1L98.1 14.6L98.8 17.4L99.3 20.9L99.7 25.2L99.9 31.2Z", Fa = {
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
  recruitment: {
    small: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c4b5fd"/><stop offset="1" stop-color="#6d28d9"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#c9d1de" stroke-width="2.5"/><g><path d="M25.5 31a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0z M15 80c0-14.5 10.5-25 23-25s23 10.5 23 25z" fill="url(#b)"/><path d="M53 38h24a9 9 0 0 1 9 9v16a9 9 0 0 1 -9 9h-24a9 9 0 0 1 -9 -9v-16a9 9 0 0 1 9 -9z" fill="#fff" fill-opacity="0.88"/><path d="M53 38h24a9 9 0 0 1 9 9v16a9 9 0 0 1 -9 9h-24a9 9 0 0 1 -9 -9v-16a9 9 0 0 1 9 -9z" fill="#c4b5fd" fill-opacity=".14"/><path d="M53 38h24a9 9 0 0 1 9 9v16a9 9 0 0 1 -9 9h-24a9 9 0 0 1 -9 -9v-16a9 9 0 0 1 9 -9z" fill="none" stroke="#c3cbd8" stroke-width="3"/><path d="M53 49h24 M53 56h17 M53 63h10" fill="none" stroke="url(#s)" stroke-width="4.86" stroke-linecap="round" stroke-linejoin="round"/></g></svg>',
    full: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c4b5fd"/><stop offset="1" stop-color="#6d28d9"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient><linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient><clipPath id="c"><path d="M53 38h24a9 9 0 0 1 9 9v16a9 9 0 0 1 -9 9h-24a9 9 0 0 1 -9 -9v-16a9 9 0 0 1 9 -9z"/></clipPath><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5"/></filter></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#dfe5ee" stroke-width="1.2"/><g><path d="M25.5 31a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0z M15 80c0-14.5 10.5-25 23-25s23 10.5 23 25z" fill="url(#b)" opacity=".35" filter="url(#f)" transform="translate(0 5)"/><path d="M25.5 31a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0z M15 80c0-14.5 10.5-25 23-25s23 10.5 23 25z" fill="url(#b)"/><g clip-path="url(#c)"><path d="M25.5 31a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0 -25 0z M15 80c0-14.5 10.5-25 23-25s23 10.5 23 25z" fill="url(#b)" filter="url(#f)"/></g><path d="M53 38h24a9 9 0 0 1 9 9v16a9 9 0 0 1 -9 9h-24a9 9 0 0 1 -9 -9v-16a9 9 0 0 1 9 -9z" fill="#fff" fill-opacity="0.22"/><path d="M53 38h24a9 9 0 0 1 9 9v16a9 9 0 0 1 -9 9h-24a9 9 0 0 1 -9 -9v-16a9 9 0 0 1 9 -9z" fill="#c4b5fd" fill-opacity=".14"/><path d="M53 38h24a9 9 0 0 1 9 9v16a9 9 0 0 1 -9 9h-24a9 9 0 0 1 -9 -9v-16a9 9 0 0 1 9 -9z" fill="url(#h)"/><path d="M53 38h24a9 9 0 0 1 9 9v16a9 9 0 0 1 -9 9h-24a9 9 0 0 1 -9 -9v-16a9 9 0 0 1 9 -9z" fill="none" stroke="#fff" stroke-width="1.3"/><path d="M53 49h24 M53 56h17 M53 63h10" fill="none" stroke="url(#s)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></g></svg>'
  },
  todo: {
    small: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fdba74"/><stop offset="1" stop-color="#ea580c"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#c9d1de" stroke-width="2.5"/><g><path d="M53 14h20a11 11 0 0 1 11 11v20a11 11 0 0 1 -11 11h-20a11 11 0 0 1 -11 -11v-20a11 11 0 0 1 11 -11z" fill="url(#b)"/><path d="M28 30h26a10 10 0 0 1 10 10v34a10 10 0 0 1 -10 10h-26a10 10 0 0 1 -10 -10v-34a10 10 0 0 1 10 -10z" fill="#fff" fill-opacity="0.88"/><path d="M28 30h26a10 10 0 0 1 10 10v34a10 10 0 0 1 -10 10h-26a10 10 0 0 1 -10 -10v-34a10 10 0 0 1 10 -10z" fill="#fdba74" fill-opacity=".14"/><path d="M28 30h26a10 10 0 0 1 10 10v34a10 10 0 0 1 -10 10h-26a10 10 0 0 1 -10 -10v-34a10 10 0 0 1 10 -10z" fill="none" stroke="#c3cbd8" stroke-width="3"/><path d="M28 60l7.5 7.5l16-17 M28 44h22" fill="none" stroke="url(#s)" stroke-width="6.075" stroke-linecap="round" stroke-linejoin="round"/></g></svg>',
    full: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbfcfe"/><stop offset="1" stop-color="#eef2f8"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fdba74"/><stop offset="1" stop-color="#ea580c"/></linearGradient><linearGradient id="s" gradientUnits="userSpaceOnUse" x1="26" y1="44" x2="66" y2="80"><stop offset="0" stop-color="__A__"/><stop offset="1" stop-color="__B__"/></linearGradient><linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient><clipPath id="c"><path d="M28 30h26a10 10 0 0 1 10 10v34a10 10 0 0 1 -10 10h-26a10 10 0 0 1 -10 -10v-34a10 10 0 0 1 10 -10z"/></clipPath><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5"/></filter></defs><path d="__T__" fill="url(#t)"/><path d="__T__" fill="none" stroke="#dfe5ee" stroke-width="1.2"/><g><path d="M53 14h20a11 11 0 0 1 11 11v20a11 11 0 0 1 -11 11h-20a11 11 0 0 1 -11 -11v-20a11 11 0 0 1 11 -11z" fill="url(#b)" opacity=".35" filter="url(#f)" transform="translate(0 5)"/><path d="M53 14h20a11 11 0 0 1 11 11v20a11 11 0 0 1 -11 11h-20a11 11 0 0 1 -11 -11v-20a11 11 0 0 1 11 -11z" fill="url(#b)"/><g clip-path="url(#c)"><path d="M53 14h20a11 11 0 0 1 11 11v20a11 11 0 0 1 -11 11h-20a11 11 0 0 1 -11 -11v-20a11 11 0 0 1 11 -11z" fill="url(#b)" filter="url(#f)"/></g><path d="M28 30h26a10 10 0 0 1 10 10v34a10 10 0 0 1 -10 10h-26a10 10 0 0 1 -10 -10v-34a10 10 0 0 1 10 -10z" fill="#fff" fill-opacity="0.22"/><path d="M28 30h26a10 10 0 0 1 10 10v34a10 10 0 0 1 -10 10h-26a10 10 0 0 1 -10 -10v-34a10 10 0 0 1 10 -10z" fill="#fdba74" fill-opacity=".14"/><path d="M28 30h26a10 10 0 0 1 10 10v34a10 10 0 0 1 -10 10h-26a10 10 0 0 1 -10 -10v-34a10 10 0 0 1 10 -10z" fill="url(#h)"/><path d="M28 30h26a10 10 0 0 1 10 10v34a10 10 0 0 1 -10 10h-26a10 10 0 0 1 -10 -10v-34a10 10 0 0 1 10 -10z" fill="none" stroke="#fff" stroke-width="1.3"/><path d="M28 60l7.5 7.5l16-17 M28 44h22" fill="none" stroke="url(#s)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></g></svg>'
  }
}, Ua = {
  "hifive-id": "hifive-id",
  performance: "performance",
  todo: "todo",
  recruitment: "recruitment",
  lms: "learning-point",
  apml: "apml-tracker",
  transport: "logistics",
  inventory: "inventory",
  perspectives: "perspectives",
  hifive: "hifive-mark",
  // kit names and old aliases also resolve
  "learning-point": "learning-point",
  learning: "learning-point",
  "apml-tracker": "apml-tracker",
  logistics: "logistics",
  "hifive-mark": "hifive-mark",
  admin: "hifive-id",
  "hifive id": "hifive-id"
}, oi = Object.keys(Ve), It = 32;
function Ot(t) {
  return Ua[String(t ?? "").trim().toLowerCase()] ?? null;
}
function jt(t) {
  const a = String(t ?? "").trim().toLowerCase();
  return Ve[a] ? a : "water";
}
function Wa(t, a = {}) {
  const n = Ot(t);
  if (!n) return null;
  const s = Fa[n], [l, r] = Ve[jt(a.theme)];
  return ((a.size ?? 48) < It ? s.small : s.full).split("__T__").join(Pa).replace("__A__", l).replace("__B__", r);
}
const ct = /* @__PURE__ */ new Map();
function Ea(t, a = {}) {
  const n = Ot(t);
  if (!n) return null;
  const s = `${n}|${(a.size ?? 48) < It ? "s" : "f"}|${jt(a.theme)}`;
  let l = ct.get(s);
  return l === void 0 && (l = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(Wa(t, a)), ct.set(s, l)), l;
}
const Ia = () => typeof document > "u" ? null : document.documentElement.getAttribute("data-skin"), Oa = (t) => {
  if (typeof MutationObserver > "u" || typeof document > "u") return () => {
  };
  const a = new MutationObserver(t);
  return a.observe(document.documentElement, { attributes: !0, attributeFilter: ["data-skin"] }), () => a.disconnect();
};
function ja() {
  return ia(Oa, Ia, () => null);
}
function Qe({ app: t, size: a = 48, label: n, className: s }) {
  const l = ja(), r = Ea(t, { size: a, theme: l }), o = s ? `hf-applogo ${s}` : "hf-applogo";
  if (r)
    return /* @__PURE__ */ e(
      "img",
      {
        className: o,
        src: r,
        width: a,
        height: a,
        alt: n ?? "",
        "aria-hidden": n ? void 0 : !0,
        draggable: !1,
        decoding: "async"
      }
    );
  const { at: c, scale: h } = Et("tile"), f = a <= 24 ? 2.4 : 2;
  return /* @__PURE__ */ i(
    "svg",
    {
      className: o,
      width: a,
      height: a,
      viewBox: "0 0 100 100",
      role: n ? "img" : void 0,
      "aria-label": n,
      "aria-hidden": n ? void 0 : !0,
      focusable: "false",
      children: [
        /* @__PURE__ */ e("path", { d: Wt, fill: "var(--primary)" }),
        /* @__PURE__ */ e("g", { transform: `translate(${c} ${c}) scale(${h})`, fill: "none", stroke: "var(--on-primary)", strokeWidth: f, strokeLinecap: "round", strokeLinejoin: "round", children: Ft(t).nodes.map(([d, m], u) => na(d, { key: u, ...m })) })
      ]
    }
  );
}
function ci({ app: t, size: a = 52, name: n }) {
  var s;
  return /* @__PURE__ */ i("span", { className: "hf-applogo-tile", children: [
    /* @__PURE__ */ e(Qe, { app: t, size: a }),
    /* @__PURE__ */ e("span", { className: "hf-applogo-tile__name", children: n ?? ((s = Ut(t)) == null ? void 0 : s.short) ?? t })
  ] });
}
const Ha = { learning: "lms", logistics: "transport", admin: "hifive-id", "hifive id": "hifive-id" };
function ye({ app: t, size: a = 40, label: n }) {
  const s = String(t ?? "").trim().toLowerCase();
  return /* @__PURE__ */ e(Qe, { app: Ha[s] ?? s, size: a, label: n });
}
const ht = ["brand", "sky", "pop", "ink"];
function ae({ name: t, size: a = 32, ring: n, photo: s }) {
  const r = t.trim().split(/\s+/).slice(0, n || a < 32 ? 1 : 2).map((c) => c[0]).join("").toUpperCase(), o = ht[[...t].reduce((c, h) => c + h.charCodeAt(0), 0) % ht.length];
  return /* @__PURE__ */ e("span", { className: `hf-av hf-av--${o}${n ? " hf-av--ring" : ""}`, style: { width: a, height: a, fontSize: Math.round(a * 0.38) }, "aria-hidden": "true", children: s ? /* @__PURE__ */ e("img", { src: s, alt: "" }) : r });
}
function hi({ onClick: t }) {
  return /* @__PURE__ */ i("button", { type: "button", className: "hf hf-card hf-kudos-btn hf-press", onClick: t, "aria-haspopup": "dialog", children: [
    /* @__PURE__ */ e("span", { className: "hf-kudos-btn__ic", "aria-hidden": "true", children: /* @__PURE__ */ e(me, { size: 16 }) }),
    "Give kudos to a colleague",
    /* @__PURE__ */ e(J, { size: 16 })
  ] });
}
function di({ open: t, onClose: a, people: n, onSend: s }) {
  const [l, r] = M(""), [o, c] = M(""), h = _e(() => Ta(n, o), [n, o]), f = n.find((_) => _.id === l) ?? null, [d, m] = M(""), [u, y] = M({}), [k, p] = M(!1);
  async function A() {
    const _ = {};
    l || (_.to = "Choose who the kudos is for");
    const g = d.trim();
    if (g.length < 4 && (_.msg = "Add a few words about what they did"), g.length > 280 && (_.msg = "Keep it under 280 characters"), y(_), _.to || _.msg) return;
    const B = n.find((w) => w.id === l);
    p(!0);
    try {
      await s(B, g), r(""), c(""), m(""), a();
    } catch (w) {
      y({ msg: w instanceof Error && w.message ? w.message : "That didn't send. Try again, or tell HR." });
    } finally {
      p(!1);
    }
  }
  return /* @__PURE__ */ i(ve, { open: t, onClose: a, title: "Give kudos", children: [
    /* @__PURE__ */ i("div", { className: `hf-field${u.to ? " hf-field--error" : ""}`, children: [
      /* @__PURE__ */ e("label", { htmlFor: "hf-kudos-who", children: /* @__PURE__ */ e("span", { children: "Who" }) }),
      f ? /* @__PURE__ */ i("div", { className: "hf-who", children: [
        /* @__PURE__ */ e(ae, { name: f.name, size: 32 }),
        /* @__PURE__ */ i("span", { className: "hf-who__txt", children: [
          /* @__PURE__ */ e("b", { children: f.name }),
          f.detail && /* @__PURE__ */ e("span", { children: f.detail })
        ] }),
        /* @__PURE__ */ e("button", { type: "button", className: "hf-who__x", "aria-label": `Change from ${f.name}`, onClick: () => {
          r(""), c("");
        }, children: /* @__PURE__ */ e(Be, { size: 16 }) })
      ] }) : /* @__PURE__ */ i(I, { children: [
        /* @__PURE__ */ i("div", { className: "hf-who__search", children: [
          /* @__PURE__ */ e(je, { size: 16, "aria-hidden": "true" }),
          /* @__PURE__ */ e(
            "input",
            {
              id: "hf-kudos-who",
              type: "search",
              value: o,
              autoComplete: "off",
              placeholder: n.length ? "Type a name" : "Loading colleagues…",
              onChange: (_) => c(_.target.value),
              "aria-invalid": !!u.to,
              "aria-controls": "hf-kudos-matches",
              disabled: !n.length
            }
          )
        ] }),
        o.trim() && /* @__PURE__ */ i("ul", { id: "hf-kudos-matches", className: "hf-who__list", "aria-label": "Matching colleagues", children: [
          h.map((_) => /* @__PURE__ */ e("li", { children: /* @__PURE__ */ i("button", { type: "button", className: "hf-who__opt", onClick: () => {
            r(_.id), y((g) => ({ ...g, to: void 0 }));
          }, children: [
            /* @__PURE__ */ e(ae, { name: _.name, size: 28 }),
            /* @__PURE__ */ i("span", { className: "hf-who__txt", children: [
              /* @__PURE__ */ e("b", { children: _.name }),
              _.detail && /* @__PURE__ */ e("span", { children: _.detail })
            ] })
          ] }) }, _.id)),
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
          onChange: (_) => m(_.target.value),
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
    /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--primary", onClick: A, disabled: k, children: k ? "Sending…" : "Send kudos" })
  ] });
}
function fi({ rows: t, label: a = "Status" }) {
  return t.length ? /* @__PURE__ */ e("section", { className: "hf hf-card hf-rows", "aria-label": a, children: t.map((n) => /* @__PURE__ */ i("div", { className: "hf-row", children: [
    /* @__PURE__ */ e("span", { className: "hf-row__ic", "aria-hidden": "true", children: n.icon }),
    /* @__PURE__ */ i("span", { className: "hf-row__label", children: [
      n.label,
      n.hint && /* @__PURE__ */ e(ie, { text: n.hint })
    ] }),
    n.value && /* @__PURE__ */ e("span", { className: "hf-row__value", children: n.value }),
    n.action && (n.action.href ? /* @__PURE__ */ e("a", { className: "hf-row__action", href: n.action.href, children: n.action.label }) : /* @__PURE__ */ e("button", { type: "button", className: "hf-row__action", onClick: n.action.onClick, children: n.action.label }))
  ] }, n.key)) }) : null;
}
function pi({ ok: t }) {
  return /* @__PURE__ */ e("span", { className: "hf-dot", style: t ? void 0 : { background: "rgb(var(--warn))" }, "aria-hidden": "true" });
}
const qa = {
  factor_band: /* @__PURE__ */ e(Se, { size: 24 }),
  probation_confirmed: /* @__PURE__ */ e(Gt, { size: 24 }),
  induction_complete: /* @__PURE__ */ e(Re, { size: 24 }),
  anniversary: /* @__PURE__ */ e(da, { size: 24 }),
  kudos: /* @__PURE__ */ e(me, { size: 24 })
};
function ui({ type: t, title: a, detail: n, onDismiss: s }) {
  return /* @__PURE__ */ i("section", { className: "hf hf-card hf-celebrate", "aria-live": "polite", "aria-label": "A moment worth noting", children: [
    /* @__PURE__ */ e("div", { className: "hf-confetti", "aria-hidden": "true", children: Array.from({ length: 14 }).map((l, r) => /* @__PURE__ */ e("i", { style: {
      left: `${r * 7.3 % 100}%`,
      animationDelay: `${r % 7 * 0.18}s`,
      background: r % 3 === 0 ? "rgb(var(--pop-400))" : r % 3 === 1 ? "rgb(var(--brand-400))" : "rgb(var(--sky-400))"
    } }, r)) }),
    /* @__PURE__ */ i("div", { className: "hf-celebrate__row", children: [
      /* @__PURE__ */ e("span", { className: "hf-celebrate__ic", "aria-hidden": "true", children: qa[t] }),
      /* @__PURE__ */ i("div", { className: "hf-celebrate__body", style: { flex: 1, minWidth: 0 }, children: [
        /* @__PURE__ */ i("p", { className: "hf-celebrate__cap", children: [
          "A moment worth noting ",
          /* @__PURE__ */ e(ie, { text: "Shown once a day, only when something changed for you: a Factor band, a probation decision, an induction completed or an anniversary." })
        ] }),
        /* @__PURE__ */ e("h2", { className: "hf-display hf-celebrate__h", children: a }),
        n && /* @__PURE__ */ e("p", { className: "hf-celebrate__p", children: n })
      ] }),
      /* @__PURE__ */ e("button", { type: "button", className: "hf-celebrate__x", onClick: s, "aria-label": "Dismiss", children: /* @__PURE__ */ e(Be, { size: 18 }) })
    ] })
  ] });
}
const Ae = { side: "hifive-dock-side", top: "hifive-dock-top", tip: "hifive-dock-tip" }, Pe = (t) => {
  try {
    return localStorage.getItem(t);
  } catch {
    return null;
  }
}, Fe = (t, a) => {
  try {
    localStorage.setItem(t, a);
  } catch {
  }
};
function Ai({ apps: t }) {
  const a = j(null), n = j(null), [s, l] = M(() => Pe(Ae.side) === "left" ? "left" : "right"), [r, o] = M(() => Number(Pe(Ae.top)) || 50), [c, h] = M(() => !Pe(Ae.tip)), f = j(!1), d = () => {
    h(!1), Fe(Ae.tip, "1");
  };
  H(() => {
    Fe(Ae.side, s), Fe(Ae.top, String(r));
  }, [s, r]);
  const m = (k) => {
    const p = a.current;
    if (!p) return;
    const A = p.getBoundingClientRect();
    n.current = { x: k.clientX, y: k.clientY, left: A.left, top: A.top, moved: !1 };
  }, u = (k) => {
    const p = n.current, A = a.current;
    if (!p || !A) return;
    const _ = k.clientX - p.x, g = k.clientY - p.y;
    if (!p.moved) {
      if (Math.abs(_) + Math.abs(g) <= 6) return;
      p.moved = !0, A.setPointerCapture(k.pointerId), A.classList.add("dragging");
    }
    A.style.transform = "none", A.style.left = `${p.left + _}px`, A.style.right = "auto", A.style.top = `${p.top + g}px`;
  }, y = () => {
    const k = n.current, p = a.current;
    if (n.current = null, !k || !p || !k.moved) return;
    p.classList.remove("dragging");
    const A = p.getBoundingClientRect(), _ = A.left + A.width / 2 < window.innerWidth / 2 ? "left" : "right", g = Math.round(Math.min(90, Math.max(10, (A.top + A.height / 2) / window.innerHeight * 100)));
    p.style.transform = "", p.style.left = "", p.style.right = "", p.style.top = `${g}%`, l(_), o(g), d(), f.current = !0, setTimeout(() => {
      f.current = !1;
    }, 50);
  };
  return /* @__PURE__ */ i(I, { children: [
    c && /* @__PURE__ */ e("div", { className: "hf hf-dock__scrim", "aria-hidden": "true", onClick: d }),
    /* @__PURE__ */ i(
      "nav",
      {
        ref: a,
        className: q("hf hf-dock", `hf-dock--${s}`),
        "aria-label": "Your apps",
        style: { top: `${r}%` },
        onPointerDown: m,
        onPointerMove: u,
        onPointerUp: y,
        onPointerCancel: y,
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
          t.map((k) => /* @__PURE__ */ i(
            "button",
            {
              type: "button",
              className: "hf-dock__btn hf-dock__btn--mark",
              "aria-label": k.label,
              onClick: (p) => {
                if (f.current) {
                  p.preventDefault();
                  return;
                }
                k.onOpen();
              },
              children: [
                /* @__PURE__ */ e(ye, { app: k.key, size: 44 }),
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
function mi({ apps: t, hideOnDesktop: a = !0 }) {
  return /* @__PURE__ */ e("section", { className: q("hf", a && "hf-apps--hide-desktop"), "aria-label": "Your apps", "data-tour": "apps", children: /* @__PURE__ */ i("div", { className: "hf-card hf-apps2", children: [
    /* @__PURE__ */ i("h3", { className: "hf-cap hf-apps2__head", children: [
      "Your apps ",
      /* @__PURE__ */ e(ie, { text: "Every HiFive app you can open. On a computer they sit in the floating dock at the side." })
    ] }),
    /* @__PURE__ */ e("div", { className: "hf-apps2__grid", children: t.map((n) => /* @__PURE__ */ i("button", { type: "button", className: "hf-app2 hf-press", onClick: n.onOpen, children: [
      /* @__PURE__ */ e(ye, { app: n.key, size: 52 }),
      /* @__PURE__ */ e("span", { className: "hf-app2__label hf-truncate", title: n.label, children: n.label })
    ] }, n.key)) })
  ] }) });
}
const Ra = [
  ["water", "Water"],
  ["air", "Air"],
  ["earth", "Earth"],
  ["fire", "Fire"],
  ["luna", "Luna"],
  ["sol", "Sol"],
  ["aami", "Aami"],
  ["aadi", "Aadi"]
], dt = {
  water: ["#025EC4", "#0ECCED"],
  air: ["#15A898", "#33363B"],
  earth: ["#2F7A5A", "#8A5A34"],
  fire: ["#AF2610", "#4C2325"],
  luna: ["#26658C", "#54ACBF"],
  sol: ["#FBB931", "#EA6113"],
  aami: ["#610C9F", "#DA0C81"],
  aadi: ["#17566F", "#AF3D41"]
}, xe = { skin: "water", style: "soft", mode: "light" };
function Ya() {
  const t = document.documentElement;
  return {
    skin: t.getAttribute("data-skin") || xe.skin,
    style: t.getAttribute("data-style") || xe.style,
    mode: t.getAttribute("data-theme") || xe.mode
  };
}
function Va(t) {
  const a = document.documentElement;
  if (window.hifiveTheme) {
    window.hifiveTheme.set(t);
    return;
  }
  t.skin && a.setAttribute("data-skin", t.skin), t.style && a.setAttribute("data-style", t.style), t.mode && (a.setAttribute("data-theme", t.mode), a.classList.toggle("dark", t.mode === "dark"));
}
function ft({ label: t, value: a, options: n, onPick: s }) {
  return /* @__PURE__ */ i("div", { className: "hf-ap__row", children: [
    /* @__PURE__ */ e("p", { className: "hf-cap", style: { margin: "0 0 8px" }, children: t }),
    /* @__PURE__ */ e("div", { className: "hf-seg", role: "group", "aria-label": t, children: n.map(([l, r]) => /* @__PURE__ */ e("button", { type: "button", "aria-pressed": a === l, onClick: () => s(l), children: r }, l)) })
  ] });
}
function _i({ open: t, onClose: a, onSave: n, onReplayTour: s }) {
  const [l, r] = M(() => typeof document > "u" ? xe : Ya()), [o, c] = M("idle"), h = j(null);
  function f(d) {
    r((m) => ({ ...m, ...d })), Va(d), n && (c("saving"), h.current && window.clearTimeout(h.current), h.current = window.setTimeout(async () => c(await n(d) ? "saved" : "failed"), 500));
  }
  return /* @__PURE__ */ i(ve, { open: t, onClose: a, title: "Appearance", children: [
    /* @__PURE__ */ i("div", { className: "hf-ap__row", children: [
      /* @__PURE__ */ e("p", { className: "hf-cap", style: { margin: "0 0 10px" }, children: "Colours" }),
      /* @__PURE__ */ e("div", { className: "hf-swatches", role: "radiogroup", "aria-label": "Colours", children: Ra.map(([d, m]) => /* @__PURE__ */ i("button", { type: "button", role: "radio", "aria-checked": l.skin === d, className: "hf-swatch", onClick: () => f({ skin: d }), children: [
        /* @__PURE__ */ e("span", { className: "hf-swatch__dot", style: { background: `linear-gradient(135deg, ${dt[d][0]} 0 52%, ${dt[d][1]} 52% 100%)` }, children: l.skin === d && /* @__PURE__ */ e(ne, { size: 18, strokeWidth: 3 }) }),
        /* @__PURE__ */ e("span", { className: "hf-swatch__name", children: m })
      ] }, d)) })
    ] }),
    /* @__PURE__ */ i("div", { className: "hf-ap__pair", children: [
      /* @__PURE__ */ e(ft, { label: "Style", value: l.style, options: [["lit", "Lit"], ["soft", "Soft"]], onPick: (d) => f({ style: d }) }),
      /* @__PURE__ */ e(ft, { label: "Mode", value: l.mode, options: [["light", "Light"], ["dark", "Dark"]], onPick: (d) => f({ mode: d }) })
    ] }),
    /* @__PURE__ */ e("p", { className: "hf-ap__note", "aria-live": "polite", children: o === "failed" ? "Changed here, but it didn't save to your profile. Try again, or tell HR." : o === "saved" ? "Saved. Your choice follows you to every HiFive app and device." : "Default is Water · Soft · Light. Your choice is kept on your profile, so it follows you." }),
    s && /* @__PURE__ */ e("div", { className: "hf-ap__replay", children: /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--secondary", onClick: () => {
      a(), s();
    }, children: "Replay the tour" }) })
  ] });
}
function gi({ onSearch: t, placeholder: a = "Search", id: n }) {
  const [s, l] = M(""), [r, o] = M([]), [c, h] = M(-1), [f, d] = M(!1), m = fe(), u = j(null);
  H(() => {
    if (!s.trim()) {
      o([]), d(!1);
      return;
    }
    return u.current && window.clearTimeout(u.current), u.current = window.setTimeout(async () => {
      try {
        const A = await t(s.trim());
        o(A), d(!0), h(A.length ? 0 : -1);
      } catch {
        o([]), d(!1);
      }
    }, 250), () => {
      u.current && window.clearTimeout(u.current);
    };
  }, [s, t]);
  const y = (A) => {
    d(!1), l(""), A.onPick ? A.onPick() : A.href && (window.location.href = A.href);
  }, k = (A) => {
    f && (A.key === "ArrowDown" && (A.preventDefault(), h((_) => Math.min(r.length - 1, _ + 1))), A.key === "ArrowUp" && (A.preventDefault(), h((_) => Math.max(0, _ - 1))), A.key === "Enter" && c >= 0 && (A.preventDefault(), y(r[c])), A.key === "Escape" && d(!1));
  }, p = ["People", "Apps", "Policies"];
  return /* @__PURE__ */ i("div", { className: "hf hf-search__wrap", children: [
    /* @__PURE__ */ i("form", { role: "search", className: "hf-search", onSubmit: (A) => A.preventDefault(), children: [
      /* @__PURE__ */ e(je, { size: 18 }),
      /* @__PURE__ */ e(
        "input",
        {
          id: n,
          type: "search",
          value: s,
          onChange: (A) => l(A.target.value),
          onKeyDown: k,
          placeholder: a,
          "aria-label": "Search people, apps and policies",
          "aria-controls": f ? m : void 0,
          "aria-expanded": f,
          "aria-autocomplete": "list",
          role: "combobox"
        }
      ),
      s && /* @__PURE__ */ e("button", { type: "button", className: "hf-search__clear", onClick: () => l(""), "aria-label": "Clear", children: /* @__PURE__ */ e(Be, { size: 16 }) })
    ] }),
    f && /* @__PURE__ */ i("div", { className: "hf-search__results", id: m, role: "listbox", children: [
      r.length === 0 && /* @__PURE__ */ i("p", { className: "hf-search__group hf-muted", style: { margin: 0 }, children: [
        "Nothing matches “",
        s,
        "”."
      ] }),
      p.filter((A) => r.some((_) => _.group === A)).map((A) => /* @__PURE__ */ i("div", { children: [
        /* @__PURE__ */ e("p", { className: "hf-cap hf-search__group", style: { margin: 0 }, children: A }),
        r.map((_, g) => _.group === A && /* @__PURE__ */ i("button", { type: "button", role: "option", "aria-selected": g === c, className: "hf-search__item", onMouseEnter: () => h(g), onClick: () => y(_), children: [
          /* @__PURE__ */ e("span", { className: "hf-truncate", title: _.title, children: _.title }),
          _.detail && /* @__PURE__ */ e("small", { className: "hf-truncate", title: _.detail, children: _.detail })
        ] }, `${A}-${g}`))
      ] }, A))
    ] })
  ] });
}
function bi({ firstName: t, day: a = 1, firstReview: n, top: s, induction: l, steps: r }) {
  const o = l != null && l.total ? Math.round(l.done / l.total * 100) : 0, c = a <= 7 ? `Day ${a} of your first week` : `Week ${Math.ceil(a / 7)} at HiFive`;
  return /* @__PURE__ */ i("section", { className: "hf hf-card hf-card--hero hf-joiner", "aria-label": "Your first week", "data-tour": "factor", children: [
    s === void 0 && /* @__PURE__ */ e("p", { className: "hf-joiner__day", children: c }),
    /* @__PURE__ */ i("h3", { className: "hf-display hf-joiner__h", children: [
      "Welcome, ",
      t
    ] }),
    /* @__PURE__ */ e("p", { className: "hf-joiner__p", children: s !== void 0 ? s : /* @__PURE__ */ i(I, { children: [
      "Your HiFive Factor starts after your first review",
      n ? ` in ${n}` : "",
      ". Until then, this is your week."
    ] }) }),
    l && l.total > 0 && /* @__PURE__ */ i(I, { children: [
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
      /* @__PURE__ */ e("span", { className: "hf-check__dot", "aria-hidden": "true", children: h.state === "done" && /* @__PURE__ */ e(ne, { size: 12 }) }),
      /* @__PURE__ */ e("span", { className: "hf-check__text", children: h.text }),
      h.detail && /* @__PURE__ */ e("span", { className: "hf-check__detail", children: h.detail }),
      h.action ? /* @__PURE__ */ e("a", { className: "hf-check__act", href: h.action.href, children: h.action.label }) : h.state === "next" && /* @__PURE__ */ e("span", { className: "hf-check__next", children: "Next" }),
      /* @__PURE__ */ e("span", { className: "hf-sr", children: h.state === "done" ? ", done" : h.state === "next" ? ", next" : ", to do" })
    ] }, h.text)) })
  ] });
}
const Qa = [
  { selector: '[data-tour="topbar"]', title: "Your day, at the top", text: "Today’s date, a search for people and apps, and the gear for appearance settings." },
  { selector: '[data-tour="profile"]', title: "This is you", text: "Your card. Tap it any time to see exactly what you have access to." },
  { selector: '[data-tour="factor"]', title: "Your HiFive Factor", text: "One number built from performance, conduct and learning. Tap it to see how it’s built. Nobody else is compared with you here." },
  { selector: '[data-tour="month"]', title: "This month", text: "Only things that are yours to do or notice this month. When it’s quiet, it says so." },
  { selector: '[data-tour="team"]', title: "Your team", text: "The people who report to you. You see them; they don’t see each other’s standing.", when: (t) => !!t.isManager },
  { selector: '[data-tour="feed"]', title: "Happening at HiFive", text: "Joiners and milestones across the group, and kudos once they arrive. HR approves what is posted." },
  { selector: '[data-tour="apps"]', title: "Your apps", text: "Performance Hub, Recruitment, Learning Point and the rest open from here with your look carried across." },
  { selector: '[data-tour="status"]', title: "Waiting for you", text: "Letters, approvals and anything that needs your tap. Empty means nothing is waiting." },
  { selector: '[data-tour="know"]', title: "Know yourself", text: "Your personality profile from Learning Point. You, HR and the directors; your manager cannot open it." },
  { selector: '[data-tour="gear"]', title: "Make it yours", text: "Palette, Lit or Soft, light or dark. You can replay this tour from here whenever you like." }
], Za = {
  step: "Step {n} of {of}",
  skip: "Skip",
  back: "Back",
  next: "Next",
  finish: "Finish",
  doneTitle: "That’s your home page",
  doneText: "You’ve seen everything on it. You can replay this from the gear any time.",
  dontShow: "I understand, don’t show this again",
  done: "Done"
}, de = 10, Ne = 300, pt = () => {
  var t;
  return typeof window < "u" && ((t = window.matchMedia) == null ? void 0 : t.call(window, "(prefers-reduced-motion: reduce)").matches);
};
function Ja(t, a) {
  const [n, s] = M(null);
  return yt(() => {
    if (!a || !t) return;
    const l = document.querySelector(t);
    if (!l) {
      s(null);
      return;
    }
    const r = () => {
      const c = l.getBoundingClientRect();
      s({ top: c.top, left: c.left, width: c.width, height: c.height });
    };
    l.scrollIntoView({ behavior: pt() ? "auto" : "smooth", block: "center", inline: "nearest" });
    const o = setTimeout(r, pt() ? 0 : 380);
    return r(), window.addEventListener("resize", r), window.addEventListener("scroll", r, !0), () => {
      clearTimeout(o), window.removeEventListener("resize", r), window.removeEventListener("scroll", r, !0);
    };
  }, [t, a]), n;
}
function vi({ open: t, steps: a = Qa, context: n = {}, onSkip: s, onDone: l, labels: r, lang: o }) {
  const c = { ...Za, ...r || {} }, [h, f] = M([]);
  H(() => {
    t && f(a.filter((P) => (!P.when || P.when(n)) && document.querySelector(P.selector)));
  }, [t, a, n]);
  const [d, m] = M(0), [u, y] = M(!1), [k, p] = M(!0), A = h[d], _ = Ja((A == null ? void 0 : A.selector) ?? "", t && !u), g = j(null);
  H(() => {
    t && (m(0), y(!1), p(!0));
  }, [t]);
  const B = Me(() => {
    d + 1 >= h.length ? y(!0) : m(d + 1);
  }, [d, h.length]), w = Me(() => {
    u ? y(!1) : d > 0 && m(d - 1);
  }, [d, u]);
  if (H(() => {
    if (!t) return;
    const P = (O) => {
      O.key === "Escape" ? (O.preventDefault(), s()) : (O.key === "ArrowRight" || O.key === "Enter") && !u ? (O.preventDefault(), B()) : O.key === "ArrowLeft" && (O.preventDefault(), w());
    };
    return window.addEventListener("keydown", P), () => window.removeEventListener("keydown", P);
  }, [t, u, B, w, s]), H(() => {
    var P;
    t && ((P = g.current) == null || P.focus());
  }, [t, d, u]), !t || !u && !A) return null;
  const G = window.innerWidth < 768, E = window.innerWidth, L = window.innerHeight;
  if (u)
    return /* @__PURE__ */ e("div", { className: "hf hf-tour__scrim hf-tour__scrim--centre", role: "dialog", "aria-modal": "true", "aria-labelledby": "hf-tour-done", children: /* @__PURE__ */ i("div", { ref: g, tabIndex: -1, className: "hf-tour__card hf-tour__card--done", lang: o, children: [
      /* @__PURE__ */ e("h2", { id: "hf-tour-done", className: "hf-display hf-tour__title", style: { fontSize: 22 }, children: c.doneTitle }),
      /* @__PURE__ */ e("p", { className: "hf-tour__text", style: { fontSize: 15 }, children: c.doneText }),
      /* @__PURE__ */ i("label", { className: "hf-tour__tick", children: [
        /* @__PURE__ */ e("input", { type: "checkbox", checked: k, onChange: (P) => p(P.target.checked) }),
        c.dontShow
      ] }),
      /* @__PURE__ */ i("div", { className: "hf-tour__acts", children: [
        /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: w, children: c.back }),
        /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--primary", style: { width: "auto" }, onClick: () => l(k), children: c.done })
      ] })
    ] }) });
  const U = _ ? { top: _.top - de, left: _.left - de, width: _.width + de * 2, height: _.height + de * 2 } : { inset: 0, borderRadius: 0, boxShadow: "none", background: "rgb(var(--ink-900) / .62)" };
  let x;
  if (G || !_)
    x = {
      left: "max(16px, env(safe-area-inset-left, 0px))",
      right: "max(16px, env(safe-area-inset-right, 0px))",
      bottom: _ && _.top + _.height / 2 > L / 2 && _ ? L - _.top + de + 12 : "calc(16px + env(safe-area-inset-bottom, 0px))"
    };
  else {
    const P = _.top + _.height + de + 12, O = L - _.top + de + 12, V = Math.min(Math.max(16, _.left + _.width / 2 - Ne / 2), E - Ne - 16);
    x = P + 160 < L ? { top: P, left: V, width: Ne } : { bottom: O, left: V, width: Ne };
  }
  return /* @__PURE__ */ i("div", { className: "hf", children: [
    /* @__PURE__ */ e("div", { className: "hf-tour__spot", style: U, "aria-hidden": "true" }),
    /* @__PURE__ */ i("div", { ref: g, tabIndex: -1, role: "dialog", "aria-modal": "true", "aria-labelledby": "hf-tour-title", "aria-describedby": "hf-tour-text", className: "hf-tour__card", style: x, lang: o, children: [
      /* @__PURE__ */ e("p", { className: "hf-cap hf-tour__step", children: c.step.replace("{n}", String(d + 1)).replace("{of}", String(h.length)) }),
      /* @__PURE__ */ e("h2", { id: "hf-tour-title", className: "hf-display hf-tour__title", children: A.title }),
      /* @__PURE__ */ e("p", { id: "hf-tour-text", className: "hf-tour__text", children: A.text }),
      /* @__PURE__ */ i("div", { className: "hf-tour__acts", children: [
        /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: s, children: c.skip }),
        /* @__PURE__ */ i("span", { className: "hf-tour__nav", children: [
          d > 0 && /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--secondary", style: { minHeight: 44 }, onClick: w, children: c.back }),
          /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--primary", style: { width: "auto", minHeight: 44 }, onClick: B, children: d + 1 >= h.length ? c.finish : c.next })
        ] })
      ] })
    ] })
  ] });
}
const Ze = (t) => t === "phone" ? 2 : 4;
function Xa(t) {
  return t.map((a, n) => [a, n]).sort((a, n) => n[0].priority - a[0].priority || a[1] - n[1]).map(([a]) => a);
}
function Ka(t, a) {
  const n = a === "phone" ? 0 : a === "tablet" ? 1 : 2, s = Ze(a), l = t.map((r) => Math.max(1, Math.min(r.size[n], s)));
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
const en = 44, ut = (t) => t.span === 1 && t.rows <= en;
function tn(t, a) {
  const n = t.map((c) => ({ ...c })), s = Math.max(0, ...n.map((c) => c.row - 1 + c.rows)), l = Array.from({ length: a + 1 }, () => new Array(s + 2).fill(!1)), r = (c, h) => {
    for (let f = c.col; f < c.col + c.span; f++) for (let d = c.row; d < c.row + c.rows; d++) l[f][d] = h;
  }, o = (c, h, f) => {
    if (c < 1 || c > a) return !1;
    for (let d = h; d < h + f; d++) if (l[c][d]) return !1;
    return !0;
  };
  n.forEach((c) => r(c, !0));
  for (const c of n) {
    if (!ut(c)) continue;
    r(c, !1);
    let h = !1;
    for (let f = 1; f < c.row && !h; f++)
      for (let d = 1; d <= a && !h; d++)
        (f === 1 || l[d][f - 1]) && o(d, f, c.rows) && (c.col = d, c.row = f, h = !0);
    r(c, !0);
  }
  for (const c of n) {
    if (!ut(c)) continue;
    const h = { col: c.col, span: c.span };
    let f = c.col, d = c.span;
    for (; o(f + d, c.row, c.rows); ) d++;
    for (; o(f - 1, c.row, c.rows); )
      f--, d++;
    d !== h.span && (c.col = f, c.span = d, r(c, !0));
  }
  return n;
}
function an(t, a, n, s = 40) {
  const l = Ze(a), r = Ka(t, a), o = Array(l).fill(0), c = t.map((h, f) => {
    const d = r[f], m = Math.max(1, n[h.id] ?? s);
    let u = 0, y = 0, k = 1 / 0;
    for (let p = 0; p + d <= l; p++) {
      const A = o.slice(p, p + d), _ = Math.max(...A), g = A.reduce((B, w) => B + (_ - w), 0);
      _ + g < k && (k = _ + g, y = _, u = p);
    }
    for (let p = u; p < u + d; p++) o[p] = y + m;
    return { id: h.id, col: u + 1, row: y + 1, span: d, rows: m };
  });
  return tn(c, l);
}
const Ht = 4, At = () => typeof window > "u" || window.matchMedia("(min-width: 1024px)").matches ? "desktop" : window.matchMedia("(min-width: 768px)").matches ? "tablet" : "phone";
function nn() {
  const [t, a] = M(At);
  return H(() => {
    const n = ["(min-width: 1024px)", "(min-width: 768px)"].map((l) => window.matchMedia(l)), s = () => a(At());
    return n.forEach((l) => l.addEventListener("change", s)), () => n.forEach((l) => l.removeEventListener("change", s));
  }, []), t;
}
function yi({ blocks: t, label: a = "Your home page", layout: n }) {
  const s = nn(), l = n ?? s, r = _e(() => Xa(t.filter((m) => m.show)), [t]), [o, c] = M({}), h = Me((m, u) => c((y) => y[m] === u ? y : { ...y, [m]: u }), []), f = {};
  for (const m of r) f[m.id] = o[m.id] ?? Math.ceil((m.reserve ?? 160) / Ht);
  const d = an(r, l, f);
  return /* @__PURE__ */ e("div", { className: "hf hf-bento", role: "region", "aria-label": a, style: { gridTemplateColumns: `repeat(${Ze(l)}, minmax(0, 1fr))` }, children: r.map((m, u) => /* @__PURE__ */ e(
    sn,
    {
      id: m.id,
      report: h,
      style: { gridColumn: `${d[u].col} / span ${d[u].span}`, gridRow: `${d[u].row} / span ${d[u].rows}` },
      children: m.node
    },
    m.id
  )) });
}
function sn({ id: t, report: a, style: n, children: s }) {
  const l = j(null);
  return yt(() => {
    const r = l.current;
    if (!r) return;
    const o = () => a(t, Math.max(1, Math.ceil(r.getBoundingClientRect().height / Ht)));
    o();
    const c = new ResizeObserver(o);
    return c.observe(r), () => c.disconnect();
  }, [t, a]), /* @__PURE__ */ e("div", { className: "hf-bento__item", "data-block": t, style: n, children: /* @__PURE__ */ e("div", { ref: l, className: "hf-bento__inner", children: s }) });
}
function ki({ firstName: t, reportsTo: a, leads: n = 0, tenure: s, quote: l, search: r, onAppearance: o, onPrivacy: c, now: h = /* @__PURE__ */ new Date() }) {
  const f = h.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  return /* @__PURE__ */ i("header", { className: "hf hf-hello", "data-tour": "topbar", children: [
    /* @__PURE__ */ i("div", { className: "hf-hello__top", children: [
      /* @__PURE__ */ e("p", { className: "hf-hello__date", children: f }),
      r && /* @__PURE__ */ e("div", { className: "hf-hello__search", children: r }),
      o && /* @__PURE__ */ e("button", { type: "button", className: "hf-hello__btn", onClick: o, "aria-label": "Appearance settings", "data-tour": "gear", children: /* @__PURE__ */ e(kt, { size: 20 }) })
    ] }),
    /* @__PURE__ */ i("h1", { className: "hf-display hf-hello__h1", children: [
      Dt(h),
      ", ",
      t
    ] }),
    (a || n > 0 || s) && /* @__PURE__ */ i("div", { className: "hf-hello__meta", children: [
      a && /* @__PURE__ */ i("span", { children: [
        /* @__PURE__ */ e(wt, { size: 14 }),
        "Reports to ",
        a
      ] }),
      n > 0 && /* @__PURE__ */ i("span", { children: [
        /* @__PURE__ */ e(Nt, { size: 14 }),
        "Leads ",
        n,
        " ",
        n === 1 ? "person" : "people"
      ] }),
      s && /* @__PURE__ */ i("span", { children: [
        /* @__PURE__ */ e(xt, { size: 14 }),
        s
      ] })
    ] }),
    c && /* @__PURE__ */ i("button", { type: "button", className: "hf-hello__chip", onClick: c, children: [
      /* @__PURE__ */ e(Mt, { size: 12 }),
      " Only you can see this page ",
      /* @__PURE__ */ e(J, { size: 12 })
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
function wi({ rows: t, unavailable: a = [], onRetry: n }) {
  const s = t.reduce((l, r) => l + (r.count ?? 1), 0);
  return /* @__PURE__ */ i("section", { className: "hf hf-card hf-wait", id: "waiting", "aria-label": "Waiting for you", children: [
    /* @__PURE__ */ i("div", { className: "hf-wait__head", children: [
      /* @__PURE__ */ e("span", { className: "hf-wait__bell", "aria-hidden": "true", children: /* @__PURE__ */ e(zt, { size: 16 }) }),
      /* @__PURE__ */ e("h3", { className: "hf-display hf-wait__title", children: "Waiting for you" }),
      s > 0 && /* @__PURE__ */ e("span", { className: "hf-count", "aria-label": `${s} waiting`, children: s }),
      /* @__PURE__ */ e("span", { style: { marginLeft: "auto" }, children: /* @__PURE__ */ e(ie, { align: "left", text: "Only things that are yours to do, from every HiFive app, most urgent first. When it's empty this card shrinks to one line." }) })
    ] }),
    /* @__PURE__ */ e("ul", { className: "hf-wait__list", children: t.map((l) => {
      const r = /* @__PURE__ */ i(I, { children: [
        /* @__PURE__ */ i("span", { className: "hf-wait__logo", children: [
          /* @__PURE__ */ e(ye, { app: l.app, size: 32 }),
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
        /* @__PURE__ */ e(J, { size: 16, className: "hf-wait__chev", "aria-hidden": "true" })
      ] });
      return /* @__PURE__ */ e("li", { children: l.href ? /* @__PURE__ */ e("a", { className: "hf-wait__row", href: l.href, children: r }) : /* @__PURE__ */ e("button", { type: "button", className: "hf-wait__row", onClick: l.onClick, children: r }) }, l.id);
    }) }),
    a.map((l) => /* @__PURE__ */ i("div", { className: "hf-wait__gap", role: "status", children: [
      /* @__PURE__ */ i("span", { children: [
        "We couldn't reach ",
        l,
        " just now. This part will fill in when it's back."
      ] }),
      n && /* @__PURE__ */ i("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: n, children: [
        /* @__PURE__ */ e(fa, { size: 14 }),
        " Try again"
      ] })
    ] }, l))
  ] });
}
function Ni() {
  return /* @__PURE__ */ i("section", { className: "hf hf-mini hf-tone-brand", "aria-label": "Waiting for you", children: [
    /* @__PURE__ */ e("span", { className: "hf-mini__ic", children: /* @__PURE__ */ e(pa, { size: 18 }) }),
    /* @__PURE__ */ i("span", { children: [
      /* @__PURE__ */ e("span", { className: "hf-display hf-mini__t", children: "Nothing waiting" }),
      /* @__PURE__ */ e("span", { className: "hf-mini__s", children: "for you today" })
    ] })
  ] });
}
const ln = { joiners: Ce, anniversary: Se, kudos: me, induction: Re, probation: ua, pinned: Bt }, Ue = 4;
function xi({ items: t, limit: a = 4, onKudos: n, onReact: s }) {
  const [l, r] = M(!1), [o, c] = M({}), [h, f] = M(!1), d = t.filter((p) => p.kind === "pinned"), m = t.filter((p) => p.kind !== "pinned"), u = [...d, ...m], y = l ? u : u.slice(0, a), k = m.length === 0 && d.length === 0;
  return /* @__PURE__ */ i("section", { className: "hf hf-card hf-happen", "aria-label": "Happening at HiFive", "data-tour": "feed", children: [
    /* @__PURE__ */ i("div", { className: "hf-happen__head", children: [
      /* @__PURE__ */ e("h3", { className: "hf-display hf-happen__title", children: "Happening at HiFive" }),
      /* @__PURE__ */ e("span", { style: { marginLeft: "auto" }, children: /* @__PURE__ */ e(ie, { align: "left", text: "Joiners, anniversaries, inductions and approved kudos from across HiFive. Grouped so one busy day never fills your page." }) })
    ] }),
    k ? /* @__PURE__ */ i("div", { className: "hf-happen__quiet", children: [
      /* @__PURE__ */ e("span", { className: "hf-kind-well hf-kind--quiet", "aria-hidden": "true", children: /* @__PURE__ */ e(Ct, { size: 18 }) }),
      /* @__PURE__ */ i("p", { children: [
        "Nothing new since yesterday.",
        n && /* @__PURE__ */ i(I, { children: [
          " ",
          /* @__PURE__ */ e("button", { type: "button", className: "hf-link", onClick: n, children: "Be the first to give kudos." })
        ] })
      ] })
    ] }) : /* @__PURE__ */ e("ul", { className: "hf-happen__list", children: y.map((p) => {
      var g, B, w, G, E, L, U;
      const A = ln[p.kind], _ = !!o[p.id];
      return /* @__PURE__ */ i("li", { className: "hf-happen__row", children: [
        /* @__PURE__ */ i("div", { className: "hf-happen__line", children: [
          (g = p.people) != null && g.length ? /* @__PURE__ */ e("span", { className: "hf-happen__stack", "aria-hidden": "true", children: p.people.slice(0, 3).map((x) => /* @__PURE__ */ e(ae, { name: x.name, size: 30, ring: !0 }, x.name)) }) : p.person ? /* @__PURE__ */ i("span", { className: "hf-happen__who", "aria-hidden": "true", children: [
            /* @__PURE__ */ e(ae, { name: p.person, size: 36 }),
            /* @__PURE__ */ e("span", { className: `hf-kind-badge hf-kind--${p.kind}`, children: /* @__PURE__ */ e(A, { size: 11 }) })
          ] }) : /* @__PURE__ */ e("span", { className: `hf-kind-well hf-kind--${p.kind}`, "aria-hidden": "true", children: /* @__PURE__ */ e(A, { size: 17 }) }),
          /* @__PURE__ */ e("div", { className: "hf-happen__body", children: (B = p.people) != null && B.length ? /* @__PURE__ */ i("button", { type: "button", className: "hf-happen__toggle", "aria-expanded": _, onClick: () => {
            c((x) => ({ [p.id]: !x[p.id] })), f(!1);
          }, children: [
            /* @__PURE__ */ e("span", { className: "hf-happen__text", children: p.headline ?? /* @__PURE__ */ i(I, { children: [
              /* @__PURE__ */ i("b", { children: [
                p.people.length,
                " ",
                p.people.length === 1 ? "person" : "people",
                " joined"
              ] }),
              " ",
              p.sub ?? "recently"
            ] }) }),
            /* @__PURE__ */ i("span", { className: "hf-happen__sub", children: [
              [...new Set(p.people.map((x) => x.where).filter(Boolean))].join(" · "),
              " · ",
              /* @__PURE__ */ e("span", { className: "hf-link", children: _ ? "Hide" : "See who" })
            ] })
          ] }) : /* @__PURE__ */ i(I, { children: [
            p.kind === "pinned" && /* @__PURE__ */ e("p", { className: "hf-happen__pin", children: "Pinned by HR" }),
            /* @__PURE__ */ e("p", { className: "hf-happen__text", children: p.text }),
            p.sub && /* @__PURE__ */ e("p", { className: "hf-happen__sub", children: p.sub })
          ] }) }),
          p.when && /* @__PURE__ */ e("span", { className: "hf-happen__when", children: p.when })
        ] }),
        _ && !!((w = p.people) != null && w.length) && /* @__PURE__ */ i("ul", { className: "hf-happen__people", children: [
          (h ? p.people : p.people.slice(0, Ue)).map((x) => /* @__PURE__ */ i("li", { children: [
            /* @__PURE__ */ e(ae, { name: x.name, size: 28 }),
            /* @__PURE__ */ i("span", { className: "hf-happen__pname", children: [
              /* @__PURE__ */ e("b", { className: "hf-truncate", children: Pt(x.name) }),
              (x.role || x.where) && /* @__PURE__ */ e("span", { className: "hf-truncate", children: [x.role, x.where].filter(Boolean).join(" · ") })
            ] }),
            x.on && /* @__PURE__ */ e("span", { className: "hf-happen__when", children: x.on })
          ] }, x.name)),
          !h && p.people.length > Ue && /* @__PURE__ */ e("li", { children: /* @__PURE__ */ i("button", { type: "button", className: "hf-link hf-happen__more", onClick: () => f(!0), children: [
            "and ",
            p.people.length - Ue,
            " more"
          ] }) })
        ] }),
        p.kind === "kudos" && s && /* @__PURE__ */ i("div", { className: "hf-happen__reacts", children: [
          /* @__PURE__ */ i("button", { type: "button", className: `hf-react2${(G = p.mine) != null && G.like ? " is-on" : ""}`, "aria-pressed": !!((E = p.mine) != null && E.like), onClick: () => s(p.id, "like"), children: [
            /* @__PURE__ */ e(St, { size: 14 }),
            " ",
            p.likes ?? 0
          ] }),
          /* @__PURE__ */ i("button", { type: "button", className: `hf-react2${(L = p.mine) != null && L.clap ? " is-on" : ""}`, "aria-pressed": !!((U = p.mine) != null && U.clap), onClick: () => s(p.id, "clap"), children: [
            /* @__PURE__ */ e(me, { size: 14 }),
            " ",
            p.claps ?? 0
          ] })
        ] })
      ] }, p.id);
    }) }),
    (n || u.length > a) && /* @__PURE__ */ i("div", { className: "hf-happen__foot", children: [
      n && /* @__PURE__ */ i("button", { type: "button", className: "hf-kudos-pill", onClick: n, children: [
        /* @__PURE__ */ e(me, { size: 15 }),
        " Give kudos"
      ] }),
      u.length > a && /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", style: { marginLeft: "auto" }, onClick: () => r((p) => !p), children: l ? "Show less" : `See all ${u.length}` })
    ] })
  ] });
}
function Mi({ tone: t = "brand", icon: a, title: n, sub: s, hint: l, dot: r, action: o, onClick: c, dark: h }) {
  const f = /* @__PURE__ */ i(I, { children: [
    /* @__PURE__ */ i("span", { className: "hf-mini__top", children: [
      /* @__PURE__ */ e("span", { className: "hf-mini__ic", "aria-hidden": "true", children: a }),
      r && /* @__PURE__ */ e("span", { className: `hf-mini__dot hf-mini__dot--${r}`, "aria-hidden": "true" }),
      l && /* @__PURE__ */ e(ie, { align: "left", text: l })
    ] }),
    /* @__PURE__ */ i("span", { children: [
      /* @__PURE__ */ e("span", { className: "hf-display hf-mini__t", children: n }),
      s && /* @__PURE__ */ e("span", { className: "hf-mini__s", children: s }),
      o && (o.href ? /* @__PURE__ */ e("a", { className: "hf-mini__a", href: o.href, children: o.label }) : /* @__PURE__ */ e("button", { type: "button", className: "hf-mini__a", onClick: (m) => {
        var u;
        m.stopPropagation(), (u = o.onClick) == null || u.call(o);
      }, children: o.label }))
    ] })
  ] }), d = q("hf hf-mini hf-press", h ? "hf-mini--dark" : he(t));
  return c ? /* @__PURE__ */ e("button", { type: "button", className: d, onClick: c, children: f }) : /* @__PURE__ */ e("section", { className: d, children: f });
}
function zi({ members: t, total: a }) {
  if (!t.length) return null;
  const n = a ?? t.length;
  return /* @__PURE__ */ i("section", { className: "hf hf-card hf-team", "aria-label": "Your team", "data-tour": "team", children: [
    /* @__PURE__ */ i("h3", { className: "hf-cap hf-team__head", children: [
      "Your team ",
      /* @__PURE__ */ i("span", { children: [
        n,
        " ",
        n === 1 ? "person" : "people"
      ] })
    ] }),
    /* @__PURE__ */ e("ul", { className: "hf-team__list", children: t.map((s) => {
      const l = /* @__PURE__ */ i(I, { children: [
        /* @__PURE__ */ e(ae, { name: s.name, size: 36 }),
        /* @__PURE__ */ i("span", { className: "hf-team__txt", children: [
          /* @__PURE__ */ e("span", { className: "hf-team__name hf-truncate", title: s.name, children: s.name }),
          (s.note || s.sub) && /* @__PURE__ */ e("span", { className: `hf-team__sub hf-truncate${s.note ? " is-note" : ""}`, children: s.note || s.sub })
        ] }),
        s.onOpen && /* @__PURE__ */ e(J, { size: 16, className: "hf-team__chev", "aria-hidden": "true" })
      ] });
      return /* @__PURE__ */ e("li", { children: s.onOpen ? /* @__PURE__ */ e("button", { type: "button", className: "hf-team__row", onClick: s.onOpen, children: l }) : /* @__PURE__ */ e("div", { className: "hf-team__row", children: l }) }, s.name);
    }) })
  ] });
}
const rn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function on(t, a = /* @__PURE__ */ new Date()) {
  const n = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(t ?? ""));
  if (!n) return "";
  const s = `${Number(n[3])} ${rn[Number(n[2]) - 1]}`;
  return Number(n[1]) === a.getFullYear() ? s : `${s} ${n[1]}`;
}
const Ee = (t) => `${t} item${t === 1 ? "" : "s"}`, cn = (t) => t > 0 ? `Holding ${Ee(t)}` : "Nothing held";
function qt(t, a, n = /* @__PURE__ */ new Date()) {
  if (!(t > 0)) return null;
  const s = on(a, n);
  return `${t} to account for${s ? ` since ${s}` : ""}`;
}
function hn(t) {
  const a = t.map((s) => s.hours).filter((s) => s > 0);
  return `To account for: taken more than ${a.length ? Math.min(...a) : 24} hours ago and not yet marked used or returned.`;
}
function dn(t, a = /* @__PURE__ */ new Date()) {
  const n = qt(t.unaccounted, t.since, a);
  return n ? `${Ee(t.holding)}, ${n}` : Ee(t.holding);
}
function Li(t, a) {
  const n = `${t === 1 ? "Item" : "Items"} in hand`;
  return a > 0 ? `${n} · ${a} to account for` : n;
}
function Bi(t) {
  return t ? t.state === "down" ? !0 : t.state === "ok" && t.holding > 0 : !1;
}
function fn(t, a) {
  if (!a) return { single: null, perUnit: !1 };
  const n = t.map((s) => s.href).filter((s) => !!s);
  return n.length ? t.length > 1 ? { single: null, perUnit: !0 } : { single: n[0], perUnit: !1 } : { single: null, perUnit: !1 };
}
function pn({ stock: t, self: a = !1, onRetry: n, today: s = /* @__PURE__ */ new Date() }) {
  const l = /* @__PURE__ */ e("h3", { className: "hf-cap", children: "Stock in hand" });
  if (t.state === "loading")
    return /* @__PURE__ */ i("section", { className: "hf hf-card hf-stock", "aria-label": "Stock in hand", "aria-busy": "true", children: [
      l,
      /* @__PURE__ */ e("span", { className: "hf-stock__sk", style: { width: "60%" } }),
      /* @__PURE__ */ e("span", { className: "hf-stock__sk", style: { width: "40%" } })
    ] });
  if (t.state === "down")
    return /* @__PURE__ */ i("section", { className: "hf hf-card hf-stock", "aria-label": "Stock in hand", children: [
      l,
      /* @__PURE__ */ e("p", { className: "hf-stock__note", role: "status", children: "Inventory did not answer just now." }),
      n && /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--secondary hf-stock__retry", onClick: n, children: "Try again" })
    ] });
  if (t.holding <= 0)
    return /* @__PURE__ */ i("section", { className: "hf hf-card hf-stock", "aria-label": "Stock in hand", children: [
      l,
      /* @__PURE__ */ e("p", { className: "hf-stock__row", children: /* @__PURE__ */ i("span", { className: "hf-status hf-status--plain", children: [
        /* @__PURE__ */ e(ne, { size: 12, "aria-hidden": "true" }),
        "Nothing held"
      ] }) })
    ] });
  const r = qt(t.unaccounted, t.since, s), o = fn(t.units, a);
  return /* @__PURE__ */ i("section", { className: "hf hf-card hf-stock", "aria-label": "Stock in hand", children: [
    l,
    /* @__PURE__ */ e("p", { className: "hf-stock__lead", children: cn(t.holding) }),
    r && /* @__PURE__ */ i(I, { children: [
      /* @__PURE__ */ e("p", { className: "hf-stock__row", children: /* @__PURE__ */ i("span", { className: "hf-status hf-status--warn", children: [
        /* @__PURE__ */ e(qe, { size: 12, "aria-hidden": "true" }),
        r
      ] }) }),
      /* @__PURE__ */ e("p", { className: "hf-stock__note", children: hn(t.units) })
    ] }),
    t.units.length > 1 && /* @__PURE__ */ e("ul", { className: "hf-stock__units", children: t.units.map((c) => /* @__PURE__ */ i("li", { className: "hf-stock__unit", children: [
      /* @__PURE__ */ i("span", { className: "hf-stock__txt", children: [
        /* @__PURE__ */ e("span", { className: "hf-stock__name", children: c.unit }),
        /* @__PURE__ */ e("span", { className: "hf-stock__sub", children: dn(c, s) })
      ] }),
      o.perUnit && c.href && /* @__PURE__ */ i("a", { className: "hf-stock__link", href: c.href, children: [
        "With me",
        /* @__PURE__ */ e(ze, { size: 14, "aria-hidden": "true" }),
        /* @__PURE__ */ i("span", { className: "hf-sr", children: [
          " in Inventory, ",
          c.unit
        ] })
      ] })
    ] }, c.unit)) }),
    o.single && /* @__PURE__ */ i("a", { className: q("hf-stock__link"), href: o.single, children: [
      "Open “With me” in Inventory",
      /* @__PURE__ */ e(ze, { size: 14, "aria-hidden": "true" })
    ] }),
    !a && /* @__PURE__ */ e("p", { className: "hf-stock__note", children: "Counts only. What the items are stays in Inventory, where managers see their team." })
  ] });
}
const un = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function Ie(t) {
  const a = /^(\d{4})-(\d{2})-(\d{2})/.exec(t ?? "");
  return a ? `${Number(a[3])} ${un[Number(a[2]) - 1]} ${a[1]}` : t ?? "";
}
function An(t) {
  if (t == null || t < 0) return "";
  if (t === 0) return "New this month";
  const a = Math.floor(t / 12), n = t % 12, s = (l, r) => l ? `${l} ${r}${l === 1 ? "" : "s"}` : "";
  return [s(a, "year"), s(n, "month")].filter(Boolean).join(" ");
}
function mn(t) {
  const a = [`${t.headcount} ${t.headcount === 1 ? "person" : "people"}`];
  return t.joined && a.push(`${t.joined} new`), t.probation && a.push(`${t.probation} on probation`), t.leaving && a.push(`${t.leaving} leaving`), a.join(" · ");
}
function _n(t) {
  return t.waiting ? t.overdue ? `${t.waiting} waiting · ${t.overdue} overdue` : `${t.waiting} waiting` : "Nothing waiting";
}
function gn(t) {
  const a = [], n = (l) => {
    const r = t.filter(l.test).length;
    r > 0 && r < t.length && a.push(l);
  };
  n({ key: "probation", label: "On probation", test: (l) => !!l.probation }), n({ key: "new", label: "New this month", test: (l) => l.joined });
  const s = [...new Set(t.map((l) => (l.designation ?? "").trim()).filter(Boolean))].sort((l, r) => l.localeCompare(r));
  if (s.length > 1 && s.length <= 8) for (const l of s) n({ key: `role:${l}`, label: l, test: (r) => (r.designation ?? "").trim() === l });
  return a;
}
function Rt({ crumbs: t, current: a, onCrumb: n }) {
  const s = a === void 0 ? t.length - 1 : t.length;
  return /* @__PURE__ */ e("nav", { className: "hf-crumbs", "aria-label": "Where you are", children: /* @__PURE__ */ i("ol", { children: [
    t.map((l, r) => /* @__PURE__ */ i("li", { children: [
      r < s ? /* @__PURE__ */ e("button", { type: "button", className: "hf-crumbs__up", onClick: () => n(l), children: l.name }) : /* @__PURE__ */ e("span", { "aria-current": "page", children: l.name }),
      (r < t.length - 1 || a !== void 0) && /* @__PURE__ */ e(J, { size: 14, "aria-hidden": "true", className: "hf-crumbs__sep" })
    ] }, `${l.level}-${l.name}`)),
    a !== void 0 && /* @__PURE__ */ e("li", { children: /* @__PURE__ */ e("span", { "aria-current": "page", children: a }) })
  ] }) });
}
function bn({ glance: t }) {
  const a = [
    /* @__PURE__ */ e(we, { tone: "brand", icon: /* @__PURE__ */ e(Aa, { size: 18 }), value: t.headcount, label: t.headcount === 1 ? "person" : "people" }, "people"),
    t.joined > 0 && /* @__PURE__ */ e(we, { tone: "sky", icon: /* @__PURE__ */ e(Ce, { size: 18 }), value: t.joined, label: "joined this month" }, "joined"),
    !!t.probation && /* @__PURE__ */ e(we, { tone: "pop", icon: /* @__PURE__ */ e(Ye, { size: 18 }), value: t.probation, label: "on probation", hint: "People still in their probation period, as Performance Hub had it this morning." }, "probation"),
    t.leaving > 0 && /* @__PURE__ */ e(we, { tone: "coral", icon: /* @__PURE__ */ e(ma, { size: 18 }), value: t.leaving, label: "leaving", hint: "People with a last working day set, who are still here." }, "leaving")
  ].filter(Boolean);
  return /* @__PURE__ */ i("div", { className: "hf-glance-wrap", children: [
    /* @__PURE__ */ e("div", { className: "hf-glance", role: "group", "aria-label": "People at a glance", style: { "--n": a.length }, children: a }),
    t.probation === null && /* @__PURE__ */ e("p", { className: "hf-unit-month__none", children: "On probation: not known today." })
  ] });
}
function Yt({ month: t, title: a = "Waiting this month", footnote: n }) {
  return t ? /* @__PURE__ */ i("section", { className: "hf hf-card hf-unit-month", "aria-label": a, children: [
    /* @__PURE__ */ i("h3", { className: "hf-cap hf-unit-month__head", children: [
      a,
      " ",
      /* @__PURE__ */ i("span", { children: [
        "as of ",
        Ie(t.day)
      ] })
    ] }),
    /* @__PURE__ */ e("ul", { children: t.apps.map((s) => /* @__PURE__ */ i("li", { children: [
      /* @__PURE__ */ e(ye, { app: s.app, size: 32 }),
      /* @__PURE__ */ e("span", { className: "hf-unit-month__app", children: s.label }),
      /* @__PURE__ */ e("span", { className: "hf-unit-month__n hf-num", children: s.waiting ? `${s.waiting} waiting` : _n(s) }),
      s.overdue > 0 && /* @__PURE__ */ i("span", { className: "hf-status hf-status--warn", children: [
        /* @__PURE__ */ e(Tt, { size: 12, "aria-hidden": "true" }),
        s.overdue,
        " overdue"
      ] })
    ] }, s.app)) }),
    t.unknown.length > 0 && /* @__PURE__ */ i("p", { className: "hf-unit-month__none", children: [
      t.unknown.join(", "),
      " did not answer this morning: not known today."
    ] }),
    n && /* @__PURE__ */ e("p", { className: "hf-unit-month__foot", children: n })
  ] }) : /* @__PURE__ */ i("section", { className: "hf hf-card hf-unit-month", "aria-label": a, children: [
    /* @__PURE__ */ e("h3", { className: "hf-cap", children: a }),
    /* @__PURE__ */ e("p", { className: "hf-unit-month__none", children: "The first count is taken tomorrow morning." })
  ] });
}
function Si({ crumbs: t, onCrumb: a, title: n, note: s, glance: l, month: r, units: o, people: c, onOpenUnit: h, onOpenPerson: f, feed: d, direction: m = "down" }) {
  const u = _e(() => gn(c ?? []), [c]), [y, k] = M(null), p = u.find((g) => g.key === y), A = c ? c.filter((g) => !p || p.test(g)) : [], _ = o ? o.length && o[0].level === "department" ? "Departments" : "Facilities" : "People";
  return /* @__PURE__ */ i("div", { className: q("hf hf-unitpage", `hf-slide--${m}`), children: [
    /* @__PURE__ */ e(Rt, { crumbs: t, onCrumb: a }),
    /* @__PURE__ */ i("header", { className: "hf-unitpage__head", children: [
      /* @__PURE__ */ e("h1", { className: "hf-display hf-unitpage__title", children: n }),
      s && /* @__PURE__ */ e("p", { className: "hf-unitpage__note", children: s })
    ] }),
    c && u.length > 0 && /* @__PURE__ */ i("div", { className: "hf-chips", role: "group", "aria-label": "Filter people", children: [
      /* @__PURE__ */ e("button", { type: "button", className: q("hf-chip", !p && "is-on"), "aria-pressed": !p, onClick: () => k(null), children: "Everyone" }),
      u.map((g) => /* @__PURE__ */ e(
        "button",
        {
          type: "button",
          className: q("hf-chip", (p == null ? void 0 : p.key) === g.key && "is-on"),
          "aria-pressed": (p == null ? void 0 : p.key) === g.key,
          onClick: () => k((p == null ? void 0 : p.key) === g.key ? null : g.key),
          children: g.label
        },
        g.key
      ))
    ] }),
    /* @__PURE__ */ e(bn, { glance: l }),
    /* @__PURE__ */ i("div", { className: "hf-unitpage__cols", children: [
      /* @__PURE__ */ i("section", { className: "hf-unitpage__kids", "aria-label": _, children: [
        /* @__PURE__ */ i("h2", { className: "hf-cap", children: [
          _,
          c && p ? ` · ${A.length} of ${c.length}` : ""
        ] }),
        o && /* @__PURE__ */ e("ul", { className: "hf-kids", children: o.map((g) => /* @__PURE__ */ e("li", { children: /* @__PURE__ */ i("button", { type: "button", className: "hf hf-card hf-kid hf-press", onClick: () => h == null ? void 0 : h(g), children: [
          /* @__PURE__ */ i("span", { className: "hf-kid__txt", children: [
            /* @__PURE__ */ e("span", { className: "hf-kid__name", children: g.name }),
            g.brand && /* @__PURE__ */ e("span", { className: "hf-kid__brand", children: g.brand }),
            /* @__PURE__ */ e("span", { className: "hf-kid__line", children: mn(g.glance) })
          ] }),
          /* @__PURE__ */ e(J, { size: 18, "aria-hidden": "true", className: "hf-kid__chev" })
        ] }) }, `${g.entity}-${g.department ?? ""}`)) }),
        c && /* @__PURE__ */ e("ul", { className: "hf-kids hf-kids--people", children: A.map((g) => {
          const B = /* @__PURE__ */ i(I, { children: [
            /* @__PURE__ */ e(ae, { name: g.name, size: 40 }),
            /* @__PURE__ */ i("span", { className: "hf-kid__txt", children: [
              /* @__PURE__ */ e("span", { className: "hf-kid__name hf-truncate", children: g.name }),
              g.designation && /* @__PURE__ */ e("span", { className: "hf-kid__line hf-truncate", children: g.designation }),
              (g.probation || g.joined) && /* @__PURE__ */ i("span", { className: "hf-kid__chips", children: [
                g.joined && /* @__PURE__ */ i("span", { className: "hf-status hf-status--ok", children: [
                  /* @__PURE__ */ e(Ce, { size: 12, "aria-hidden": "true" }),
                  "New"
                ] }),
                g.probation && /* @__PURE__ */ i("span", { className: q("hf-status", g.probation === "Extended" ? "hf-status--warn" : "hf-status--plain"), children: [
                  /* @__PURE__ */ e(Ye, { size: 12, "aria-hidden": "true" }),
                  g.probation
                ] })
              ] })
            ] }),
            g.code && f && /* @__PURE__ */ e(J, { size: 18, "aria-hidden": "true", className: "hf-kid__chev" })
          ] });
          return /* @__PURE__ */ e("li", { children: g.code && f ? /* @__PURE__ */ e("button", { type: "button", className: "hf hf-card hf-kid hf-press", onClick: () => f(g), children: B }) : /* @__PURE__ */ e("div", { className: "hf hf-card hf-kid", children: B }) }, g.code ?? g.name);
        }) })
      ] }),
      /* @__PURE__ */ i("aside", { className: "hf-unitpage__side", children: [
        /* @__PURE__ */ e(Yt, { month: r }),
        d
      ] })
    ] })
  ] });
}
function Ci({ crumbs: t, onCrumb: a, self: n, person: s, line: l, onOpenPerson: r, probation: o, waiting: c, direction: h = "down", stock: f, onStockRetry: d }) {
  const m = An(s.tenure_months), u = [s.department, s.entity].filter(Boolean).join(" · ");
  return /* @__PURE__ */ i("div", { className: q("hf hf-unitpage hf-person", `hf-slide--${h}`), children: [
    t.length > 0 && /* @__PURE__ */ e(Rt, { crumbs: t, current: s.name, onCrumb: a }),
    /* @__PURE__ */ i("section", { className: "hf hf-card hf-person__head", children: [
      /* @__PURE__ */ e(ae, { name: s.name, size: 64 }),
      /* @__PURE__ */ i("div", { className: "hf-person__txt", children: [
        /* @__PURE__ */ e("h1", { className: "hf-display hf-unitpage__title", children: n ? "Your page" : s.name }),
        s.designation && /* @__PURE__ */ e("p", { className: "hf-person__job", children: s.designation }),
        u && /* @__PURE__ */ e("p", { className: "hf-person__where", children: u }),
        s.start_date && /* @__PURE__ */ i("p", { className: "hf-person__where", children: [
          "Joined ",
          Ie(s.start_date),
          m ? ` · ${m}` : ""
        ] })
      ] })
    ] }),
    /* @__PURE__ */ i("div", { className: "hf-unitpage__cols", children: [
      /* @__PURE__ */ i("div", { className: "hf-unitpage__kids", children: [
        (!o.known || o.stage) && /* @__PURE__ */ i("section", { className: "hf hf-card hf-person__probation", "aria-label": "Probation", children: [
          /* @__PURE__ */ e("h3", { className: "hf-cap", children: "Probation" }),
          o.known ? /* @__PURE__ */ i(I, { children: [
            /* @__PURE__ */ i("p", { className: "hf-person__stage", children: [
              /* @__PURE__ */ i("span", { className: q("hf-status", o.stage === "Extended" ? "hf-status--warn" : "hf-status--plain"), children: [
                /* @__PURE__ */ e(Ye, { size: 12, "aria-hidden": "true" }),
                o.stage
              ] }),
              o.month_no && o.of_months ? /* @__PURE__ */ i("span", { className: "hf-num", children: [
                "Month ",
                o.month_no,
                " of ",
                o.of_months
              ] }) : null
            ] }),
            o.month_no && o.of_months ? /* @__PURE__ */ e("span", { className: "hf-month-pips", role: "img", "aria-label": `Month ${o.month_no} of ${o.of_months}`, children: Array.from({ length: o.of_months }, (y, k) => /* @__PURE__ */ e("span", { className: q("hf-month-pip", k < o.month_no && "is-on") }, k)) }) : null,
            o.end_date && /* @__PURE__ */ i("p", { className: "hf-person__where", children: [
              "Ends ",
              Ie(o.end_date)
            ] })
          ] }) : /* @__PURE__ */ e("p", { className: "hf-unit-month__none", children: "Not known today: Performance Hub did not answer this morning." })
        ] }),
        f && /* @__PURE__ */ e(pn, { stock: f, self: !!n, onRetry: d }),
        l.length > 0 && /* @__PURE__ */ i("section", { className: "hf hf-card hf-team", "aria-label": "Reporting line", children: [
          /* @__PURE__ */ e("h3", { className: "hf-cap hf-team__head", children: "Reporting line" }),
          /* @__PURE__ */ e("ul", { className: "hf-team__list", children: l.map((y) => {
            const k = /* @__PURE__ */ i(I, { children: [
              /* @__PURE__ */ e(ae, { name: y.name, size: 36 }),
              /* @__PURE__ */ i("span", { className: "hf-team__txt", children: [
                /* @__PURE__ */ e("span", { className: "hf-team__name hf-truncate", children: y.name }),
                y.designation && /* @__PURE__ */ e("span", { className: "hf-team__sub hf-truncate", children: y.designation })
              ] }),
              y.code && r && /* @__PURE__ */ e(J, { size: 16, className: "hf-team__chev", "aria-hidden": "true" })
            ] });
            return /* @__PURE__ */ e("li", { children: y.code && r ? /* @__PURE__ */ e("button", { type: "button", className: "hf-team__row", onClick: () => r(y.code), children: k }) : /* @__PURE__ */ e("div", { className: "hf-team__row", children: k }) }, `${y.name}-${y.code ?? ""}`);
          }) })
        ] })
      ] }),
      /* @__PURE__ */ e("aside", { className: "hf-unitpage__side", children: /* @__PURE__ */ e(
        Yt,
        {
          month: c,
          title: n ? "Waiting for you" : `Waiting for ${Pt(s.name)}`,
          footnote: "Counts only. What each one is stays in its app."
        }
      ) })
    ] })
  ] });
}
const le = "__skipped__", mt = ["", "Poor", "Below expectations", "Meets expectations", "Strong", "Excellent"], Vt = (t, a) => !!t && Object.entries(t).some(([n, s]) => s.includes(String(a[n] ?? ""))), Ge = (t, a) => !t.showWhen || Vt(t.showWhen, a), Oe = (t, a) => Ge(t, a) && (!t.optional || Vt(t.requiredWhen, a)), Je = (t) => t == null || t === "" || t === !1 || typeof t == "string" && !t.trim(), vn = (t) => !Je(t) && t !== le, Qt = (t, a) => t.fields.filter((n) => Ge(n, a) && vn(a[n.key])).length;
function yn(t, a) {
  const n = t.minAnswered;
  return !n || Qt(t, a) >= n.count ? null : `${n.word[0].toUpperCase()}${n.word.slice(1)} at least ${n.count}.`;
}
function kn(t, a) {
  return t.fields.filter((n) => Oe(n, a) && a[n.key] !== le && Je(a[n.key]));
}
function wn(t, a) {
  const n = {};
  for (const s of t) for (const l of s.fields) {
    if (!Ge(l, a)) continue;
    const r = a[l.key];
    r !== le && (Je(r) && l.type !== "check" || (n[l.key] = typeof r == "string" ? r.trim() : r ?? !1));
  }
  return n;
}
function _t(t) {
  if (!t.length) return null;
  const a = t[0], n = a.type === "scale" ? `a score for ${a.label}` : a.type === "check" ? `a tick for "${a.label}"` : `"${a.label}"`;
  return t.length === 1 ? `Still needs ${n}.` : `Still needs ${n} and ${t.length - 1} more.`;
}
function Nn({ ctx: t, first: a, open: n }) {
  var o, c, h, f, d, m;
  const [s, l] = M(n);
  return ((o = t.profile) == null ? void 0 : o.length) || t.callout || t.notes || ((c = t.history) == null ? void 0 : c.length) || ((h = t.links) == null ? void 0 : h.length) ? /* @__PURE__ */ i("section", { className: "hf-quick__ctx", "aria-label": `About ${a}`, children: [
    /* @__PURE__ */ i("button", { type: "button", className: "hf-quick__ctxtoggle", "aria-expanded": s, onClick: () => l((u) => !u), children: [
      /* @__PURE__ */ i("span", { children: [
        "About ",
        a
      ] }),
      /* @__PURE__ */ e($t, { size: 16, "aria-hidden": "true" })
    ] }),
    s && /* @__PURE__ */ i("div", { className: "hf-quick__ctxbody", children: [
      !!((f = t.profile) != null && f.length) && /* @__PURE__ */ e("dl", { className: "hf-quick__grid", children: t.profile.map((u) => /* @__PURE__ */ i("div", { children: [
        /* @__PURE__ */ e("dt", { children: u.label }),
        /* @__PURE__ */ e("dd", { children: u.value })
      ] }, u.label)) }),
      t.callout && /* @__PURE__ */ i("div", { className: "hf-quick__callout", children: [
        /* @__PURE__ */ e("p", { className: "hf-quick__ctitle", children: t.callout.title }),
        /* @__PURE__ */ e("ul", { children: t.callout.lines.map((u) => /* @__PURE__ */ e("li", { children: u }, u)) }),
        t.callout.note && /* @__PURE__ */ e("p", { className: "hf-quick__cnote", children: t.callout.note })
      ] }),
      t.notes && /* @__PURE__ */ i("div", { className: "hf-quick__notes", children: [
        /* @__PURE__ */ e("p", { className: "hf-quick__ctitle", children: t.notes.title }),
        /* @__PURE__ */ e("p", { children: t.notes.text })
      ] }),
      !!((d = t.history) != null && d.length) && /* @__PURE__ */ i("div", { children: [
        /* @__PURE__ */ e("p", { className: "hf-quick__ctitle", children: "Interview history" }),
        /* @__PURE__ */ e("ul", { className: "hf-quick__hist", children: t.history.map((u, y) => /* @__PURE__ */ i("li", { className: `is-${u.outcome ?? "open"}`, children: [
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
        ] }, `${u.title}-${y}`)) })
      ] }),
      !!((m = t.links) != null && m.length) && /* @__PURE__ */ e("div", { className: "hf-quick__links", children: t.links.map((u) => /* @__PURE__ */ i("a", { href: u.href, target: "_blank", rel: "noopener", children: [
        /* @__PURE__ */ e(We, { size: 14 }),
        " ",
        u.label,
        " ",
        /* @__PURE__ */ e(ze, { size: 12 })
      ] }, u.href)) })
    ] })
  ] }) : null;
}
function Gi({ form: t, open: a, onSave: n, onClose: s }) {
  var R, ee, re, Y;
  const [l, r] = M([]), [o, c] = M(0), [h, f] = M(0), [d, m] = M({}), [u, y] = M(!1), [k, p] = M([]), [A, _] = M(!1), [g, B] = M(null);
  H(() => {
    !a || !t || (r(t.items), c(0), f(0), m({}), y(!1), p([]), B(null));
  }, [a, t]);
  const w = l[o], G = _e(() => {
    var v;
    return (v = w == null ? void 0 : w.steps) != null && v.length ? w.steps : (t == null ? void 0 : t.steps) ?? [];
  }, [w, t]);
  if (!t || !w || !G.length) return /* @__PURE__ */ e(ve, { open: a && !!t, onClose: () => s(k), title: (t == null ? void 0 : t.title) ?? "", children: /* @__PURE__ */ e("p", { className: "hf-muted", children: "Nothing is waiting here any more." }) });
  const E = G[h], L = h === G.length - 1, U = o === l.length - 1, x = kn(E, d), P = yn(E, d), O = (v, F) => {
    m((Q) => ({ ...Q, [v]: F })), B(null);
  }, V = t.unit.toLowerCase();
  async function N() {
    if (x.length || P) {
      y(!0);
      return;
    }
    if (y(!1), !L) {
      f(h + 1);
      return;
    }
    _(!0);
    try {
      await n(w, wn(G, d));
      const v = [...k, w.id];
      if (p(v), U) {
        s(v);
        return;
      }
      c(o + 1), f(0), m({});
    } catch (v) {
      const F = v;
      if (B({ text: (F == null ? void 0 : F.message) || "That didn't save. Try again, or open it in the app.", field: F == null ? void 0 : F.field }), F != null && F.field) {
        const Q = G.findIndex((X) => X.fields.some((oe) => oe.key === F.field));
        Q >= 0 && f(Q);
      }
    } finally {
      _(!1);
    }
  }
  const W = L ? U ? "Save" : `Save and next ${V}` : "Next";
  return /* @__PURE__ */ e(ve, { open: a, onClose: () => s(k), title: t.title, children: /* @__PURE__ */ i("div", { className: "hf-quick", children: [
    /* @__PURE__ */ i("div", { className: "hf-quick__app", children: [
      /* @__PURE__ */ e(ye, { app: t.app, size: 28 }),
      /* @__PURE__ */ e("span", { children: t.appName })
    ] }),
    l.length > 1 && /* @__PURE__ */ i("div", { className: "hf-quick__run", "aria-label": `${t.unit} ${o + 1} of ${l.length}`, children: [
      /* @__PURE__ */ i("span", { children: [
        t.unit,
        " ",
        o + 1,
        " of ",
        l.length
      ] }),
      /* @__PURE__ */ e("span", { className: "hf-quick__dots", "aria-hidden": "true", children: l.map((v, F) => /* @__PURE__ */ e("i", { className: F < o ? "is-done" : F === o ? "is-on" : "" }, v.id)) })
    ] }),
    /* @__PURE__ */ i("div", { className: "hf-quick__who", children: [
      /* @__PURE__ */ e(ae, { name: w.name, size: 44 }),
      /* @__PURE__ */ i("div", { children: [
        /* @__PURE__ */ e("p", { className: "hf-quick__name", children: w.name }),
        w.sub && /* @__PURE__ */ e("p", { className: "hf-quick__sub", children: w.sub }),
        w.when && /* @__PURE__ */ e("p", { className: "hf-quick__sub", children: w.when }),
        !!((ee = (R = w.context) == null ? void 0 : R.chips) != null && ee.length || (re = w.facts) != null && re.length) && /* @__PURE__ */ e("div", { className: "hf-quick__facts", children: [...((Y = w.context) == null ? void 0 : Y.chips) ?? [], ...w.facts ?? []].map((v) => /* @__PURE__ */ e("span", { children: v }, v)) })
      ] })
    ] }),
    w.context && /* @__PURE__ */ e(Nn, { ctx: w.context, first: w.name.split(" ")[0], open: h === 0 }, `${w.id}-${h === 0}`),
    G.length > 1 && /* @__PURE__ */ e("ol", { className: "hf-quick__steps", children: G.map((v, F) => /* @__PURE__ */ e("li", { className: F === h ? "is-on" : F < h ? "is-done" : "", children: v.title }, v.title)) }),
    (E.legend || E.minAnswered) && /* @__PURE__ */ i("div", { className: "hf-quick__legend", children: [
      E.legend && /* @__PURE__ */ e("span", { children: E.legend }),
      E.minAnswered && /* @__PURE__ */ i("span", { className: u && P ? "is-bad" : "", children: [
        Qt(E, d),
        " of ",
        E.fields.length,
        " ",
        E.minAnswered.done ?? "answered",
        " · at least ",
        E.minAnswered.count
      ] })
    ] }),
    /* @__PURE__ */ e("div", { className: "hf-quick__fields", children: E.fields.filter((v) => Ge(v, d)).map((v) => {
      var X, oe;
      const F = u && x.includes(v) || (g == null ? void 0 : g.field) === v.key, Q = `hf-q-${v.key}`;
      return /* @__PURE__ */ i("div", { className: `hf-quick__f${F ? " is-bad" : ""}`, children: [
        v.type !== "check" && /* @__PURE__ */ i("div", { className: "hf-quick__labelrow", children: [
          /* @__PURE__ */ i("p", { className: "hf-quick__label", id: `${Q}-l`, children: [
            v.label,
            !Oe(v, d) && !v.skipLabel && /* @__PURE__ */ e("span", { children: " (optional)" })
          ] }),
          v.skipLabel && /* @__PURE__ */ e(
            "button",
            {
              type: "button",
              className: `hf-quick__skip${d[v.key] === le ? " is-on" : ""}`,
              "aria-pressed": d[v.key] === le,
              onClick: () => O(v.key, d[v.key] === le ? "" : le),
              children: v.skipLabel
            }
          )
        ] }),
        (((X = w.hints) == null ? void 0 : X[v.key]) ?? v.hint) && /* @__PURE__ */ e("p", { className: "hf-quick__hint", children: ((oe = w.hints) == null ? void 0 : oe[v.key]) ?? v.hint }),
        v.type === "scale" && d[v.key] === le && /* @__PURE__ */ i("p", { className: "hf-quick__skipped", children: [
          v.skipLabel,
          ": left out of the score."
        ] }),
        v.type === "scale" && d[v.key] !== le && /* @__PURE__ */ i(I, { children: [
          /* @__PURE__ */ e("div", { className: `hf-quick__scale${(v.max ?? 5) > 5 ? " hf-quick__scale--wide" : ""}`, role: "radiogroup", "aria-labelledby": `${Q}-l`, children: Array.from({ length: v.max ?? 5 }, (D, Te) => Te + 1).map((D) => /* @__PURE__ */ e(
            "button",
            {
              type: "button",
              role: "radio",
              "aria-checked": d[v.key] === D,
              "aria-label": (v.max ?? 5) === 5 ? `${D}, ${mt[D]}` : `${D} of ${v.max}`,
              className: d[v.key] === D ? "is-on" : "",
              onClick: () => O(v.key, d[v.key] === D && !Oe(v, d) ? "" : D),
              children: D
            },
            D
          )) }),
          (v.max ?? 5) === 5 && /* @__PURE__ */ e("p", { className: "hf-quick__word", "aria-live": "polite", children: d[v.key] ? mt[Number(d[v.key])] : "" })
        ] }),
        v.type === "choice" && /* @__PURE__ */ e("div", { className: "hf-quick__pills", role: "radiogroup", "aria-labelledby": `${Q}-l`, children: (v.options ?? []).map((D) => /* @__PURE__ */ e("button", { type: "button", role: "radio", "aria-checked": d[v.key] === D, className: d[v.key] === D ? "is-on" : "", onClick: () => O(v.key, D), children: D }, D)) }),
        v.type === "text" && /* @__PURE__ */ e(
          "textarea",
          {
            id: Q,
            "aria-labelledby": `${Q}-l`,
            rows: 3,
            value: String(d[v.key] ?? ""),
            placeholder: v.placeholder,
            onChange: (D) => O(v.key, D.target.value),
            "aria-invalid": F
          }
        ),
        v.type === "check" && /* @__PURE__ */ i("label", { className: "hf-quick__check", children: [
          /* @__PURE__ */ e("input", { type: "checkbox", checked: !!d[v.key], onChange: (D) => O(v.key, D.target.checked) }),
          " ",
          v.label
        ] }),
        F && !g && /* @__PURE__ */ e("p", { className: "hf-quick__err", role: "alert", children: v.type === "scale" ? `Pick a score from 1 to ${v.max ?? 5}.` : v.type === "text" ? "Add a line or two." : v.type === "check" ? "Tick this to go on." : "Choose one." })
      ] }, v.key);
    }) }),
    g && /* @__PURE__ */ e("p", { className: "hf-quick__err hf-quick__err--save", role: "alert", children: g.text }),
    u && (_t(x) ?? P) && /* @__PURE__ */ e("p", { className: "hf-quick__missing", role: "status", children: _t(x) ?? P }),
    /* @__PURE__ */ i("div", { className: "hf-quick__foot", children: [
      h > 0 && /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: () => f(h - 1), disabled: A, children: "Back" }),
      /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--primary", onClick: N, disabled: A, children: A ? "Saving…" : W })
    ] }),
    t.openUrl && /* @__PURE__ */ i("a", { className: "hf-quick__open", href: t.openUrl, target: "_blank", rel: "noopener", children: [
      "Open in ",
      t.appName,
      " ",
      /* @__PURE__ */ e(ze, { size: 13 })
    ] })
  ] }) });
}
function Ti({ text: t, action: a, onDone: n, ms: s = 5e3 }) {
  return H(() => {
    if (!t) return;
    const l = window.setTimeout(n, s);
    return () => window.clearTimeout(l);
  }, [t, s, n]), t ? /* @__PURE__ */ i("div", { className: "hf hf-toast", role: "status", children: [
    /* @__PURE__ */ e("span", { children: t }),
    a && /* @__PURE__ */ e("button", { type: "button", onClick: () => {
      a.onClick(), n();
    }, children: a.label })
  ] }) : null;
}
const $i = {
  performance: "data:image/webp;base64,UklGRgIFAABXRUJQVlA4WAoAAAAgAAAAVwAAVwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggFAMAAPASAJ0BKlgAWAA+USSPRSOiIZVbVKw4BQSxgGoAiR0vg1DQwsfEA6YfmA/gHSl9ADpAN5W/bP9a5q/w52UOiDX1/kBxAdzPG9pGppPkVzS+qT+03sAGPgLIYiXV9ejQwgLcUuNzMWnk1ZI1EH9d4FbWj9ICKNaQ7y0Ue6yQ0SxfKLkjK6TIaVbPETgY2K3ZahH9l87k0rsr9iLuG1P9/AAA/v3Aghu2439Qd9ndP6czgI92SKFEwS5tiwZfn9orR4ghd+3i+wDXXxj/7f/5PvVLW+mUuzj//aPeUUAG30/U1yK0a0SnsdBZuB4JTn5R7gjWKpVH5Ww+NU6SZX+jARJ7/1YH36tmJQ9Ew5MMsyGQK+JkqfKx+37xM7L4V0BYzQkz7Rwp6jCAe1RFI2xVNr+6l6Idg6slM/prv1IaHbl4URcYl5uFbt6ohiM0xvmkO6hexgDu1p+rUeVJjaZqUI7jPJa+EpretNQywg8H2OZ/dcaD1S+jDJXY1IR/sf3fXF/4avpG7HPofHtKo5Gj+vUjTha2ltklbV0BmS5UfzY/hypLTpIuf3HeqcxXidxUBNgdh/HH3MzI5upJnRIxx8iYUPuntMGforRxMnGZSg/uqMKZVo9hCTX0RMOH/06//5zhVXGFQ6zXIg/fIChXJvvfslt0E6Cyo2vW5wnQWVGidPIX8NB1jSOakUlCsg4v6I02BzXPTGZ0O/pb3oVuFblfnIPEafJLCLpY0VXxDvq9KkSrjrN+1msf9H/+fnUyFe1PiJ4cgFfUybZk0S8QFe6T57C0vBLD8+981yMVEGDvUwext8MW8D1ZJs+YuMQcO/2AV61JNOhzxsSbZ9I5514/sMVL2GfeTTYlPe+vj8j/B/d8FBOHrzp8QCereJC/VO33BQNguDqaJTgZOWOihdi0fAvBmh02qRuM69inkOEH1PU8uj1GPubjSExKXCbhuYhZf2EghBf/9kw8B/7tDja5egGGS1HvOLAx5mDdBkg+qzSIhUpc2mx0dxtH9HRyhaZBO+Yx0ibj/h7SU2lg/gAAAAAA",
  recruitment: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='s' x1='10' y1='95' x2='90' y2='5' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%231F2530'/%3E%3Cstop offset='1' stop-color='%2366738C'/%3E%3C/linearGradient%3E%3ClinearGradient id='a' x1='40' y1='62' x2='92' y2='38' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23C2441A'/%3E%3Cstop offset='1' stop-color='%23FFB772'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpolygon points='22,12 70,12 70,28 32,28 32,72 70,72 70,88 14,88 14,20' fill='url(%23s)'/%3E%3Cpolygon points='40,38 76,38 92,50 76,62 40,62' fill='url(%23a)'/%3E%3C/svg%3E",
  apml: "data:image/webp;base64,UklGRmoFAABXRUJQVlA4WAoAAAAgAAAAVwAAVwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggfAMAAPASAJ0BKlgAWAA+USiPRSOioROc/Ug4BQSgDVLTG7hwfRv+wEIB5gOhbvCv7VewB0sb74pxrQ5YGk7meeMqix9cHoS/qqXpY3x655dradJOzRa5ms/yHQwuXAKJQlY5EWIq4//Oa5tIqXEOwztiDQyE8xcj4axcbNsUKo4plJ0P7PptSSZjYTcgKbqkg2WyqrM198RH8JTzOqYGwm6fNwAA/v3Ague+W+LHH/elKq59V8aAMIr3lwXTM8h/+Ll/UftLuAnNo98V+oOrz9t17gWu8hj/dw870eqmFUQkDw4fwHABx11jSq+l/82//xYfugGX8XBAm+Wk9QnM75QRS+dIB7UV5rhoFLcHX7rJfclqN0d2iCJm+1LsxuDpj4rDL97LZJTDrBf+aUnu5ZZGYLWlcqRi4+WwQMZen1XJafOWlb9OJ+l30Ymk2TEBXkTSBK8kIgfGl04AEbXmTKHSG59Qm5h7iGuNHqaw620sjGXnclN2ReYclfZWLO9pJcIUq1ajIyqneO5OfrThtcIPmdpkrzaf0rP6QE3lmmtFZmqvQuEYi+fV/CeA3I1CXZUsV22jItfKqsGVHAuR2uhynXblcw9temOKkq165KpLk1kwgsMUyv3itFYaSmoIl7SIJYPNP2ph6xdqA0aDCllkboZNxSxOUBIHg7ky1M6wL2cTSUZg6p/p6v1dAGDPcIhYIb2SZxQqmdF9tqJLbKMMboxCBQ9q0q6/KGv2SuEX/8eo0Pnx03YBMsZ+CiZA2HfT5LD7jDcr6/S6369hQ+3s3KvjLksNJyz6QH4+giUQWxOe1GOtgbe35kUJjrIfC6IRGng5rr1g4ehimy3EyHo8CoSUMtwNWrG1pt8yAug1jDC4UOZ06CnRlwRX5SZgh2y7w2Opx3LEzUVO/Tov1gegpVKYLem/6yMP88sByGiTOpSziJW5zrW0Mwb7QgPNVBz9wERNFm3Al64zmCqOA43nLHrFT1kOq0ZKOvt/T3hxdP/nwwl9ldfnJi6YReYIyEE8JGtDdfWXDW/7IduWDzwPApwbipHMIo+miBrHrTpOeJF54DQ6XlehVGdalS9BMJyErPHbOSARbQIRh94q7XwUmEhM0hRmJ9W/hi5kmh5L9Y03UcMvUO5qx1HnvgcjJpLajuWVQ8FIsp3nsfN+SgOkvH0XtFgniSgKGoQAAAA=",
  learning: "data:image/webp;base64,UklGRmYMAABXRUJQVlA4WAoAAAAwAAAAPwAAPwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZBTFBIvQYAAA3whv2TIVnbtv0ismoO27Zt27Ztc3GOdZhz2MexcNi2bdu2vY7FWVUR8aGqenqOkx8jYgL4v2N6YPWRWomO71f+VQIkJn9z6kIqNsmTG3rvJNsNn5QashFOrUxKRjX5WtNfnawXpJxqf4J6caUxJGpABg3+RaJ96n0ox2tAokmQOrV5Nz9bvW1aLLQmid5VDn7iXfV2wXFY1ktikx95Au1OxUYTRgYQFQlpComKAMm3H3VvsrZI2dFJCBAiAOpNggARQvW408ZItEN9XyynOnycIFk5RYP/mUqI8SYFUFt+ySHqbZByxl1QIOS7bYdnIcV0SgDBiA3+yEPKSW+dOQSUAdd+K9Ez9YFYBrieTxoLQbP/6hDp50cOcwWxWXfpUu+RFsssiQKef/AcIQABqAMC4AxZdWFXUPZ960X1ngTHYRkQciapoFFMAqISafjgviEgNuHAE4IepnJbrAPw/OVPcZrTsq94UO9cO89KrpB844luSdaSlBP1QajtIpUNWbnDIRfekJV1kcaePZD6Y8/9S6IV9cOwHLD8obFSUp+6V96JS294MlkNJneNv4ElUFtsjQvVW9Birs1QIJKfjkSdFnOcTDH5kGM+U69B/bSBKQSUI+/6VL0JjsIywNPNaEmt2MRXYOPbHOfsNkKixvTJn7Y3BbFp9z+FZi1Xnz0SENmYC2g1PIVAmdFq12ETh0CKPb5+XL1GTI/FKpauIhUNoSN2P33eYvwvBiDe4OmNN/ZwBTw79sRSoqK+O9YBRP7HlYRG1ODpq85LpxxxAKmkXqTk7D2nDoFka8x5lTog5dT7IQCuF5MKSB4VLD139eD9yLqpFS2D9OlDB7oCwqAhP0uAeh8sBzz/9m6cVd/7VZIHgMnNZ2ZSUBU1m2qhZ5wLN5/dFbScd/Nz1NFi4dVRgJBzScbx2w6+5ndJ4UD4m0pV1GyKXQ946jjRH248PARIHPzU2woci2WA5x88jwvFzJ3r3Dr4e1EcQktAxWyGA7YOfgRn6MqLuILY5EeeAL7RhJ4DhJxJKgWlmGW/bR++6DMUx0Exn+uQdYnuDgkiDb+0XwiQfNsx99JxFLXW8eJnONXkNvUeu7923ttIgBiLHr40UaacqnPd3Cu5Uj3+VA7EciASXaSyBlW3Sbff/6tzXgRiub6zE2XK8ZpI3Wd2SgioLbc0+6BU9KPvcZpVwybY7Mjvdu7Ob5qJsJRRlQCMR2ed3wUQ9mbYPq6AxAIzP6YOhFAVjSJf/a2/Jl2GIk/UG0CydQgFCLmMS5ZdzhXEdMBZ4yQgUaoCSKJU3PKMWvcsK0HKrG+d56+9xrhTj6eabOW5r1WXeHqliaJUpZoMUWrd847yOUB9Zyyn9njQe0dvZwkQ+l06XExOuHH/3aaOUhItW+Tpz2suQUzKiQ9AACy/DQVOPHKyEFBbZKVh6iGfXfjYtvvOHIZKg5Hrj0NvQcRR3wfLgchGnAN4evupg10B4Yjrf5QIle8H377uIXNHqZUQy+WLCx5FkgVSTrcjAmDpIlIBztlbzOMKarNvdpE6jqTfrrpy2T6L4Eog2XvnvYIkM0D9ECwHvOOLu3Ag0s9DBoUAykEPfaIO4ZJG3HjR3J3LeIi+3vU5kswAtJhzfRQg5BRSCeBcNcealkDKafc4WwIgXNLYu8+aZVLG7fg9ksyoleiDZYB1PPMFTjW0PPHYLAQSu7/1ujrVcEndz8HIlyWVTr0Wiy2JAqifiFoNrk98tYcpiE186Ok0h6MOak6rA7EMsOxKtKTFU/ebNgQ0tvvpKfU6wAGnxVSsNn0kILLfh9Cqp0/uPtIVxLIBpwXtdzqxius5pKIFnAvWWtQVkm843l3J2pXKzfEc8Py9J3FajTT8nGNDqHae2S3RHinzPjSeSCpbwuTmiTa1BGorznOdenvUd8FywPIHRklJDyVO6JwgBIR+g//SqESTVKSYeH8EiKy7C4meeHrpjf1cQW2RlYeKV1qMisZ+WA64DiUV9Njp2nm2EFAOe/iX8QOxX71Op1GQsdOtiwKR/XANTs8jfXtdf1cQZr510lIi/2mb3yVAYpIHpywksr8DAVy7SGUbcIYsubwrwGQdEGR/OrU6BRlIBIDnr76B085IY047TgAkAhBXGkMCEKnACaSyLZjeO3pbS4BQlWgShEbLb0EL2n5Cn8lC6NXIRpxD+z2988QhlnrH9SJS0Tacs7eY17ROQppCos47Pr8Lp/2Rfhk8SGhUbxKkDk4hlb2AcfUMa/6tFcnKSRri71TW2GSP/4TRu7bhU3iFcUAAwV9L/EZUGMF/nwBWUDggsgMAADATAJ0BKkAAQAA+tUqdSyckIqGsGqwA4BaJbA21LhWIolQtGE0vDb5PfbO5YC/7h6gNsR5gPPE9C/+M9QD9kusK9ADy3P28+C392vSA0oPYj2M/2uWDwW40++tvefXvRA/YBKd9vg9BD/9PQktSkEbcOMNT9uVL+Beocvog0XzI4zDPy7i7uWXj5NvyUOjYGm+E5AUWdgqh86T0r+eTmh1UgAD++Zt//n4WP4vHvTrlJD/TnBehZOgWb13AqBVGdU0Y/TabcvDWQWzsqHD9JNtBHyaSEmxBn99VoMTAPPlei5qGjg/tunXiESVaylzHnjdrjvegfUtTkB5n1sIW2C2h4PQwygxwsKQWlwGUPDePGRv8/99JKq3hu+7EvTzp9IHmJPnPHCm/HVyBpMZGM9wDdfl9bSWaryF6+jMjppiiv0L9PWYIeYqV8uVbFw+pL8iWFovLxssge6f6I1gp5VyjvVbIeZnNB04kqqlIu+pWzCYdl9Y1bU5STFKvL+EGagnPRhARLSkzg0ebb40EwtwYqx9mDjaG8f4MioFXOsRiXsH0NwY6KP63Xu6zT4ourcpoFmn2F3/DXu+vJuZyaIycDa47wtEZdofvd7KsfKzfuXQiBoZhna7yexqHcss81aMXCu4DUStA0IPge7jwaPuFXIJyWItzR6xpYsdDVqO7QfSVGnHHordk86iITCSlFk8KPF02fVzLSVIyMvMsT+Sc2dyjnRvUGVc9pSsYXJNSfOWSVBFNhIe4HH58dblqoCDqPMdb4gr0dxxHeo541xXlJrIYP5Cf8RHYAGzG+kRn62P0diPt/IRe+dkE3jirosp177z5HO5JRSOqJVZQ1XzxqWp0J+TSW5XwQP3H3+yFru35cRkA+xUPXH1q+nP/TCZZVuvsM5W+VEf0aYgkPl6lKIdUjpqCmWj/MswDu3DJQ19AiCTTwOZiTc1ev8az+Tu2NDN7bf1saP2KAokSrZM2gE9eNIaA2QAsinUjVTJ+O5FOPnrax0RxFTXA4AHsN3GV8+4YKPvTDc4z1vs8UqqQGTKvJY7KQni+l/o3//De1Pc7m7PDOX0Iaf+7WX0GnvTTiEaO5g/lSwx7TaZ50mP9txAOc+cAuez4YUpjiioFQslNKEYUJCzF+VgxsGoXFl9tlWQpoEtVPW/eJ/OWfarqbrzaM1ihb//D9055nj7vjmZLNwahDgPf3+5UhOue42UmVPS9QOyahXzQhDTtuDp1ORjX85lUfhMfXHUIXfP4AAA=",
  logistics: "data:image/webp;base64,UklGRmoEAABXRUJQVlA4WAoAAAAgAAAAVwAAVwAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggfAIAAPANAJ0BKlgAWAA+USKPRKOsIZVbVYDABQSygGna2A9F1vBuEDubzHOermuHn0RwlXN2YDYXpPkXTScZD3KX1amRirtex3IDM0F+hi7s4wPJyZigXDPJcGBnwPYy5AnDHv6vMSTJeAF4jMjFARb6sXVKOcPP2H9IAAD+/cCARf2S9MbeF/hMv+SG9PgmY/gtrb34dRABGF9e/4jN5E/xiI41rcCbtX5gogrjDDMT9WT58IWBJu+xfFe9BPPRjh3WOZts/9S5UQDe+BUYkAxruDXttiZNucLZJdRhP4G0m0N9jB/V6HCu0s/ZfxY7macldCWFOq4GtdAkq+//Rx7jXs8J6Y6laMmd1s/4Pv/9Y5G/F4o7ACbrf1POgcZe7xYGpEtlsSqmwp3dXRe3/z//aYnLP/agr1/h7/RNNriO5DvBAISOD/Fiv/b2FBeWc1qHHp3dMztltF5d2wUTXKcX3kLMNOpoCILgGGnUT4mQAnEOAcHz0h+Xs67aYCJMn7/Ad7/TdAxRM2S+vOvv9dtvn54HFDrFD9g38DboorIlPTDjrvC+g1uZJ7/kZdzOtoe0hhqJvvZSl7Hqj/j8EfoqSIdtCfwe86yL0IDfG135qjyty7Y8FFREbLSoH6Z5HTXi48qzE1UGFAwjEBhj33y63+DjHoOF1W2sW//tfogu+c9wrMnf7wR506OmzeYn+P15B9zLyxe/WOCbj80Z7AprMDfgU+L/A4CoSZq7PdEDAcFzhZYrC1JKmMaWyMOLXln98lC3QB+1K37fFgDUtFFez4zPqL3P7PZbNWkTOxrhe1XB/av9HrgdCih2jzqFEAJiNj1F2SLZDoYAAAAAAA=="
};
function xn(t, a, n) {
  const s = t.slice();
  if (!a) return s;
  const l = a.dir === "asc" ? 1 : -1, r = (o) => o == null || o === "";
  return s.sort((o, c) => {
    const h = n(o, a.key), f = n(c, a.key);
    return r(h) && r(f) ? 0 : r(h) ? 1 : r(f) ? -1 : typeof h == "number" && typeof f == "number" ? (h - f) * l : String(h).localeCompare(String(f), void 0, { numeric: !0, sensitivity: "base" }) * l;
  });
}
function Mn(t, a) {
  return !t || t.key !== a ? { key: a, dir: "asc" } : { key: a, dir: t.dir === "asc" ? "desc" : "asc" };
}
function zn(t, a) {
  return t === "done" ? { mark: "tick", words: "done" } : t === "skipped" ? { mark: "dash", words: "not needed" } : t === "current" ? { mark: "number", words: `step ${a + 1}, where the case is now` } : { mark: "number", words: `step ${a + 1}, still to come` };
}
const Zt = {
  rated: "Rated",
  missing: "Not rated",
  skipped: "Skipped",
  future: "Still to come"
};
function Ln(t) {
  return t.map((a) => `${a.label}: ${Zt[a.state].toLowerCase()}`).join(", ");
}
function Bn(t, a) {
  const n = t.indexOf(a);
  if (n < 0) return { index: -1, line: a ? `${a}: not one of the usual stages.` : "Stage not known." };
  const s = t[n + 1];
  return { index: n, line: `Stage ${n + 1} of ${t.length}: ${a}.${s ? ` Next: ${s}.` : ""}` };
}
function Sn(t, a, n = "Item") {
  const s = a == null ? -1 : t.indexOf(a);
  return s < 0 ? { index: -1, prev: null, next: t[0] ?? null, line: t.length ? `${t.length} in the list` : "Nothing in the list" } : { index: s, prev: t[s - 1] ?? null, next: t[s + 1] ?? null, line: `${n} ${s + 1} of ${t.length}` };
}
function Di(t, a) {
  const n = t.indexOf(a);
  return n < 0 ? t[0] ?? null : t[n + 1] ?? t[n - 1] ?? null;
}
function Cn(t, a, n) {
  const s = t.indexOf(a);
  return s < 0 ? null : t[s + n] ?? null;
}
function Gn(t, a, n) {
  return !n || !n.to || n.to === n.from ? t : t - (a === n.from ? 1 : 0) + (a === n.to ? 1 : 0);
}
const ce = {
  picked: (t, a) => `Picked up ${t}, in ${a}. Use the left and right arrows to choose a stage, Space to drop, Escape to cancel.`,
  lifted: (t) => `Picked up ${t}. Drop on a stage to move them.`,
  target: (t, a) => a ? `${t}, where they are now.` : `${t}.`,
  moved: (t, a) => `${t} moved to ${a}.`,
  stays: (t, a) => `${t} stays in ${a}.`,
  notMoved: (t) => `${t} was not moved.`
};
function Pi({ variant: t = "secondary", fit: a, icon: n, busy: s, className: l, children: r, type: o = "button", ...c }) {
  const h = ["hf-btn", `hf-btn--${t}`, "hf-press", a ? "hf-btn--fit" : "", l ?? ""].filter(Boolean).join(" ");
  return /* @__PURE__ */ i("button", { type: o, className: h, "aria-busy": s || void 0, ...c, children: [
    s ? /* @__PURE__ */ e("span", { className: "hf-spin", "aria-hidden": "true" }) : n,
    r
  ] });
}
function pe(t) {
  const a = fe(), n = t ?? a;
  return { id: n, hint: `${n}-h`, error: `${n}-e` };
}
function Xe({ htmlFor: t, label: a, optional: n, hideLabel: s }) {
  return /* @__PURE__ */ i("label", { htmlFor: t, className: s ? "hf-sr" : "hf-fld__l", children: [
    a,
    n && /* @__PURE__ */ e("span", { className: "hf-fld__opt", children: " (optional)" })
  ] });
}
function ge(t, a, n) {
  return [a ? t.hint : "", n ? t.error : ""].filter(Boolean).join(" ") || void 0;
}
function Ke({ ids: t, error: a }) {
  return a ? /* @__PURE__ */ e("span", { id: t.error, className: "hf-fld__e", children: a }) : null;
}
function Fi({ label: t, hint: a, error: n, optional: s, hideLabel: l, id: r, className: o, ...c }) {
  const h = pe(r);
  return /* @__PURE__ */ i("div", { className: ["hf-fld", o ?? ""].join(" "), children: [
    /* @__PURE__ */ e(Xe, { htmlFor: h.id, label: t, optional: s, hideLabel: l }),
    a && /* @__PURE__ */ e("span", { id: h.hint, className: "hf-fld__h", children: a }),
    /* @__PURE__ */ e(
      "input",
      {
        id: h.id,
        className: n ? "hf-input hf-input--err" : "hf-input",
        "aria-invalid": n ? !0 : void 0,
        "aria-describedby": ge(h, a, n),
        ...c
      }
    ),
    /* @__PURE__ */ e(Ke, { ids: h, hint: a, error: n })
  ] });
}
function Ui({ label: t, hint: a, error: n, optional: s, hideLabel: l, id: r, className: o, rows: c = 3, maxLength: h, value: f, ...d }) {
  const m = pe(r), u = typeof f == "string" ? f.length : 0;
  return /* @__PURE__ */ i("div", { className: ["hf-fld", o ?? ""].join(" "), children: [
    /* @__PURE__ */ e(Xe, { htmlFor: m.id, label: t, optional: s, hideLabel: l }),
    a && /* @__PURE__ */ e("span", { id: m.hint, className: "hf-fld__h", children: a }),
    /* @__PURE__ */ e(
      "textarea",
      {
        id: m.id,
        rows: Math.max(3, c),
        maxLength: h,
        value: f,
        className: n ? "hf-input hf-input--area hf-input--err" : "hf-input hf-input--area",
        "aria-invalid": n ? !0 : void 0,
        "aria-describedby": ge(m, a, n),
        ...d
      }
    ),
    h ? /* @__PURE__ */ i("span", { className: "hf-fld__count", "aria-live": "polite", children: [
      u,
      " of ",
      h
    ] }) : null,
    /* @__PURE__ */ e(Ke, { ids: m, hint: a, error: n })
  ] });
}
function Wi({ label: t, hint: a, error: n, optional: s, hideLabel: l, id: r, className: o, options: c, placeholder: h, ...f }) {
  const d = pe(r);
  return /* @__PURE__ */ i("div", { className: ["hf-fld", o ?? ""].join(" "), children: [
    /* @__PURE__ */ e(Xe, { htmlFor: d.id, label: t, optional: s, hideLabel: l }),
    a && /* @__PURE__ */ e("span", { id: d.hint, className: "hf-fld__h", children: a }),
    /* @__PURE__ */ i("span", { className: "hf-select", children: [
      /* @__PURE__ */ i(
        "select",
        {
          id: d.id,
          className: n ? "hf-input hf-input--err" : "hf-input",
          "aria-invalid": n ? !0 : void 0,
          "aria-describedby": ge(d, a, n),
          ...f,
          children: [
            h !== void 0 && /* @__PURE__ */ e("option", { value: "", children: h }),
            c.map((m) => typeof m == "string" ? /* @__PURE__ */ e("option", { value: m, children: m }, m) : /* @__PURE__ */ e("option", { value: m.value, children: m.label }, m.value))
          ]
        }
      ),
      /* @__PURE__ */ e($t, { size: 18, "aria-hidden": "true" })
    ] }),
    /* @__PURE__ */ e(Ke, { ids: d, hint: a, error: n })
  ] });
}
function Ei({ label: t, sub: a, id: n, className: s, ...l }) {
  const r = fe(), o = n ?? r;
  return /* @__PURE__ */ i("label", { htmlFor: o, className: ["hf-tick", s ?? ""].join(" "), children: [
    /* @__PURE__ */ e("input", { id: o, type: "checkbox", ...l }),
    /* @__PURE__ */ e("span", { className: "hf-tick__box", "aria-hidden": "true", children: /* @__PURE__ */ e(ne, { size: 14, strokeWidth: 3 }) }),
    /* @__PURE__ */ i("span", { className: "hf-tick__t", children: [
      t,
      a && /* @__PURE__ */ e("span", { className: "hf-tick__s", children: a })
    ] })
  ] });
}
function Ii({ label: t, options: a, value: n, onChange: s, hint: l, error: r, optional: o, hideLabel: c, clearable: h, onClear: f }) {
  const d = pe();
  return /* @__PURE__ */ i("div", { className: "hf-fld", role: "group", "aria-labelledby": d.id, "aria-describedby": ge(d, l, r), children: [
    /* @__PURE__ */ i("span", { id: d.id, className: c ? "hf-sr" : "hf-fld__l", children: [
      t,
      o && /* @__PURE__ */ e("span", { className: "hf-fld__opt", children: " (optional)" })
    ] }),
    l && /* @__PURE__ */ e("span", { id: d.hint, className: "hf-fld__h", children: l }),
    /* @__PURE__ */ e("div", { className: "hf-seg hf-seg--fill", children: a.map((m) => {
      const u = typeof m == "string" ? m : m.value, y = typeof m == "string" ? m : m.label, k = n === u;
      return /* @__PURE__ */ e(
        "button",
        {
          type: "button",
          "aria-pressed": k,
          onClick: () => k && h ? f == null ? void 0 : f() : s(u),
          children: y
        },
        u
      );
    }) }),
    r && /* @__PURE__ */ e("span", { id: d.error, className: "hf-fld__e", children: r })
  ] });
}
function Oi({ label: t, options: a, value: n, onChange: s, hint: l, error: r, hideLabel: o }) {
  const c = pe();
  return /* @__PURE__ */ i("div", { className: "hf-fld", role: "radiogroup", "aria-labelledby": c.id, "aria-describedby": ge(c, l, r), children: [
    /* @__PURE__ */ e("span", { id: c.id, className: o ? "hf-sr" : "hf-fld__l", children: t }),
    l && /* @__PURE__ */ e("span", { id: c.hint, className: "hf-fld__h", children: l }),
    a.map((h) => {
      const f = n === h.value;
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
    r && /* @__PURE__ */ e("span", { id: c.error, className: "hf-fld__e", children: r })
  ] });
}
function ji({ label: t, options: a, value: n, onChange: s, onClear: l, hint: r, hideLabel: o, disabled: c }) {
  const h = pe(), f = a.find((d) => d.value === n);
  return /* @__PURE__ */ i("div", { className: "hf-fld", children: [
    /* @__PURE__ */ e("span", { id: h.id, className: o ? "hf-sr" : "hf-fld__l", children: t }),
    r && /* @__PURE__ */ e("span", { id: h.hint, className: "hf-fld__h", children: r }),
    /* @__PURE__ */ e("div", { className: "hf-marks", role: "group", "aria-labelledby": h.id, "aria-describedby": r ? h.hint : void 0, children: a.map((d) => {
      const m = n === d.value;
      return /* @__PURE__ */ i(
        "button",
        {
          type: "button",
          "aria-pressed": m,
          disabled: c,
          onClick: () => m ? l == null ? void 0 : l() : s(d.value),
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
function Hi({ label: t, value: a, onChange: n, max: s = 5, hint: l, error: r, ends: o = ["1 is lowest", `${s} is highest`], children: c }) {
  const h = pe();
  return /* @__PURE__ */ i("div", { className: "hf-fld", role: "group", "aria-labelledby": h.id, "aria-describedby": ge(h, l, r), children: [
    /* @__PURE__ */ e("span", { id: h.id, className: "hf-fld__t", children: t }),
    l && /* @__PURE__ */ e("span", { id: h.hint, className: "hf-fld__h", children: l }),
    /* @__PURE__ */ e("div", { className: "hf-score-box", children: /* @__PURE__ */ e(
      "div",
      {
        className: s > 5 ? "hf-score hf-score--wrap" : "hf-score",
        style: s > 5 ? { "--hf-score-n": s } : { gridTemplateColumns: `repeat(${s}, minmax(0, 1fr))` },
        children: Array.from({ length: s }, (f, d) => d + 1).map((f) => /* @__PURE__ */ e("button", { type: "button", "aria-pressed": a === f, "aria-label": `${f} of ${s}`, onClick: () => n(f), children: f }, f))
      }
    ) }),
    /* @__PURE__ */ i("span", { className: "hf-score__ends", "aria-hidden": "true", children: [
      /* @__PURE__ */ e("span", { children: o[0] }),
      /* @__PURE__ */ e("span", { children: o[1] })
    ] }),
    c,
    r && /* @__PURE__ */ e("span", { id: h.error, className: "hf-fld__e", children: r })
  ] });
}
function gt({ pressed: t, count: a, className: n, children: s, type: l = "button", ...r }) {
  return /* @__PURE__ */ i("button", { type: l, className: ["hf-chip", t ? "is-on" : "", n ?? ""].filter(Boolean).join(" "), "aria-pressed": t, ...r, children: [
    s,
    typeof a == "number" && /* @__PURE__ */ e("span", { className: "hf-chip__n", children: a })
  ] });
}
function Tn({ label: t, children: a }) {
  return /* @__PURE__ */ e("div", { className: "hf-chips", role: "group", "aria-label": t, children: a });
}
const $n = {
  ok: /* @__PURE__ */ e(ne, { size: 14, strokeWidth: 2.5, "aria-hidden": "true" }),
  warn: /* @__PURE__ */ e(qe, { size: 14, strokeWidth: 2.5, "aria-hidden": "true" }),
  danger: /* @__PURE__ */ e(Le, { size: 14, strokeWidth: 2.5, "aria-hidden": "true" }),
  plain: /* @__PURE__ */ e(ba, { size: 10, strokeWidth: 3, "aria-hidden": "true" })
};
function qi({ tone: t, icon: a, children: n }) {
  return /* @__PURE__ */ i("span", { className: `hf-status hf-status--${t}`, children: [
    a ?? $n[t],
    n
  ] });
}
const Dn = {
  ok: /* @__PURE__ */ e(ne, { size: 18, "aria-hidden": "true" }),
  warn: /* @__PURE__ */ e(Le, { size: 18, "aria-hidden": "true" }),
  danger: /* @__PURE__ */ e(Le, { size: 18, "aria-hidden": "true" }),
  plain: /* @__PURE__ */ e(Tt, { size: 18, "aria-hidden": "true" })
};
function Ri({ tone: t = "plain", icon: a, children: n, role: s, action: l }) {
  return /* @__PURE__ */ i("div", { className: `hf-banner hf-banner--${t}`, role: s, children: [
    a ?? Dn[t],
    /* @__PURE__ */ e("div", { className: "hf-banner__t", children: n }),
    l && /* @__PURE__ */ e("div", { className: "hf-banner__a", children: /* @__PURE__ */ e("button", { type: "button", className: "hf-btn hf-btn--quiet", onClick: l.onClick, children: l.label }) })
  ] });
}
function Pn({ title: t, sub: a, icon: n, trailing: s, below: l, href: r, onClick: o, chevron: c = !!(r || o), current: h }) {
  const f = h ? "hf-lrow is-current" : "hf-lrow", d = h ? { "aria-current": !0 } : {}, m = /* @__PURE__ */ i(I, { children: [
    n && /* @__PURE__ */ e("span", { className: "hf-lrow__ic", "aria-hidden": "true", children: n }),
    /* @__PURE__ */ i("span", { className: "hf-lrow__b", children: [
      /* @__PURE__ */ e("span", { className: "hf-lrow__t", children: t }),
      a && /* @__PURE__ */ e("span", { className: "hf-lrow__s", children: a }),
      l && /* @__PURE__ */ e("span", { className: "hf-lrow__below", children: l })
    ] }),
    (s || c) && /* @__PURE__ */ i("span", { className: "hf-lrow__e", children: [
      s,
      c && /* @__PURE__ */ e(J, { size: 20, "aria-hidden": "true" })
    ] })
  ] });
  return r ? /* @__PURE__ */ e("a", { className: f, ...d, href: r, onClick: o ? (u) => {
    u.preventDefault(), o();
  } : void 0, children: m }) : o ? /* @__PURE__ */ e("button", { type: "button", className: f, ...d, onClick: o, children: m }) : /* @__PURE__ */ e("div", { className: f, ...d, children: m });
}
function Fn({ caption: t, children: a, action: n }) {
  return /* @__PURE__ */ i("section", { className: "hf-card hf-listcard", children: [
    (t || n) && /* @__PURE__ */ i("div", { className: "hf-listcard__head", children: [
      t && /* @__PURE__ */ e("span", { className: "hf-cap", children: t }),
      n
    ] }),
    /* @__PURE__ */ e("div", { className: "hf-listcard__rows", children: a })
  ] });
}
function Yi({ caption: t, columns: a, rows: n, rowKey: s, onRowClick: l, rowHref: r, empty: o, initialSort: c = null, hideCaption: h, wide: f }) {
  const [d, m] = M(c), u = _e(() => xn(n, d, (A, _) => {
    var g, B;
    return (B = (g = a.find((w) => w.key === _)) == null ? void 0 : g.sortValue) == null ? void 0 : B.call(g, A);
  }), [n, d, a]), y = a.map((A) => A.width ?? "minmax(0, 1fr)").join(" "), k = (A, _) => A.render ? A.render(_) : _[A.key], p = (A) => A == null || A === "" || A === !1;
  return /* @__PURE__ */ i("div", { className: f ? "hf-table hf-table--wide" : "hf-table", role: "table", "aria-label": t, children: [
    !h && /* @__PURE__ */ e("div", { className: "hf-table__cap hf-cap", children: t }),
    u.length > 0 && /* @__PURE__ */ e("div", { className: "hf-table__head", role: "row", style: { gridTemplateColumns: y }, children: a.map((A) => {
      const _ = (d == null ? void 0 : d.key) === A.key, g = _ ? d.dir === "asc" ? "ascending" : "descending" : "none";
      return /* @__PURE__ */ e(
        "span",
        {
          role: "columnheader",
          "aria-sort": A.sortValue ? g : void 0,
          className: A.align === "end" ? "hf-table__th is-end" : "hf-table__th",
          children: A.sortValue ? /* @__PURE__ */ i("button", { type: "button", onClick: () => m(Mn(d, A.key)), children: [
            A.label,
            _ ? d.dir === "asc" ? /* @__PURE__ */ e(_a, { size: 14, "aria-hidden": "true" }) : /* @__PURE__ */ e(ga, { size: 14, "aria-hidden": "true" }) : null
          ] }) : A.label
        },
        A.key
      );
    }) }),
    u.length === 0 && o && /* @__PURE__ */ e("div", { className: "hf-table__empty", children: o }),
    u.map((A) => {
      const _ = a.map((B) => {
        const w = k(B, A);
        return /* @__PURE__ */ e(
          "span",
          {
            role: "cell",
            "data-label": B.label,
            className: ["hf-table__td", B.lead ? "is-lead" : "", B.align === "end" ? "is-end" : "", p(w) ? "is-blank" : ""].filter(Boolean).join(" "),
            children: w
          },
          B.key
        );
      }), g = r == null ? void 0 : r(A);
      return g ? /* @__PURE__ */ e(
        "a",
        {
          role: "row",
          className: "hf-table__tr is-link",
          style: { gridTemplateColumns: y },
          href: g,
          onClick: l ? (B) => {
            B.preventDefault(), l(A);
          } : void 0,
          children: _
        },
        s(A)
      ) : l ? /* @__PURE__ */ e(
        "button",
        {
          type: "button",
          role: "row",
          className: "hf-table__tr is-link",
          style: { gridTemplateColumns: y },
          onClick: () => l(A),
          children: _
        },
        s(A)
      ) : /* @__PURE__ */ e("div", { role: "row", className: "hf-table__tr", style: { gridTemplateColumns: y }, children: _ }, s(A));
    })
  ] });
}
function Un({ lines: t = 3, height: a = 16, block: n }) {
  return n ? /* @__PURE__ */ e("span", { className: "hf-skel", style: { height: n }, "aria-hidden": "true" }) : /* @__PURE__ */ e("span", { className: "hf-skel-lines", "aria-hidden": "true", children: Array.from({ length: t }, (s, l) => /* @__PURE__ */ e("span", { className: "hf-skel", style: { height: a, width: l === t - 1 && t > 1 ? "60%" : "100%" } }, l)) });
}
function Vi({ label: t = "Loading", children: a }) {
  return /* @__PURE__ */ i("div", { className: "hf-loading", role: "status", "aria-live": "polite", children: [
    /* @__PURE__ */ e("span", { className: "hf-sr", children: t }),
    a ?? /* @__PURE__ */ e(Un, { lines: 3 })
  ] });
}
const Wn = 320, En = 6, bt = 72;
function In() {
  const t = "(max-width: 1023px)", [a, n] = M(() => {
    var s;
    return typeof window < "u" && !!((s = window.matchMedia) != null && s.call(window, t).matches);
  });
  return H(() => {
    var r;
    const s = (r = window.matchMedia) == null ? void 0 : r.call(window, t);
    if (!s) return;
    const l = () => n(s.matches);
    return l(), s.addEventListener("change", l), () => s.removeEventListener("change", l);
  }, []), a;
}
function vt({ c: t }) {
  return /* @__PURE__ */ i(I, { children: [
    /* @__PURE__ */ i("span", { className: "hf-lanecard__top", children: [
      t.icon && /* @__PURE__ */ e("span", { className: "hf-lanecard__ic", "aria-hidden": "true", children: t.icon }),
      /* @__PURE__ */ e("span", { className: "hf-lanecard__t", children: t.title }),
      t.extra
    ] }),
    t.sub && /* @__PURE__ */ e("span", { className: "hf-lanecard__s", children: t.sub }),
    t.chips && /* @__PURE__ */ e("span", { className: "hf-lanecard__chips", children: t.chips })
  ] });
}
function Qi(t) {
  const { label: a, lanes: n, items: s, laneOf: l, itemKey: r, itemName: o, card: c, onOpen: h, onMove: f, leading: d, empty: m, initialLane: u } = t, y = In(), k = n.map((b) => b.key), p = (b) => {
    var z;
    return ((z = n.find((S) => S.key === b)) == null ? void 0 : z.label) ?? b;
  }, A = (b) => s.filter((z) => l(z) === b), _ = (b) => s.find((z) => r(z) === b) ?? null, g = k.find((b) => A(b).length) ?? k[0], [B, w] = M(u ?? g ?? ""), [G, E] = M(null), [L, U] = M({ x: 0, y: 0 }), [x, P] = M(null), [O, V] = M(null), [N, W] = M(""), R = j(null), ee = j({}), re = j({}), Y = j(null), v = j(null), F = j(null), Q = j(0), X = j(null), oe = j(!1), D = !!f, Te = Me((b, z) => {
    let S = null, C = 1 / 0;
    for (const T of k) {
      const Z = ee.current[T];
      if (!Z) continue;
      const $ = Z.getBoundingClientRect();
      if (z < $.top - 40 || z > $.bottom + 40) continue;
      if (b >= $.left && b <= $.right) return T;
      const K = Math.abs(b - ($.left + $.width / 2));
      K < C && (C = K, S = T);
    }
    return S;
  }, [k.join("|")]), tt = (b, z, S) => {
    const C = { id: b.id, from: b.from, w: b.rect.width, h: b.rect.height, offX: z - b.rect.left, offY: S - b.rect.top };
    if (v.current = C, F.current = b.from, E(C), U({ x: z, y: S }), V(b.from), P(null), b.touch && navigator.vibrate)
      try {
        navigator.vibrate(12);
      } catch {
      }
    const T = _(b.id);
    W(T ? ce.lifted(o(T)) : "");
  }, $e = (b) => {
    const z = v.current, S = F.current;
    if (v.current = null, F.current = null, Q.current = 0, X.current && cancelAnimationFrame(X.current), X.current = null, E(null), V(null), !z) return;
    oe.current = !0, setTimeout(() => {
      oe.current = !1;
    }, 0);
    const C = _(z.id);
    C && (b && S && S !== z.from && f ? (f(C, S), W(ce.moved(o(C), p(S)))) : W(ce.notMoved(o(C))));
  };
  H(() => {
    if (y || !D) return;
    const b = ($) => {
      var st;
      const K = Y.current;
      if (K && !v.current) {
        const lt = Math.hypot($.clientX - K.x, $.clientY - K.y);
        if (K.touch) {
          lt > 8 && (K.timer && clearTimeout(K.timer), Y.current = null);
          return;
        }
        lt >= En && (Y.current = null, tt(K, $.clientX, $.clientY));
        return;
      }
      if (!v.current) return;
      U({ x: $.clientX, y: $.clientY });
      const ue = Te($.clientX, $.clientY);
      ue !== F.current && (F.current = ue, V(ue));
      const te = (st = R.current) == null ? void 0 : st.getBoundingClientRect();
      Q.current = te ? $.clientX < te.left + bt ? -1 : $.clientX > te.right - bt ? 1 : 0 : 0;
    }, z = () => {
      Y.current && (Y.current.timer && clearTimeout(Y.current.timer), Y.current = null);
    }, S = () => {
      z(), v.current && $e(!0);
    }, C = () => {
      z(), v.current && $e(!1);
    }, T = ($) => {
      v.current && $.preventDefault();
    }, Z = ($) => {
      $.key === "Escape" && v.current && $e(!1);
    };
    return window.addEventListener("pointermove", b), window.addEventListener("pointerup", S), window.addEventListener("pointercancel", C), window.addEventListener("touchmove", T, { passive: !1 }), window.addEventListener("keydown", Z), () => {
      window.removeEventListener("pointermove", b), window.removeEventListener("pointerup", S), window.removeEventListener("pointercancel", C), window.removeEventListener("touchmove", T), window.removeEventListener("keydown", Z);
    };
  }), H(() => {
    if (!G) return;
    const b = () => {
      Q.current && R.current && (R.current.scrollLeft += Q.current * 14), X.current = requestAnimationFrame(b);
    };
    return X.current = requestAnimationFrame(b), () => {
      X.current && cancelAnimationFrame(X.current);
    };
  }, [G]);
  const ea = (b, z, S) => {
    if (!D || b.button !== void 0 && b.button !== 0) return;
    const C = b.pointerType === "touch" || b.pointerType === "pen", T = { id: z, from: S, rect: b.currentTarget.getBoundingClientRect(), x: b.clientX, y: b.clientY, touch: C, timer: null };
    C && (T.timer = setTimeout(() => {
      Y.current === T && (Y.current = null, tt(T, T.x, T.y));
    }, Wn)), Y.current = T;
  }, at = (b) => {
    if (!x) return;
    const { from: z, to: S } = x;
    P(null), V(null), S !== z && f ? (f(b, S), W(ce.moved(o(b), p(S)))) : W(ce.stays(o(b), p(z)));
    const C = r(b);
    setTimeout(() => {
      var T;
      return (T = re.current[C]) == null ? void 0 : T.focus({ preventScroll: !0 });
    }, 0);
  }, ta = (b, z, S) => {
    var Z;
    const C = r(z), T = x && x.id === C;
    if (!T && b.key === "Enter") {
      b.preventDefault(), h(z);
      return;
    }
    if (b.key === " " && D) {
      b.preventDefault(), T ? at(z) : (P({ id: C, from: S, to: S }), V(S), W(ce.picked(o(z), p(S))));
      return;
    }
    if (!(!T || !x)) {
      if (b.key === "Enter") {
        b.preventDefault(), at(z);
        return;
      }
      if (b.key === "Escape") {
        b.preventDefault(), P(null), V(null), W(ce.stays(o(z), p(x.from)));
        return;
      }
      if (b.key === "ArrowLeft" || b.key === "ArrowRight") {
        b.preventDefault();
        const $ = Cn(k, x.to, b.key === "ArrowRight" ? 1 : -1);
        if (!$) return;
        P({ ...x, to: $ }), V($), (Z = ee.current[$]) == null || Z.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" }), W(ce.target(p($), $ === x.from));
      }
    }
  }, aa = (b) => {
    const z = R.current, S = b === (d == null ? void 0 : d.key) ? z == null ? void 0 : z.firstElementChild : ee.current[b];
    z && S && z.scrollTo({ left: Math.max(0, S.offsetLeft - z.offsetLeft - 8), behavior: "smooth" });
  }, se = G ? { id: G.id, from: G.from, to: O } : x ? { id: x.id, from: x.from, to: x.to } : null, ke = se ? _(se.id) : null, nt = /* @__PURE__ */ e("div", { className: "hf-sr", role: "status", "aria-live": "polite", children: N }), it = (b, z, S) => /* @__PURE__ */ i(Tn, { label: S, children: [
    d && /* @__PURE__ */ e(gt, { pressed: z(d.key), count: d.count, onClick: () => b(d.key), children: d.label }),
    n.map((C) => /* @__PURE__ */ e(gt, { pressed: z(C.key), count: A(C.key).length, onClick: () => b(C.key), children: C.label ?? C.key }, C.key))
  ] });
  if (y) {
    const b = !!d && B === d.key, z = b ? [] : A(B);
    return /* @__PURE__ */ i("div", { className: "hf-lanes hf-lanes--one", "aria-label": a, role: "region", children: [
      it(w, (S) => S === B, "Stage"),
      b ? d.render(!0) : z.length ? /* @__PURE__ */ e(Fn, { caption: `${p(B)}, ${z.length}`, children: z.map((S) => {
        const C = c(S);
        return /* @__PURE__ */ e(Pn, { icon: C.icon, title: C.title, sub: C.sub, below: C.chips, onClick: () => h(S) }, r(S));
      }) }) : /* @__PURE__ */ e(Ma, { children: m ? m(p(B)) : `Nobody in ${p(B)}.` }),
      nt
    ] });
  }
  return /* @__PURE__ */ i("div", { className: "hf-lanes", role: "region", "aria-label": a, children: [
    it(aa, () => !1, "Jump to a stage"),
    /* @__PURE__ */ i("div", { ref: R, className: "hf-lanes__track", children: [
      d && d.render(!1),
      n.map((b) => {
        const z = A(b.key), S = !!se && se.to === b.key && se.to !== se.from, C = Gn(z.length, b.key, se && { from: se.from, to: se.to });
        return /* @__PURE__ */ i(
          "section",
          {
            ref: (T) => {
              ee.current[b.key] = T;
            },
            className: S ? "hf-lane is-over" : "hf-lane",
            "aria-label": `${b.label ?? b.key}, ${C} ${C === 1 ? "person" : "people"}`,
            children: [
              /* @__PURE__ */ i("div", { className: "hf-lane__h", children: [
                /* @__PURE__ */ e("span", { children: b.label ?? b.key }),
                /* @__PURE__ */ e("span", { className: "hf-lane__n", children: C })
              ] }),
              /* @__PURE__ */ i("div", { className: "hf-lane__b", children: [
                S && ke && /* @__PURE__ */ i("div", { className: "hf-lane__drop", "aria-hidden": "true", style: G ? { height: Math.min(G.h, 120) } : void 0, children: [
                  "Drop to move ",
                  o(ke).split(" ")[0],
                  " to ",
                  b.label ?? b.key
                ] }),
                z.map((T) => {
                  const Z = r(T), $ = c(T), K = (G == null ? void 0 : G.id) === Z, ue = (x == null ? void 0 : x.id) === Z;
                  return /* @__PURE__ */ e(
                    "div",
                    {
                      ref: (te) => {
                        re.current[Z] = te;
                      },
                      role: "button",
                      tabIndex: 0,
                      className: ["hf-lanecard", K ? "is-lifted" : "", ue ? "is-held" : "", D ? "is-movable" : ""].filter(Boolean).join(" "),
                      "aria-roledescription": D ? "movable card" : void 0,
                      "aria-pressed": D ? ue : void 0,
                      "aria-label": `${o(T)}, in ${b.label ?? b.key}.${D ? " Enter to open, Space to move." : " Enter to open."}`,
                      onPointerDown: (te) => ea(te, Z, b.key),
                      onKeyDown: (te) => ta(te, T, b.key),
                      onClick: () => {
                        !oe.current && !G && h(T);
                      },
                      onContextMenu: (te) => {
                        (Y.current || G) && te.preventDefault();
                      },
                      children: /* @__PURE__ */ e(vt, { c: $ })
                    },
                    Z
                  );
                }),
                !z.length && !S && /* @__PURE__ */ e("p", { className: "hf-lane__empty", children: m ? m(b.label ?? b.key) : "Nobody here." })
              ] })
            ]
          },
          b.key
        );
      })
    ] }),
    D && /* @__PURE__ */ e("p", { className: "hf-lanes__how", children: "Drag a card to another stage, or press and hold it on a touch screen. With the keyboard: Space to pick it up, the arrows to choose, Space to drop." }),
    G && ke && wa(
      /* @__PURE__ */ e(
        "div",
        {
          className: "hf-lanecard is-ghost",
          "aria-hidden": "true",
          style: { width: G.w, transform: `translate(${L.x - G.offX}px, ${L.y - G.offY}px) rotate(1.5deg) scale(1.03)` },
          children: /* @__PURE__ */ e(vt, { c: c(ke) })
        }
      ),
      document.body
    ),
    nt
  ] });
}
const Jt = {
  rated: /* @__PURE__ */ e(ne, { size: 14, strokeWidth: 2.5 }),
  missing: /* @__PURE__ */ e("span", { className: "hf-month__bang", children: "!" }),
  skipped: /* @__PURE__ */ e(He, { size: 14, strokeWidth: 2.5 }),
  future: /* @__PURE__ */ e("span", { className: "hf-month__dot" })
};
function Zi({ months: t, label: a = "Monthly ratings" }) {
  return /* @__PURE__ */ e("div", { className: "hf-months", role: "img", "aria-label": `${a}. ${Ln(t)}`, style: { gridTemplateColumns: `repeat(${Math.max(1, t.length)}, minmax(0, 1fr))` }, children: t.map((n, s) => /* @__PURE__ */ i("span", { className: `hf-month hf-month--${n.state}`, "aria-hidden": "true", children: [
    /* @__PURE__ */ e("span", { className: "hf-month__l", children: n.label }),
    Jt[n.state]
  ] }, s)) });
}
function Ji({ hint: t }) {
  return /* @__PURE__ */ i("div", { className: "hf-monthkey", children: [
    ["rated", "missing", "skipped", "future"].map((n) => /* @__PURE__ */ i("span", { className: `hf-monthkey__i hf-monthkey__i--${n}`, children: [
      Jt[n],
      Zt[n]
    ] }, n)),
    t && /* @__PURE__ */ e(ie, { label: "About the month strip", text: t })
  ] });
}
function Xi({ stages: t, current: a, label: n = "Stage" }) {
  const { index: s, line: l } = Bn(t, a);
  return /* @__PURE__ */ i("div", { className: "hf-stagebar", children: [
    /* @__PURE__ */ e("span", { className: "hf-stagebar__bar", role: "img", "aria-label": `${n}. ${l}`, children: t.map((r, o) => /* @__PURE__ */ e("span", { className: o <= s ? "hf-stagebar__seg hf-stagebar__seg--on" : "hf-stagebar__seg" }, r)) }),
    /* @__PURE__ */ e("span", { className: "hf-stagebar__line", "aria-hidden": "true", children: l })
  ] });
}
function Ki({ steps: t, selected: a, onSelect: n, label: s }) {
  return /* @__PURE__ */ e("ol", { className: "hf-steps", "aria-label": s, children: t.map((l, r) => {
    const o = zn(l.state, r), c = /* @__PURE__ */ i(I, { children: [
      /* @__PURE__ */ i("span", { className: "hf-step__rail", "aria-hidden": "true", children: [
        /* @__PURE__ */ e("span", { className: "hf-step__dot", children: o.mark === "tick" ? /* @__PURE__ */ e(ne, { size: 16, strokeWidth: 3 }) : o.mark === "dash" ? /* @__PURE__ */ e(He, { size: 16, strokeWidth: 3 }) : r + 1 }),
        r < t.length - 1 && /* @__PURE__ */ e("span", { className: "hf-step__line" })
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
    return /* @__PURE__ */ e("li", { "aria-current": l.state === "current" ? "step" : void 0, children: n ? /* @__PURE__ */ e("button", { type: "button", className: `hf-step hf-step--${l.state}`, "aria-pressed": a === l.key, onClick: () => n(l.key), children: c }) : /* @__PURE__ */ e("div", { className: `hf-step hf-step--${l.state}`, children: c }) }, l.key);
  }) });
}
function es({ items: t, label: a }) {
  return /* @__PURE__ */ e("ol", { className: "hf-tl", "aria-label": a, children: t.map((n) => /* @__PURE__ */ i("li", { className: "hf-tl__i", children: [
    /* @__PURE__ */ e("span", { className: "hf-tl__d", children: n.date }),
    /* @__PURE__ */ i("span", { className: "hf-tl__b", children: [
      /* @__PURE__ */ e("span", { className: "hf-tl__t", children: n.title }),
      n.sub && /* @__PURE__ */ e("span", { className: "hf-tl__s", children: n.sub }),
      n.extra
    ] })
  ] }, n.key)) });
}
function ts({ docs: t, onAdd: a, addLabel: n = "Add a document", accept: s, empty: l = "No documents yet.", busy: r }) {
  return /* @__PURE__ */ i("div", { className: "hf-docs", children: [
    t.length === 0 && /* @__PURE__ */ e("p", { className: "hf-muted hf-docs__empty", children: l }),
    t.map((o) => o.href ? /* @__PURE__ */ i("span", { className: "hf-doc__row", children: [
      /* @__PURE__ */ i("a", { className: "hf-doc", href: o.href, target: "_blank", rel: "noreferrer", children: [
        /* @__PURE__ */ e(We, { size: 18, "aria-hidden": "true" }),
        /* @__PURE__ */ e("span", { className: "hf-doc__n", children: o.name }),
        o.meta && /* @__PURE__ */ e("span", { className: "hf-doc__m", children: o.meta })
      ] }),
      o.end
    ] }, o.key) : /* @__PURE__ */ i("span", { className: "hf-doc__row", children: [
      /* @__PURE__ */ i("span", { className: "hf-doc", children: [
        /* @__PURE__ */ e(We, { size: 18, "aria-hidden": "true" }),
        /* @__PURE__ */ e("span", { className: "hf-doc__n", children: o.name }),
        o.meta && /* @__PURE__ */ e("span", { className: "hf-doc__m", children: o.meta })
      ] }),
      o.end
    ] }, o.key)),
    a && /* @__PURE__ */ i("label", { className: "hf-btn hf-btn--quiet hf-docs__add", "aria-busy": r || void 0, children: [
      /* @__PURE__ */ e(va, { size: 18, "aria-hidden": "true" }),
      r ? "Adding…" : n,
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
function as({ list: t, children: a, keys: n, current: s, onOpen: l, word: r = "Item", listLabel: o }) {
  const [c, h] = M(!1);
  H(() => {
    h(!1);
  }, [s]);
  const { prev: f, next: d, line: m } = Sn(n, s, r);
  return /* @__PURE__ */ i("div", { className: c ? "hf-split is-listing" : "hf-split", children: [
    /* @__PURE__ */ e("section", { className: "hf-split__list", "aria-label": o, children: t }),
    /* @__PURE__ */ i("div", { className: "hf-split__doc", children: [
      /* @__PURE__ */ i("div", { className: "hf-split__bar", children: [
        /* @__PURE__ */ i("button", { type: "button", className: "hf-btn hf-btn--secondary hf-press hf-btn--fit", disabled: !f, onClick: () => f && l(f), children: [
          /* @__PURE__ */ e(ya, { size: 18, "aria-hidden": "true" }),
          "Previous"
        ] }),
        /* @__PURE__ */ e("span", { className: "hf-split__pos", "aria-live": "polite", children: m }),
        /* @__PURE__ */ i("button", { type: "button", className: "hf-btn hf-btn--secondary hf-press hf-btn--fit", disabled: !d, onClick: () => d && l(d), children: [
          "Next",
          /* @__PURE__ */ e(J, { size: 18, "aria-hidden": "true" })
        ] })
      ] }),
      /* @__PURE__ */ i("button", { type: "button", className: "hf-btn hf-btn--quiet hf-press hf-btn--fit hf-split__toggle", "aria-expanded": c, onClick: () => h((u) => !u), children: [
        /* @__PURE__ */ e(ka, { size: 18, "aria-hidden": "true" }),
        c ? "Back to this one" : `The list, ${n.length}`
      ] }),
      /* @__PURE__ */ e("div", { className: "hf-split__open", children: a })
    ] })
  ] });
}
const Xt = "https://hifive-id-portal.pages.dev/legal/", et = {
  owner: "HiFive Holdings LLC",
  terms: "Terms of Use",
  privacy: "Privacy",
  disclaimer: "Disclaimer",
  copyright: "Copyright",
  newTab: "(opens in a new tab)",
  label: "Legal"
};
function On(t = Xt, a = {}) {
  const n = { ...et, ...a }, s = t.endsWith("/") ? t : `${t}/`;
  return ["terms", "privacy", "disclaimer", "copyright"].map((l) => ({ key: l, label: n[l], href: `${s}${l}` }));
}
function jn(t = (/* @__PURE__ */ new Date()).getFullYear(), a = {}) {
  return `© ${t} ${a.owner ?? et.owner}`;
}
function Kt({ base: t = Xt, year: a, words: n, lang: s, className: l }) {
  const r = { ...et, ...n };
  return /* @__PURE__ */ i("nav", { className: l ? `hf hf-legal ${l}` : "hf hf-legal", "aria-label": r.label, lang: s, children: [
    /* @__PURE__ */ e("span", { children: jn(a, r) }),
    On(t, r).map((o) => /* @__PURE__ */ i(sa, { children: [
      /* @__PURE__ */ e("span", { className: "hf-legal__dot", "aria-hidden": "true", children: "·" }),
      /* @__PURE__ */ i("a", { href: o.href, target: "_blank", rel: "noopener noreferrer", children: [
        o.label,
        /* @__PURE__ */ i("span", { className: "hf-sr", children: [
          " ",
          r.newTab
        ] })
      ] })
    ] }, o.key))
  ] });
}
const Hn = {
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
function qn(t, a) {
  const n = { ...Hn, ...a ?? {} }, s = (l) => l.split("{app}").join(t);
  return { ...n, title: s(n.title), about: s(n.about), ticks: (n.ticks ?? []).map(s) };
}
function Rn(t) {
  return `repeat(${Math.max(1, Math.floor(t))}, minmax(min-content, 1fr))`;
}
function ns(t) {
  const a = qn(t.short, t.words);
  return /* @__PURE__ */ e("div", { className: "hf-signin", children: /* @__PURE__ */ i("div", { className: "hf-signin__grid", children: [
    /* @__PURE__ */ i("section", { className: "hf-signin__band", "aria-label": a.about, children: [
      /* @__PURE__ */ e("span", { className: "hf-signin__ring", "aria-hidden": "true" }),
      /* @__PURE__ */ i("div", { className: "hf-signin__brand", children: [
        /* @__PURE__ */ e("span", { className: "hf-signin__logo", children: /* @__PURE__ */ e(Qe, { app: t.app, size: 64 }) }),
        /* @__PURE__ */ e("p", { className: "hf-signin__app", lang: t.lang, children: t.name })
      ] }),
      /* @__PURE__ */ e("p", { className: "hf-signin__lede", lang: t.lang, children: t.lede }),
      /* @__PURE__ */ i("div", { className: "hf-signin__one", lang: t.lang, children: [
        /* @__PURE__ */ e("h2", { children: a.oneTitle }),
        /* @__PURE__ */ e("ul", { children: a.ticks.map((n) => /* @__PURE__ */ i("li", { children: [
          /* @__PURE__ */ e("span", { className: "hf-signin__tick", "aria-hidden": "true", children: /* @__PURE__ */ e(ne, { size: 14, strokeWidth: 2.5 }) }),
          n
        ] }, n)) })
      ] })
    ] }),
    /* @__PURE__ */ i("div", { className: "hf-signin__side", children: [
      /* @__PURE__ */ i("section", { className: "hf-signin__card", "aria-labelledby": "hf-signin-h", lang: t.lang, children: [
        /* @__PURE__ */ i("div", { className: "hf-signin__top", children: [
          /* @__PURE__ */ i("div", { children: [
            /* @__PURE__ */ e("h1", { className: "hf-signin__h1", id: "hf-signin-h", children: a.title }),
            /* @__PURE__ */ e("p", { className: "hf-signin__sub", children: a.sub })
          ] }),
          t.languages && t.languages.length > 1 && /* @__PURE__ */ e("div", { className: "hf-signin__seg", role: "group", "aria-label": a.language, children: t.languages.map((n) => /* @__PURE__ */ e("button", { type: "button", lang: n.lang, "aria-pressed": t.language === n.value, onClick: () => {
            var s;
            return (s = t.onLanguage) == null ? void 0 : s.call(t, n.value);
          }, children: n.label }, n.value)) })
        ] }),
        t.error && /* @__PURE__ */ i("div", { className: "hf-signin__err", role: "alert", children: [
          /* @__PURE__ */ e(Le, { size: 20, "aria-hidden": "true" }),
          /* @__PURE__ */ e("span", { children: t.error })
        ] }),
        /* @__PURE__ */ i("button", { type: "button", className: "hf-signin__go", onClick: t.onContinue, disabled: t.busy, "aria-busy": t.busy || void 0, children: [
          /* @__PURE__ */ e(Lt, { size: 20, "aria-hidden": "true" }),
          t.busy ? a.busy : a.button
        ] }),
        /* @__PURE__ */ e("p", { className: "hf-signin__hint", children: a.hint }),
        t.note && /* @__PURE__ */ e("p", { className: "hf-signin__note", children: t.note })
      ] }),
      t.help && /* @__PURE__ */ e("footer", { className: "hf-signin__foot", children: t.help }),
      t.legal === void 0 ? /* @__PURE__ */ e(Kt, {}) : t.legal || null
    ] })
  ] }) });
}
function is({ items: t, more: a, label: n = "Main", className: s }) {
  const l = a ? [...t, { key: "more", ...a }] : [...t];
  return /* @__PURE__ */ i(I, { children: [
    /* @__PURE__ */ e("div", { className: "hf-tabbar__space", "aria-hidden": "true" }),
    /* @__PURE__ */ e("nav", { className: s ? `hf-tabbar ${s}` : "hf-tabbar", "aria-label": n, style: { gridTemplateColumns: Rn(l.length) }, children: l.map((r) => {
      const o = /* @__PURE__ */ i(I, { children: [
        /* @__PURE__ */ e("span", { className: "hf-tabbar__ic", "aria-hidden": "true", children: r.icon }),
        /* @__PURE__ */ e("span", { className: "hf-tabbar__t", children: r.label })
      ] }), c = { className: r.current ? "hf-tabbar__item is-on" : "hf-tabbar__item", "aria-current": r.current ? "page" : void 0, ...r.attrs ?? {} };
      return r.href ? /* @__PURE__ */ e("a", { href: r.href, onClick: r.onClick, ...c, children: o }, r.key) : /* @__PURE__ */ e("button", { type: "button", onClick: r.onClick, ...c, children: o }, r.key);
    }) })
  ] });
}
function ss({ label: t = "Main", brand: a, head: n, groups: s, foot: l }) {
  return /* @__PURE__ */ i("aside", { className: "hf-side", "aria-label": t, children: [
    a && /* @__PURE__ */ e("div", { className: "hf-side__brand", children: a }),
    n,
    /* @__PURE__ */ e("nav", { className: "hf-side__nav", children: s.map((r) => /* @__PURE__ */ i("div", { className: "hf-side__group", children: [
      r.label && /* @__PURE__ */ e("span", { className: "hf-side__cap", children: r.label }),
      r.items.map((o) => {
        const c = /* @__PURE__ */ i(I, { children: [
          o.icon && /* @__PURE__ */ e("span", { className: "hf-side__ic", "aria-hidden": "true", children: o.icon }),
          /* @__PURE__ */ e("span", { className: "hf-side__t", children: o.label })
        ] }), h = { className: o.current ? "hf-side__item is-on" : "hf-side__item", "aria-current": o.current ? "page" : void 0, ...o.attrs ?? {} };
        return o.href ? /* @__PURE__ */ e("a", { href: o.href, onClick: o.onClick, ...h, children: c }, o.key) : /* @__PURE__ */ e("button", { type: "button", onClick: o.onClick, ...h, children: c }, o.key);
      })
    ] }, r.key)) }),
    l && /* @__PURE__ */ e("div", { className: "hf-side__foot", children: l })
  ] });
}
function ls({ side: t, top: a, tabs: n, legal: s, children: l }) {
  return /* @__PURE__ */ i("div", { className: t ? "hf-frame has-side" : "hf-frame", children: [
    /* @__PURE__ */ i("div", { className: "hf-frame__panel", children: [
      t,
      /* @__PURE__ */ i("div", { className: "hf-frame__main", children: [
        a,
        /* @__PURE__ */ e("main", { className: "hf-frame__body", children: l }),
        s === void 0 ? /* @__PURE__ */ e(Kt, {}) : s || null
      ] })
    ] }),
    n && /* @__PURE__ */ e("div", { className: "hf-frame__tabs", children: n })
  ] });
}
export {
  $a as APP_FAMILY,
  oi as APP_ICON_THEMES,
  $i as APP_LOGOS,
  ls as AppFrame,
  Qe as AppLogo,
  ci as AppLogoTile,
  ye as AppMark,
  _i as Appearance,
  Ai as AppsDock,
  mi as AppsGrid,
  ae as Avatar,
  ii as BalanceTile,
  Ri as Banner,
  yi as BentoGrid,
  Rt as Breadcrumb,
  Pi as Button,
  ui as Celebration,
  Ei as Checkbox,
  gt as Chip,
  Tn as ChipGroup,
  Oi as ChoiceCards,
  Yi as DataTable,
  ts as DocumentList,
  li as Feed,
  rt as FeedCard,
  Ga as FeedQuiet,
  vi as FirstLoginTour,
  hi as GiveKudosButton,
  di as GiveKudosSheet,
  bn as GlanceStrip,
  ti as Greeting,
  ki as GreetingBand,
  xi as HappeningCard,
  pi as HealthDot,
  ie as Hint,
  Kn as KeyValues,
  Xt as LEGAL_BASE,
  et as LEGAL_WORDS,
  Kt as LegalLinks,
  Fn as ListCard,
  Pn as ListRow,
  Vi as Loading,
  Zt as MONTH_WORDS,
  ce as MOVE_WORDS,
  ji as MarkGroup,
  Mi as MiniTile,
  Ji as MonthKey,
  Zi as MonthStrip,
  bi as NewJoinerCard,
  Ci as PersonPage,
  Jn as Picker,
  ai as ProfileCard,
  Xn as QuantityField,
  Gi as QuickSheet,
  Ma as Quiet,
  mt as SCALE_WORDS,
  Hn as SIGN_IN_WORDS,
  Ra as SKINS,
  le as SKIPPED,
  dt as SWATCHES,
  Hi as ScoreGroup,
  ni as ScoreRing,
  gi as SearchPill,
  Ii as Segmented,
  Wi as Select,
  ve as Sheet,
  ss as SideMenu,
  ns as SignIn,
  Un as Skeleton,
  as as SplitView,
  Xi as StageBar,
  Qi as StageLanes,
  qi as StatusChip,
  fi as StatusRows,
  Ki as Stepper,
  pn as StockCard,
  Za as TOUR_LABELS,
  Qa as TOUR_STEPS,
  is as TabBar,
  zi as TeamCard,
  Ui as TextArea,
  Fi as TextField,
  we as Tile,
  si as TileStrip,
  es as Timeline,
  Ti as Toast,
  Si as UnitPage,
  ei as UnitSwitch,
  wi as WaitingCard,
  Yt as WaitingCounts,
  Ni as WaitingQuiet,
  Qt as answeredCount,
  wn as answersFor,
  Ot as appIconKey,
  Ea as appIconSrc,
  Wa as appIconSvg,
  Va as applyPrefs,
  an as arrange,
  Ba as bandFor,
  Ze as columnsFor,
  jn as copyrightLine,
  Ya as currentPrefs,
  Ie as dayWords,
  La as factorTotal,
  Pt as firstName,
  mn as glanceLine,
  za as initials,
  Oe as isRequired,
  Ge as isShown,
  Gn as laneCount,
  Cn as laneStep,
  On as legalLinks,
  ri as logoSvg,
  Na as matchOptions,
  Ta as matchPeople,
  kn as missingFields,
  _t as missingLine,
  Ln as monthLine,
  Mn as nextSort,
  gn as peopleFilters,
  Bi as showStockTile,
  qn as signInWords,
  Xa as sortBlocks,
  xn as sortRows,
  Ka as spansFor,
  Di as splitAfter,
  Sn as splitStep,
  Bn as stageLine,
  zn as stepMark,
  yn as stepProblem,
  xa as stepQuantity,
  qt as stockChip,
  on as stockDay,
  cn as stockLead,
  Li as stockTileLabel,
  hn as stockWhy,
  Rn as tabColumns,
  An as tenureWords,
  Dt as timeGreeting,
  dn as unitLine,
  nn as useLayout,
  ja as useSkin,
  _n as waitingLine
};
//# sourceMappingURL=hifive-ui.js.map
