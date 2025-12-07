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
  constructor(t5, e5, o6) {
    if (this._$cssResult$ = true, o6 !== s) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t5, this.t = e5;
  }
  get styleSheet() {
    let t5 = this.o;
    const s4 = this.t;
    if (e && void 0 === t5) {
      const e5 = void 0 !== s4 && 1 === s4.length;
      e5 && (t5 = o.get(s4)), void 0 === t5 && ((this.o = t5 = new CSSStyleSheet()).replaceSync(this.cssText), e5 && o.set(s4, t5));
    }
    return t5;
  }
  toString() {
    return this.cssText;
  }
};
var r = (t5) => new n("string" == typeof t5 ? t5 : t5 + "", void 0, s);
var i = (t5, ...e5) => {
  const o6 = 1 === t5.length ? t5[0] : e5.reduce(((e6, s4, o7) => e6 + ((t6) => {
    if (true === t6._$cssResult$) return t6.cssText;
    if ("number" == typeof t6) return t6;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + t6 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s4) + t5[o7 + 1]), t5[0]);
  return new n(o6, t5, s);
};
var S = (s4, o6) => {
  if (e) s4.adoptedStyleSheets = o6.map(((t5) => t5 instanceof CSSStyleSheet ? t5 : t5.styleSheet));
  else for (const e5 of o6) {
    const o7 = document.createElement("style"), n5 = t.litNonce;
    void 0 !== n5 && o7.setAttribute("nonce", n5), o7.textContent = e5.cssText, s4.appendChild(o7);
  }
};
var c = e ? (t5) => t5 : (t5) => t5 instanceof CSSStyleSheet ? ((t6) => {
  let e5 = "";
  for (const s4 of t6.cssRules) e5 += s4.cssText;
  return r(e5);
})(t5) : t5;

// node_modules/@lit/reactive-element/reactive-element.js
var { is: i2, defineProperty: e2, getOwnPropertyDescriptor: h, getOwnPropertyNames: r2, getOwnPropertySymbols: o2, getPrototypeOf: n2 } = Object;
var a = globalThis;
var c2 = a.trustedTypes;
var l = c2 ? c2.emptyScript : "";
var p = a.reactiveElementPolyfillSupport;
var d = (t5, s4) => t5;
var u = { toAttribute(t5, s4) {
  switch (s4) {
    case Boolean:
      t5 = t5 ? l : null;
      break;
    case Object:
    case Array:
      t5 = null == t5 ? t5 : JSON.stringify(t5);
  }
  return t5;
}, fromAttribute(t5, s4) {
  let i5 = t5;
  switch (s4) {
    case Boolean:
      i5 = null !== t5;
      break;
    case Number:
      i5 = null === t5 ? null : Number(t5);
      break;
    case Object:
    case Array:
      try {
        i5 = JSON.parse(t5);
      } catch (t6) {
        i5 = null;
      }
  }
  return i5;
} };
var f = (t5, s4) => !i2(t5, s4);
var b = { attribute: true, type: String, converter: u, reflect: false, useDefault: false, hasChanged: f };
Symbol.metadata ??= Symbol("metadata"), a.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var y = class extends HTMLElement {
  static addInitializer(t5) {
    this._$Ei(), (this.l ??= []).push(t5);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t5, s4 = b) {
    if (s4.state && (s4.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t5) && ((s4 = Object.create(s4)).wrapped = true), this.elementProperties.set(t5, s4), !s4.noAccessor) {
      const i5 = Symbol(), h3 = this.getPropertyDescriptor(t5, i5, s4);
      void 0 !== h3 && e2(this.prototype, t5, h3);
    }
  }
  static getPropertyDescriptor(t5, s4, i5) {
    const { get: e5, set: r6 } = h(this.prototype, t5) ?? { get() {
      return this[s4];
    }, set(t6) {
      this[s4] = t6;
    } };
    return { get: e5, set(s5) {
      const h3 = e5?.call(this);
      r6?.call(this, s5), this.requestUpdate(t5, h3, i5);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t5) {
    return this.elementProperties.get(t5) ?? b;
  }
  static _$Ei() {
    if (this.hasOwnProperty(d("elementProperties"))) return;
    const t5 = n2(this);
    t5.finalize(), void 0 !== t5.l && (this.l = [...t5.l]), this.elementProperties = new Map(t5.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(d("finalized"))) return;
    if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d("properties"))) {
      const t6 = this.properties, s4 = [...r2(t6), ...o2(t6)];
      for (const i5 of s4) this.createProperty(i5, t6[i5]);
    }
    const t5 = this[Symbol.metadata];
    if (null !== t5) {
      const s4 = litPropertyMetadata.get(t5);
      if (void 0 !== s4) for (const [t6, i5] of s4) this.elementProperties.set(t6, i5);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t6, s4] of this.elementProperties) {
      const i5 = this._$Eu(t6, s4);
      void 0 !== i5 && this._$Eh.set(i5, t6);
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
  static _$Eu(t5, s4) {
    const i5 = s4.attribute;
    return false === i5 ? void 0 : "string" == typeof i5 ? i5 : "string" == typeof t5 ? t5.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise(((t5) => this.enableUpdating = t5)), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach(((t5) => t5(this)));
  }
  addController(t5) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t5), void 0 !== this.renderRoot && this.isConnected && t5.hostConnected?.();
  }
  removeController(t5) {
    this._$EO?.delete(t5);
  }
  _$E_() {
    const t5 = /* @__PURE__ */ new Map(), s4 = this.constructor.elementProperties;
    for (const i5 of s4.keys()) this.hasOwnProperty(i5) && (t5.set(i5, this[i5]), delete this[i5]);
    t5.size > 0 && (this._$Ep = t5);
  }
  createRenderRoot() {
    const t5 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return S(t5, this.constructor.elementStyles), t5;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(true), this._$EO?.forEach(((t5) => t5.hostConnected?.()));
  }
  enableUpdating(t5) {
  }
  disconnectedCallback() {
    this._$EO?.forEach(((t5) => t5.hostDisconnected?.()));
  }
  attributeChangedCallback(t5, s4, i5) {
    this._$AK(t5, i5);
  }
  _$ET(t5, s4) {
    const i5 = this.constructor.elementProperties.get(t5), e5 = this.constructor._$Eu(t5, i5);
    if (void 0 !== e5 && true === i5.reflect) {
      const h3 = (void 0 !== i5.converter?.toAttribute ? i5.converter : u).toAttribute(s4, i5.type);
      this._$Em = t5, null == h3 ? this.removeAttribute(e5) : this.setAttribute(e5, h3), this._$Em = null;
    }
  }
  _$AK(t5, s4) {
    const i5 = this.constructor, e5 = i5._$Eh.get(t5);
    if (void 0 !== e5 && this._$Em !== e5) {
      const t6 = i5.getPropertyOptions(e5), h3 = "function" == typeof t6.converter ? { fromAttribute: t6.converter } : void 0 !== t6.converter?.fromAttribute ? t6.converter : u;
      this._$Em = e5;
      const r6 = h3.fromAttribute(s4, t6.type);
      this[e5] = r6 ?? this._$Ej?.get(e5) ?? r6, this._$Em = null;
    }
  }
  requestUpdate(t5, s4, i5) {
    if (void 0 !== t5) {
      const e5 = this.constructor, h3 = this[t5];
      if (i5 ??= e5.getPropertyOptions(t5), !((i5.hasChanged ?? f)(h3, s4) || i5.useDefault && i5.reflect && h3 === this._$Ej?.get(t5) && !this.hasAttribute(e5._$Eu(t5, i5)))) return;
      this.C(t5, s4, i5);
    }
    false === this.isUpdatePending && (this._$ES = this._$EP());
  }
  C(t5, s4, { useDefault: i5, reflect: e5, wrapped: h3 }, r6) {
    i5 && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t5) && (this._$Ej.set(t5, r6 ?? s4 ?? this[t5]), true !== h3 || void 0 !== r6) || (this._$AL.has(t5) || (this.hasUpdated || i5 || (s4 = void 0), this._$AL.set(t5, s4)), true === e5 && this._$Em !== t5 && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t5));
  }
  async _$EP() {
    this.isUpdatePending = true;
    try {
      await this._$ES;
    } catch (t6) {
      Promise.reject(t6);
    }
    const t5 = this.scheduleUpdate();
    return null != t5 && await t5, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [t7, s5] of this._$Ep) this[t7] = s5;
        this._$Ep = void 0;
      }
      const t6 = this.constructor.elementProperties;
      if (t6.size > 0) for (const [s5, i5] of t6) {
        const { wrapped: t7 } = i5, e5 = this[s5];
        true !== t7 || this._$AL.has(s5) || void 0 === e5 || this.C(s5, void 0, i5, e5);
      }
    }
    let t5 = false;
    const s4 = this._$AL;
    try {
      t5 = this.shouldUpdate(s4), t5 ? (this.willUpdate(s4), this._$EO?.forEach(((t6) => t6.hostUpdate?.())), this.update(s4)) : this._$EM();
    } catch (s5) {
      throw t5 = false, this._$EM(), s5;
    }
    t5 && this._$AE(s4);
  }
  willUpdate(t5) {
  }
  _$AE(t5) {
    this._$EO?.forEach(((t6) => t6.hostUpdated?.())), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t5)), this.updated(t5);
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
  shouldUpdate(t5) {
    return true;
  }
  update(t5) {
    this._$Eq &&= this._$Eq.forEach(((t6) => this._$ET(t6, this[t6]))), this._$EM();
  }
  updated(t5) {
  }
  firstUpdated(t5) {
  }
};
y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[d("elementProperties")] = /* @__PURE__ */ new Map(), y[d("finalized")] = /* @__PURE__ */ new Map(), p?.({ ReactiveElement: y }), (a.reactiveElementVersions ??= []).push("2.1.1");

