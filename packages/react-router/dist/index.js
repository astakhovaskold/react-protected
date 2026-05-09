import { createGuard as u } from "@react-protected/core";
function l(n, o) {
  u(o);
  const r = (s) => s.map(({ access: i, roles: c, permissions: d, meta: f, children: e, index: t, ...a }) => t === !0 ? {
    ...a,
    index: !0
  } : {
    ...a,
    ...t === !1 ? { index: !1 } : {},
    // TODO: обернуть element в GuardWrapper который вызывает guard.check()
    // и делает <Navigate> если нужен редирект
    children: e ? r(e) : void 0
  });
  return r(n);
}
const p = () => null;
export {
  p as GuardProvider,
  l as createGuardedRouter
};
