var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i5 = decorators.length - 1, decorator; i5 >= 0; i5--)
    if (decorator = decorators[i5])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};

// node_modules/@lit/reactive-element/css-tag.js
var t = globalThis;
var e = t.ShadowRoot && (void 0 === t.ShadyCSS || t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var s = Symbol();
var o = /* @__PURE__ */ new WeakMap();
var n = class {
  constructor(t4, e5, o6) {
    if (this._$cssResult$ = true, o6 !== s) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t4, this.t = e5;
  }
  get styleSheet() {
    let t4 = this.o;
    const s4 = this.t;
    if (e && void 0 === t4) {
      const e5 = void 0 !== s4 && 1 === s4.length;
      e5 && (t4 = o.get(s4)), void 0 === t4 && ((this.o = t4 = new CSSStyleSheet()).replaceSync(this.cssText), e5 && o.set(s4, t4));
    }
    return t4;
  }
  toString() {
    return this.cssText;
  }
};
var r = (t4) => new n("string" == typeof t4 ? t4 : t4 + "", void 0, s);
var i = (t4, ...e5) => {
  const o6 = 1 === t4.length ? t4[0] : e5.reduce(((e6, s4, o7) => e6 + ((t5) => {
    if (true === t5._$cssResult$) return t5.cssText;
    if ("number" == typeof t5) return t5;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + t5 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s4) + t4[o7 + 1]), t4[0]);
  return new n(o6, t4, s);
};
var S = (s4, o6) => {
  if (e) s4.adoptedStyleSheets = o6.map(((t4) => t4 instanceof CSSStyleSheet ? t4 : t4.styleSheet));
  else for (const e5 of o6) {
    const o7 = document.createElement("style"), n5 = t.litNonce;
    void 0 !== n5 && o7.setAttribute("nonce", n5), o7.textContent = e5.cssText, s4.appendChild(o7);
  }
};
var c = e ? (t4) => t4 : (t4) => t4 instanceof CSSStyleSheet ? ((t5) => {
  let e5 = "";
  for (const s4 of t5.cssRules) e5 += s4.cssText;
  return r(e5);
})(t4) : t4;

// node_modules/@lit/reactive-element/reactive-element.js
var { is: i2, defineProperty: e2, getOwnPropertyDescriptor: h, getOwnPropertyNames: r2, getOwnPropertySymbols: o2, getPrototypeOf: n2 } = Object;
var a = globalThis;
var c2 = a.trustedTypes;
var l = c2 ? c2.emptyScript : "";
var p = a.reactiveElementPolyfillSupport;
var d = (t4, s4) => t4;
var u = { toAttribute(t4, s4) {
  switch (s4) {
    case Boolean:
      t4 = t4 ? l : null;
      break;
    case Object:
    case Array:
      t4 = null == t4 ? t4 : JSON.stringify(t4);
  }
  return t4;
}, fromAttribute(t4, s4) {
  let i5 = t4;
  switch (s4) {
    case Boolean:
      i5 = null !== t4;
      break;
    case Number:
      i5 = null === t4 ? null : Number(t4);
      break;
    case Object:
    case Array:
      try {
        i5 = JSON.parse(t4);
      } catch (t5) {
        i5 = null;
      }
  }
  return i5;
} };
var f = (t4, s4) => !i2(t4, s4);
var b = { attribute: true, type: String, converter: u, reflect: false, useDefault: false, hasChanged: f };
Symbol.metadata ??= Symbol("metadata"), a.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var y = class extends HTMLElement {
  static addInitializer(t4) {
    this._$Ei(), (this.l ??= []).push(t4);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t4, s4 = b) {
    if (s4.state && (s4.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t4) && ((s4 = Object.create(s4)).wrapped = true), this.elementProperties.set(t4, s4), !s4.noAccessor) {
      const i5 = Symbol(), h3 = this.getPropertyDescriptor(t4, i5, s4);
      void 0 !== h3 && e2(this.prototype, t4, h3);
    }
  }
  static getPropertyDescriptor(t4, s4, i5) {
    const { get: e5, set: r6 } = h(this.prototype, t4) ?? { get() {
      return this[s4];
    }, set(t5) {
      this[s4] = t5;
    } };
    return { get: e5, set(s5) {
      const h3 = e5?.call(this);
      r6?.call(this, s5), this.requestUpdate(t4, h3, i5);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t4) {
    return this.elementProperties.get(t4) ?? b;
  }
  static _$Ei() {
    if (this.hasOwnProperty(d("elementProperties"))) return;
    const t4 = n2(this);
    t4.finalize(), void 0 !== t4.l && (this.l = [...t4.l]), this.elementProperties = new Map(t4.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(d("finalized"))) return;
    if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d("properties"))) {
      const t5 = this.properties, s4 = [...r2(t5), ...o2(t5)];
      for (const i5 of s4) this.createProperty(i5, t5[i5]);
    }
    const t4 = this[Symbol.metadata];
    if (null !== t4) {
      const s4 = litPropertyMetadata.get(t4);
      if (void 0 !== s4) for (const [t5, i5] of s4) this.elementProperties.set(t5, i5);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t5, s4] of this.elementProperties) {
      const i5 = this._$Eu(t5, s4);
      void 0 !== i5 && this._$Eh.set(i5, t5);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(s4) {
    const i5 = [];
    if (Array.isArray(s4)) {
      const e5 = new Set(s4.flat(1 / 0).reverse());
      for (const s5 of e5) i5.unshift(c(s5));
    } else void 0 !== s4 && i5.push(c(s4));
    return i5;
  }
  static _$Eu(t4, s4) {
    const i5 = s4.attribute;
    return false === i5 ? void 0 : "string" == typeof i5 ? i5 : "string" == typeof t4 ? t4.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise(((t4) => this.enableUpdating = t4)), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach(((t4) => t4(this)));
  }
  addController(t4) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t4), void 0 !== this.renderRoot && this.isConnected && t4.hostConnected?.();
  }
  removeController(t4) {
    this._$EO?.delete(t4);
  }
  _$E_() {
    const t4 = /* @__PURE__ */ new Map(), s4 = this.constructor.elementProperties;
    for (const i5 of s4.keys()) this.hasOwnProperty(i5) && (t4.set(i5, this[i5]), delete this[i5]);
    t4.size > 0 && (this._$Ep = t4);
  }
  createRenderRoot() {
    const t4 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return S(t4, this.constructor.elementStyles), t4;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(true), this._$EO?.forEach(((t4) => t4.hostConnected?.()));
  }
  enableUpdating(t4) {
  }
  disconnectedCallback() {
    this._$EO?.forEach(((t4) => t4.hostDisconnected?.()));
  }
  attributeChangedCallback(t4, s4, i5) {
    this._$AK(t4, i5);
  }
  _$ET(t4, s4) {
    const i5 = this.constructor.elementProperties.get(t4), e5 = this.constructor._$Eu(t4, i5);
    if (void 0 !== e5 && true === i5.reflect) {
      const h3 = (void 0 !== i5.converter?.toAttribute ? i5.converter : u).toAttribute(s4, i5.type);
      this._$Em = t4, null == h3 ? this.removeAttribute(e5) : this.setAttribute(e5, h3), this._$Em = null;
    }
  }
  _$AK(t4, s4) {
    const i5 = this.constructor, e5 = i5._$Eh.get(t4);
    if (void 0 !== e5 && this._$Em !== e5) {
      const t5 = i5.getPropertyOptions(e5), h3 = "function" == typeof t5.converter ? { fromAttribute: t5.converter } : void 0 !== t5.converter?.fromAttribute ? t5.converter : u;
      this._$Em = e5;
      const r6 = h3.fromAttribute(s4, t5.type);
      this[e5] = r6 ?? this._$Ej?.get(e5) ?? r6, this._$Em = null;
    }
  }
  requestUpdate(t4, s4, i5) {
    if (void 0 !== t4) {
      const e5 = this.constructor, h3 = this[t4];
      if (i5 ??= e5.getPropertyOptions(t4), !((i5.hasChanged ?? f)(h3, s4) || i5.useDefault && i5.reflect && h3 === this._$Ej?.get(t4) && !this.hasAttribute(e5._$Eu(t4, i5)))) return;
      this.C(t4, s4, i5);
    }
    false === this.isUpdatePending && (this._$ES = this._$EP());
  }
  C(t4, s4, { useDefault: i5, reflect: e5, wrapped: h3 }, r6) {
    i5 && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t4) && (this._$Ej.set(t4, r6 ?? s4 ?? this[t4]), true !== h3 || void 0 !== r6) || (this._$AL.has(t4) || (this.hasUpdated || i5 || (s4 = void 0), this._$AL.set(t4, s4)), true === e5 && this._$Em !== t4 && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t4));
  }
  async _$EP() {
    this.isUpdatePending = true;
    try {
      await this._$ES;
    } catch (t5) {
      Promise.reject(t5);
    }
    const t4 = this.scheduleUpdate();
    return null != t4 && await t4, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [t6, s5] of this._$Ep) this[t6] = s5;
        this._$Ep = void 0;
      }
      const t5 = this.constructor.elementProperties;
      if (t5.size > 0) for (const [s5, i5] of t5) {
        const { wrapped: t6 } = i5, e5 = this[s5];
        true !== t6 || this._$AL.has(s5) || void 0 === e5 || this.C(s5, void 0, i5, e5);
      }
    }
    let t4 = false;
    const s4 = this._$AL;
    try {
      t4 = this.shouldUpdate(s4), t4 ? (this.willUpdate(s4), this._$EO?.forEach(((t5) => t5.hostUpdate?.())), this.update(s4)) : this._$EM();
    } catch (s5) {
      throw t4 = false, this._$EM(), s5;
    }
    t4 && this._$AE(s4);
  }
  willUpdate(t4) {
  }
  _$AE(t4) {
    this._$EO?.forEach(((t5) => t5.hostUpdated?.())), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t4)), this.updated(t4);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t4) {
    return true;
  }
  update(t4) {
    this._$Eq &&= this._$Eq.forEach(((t5) => this._$ET(t5, this[t5]))), this._$EM();
  }
  updated(t4) {
  }
  firstUpdated(t4) {
  }
};
y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[d("elementProperties")] = /* @__PURE__ */ new Map(), y[d("finalized")] = /* @__PURE__ */ new Map(), p?.({ ReactiveElement: y }), (a.reactiveElementVersions ??= []).push("2.1.1");