// node_modules/lit-html/lit-html.js
var t2 = globalThis;
var i3 = t2.trustedTypes;
var s2 = i3 ? i3.createPolicy("lit-html", { createHTML: (t5) => t5 }) : void 0;
var e3 = "$lit$";
var h2 = `lit$${Math.random().toFixed(9).slice(2)}$`;
var o3 = "?" + h2;
var n3 = `<${o3}>`;
var r3 = document;
var l2 = () => r3.createComment("");
var c3 = (t5) => null === t5 || "object" != typeof t5 && "function" != typeof t5;
var a2 = Array.isArray;
var u2 = (t5) => a2(t5) || "function" == typeof t5?.[Symbol.iterator];
var d2 = "[ 	\n\f\r]";
var f2 = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var v = /-->/g;
var _ = />/g;
var m = RegExp(`>|${d2}(?:([^\\s"'>=/]+)(${d2}*=${d2}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
var p2 = /'/g;
var g = /"/g;
var $ = /^(?:script|style|textarea|title)$/i;
var y2 = (t5) => (i5, ...s4) => ({ _$litType$: t5, strings: i5, values: s4 });
var x = y2(1);
var b2 = y2(2);
var w = y2(3);
var T = Symbol.for("lit-noChange");
var E = Symbol.for("lit-nothing");
var A = /* @__PURE__ */ new WeakMap();
var C = r3.createTreeWalker(r3, 129);
function P(t5, i5) {
  if (!a2(t5) || !t5.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== s2 ? s2.createHTML(i5) : i5;
}
var V = (t5, i5) => {
  const s4 = t5.length - 1, o6 = [];
  let r6, l3 = 2 === i5 ? "<svg>" : 3 === i5 ? "<math>" : "", c4 = f2;
  for (let i6 = 0; i6 < s4; i6++) {
    const s5 = t5[i6];
    let a3, u3, d3 = -1, y3 = 0;
    for (; y3 < s5.length && (c4.lastIndex = y3, u3 = c4.exec(s5), null !== u3); ) y3 = c4.lastIndex, c4 === f2 ? "!--" === u3[1] ? c4 = v : void 0 !== u3[1] ? c4 = _ : void 0 !== u3[2] ? ($.test(u3[2]) && (r6 = RegExp("</" + u3[2], "g")), c4 = m) : void 0 !== u3[3] && (c4 = m) : c4 === m ? ">" === u3[0] ? (c4 = r6 ?? f2, d3 = -1) : void 0 === u3[1] ? d3 = -2 : (d3 = c4.lastIndex - u3[2].length, a3 = u3[1], c4 = void 0 === u3[3] ? m : '"' === u3[3] ? g : p2) : c4 === g || c4 === p2 ? c4 = m : c4 === v || c4 === _ ? c4 = f2 : (c4 = m, r6 = void 0);
    const x2 = c4 === m && t5[i6 + 1].startsWith("/>") ? " " : "";
    l3 += c4 === f2 ? s5 + n3 : d3 >= 0 ? (o6.push(a3), s5.slice(0, d3) + e3 + s5.slice(d3) + h2 + x2) : s5 + h2 + (-2 === d3 ? i6 : x2);
  }
  return [P(t5, l3 + (t5[s4] || "<?>") + (2 === i5 ? "</svg>" : 3 === i5 ? "</math>" : "")), o6];
};
var N = class _N {
  constructor({ strings: t5, _$litType$: s4 }, n5) {
    let r6;
    this.parts = [];
    let c4 = 0, a3 = 0;
    const u3 = t5.length - 1, d3 = this.parts, [f3, v2] = V(t5, s4);
    if (this.el = _N.createElement(f3, n5), C.currentNode = this.el.content, 2 === s4 || 3 === s4) {
      const t6 = this.el.content.firstChild;
      t6.replaceWith(...t6.childNodes);
    }
    for (; null !== (r6 = C.nextNode()) && d3.length < u3; ) {
      if (1 === r6.nodeType) {
        if (r6.hasAttributes()) for (const t6 of r6.getAttributeNames()) if (t6.endsWith(e3)) {
          const i5 = v2[a3++], s5 = r6.getAttribute(t6).split(h2), e5 = /([.?@])?(.*)/.exec(i5);
          d3.push({ type: 1, index: c4, name: e5[2], strings: s5, ctor: "." === e5[1] ? H : "?" === e5[1] ? I : "@" === e5[1] ? L : k }), r6.removeAttribute(t6);
        } else t6.startsWith(h2) && (d3.push({ type: 6, index: c4 }), r6.removeAttribute(t6));
        if ($.test(r6.tagName)) {
          const t6 = r6.textContent.split(h2), s5 = t6.length - 1;
          if (s5 > 0) {
            r6.textContent = i3 ? i3.emptyScript : "";
            for (let i5 = 0; i5 < s5; i5++) r6.append(t6[i5], l2()), C.nextNode(), d3.push({ type: 2, index: ++c4 });
            r6.append(t6[s5], l2());
          }
        }
      } else if (8 === r6.nodeType) if (r6.data === o3) d3.push({ type: 2, index: c4 });
      else {
        let t6 = -1;
        for (; -1 !== (t6 = r6.data.indexOf(h2, t6 + 1)); ) d3.push({ type: 7, index: c4 }), t6 += h2.length - 1;
      }
      c4++;
    }
  }
  static createElement(t5, i5) {
    const s4 = r3.createElement("template");
    return s4.innerHTML = t5, s4;
  }
};
function S2(t5, i5, s4 = t5, e5) {
  if (i5 === T) return i5;
  let h3 = void 0 !== e5 ? s4._$Co?.[e5] : s4._$Cl;
  const o6 = c3(i5) ? void 0 : i5._$litDirective$;
  return h3?.constructor !== o6 && (h3?._$AO?.(false), void 0 === o6 ? h3 = void 0 : (h3 = new o6(t5), h3._$AT(t5, s4, e5)), void 0 !== e5 ? (s4._$Co ??= [])[e5] = h3 : s4._$Cl = h3), void 0 !== h3 && (i5 = S2(t5, h3._$AS(t5, i5.values), h3, e5)), i5;
}
var M = class {
  constructor(t5, i5) {
    this._$AV = [], this._$AN = void 0, this._$AD = t5, this._$AM = i5;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t5) {
    const { el: { content: i5 }, parts: s4 } = this._$AD, e5 = (t5?.creationScope ?? r3).importNode(i5, true);
    C.currentNode = e5;
    let h3 = C.nextNode(), o6 = 0, n5 = 0, l3 = s4[0];
    for (; void 0 !== l3; ) {
      if (o6 === l3.index) {
        let i6;
        2 === l3.type ? i6 = new R(h3, h3.nextSibling, this, t5) : 1 === l3.type ? i6 = new l3.ctor(h3, l3.name, l3.strings, this, t5) : 6 === l3.type && (i6 = new z(h3, this, t5)), this._$AV.push(i6), l3 = s4[++n5];
      }
      o6 !== l3?.index && (h3 = C.nextNode(), o6++);
    }
    return C.currentNode = r3, e5;
  }
  p(t5) {
    let i5 = 0;
    for (const s4 of this._$AV) void 0 !== s4 && (void 0 !== s4.strings ? (s4._$AI(t5, s4, i5), i5 += s4.strings.length - 2) : s4._$AI(t5[i5])), i5++;
  }
};
var R = class _R {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t5, i5, s4, e5) {
    this.type = 2, this._$AH = E, this._$AN = void 0, this._$AA = t5, this._$AB = i5, this._$AM = s4, this.options = e5, this._$Cv = e5?.isConnected ?? true;
  }
  get parentNode() {
    let t5 = this._$AA.parentNode;
    const i5 = this._$AM;
    return void 0 !== i5 && 11 === t5?.nodeType && (t5 = i5.parentNode), t5;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t5, i5 = this) {
    t5 = S2(this, t5, i5), c3(t5) ? t5 === E || null == t5 || "" === t5 ? (this._$AH !== E && this._$AR(), this._$AH = E) : t5 !== this._$AH && t5 !== T && this._(t5) : void 0 !== t5._$litType$ ? this.$(t5) : void 0 !== t5.nodeType ? this.T(t5) : u2(t5) ? this.k(t5) : this._(t5);
  }
  O(t5) {
    return this._$AA.parentNode.insertBefore(t5, this._$AB);
  }
  T(t5) {
    this._$AH !== t5 && (this._$AR(), this._$AH = this.O(t5));
  }
  _(t5) {
    this._$AH !== E && c3(this._$AH) ? this._$AA.nextSibling.data = t5 : this.T(r3.createTextNode(t5)), this._$AH = t5;
  }
  $(t5) {
    const { values: i5, _$litType$: s4 } = t5, e5 = "number" == typeof s4 ? this._$AC(t5) : (void 0 === s4.el && (s4.el = N.createElement(P(s4.h, s4.h[0]), this.options)), s4);
    if (this._$AH?._$AD === e5) this._$AH.p(i5);
    else {
      const t6 = new M(e5, this), s5 = t6.u(this.options);
      t6.p(i5), this.T(s5), this._$AH = t6;
    }
  }
  _$AC(t5) {
    let i5 = A.get(t5.strings);
    return void 0 === i5 && A.set(t5.strings, i5 = new N(t5)), i5;
  }
  k(t5) {
    a2(this._$AH) || (this._$AH = [], this._$AR());
    const i5 = this._$AH;
    let s4, e5 = 0;
    for (const h3 of t5) e5 === i5.length ? i5.push(s4 = new _R(this.O(l2()), this.O(l2()), this, this.options)) : s4 = i5[e5], s4._$AI(h3), e5++;
    e5 < i5.length && (this._$AR(s4 && s4._$AB.nextSibling, e5), i5.length = e5);
  }
  _$AR(t5 = this._$AA.nextSibling, i5) {
    for (this._$AP?.(false, true, i5); t5 !== this._$AB; ) {
      const i6 = t5.nextSibling;
      t5.remove(), t5 = i6;
    }
  }
  setConnected(t5) {
    void 0 === this._$AM && (this._$Cv = t5, this._$AP?.(t5));
  }
};
var k = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t5, i5, s4, e5, h3) {
    this.type = 1, this._$AH = E, this._$AN = void 0, this.element = t5, this.name = i5, this._$AM = e5, this.options = h3, s4.length > 2 || "" !== s4[0] || "" !== s4[1] ? (this._$AH = Array(s4.length - 1).fill(new String()), this.strings = s4) : this._$AH = E;
  }
  _$AI(t5, i5 = this, s4, e5) {
    const h3 = this.strings;
    let o6 = false;
    if (void 0 === h3) t5 = S2(this, t5, i5, 0), o6 = !c3(t5) || t5 !== this._$AH && t5 !== T, o6 && (this._$AH = t5);
    else {
      const e6 = t5;
      let n5, r6;
      for (t5 = h3[0], n5 = 0; n5 < h3.length - 1; n5++) r6 = S2(this, e6[s4 + n5], i5, n5), r6 === T && (r6 = this._$AH[n5]), o6 ||= !c3(r6) || r6 !== this._$AH[n5], r6 === E ? t5 = E : t5 !== E && (t5 += (r6 ?? "") + h3[n5 + 1]), this._$AH[n5] = r6;
    }
    o6 && !e5 && this.j(t5);
  }
  j(t5) {
    t5 === E ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t5 ?? "");
  }
};
var H = class extends k {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t5) {
    this.element[this.name] = t5 === E ? void 0 : t5;
  }
};
var I = class extends k {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t5) {
    this.element.toggleAttribute(this.name, !!t5 && t5 !== E);
  }
};
var L = class extends k {
  constructor(t5, i5, s4, e5, h3) {
    super(t5, i5, s4, e5, h3), this.type = 5;
  }
  _$AI(t5, i5 = this) {
    if ((t5 = S2(this, t5, i5, 0) ?? E) === T) return;
    const s4 = this._$AH, e5 = t5 === E && s4 !== E || t5.capture !== s4.capture || t5.once !== s4.once || t5.passive !== s4.passive, h3 = t5 !== E && (s4 === E || e5);
    e5 && this.element.removeEventListener(this.name, this, s4), h3 && this.element.addEventListener(this.name, this, t5), this._$AH = t5;
  }
  handleEvent(t5) {
    "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t5) : this._$AH.handleEvent(t5);
  }
};
var z = class {
  constructor(t5, i5, s4) {
    this.element = t5, this.type = 6, this._$AN = void 0, this._$AM = i5, this.options = s4;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t5) {
    S2(this, t5);
  }
};
var j = t2.litHtmlPolyfillSupport;
j?.(N, R), (t2.litHtmlVersions ??= []).push("3.3.1");
var B = (t5, i5, s4) => {
  const e5 = s4?.renderBefore ?? i5;
  let h3 = e5._$litPart$;
  if (void 0 === h3) {
    const t6 = s4?.renderBefore ?? null;
    e5._$litPart$ = h3 = new R(i5.insertBefore(l2(), t6), t6, void 0, s4 ?? {});
  }
  return h3._$AI(t5), h3;
};

// node_modules/lit-element/lit-element.js
var s3 = globalThis;
var i4 = class extends y {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t5 = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t5.firstChild, t5;
  }
  update(t5) {
    const r6 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t5), this._$Do = B(r6, this.renderRoot, this.renderOptions);
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
var t3 = (t5) => (e5, o6) => {
  void 0 !== o6 ? o6.addInitializer((() => {
    customElements.define(t5, e5);
  })) : customElements.define(t5, e5);
};

// node_modules/@lit/reactive-element/decorators/property.js
var o5 = { attribute: true, type: String, converter: u, reflect: false, hasChanged: f };
var r4 = (t5 = o5, e5, r6) => {
  const { kind: n5, metadata: i5 } = r6;
  let s4 = globalThis.litPropertyMetadata.get(i5);
  if (void 0 === s4 && globalThis.litPropertyMetadata.set(i5, s4 = /* @__PURE__ */ new Map()), "setter" === n5 && ((t5 = Object.create(t5)).wrapped = true), s4.set(r6.name, t5), "accessor" === n5) {
    const { name: o6 } = r6;
    return { set(r7) {
      const n6 = e5.get.call(this);
      e5.set.call(this, r7), this.requestUpdate(o6, n6, t5);
    }, init(e6) {
      return void 0 !== e6 && this.C(o6, void 0, t5, e6), e6;
    } };
  }
  if ("setter" === n5) {
    const { name: o6 } = r6;
    return function(r7) {
      const n6 = this[o6];
      e5.call(this, r7), this.requestUpdate(o6, n6, t5);
    };
  }
  throw Error("Unsupported decorator location: " + n5);
};
function n4(t5) {
  return (e5, o6) => "object" == typeof o6 ? r4(t5, e5, o6) : ((t6, e6, o7) => {
    const r6 = e6.hasOwnProperty(o7);
    return e6.constructor.createProperty(o7, t6), r6 ? Object.getOwnPropertyDescriptor(e6, o7) : void 0;
  })(t5, e5, o6);
}

// node_modules/@lit/reactive-element/decorators/state.js
function r5(r6) {
  return n4({ ...r6, state: true, attribute: false });
}

// src/formatting.ts
var FALLBACK_WEEKDAY_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];
var translateWithFallback = (localize, key, fallback, ...args) => {
  const value = localize(key, ...args);
  return value === key ? fallback : value;
};
var getWeekdayLabels = (localize) => FALLBACK_WEEKDAY_FULL.map(
  (fallback, index) => translateWithFallback(
    localize,
    `component.maint.recurrence.weekday_full.${index}`,
    fallback
  )
);
var toMondayIndex = (sundayIndex) => (sundayIndex + 6) % 7;
var parseIsoDate = (value) => {
  const [year, month, day] = value.toString().split("T")[0].split("-").map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return null;
  }
  return new Date(year, month - 1, day);
};
var formatIsoDate = (value) => `${value.getFullYear().toString().padStart(4, "0")}-${(value.getMonth() + 1).toString().padStart(2, "0")}-${value.getDate().toString().padStart(2, "0")}`;
var getLocaleCode = (hass) => hass?.locale?.language ?? hass?.language;
var formatNumber = (value, minimumIntegerDigits, locale) => {
  try {
    return new Intl.NumberFormat(locale, {
      minimumIntegerDigits,
      useGrouping: false
    }).format(value);
  } catch {
    return value.toString().padStart(minimumIntegerDigits, "0");
  }
};
var formatOrderedDate = (value, locale, order, separator) => {
  const parts = {
    day: formatNumber(value.getDate(), 2, locale),
    month: formatNumber(value.getMonth() + 1, 2, locale),
    year: formatNumber(value.getFullYear(), 4, locale)
  };
  return order.map((part) => parts[part]).join(separator);
};
var formatWithUserDateFormat = (value, hass) => {
  const locale = getLocaleCode(hass);
  const format = hass?.locale?.date_format?.toLowerCase();
  switch (format) {
    case "dmy":
      return formatOrderedDate(value, locale, ["day", "month", "year"], "/");
    case "mdy":
      return formatOrderedDate(value, locale, ["month", "day", "year"], "/");
    case "ymd":
    case "iso":
      return formatOrderedDate(value, locale, ["year", "month", "day"], "-");
    default:
      try {
        return new Intl.DateTimeFormat(locale, {
          year: "numeric",
          month: "numeric",
          day: "numeric"
        }).format(value);
      } catch {
        return value.toLocaleDateString();
      }
  }
};
var formatDatePlaceholder = (hass) => {
  const sample = new Date(2024, 0, 31);
  return formatWithUserDateFormat(sample, hass);
};
var toOrder = (format) => {
  switch (format?.toLowerCase()) {
    case "dmy":
      return ["day", "month", "year"];
    case "mdy":
      return ["month", "day", "year"];
    case "ymd":
    case "iso":
      return ["year", "month", "day"];
    default:
      return null;
  }
};
var parseUserDate = (value, hass) => {
  const order = toOrder(hass?.locale?.date_format);
  if (!order) {
    return null;
  }
  const parts = value.split(/[^0-9]/).filter(Boolean);
  if (parts.length !== 3) {
    return null;
  }
  const [first, second, third] = parts.map(Number);
  if ([first, second, third].some((part) => Number.isNaN(part))) {
    return null;
  }
  const mapping = {
    [order[0]]: first,
    [order[1]]: second,
    [order[2]]: third
  };
  const year = mapping.year;
  const month = mapping.month;
  const day = mapping.day;
  if (!year || !month || !day) {
    return null;
  }
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() !== year || parsed.getMonth() + 1 !== month || parsed.getDate() !== day) {
    return null;
  }
  return formatIsoDate(parsed);
};
var parseDate = (value, hass) => {
  if (value === null || value === void 0) {
    return null;
  }
  const trimmed = value.toString().trim();
  if (!trimmed) {
    return null;
  }
  const userFormatted = parseUserDate(trimmed, hass);
  if (userFormatted) {
    return userFormatted;
  }
  const isoParsed = parseIsoDate(trimmed);
  if (isoParsed) {
    return formatIsoDate(isoParsed);
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return formatIsoDate(parsed);
};
var formatDate = (value, hass) => {
  if (!value) {
    return "\u2014";
  }
  const parsed = parseIsoDate(value);
  if (!parsed) {
    return "\u2014";
  }
  return formatWithUserDateFormat(parsed, hass);
};
var formatDateInput = (value, hass) => {
  if (!value) {
    return "";
  }
  const parsed = parseIsoDate(value);
  if (!parsed) {
    return "";
  }
  const order = toOrder(hass?.locale?.date_format);
  if (!order) {
    return formatIsoDate(parsed);
  }
  const separator = order[0] === "year" ? "-" : "/";
  return formatOrderedDate(parsed, getLocaleCode(hass), order, separator);
};
var normalizeWeekdays = (days) => Array.from(new Set(days)).sort((a3, b3) => a3 - b3);
var getUnitLabel = (unit, count, localize) => {
  const keyBase = unit === "days" ? count === 1 ? "component.maint.recurrence.unit.day_one" : "component.maint.recurrence.unit.day_other" : unit === "weeks" ? count === 1 ? "component.maint.recurrence.unit.week_one" : "component.maint.recurrence.unit.week_other" : count === 1 ? "component.maint.recurrence.unit.month_one" : "component.maint.recurrence.unit.month_other";
  const fallback = unit === "days" ? count === 1 ? "day" : "days" : unit === "weeks" ? count === 1 ? "week" : "weeks" : count === 1 ? "month" : "months";
  return translateWithFallback(localize, keyBase, fallback, "count", count);
};
var formatDayList = (days, localize) => {
  const labels = getWeekdayLabels(localize);
  return normalizeWeekdays(days).map((day) => labels[day] ?? day.toString()).join(", ");
};
var formatRecurrence = (recurrence, localize) => {
  switch (recurrence.type) {
    case "interval": {
      const count = recurrence.every ?? 0;
      const unitLabel = getUnitLabel(recurrence.unit, count, localize);
      if (recurrence.unit === "days" && count === 1) {
        return translateWithFallback(
          localize,
          "component.maint.recurrence.every_day",
          "Every day"
        );
      }
      return translateWithFallback(
        localize,
        "component.maint.recurrence.every_interval",
        `Every ${count} ${unitLabel}`,
        "count",
        count,
        "unit",
        unitLabel
      );
    }
    case "weekly": {
      const every = Math.max(1, recurrence.every ?? 1);
      const labels = formatDayList(recurrence.days, localize);
      if (every === 1) {
        return translateWithFallback(
          localize,
          "component.maint.recurrence.weekly_on",
          `Weekly on ${labels}`,
          "days",
          labels
        );
      }
      return translateWithFallback(
        localize,
        "component.maint.recurrence.weekly_every_on",
        `Every ${every} weeks on ${labels}`,
        "count",
        every,
        "days",
        labels
      );
    }
    default:
      return "\u2014";
  }
};
var computeNextSchedule = (lastCompleted, recurrence) => {
  switch (recurrence.type) {
    case "interval": {
      const every = recurrence.every ?? 0;
      if (every <= 0) {
        return null;
      }
      const next = new Date(lastCompleted.getTime());
      if (recurrence.unit === "weeks") {
        next.setDate(next.getDate() + every * 7);
      } else if (recurrence.unit === "months") {
        const originalDay = next.getDate();
        next.setMonth(next.getMonth() + every);
        if (next.getDate() !== originalDay) {
          next.setDate(0);
        }
      } else {
        next.setDate(next.getDate() + every);
      }
      return next;
    }
    case "weekly": {
      const days = normalizeWeekdays(recurrence.days);
      if (days.length === 0) {
        return null;
      }
      const everyWeeks = Math.max(1, recurrence.every ?? 1);
      const weekStart = new Date(
        lastCompleted.getFullYear(),
        lastCompleted.getMonth(),
        lastCompleted.getDate()
      );
      weekStart.setDate(weekStart.getDate() - toMondayIndex(lastCompleted.getDay()));
      const findInWeek = (start) => {
        for (const day of days) {
          const candidate = new Date(start.getTime());
          candidate.setDate(start.getDate() + day);
          if (candidate > lastCompleted) {
            return candidate;
          }
        }
        return null;
      };
      const firstCandidate = findInWeek(weekStart);
      if (firstCandidate) {
        return firstCandidate;
      }
      let weeksAhead = everyWeeks;
      while (true) {
        const start = new Date(weekStart.getTime());
        start.setDate(start.getDate() + weeksAhead * 7);
        const candidate = findInWeek(start);
        if (candidate) {
          return candidate;
        }
        weeksAhead += everyWeeks;
      }
    }
    default:
      return null;
  }
};
var nextScheduled = (task) => {
  if (!task) {
    return null;
  }
  if (task.last_completed && task.recurrence) {
    const parsed = parseIsoDate(task.last_completed);
    if (parsed) {
      const next = computeNextSchedule(parsed, task.recurrence);
      if (next) {
        return formatIsoDate(next);
      }
    }
  }
  return task.next_scheduled ?? null;
};

// src/task/date.ts
var currentDateIso = () => {
  const today = /* @__PURE__ */ new Date();
  const year = today.getFullYear().toString().padStart(4, "0");
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const day = today.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};
var currentDateInputValue = (hass) => formatDateInput(currentDateIso(), hass);
var localeCode = (hass) => getLocaleCode(hass);

// src/date-picker/view.ts
var MaintDatePicker = class extends i4 {
  constructor() {
    super(...arguments);
    this.open = false;
    this.value = null;
    this.weekStart = 1;
    this.visibleMonth = this.startOfMonth(this.todayDate());
  }
  createRenderRoot() {
    return this;
  }
  willUpdate(changed) {
    if (changed.has("value") && this.value) {
      const parsed = parseIsoDate(this.value);
      if (parsed) {
        this.visibleMonth = this.startOfMonth(parsed);
      }
    }
  }
  render() {
    if (!this.open) {
      return E;
    }
    const locale = this.locale;
    const today = this.todayDate();
    const selected = this.parseSelectedDate() ?? today;
    const monthLabel = this.formatMonthLabel(this.visibleMonth, locale);
    const weekStart = this.weekStart ?? this.firstWeekday(locale);
    const weekdayLabels = this.weekdayLabels(locale, weekStart);
    const startOffset = (this.visibleMonth.getDay() - weekStart + 7) % 7;
    const start = new Date(this.visibleMonth);
    start.setDate(1 - startOffset);
    const days = Array.from({ length: 42 }, (_2, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        date,
        inMonth: date.getMonth() === this.visibleMonth.getMonth(),
        isToday: this.isSameDay(date, today),
        isSelected: this.isSameDay(date, selected)
      };
    });
    return x`
      <div class="date-picker-popup date-picker-surface">
        <div class="date-picker-header">
          <button
            type="button"
            class="icon-button"
            aria-label="Previous month"
            @click=${() => this.changeMonth(-1)}
          >
            <ha-icon icon="mdi:chevron-left" aria-hidden="true"></ha-icon>
          </button>
          <div class="date-picker-month">${monthLabel}</div>
          <button
            type="button"
            class="icon-button"
            aria-label="Next month"
            @click=${() => this.changeMonth(1)}
          >
            <ha-icon icon="mdi:chevron-right" aria-hidden="true"></ha-icon>
          </button>
        </div>
        <div class="date-picker-weekdays">
          ${weekdayLabels.map((label) => x`<span>${label}</span>`)}
        </div>
        <div class="date-picker-grid">
          ${days.map(
      (day) => x`
              <button
                type="button"
                class=${this.dayClass(day)}
                aria-label=${this.formatDayAria(day.date, locale)}
                @click=${() => this.selectDate(day.date)}
              >
                ${day.date.getDate()}
              </button>
            `
    )}
        </div>
      </div>
    `;
  }
  todayDate() {
    const now = /* @__PURE__ */ new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  parseSelectedDate() {
    if (!this.value) {
      return null;
    }
    return parseIsoDate(this.value);
  }
  startOfMonth(value) {
    return new Date(value.getFullYear(), value.getMonth(), 1);
  }
  isSameDay(a3, b3) {
    return a3.getFullYear() === b3.getFullYear() && a3.getMonth() === b3.getMonth() && a3.getDate() === b3.getDate();
  }
  formatMonthLabel(value, locale) {
    try {
      return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(value);
    } catch {
      return `${value.toLocaleString(void 0, { month: "long" })} ${value.getFullYear()}`;
    }
  }
  firstWeekday(locale) {
    const intlLocale = Intl.Locale;
    if (intlLocale) {
      try {
        const info = new intlLocale(locale ?? "en");
        const first = info.weekInfo?.firstDay;
        if (typeof first === "number") {
          return first;
        }
      } catch {
      }
    }
    const code = (locale ?? "").toLowerCase();
    if (code.startsWith("en-us")) {
      return 0;
    }
    return 1;
  }
  weekdayLabels(locale, weekStart) {
    const base = new Date(2024, 0, 1);
    const labels = Array.from({ length: 7 }, (_2, index) => {
      const day = new Date(base);
      day.setDate(base.getDate() + index);
      try {
        return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(day);
      } catch {
        return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index];
      }
    });
    const rotated = labels.slice(weekStart).concat(labels.slice(0, weekStart));
    return rotated;
  }
  dayClass(day) {
    let className = "date-picker-day";
    if (!day.inMonth) {
      className += " muted";
    }
    if (day.isToday) {
      className += " today";
    }
    if (day.isSelected) {
      className += " selected";
    }
    return className;
  }
  formatDayAria(date, locale) {
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date);
    } catch {
      return formatIsoDate(date);
    }
  }
  changeMonth(delta) {
    const next = new Date(this.visibleMonth);
    next.setMonth(next.getMonth() + delta);
    this.visibleMonth = this.startOfMonth(next);
  }
  selectDate(date) {
    const formatted = formatIsoDate(date);
    this.dispatchEvent(
      new CustomEvent("date-selected", {
        detail: { value: formatted },
        bubbles: true,
        composed: true
      })
    );
  }
};
__decorateClass([
  n4({ type: Boolean })
], MaintDatePicker.prototype, "open", 2);
__decorateClass([
  n4({ type: String })
], MaintDatePicker.prototype, "value", 2);
__decorateClass([
  n4({ type: String })
], MaintDatePicker.prototype, "locale", 2);
__decorateClass([
  n4({ type: Number })
], MaintDatePicker.prototype, "weekStart", 2);
__decorateClass([
  r5()
], MaintDatePicker.prototype, "visibleMonth", 2);
MaintDatePicker = __decorateClass([
  t3("maint-date-picker")
], MaintDatePicker);

// src/task/recurrence/view.ts
var t4 = (localize, key, fallback) => {
  if (!localize) {
    return fallback;
  }
  const value = localize(key);
  return value && value !== key ? value : fallback;
};
var renderRecurrenceFields = (type, recurrence, form, localize, disabled, onChange) => {
  const recurrenceType = type;
  const currentUnit = form?.interval_unit ?? (recurrence?.type === "interval" ? recurrence.unit : "days");
  const intervalEvery = form?.interval_every ?? (recurrence?.type === "interval" ? recurrence.every.toString() : "");
  const weeklyEvery = form?.weekly_every ?? (recurrence?.type === "weekly" ? (recurrence.every ?? 1).toString() : "1");
  const weeklyDays = form?.weekly_days ?? (recurrence?.type === "weekly" ? recurrence.days.map((day) => day.toString()) : []);
  if (recurrenceType === "interval") {
    return x`
      <div class="form-row grid-two-up" data-recurrence-type="interval" @change=${onChange}>
        <label>
          <span class="label-text">${t4(localize, "component.maint.panel.fields.interval_every", "Every")}</span>
          <input
            type="number"
            name="interval_every"
            min="1"
            required
            .value=${intervalEvery}
            ?disabled=${disabled}
          />
        </label>
        <label>
          <span class="label-text">${t4(localize, "component.maint.panel.fields.interval_unit", "Unit")}</span>
          <select name="interval_unit" .value=${currentUnit} ?disabled=${disabled}>
            <option value="days">${t4(localize, "component.maint.panel.interval_unit.days", "Days")}</option>
            <option value="weeks">${t4(localize, "component.maint.panel.interval_unit.weeks", "Weeks")}</option>
            <option value="months">${t4(localize, "component.maint.panel.interval_unit.months", "Months")}</option>
          </select>
        </label>
      </div>
    `;
  }
  if (recurrenceType === "weekly") {
    const weekdayGroup = [
      { value: "0", label: localize?.("component.maint.recurrence.weekday_short.0") ?? "Mon" },
      { value: "1", label: localize?.("component.maint.recurrence.weekday_short.1") ?? "Tue" },
      { value: "2", label: localize?.("component.maint.recurrence.weekday_short.2") ?? "Wed" },
      { value: "3", label: localize?.("component.maint.recurrence.weekday_short.3") ?? "Thu" },
      { value: "4", label: localize?.("component.maint.recurrence.weekday_short.4") ?? "Fri" }
    ];
    const weekendGroup = [
      { value: "5", label: localize?.("component.maint.recurrence.weekday_short.5") ?? "Sat" },
      { value: "6", label: localize?.("component.maint.recurrence.weekday_short.6") ?? "Sun" }
    ];
    return x`
      <div class="weekly-inline form-row grid-two-up" data-recurrence-type="weekly" @change=${onChange}>
        <label class="weekly-every">
          <span class="label-text">${t4(localize, "component.maint.panel.fields.every", "Every")}</span>
          <div class="weekly-every-input">
            <input
              class="weekly-every-field"
              type="number"
              name="weekly_every"
              min="1"
              required
              .value=${weeklyEvery}
              ?disabled=${disabled}
            />
            <span class="weeks-suffix">
              ${t4(localize, "component.maint.panel.fields.weeks_suffix", "week(s)")}
            </span>
          </div>
        </label>
        <div class="weekday-selection">
          <span class="label-text weekday-row-label">
            ${t4(localize, "component.maint.panel.fields.weekly_on", "On")}
          </span>
          <div class="weekday-row">
            ${weekdayGroup.concat(weekendGroup).map(
      (day) => x`<label class="weekday-chip">
                <input
                  type="checkbox"
                  name="weekly_days"
                  value=${day.value}
                  ?checked=${weeklyDays.includes(day.value)}
                  ?disabled=${disabled}
                />
                <span>${day.label}</span>
              </label>`
    )}
          </div>
        </div>
      </div>
    `;
  }
  return null;
};

// src/task/list/view.ts
var MaintTaskRow = class extends i4 {
  constructor() {
    super(...arguments);
    this.busy = false;
    this.editing = false;
    this.due = false;
  }
  createRenderRoot() {
    return this;
  }
  render() {
    if (!this.task || !this.panelText || !this.localizeText) {
      return E;
    }
    const task = this.task;
    const editLabel = this.panelText("buttons.edit");
    const completeLabel = this.panelText("buttons.mark_complete");
    const deleteLabel = this.panelText("buttons.delete");
    const actionsDisabled = this.busy || this.editing;
    const rowClass = this.due ? "task-row due" : "task-row";
    return x`
      <div class=${rowClass} data-task-row=${task.task_id} role="listitem">
        <div class="task-details">
          <div class="task-description-line">
            <div class="task-description">${task.description}</div>
            ${this.due ? x`<span class="pill pill-due">${this.panelText("labels.due")}</span>` : E}
          </div>
          <div class="task-meta">
            <div class="task-meta-column">
              <div class="task-meta-title">${this.panelText("labels.next_scheduled")}</div>
              <div class="task-meta-value">${formatDate(nextScheduled(task), this.hass)}</div>
            </div>
            <div class="task-meta-column">
              <div class="task-meta-title">${this.panelText("labels.schedule")}</div>
              <div class="task-meta-value">
                ${formatRecurrence(task.recurrence, this.localizeText.bind(this))}
              </div>
            </div>
          </div>
        </div>
        <div class="task-actions">
          <div class="action-buttons">
            <button
              type="button"
              class="icon-button complete-button tooltipped"
              data-task=${task.task_id}
              ?disabled=${actionsDisabled}
              aria-label=${completeLabel}
              title=${completeLabel}
              data-label=${completeLabel}
              @click=${this.handleComplete}
            >
              <ha-icon icon="mdi:check" aria-hidden="true"></ha-icon>
            </button>
            <button
              type="button"
              class="icon-button edit-task tooltipped"
              data-task=${task.task_id}
              ?disabled=${actionsDisabled}
              aria-label=${editLabel}
              title=${editLabel}
              data-label=${editLabel}
              @click=${this.handleEdit}
            >
              <ha-icon icon="mdi:pencil" aria-hidden="true"></ha-icon>
            </button>
            <button
              type="button"
              class="icon-button delete-task tooltipped"
              data-task=${task.task_id}
              aria-label=${deleteLabel}
              title=${deleteLabel}
              data-label=${deleteLabel}
              ?disabled=${actionsDisabled}
              @click=${this.handleDelete}
            >
              <ha-icon icon="mdi:delete-outline" aria-hidden="true"></ha-icon>
            </button>
          </div>
        </div>
      </div>
    `;
  }
  handleComplete() {
    if (!this.task) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("complete-task", {
        detail: { taskId: this.task.task_id },
        bubbles: true,
        composed: true
      })
    );
  }
  handleEdit() {
    if (!this.task) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("edit-task", {
        detail: { taskId: this.task.task_id },
        bubbles: true,
        composed: true
      })
    );
  }
  handleDelete() {
    if (!this.task) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("delete-task", {
        detail: { taskId: this.task.task_id },
        bubbles: true,
        composed: true
      })
    );
  }
};
__decorateClass([
  n4({ attribute: false })
], MaintTaskRow.prototype, "task", 2);
__decorateClass([
  n4({ attribute: false })
], MaintTaskRow.prototype, "hass", 2);
__decorateClass([
  n4({ type: Boolean })
], MaintTaskRow.prototype, "busy", 2);
__decorateClass([
  n4({ type: Boolean })
], MaintTaskRow.prototype, "editing", 2);
__decorateClass([
  n4({ type: Boolean })
], MaintTaskRow.prototype, "due", 2);
__decorateClass([
  n4({ attribute: false })
], MaintTaskRow.prototype, "panelText", 2);
__decorateClass([
  n4({ attribute: false })
], MaintTaskRow.prototype, "localizeText", 2);
MaintTaskRow = __decorateClass([
  t3("maint-task-row")
], MaintTaskRow);
var MaintTaskList = class extends i4 {
  constructor() {
    super(...arguments);
    this.tasks = [];
    this.busy = false;
    this.editing = false;
  }
  createRenderRoot() {
    return this;
  }
  render() {
    if (!this.panelText || !this.localizeText) {
      return E;
    }
    const hasTasks = this.tasks.length > 0;
    return x`
      ${!hasTasks ? x`<p class="info tasks-section-empty">${this.panelText("info_no_tasks")}</p>` : x`
            <div class="task-list" role="list">
              ${this.tasks.map(
      (task) => x`
                  <maint-task-row
                    .task=${task}
                    .hass=${this.hass}
                    .busy=${this.busy}
                    .editing=${this.editing}
                    .due=${this.isTaskDue(task)}
                    .panelText=${this.panelText}
                    .localizeText=${this.localizeText}
                    @complete-task=${(event) => this.forward("complete-task", event.detail)}
                    @edit-task=${(event) => this.forward("edit-task", event.detail)}
                    @delete-task=${(event) => this.forward("delete-task", event.detail)}
                  ></maint-task-row>
                `
    )}
            </div>
          `}
    `;
  }
  forward(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }
  isTaskDue(task) {
    const next = nextScheduled(task);
    if (!next) {
      return false;
    }
    const nextDate = parseIsoDate(next);
    if (!nextDate) {
      return false;
    }
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    return nextDate <= today;
  }
};
__decorateClass([
  n4({ attribute: false })
], MaintTaskList.prototype, "hass", 2);
__decorateClass([
  n4({ attribute: false })
], MaintTaskList.prototype, "tasks", 2);
__decorateClass([
  n4({ type: Boolean })
], MaintTaskList.prototype, "busy", 2);
__decorateClass([
  n4({ type: Boolean })
], MaintTaskList.prototype, "editing", 2);
__decorateClass([
  n4({ attribute: false })
], MaintTaskList.prototype, "panelText", 2);
__decorateClass([
  n4({ attribute: false })
], MaintTaskList.prototype, "localizeText", 2);
MaintTaskList = __decorateClass([
  t3("maint-task-list")
], MaintTaskList);

// src/task/index.ts
var DOMAIN = "maint";
var DEFAULT_ICON = "mdi:check-circle-outline";
var normalizeWeekdays2 = (days = []) => {
  const unique = Array.from(new Set(days));
  const sorted = unique.sort((a3, b3) => a3 - b3);
  return sorted;
};
var normalizeTask = (task) => ({
  ...task,
  recurrence: task.recurrence?.type === "weekly" ? {
    ...task.recurrence,
    every: task.recurrence.every ?? 1,
    days: normalizeWeekdays2(task.recurrence.days)
  } : task.recurrence
});
var toRecurrenceType = (value) => {
  const normalized = (value ?? "interval").toString();
  if (normalized === "interval" || normalized === "weekly") {
    return normalized;
  }
  return "interval";
};
var parsePositiveInt = (value) => {
  const parsed = Number((value ?? "").toString());
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return Math.floor(parsed);
};
var parseWeekdays = (value) => {
  const entries = Array.isArray(value) ? value : value === void 0 ? [] : [value];
  const parsed = entries.map((entry) => Number(entry)).filter((num) => Number.isInteger(num) && num >= 0 && num <= 6);
  const unique = Array.from(new Set(parsed)).sort((a3, b3) => a3 - b3);
  return unique.length ? unique : null;
};
var parseRecurrence = (fields, localize) => {
  const type = toRecurrenceType(fields.recurrence_type);
  if (type === "interval") {
    const every = parsePositiveInt(fields.interval_every);
    const unit = (fields.interval_unit ?? "").toString();
    if (!every) {
      return {
        ok: false,
        error: localize("component.maint.panel.validation.interval_every_required")
      };
    }
    if (unit !== "days" && unit !== "weeks" && unit !== "months") {
      return {
        ok: false,
        error: localize("component.maint.panel.validation.interval_unit_required")
      };
    }
    return { ok: true, value: { type: "interval", every, unit } };
  }
  if (type === "weekly") {
    const everyWeeks = parsePositiveInt(fields.weekly_every ?? "1");
    if (!everyWeeks) {
      return {
        ok: false,
        error: localize("component.maint.panel.validation.weekly_every_required")
      };
    }
    const days = parseWeekdays(fields.weekly_days);
    if (!days) {
      return {
        ok: false,
        error: localize("component.maint.panel.validation.weekly_days_required")
      };
    }
    if (everyWeeks === 1 && days.length === 7) {
      return { ok: true, value: { type: "interval", every: 1, unit: "days" } };
    }
    return { ok: true, value: { type: "weekly", every: everyWeeks, days } };
  }
  return { ok: false, error: localize("component.maint.panel.validation.schedule_required") };
};
var validateTaskFields = (fields, localize, hass) => {
  const description = (fields.description ?? "").toString().trim();
  if (!description) {
    return { error: localize("component.maint.panel.validation.description_required") };
  }
  const lastCompleted = parseDate(fields.last_completed, hass);
  if (lastCompleted === null) {
    return { error: localize("component.maint.panel.validation.last_completed_invalid") };
  }
  const recurrence = parseRecurrence(fields, localize);
  if (!recurrence.ok) {
    return { error: recurrence.error ?? localize("component.maint.panel.validation.schedule_required") };
  }
  const iconRaw = fields.icon;
  const icon = typeof iconRaw === "string" ? iconRaw.trim() : iconRaw === null ? null : void 0;
  const normalizedIcon = icon === "" ? null : icon ?? DEFAULT_ICON;
  return {
    values: {
      description,
      last_completed: lastCompleted,
      recurrence: recurrence.value,
      icon: normalizedIcon
    }
  };
};
var listEntries = (hass) => hass.callWS({
  type: "config_entries/get",
  domain: DOMAIN
});
var listTasks = async (hass, entryId) => {
  const tasks = await hass.callWS({
    type: "maint/task/list",
    entry_id: entryId
  });
  return tasks.map((task) => normalizeTask(task));
};
var createTask = async (hass, entryId, payload) => {
  const { icon, ...rest } = payload;
  const request = {
    type: "maint/task/create",
    entry_id: entryId,
    ...rest
  };
  if (icon !== void 0) {
    request.icon = icon;
  }
  const task = await hass.callWS(request);
  return normalizeTask(task);
};
var updateTask = async (hass, entryId, taskId, payload) => {
  const { icon, ...rest } = payload;
  const request = {
    type: "maint/task/update",
    entry_id: entryId,
    task_id: taskId,
    ...rest
  };
  if (icon !== void 0) {
    request.icon = icon;
  }
  const task = await hass.callWS(request);
  return normalizeTask(task);
};
var deleteTask = (hass, entryId, taskId) => hass.callWS({
  type: "maint/task/delete",
  entry_id: entryId,
  task_id: taskId
});

// src/task/list/feature.ts
var TaskListFeature = class extends EventTarget {
  constructor() {
    super(...arguments);
    this.tasks = [];
    this.entryId = null;
    this.busy = false;
    this.editing = false;
    this.panelText = null;
    this.localizeText = null;
    this.handleEdit = (event) => {
      const taskId = event.detail?.taskId;
      if (!taskId) {
        return;
      }
      this.dispatchEvent(new CustomEvent("task-edit", { detail: { taskId } }));
    };
    this.handleDelete = (event) => {
      const taskId = event.detail?.taskId;
      if (!taskId) {
        return;
      }
      this.dispatchEvent(new CustomEvent("task-delete", { detail: { taskId } }));
    };
    this.handleComplete = (event) => {
      const taskId = event.detail?.taskId;
      if (!taskId || !this.entryId || !this.hass) {
        return;
      }
      const task = this.tasks.find((item) => item.task_id === taskId);
      if (!task) {
        return;
      }
      const today = /* @__PURE__ */ new Date();
      const lastCompleted = `${today.getFullYear().toString().padStart(4, "0")}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
      this.dispatchEvent(new CustomEvent("task-list-busy-start"));
      (async () => {
        try {
          const updated = await updateTask(this.hass, this.entryId, taskId, {
            description: task.description,
            last_completed: lastCompleted,
            recurrence: task.recurrence
          });
          this.dispatchEvent(new CustomEvent("task-completed", { detail: { taskId, task: updated } }));
        } catch (error) {
          console.error("Failed to mark maint task complete", error);
          this.dispatchEvent(new CustomEvent("task-error", { detail: "errors.mark_complete" }));
        } finally {
          this.dispatchEvent(new CustomEvent("task-list-busy-end"));
        }
      })();
    };
  }
  render(ctx) {
    this.tasks = ctx.tasks;
    this.hass = ctx.hass;
    this.entryId = ctx.entryId;
    this.busy = ctx.busy;
    this.editing = ctx.editing;
    this.panelText = ctx.panelText;
    this.localizeText = ctx.localizeText;
    return x`
      <maint-task-list
        .tasks=${ctx.tasks}
        .hass=${ctx.hass}
        .busy=${ctx.busy}
        .editing=${ctx.editing}
        .panelText=${ctx.panelText}
        .localizeText=${ctx.localizeText}
        @complete-task=${this.handleComplete}
        @edit-task=${this.handleEdit}
        @delete-task=${this.handleDelete}
      ></maint-task-list>
    `;
  }
};

