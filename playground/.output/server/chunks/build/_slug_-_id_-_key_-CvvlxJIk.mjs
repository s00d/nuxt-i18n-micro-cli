import { ssrRenderAttrs } from 'vue/server-renderer';
import { useSSRContext } from 'vue';
import { _ as _export_sfc } from './server.mjs';
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

const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<div${ssrRenderAttrs(_attrs)}> index [slug]-[id]-[key] </div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/dir1/subdir/[slug]-[id]-[key].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _slug___id___key_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);

export { _slug___id___key_ as default };
//# sourceMappingURL=_slug_-_id_-_key_-CvvlxJIk.mjs.map