// node_modules/lit-html/lit-html.js
var t2 = globalThis;
var i3 = t2.trustedTypes;
var s2 = i3 ? i3.createPolicy("lit-html", { createHTML: (t4) => t4 }) : void 0;
var e3 = "$lit$";
var h2 = `lit$${Math.random().toFixed(9).slice(2)}$`;
var o3 = "?" + h2;
var n3 = `<${o3}>`;
var r3 = document;
var l2 = () => r3.createComment("");
var c3 = (t4) => null === t4 || "object" != typeof t4 && "function" != typeof t4;
var a2 = Array.isArray;
var u2 = (t4) => a2(t4) || "function" == typeof t4?.[Symbol.iterator];
var d2 = "[ 	\n\f\r]";
var f2 = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var v = /-->/g;
var _ = />/g;
var m = RegExp(`>|${d2}(?:([^\\s"'>=/]+)(${d2}*=${d2}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
var p2 = /'/g;
var g = /"/g;
var $ = /^(?:script|style|textarea|title)$/i;
var y2 = (t4) => (i5, ...s4) => ({ _$litType$: t4, strings: i5, values: s4 });
var x = y2(1);
var b2 = y2(2);
var w = y2(3);
var T = Symbol.for("lit-noChange");
var E = Symbol.for("lit-nothing");
var A = /* @__PURE__ */ new WeakMap();
var C = r3.createTreeWalker(r3, 129);
function P(t4, i5) {
  if (!a2(t4) || !t4.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== s2 ? s2.createHTML(i5) : i5;
}
var V = (t4, i5) => {
  const s4 = t4.length - 1, o6 = [];
  let r6, l3 = 2 === i5 ? "<svg>" : 3 === i5 ? "<math>" : "", c4 = f2;
  for (let i6 = 0; i6 < s4; i6++) {
    const s5 = t4[i6];
    let a3, u3, d3 = -1, y3 = 0;
    for (; y3 < s5.length && (c4.lastIndex = y3, u3 = c4.exec(s5), null !== u3); ) y3 = c4.lastIndex, c4 === f2 ? "!--" === u3[1] ? c4 = v : void 0 !== u3[1] ? c4 = _ : void 0 !== u3[2] ? ($.test(u3[2]) && (r6 = RegExp("</" + u3[2], "g")), c4 = m) : void 0 !== u3[3] && (c4 = m) : c4 === m ? ">" === u3[0] ? (c4 = r6 ?? f2, d3 = -1) : void 0 === u3[1] ? d3 = -2 : (d3 = c4.lastIndex - u3[2].length, a3 = u3[1], c4 = void 0 === u3[3] ? m : '"' === u3[3] ? g : p2) : c4 === g || c4 === p2 ? c4 = m : c4 === v || c4 === _ ? c4 = f2 : (c4 = m, r6 = void 0);
    const x2 = c4 === m && t4[i6 + 1].startsWith("/>") ? " " : "";
    l3 += c4 === f2 ? s5 + n3 : d3 >= 0 ? (o6.push(a3), s5.slice(0, d3) + e3 + s5.slice(d3) + h2 + x2) : s5 + h2 + (-2 === d3 ? i6 : x2);
  }
  return [P(t4, l3 + (t4[s4] || "<?>") + (2 === i5 ? "</svg>" : 3 === i5 ? "</math>" : "")), o6];
};
var N = class _N {
  constructor({ strings: t4, _$litType$: s4 }, n5) {
    let r6;
    this.parts = [];
    let c4 = 0, a3 = 0;
    const u3 = t4.length - 1, d3 = this.parts, [f3, v2] = V(t4, s4);
    if (this.el = _N.createElement(f3, n5), C.currentNode = this.el.content, 2 === s4 || 3 === s4) {
      const t5 = this.el.content.firstChild;
      t5.replaceWith(...t5.childNodes);
    }
    for (; null !== (r6 = C.nextNode()) && d3.length < u3; ) {
      if (1 === r6.nodeType) {
        if (r6.hasAttributes()) for (const t5 of r6.getAttributeNames()) if (t5.endsWith(e3)) {
          const i5 = v2[a3++], s5 = r6.getAttribute(t5).split(h2), e5 = /([.?@])?(.*)/.exec(i5);
          d3.push({ type: 1, index: c4, name: e5[2], strings: s5, ctor: "." === e5[1] ? H : "?" === e5[1] ? I : "@" === e5[1] ? L : k }), r6.removeAttribute(t5);
        } else t5.startsWith(h2) && (d3.push({ type: 6, index: c4 }), r6.removeAttribute(t5));
        if ($.test(r6.tagName)) {
          const t5 = r6.textContent.split(h2), s5 = t5.length - 1;
          if (s5 > 0) {
            r6.textContent = i3 ? i3.emptyScript : "";
            for (let i5 = 0; i5 < s5; i5++) r6.append(t5[i5], l2()), C.nextNode(), d3.push({ type: 2, index: ++c4 });
            r6.append(t5[s5], l2());
          }
        }
      } else if (8 === r6.nodeType) if (r6.data === o3) d3.push({ type: 2, index: c4 });
      else {
        let t5 = -1;
        for (; -1 !== (t5 = r6.data.indexOf(h2, t5 + 1)); ) d3.push({ type: 7, index: c4 }), t5 += h2.length - 1;
      }
      c4++;
    }
  }
  static createElement(t4, i5) {
    const s4 = r3.createElement("template");
    return s4.innerHTML = t4, s4;
  }
};
function S2(t4, i5, s4 = t4, e5) {
  if (i5 === T) return i5;
  let h3 = void 0 !== e5 ? s4._$Co?.[e5] : s4._$Cl;
  const o6 = c3(i5) ? void 0 : i5._$litDirective$;
  return h3?.constructor !== o6 && (h3?._$AO?.(false), void 0 === o6 ? h3 = void 0 : (h3 = new o6(t4), h3._$AT(t4, s4, e5)), void 0 !== e5 ? (s4._$Co ??= [])[e5] = h3 : s4._$Cl = h3), void 0 !== h3 && (i5 = S2(t4, h3._$AS(t4, i5.values), h3, e5)), i5;
}
var M = class {
  constructor(t4, i5) {
    this._$AV = [], this._$AN = void 0, this._$AD = t4, this._$AM = i5;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t4) {
    const { el: { content: i5 }, parts: s4 } = this._$AD, e5 = (t4?.creationScope ?? r3).importNode(i5, true);
    C.currentNode = e5;
    let h3 = C.nextNode(), o6 = 0, n5 = 0, l3 = s4[0];
    for (; void 0 !== l3; ) {
      if (o6 === l3.index) {
        let i6;
        2 === l3.type ? i6 = new R(h3, h3.nextSibling, this, t4) : 1 === l3.type ? i6 = new l3.ctor(h3, l3.name, l3.strings, this, t4) : 6 === l3.type && (i6 = new z(h3, this, t4)), this._$AV.push(i6), l3 = s4[++n5];
      }
      o6 !== l3?.index && (h3 = C.nextNode(), o6++);
    }
    return C.currentNode = r3, e5;
  }
  p(t4) {
    let i5 = 0;
    for (const s4 of this._$AV) void 0 !== s4 && (void 0 !== s4.strings ? (s4._$AI(t4, s4, i5), i5 += s4.strings.length - 2) : s4._$AI(t4[i5])), i5++;
  }
};
var R = class _R {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t4, i5, s4, e5) {
    this.type = 2, this._$AH = E, this._$AN = void 0, this._$AA = t4, this._$AB = i5, this._$AM = s4, this.options = e5, this._$Cv = e5?.isConnected ?? true;
  }
  get parentNode() {
    let t4 = this._$AA.parentNode;
    const i5 = this._$AM;
    return void 0 !== i5 && 11 === t4?.nodeType && (t4 = i5.parentNode), t4;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t4, i5 = this) {
    t4 = S2(this, t4, i5), c3(t4) ? t4 === E || null == t4 || "" === t4 ? (this._$AH !== E && this._$AR(), this._$AH = E) : t4 !== this._$AH && t4 !== T && this._(t4) : void 0 !== t4._$litType$ ? this.$(t4) : void 0 !== t4.nodeType ? this.T(t4) : u2(t4) ? this.k(t4) : this._(t4);
  }
  O(t4) {
    return this._$AA.parentNode.insertBefore(t4, this._$AB);
  }
  T(t4) {
    this._$AH !== t4 && (this._$AR(), this._$AH = this.O(t4));
  }
  _(t4) {
    this._$AH !== E && c3(this._$AH) ? this._$AA.nextSibling.data = t4 : this.T(r3.createTextNode(t4)), this._$AH = t4;
  }
  $(t4) {
    const { values: i5, _$litType$: s4 } = t4, e5 = "number" == typeof s4 ? this._$AC(t4) : (void 0 === s4.el && (s4.el = N.createElement(P(s4.h, s4.h[0]), this.options)), s4);
    if (this._$AH?._$AD === e5) this._$AH.p(i5);
    else {
      const t5 = new M(e5, this), s5 = t5.u(this.options);
      t5.p(i5), this.T(s5), this._$AH = t5;
    }
  }
  _$AC(t4) {
    let i5 = A.get(t4.strings);
    return void 0 === i5 && A.set(t4.strings, i5 = new N(t4)), i5;
  }
  k(t4) {
    a2(this._$AH) || (this._$AH = [], this._$AR());
    const i5 = this._$AH;
    let s4, e5 = 0;
    for (const h3 of t4) e5 === i5.length ? i5.push(s4 = new _R(this.O(l2()), this.O(l2()), this, this.options)) : s4 = i5[e5], s4._$AI(h3), e5++;
    e5 < i5.length && (this._$AR(s4 && s4._$AB.nextSibling, e5), i5.length = e5);
  }
  _$AR(t4 = this._$AA.nextSibling, i5) {
    for (this._$AP?.(false, true, i5); t4 !== this._$AB; ) {
      const i6 = t4.nextSibling;
      t4.remove(), t4 = i6;
    }
  }
  setConnected(t4) {
    void 0 === this._$AM && (this._$Cv = t4, this._$AP?.(t4));
  }
};
var k = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t4, i5, s4, e5, h3) {
    this.type = 1, this._$AH = E, this._$AN = void 0, this.element = t4, this.name = i5, this._$AM = e5, this.options = h3, s4.length > 2 || "" !== s4[0] || "" !== s4[1] ? (this._$AH = Array(s4.length - 1).fill(new String()), this.strings = s4) : this._$AH = E;
  }
  _$AI(t4, i5 = this, s4, e5) {
    const h3 = this.strings;
    let o6 = false;
    if (void 0 === h3) t4 = S2(this, t4, i5, 0), o6 = !c3(t4) || t4 !== this._$AH && t4 !== T, o6 && (this._$AH = t4);
    else {
      const e6 = t4;
      let n5, r6;
      for (t4 = h3[0], n5 = 0; n5 < h3.length - 1; n5++) r6 = S2(this, e6[s4 + n5], i5, n5), r6 === T && (r6 = this._$AH[n5]), o6 ||= !c3(r6) || r6 !== this._$AH[n5], r6 === E ? t4 = E : t4 !== E && (t4 += (r6 ?? "") + h3[n5 + 1]), this._$AH[n5] = r6;
    }
    o6 && !e5 && this.j(t4);
  }
  j(t4) {
    t4 === E ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t4 ?? "");
  }
};
var H = class extends k {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t4) {
    this.element[this.name] = t4 === E ? void 0 : t4;
  }
};
var I = class extends k {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t4) {
    this.element.toggleAttribute(this.name, !!t4 && t4 !== E);
  }
};
var L = class extends k {
  constructor(t4, i5, s4, e5, h3) {
    super(t4, i5, s4, e5, h3), this.type = 5;
  }
  _$AI(t4, i5 = this) {
    if ((t4 = S2(this, t4, i5, 0) ?? E) === T) return;
    const s4 = this._$AH, e5 = t4 === E && s4 !== E || t4.capture !== s4.capture || t4.once !== s4.once || t4.passive !== s4.passive, h3 = t4 !== E && (s4 === E || e5);
    e5 && this.element.removeEventListener(this.name, this, s4), h3 && this.element.addEventListener(this.name, this, t4), this._$AH = t4;
  }
  handleEvent(t4) {
    "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t4) : this._$AH.handleEvent(t4);
  }
};
var z = class {
  constructor(t4, i5, s4) {
    this.element = t4, this.type = 6, this._$AN = void 0, this._$AM = i5, this.options = s4;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t4) {
    S2(this, t4);
  }
};
var j = t2.litHtmlPolyfillSupport;
j?.(N, R), (t2.litHtmlVersions ??= []).push("3.3.1");
var B = (t4, i5, s4) => {
  const e5 = s4?.renderBefore ?? i5;
  let h3 = e5._$litPart$;
  if (void 0 === h3) {
    const t5 = s4?.renderBefore ?? null;
    e5._$litPart$ = h3 = new R(i5.insertBefore(l2(), t5), t5, void 0, s4 ?? {});
  }
  return h3._$AI(t4), h3;
};

// node_modules/lit-element/lit-element.js
var s3 = globalThis;
var i4 = class extends y {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t4 = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t4.firstChild, t4;
  }
  update(t4) {
    const r6 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t4), this._$Do = B(r6, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(false);
  }
  render() {
    return T;
  }
};
i4._$litElement$ = true, i4["finalized"] = true, s3.litElementHydrateSupport?.({ LitElement: i4 });
var o4 = s3.litElementPolyfillSupport;
o4?.({ LitElement: i4 });
(s3.litElementVersions ??= []).push("4.2.1");

// node_modules/@lit/reactive-element/decorators/custom-element.js
var t3 = (t4) => (e5, o6) => {
  void 0 !== o6 ? o6.addInitializer((() => {
    customElements.define(t4, e5);
  })) : customElements.define(t4, e5);
};

// node_modules/@lit/reactive-element/decorators/property.js
var o5 = { attribute: true, type: String, converter: u, reflect: false, hasChanged: f };
var r4 = (t4 = o5, e5, r6) => {
  const { kind: n5, metadata: i5 } = r6;
  let s4 = globalThis.litPropertyMetadata.get(i5);
  if (void 0 === s4 && globalThis.litPropertyMetadata.set(i5, s4 = /* @__PURE__ */ new Map()), "setter" === n5 && ((t4 = Object.create(t4)).wrapped = true), s4.set(r6.name, t4), "accessor" === n5) {
    const { name: o6 } = r6;
    return { set(r7) {
      const n6 = e5.get.call(this);
      e5.set.call(this, r7), this.requestUpdate(o6, n6, t4);
    }, init(e6) {
      return void 0 !== e6 && this.C(o6, void 0, t4, e6), e6;
    } };
  }
  if ("setter" === n5) {
    const { name: o6 } = r6;
    return function(r7) {
      const n6 = this[o6];
      e5.call(this, r7), this.requestUpdate(o6, n6, t4);
    };
  }
  throw Error("Unsupported decorator location: " + n5);
};
function n4(t4) {
  return (e5, o6) => "object" == typeof o6 ? r4(t4, e5, o6) : ((t5, e6, o7) => {
    const r6 = e6.hasOwnProperty(o7);
    return e6.constructor.createProperty(o7, t5), r6 ? Object.getOwnPropertyDescriptor(e6, o7) : void 0;
  })(t4, e5, o6);
}

// node_modules/@lit/reactive-element/decorators/state.js
function r5(r6) {
  return n4({ ...r6, state: true, attribute: false });
}

// src/api.ts
var DOMAIN = "maint";
var fetchEntries = (hass) => hass.callWS({
  type: "config_entries/get",
  domain: DOMAIN
});
var fetchTasks = (hass, entryId) => hass.callWS({
  type: "maint/task/list",
  entry_id: entryId
});
var createTask = (hass, entryId, payload) => hass.callWS({
  type: "maint/task/create",
  entry_id: entryId,
  ...payload
});
var updateTask = (hass, entryId, taskId, payload) => hass.callWS({
  type: "maint/task/update",
  entry_id: entryId,
  task_id: taskId,
  ...payload
});
var deleteTask = (hass, entryId, taskId) => hass.callWS({
  type: "maint/task/delete",
  entry_id: entryId,
  task_id: taskId
});

// src/formatting.ts
var normalizeFrequencyUnit = (value) => {
  const normalized = (value ?? "").toString().trim();
  if (normalized === "weeks" || normalized === "months") {
    return normalized;
  }
  return "days";
};
var parseFrequencyUnit = (value) => {
  if (value === null || value === void 0) {
    return null;
  }
  return normalizeFrequencyUnit(value);
};
var parseFrequency = (value) => {
  if (value === null || value === void 0) {
    return null;
  }
  const rawValue = value.toString().trim();
  if (!rawValue) {
    return null;
  }
  const parsed = Number(rawValue);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return Math.floor(parsed);
};
var parseDate = (value) => {
  if (value === null || value === void 0) {
    return null;
  }
  const trimmed = value.toString().trim();
  if (!trimmed) {
    return null;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return trimmed;
};
var formatDate = (value) => {
  if (!value) {
    return "\u2014";
  }
  const [year, month, day] = value.toString().split("T")[0].split("-").map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return "\u2014";
  }
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString();
};
var formatDateInput = (value) => {
  if (!value) {
    return "";
  }
  const [year, month, day] = value.toString().split("T")[0].split("-").map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return "";
  }
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
};
var frequencyUnitMultiplier = (unit) => {
  switch (normalizeFrequencyUnit(unit)) {
    case "weeks":
      return 7;
    case "months":
      return 30;
    default:
      return 1;
  }
};
var formatFrequencyValue = (frequencyDays, frequencyUnit = "days") => {
  if (!frequencyDays || Number.isNaN(Number(frequencyDays))) {
    return "";
  }
  const unit = normalizeFrequencyUnit(frequencyUnit);
  const multiplier = frequencyUnitMultiplier(unit);
  const normalized = Number(frequencyDays) / multiplier;
  if (!Number.isFinite(normalized)) {
    return "";
  }
  return Number.isInteger(normalized) ? normalized.toString() : normalized.toFixed(2);
};
var formatFrequency = (frequencyDays, frequencyUnit = "days") => {
  if (!frequencyDays || Number.isNaN(Number(frequencyDays))) {
    return "\u2014";
  }
  const unit = normalizeFrequencyUnit(frequencyUnit);
  const value = Number(formatFrequencyValue(frequencyDays, unit));
  if (!value || Number.isNaN(value)) {
    return "\u2014";
  }
  const unitLabel = unit === "days" ? value === 1 ? "day" : "days" : unit === "weeks" ? value === 1 ? "week" : "weeks" : value === 1 ? "month" : "months";
  if (unit === "days" && value === 1) {
    return "Every day";
  }
  if (value === 1) {
    return `Every ${unitLabel}`;
  }
  return `Every ${value} ${unitLabel}`;
};
var nextScheduled = (task) => {
  if (!task) {
    return null;
  }
  if (task.next_scheduled) {
    return task.next_scheduled;
  }
  if (!task.last_completed || !task.frequency) {
    return null;
  }
  const [year, month, day] = task.last_completed.toString().split("T")[0].split("-").map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return null;
  }
  const next = new Date(year, month - 1, day);
  next.setDate(next.getDate() + Number(task.frequency));
  return `${next.getFullYear().toString().padStart(4, "0")}-${(next.getMonth() + 1).toString().padStart(2, "0")}-${next.getDate().toString().padStart(2, "0")}`;
};
var normalizeTask = (task) => ({
  ...task,
  frequency_unit: normalizeFrequencyUnit(task.frequency_unit)
});

// src/forms.ts
var validateTaskFields = (fields) => {
  const description = (fields.description ?? "").toString().trim();
  if (!description) {
    return { error: "Enter a description." };
  }
  const frequency = parseFrequency(fields.frequency);
  if (frequency === null) {
    return { error: "Enter how often the task repeats." };
  }
  const frequencyUnit = parseFrequencyUnit(fields.frequency_unit);
  if (!frequencyUnit) {
    return { error: "Choose a frequency unit." };
  }
  const lastCompleted = parseDate(fields.last_completed);
  if (lastCompleted === null) {
    return { error: "Enter a valid date for last completed." };
  }
  return {
    values: {
      description,
      frequency,
      frequency_unit: frequencyUnit,
      last_completed: lastCompleted
    }
  };
};

// src/styles.ts
var styles = i`
  :host {
    --maint-panel-max-width: 900px;
    --maint-panel-padding: 24px;
    display: block;
    box-sizing: border-box;
  }

  .container {
    padding: var(--maint-panel-padding);
    max-width: var(--maint-panel-max-width);
    margin: 0 auto;
  }

  h1 {
    font-size: 24px;
    margin-bottom: 4px;
  }

  .subtext {
    color: var(--secondary-text-color);
    margin-bottom: 24px;
  }

  section {
    background: var(--card-background-color);
    border-radius: 12px;
    border: 1px solid var(--divider-color);
    padding: 14px 20px;
    margin-bottom: 24px;
  }

  select,
  input,
  textarea,
  button {
    font: inherit;
  }

  select,
  input,
  textarea {
    width: 100%;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid var(--divider-color);
    box-sizing: border-box;
    background: var(--card-background-color);
    color: var(--primary-text-color);
  }

  textarea {
    resize: vertical;
    min-height: 60px;
  }

  button {
    background-color: var(--primary-color);
    color: var(--text-primary-color);
    border: none;
    border-radius: 8px;
    padding: 10px 16px;
    cursor: pointer;
  }

  button[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 12px 8px;
    text-align: left;
    vertical-align: middle;
  }

  th {
    color: var(--secondary-text-color);
    font-weight: 600;
    border-bottom: 1px solid var(--divider-color);
  }

  td {
    border-bottom: 1px solid var(--divider-color);
  }

  .task-description {
    font-weight: 400;
    white-space: pre-wrap;
    color: var(--primary-text-color);
  }

  .actions {
    text-align: right;
    width: 110px;
    min-width: 110px;
    white-space: nowrap;
  }

  .actions button + button {
    margin-left: 8px;
  }

  .icon-button {
    background: none;
    color: var(--primary-text-color);
    padding: 8px;
    min-width: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .icon-button ha-icon {
    width: 20px;
    height: 20px;
  }

  .info {
    color: var(--secondary-text-color);
    font-style: italic;
  }

  .error {
    color: var(--error-color);
    margin-bottom: 12px;
  }

  label {
    display: block;
    margin-bottom: 12px;
  }

  .label-text {
    display: block;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .inline-fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-top: 10px;
    margin-bottom: 12px;
  }

  .frequency-editor {
    display: grid;
    grid-template-columns: 1fr 140px;
    gap: 8px;
    align-items: center;
  }

  .frequency-editor select,
  .frequency-editor input {
    width: 100%;
  }

  .form-header {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 4px;
    cursor: pointer;
  }

  .form-header-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  h2 {
    margin: 0;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
  }

  .form-toggle {
    margin-left: auto;
  }

  .form-fields {
    margin-top: 16px;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .modal {
    background: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 12px;
    padding: 20px;
    max-width: 420px;
    width: calc(100% - 32px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }

  .modal h3 {
    margin: 0 0 8px;
    font-size: 18px;
  }

  .modal p {
    margin: 0 0 16px;
    color: var(--secondary-text-color);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .button-secondary {
    background: none;
    color: var(--primary-text-color);
    border: 1px solid var(--divider-color);
  }

  .button-danger {
    background: var(--error-color);
    color: var(--text-primary-color);
  }

  @media (max-width: 720px) {
    section {
      padding: 16px;
    }

    table,
    thead,
    tbody,
    th,
    td,
    tr {
      display: block;
    }

    th {
      display: none;
    }

    td {
      border: none;
      padding: 8px 0;
    }

    .actions {
      text-align: left;
    }
  }
`;

// src/main.ts
var MaintPanel = class extends i4 {
  constructor() {
    super(...arguments);
    this.entries = [];
    this.tasks = [];
    this.selectedEntryId = null;
    this.busy = false;
    this.error = null;
    this.editingTaskId = null;
    this.confirmTaskId = null;
    this.formExpanded = true;
    this.initialized = false;
  }
  updated(changedProps) {
    if (changedProps.has("hass") && this.hass && !this.initialized) {
      this.initialized = true;
      void this.loadEntries();
    }
  }
  render() {
    const hasEntries = this.entries.length > 0;
    const formDisabled = !this.selectedEntryId;
    return x`
      <div class="container">
        <h1>Maintenance</h1>
        <p class="subtext">Manage recurring tasks and keep your home on track.</p>
        ${hasEntries ? E : x`<p class="info">Add a Maint integration entry to start tracking tasks.</p>`}
        ${this.renderCreateForm(formDisabled, hasEntries)}
        ${this.renderTasksSection(formDisabled)}
        ${this.renderDeleteModal()}
      </div>
    `;
  }
  renderCreateForm(formDisabled, hasEntries) {
    const toggleIcon = this.formExpanded ? "mdi:chevron-down" : "mdi:chevron-right";
    const toggleLabel = this.formExpanded ? "Collapse form" : "Expand form";
    return x`
      <section>
        <div
          class="form-header"
          tabindex="0"
          role="button"
          aria-expanded=${this.formExpanded}
          @click=${this.toggleForm}
          @keydown=${this.handleFormHeaderKeydown}
        >
          <div class="form-header-text">
            <h2>Create task</h2>
          </div>
          <button
            type="button"
            id="form-toggle"
            class="icon-button form-toggle"
            aria-label=${toggleLabel}
            title=${toggleLabel}
          >
            <ha-icon icon=${toggleIcon} aria-hidden="true"></ha-icon>
          </button>
        </div>
        ${this.error ? x`<div class="error">${this.error}</div>` : E}
        ${hasEntries ? E : x`<p class="info">Add a Maint integration entry to enable task tracking.</p>`}
        ${this.formExpanded ? x`
              <form id="task-form" @submit=${this.handleCreateTask}>
                <div class="form-fields">
                  <label>
                    <span class="label-text">Description</span>
                    <input
                      type="text"
                      name="description"
                      required
                      placeholder="Smoke detector battery"
                      ?disabled=${formDisabled}
                    />
                  </label>
                  <div class="inline-fields">
                    <label>
                      <span class="label-text">Frequency</span>
                      <input
                        type="number"
                        name="frequency"
                        min="1"
                        step="1"
                        required
                        placeholder="90"
                        ?disabled=${formDisabled}
                      />
                    </label>
                    <label>
                      <span class="label-text">Unit</span>
                      <select name="frequency_unit" ?disabled=${formDisabled}>
                        ${this.frequencyUnitOptions()}
                      </select>
                    </label>
                    <label>
                      <span class="label-text">Starting from</span>
                      <input
                        type="date"
                        name="last_completed"
                        @focus=${this.openDatePicker}
                        @pointerdown=${this.openDatePicker}
                        ?disabled=${formDisabled}
                      />
                    </label>
                  </div>
                </div>
                <div class="form-actions">
                  <button type="submit" ?disabled=${this.busy || formDisabled}>
                    ${this.busy ? "Saving\u2026" : "Create task"}
                  </button>
                </div>
              </form>
            ` : E}
      </section>
    `;
  }
  renderTasksSection(formDisabled) {
    const hasTasks = this.tasks.length > 0;
    return x`
      <section>
        <h2>Tasks</h2>
        ${formDisabled ? x`<p class="info">Add the Maint integration to start tracking tasks.</p>` : !hasTasks ? x`<p class="info">No tasks yet. Use the form above to create one.</p>` : x`
                <div class="task-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Frequency</th>
                        <th>Last completed</th>
                        <th>Next scheduled</th>
                        <th class="actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${this.tasks.map((task) => this.renderTaskRow(task))}
                    </tbody>
                  </table>
                </div>
              `}
      </section>
    `;
  }
  renderTaskRow(task) {
    const isEditing = this.editingTaskId === task.task_id;
    const saveLabel = isEditing ? this.busy ? "Saving\u2026" : "Save" : "Edit";
    const saveIcon = isEditing ? "mdi:check" : "mdi:pencil";
    return x`
      <tr data-task-row=${task.task_id}>
        <td>
          ${isEditing ? x`
                <input type="text" name="description" .value=${task.description} />
              ` : x`<div class="task-description">${task.description}</div>`}
        </td>
        <td>
          ${isEditing ? x`
                <div class="frequency-editor">
                  <input
                    type="number"
                    name="frequency"
                    min="1"
                    step="1"
                    .value=${formatFrequencyValue(task.frequency, task.frequency_unit)}
                  />
                  <select name="frequency_unit">
                    ${this.frequencyUnitOptions(task.frequency_unit)}
                  </select>
                </div>
              ` : formatFrequency(task.frequency, task.frequency_unit)}
        </td>
        <td>
          ${isEditing ? x`
                <input
                  type="date"
                  name="last_completed"
                  .value=${formatDateInput(task.last_completed)}
                  @focus=${this.openDatePicker}
                  @pointerdown=${this.openDatePicker}
                />
              ` : formatDate(task.last_completed)}
        </td>
        <td>${formatDate(nextScheduled(task))}</td>
        <td class="actions">
          <button
            type="button"
            class="icon-button edit-task"
            data-task=${task.task_id}
            ?disabled=${isEditing && this.busy}
            aria-label=${saveLabel}
            title=${saveLabel}
            @click=${this.handleEditTask}
          >
            <ha-icon icon=${saveIcon} aria-hidden="true"></ha-icon>
          </button>
          <button
            type="button"
            class="icon-button delete-task"
            data-task=${task.task_id}
            aria-label="Delete"
            title="Delete"
            @click=${this.promptDelete}
          >
            <ha-icon icon="mdi:delete-outline" aria-hidden="true"></ha-icon>
          </button>
        </td>
      </tr>
    `;
  }
  renderDeleteModal() {
    if (!this.confirmTaskId) {
      return E;
    }
    const task = this.tasks.find((item) => item.task_id === this.confirmTaskId);
    if (!task) {
      return E;
    }
    return x`
      <div class="modal-backdrop">
        <div class="modal">
          <h3>Delete task?</h3>
          <p>Are you sure you want to delete "${task.description}"?</p>
          <div class="modal-actions">
            <button
              type="button"
              class="button-secondary"
              id="cancel-delete"
              ?disabled=${this.busy}
              @click=${this.cancelDelete}
            >
              Cancel
            </button>
            <button
              type="button"
              class="button-danger"
              id="confirm-delete"
              ?disabled=${this.busy}
              @click=${this.handleDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }
  async loadEntries() {
    if (!this.hass) {
      return;
    }
    try {
      const entries = await fetchEntries(this.hass);
      this.entries = entries.map((entry) => ({
        entry_id: entry.entry_id,
        title: entry.title
      }));
      if (this.entries.length && !this.selectedEntryId) {
        this.selectedEntryId = this.entries[0].entry_id;
      }
      if (this.selectedEntryId) {
        await this.loadTasks();
      }
    } catch (error) {
      console.error("Maint panel failed to load entries", error);
      this.error = "Unable to load maint entries.";
    }
  }
  async loadTasks() {
    if (!this.selectedEntryId || !this.hass) {
      this.tasks = [];
      this.editingTaskId = null;
      return;
    }
    try {
      this.busy = true;
      const tasks = await fetchTasks(this.hass, this.selectedEntryId);
      this.tasks = tasks.map((task) => normalizeTask(task));
      this.editingTaskId = null;
      this.confirmTaskId = null;
      this.formExpanded = this.tasks.length === 0;
    } catch (error) {
      console.error("Maint panel failed to load tasks", error);
      this.error = "Unable to load tasks.";
    } finally {
      this.busy = false;
    }
  }
  async handleCreateTask(event) {
    event.preventDefault();
    if (!this.selectedEntryId || !this.hass) {
      return;
    }
    const form = event.currentTarget;
    if (!form) {
      return;
    }
    const formData = new FormData(form);
    const result = validateTaskFields({
      description: formData.get("description"),
      frequency: formData.get("frequency"),
      frequency_unit: formData.get("frequency_unit"),
      last_completed: formData.get("last_completed")
    });
    if (result.error) {
      this.error = result.error;
      return;
    }
    if (!result.values) {
      return;
    }
    try {
      this.busy = true;
      const created = await createTask(this.hass, this.selectedEntryId, result.values);
      this.tasks = [...this.tasks, normalizeTask(created)];
      form.reset();
      this.error = null;
    } catch (error) {
      console.error("Maint panel failed to create task", error);
      this.error = "Could not create task. Check the logs for details.";
    } finally {
      this.busy = false;
    }
  }
  handleEditTask(event) {
    if (!this.selectedEntryId) {
      return;
    }
    const taskId = event.currentTarget?.dataset.task;
    if (!taskId) {
      return;
    }
    if (this.editingTaskId !== taskId) {
      this.error = null;
      this.editingTaskId = taskId;
      return;
    }
    this.error = null;
    void this.saveTaskEdits(taskId);
  }
  async saveTaskEdits(taskId) {
    if (!this.selectedEntryId || !this.hass) {
      return;
    }
    const row = this.renderRoot.querySelector(
      `[data-task-row="${taskId}"]`
    );
    if (!row) {
      return;
    }
    const descriptionInput = row.querySelector('input[name="description"]');
    const frequencyInput = row.querySelector('input[name="frequency"]');
    const frequencyUnitSelect = row.querySelector('select[name="frequency_unit"]');
    const dateInput = row.querySelector('input[name="last_completed"]');
    const result = validateTaskFields({
      description: descriptionInput?.value,
      frequency: frequencyInput?.value,
      frequency_unit: frequencyUnitSelect?.value,
      last_completed: dateInput?.value
    });
    if (result.error) {
      this.error = result.error;
      return;
    }
    if (!result.values) {
      return;
    }
    try {
      this.busy = true;
      const updated = await updateTask(
        this.hass,
        this.selectedEntryId,
        taskId,
        result.values
      );
      this.tasks = this.tasks.map(
        (task) => task.task_id === taskId ? normalizeTask(updated) : task
      );
      this.editingTaskId = null;
    } catch (error) {
      console.error("Maint panel failed to update task", error);
      this.error = "Could not update the task.";
    } finally {
      this.busy = false;
    }
  }
  promptDelete(event) {
    if (!this.selectedEntryId) {
      return;
    }
    const taskId = event.currentTarget?.dataset.task;
    if (!taskId) {
      return;
    }
    this.confirmTaskId = taskId;
  }
  async handleDelete() {
    if (!this.selectedEntryId || !this.confirmTaskId || !this.hass) {
      return;
    }
    const taskId = this.confirmTaskId;
    try {
      this.busy = true;
      await deleteTask(this.hass, this.selectedEntryId, taskId);
      this.tasks = this.tasks.filter((task) => task.task_id !== taskId);
      if (this.editingTaskId === taskId) {
        this.editingTaskId = null;
      }
      if (this.tasks.length === 0) {
        this.formExpanded = true;
      }
    } catch (error) {
      console.error("Maint panel failed to delete task", error);
      this.error = "Could not delete the task.";
    } finally {
      this.busy = false;
      this.confirmTaskId = null;
    }
  }
  cancelDelete() {
    this.confirmTaskId = null;
  }
  toggleForm() {
    this.formExpanded = !this.formExpanded;
  }
  handleFormHeaderKeydown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.toggleForm();
    }
  }
  openDatePicker(event) {
    const input = event.currentTarget;
    if (!input || input.type !== "date") {
      return;
    }
    if (event.type === "pointerdown") {
      event.preventDefault();
      input.focus();
    }
    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
      } catch {
      }
    }
  }
  frequencyUnitOptions(selected = "days") {
    const normalized = selected === "weeks" || selected === "months" ? selected : "days";
    return [
      x`<option value="days" ?selected=${normalized === "days"}>Days</option>`,
      x`<option value="weeks" ?selected=${normalized === "weeks"}>Weeks</option>`,
      x`<option value="months" ?selected=${normalized === "months"}>Months</option>`
    ];
  }
};
MaintPanel.styles = styles;
__decorateClass([
  n4({ attribute: false })
], MaintPanel.prototype, "hass", 2);
__decorateClass([
  r5()
], MaintPanel.prototype, "entries", 2);
__decorateClass([
  r5()
], MaintPanel.prototype, "tasks", 2);
__decorateClass([
  r5()
], MaintPanel.prototype, "selectedEntryId", 2);
__decorateClass([
  r5()
], MaintPanel.prototype, "busy", 2);
__decorateClass([
  r5()
], MaintPanel.prototype, "error", 2);
__decorateClass([
  r5()
], MaintPanel.prototype, "editingTaskId", 2);
__decorateClass([
  r5()
], MaintPanel.prototype, "confirmTaskId", 2);
__decorateClass([
  r5()
], MaintPanel.prototype, "formExpanded", 2);
MaintPanel = __decorateClass([
  t3("maint-panel")
], MaintPanel);
export {
  MaintPanel
};
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
lit-html/lit-html.js:
lit-element/lit-element.js:
@lit/reactive-element/decorators/custom-element.js:
@lit/reactive-element/decorators/property.js:
@lit/reactive-element/decorators/state.js:
@lit/reactive-element/decorators/event-options.js:
@lit/reactive-element/decorators/base.js:
@lit/reactive-element/decorators/query.js:
@lit/reactive-element/decorators/query-all.js:
@lit/reactive-element/decorators/query-async.js:
@lit/reactive-element/decorators/query-assigned-nodes.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-assigned-elements.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
//# sourceMappingURL=main.js.map