// src/task/form/view.ts
var recurrenceTypeOptions = (selected, panelText) => {
  const options = [
    { value: "interval", label: panelText("recurrence_options.interval") },
    { value: "weekly", label: panelText("recurrence_options.weekly") }
  ];
  return options.map(
    (option) => x`<option value=${option.value} ?selected=${option.value === selected}>
        ${option.label}
      </option>`
  );
};
var renderTaskForm = (props) => {
  const disabled = props.busy || props.disabled;
  if (!props.open) {
    return E;
  }
  return x`
    <div class="modal-backdrop">
      <div class="modal edit-modal">
        <h3>${props.title}</h3>
        <p>${props.subtitle}</p>
        ${props.error ? x`<div class="error">${props.error}</div>` : E}
        <form class="task-form" @submit=${props.onSubmit}>
          <label class="form-row">
            <span class="label-text">${props.panelText("fields.description")}</span>
            <input
              type="text"
              name="description"
              required
              placeholder=${props.panelText("placeholders.description_example")}
              .value=${props.description ?? ""}
              ?disabled=${disabled}
              @input=${props.onFieldInput}
            />
          </label>
          <div class="form-row grid-two-up">
          <label>
            <span class="label-text">${props.panelText("fields.schedule_type")}</span>
            <select
              name="recurrence_type"
              @change=${props.onRecurrenceTypeChange}
              .value=${props.recurrenceType}
              ?disabled=${disabled}
              >
                ${recurrenceTypeOptions(props.recurrenceType, props.panelText)}
              </select>
            </label>
            <label>
              <span class="label-text">${props.dateLabel}</span>
              <div class="date-input-wrapper date-picker-surface">
                <input
                  type="text"
                  inputmode="numeric"
                  lang=${props.locale ?? ""}
                  name="last_completed"
                  autocomplete="off"
                  placeholder=${props.datePlaceholder}
                  .value=${props.lastCompleted ?? ""}
                  ?required=${props.requireLastCompleted ?? false}
                  ?disabled=${disabled}
                  @input=${props.onLastCompletedInput ?? props.onFieldInput}
                  @focus=${props.onOpenDatePicker}
                  @click=${props.onOpenDatePicker}
                />
                <button
                  type="button"
                  class="icon-button date-picker-toggle date-picker-surface"
                  aria-label=${props.panelText("placeholders.date")}
                  title=${props.panelText("placeholders.date")}
                  ?disabled=${disabled}
              @click=${props.onToggleDatePicker}
                >
                  <ha-icon icon="mdi:calendar-blank" aria-hidden="true"></ha-icon>
                </button>
                <maint-date-picker
                  .open=${props.datePickerOpen}
                  .value=${props.dateValue}
                  .locale=${props.locale}
                  .weekStart=${props.weekStart}
                  @date-selected=${props.onDateSelected}
                ></maint-date-picker>
              </div>
            </label>
          </div>
          ${renderRecurrenceFields(
    props.recurrenceType,
    props.recurrence,
    props.recurrenceForm,
    props.localize,
    disabled,
    props.onWeeklyDayChange
  )}
          <details
            class="optional-config"
            ?open=${Boolean(props.icon && props.icon !== (props.defaultIcon ?? ""))}
          >
            <summary>${props.panelText("optional.heading")}</summary>
            <div class="optional-body">
              <label>
                <span class="label-text">${props.panelText("fields.icon")}</span>
                <input
                  type="text"
                  name="icon"
                  placeholder=${props.panelText("placeholders.icon_example")}
                  .value=${props.icon ?? ""}
                  ?disabled=${disabled}
                  @input=${props.onFieldInput}
                />
                <p class="help-text">${props.panelText("help.icon")}</p>
              </label>
            </div>
          </details>
          <div class="modal-actions" style="margin-top: 1rem;">
            <button
              type="button"
              class="button-secondary"
              id=${props.cancelButtonId ?? "cancel-task-form"}
              ?disabled=${props.busy}
              @click=${props.onCancel}
            >
              ${props.panelText("buttons.cancel")}
            </button>
            <button type="submit" ?disabled=${disabled}>
              ${props.submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
};

// src/task/create/view.ts
var MaintCreateModal = class extends i4 {
  constructor() {
    super(...arguments);
    this.open = false;
    this.busy = false;
    this.disabled = false;
    this.error = null;
    this.lastCompleted = "";
    this.datePlaceholder = "";
    this.locale = void 0;
    this.datePickerOpen = false;
    this.dateValue = null;
    this.weekStart = 1;
    this.recurrenceType = "interval";
  }
  createRenderRoot() {
    return this;
  }
  render() {
    if (!this.open || !this.panelText || !this.localize) {
      return E;
    }
    return renderTaskForm({
      open: this.open,
      busy: this.busy,
      disabled: this.disabled,
      error: this.error,
      title: this.panelText("modals.create_title"),
      subtitle: this.panelText("modals.create_prompt"),
      submitLabel: this.busy ? this.panelText("buttons.saving") : this.panelText("buttons.create"),
      dateLabel: this.panelText("fields.starting_from"),
      description: "",
      icon: DEFAULT_ICON,
      defaultIcon: DEFAULT_ICON,
      lastCompleted: this.lastCompleted,
      recurrenceType: this.recurrenceType,
      datePlaceholder: this.datePlaceholder,
      cancelButtonId: "cancel-create",
      locale: this.locale,
      datePickerOpen: this.datePickerOpen,
      dateValue: this.dateValue,
      weekStart: this.weekStart,
      requireLastCompleted: false,
      panelText: this.panelText,
      localize: this.localize,
      onSubmit: this.handleSubmit,
      onCancel: this.handleCancel,
      onRecurrenceTypeChange: this.handleRecurrenceTypeChange,
      onLastCompletedInput: this.handleLastCompletedInput,
      onToggleDatePicker: this.toggleDatePicker,
      onOpenDatePicker: this.openDatePicker,
      onDateSelected: this.handleDateSelected,
      onFieldInput: void 0,
      onWeeklyDayChange: void 0,
      recurrenceForm: void 0
    });
  }
  handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("create-submit", {
        detail: { formData: new FormData(form) },
        bubbles: true,
        composed: true
      })
    );
  }
  handleCancel() {
    this.dispatchEvent(
      new CustomEvent("create-cancel", {
        bubbles: true,
        composed: true
      })
    );
  }
  handleRecurrenceTypeChange(event) {
    const select = event.currentTarget;
    if (!select) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("recurrence-type-change", {
        detail: { type: select.value },
        bubbles: true,
        composed: true
      })
    );
  }
  handleLastCompletedInput(event) {
    const input = event.currentTarget;
    if (!input) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("last-completed-input", {
        detail: { value: input.value },
        bubbles: true,
        composed: true
      })
    );
  }
  handleDateSelected(event) {
    this.dispatchEvent(new CustomEvent("date-selected", { detail: event.detail, bubbles: true, composed: true }));
  }
  toggleDatePicker() {
    this.dispatchEvent(
      new CustomEvent("toggle-date-picker", { bubbles: true, composed: true })
    );
  }
  openDatePicker() {
    this.dispatchEvent(
      new CustomEvent("open-date-picker", { bubbles: true, composed: true })
    );
  }
};
__decorateClass([
  n4({ type: Boolean })
], MaintCreateModal.prototype, "open", 2);
__decorateClass([
  n4({ type: Boolean })
], MaintCreateModal.prototype, "busy", 2);
__decorateClass([
  n4({ type: Boolean })
], MaintCreateModal.prototype, "disabled", 2);
__decorateClass([
  n4({ type: String })
], MaintCreateModal.prototype, "error", 2);
__decorateClass([
  n4({ type: String })
], MaintCreateModal.prototype, "lastCompleted", 2);
__decorateClass([
  n4({ type: String })
], MaintCreateModal.prototype, "datePlaceholder", 2);
__decorateClass([
  n4({ type: String })
], MaintCreateModal.prototype, "locale", 2);
__decorateClass([
  n4({ type: Boolean })
], MaintCreateModal.prototype, "datePickerOpen", 2);
__decorateClass([
  n4({ type: String })
], MaintCreateModal.prototype, "dateValue", 2);
__decorateClass([
  n4({ type: Number })
], MaintCreateModal.prototype, "weekStart", 2);
__decorateClass([
  n4({ type: String })
], MaintCreateModal.prototype, "recurrenceType", 2);
__decorateClass([
  n4({ attribute: false })
], MaintCreateModal.prototype, "panelText", 2);
__decorateClass([
  n4({ attribute: false })
], MaintCreateModal.prototype, "localize", 2);
MaintCreateModal = __decorateClass([
  t3("maint-create-modal")
], MaintCreateModal);

// src/task/delete/view.ts
var MaintDeleteModal = class extends i4 {
  constructor() {
    super(...arguments);
    this.open = false;
    this.busy = false;
    this.taskTitle = null;
  }
  createRenderRoot() {
    return this;
  }
  render() {
    if (!this.open || !this.panelText || !this.taskTitle) {
      return E;
    }
    return x`
      <div class="modal-backdrop">
        <div class="modal">
          <h3>${this.panelText("modals.delete_title")}</h3>
          <p>
            ${this.panelText("modals.delete_prompt", "task", this.taskTitle)}
          </p>
          <div class="modal-actions">
            <button
              type="button"
              class="button-secondary"
              id="cancel-delete"
              ?disabled=${this.busy}
              @click=${this.handleCancel}
            >
              ${this.panelText("buttons.cancel")}
            </button>
            <button
              type="button"
              class="button-danger"
              id="confirm-delete"
              ?disabled=${this.busy}
              @click=${this.handleConfirm}
            >
              ${this.panelText("buttons.delete")}
            </button>
          </div>
        </div>
      </div>
    `;
  }
  handleConfirm() {
    this.dispatchEvent(
      new CustomEvent("confirm-delete", { bubbles: true, composed: true })
    );
  }
  handleCancel() {
    this.dispatchEvent(
      new CustomEvent("cancel-delete", { bubbles: true, composed: true })
    );
  }
};
__decorateClass([
  n4({ type: Boolean })
], MaintDeleteModal.prototype, "open", 2);
__decorateClass([
  n4({ type: Boolean })
], MaintDeleteModal.prototype, "busy", 2);
__decorateClass([
  n4({ type: String })
], MaintDeleteModal.prototype, "taskTitle", 2);
__decorateClass([
  n4({ attribute: false })
], MaintDeleteModal.prototype, "panelText", 2);
MaintDeleteModal = __decorateClass([
  t3("maint-delete-modal")
], MaintDeleteModal);

// src/date-picker/controller.ts
var DatePickerController = class {
  constructor() {
    this.state = {
      target: null
    };
  }
  open(target) {
    this.state = { target };
    return this.state;
  }
  close() {
    this.state = { target: null };
    return this.state;
  }
  toggle(target) {
    if (this.state.target === target) {
      return this.close();
    }
    return this.open(target);
  }
};

// src/task/create/controller.ts
var CreateTaskController = class {
  constructor(onChange) {
    this.onChange = onChange;
    this.state = {
      open: false,
      error: null,
      lastCompleted: "",
      recurrenceType: "interval",
      datePickerOpen: false,
      busy: false
    };
  }
  setState(next) {
    this.state = { ...this.state, ...next };
    this.onChange?.(this.state);
    return this.state;
  }
  open(initialLastCompleted) {
    return this.setState({
      open: true,
      error: null,
      lastCompleted: initialLastCompleted,
      recurrenceType: "interval",
      datePickerOpen: false,
      busy: false
    });
  }
  close() {
    return this.setState({
      open: false,
      error: null,
      datePickerOpen: false,
      busy: false
    });
  }
  setError(error) {
    return this.setState({ error });
  }
  updateLastCompleted(value) {
    return this.setState({ lastCompleted: value, error: null });
  }
  setRecurrenceType(type) {
    return this.setState({ recurrenceType: type, error: null });
  }
  openDatePicker() {
    return this.setState({ datePickerOpen: true });
  }
  toggleDatePicker() {
    return this.setState({ datePickerOpen: !this.state.datePickerOpen });
  }
  closeDatePicker() {
    return this.setState({ datePickerOpen: false });
  }
  setDate(formatted) {
    return this.setState({
      lastCompleted: formatted,
      datePickerOpen: false,
      error: null
    });
  }
  resetLastCompleted(value) {
    return this.setState({ lastCompleted: value });
  }
  async submit(formData, hass, entryId, localize, errorText) {
    const result = validateTaskFields(
      {
        description: formData.get("description"),
        last_completed: formData.get("last_completed"),
        recurrence_type: formData.get("recurrence_type"),
        interval_every: formData.get("interval_every"),
        interval_unit: formData.get("interval_unit"),
        weekly_every: formData.get("weekly_every"),
        weekly_days: formData.getAll("weekly_days"),
        icon: formData.get("icon")
      },
      localize,
      hass
    );
    if (result.error) {
      this.setState({ error: result.error });
      return { error: result.error };
    }
    if (!result.values) {
      return {};
    }
    try {
      this.setState({ error: null, busy: true });
      const task = await createTask(hass, entryId, result.values);
      return { task };
    } catch (error) {
      console.error("Maint create task failed", error);
      this.setState({ error: errorText });
      return { error: errorText };
    } finally {
      this.setState({ busy: false });
    }
  }
};

// src/task/create/feature.ts
var CreateTaskFeature = class extends EventTarget {
  constructor(onStateChange) {
    super();
    this.onStateChange = onStateChange;
    this.entryId = null;
    this.panelText = null;
    this.localize = null;
    this.pickerContext = { locale: void 0, weekStart: 1 };
    this.placeholder = "";
    this.picker = new DatePickerController();
    this.handlePickerOutside = (event) => {
      const path = event.composedPath();
      const insidePicker = path.some(
        (node) => node instanceof HTMLElement && node.classList.contains("date-picker-surface")
      );
      if (!insidePicker) {
        this.closeDatePicker();
      }
    };
    this.handlePickerKeydown = (event) => {
      if (event.key === "Escape") {
        this.closeDatePicker();
      }
    };
    this.openDatePicker = () => {
      this.controller.openDatePicker();
      this.picker.open("create");
    };
    this.toggleDatePicker = () => {
      this.controller.toggleDatePicker();
      this.picker.toggle("create");
    };
    this.handleRecurrenceTypeChange = (event) => {
      const type = event.detail?.type;
      if (!type) {
        return;
      }
      this.controller.setRecurrenceType(type);
    };
    this.handleLastCompletedInput = (event) => {
      const value = event.detail?.value;
      if (value === void 0) {
        return;
      }
      this.controller.updateLastCompleted(value);
    };
    this.handleCancel = () => {
      this.controller.close();
      this.closeDatePicker();
    };
    this.handleSubmit = async (event) => {
      event.preventDefault();
      this.closeDatePicker();
      if (!this.entryId || !this.hass || !this.localize || !this.panelText) {
        return;
      }
      const formData = event.detail?.formData;
      if (!formData) {
        return;
      }
      this.dispatchEvent(new CustomEvent("create-busy-start"));
      try {
        const result = await this.controller.submit(
          formData,
          this.hass,
          this.entryId,
          this.localize,
          this.panelText("errors.create")
        );
        if (result.task) {
          this.dispatchEvent(new CustomEvent("create-task-created", { detail: { task: result.task } }));
          this.controller.close();
          this.controller.resetLastCompleted(this.defaultDateValue());
        } else if (result.error) {
          this.controller.setError(result.error);
        }
      } finally {
        this.dispatchEvent(new CustomEvent("create-busy-end"));
      }
    };
    this.controller = new CreateTaskController((next) => this.handleStateChange(next));
    this.state = this.controller.state;
  }
  render(ctx) {
    this.applyContext(ctx);
    if (!this.panelText || !this.localize) {
      return null;
    }
    return x`
      <maint-create-modal
        .open=${this.state.open}
        .busy=${this.state.busy}
        .disabled=${ctx.formDisabled}
        .error=${this.state.error}
        .lastCompleted=${this.state.lastCompleted}
        .datePlaceholder=${this.placeholder}
        .locale=${this.pickerContext.locale ?? getLocaleCode(ctx.hass)}
        .datePickerOpen=${this.state.datePickerOpen}
        .dateValue=${this.pickerIsoValue(this.state.lastCompleted)}
        .weekStart=${this.pickerContext.weekStart}
        .recurrenceType=${this.state.recurrenceType}
        .panelText=${this.panelText}
        .localize=${this.localize}
        @create-submit=${this.handleSubmit}
        @create-cancel=${this.handleCancel}
        @recurrence-type-change=${this.handleRecurrenceTypeChange}
        @last-completed-input=${this.handleLastCompletedInput}
        @toggle-date-picker=${this.toggleDatePicker}
        @open-date-picker=${this.openDatePicker}
        @date-selected=${(event) => this.handleDateSelected(event.detail.value)}
      ></maint-create-modal>
    `;
  }
  open(initialLastCompleted, ctx) {
    this.applyContext(ctx);
    if (!this.entryId) {
      return;
    }
    this.controller.open(initialLastCompleted);
  }
  close() {
    this.controller.close();
  }
  handleStateChange(next) {
    const previous = this.state;
    this.state = { ...next };
    if (previous.datePickerOpen !== next.datePickerOpen) {
      if (next.datePickerOpen) {
        this.attachPickerListeners();
      } else {
        this.detachPickerListeners();
      }
    }
    this.onStateChange?.(this.state);
  }
  attachPickerListeners() {
    document.addEventListener("pointerdown", this.handlePickerOutside);
    document.addEventListener("keydown", this.handlePickerKeydown);
  }
  detachPickerListeners() {
    document.removeEventListener("pointerdown", this.handlePickerOutside);
    document.removeEventListener("keydown", this.handlePickerKeydown);
  }
  dispose() {
    this.detachPickerListeners();
  }
  applyContext(ctx) {
    this.hass = ctx.hass;
    this.entryId = ctx.entryId;
    this.panelText = ctx.panelText;
    this.localize = ctx.localize;
    this.placeholder = formatDatePlaceholder(ctx.hass) || ctx.panelText("placeholders.date");
    this.pickerContext = { locale: ctx.locale ?? getLocaleCode(ctx.hass), weekStart: ctx.weekStart };
  }
  pickerIsoValue(value) {
    return parseDate(value, this.hass);
  }
  closeDatePicker() {
    this.controller.closeDatePicker();
    this.picker.close();
  }
  handleDateSelected(isoValue) {
    const formatted = formatDateInput(isoValue, this.hass);
    this.controller.setDate(formatted);
    this.closeDatePicker();
  }
  defaultDateValue() {
    return currentDateInputValue(this.hass);
  }
  resetLastCompletedIfClosed(value) {
    if (!this.state.open) {
      this.controller.resetLastCompleted(value);
    }
  }
};

// src/task/delete/controller.ts
var DeleteTaskController = class {
  constructor(onChange) {
    this.onChange = onChange;
    this.state = {
      taskId: null
    };
  }
  setState(next) {
    this.state = { ...this.state, ...next };
    this.onChange?.(this.state);
    return this.state;
  }
  prompt(taskId) {
    return this.setState({ taskId });
  }
  cancel() {
    return this.setState({ taskId: null });
  }
  async confirm(hass, entryId, taskId) {
    try {
      await deleteTask(hass, entryId, taskId);
      this.setState({ taskId: null });
      return { ok: true };
    } catch (error) {
      console.error("Maint delete task failed", error);
      return { ok: false, error };
    }
  }
};

// src/task/delete/feature.ts
var DeleteTaskFeature = class extends EventTarget {
  constructor(onStateChange) {
    super();
    this.onStateChange = onStateChange;
    this.entryId = null;
    this.panelText = null;
    this.taskTitle = null;
    this.state = { taskId: null, busy: false };
    this.handleCancel = () => {
      this.cancel();
    };
    this.handleConfirm = async () => {
      const taskId = this.state.taskId;
      if (!this.entryId || !taskId || !this.hass || !this.panelText) {
        return;
      }
      this.setState({ busy: true });
      this.dispatchEvent(new CustomEvent("delete-busy-start"));
      try {
        const result = await this.controller.confirm(this.hass, this.entryId, taskId);
        if (!result.ok) {
          this.dispatchEvent(
            new CustomEvent("delete-error", { detail: this.panelText("errors.delete") })
          );
          return;
        }
        this.dispatchEvent(
          new CustomEvent("task-deleted", { detail: { taskId } })
        );
        this.cancel();
      } finally {
        this.setState({ busy: false });
        this.dispatchEvent(new CustomEvent("delete-busy-end"));
      }
    };
    this.controller = new DeleteTaskController((next) => this.setState(next));
  }
  setState(next) {
    this.state = { ...this.state, ...next };
    this.onStateChange?.(this.state);
    return this.state;
  }
  applyContext(ctx) {
    this.hass = ctx.hass;
    this.entryId = ctx.entryId;
    this.panelText = ctx.panelText;
    this.taskTitle = ctx.taskTitle;
  }
  render(ctx) {
    this.applyContext(ctx);
    if (!this.panelText) {
      return null;
    }
    return x`
      <maint-delete-modal
        .open=${Boolean(this.state.taskId)}
        .busy=${this.state.busy}
        .taskTitle=${this.taskTitle}
        .panelText=${this.panelText}
        @confirm-delete=${this.handleConfirm}
        @cancel-delete=${this.handleCancel}
      ></maint-delete-modal>
    `;
  }
  prompt(taskId) {
    this.setState(this.controller.prompt(taskId));
  }
  cancel() {
    this.setState({ busy: false, ...this.controller.cancel() });
  }
};

// src/task/list/controller.ts
var TaskListController = class {
  constructor() {
    this.state = {
      entries: [],
      selectedEntryId: null,
      tasks: [],
      busy: false,
      error: null
    };
  }
  setState(next) {
    this.state = { ...this.state, ...next };
    return this.state;
  }
  setError(error) {
    return this.setState({ error });
  }
  setSelectedEntry(entryId) {
    return this.setState({ selectedEntryId: entryId });
  }
  setTasks(tasks) {
    return this.setState({ tasks });
  }
  sortTasks(tasks) {
    const nextTimestamp = (task) => {
      const next = nextScheduled(task);
      if (!next) {
        return null;
      }
      const parsed = parseIsoDate(next);
      return parsed ? parsed.getTime() : null;
    };
    return [...tasks].sort((a3, b3) => {
      const aDue = this.isTaskDue(a3);
      const bDue = this.isTaskDue(b3);
      if (aDue !== bDue) {
        return aDue ? -1 : 1;
      }
      const aNext = nextTimestamp(a3);
      const bNext = nextTimestamp(b3);
      if (aNext !== null && bNext !== null && aNext !== bNext) {
        return aNext - bNext;
      }
      if (aNext === null && bNext !== null) {
        return 1;
      }
      if (aNext !== null && bNext === null) {
        return -1;
      }
      return a3.description.toLowerCase().localeCompare(b3.description.toLowerCase());
    });
  }
  isTaskDue(task) {
    const next = nextScheduled(task);
    if (!next) {
      return false;
    }
    const nextDate = parseIsoDate(next);
    if (!nextDate) {
      return false;
    }
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    return nextDate <= today;
  }
  async fetchEntries(hass) {
    this.setState({ busy: true, error: null });
    try {
      const entries = await listEntries(hass);
      let selectedEntryId = this.state.selectedEntryId;
      if (entries.length && !selectedEntryId) {
        selectedEntryId = entries[0].entry_id;
      }
      this.setState({ entries, selectedEntryId });
      if (selectedEntryId) {
        await this.fetchTasks(hass, selectedEntryId);
      } else {
        this.setState({ tasks: [] });
      }
    } catch (error) {
      console.error("Maint task list controller failed to load entries", error);
      this.setState({ error: "errors.load_entries" });
    } finally {
      this.setState({ busy: false });
    }
    return this.state;
  }
  async fetchTasks(hass, entryId) {
    this.setState({ busy: true, error: null });
    try {
      const tasks = await listTasks(hass, entryId);
      this.setState({ tasks: this.sortTasks(tasks) });
    } catch (error) {
      console.error("Maint task list controller failed to load tasks", error);
      this.setState({ error: "errors.load_tasks" });
    } finally {
      this.setState({ busy: false });
    }
    return this.state;
  }
};

// src/task/update/controller.ts
var UpdateTaskController = class {
  constructor(onChange) {
    this.onChange = onChange;
    this.state = {
      open: false,
      taskId: null,
      form: null,
      error: null,
      datePickerOpen: false,
      busy: false
    };
  }
  setState(next) {
    this.state = { ...this.state, ...next };
    this.onChange?.(this.state);
    return this.state;
  }
  start(task, hass) {
    const baseForm = {
      description: task.description ?? "",
      last_completed: formatDateInput(task.last_completed, hass),
      recurrence_type: task.recurrence.type,
      interval_every: "",
      interval_unit: "days",
      weekly_every: "1",
      weekly_days: [],
      icon: task.icon ?? DEFAULT_ICON
    };
    if (task.recurrence.type === "interval") {
      baseForm.interval_every = task.recurrence.every.toString();
      baseForm.interval_unit = task.recurrence.unit;
    } else if (task.recurrence.type === "weekly") {
      baseForm.weekly_every = (task.recurrence.every ?? 1).toString();
      baseForm.weekly_days = task.recurrence.days.map((day) => day.toString());
    }
    return this.setState({
      open: true,
      taskId: task.task_id,
      form: baseForm,
      error: null,
      datePickerOpen: false,
      busy: false
    });
  }
  cancel() {
    return this.setState({
      open: false,
      taskId: null,
      form: null,
      error: null,
      datePickerOpen: false,
      busy: false
    });
  }
  setError(error) {
    return this.setState({ error });
  }
  updateField(name, value) {
    if (!this.state.form) {
      return this.state;
    }
    const nextForm = { ...this.state.form };
    switch (name) {
      case "description":
        nextForm.description = value;
        break;
      case "last_completed":
        nextForm.last_completed = value;
        break;
      case "interval_every":
        nextForm.interval_every = value;
        break;
      case "interval_unit":
        nextForm.interval_unit = value;
        break;
      case "weekly_every":
        nextForm.weekly_every = value;
        break;
      case "icon":
        nextForm.icon = value;
        break;
      default:
        break;
    }
    return this.setState({ form: nextForm, error: null });
  }
  toggleWeeklyDay(value, checked) {
    if (!this.state.form) {
      return this.state;
    }
    const nextDays = new Set(this.state.form.weekly_days);
    if (checked) {
      nextDays.add(value);
    } else {
      nextDays.delete(value);
    }
    const sortedDays = Array.from(nextDays).sort((a3, b3) => Number(a3) - Number(b3));
    return this.setState({
      form: { ...this.state.form, weekly_days: sortedDays },
      error: null
    });
  }
  setRecurrenceType(type) {
    if (!this.state.form) {
      return this.state;
    }
    const nextForm = { ...this.state.form, recurrence_type: type };
    if (type === "weekly" && nextForm.weekly_days.length === 0) {
      nextForm.weekly_days = ["0"];
      nextForm.weekly_every = "1";
    }
    return this.setState({ form: nextForm, error: null });
  }
  openDatePicker() {
    return this.setState({ datePickerOpen: true });
  }
  toggleDatePicker() {
    return this.setState({ datePickerOpen: !this.state.datePickerOpen });
  }
  closeDatePicker() {
    return this.setState({ datePickerOpen: false });
  }
  setDate(formatted) {
    if (!this.state.form) {
      return this.state;
    }
    return this.setState({
      form: { ...this.state.form, last_completed: formatted },
      error: null,
      datePickerOpen: false
    });
  }
  resetAfterDelete(taskId) {
    if (this.state.taskId !== taskId) {
      return this.state;
    }
    return this.cancel();
  }
  async submit(formData, hass, entryId, taskId, localize, errorText) {
    const result = validateTaskFields(
      {
        description: formData.get("description"),
        last_completed: formData.get("last_completed"),
        recurrence_type: formData.get("recurrence_type"),
        interval_every: formData.get("interval_every"),
        interval_unit: formData.get("interval_unit"),
        weekly_every: formData.get("weekly_every"),
        weekly_days: formData.getAll("weekly_days"),
        icon: formData.get("icon")
      },
      localize,
      hass
    );
    if (result.error) {
      this.setState({ error: result.error });
      return { error: result.error };
    }
    if (!result.values) {
      return {};
    }
    try {
      this.setState({ error: null });
      this.setState({ busy: true });
      const updated = await updateTask(hass, entryId, taskId, result.values);
      return { task: updated };
    } catch (error) {
      console.error("Maint update task failed", error);
      this.setState({ error: errorText });
      return { error: errorText };
    } finally {
      this.setState({ busy: false });
    }
  }
};

// src/task/update/feature.ts
var UpdateTaskFeature = class extends EventTarget {
  constructor(onStateChange) {
    super();
    this.onStateChange = onStateChange;
    this.entryId = null;
    this.panelText = null;
    this.localize = null;
    this.weekStart = 1;
    this.placeholder = "";
    this.picker = new DatePickerController();
    this.handlePickerOutside = (event) => {
      const path = event.composedPath();
      const insidePicker = path.some(
        (node) => node instanceof HTMLElement && node.classList.contains("date-picker-surface")
      );
      if (!insidePicker) {
        this.closeDatePicker();
      }
    };
    this.handlePickerKeydown = (event) => {
      if (event.key === "Escape") {
        this.closeDatePicker();
      }
    };
    this.openDatePicker = () => {
      if (!this.state.form) {
        return;
      }
      this.controller.openDatePicker();
      this.picker.open("edit");
    };
    this.toggleDatePicker = () => {
      this.controller.toggleDatePicker();
      this.picker.toggle("edit");
    };
    this.handleFieldInput = (event) => {
      const { name, value } = event.detail ?? {};
      if (!name) {
        return;
      }
      this.controller.updateField(name, value);
    };
    this.handleWeeklyDayChange = (event) => {
      const { value, checked } = event.detail ?? {};
      if (value === void 0) {
        return;
      }
      this.controller.toggleWeeklyDay(value, checked);
    };
    this.handleRecurrenceTypeChange = (event) => {
      const type = event.detail?.type;
      if (!type) {
        return;
      }
      this.controller.setRecurrenceType(type);
    };
    this.handleCancel = () => {
      this.controller.cancel();
      this.closeDatePicker();
    };
    this.handleSubmit = async (event) => {
      event.preventDefault();
      this.closeDatePicker();
      if (!this.state.taskId || !this.entryId || !this.hass || !this.localize || !this.panelText) {
        return;
      }
      const formData = event.detail?.formData;
      if (!formData) {
        return;
      }
      this.dispatchEvent(new CustomEvent("edit-busy-start"));
      try {
        const result = await this.controller.submit(
          formData,
          this.hass,
          this.entryId,
          this.state.taskId,
          this.localize,
          this.panelText("errors.update")
        );
        if (result.task) {
          this.dispatchEvent(
            new CustomEvent("task-updated", {
              detail: { taskId: this.state.taskId, task: result.task }
            })
          );
          this.controller.cancel();
        } else if (result.error) {
          this.controller.setError(result.error);
        }
      } finally {
        this.dispatchEvent(new CustomEvent("edit-busy-end"));
      }
    };
    this.controller = new UpdateTaskController((next) => this.handleStateChange(next));
    this.state = this.controller.state;
  }
  render(ctx) {
    this.applyContext(ctx);
    if (!this.panelText || !this.localize) {
      return null;
    }
    return x`
      <maint-edit-modal
        .open=${Boolean(this.state.taskId && this.state.form)}
        .busy=${this.state.busy}
        .error=${this.state.error}
        .form=${this.state.form}
        .datePlaceholder=${this.placeholder}
        .locale=${this.locale}
        .datePickerOpen=${this.state.datePickerOpen}
        .dateValue=${this.pickerIsoValue(this.state.form?.last_completed)}
        .weekStart=${this.weekStart}
        .panelText=${this.panelText}
        .localize=${this.localize}
        @edit-submit=${this.handleSubmit}
        @edit-field-input=${this.handleFieldInput}
        @edit-weekly-day-change=${this.handleWeeklyDayChange}
        @edit-recurrence-type-change=${this.handleRecurrenceTypeChange}
        @edit-cancel=${this.handleCancel}
        @toggle-date-picker=${this.toggleDatePicker}
        @open-date-picker=${this.openDatePicker}
        @date-selected=${(event) => this.handleDateSelected(event.detail.value)}
      ></maint-edit-modal>
    `;
  }
  start(task, ctx) {
    this.applyContext(ctx);
    this.controller.start(task, ctx.hass);
  }
  cancel() {
    this.controller.cancel();
    this.closeDatePicker();
  }
  resetAfterDelete(taskId) {
    this.controller.resetAfterDelete(taskId);
  }
  handleStateChange(next) {
    const previous = this.state;
    this.state = { ...next };
    if (previous.datePickerOpen !== next.datePickerOpen) {
      if (next.datePickerOpen) {
        this.attachPickerListeners();
      } else {
        this.detachPickerListeners();
      }
    }
    this.onStateChange?.(this.state);
  }
  applyContext(ctx) {
    this.hass = ctx.hass;
    this.entryId = ctx.entryId;
    this.panelText = ctx.panelText;
    this.localize = ctx.localize;
    this.locale = ctx.locale ?? getLocaleCode(ctx.hass);
    this.weekStart = ctx.weekStart;
    this.placeholder = formatDatePlaceholder(ctx.hass) || ctx.panelText("placeholders.date");
  }
  attachPickerListeners() {
    document.addEventListener("pointerdown", this.handlePickerOutside);
    document.addEventListener("keydown", this.handlePickerKeydown);
  }
  detachPickerListeners() {
    document.removeEventListener("pointerdown", this.handlePickerOutside);
    document.removeEventListener("keydown", this.handlePickerKeydown);
  }
  dispose() {
    this.detachPickerListeners();
  }
  pickerIsoValue(value) {
    return parseDate(value, this.hass);
  }
  closeDatePicker() {
    this.controller.closeDatePicker();
    this.picker.close();
  }
  handleDateSelected(isoValue) {
    const formatted = formatDateInput(isoValue, this.hass);
    this.controller.setDate(formatted);
    this.closeDatePicker();
  }
  reformatDateIfOpen(formatted) {
    if (this.state.form) {
      this.controller.setDate(formatted);
    }
  }
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

  .page-header {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .page-header h1 {
    margin: 0;
  }

  .title-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-width: 240px;
  }

  .page-header button {
    margin-left: auto;
    align-self: center;
  }

  .subtext {
    color: var(--secondary-text-color);
    margin-bottom: 24px;
  }

  .page-header .subtext {
    margin: 0;
  }

  section {
    background: var(--card-background-color);
    border-radius: 12px;
    border: 1px solid var(--divider-color);
    padding: 14px 20px;
    margin-bottom: 24px;
  }

  .tasks-section {
    margin-top: 12px;
    padding: 0;
    overflow: hidden;
  }

  .tasks-section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
  }

  .tasks-section-header h2 {
    margin: 0;
    flex: 1;
  }

  .tasks-create-button {
    margin-left: auto;
  }

  .tasks-section-divider {
    height: 1px;
    width: 100%;
    background: var(--divider-color);
  }

  .tasks-section-content {
    display: flex;
    flex-direction: column;
  }

  .tasks-section-empty {
    margin: 0;
    padding: 14px 20px;
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

  .task-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .task-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 0;
    width: 100%;
  }

  .task-row + .task-row {
    border-top: 1px solid var(--divider-color);
  }

  maint-task-row + maint-task-row .task-row {
    border-top: 1px solid var(--divider-color);
  }

  .task-details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-left: 20px;
  }

  .task-description-line {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    flex-wrap: wrap;
  }

  .task-description {
    font-weight: 700;
    font-size: 16px;
    white-space: pre-wrap;
    color: var(--primary-text-color);
    margin-bottom: 2px;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    color: var(--text-primary-color);
    line-height: 1;
  }

  .pill-due {
    background: var(--warning-color);
  }

  .task-meta {
    display: grid;
    grid-template-columns: minmax(120px, auto) minmax(0, 1fr);
    gap: 8px 24px;
    color: var(--secondary-text-color);
    font-size: 14px;
  }

  .task-meta-column {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .task-meta-title {
    font-style: italic;
    font-weight: 700;
    color: var(--secondary-text-color);
  }

  .task-meta-value {
    color: var(--secondary-text-color);
  }

  .task-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    min-width: 140px;
    padding-right: 20px;
    box-sizing: border-box;
  }

.action-buttons {
  display: flex;
  gap: 8px;
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

.tooltipped {
  position: relative;
}

.tooltipped::after {
  content: attr(data-label);
  position: absolute;
  left: 50%;
  bottom: calc(100% + 12px);
  transform: translate(-50%, 4px);
  background: var(--primary-color);
  color: var(--text-primary-color);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 6px 10px;
  white-space: nowrap;
  font-size: 12px;
  opacity: 0;
  pointer-events: none;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.3);
  transition: opacity 0.2s ease 0.6s, transform 0.2s ease 0.6s;
  z-index: 2;
}

.tooltipped::before {
  content: "";
  position: absolute;
  left: 50%;
  bottom: calc(100% + 2px);
  transform: translate(-50%, 8px);
  border: 8px solid transparent;
  border-top-color: var(--primary-color);
  opacity: 0;
  filter: drop-shadow(0 -1px 0 rgba(0, 0, 0, 0.15));
  transition: opacity 0.2s ease 0.6s, transform 0.2s ease 0.6s;
  z-index: 1;
}

.tooltipped:hover::after,
.tooltipped:focus-visible::after,
.tooltipped:hover::before,
.tooltipped:focus-visible::before {
  opacity: 1;
  transform: translate(-50%, 0);
}

  .info {
    color: var(--secondary-text-color);
    font-style: italic;
  }

  .error {
    color: var(--error-color);
    margin-bottom: 12px;
  }

  .global-error {
    margin: 0 0 16px;
  }

  .task-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  label {
    display: block;
    margin-bottom: 0;
  }

  .form-row {
    margin: 2px 0;
  }

  .label-text {
    display: block;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .task-form > div.form-row {
    width: 100%;
  }

  .grid-two-up {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 10px;
    width: 100%;
  }

  .weekly-inline {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 0.75rem;
    width: 100%;
  }

  .weekly-every {
    flex: 0 0 auto;
    min-width: 150px;
  }

  .weekly-every-input {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
  }

  .weekly-every-field {
    width: 100%;
  }

  .weeks-suffix {
    white-space: nowrap;
    color: var(--secondary-text-color);
  }

  .weekday-selection {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex: 1 1 auto;
  }

  .weekday-row-label {
    font-weight: 600;
  }

  .weekday-row {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    align-items: center;
    width: 100%;
    min-width: 0;
    flex: 0 0 auto;
  }

  .date-input-wrapper {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: center;
    position: relative;
  }

  .date-input-wrapper maint-date-picker {
    display: contents;
  }

  .date-picker-toggle {
    min-width: 36px;
    height: 36px;
    padding: 6px;
  }

  .date-picker-popup {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 6px;
    padding: 12px;
    background: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 10px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
    width: 260px;
    z-index: 5;
  }

  .date-picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }

  .date-picker-month {
    font-weight: 600;
    flex: 1;
    text-align: center;
  }

  .date-picker-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    font-size: 12px;
    color: var(--secondary-text-color);
    margin-bottom: 6px;
  }

  .date-picker-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
    width: 100%;
  }

  .date-picker-day {
    height: 36px;
    width: 100%;
    padding: 6px 0;
    box-sizing: border-box;
    min-width: 0;
    border-radius: 8px;
    border: 1px solid var(--divider-color);
    background: var(--card-background-color);
    color: var(--primary-text-color);
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }

  .date-picker-day.muted {
    color: var(--secondary-text-color);
    opacity: 0.7;
  }

  .date-picker-day.today {
    border-color: var(--primary-color);
  }

  .date-picker-day.selected {
    background: var(--primary-color);
    color: var(--text-primary-color);
    border-color: var(--primary-color);
  }

  .date-picker-day .ha-icon {
    display: none;
  }

  .date-picker-day:focus-visible {
    outline: 2px solid var(--primary-color);
  }

  .frequency-editor {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    align-items: flex-start;
  }

  .frequency-editor select,
  .frequency-editor input {
    width: 100%;
  }

  .optional-config {
    margin-top: 12px;
    padding: 0;
  }

  .optional-config summary {
    cursor: pointer;
    font-weight: 700;
    color: var(--primary-text-color);
    outline: none;
    padding: 0;
    margin-bottom: 6px;
    list-style: none;
    display: inline-flex;
    align-items: center;
  }

  .optional-config summary::-webkit-details-marker,
  .optional-config summary::marker {
    display: none;
    content: "";
  }

  .optional-config summary::before {
    content: "▶";
    display: inline-block;
    width: 1rem;
    text-align: center;
    color: var(--secondary-text-color);
    margin-right: 4px;
  }

  .optional-config[open] summary::before {
    content: "▼";
  }

  .optional-body {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .optional-body label {
    display: block;
  }

  .help-text {
    margin: 0;
    font-size: 0.9rem;
    color: var(--secondary-text-color);
  }

  .weekday-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .weekday-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .week-interval-input {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  .week-interval-input-field {
    flex: 1;
    min-width: 80px;
  }

  .weekday-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 10px;
    border: 1px solid var(--divider-color);
    background: var(--card-background-color);
    margin: 2px 6px 6px 0;
  }

  .weekday-chip input {
    width: auto;
    margin: 0;
  }

  .stacked {
    display: flex;
    flex-direction: column;
  }

  .form-header-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  h2 {
    margin: 0;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 12vh;
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

  .modal.edit-modal {
    max-width: 720px;
    width: calc(100% - 48px);
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
    :host {
      --maint-panel-padding: 16px;
    }

    .container {
      max-width: none;
      margin: 0;
    }

    section {
      padding: 16px;
    }

    .tasks-section {
      margin-left: calc(-1 * var(--maint-panel-padding));
      margin-right: calc(-1 * var(--maint-panel-padding));
      border-radius: 0;
      border-left: none;
      border-right: none;
    }

    .tasks-section-header,
    .tasks-section-content,
    .tasks-section-empty {
      padding-left: var(--maint-panel-padding);
      padding-right: var(--maint-panel-padding);
    }

    .tasks-section-header {
      padding-top: var(--maint-panel-padding);
      padding-bottom: var(--maint-panel-padding);
    }

    .task-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
    }

    .task-details {
      padding-left: 0;
      width: 100%;
    }

    .task-actions {
      width: 100%;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      margin-left: 0;
      min-width: 0;
    }

    .task-last-completed {
      text-align: left;
    }

    .action-buttons {
      margin-left: auto;
    }

    .weekly-inline {
      flex-direction: column;
      gap: 0.5rem;
    }

    .weekly-every {
      flex: 1 1 auto;
      max-width: none;
      min-width: 0;
    }

    .weekday-selection {
      width: 100%;
    }

    .weekday-row {
      width: 100%;
      justify-content: flex-start;
    }

    .modal {
      border-radius: 0;
      max-width: none;
      width: 100vw;
      margin: 0;
      border-left: none;
      border-right: none;
    }

    .modal.edit-modal {
      width: 100vw;
    }
  }
`;

// translations/de.json
var de_default = {
  panel: {
    title: "Wartung",
    subtitle: "Verwalte wiederkehrende Aufgaben und halte dein Zuhause auf Kurs.",
    info_add_entry: "F\xFCge einen Maint-Integrations-Eintrag hinzu, um Aufgaben zu verfolgen.",
    info_enable_tracking: "F\xFCge einen Maint-Integrations-Eintrag hinzu, um die Nachverfolgung zu aktivieren.",
    info_no_tasks: "Noch keine Aufgaben. Nutze die Schaltfl\xE4che \u201EAufgabe erstellen\u201C, um eine hinzuzuf\xFCgen.",
    section_create: "Aufgabe erstellen",
    section_tasks: "Aufgaben",
    fields: {
      description: "Beschreibung",
      schedule_type: "Intervalltyp",
      starting_from: "Startdatum",
      last_completed: "Zuletzt abgeschlossen",
      every: "Alle",
      unit: "Einheit",
      on: "Am",
      weeks_suffix: "Woche(n)",
      icon: "Icon"
    },
    placeholders: {
      description_example: "Batterie Rauchmelder",
      date: "tt/mm/jjjj",
      icon_example: "mdi:bed"
    },
    optional: {
      heading: "Optionale Konfiguration"
    },
    help: {
      icon: "Verwende einen Home Assistant Icon-Namen wie mdi:check-circle-outline."
    },
    recurrence_options: {
      interval: "Intervall",
      weekly: "W\xF6chentliches Muster",
      units: {
        days: "Tage",
        weeks: "Wochen",
        months: "Monate"
      }
    },
    buttons: {
      create: "Aufgabe erstellen",
      saving: "Speichern\u2026",
      mark_complete: "Als erledigt markieren",
      edit: "Bearbeiten",
      delete: "L\xF6schen",
      cancel: "Abbrechen",
      save_changes: "\xC4nderungen speichern"
    },
    labels: {
      due: "F\xE4llig",
      next_scheduled: "N\xE4chste Planung",
      schedule: "Plan"
    },
    modals: {
      delete_title: "Aufgabe l\xF6schen?",
      delete_prompt: "M\xF6chtest du \u201E{task}\u201C wirklich l\xF6schen?",
      edit_title: "Aufgabe bearbeiten",
      edit_prompt: "Aktualisiere die Aufgabendetails unten.",
      create_title: "Aufgabe erstellen",
      create_prompt: "F\xFCge unten die Aufgabendetails hinzu."
    },
    errors: {
      load_entries: "Maint-Eintr\xE4ge konnten nicht geladen werden.",
      load_tasks: "Aufgaben konnten nicht geladen werden.",
      mark_complete: "Aufgabe konnte nicht als erledigt markiert werden.",
      create: "Aufgabe konnte nicht erstellt werden. Siehe Logs f\xFCr Details.",
      update: "Aufgabe konnte nicht aktualisiert werden.",
      delete: "Aufgabe konnte nicht gel\xF6scht werden."
    },
    validation: {
      description_required: "Gib eine Beschreibung ein.",
      last_completed_invalid: "Gib ein g\xFCltiges Datum f\xFCr zuletzt abgeschlossen ein.",
      schedule_required: "W\xE4hle einen Plan.",
      interval_every_required: "Gib an, wie oft die Aufgabe wiederholt wird.",
      interval_unit_required: "W\xE4hle eine H\xE4ufigkeitseinheit.",
      weekly_every_required: "Gib an, nach wie vielen Wochen sich die Aufgabe wiederholt.",
      weekly_days_required: "W\xE4hle mindestens einen Wochentag."
    }
  },
  recurrence: {
    every_day: "Jeden Tag",
    every_interval: "Alle {count} {unit}",
    weekly_on: "W\xF6chentlich am {days}",
    weekly_every_on: "Alle {count} Wochen am {days}",
    unit: {
      day_one: "Tag",
      day_other: "Tage",
      week_one: "Woche",
      week_other: "Wochen",
      month_one: "Monat",
      month_other: "Monate"
    },
    weekday_full: {
      "0": "Mo",
      "1": "Di",
      "2": "Mi",
      "3": "Do",
      "4": "Fr",
      "5": "Sa",
      "6": "So"
    },
    weekday_short: {
      "0": "Mo",
      "1": "Di",
      "2": "Mi",
      "3": "Do",
      "4": "Fr",
      "5": "Sa",
      "6": "So"
    }
  }
};

// translations/en.json
var en_default = {
  panel: {
    title: "Maintenance",
    subtitle: "Manage recurring tasks and keep your home on track.",
    info_add_entry: "Add a Maint integration entry to start tracking tasks.",
    info_enable_tracking: "Add a Maint integration entry to enable task tracking.",
    info_no_tasks: "No tasks yet. Use the Create task button to add one.",
    section_create: "Create task",
    section_tasks: "Tasks",
    fields: {
      description: "Description",
      schedule_type: "Schedule type",
      starting_from: "Starting from",
      last_completed: "Last completed",
      every: "Every",
      unit: "Unit",
      on: "On",
      weeks_suffix: "week(s)",
      icon: "Icon"
    },
    placeholders: {
      description_example: "Smoke detector battery",
      date: "mm/dd/yyyy",
      icon_example: "mdi:bed"
    },
    optional: {
      heading: "Optional configuration"
    },
    help: {
      icon: "Use a Home Assistant icon name such as mdi:check-circle-outline."
    },
    recurrence_options: {
      interval: "Interval",
      weekly: "Weekly pattern",
      units: {
        days: "Days",
        weeks: "Weeks",
        months: "Months"
      }
    },
    buttons: {
      create: "Create task",
      saving: "Saving\u2026",
      mark_complete: "Mark complete",
      edit: "Edit",
      delete: "Delete",
      cancel: "Cancel",
      save_changes: "Save changes"
    },
    labels: {
      due: "Due",
      next_scheduled: "Next scheduled",
      schedule: "Schedule"
    },
    modals: {
      delete_title: "Delete task?",
      delete_prompt: 'Are you sure you want to delete "{task}"?',
      edit_title: "Edit task",
      edit_prompt: "Update the task details below.",
      create_title: "Create task",
      create_prompt: "Add the task details below."
    },
    errors: {
      load_entries: "Unable to load maint entries.",
      load_tasks: "Unable to load tasks.",
      mark_complete: "Unable to mark task complete.",
      create: "Could not create task. Check the logs for details.",
      update: "Could not update the task.",
      delete: "Could not delete the task."
    },
    validation: {
      description_required: "Enter a description.",
      last_completed_invalid: "Enter a valid date for last completed.",
      schedule_required: "Choose a schedule.",
      interval_every_required: "Enter how often the task repeats.",
      interval_unit_required: "Choose a frequency unit.",
      weekly_every_required: "Enter how many weeks between repeats.",
      weekly_days_required: "Select at least one day of the week."
    }
  },
  recurrence: {
    every_day: "Every day",
    every_interval: "Every {count} {unit}",
    weekly_on: "Weekly on {days}",
    weekly_every_on: "Every {count} weeks on {days}",
    unit: {
      day_one: "day",
      day_other: "days",
      week_one: "week",
      week_other: "weeks",
      month_one: "month",
      month_other: "months"
    },
    weekday_full: {
      "0": "Mon",
      "1": "Tue",
      "2": "Wed",
      "3": "Thu",
      "4": "Fri",
      "5": "Sat",
      "6": "Sun"
    },
    weekday_short: {
      "0": "Mon",
      "1": "Tue",
      "2": "Wed",
      "3": "Thu",
      "4": "Fri",
      "5": "Sat",
      "6": "Sun"
    }
  }
};

// translations/es.json
var es_default = {
  panel: {
    title: "Mantenimiento",
    subtitle: "Gestiona tareas recurrentes y mant\xE9n tu hogar al d\xEDa.",
    info_add_entry: "A\xF1ade una entrada de la integraci\xF3n Maint para empezar a registrar tareas.",
    info_enable_tracking: "A\xF1ade una entrada de Maint para habilitar el seguimiento de tareas.",
    info_no_tasks: "A\xFAn no hay tareas. Usa el bot\xF3n Crear tarea para a\xF1adir una.",
    section_create: "Crear tarea",
    section_tasks: "Tareas",
    fields: {
      description: "Descripci\xF3n",
      schedule_type: "Tipo de programaci\xF3n",
      starting_from: "A partir de",
      last_completed: "\xDAltima finalizaci\xF3n",
      every: "Cada",
      unit: "Unidad",
      on: "En",
      weeks_suffix: "semana(s)",
      icon: "Icono"
    },
    placeholders: {
      description_example: "Bater\xEDa del detector de humo",
      date: "dd/mm/aaaa",
      icon_example: "mdi:bed"
    },
    optional: {
      heading: "Configuraci\xF3n opcional"
    },
    help: {
      icon: "Usa un nombre de icono de Home Assistant como mdi:check-circle-outline."
    },
    recurrence_options: {
      interval: "Intervalo",
      weekly: "Patr\xF3n semanal",
      units: {
        days: "D\xEDas",
        weeks: "Semanas",
        months: "Meses"
      }
    },
    buttons: {
      create: "Crear tarea",
      saving: "Guardando\u2026",
      mark_complete: "Marcar como completada",
      edit: "Editar",
      delete: "Eliminar",
      cancel: "Cancelar",
      save_changes: "Guardar cambios"
    },
    labels: {
      due: "Pendiente",
      next_scheduled: "Pr\xF3xima programaci\xF3n",
      schedule: "Programa"
    },
    modals: {
      delete_title: "\xBFEliminar tarea?",
      delete_prompt: '\xBFSeguro que quieres eliminar "{task}"?',
      edit_title: "Editar tarea",
      edit_prompt: "Actualiza los detalles de la tarea abajo.",
      create_title: "Crear tarea",
      create_prompt: "A\xF1ade los detalles de la tarea abajo."
    },
    errors: {
      load_entries: "No se pudieron cargar las entradas de Maint.",
      load_tasks: "No se pudieron cargar las tareas.",
      mark_complete: "No se pudo marcar la tarea como completada.",
      create: "No se pudo crear la tarea. Revisa los registros para m\xE1s detalles.",
      update: "No se pudo actualizar la tarea.",
      delete: "No se pudo eliminar la tarea."
    },
    validation: {
      description_required: "Introduce una descripci\xF3n.",
      last_completed_invalid: "Introduce una fecha v\xE1lida para la \xFAltima finalizaci\xF3n.",
      schedule_required: "Elige un programa.",
      interval_every_required: "Indica la frecuencia de repetici\xF3n.",
      interval_unit_required: "Elige una unidad de frecuencia.",
      weekly_every_required: "Indica cu\xE1ntas semanas entre repeticiones.",
      weekly_days_required: "Selecciona al menos un d\xEDa de la semana."
    }
  },
  recurrence: {
    every_day: "Cada d\xEDa",
    every_interval: "Cada {count} {unit}",
    weekly_on: "Semanal en {days}",
    weekly_every_on: "Cada {count} semanas en {days}",
    unit: {
      day_one: "d\xEDa",
      day_other: "d\xEDas",
      week_one: "semana",
      week_other: "semanas",
      month_one: "mes",
      month_other: "meses"
    },
    weekday_full: {
      "0": "Lun",
      "1": "Mar",
      "2": "Mi\xE9",
      "3": "Jue",
      "4": "Vie",
      "5": "S\xE1b",
      "6": "Dom"
    },
    weekday_short: {
      "0": "Lun",
      "1": "Mar",
      "2": "Mi\xE9",
      "3": "Jue",
      "4": "Vie",
      "5": "S\xE1b",
      "6": "Dom"
    }
  }
};

// translations/fr.json
var fr_default = {
  panel: {
    title: "Maintenance",
    subtitle: "G\xE9rez les t\xE2ches r\xE9currentes et gardez votre maison \xE0 jour.",
    info_add_entry: "Ajoutez une entr\xE9e Maint pour commencer \xE0 suivre les t\xE2ches.",
    info_enable_tracking: "Ajoutez une entr\xE9e de l'int\xE9gration Maint pour activer le suivi des t\xE2ches.",
    info_no_tasks: "Aucune t\xE2che pour le moment. Utilisez le bouton Cr\xE9er une t\xE2che pour en ajouter une.",
    section_create: "Cr\xE9er une t\xE2che",
    section_tasks: "T\xE2ches",
    fields: {
      description: "Description",
      schedule_type: "Type de planification",
      starting_from: "\xC0 partir du",
      last_completed: "Derni\xE8re r\xE9alisation",
      every: "Tous les",
      unit: "Unit\xE9",
      on: "Le",
      weeks_suffix: "semaine(s)",
      icon: "Ic\xF4ne"
    },
    placeholders: {
      description_example: "Pile du d\xE9tecteur de fum\xE9e",
      date: "jj/mm/aaaa",
      icon_example: "mdi:bed"
    },
    optional: {
      heading: "Configuration optionnelle"
    },
    help: {
      icon: "Utilisez un nom d'ic\xF4ne Home Assistant comme mdi:check-circle-outline."
    },
    recurrence_options: {
      interval: "Intervalle",
      weekly: "Mod\xE8le hebdomadaire",
      units: {
        days: "Jours",
        weeks: "Semaines",
        months: "Mois"
      }
    },
    buttons: {
      create: "Cr\xE9er la t\xE2che",
      saving: "Enregistrement\u2026",
      mark_complete: "Marquer comme termin\xE9e",
      edit: "Modifier",
      delete: "Supprimer",
      cancel: "Annuler",
      save_changes: "Enregistrer les modifications"
    },
    labels: {
      due: "\xC9chue",
      next_scheduled: "Prochaine \xE9ch\xE9ance",
      schedule: "R\xE9currence"
    },
    modals: {
      delete_title: "Supprimer la t\xE2che ?",
      delete_prompt: "Voulez-vous vraiment supprimer \xAB {task} \xBB ?",
      edit_title: "Modifier la t\xE2che",
      edit_prompt: "Mettez \xE0 jour les d\xE9tails de la t\xE2che ci-dessous.",
      create_title: "Cr\xE9er une t\xE2che",
      create_prompt: "Ajoutez les d\xE9tails de la t\xE2che ci-dessous."
    },
    errors: {
      load_entries: "Impossible de charger les entr\xE9es Maint.",
      load_tasks: "Impossible de charger les t\xE2ches.",
      mark_complete: "Impossible de marquer la t\xE2che comme termin\xE9e.",
      create: "Impossible de cr\xE9er la t\xE2che. Consultez les journaux pour plus de d\xE9tails.",
      update: "Impossible de mettre \xE0 jour la t\xE2che.",
      delete: "Impossible de supprimer la t\xE2che."
    },
    validation: {
      description_required: "Saisissez une description.",
      last_completed_invalid: "Saisissez une date valide pour la derni\xE8re r\xE9alisation.",
      schedule_required: "Choisissez une planification.",
      interval_every_required: "Indiquez la fr\xE9quence de r\xE9p\xE9tition.",
      interval_unit_required: "Choisissez une unit\xE9 de fr\xE9quence.",
      weekly_every_required: "Indiquez le nombre de semaines entre chaque r\xE9p\xE9tition.",
      weekly_days_required: "S\xE9lectionnez au moins un jour de la semaine."
    }
  },
  recurrence: {
    every_day: "Chaque jour",
    every_interval: "Tous les {count} {unit}",
    weekly_on: "Chaque semaine le {days}",
    weekly_every_on: "Toutes les {count} semaines le {days}",
    unit: {
      day_one: "jour",
      day_other: "jours",
      week_one: "semaine",
      week_other: "semaines",
      month_one: "mois",
      month_other: "mois"
    },
    weekday_full: {
      "0": "Lun",
      "1": "Mar",
      "2": "Mer",
      "3": "Jeu",
      "4": "Ven",
      "5": "Sam",
      "6": "Dim"
    },
    weekday_short: {
      "0": "Lun",
      "1": "Mar",
      "2": "Mer",
      "3": "Jeu",
      "4": "Ven",
      "5": "Sam",
      "6": "Dim"
    }
  }
};

// translations/nl.json
var nl_default = {
  panel: {
    title: "Onderhoud",
    subtitle: "Beheer terugkerende taken en houd je huis op schema.",
    info_add_entry: "Voeg een Maint-integratie-entry toe om taken te volgen.",
    info_enable_tracking: "Voeg een Maint-entry toe om taaktracking in te schakelen.",
    info_no_tasks: "Nog geen taken. Gebruik de knop Taak maken om er een toe te voegen.",
    section_create: "Taak maken",
    section_tasks: "Taken",
    fields: {
      description: "Beschrijving",
      schedule_type: "Schema type",
      starting_from: "Vanaf",
      last_completed: "Laatst voltooid",
      every: "Elke",
      unit: "Eenheid",
      on: "Op",
      weeks_suffix: "week/weken",
      icon: "Icoon"
    },
    placeholders: {
      description_example: "Batterij rookmelder",
      date: "dd/mm/jjjj",
      icon_example: "mdi:bed"
    },
    optional: {
      heading: "Optionele configuratie"
    },
    help: {
      icon: "Gebruik een Home Assistant-pictogramnaam zoals mdi:check-circle-outline."
    },
    recurrence_options: {
      interval: "Interval",
      weekly: "Wekelijks patroon",
      units: {
        days: "Dagen",
        weeks: "Weken",
        months: "Maanden"
      }
    },
    buttons: {
      create: "Taak maken",
      saving: "Opslaan\u2026",
      mark_complete: "Markeer als voltooid",
      edit: "Bewerken",
      delete: "Verwijderen",
      cancel: "Annuleren",
      save_changes: "Wijzigingen opslaan"
    },
    labels: {
      due: "Verlopen",
      next_scheduled: "Volgende gepland",
      schedule: "Schema"
    },
    modals: {
      delete_title: "Taak verwijderen?",
      delete_prompt: 'Weet je zeker dat je "{task}" wilt verwijderen?',
      edit_title: "Taak bewerken",
      edit_prompt: "Werk de taakdetails hieronder bij.",
      create_title: "Taak maken",
      create_prompt: "Voeg hieronder de taakdetails toe."
    },
    errors: {
      load_entries: "Kon Maint-entries niet laden.",
      load_tasks: "Kon taken niet laden.",
      mark_complete: "Taak kon niet als voltooid worden gemarkeerd.",
      create: "Taak kon niet worden gemaakt. Controleer de logboeken voor details.",
      update: "Taak kon niet worden bijgewerkt.",
      delete: "Taak kon niet worden verwijderd."
    },
    validation: {
      description_required: "Voer een beschrijving in.",
      last_completed_invalid: "Voer een geldige datum in voor laatst voltooid.",
      schedule_required: "Kies een schema.",
      interval_every_required: "Geef aan hoe vaak de taak terugkeert.",
      interval_unit_required: "Kies een frequentie-eenheid.",
      weekly_every_required: "Geef aan hoeveel weken tussen herhalingen.",
      weekly_days_required: "Selecteer minstens \xE9\xE9n dag van de week."
    }
  },
  recurrence: {
    every_day: "Elke dag",
    every_interval: "Elke {count} {unit}",
    weekly_on: "Wekelijks op {days}",
    weekly_every_on: "Elke {count} weken op {days}",
    unit: {
      day_one: "dag",
      day_other: "dagen",
      week_one: "week",
      week_other: "weken",
      month_one: "maand",
      month_other: "maanden"
    },
    weekday_full: {
      "0": "Ma",
      "1": "Di",
      "2": "Wo",
      "3": "Do",
      "4": "Vr",
      "5": "Za",
      "6": "Zo"
    },
    weekday_short: {
      "0": "Ma",
      "1": "Di",
      "2": "Wo",
      "3": "Do",
      "4": "Vr",
      "5": "Za",
      "6": "Zo"
    }
  }
};

// translations/pt.json
var pt_default = {
  panel: {
    title: "Manuten\xE7\xE3o",
    subtitle: "Gerencie tarefas recorrentes e mantenha sua casa em dia.",
    info_add_entry: "Adicione uma entrada da integra\xE7\xE3o Maint para come\xE7ar a acompanhar tarefas.",
    info_enable_tracking: "Adicione uma entrada do Maint para habilitar o acompanhamento de tarefas.",
    info_no_tasks: "Ainda n\xE3o h\xE1 tarefas. Use o formul\xE1rio acima para criar uma.",
    section_create: "Criar tarefa",
    section_tasks: "Tarefas",
    toggle_collapse: "Recolher formul\xE1rio",
    toggle_expand: "Expandir formul\xE1rio",
    fields: {
      description: "Descri\xE7\xE3o",
      schedule_type: "Tipo de programa\xE7\xE3o",
      starting_from: "A partir de",
      last_completed: "\xDAltima conclus\xE3o",
      every: "A cada",
      unit: "Unidade",
      on: "Em",
      weeks_suffix: "semana(s)",
      icon: "\xCDcone"
    },
    placeholders: {
      description_example: "Bateria do detector de fuma\xE7a",
      date: "dd/mm/aaaa",
      icon_example: "mdi:bed"
    },
    optional: {
      heading: "Configura\xE7\xE3o opcional"
    },
    help: {
      icon: "Use um nome de \xEDcone do Home Assistant, como mdi:check-circle-outline."
    },
    recurrence_options: {
      interval: "Intervalo",
      weekly: "Padr\xE3o semanal",
      units: {
        days: "Dias",
        weeks: "Semanas",
        months: "Meses"
      }
    },
    buttons: {
      create: "Criar tarefa",
      saving: "Salvando\u2026",
      mark_complete: "Marcar como conclu\xEDda",
      edit: "Editar",
      delete: "Excluir",
      cancel: "Cancelar",
      save_changes: "Salvar altera\xE7\xF5es"
    },
    labels: {
      due: "Pendente",
      next_scheduled: "Pr\xF3ximo agendamento",
      schedule: "Programa\xE7\xE3o"
    },
    modals: {
      delete_title: "Excluir tarefa?",
      delete_prompt: 'Tem certeza de que deseja excluir "{task}"?',
      edit_title: "Editar tarefa",
      edit_prompt: "Atualize os detalhes da tarefa abaixo."
    },
    errors: {
      load_entries: "N\xE3o foi poss\xEDvel carregar as entradas do Maint.",
      load_tasks: "N\xE3o foi poss\xEDvel carregar as tarefas.",
      mark_complete: "N\xE3o foi poss\xEDvel marcar a tarefa como conclu\xEDda.",
      create: "N\xE3o foi poss\xEDvel criar a tarefa. Verifique os registros para mais detalhes.",
      update: "N\xE3o foi poss\xEDvel atualizar a tarefa.",
      delete: "N\xE3o foi poss\xEDvel excluir a tarefa."
    },
    validation: {
      description_required: "Informe uma descri\xE7\xE3o.",
      last_completed_invalid: "Informe uma data v\xE1lida para a \xFAltima conclus\xE3o.",
      schedule_required: "Escolha uma programa\xE7\xE3o.",
      interval_every_required: "Informe com que frequ\xEAncia a tarefa se repete.",
      interval_unit_required: "Escolha uma unidade de frequ\xEAncia.",
      weekly_every_required: "Informe quantas semanas entre repeti\xE7\xF5es.",
      weekly_days_required: "Selecione ao menos um dia da semana."
    }
  },
  recurrence: {
    every_day: "Todos os dias",
    every_interval: "A cada {count} {unit}",
    weekly_on: "Semanalmente em {days}",
    weekly_every_on: "A cada {count} semanas em {days}",
    unit: {
      day_one: "dia",
      day_other: "dias",
      week_one: "semana",
      week_other: "semanas",
      month_one: "m\xEAs",
      month_other: "meses"
    },
    weekday_full: {
      "0": "Seg",
      "1": "Ter",
      "2": "Qua",
      "3": "Qui",
      "4": "Sex",
      "5": "S\xE1b",
      "6": "Dom"
    },
    weekday_short: {
      "0": "Seg",
      "1": "Ter",
      "2": "Qua",
      "3": "Qui",
      "4": "Sex",
      "5": "S\xE1b",
      "6": "Dom"
    }
  }
};

// src/translations.ts
var INTEGRATION_PREFIX = "component.maint";
var RAW_TRANSLATIONS = {
  de: de_default,
  en: en_default,
  es: es_default,
  fr: fr_default,
  nl: nl_default,
  pt: pt_default
};
var flattenTranslations = (tree, prefix, target = {}) => {
  Object.entries(tree).forEach(([key, value]) => {
    const nextPath = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      target[nextPath] = value;
      return;
    }
    if (value && typeof value === "object") {
      flattenTranslations(value, nextPath, target);
    }
  });
  return target;
};
var FLAT_TRANSLATIONS = Object.fromEntries(
  Object.entries(RAW_TRANSLATIONS).map(([language, tree]) => [
    language,
    flattenTranslations(tree, INTEGRATION_PREFIX)
  ])
);
var resolveLanguageCandidates = (language) => {
  if (!language) {
    return ["en"];
  }
  const normalized = language.toLowerCase();
  const candidates = [normalized];
  if (normalized.includes("-")) {
    const base = normalized.split("-")[0];
    if (!candidates.includes(base)) {
      candidates.push(base);
    }
  }
  if (!candidates.includes("en")) {
    candidates.push("en");
  }
  return candidates;
};
var getUiTranslations = (language) => {
  const candidates = resolveLanguageCandidates(language);
  const translations = {};
  [...candidates].reverse().forEach((code) => {
    const resources = FLAT_TRANSLATIONS[code];
    if (resources) {
      Object.assign(translations, resources);
    }
  });
  return translations;
};

