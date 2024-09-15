import { defineComponent, h, useSSRContext, unref, withCtx, createVNode, toDisplayString, createTextVNode } from 'vue';
import { u as useNuxtApp } from './server.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-BBhqU4Fr.mjs';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrIncludeBooleanAttr } from 'vue/server-renderer';
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

const _sfc_main$1 = defineComponent({
  name: "I18nT",
  props: {
    keypath: {
      type: String,
      required: true
    },
    plural: {
      type: [Number, String]
    },
    tag: {
      type: String,
      default: "span"
    },
    params: {
      type: Object,
      default: () => ({})
    },
    defaultValue: {
      type: String,
      default: ""
    },
    html: {
      type: Boolean,
      default: false
    },
    hideIfEmpty: {
      type: Boolean,
      default: false
    },
    customPluralRule: {
      type: Function,
      default: null
    }
  },
  setup(props, { slots, attrs }) {
    return () => {
      var _a, _b;
      const options = {};
      if (props.plural !== void 0) {
        if (props.customPluralRule) {
          return props.customPluralRule(
            useNuxtApp().$t(props.keypath, { ...props.params, ...options }),
            props.plural,
            useNuxtApp().$getLocale()
          );
        } else {
          return useNuxtApp().$tc(props.keypath, Number.parseInt(props.plural.toString()));
        }
      }
      const translation = ((_a = useNuxtApp().$t(props.keypath, { ...props.params, ...options })) != null ? _a : "").toString();
      if (props.hideIfEmpty && !translation.trim()) {
        return (_b = props.defaultValue) != null ? _b : null;
      }
      if (props.html) {
        return h(props.tag, { ...attrs, innerHTML: translation });
      }
      if (slots.default) {
        return h(
          props.tag,
          attrs,
          slots.default({ translation })
        );
      }
      const children = [];
      let lastIndex = 0;
      for (const [slotName, slotFn] of Object.entries(slots)) {
        const placeholder = `{${slotName}}`;
        const index = translation.indexOf(placeholder, lastIndex);
        if (index !== -1) {
          if (index > lastIndex) {
            children.push(translation.slice(lastIndex, index));
          }
          children.push(h(slotFn));
          lastIndex = index + placeholder.length;
        }
      }
      if (lastIndex < translation.length) {
        children.push(translation.slice(lastIndex));
      }
      if (slots.default) {
        return h(
          props.tag,
          attrs,
          slots.default({ children })
        );
      }
      return h(props.tag, attrs, children);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt-i18n-micro/dist/runtime/components/i18n-t.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "page",
  __ssrInlineRender: true,
  setup(__props) {
    const { $getLocale, $switchLocale, $getLocales, $localeRoute, $t, $tc, $tn, $td } = useNuxtApp();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_i18n_t = _sfc_main$1;
      const _component_nuxt_link = __nuxt_component_0;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(_attrs)}><p>${ssrInterpolate(unref($t)("key1.key1.key1.key1.key1"))}</p>`);
      _push(ssrRenderComponent(_component_i18n_t, {
        keypath: "key1.key1.key1.key1.key1",
        tag: "h1"
      }, {
        default: withCtx(({ translation }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<strong${_scopeId}>${ssrInterpolate(translation.replace("page", "page replace"))}</strong> <i${_scopeId}>!!!</i>`);
          } else {
            return [
              createVNode("strong", null, toDisplayString(translation.replace("page", "page replace")), 1),
              createTextVNode(),
              createVNode("i", null, "!!!")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_i18n_t, { keypath: "feedback.text" }, {
        link: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_nuxt_link, { to: { name: "index" } }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_i18n_t, { keypath: "feedback.link" }, null, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_i18n_t, { keypath: "feedback.link" })
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_nuxt_link, { to: { name: "index" } }, {
                default: withCtx(() => [
                  createVNode(_component_i18n_t, { keypath: "feedback.link" })
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<p>Current Locale: ${ssrInterpolate(unref($getLocale)())}</p><p>text escaping: ${ssrInterpolate(unref($t)("text_escaping"))}</p><div>${ssrInterpolate(unref($t)("welcome", { username: "Alice", unreadCount: 5 }))}</div><div>${ssrInterpolate(unref($tc)("apples", 10))}</div><div> Formatted Number: ${ssrInterpolate(unref($tn)(123456789e-2))}</div><div> Formatted Date: ${ssrInterpolate(unref($td)("2023-12-31"))}</div><div><!--[-->`);
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
        to: unref($localeRoute)({ name: "subpage" })
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Go to subpage `);
          } else {
            return [
              createTextVNode(" Go to subpage ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(` | `);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: unref($localeRoute)({ name: "subpage" }, "en")
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Go to subpage en `);
          } else {
            return [
              createTextVNode(" Go to subpage en ")
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/page.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=page-CDT9j8XL.mjs.map
