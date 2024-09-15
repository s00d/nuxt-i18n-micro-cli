import { _ as __nuxt_component_0 } from './nuxt-link-BBhqU4Fr.mjs';
import { u as useNuxtApp, a as useRoute, b as useRouter } from './server.mjs';
import { useSSRContext, ref, withCtx, createTextVNode, unref, defineComponent, computed, mergeProps, renderSlot, toDisplayString } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList, ssrIncludeBooleanAttr, ssrRenderComponent, ssrRenderSlot, ssrRenderStyle } from 'vue/server-renderer';
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

const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "i18n-link",
  __ssrInlineRender: true,
  props: {
    to: {},
    activeStyle: {}
  },
  setup(__props) {
    const { $localeRoute } = useNuxtApp();
    const props = __props;
    const route = useRoute();
    const isActive = computed(() => {
      const newPath = $localeRoute(props.to);
      if (typeof newPath === "string") {
        return route.path === useRouter().resolve(newPath).path;
      }
      return route.path === newPath.path;
    });
    const activeStyle = computed(() => {
      return isActive.value ? {
        fontWeight: "bold",
        ...props.activeStyle
        // Merge with any custom active styles passed as props
      } : {};
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(ssrRenderComponent(_component_NuxtLink, mergeProps({
        to: unref($localeRoute)(_ctx.to),
        style: unref(activeStyle)
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            ssrRenderSlot(_ctx.$slots, "default", {}, () => {
              _push2(`Go to Page`);
            }, _push2, _parent2, _scopeId);
          } else {
            return [
              renderSlot(_ctx.$slots, "default", {}, () => [
                createTextVNode("Go to Page")
              ])
            ];
          }
        }),
        _: 3
      }, _parent));
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt-i18n-micro/dist/runtime/components/i18n-link.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "i18n-switcher",
  __ssrInlineRender: true,
  props: {
    customLabels: { default: () => ({}) },
    customWrapperStyle: { default: () => ({}) },
    customButtonStyle: { default: () => ({}) },
    customDropdownStyle: { default: () => ({}) },
    customItemStyle: { default: () => ({}) },
    customLinkStyle: { default: () => ({}) },
    customActiveLinkStyle: { default: () => ({}) },
    customDisabledLinkStyle: { default: () => ({}) },
    customIconStyle: { default: () => ({}) }
  },
  setup(__props) {
    const props = __props;
    const { $localeRoute, $getLocales, $getLocale } = useNuxtApp();
    const locales = ref($getLocales());
    const currentLocale = computed(() => $getLocale());
    const dropdownOpen = ref(false);
    const toggleDropdown = () => {
      dropdownOpen.value = !dropdownOpen.value;
    };
    const localeLabel = (locale) => {
      return props.customLabels[locale.code] || locale.code.toUpperCase();
    };
    const currentLocaleLabel = computed(() => localeLabel({ code: currentLocale.value }));
    const getLocaleLink = (locale) => {
      var _a;
      const route = useRoute();
      const routeName = ((_a = route == null ? void 0 : route.name) != null ? _a : "").toString().replace(`localized-`, "").replace(new RegExp(`-${currentLocale.value}$`), "").replace(new RegExp(`-${locale}$`), "");
      return $localeRoute({ name: routeName }, locale.code);
    };
    const wrapperStyle = {
      position: "relative",
      display: "inline-block"
    };
    const buttonStyle = {
      padding: "4px 12px",
      fontSize: "16px",
      cursor: "pointer",
      backgroundColor: "#fff",
      border: "1px solid #333",
      transition: "background-color 0.3s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    };
    const dropdownStyle = {
      position: "absolute",
      top: "100%",
      left: "0",
      zIndex: "10",
      backgroundColor: "#fff",
      border: "1px solid #333",
      listStyle: "none",
      padding: "0",
      margin: "4px 0 0 0"
    };
    const itemStyle = {
      margin: "0",
      padding: "0"
    };
    const linkStyle = {
      display: "block",
      padding: "8px 12px",
      color: "#333",
      textDecoration: "none",
      transition: "background-color 0.3s ease"
    };
    const activeLinkStyle = {
      fontWeight: "bold",
      color: "#007bff"
    };
    const disabledLinkStyle = {
      cursor: "not-allowed",
      color: "#aaa"
    };
    const iconStyle = {
      marginLeft: "8px",
      transition: "transform 0.3s ease"
    };
    const openIconStyle = {
      transform: "rotate(180deg)"
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({
        style: [wrapperStyle, _ctx.customWrapperStyle]
      }, _attrs))}><button class="language-switcher" style="${ssrRenderStyle([buttonStyle, _ctx.customButtonStyle])}">${ssrInterpolate(currentLocaleLabel.value)} <span style="${ssrRenderStyle([iconStyle, dropdownOpen.value ? openIconStyle : {}, _ctx.customIconStyle])}">\u25BE</span></button>`);
      if (dropdownOpen.value) {
        _push(`<ul style="${ssrRenderStyle([dropdownStyle, _ctx.customDropdownStyle])}"><!--[-->`);
        ssrRenderList(locales.value, (locale) => {
          _push(`<li style="${ssrRenderStyle([itemStyle, _ctx.customItemStyle])}">`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            class: `switcher-locale-${locale.code}`,
            to: getLocaleLink(locale),
            style: [linkStyle, locale.code === currentLocale.value ? activeLinkStyle : {}, locale.code === currentLocale.value ? disabledLinkStyle : {}, _ctx.customLinkStyle],
            hreflang: locale.iso || locale.code,
            onClick: toggleDropdown
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(localeLabel(locale))}`);
              } else {
                return [
                  createTextVNode(toDisplayString(localeLabel(locale)), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</li>`);
        });
        _push(`<!--]--></ul>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt-i18n-micro/dist/runtime/components/i18n-switcher.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    function generateKeys(depth, maxKeys = 4) {
      const keys = [];
      const generate = (prefix = "", currentDepth = depth) => {
        if (currentDepth === 0) {
          for (let i = 0; i <= maxKeys; i++) {
            keys.push(`${prefix}key${i}`);
          }
          return;
        }
        for (let i = 0; i <= maxKeys; i++) {
          generate(`${prefix}key${i}.`, currentDepth - 1);
        }
      };
      generate();
      return keys;
    }
    const generatedKeys = ref(generateKeys(4));
    return (_ctx, _push, _parent, _attrs) => {
      const _component_i18n_link = _sfc_main$2;
      const _component_i18n_switcher = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(_attrs)}><p>${ssrInterpolate(_ctx.$t("key1.key1.key1.key1.key1"))}</p><p>Current Locale: ${ssrInterpolate(_ctx.$getLocale())}</p><p>Current route without locale: ${ssrInterpolate(_ctx.$getRouteName())}</p><div><!--[-->`);
      ssrRenderList(_ctx.$getLocales(), (locale) => {
        _push(`<button${ssrIncludeBooleanAttr(locale.code === _ctx.$getLocale()) ? " disabled" : ""}> Switch to ${ssrInterpolate(locale.code)}</button>`);
      });
      _push(`<!--]--></div><p id="localized-route">${ssrInterpolate(_ctx.$localeRoute({ name: "page" }, "de").path)}</p><div>`);
      _push(ssrRenderComponent(_component_i18n_link, { to: { name: "page" } }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Go to Page `);
          } else {
            return [
              createTextVNode(" Go to Page ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><a href="/">test</a><div>`);
      _push(ssrRenderComponent(_component_i18n_switcher, { "custom-labels": { en: "English", de: "Deutsch", ru: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439" } }, null, _parent));
      _push(`</div><!--[-->`);
      ssrRenderList(unref(generatedKeys), (key) => {
        _push(`<div><p>${ssrInterpolate(key)}: `);
        if (_ctx.$has(key)) {
          _push(`<span>${ssrInterpolate(_ctx.$t(key))}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</p></div>`);
      });
      _push(`<!--]--></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-cml_rQMI.mjs.map