// src/task/update/view.ts
var MaintEditModal = class extends i4 {
  constructor() {
    super(...arguments);
    this.open = false;
    this.busy = false;
    this.error = null;
    this.form = null;
    this.datePlaceholder = "";
    this.locale = void 0;
    this.datePickerOpen = false;
    this.dateValue = null;
    this.weekStart = 1;
  }
  createRenderRoot() {
    return this;
  }
  render() {
    if (!this.open || !this.form || !this.panelText || !this.localize) {
      return E;
    }
    return renderTaskForm({
      open: this.open,
      busy: this.busy,
      disabled: false,
      error: this.error,
      title: this.panelText("modals.edit_title"),
      subtitle: this.panelText("modals.edit_prompt"),
      submitLabel: this.busy ? this.panelText("buttons.saving") : this.panelText("buttons.save_changes"),
      dateLabel: this.panelText("fields.last_completed"),
      description: this.form.description,
      lastCompleted: this.form.last_completed,
      icon: this.form.icon,
      defaultIcon: DEFAULT_ICON,
      requireLastCompleted: true,
      recurrenceType: this.form.recurrence_type,
      recurrenceForm: this.form,
      datePlaceholder: this.datePlaceholder,
      cancelButtonId: "cancel-edit",
      locale: this.locale,
      datePickerOpen: this.datePickerOpen,
      dateValue: this.dateValue,
      weekStart: this.weekStart,
      panelText: this.panelText,
      localize: this.localize,
      onSubmit: this.handleSubmit,
      onCancel: this.handleCancel,
      onRecurrenceTypeChange: this.handleRecurrenceTypeChange,
      onFieldInput: this.handleFieldInput,
      onLastCompletedInput: this.handleFieldInput,
      onToggleDatePicker: this.toggleDatePicker,
      onOpenDatePicker: this.openDatePicker,
      onDateSelected: this.handleDateSelected,
      onWeeklyDayChange: this.handleWeeklyDayChange
    });
  }
  handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("edit-submit", {
        detail: { formData: new FormData(form) },
        bubbles: true,
        composed: true
      })
    );
  }
  handleFieldInput(event) {
    const target = event.currentTarget;
    if (!target || !target.name) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("edit-field-input", {
        detail: { name: target.name, value: target.value },
        bubbles: true,
        composed: true
      })
    );
  }
  handleWeeklyDayChange(event) {
    const target = event.target;
    if (!target || target.name !== "weekly_days") {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("edit-weekly-day-change", {
        detail: { value: target.value, checked: target.checked },
        bubbles: true,
        composed: true
      })
    );
  }
  handleRecurrenceTypeChange(event) {
    const select = event.currentTarget;
    if (!select) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("edit-recurrence-type-change", {
        detail: { type: select.value },
        bubbles: true,
        composed: true
      })
    );
  }
  handleDateSelected(event) {
    this.dispatchEvent(
      new CustomEvent("date-selected", {
        detail: event.detail,
        bubbles: true,
        composed: true
      })
    );
  }
  toggleDatePicker() {
    this.dispatchEvent(
      new CustomEvent("toggle-date-picker", { bubbles: true, composed: true })
    );
  }
  openDatePicker() {
    this.dispatchEvent(
      new CustomEvent("open-date-picker", { bubbles: true, composed: true })
    );
  }
  handleCancel() {
    this.dispatchEvent(
      new CustomEvent("edit-cancel", { bubbles: true, composed: true })
    );
  }
};
__decorateClass([
  n4({ type: Boolean })
], MaintEditModal.prototype, "open", 2);
__decorateClass([
  n4({ type: Boolean })
], MaintEditModal.prototype, "busy", 2);
__decorateClass([
  n4({ type: String })
], MaintEditModal.prototype, "error", 2);
__decorateClass([
  n4({ attribute: false })
], MaintEditModal.prototype, "form", 2);
__decorateClass([
  n4({ type: String })
], MaintEditModal.prototype, "datePlaceholder", 2);
__decorateClass([
  n4({ type: String })
], MaintEditModal.prototype, "locale", 2);
__decorateClass([
  n4({ type: Boolean })
], MaintEditModal.prototype, "datePickerOpen", 2);
__decorateClass([
  n4({ type: String })
], MaintEditModal.prototype, "dateValue", 2);
__decorateClass([
  n4({ type: Number })
], MaintEditModal.prototype, "weekStart", 2);
__decorateClass([
  n4({ attribute: false })
], MaintEditModal.prototype, "panelText", 2);
__decorateClass([
  n4({ attribute: false })
], MaintEditModal.prototype, "localize", 2);
MaintEditModal = __decorateClass([
  t3("maint-edit-modal")
], MaintEditModal);

