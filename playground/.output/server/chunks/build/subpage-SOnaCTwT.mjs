import { _ as __nuxt_component_0 } from './nuxt-link-BBhqU4Fr.mjs';
import { u as useNuxtApp } from './server.mjs';
import { unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrIncludeBooleanAttr, ssrRenderComponent } from 'vue/server-renderer';
import 'node:http';
import 'node:https';
import '../runtime.mjs';
import 'node:fs';
import 'node:path';
import 'node:url';
import 'node:fs/promises';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'devalue';
import '@unhead/ssr';
import 'unhead';
import '@unhead/shared';
import 'vue-router';

const _sfc_main = {
  __name: "subpage",
  __ssrInlineRender: true,
  setup(__props) {
    const { $getLocale, $switchLocale, $getLocales, $localeRoute, $t, $tc, $defineI18nRoute } = useNuxtApp();
    $defineI18nRoute({
      locales: {
        en: { greeting: "Hello", farewell: "Goodbye" },
        ru: { greeting: "\u041F\u0440\u0438\u0432\u0435\u0442", farewell: "\u0414\u043E \u0441\u0432\u0438\u0434\u0430\u043D\u0438\u044F" },
        de: { greeting: "Hallo", farewell: "Auf Wiedersehen" }
      },
      localeRoutes: {
        ru: "/localesubpage"
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(_attrs)}><p>${ssrInterpolate(unref($t)("key2.key2.key2.key2.key2"))}</p><p>Current Locale: ${ssrInterpolate(unref($getLocale)())}</p><div>page translate: ${ssrInterpolate(unref($t)("greeting"))}</div><hr><div>${ssrInterpolate(unref($t)("welcome", { username: "Alice", unreadCount: 5 }))}</div><div>${ssrInterpolate(unref($tc)("apples", 10))}</div><section><header><h1>${ssrInterpolate(unref($t)("mainHeader"))}</h1><nav><ul><li><a href="#">${ssrInterpolate(unref($t)("nav.home"))}</a></li><li><a href="#">${ssrInterpolate(unref($t)("nav.about"))}</a></li><li><a href="#">${ssrInterpolate(unref($t)("nav.services"))}</a></li><li><a href="#">${ssrInterpolate(unref($t)("nav.contact"))}</a></li></ul></nav></header><article><section><h2>${ssrInterpolate(unref($t)("section1.header"))}</h2><p>${ssrInterpolate(unref($t)("section1.intro"))}</p><div><h3>${ssrInterpolate(unref($t)("section1.subsection1.header"))}</h3><p>${ssrInterpolate(unref($t)("section1.subsection1.content"))}</p></div><div><h3>${ssrInterpolate(unref($t)("section1.subsection2.header"))}</h3><ul><li>${ssrInterpolate(unref($t)("section1.subsection2.item1"))}</li><li>${ssrInterpolate(unref($t)("section1.subsection2.item2"))}</li><li>${ssrInterpolate(unref($t)("section1.subsection2.item3"))}</li></ul></div></section><section><h2>${ssrInterpolate(unref($t)("section2.header"))}</h2><p>${ssrInterpolate(unref($t)("section2.intro"))}</p><div><h3>${ssrInterpolate(unref($t)("section2.subsection1.header"))}</h3><p>${ssrInterpolate(unref($t)("section2.subsection1.content"))}</p></div><div><h3>${ssrInterpolate(unref($t)("section2.subsection2.header"))}</h3><ol><li>${ssrInterpolate(unref($t)("section2.subsection2.step1"))}</li><li>${ssrInterpolate(unref($t)("section2.subsection2.step2"))}</li><li>${ssrInterpolate(unref($t)("section2.subsection2.step3"))}</li></ol></div><div><h3>${ssrInterpolate(unref($t)("section2.subsection3.header"))}</h3><blockquote>${ssrInterpolate(unref($t)("section2.subsection3.quote"))}</blockquote></div></section><section><h2>${ssrInterpolate(unref($t)("section3.header"))}</h2><p>${ssrInterpolate(unref($t)("section3.intro"))}</p><div><h3>${ssrInterpolate(unref($t)("section3.subsection1.header"))}</h3><p>${ssrInterpolate(unref($t)("section3.subsection1.content"))}</p></div><div><h3>${ssrInterpolate(unref($t)("section3.subsection2.header"))}</h3><p>${ssrInterpolate(unref($t)("section3.subsection2.content"))}</p></div><div><h3>${ssrInterpolate(unref($t)("section3.subsection3.header"))}</h3><ul><li>${ssrInterpolate(unref($t)("section3.subsection3.item1"))}</li><li>${ssrInterpolate(unref($t)("section3.subsection3.item2"))}</li><li>${ssrInterpolate(unref($t)("section3.subsection3.item3"))}</li><li>${ssrInterpolate(unref($t)("section3.subsection3.item4"))}</li></ul></div></section></article><div>${(_a = unref($t)("content.html1")) != null ? _a : ""}</div><div>${(_b = unref($t)("content.html2")) != null ? _b : ""}</div><footer><div><h4>${ssrInterpolate(unref($t)("footer.contact.header"))}</h4><address>${ssrInterpolate(unref($t)("footer.contact.address"))}<br> ${ssrInterpolate(unref($t)("footer.contact.city"))}<br> ${ssrInterpolate(unref($t)("footer.contact.phone"))}</address></div><div><h4>${ssrInterpolate(unref($t)("footer.links.header"))}</h4><ul><li><a href="#">${ssrInterpolate(unref($t)("footer.links.privacy"))}</a></li><li><a href="#">${ssrInterpolate(unref($t)("footer.links.terms"))}</a></li><li><a href="#">${ssrInterpolate(unref($t)("footer.links.faq"))}</a></li></ul></div></footer></section><div><!--[-->`);
      ssrRenderList(unref($getLocales)(), (locale) => {
        _push(`<button${ssrIncludeBooleanAttr(locale === unref($getLocale)()) ? " disabled" : ""}> Switch to ${ssrInterpolate(locale.code)}</button>`);
      });
      _push(`<!--]--></div><div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: unref($localeRoute)({ name: "index" })
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Go to Index `);
          } else {
            return [
              createTextVNode(" Go to Index ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(` | `);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: unref($localeRoute)({ name: "page" })
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Go to page `);
          } else {
            return [
              createTextVNode(" Go to page ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/subpage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=subpage-SOnaCTwT.mjs.map