// src/main.ts
var MaintPanel = class extends i4 {
  constructor() {
    super();
    this.dataController = new TaskListController();
    this.createFeature = new CreateTaskFeature((state) => {
      this.createState = { ...state };
    });
    this.editFeature = new UpdateTaskFeature((state) => {
      this.editState = { ...state };
    });
    this.deleteFeature = new DeleteTaskFeature((state) => {
      this.deleteState = { ...state };
    });
    this.taskListFeature = new TaskListFeature();
    this.dataState = this.dataController.state;
    this.busy = false;
    this.error = null;
    this.translations = {};
    this.translationsLanguage = null;
    this.createState = this.createFeature.state;
    this.editState = this.editFeature.state;
    this.deleteState = this.deleteFeature.state;
    this.initialized = false;
    this.lastDateLocaleKey = null;
    this.busyCounter = 0;
    this.createFeature.addEventListener("create-task-created", (event) => {
      const task = event.detail?.task;
      if (task) {
        const tasks = this.dataController.sortTasks([...this.dataState.tasks, task]);
        this.dataState = { ...this.dataState, tasks };
        this.error = null;
      }
    });
    this.createFeature.addEventListener("create-busy-start", () => this.startBusy());
    this.createFeature.addEventListener("create-busy-end", () => this.stopBusy());
    this.editFeature.addEventListener("task-updated", (event) => {
      const detail = event.detail;
      if (detail?.taskId && detail.task) {
        const tasks = this.dataController.sortTasks(
          this.dataState.tasks.map((task) => task.task_id === detail.taskId ? detail.task : task)
        );
        this.dataState = { ...this.dataState, tasks };
      }
    });
    this.editFeature.addEventListener("edit-busy-start", () => this.startBusy());
    this.editFeature.addEventListener("edit-busy-end", () => this.stopBusy());
    this.deleteFeature.addEventListener("task-deleted", async (event) => {
      const taskId = event.detail?.taskId;
      if (!taskId) {
        return;
      }
      const tasks = this.dataController.sortTasks(
        this.dataState.tasks.filter((task) => task.task_id !== taskId)
      );
      this.dataState = { ...this.dataState, tasks };
      this.editFeature.resetAfterDelete(taskId);
      await this.loadTasks();
    });
    this.deleteFeature.addEventListener("delete-busy-start", () => this.startBusy());
    this.deleteFeature.addEventListener("delete-busy-end", () => this.stopBusy());
    this.deleteFeature.addEventListener("delete-error", (event) => {
      const message = event.detail;
      this.error = message;
    });
    this.taskListFeature.addEventListener("task-completed", (event) => {
      const detail = event.detail;
      if (!detail?.taskId || !detail.task) {
        return;
      }
      const tasks = this.dataController.sortTasks(
        this.dataState.tasks.map((item) => item.task_id === detail.taskId ? detail.task : item)
      );
      this.dataState = { ...this.dataState, tasks };
    });
    this.taskListFeature.addEventListener("task-edit", (event) => {
      const taskId = event.detail?.taskId;
      if (!taskId) {
        return;
      }
      const task = this.dataState.tasks.find((item) => item.task_id === taskId);
      if (!task) {
        return;
      }
      this.error = null;
      this.editFeature.start(task, {
        hass: this.hass,
        entryId: this.dataState.selectedEntryId ?? null,
        panelText: this.panelText.bind(this),
        localize: this.localizeText.bind(this),
        locale: localeCode(this.hass),
        weekStart: this.firstWeekday()
      });
    });
    this.taskListFeature.addEventListener("task-delete", (event) => {
      const taskId = event.detail?.taskId;
      if (taskId) {
        this.deleteFeature.prompt(taskId);
      }
    });
    this.taskListFeature.addEventListener("task-error", (event) => {
      const key = event.detail;
      this.error = this.panelText(key);
    });
    this.taskListFeature.addEventListener("task-list-busy-start", () => this.startBusy());
    this.taskListFeature.addEventListener("task-list-busy-end", () => this.stopBusy());
  }
  hasDateLocaleChanged(previous, current) {
    const previousKey = this.localeKey(previous);
    const currentKey = this.localeKey(current);
    const changed = previousKey !== null && currentKey !== null && previousKey !== currentKey;
    this.lastDateLocaleKey = currentKey;
    return changed;
  }
  localeKey(hass) {
    if (!hass) {
      return this.lastDateLocaleKey;
    }
    const lang = hass.language ?? hass.locale?.language ?? "";
    const format = hass.locale?.date_format ?? "";
    return `${lang}|${format}`;
  }
  updated(changedProps) {
    const hassChanged = changedProps.has("hass");
    const languageChanged = hassChanged && this.hass?.language && this.hass.language !== this.translationsLanguage;
    const localeChanged = this.hasDateLocaleChanged(changedProps.get("hass"), this.hass);
    if (hassChanged && this.hass) {
      void this.loadTranslations();
      if (!this.initialized) {
        this.initialized = true;
        void this.loadEntries();
      }
    } else if (languageChanged && this.hass) {
      void this.loadTranslations();
    }
    if (localeChanged) {
      this.reformatDateInputs(changedProps.get("hass"));
    }
  }
  disconnectedCallback() {
    this.createFeature.dispose();
    this.editFeature.dispose();
    super.disconnectedCallback();
  }
  startBusy() {
    this.busyCounter += 1;
    this.busy = true;
  }
  stopBusy() {
    this.busyCounter = Math.max(0, this.busyCounter - 1);
    this.busy = this.busyCounter > 0;
  }
  render() {
    const hasEntries = this.dataState.entries.length > 0;
    const formDisabled = !this.dataState.selectedEntryId;
    return x`
      <div class="container">
        <div class="page-header">
          <div class="title-block">
            <h1>${this.panelText("title")}</h1>
            <p class="subtext">${this.panelText("subtitle")}</p>
          </div>
        </div>
        ${this.error ? x`<div class="error global-error">${this.error}</div>` : E}
        ${hasEntries ? E : x`<p class="info">${this.panelText("info_add_entry")}</p>`}
        ${this.renderTasksSection(formDisabled)}
        ${this.renderCreateModal(formDisabled)}
        ${this.renderDeleteModal()}
        ${this.renderEditModal()}
      </div>
    `;
  }
  renderTasksSection(formDisabled) {
    const createDisabled = formDisabled || this.busy;
    const header = x`
      <div class="tasks-section-header">
        <h2>${this.panelText("section_tasks")}</h2>
        <button
          type="button"
          class="button-primary tasks-create-button"
          ?disabled=${createDisabled}
          @click=${this.openCreateModal}
        >
          ${this.panelText("buttons.create")}
        </button>
      </div>
      <div class="tasks-section-divider" role="presentation"></div>
    `;
    if (formDisabled) {
      return x`<section class="tasks-section">
        ${header}
        <div class="tasks-section-content">
          <p class="info tasks-section-empty">${this.panelText("info_enable_tracking")}</p>
        </div>
      </section>`;
    }
    return x`<section class="tasks-section">
      ${header}
      <div class="tasks-section-content">
        ${this.taskListFeature.render({
      tasks: this.dataState.tasks,
      hass: this.hass,
      entryId: this.dataState.selectedEntryId ?? null,
      busy: this.busy,
      editing: Boolean(this.editState.taskId),
      panelText: this.panelText.bind(this),
      localizeText: this.localizeText.bind(this)
    })}
      </div>
    </section>`;
  }
  renderCreateModal(formDisabled) {
    return this.createFeature.render({
      hass: this.hass,
      entryId: this.dataState.selectedEntryId ?? null,
      panelText: this.panelText.bind(this),
      localize: this.localizeText.bind(this),
      formDisabled,
      locale: localeCode(this.hass),
      weekStart: this.firstWeekday()
    });
  }
  renderEditModal() {
    return this.editFeature.render({
      hass: this.hass,
      entryId: this.dataState.selectedEntryId ?? null,
      panelText: this.panelText.bind(this),
      localize: this.localizeText.bind(this),
      locale: localeCode(this.hass),
      weekStart: this.firstWeekday()
    });
  }
  renderDeleteModal() {
    return this.deleteFeature.render({
      hass: this.hass,
      entryId: this.dataState.selectedEntryId ?? null,
      panelText: this.panelText.bind(this),
      taskTitle: this.deleteTaskTitle()
    });
  }
  async loadEntries() {
    if (!this.hass) {
      return;
    }
    this.startBusy();
    this.error = null;
    const state = await this.dataController.fetchEntries(this.hass);
    this.dataState = { ...state };
    if (state.error) {
      this.error = this.panelText(state.error);
    }
    this.stopBusy();
  }
  async loadTasks() {
    if (!this.dataState.selectedEntryId || !this.hass) {
      this.dataState = { ...this.dataState, tasks: [] };
      this.editFeature.cancel();
      this.deleteFeature.cancel();
      this.createFeature.close();
      return;
    }
    this.startBusy();
    this.error = null;
    const state = await this.dataController.fetchTasks(this.hass, this.dataState.selectedEntryId);
    this.dataState = { ...state };
    if (state.error) {
      this.error = this.panelText(state.error);
    } else {
      this.editFeature.cancel();
      this.deleteFeature.cancel();
    }
    this.stopBusy();
  }
  openCreateModal() {
    if (!this.dataState.selectedEntryId || this.busy) {
      return;
    }
    this.createFeature.open(currentDateInputValue(this.hass), {
      hass: this.hass,
      entryId: this.dataState.selectedEntryId ?? null,
      panelText: this.panelText.bind(this),
      localize: this.localizeText.bind(this),
      formDisabled: false,
      locale: localeCode(this.hass),
      weekStart: this.firstWeekday()
    });
  }
  reformatDateInputs(previousHass) {
    const reformatValue = (value) => {
      const iso = parseDate(value, previousHass ?? this.hass) ?? parseDate(value, this.hass) ?? null;
      if (!iso) {
        return null;
      }
      return formatDateInput(iso, this.hass);
    };
    const updatedCreate = reformatValue(this.createState.lastCompleted);
    if (updatedCreate !== null) {
      this.createFeature.resetLastCompletedIfClosed(updatedCreate);
    }
    if (this.editState.form) {
      const updatedEdit = reformatValue(this.editState.form.last_completed);
      if (updatedEdit !== null) {
        this.editFeature.reformatDateIfOpen(updatedEdit);
      }
    }
  }
  firstWeekday() {
    const locale = localeCode(this.hass);
    const intlLocale = Intl.Locale;
    if (intlLocale) {
      try {
        const info = new intlLocale(locale ?? "en");
        const first = info.weekInfo?.firstDay;
        if (typeof first === "number") {
          return first;
        }
      } catch {
      }
    }
    const code = (locale ?? "").toLowerCase();
    if (code.startsWith("en-us")) {
      return 0;
    }
    return 1;
  }
  localizeText(key, ...args) {
    const template = this.translations[key];
    if (template) {
      return this.formatFromTemplate(template, args);
    }
    const translated = this.hass?.localize?.(key, ...args);
    if (translated && translated !== key) {
      return translated;
    }
    return translated ?? key;
  }
  panelText(key, ...args) {
    return this.localizeText(`component.maint.panel.${key}`, ...args);
  }
  formatFromTemplate(template, args) {
    if (!args.length) {
      return template;
    }
    const replacements = {};
    for (let i5 = 0; i5 < args.length; i5 += 2) {
      const name = String(args[i5]);
      const value = i5 + 1 < args.length ? String(args[i5 + 1]) : "";
      replacements[name] = value;
    }
    return template.replace(
      /{([^}]+)}/g,
      (match, key) => Object.prototype.hasOwnProperty.call(replacements, key) ? replacements[key] : match
    );
  }
  async loadTranslations() {
    const language = this.hass?.language;
    this.translations = getUiTranslations(language);
    this.translationsLanguage = language ?? "en";
  }
  deleteTaskTitle() {
    if (!this.deleteState.taskId) {
      return null;
    }
    return this.dataState.tasks.find((task) => task.task_id === this.deleteState.taskId)?.description ?? null;
  }
};
MaintPanel.styles = styles;
__decorateClass([
  n4({ attribute: false })
], MaintPanel.prototype, "hass", 2);
__decorateClass([
  r5()
], MaintPanel.prototype, "dataState", 2);
__decorateClass([
  r5()
], MaintPanel.prototype, "busy", 2);
__decorateClass([
  r5()
], MaintPanel.prototype, "error", 2);
__decorateClass([
  r5()
], MaintPanel.prototype, "translations", 2);
__decorateClass([
  r5()
], MaintPanel.prototype, "translationsLanguage", 2);
__decorateClass([
  r5()
], MaintPanel.prototype, "createState", 2);
__decorateClass([
  r5()
], MaintPanel.prototype, "editState", 2);
__decorateClass([
  r5()
], MaintPanel.prototype, "deleteState", 2);
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
