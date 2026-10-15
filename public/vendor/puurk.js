/*! @puurk/js v1.2.0 (de1c3b2) — vendored by scripts/vendor-sdk.mjs */
(function(q,V){typeof exports=="object"&&typeof module<"u"?module.exports=V():typeof define=="function"&&define.amd?define(V):(q=typeof globalThis<"u"?globalThis:q||self,q.Puurk=V())})(this,(function(){"use strict";const q={staging:"https://checkoutstaging.puurk.com",demo:"https://checkoutdemo.puurk.com",sandbox:"https://checkoutsandbox.puurk.com",production:"https://checkout.puurk.com"},V={staging:"https://apistaging.puurk.com",demo:"https://apidemo.puurk.com",sandbox:"https://apisandbox.puurk.com",production:"https://api.puurk.com"};let R={environment:"production"};function ht(t){t.environment&&(R={...R,environment:t.environment}),"checkoutUrl"in t&&(R={...R,checkoutUrl:t.checkoutUrl}),"apiUrl"in t&&(R={...R,apiUrl:t.apiUrl})}function ge(){return R.checkoutUrl??q[R.environment]}function mt(){return R.apiUrl??V[R.environment]}function yt(t){window.location.href=`${ge()}/s/${t}`}class W extends Error{constructor(e,r,n){super(r),this.name="PuurkError",this.code=e,this.status=n}}const gt=`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 25, 40, 0.5);
  opacity: 0;
  transition: opacity 0.2s ease;
`,vt=`
  position: relative;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  background: #FDFEFB;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  margin: 16px;
`,bt=`
  width: 100%;
  border: none;
  display: block;
  min-height: 400px;
  transition: height 0.2s ease;
`,kt=`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #676867;
  z-index: 1;
  line-height: 1;
`;function xt(t){const e=document.createElement("div");e.setAttribute("style",gt),e.setAttribute("data-puurk-overlay","true");const r=document.createElement("div");r.setAttribute("style",vt);const n=document.createElement("button");n.setAttribute("style",kt),n.setAttribute("aria-label","Close"),n.innerHTML="&#x2715;";const o=document.createElement("iframe");return o.setAttribute("style",bt),o.setAttribute("src",t),o.setAttribute("allow","payment"),o.setAttribute("title","Puurk Checkout"),r.appendChild(n),r.appendChild(o),e.appendChild(r),{overlay:e,container:r,iframe:o,closeButton:n}}function wt(t){t.offsetHeight,t.style.opacity="1"}function St(t){t.style.opacity="0",setTimeout(()=>{t.remove()},200)}function Pt(t){const e=ge();try{const r=new URL(e).origin;return t.origin===r}catch{return!1}}function Ct(t){if(!Pt(t))return null;const e=t.data;return!e||typeof e.type!="string"||!e.type.startsWith("puurk:")?null:e}function Et(t,e={}){const r=`${ge()}/s/${t}?embed=true`,{overlay:n,iframe:o,closeButton:l}=xt(r);let u=!1;function s(){u||(u=!0,window.removeEventListener("message",d),window.removeEventListener("keydown",c),St(n))}function d(p){var i,_,g,w,m,v,h,b,y;const f=Ct(p);if(f)switch(f.type){case"puurk:ready":wt(n);break;case"puurk:resize":{const P=(i=f.payload)==null?void 0:i.height;P&&P>0&&(o.style.height=`${P}px`);break}case"puurk:complete":{const P={session_id:((_=f.payload)==null?void 0:_.session_id)??t,contract_id:((g=f.payload)==null?void 0:g.contract_id)??null,status:((w=f.payload)==null?void 0:w.status)??"completed"};s(),(m=e.onComplete)==null||m.call(e,P);break}case"puurk:cancel":s(),(v=e.onCancel)==null||v.call(e);break;case"puurk:error":{const P=new W(((h=f.payload)==null?void 0:h.code)??"checkout_error",((b=f.payload)==null?void 0:b.message)??"An error occurred during checkout");(y=e.onError)==null||y.call(e,P);break}}}function c(p){var f;p.key==="Escape"&&(s(),(f=e.onCancel)==null||f.call(e))}return n.addEventListener("click",p=>{var f;p.target===n&&(s(),(f=e.onCancel)==null||f.call(e))}),l.addEventListener("click",()=>{var p;s(),(p=e.onCancel)==null||p.call(e)}),window.addEventListener("message",d),window.addEventListener("keydown",c),document.body.appendChild(n),n.style.opacity="0",{destroy:s}}async function Tt(t,e,r={}){const{renderCheckout:n}=await Promise.resolve().then(()=>mr);return n(t,e,r)}const It={configure(t){ht(t)},checkout:{redirect:yt,open:Et,mount:Tt}};var re,k,$e,M,Re,je,Ae,ve,ne,J,Ue,be,ke,xe,oe={},le=[],Lt=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,ie=Array.isArray;function U(t,e){for(var r in e)t[r]=e[r];return t}function we(t){t&&t.parentNode&&t.parentNode.removeChild(t)}function Ft(t,e,r){var n,o,l,u={};for(l in e)l=="key"?n=e[l]:l=="ref"?o=e[l]:u[l]=e[l];if(arguments.length>2&&(u.children=arguments.length>3?re.call(arguments,2):r),typeof t=="function"&&t.defaultProps!=null)for(l in t.defaultProps)u[l]===void 0&&(u[l]=t.defaultProps[l]);return ae(t,u,n,o,null)}function ae(t,e,r,n,o){var l={type:t,props:e,key:r,ref:n,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:o??++$e,__i:-1,__u:0};return o==null&&k.vnode!=null&&k.vnode(l),l}function j(t){return t.children}function ce(t,e){this.props=t,this.context=e}function z(t,e){if(e==null)return t.__?z(t.__,t.__i+1):null;for(var r;e<t.__k.length;e++)if((r=t.__k[e])!=null&&r.__e!=null)return r.__e;return typeof t.type=="function"?z(t):null}function $t(t){if(t.__P&&t.__d){var e=t.__v,r=e.__e,n=[],o=[],l=U({},e);l.__v=e.__v+1,k.vnode&&k.vnode(l),Se(t.__P,l,e,t.__n,t.__P.namespaceURI,32&e.__u?[r]:null,n,r??z(e),!!(32&e.__u),o),l.__v=e.__v,l.__.__k[l.__i]=l,qe(n,l,o),e.__e=e.__=null,l.__e!=r&&Oe(l)}}function Oe(t){if((t=t.__)!=null&&t.__c!=null)return t.__e=t.__c.base=null,t.__k.some(function(e){if(e!=null&&e.__e!=null)return t.__e=t.__c.base=e.__e}),Oe(t)}function Me(t){(!t.__d&&(t.__d=!0)&&M.push(t)&&!se.__r++||Re!=k.debounceRendering)&&((Re=k.debounceRendering)||je)(se)}function se(){try{for(var t,e=1;M.length;)M.length>e&&M.sort(Ae),t=M.shift(),e=M.length,$t(t)}finally{M.length=se.__r=0}}function Ne(t,e,r,n,o,l,u,s,d,c,p){var f,i,_,g,w,m,v,h=n&&n.__k||le,b=e.length;for(d=Rt(r,e,h,d,b),f=0;f<b;f++)(_=r.__k[f])!=null&&(i=_.__i!=-1&&h[_.__i]||oe,_.__i=f,m=Se(t,_,i,o,l,u,s,d,c,p),g=_.__e,_.ref&&i.ref!=_.ref&&(i.ref&&Pe(i.ref,null,_),p.push(_.ref,_.__c||g,_)),w==null&&g!=null&&(w=g),(v=!!(4&_.__u))||i.__k===_.__k?(d=ze(_,d,t,v),v&&i.__e&&(i.__e=null)):typeof _.type=="function"&&m!==void 0?d=m:g&&(d=g.nextSibling),_.__u&=-7);return r.__e=w,d}function Rt(t,e,r,n,o){var l,u,s,d,c,p=r.length,f=p,i=0;for(t.__k=new Array(o),l=0;l<o;l++)(u=e[l])!=null&&typeof u!="boolean"&&typeof u!="function"?(typeof u=="string"||typeof u=="number"||typeof u=="bigint"||u.constructor==String?u=t.__k[l]=ae(null,u,null,null,null):ie(u)?u=t.__k[l]=ae(j,{children:u},null,null,null):u.constructor===void 0&&u.__b>0?u=t.__k[l]=ae(u.type,u.props,u.key,u.ref?u.ref:null,u.__v):t.__k[l]=u,d=l+i,u.__=t,u.__b=t.__b+1,s=null,(c=u.__i=jt(u,r,d,f))!=-1&&(f--,(s=r[c])&&(s.__u|=2)),s==null||s.__v==null?(c==-1&&(o>p?i--:o<p&&i++),typeof u.type!="function"&&(u.__u|=4)):c!=d&&(c==d-1?i--:c==d+1?i++:(c>d?i--:i++,u.__u|=4))):t.__k[l]=null;if(f)for(l=0;l<p;l++)(s=r[l])!=null&&(2&s.__u)==0&&(s.__e==n&&(n=z(s)),We(s,s));return n}function ze(t,e,r,n){var o,l;if(typeof t.type=="function"){for(o=t.__k,l=0;o&&l<o.length;l++)o[l]&&(o[l].__=t,e=ze(o[l],e,r,n));return e}t.__e!=e&&(n&&(e&&t.type&&!e.parentNode&&(e=z(t)),r.insertBefore(t.__e,e||null)),e=t.__e);do e=e&&e.nextSibling;while(e!=null&&e.nodeType==8);return e}function jt(t,e,r,n){var o,l,u,s=t.key,d=t.type,c=e[r],p=c!=null&&(2&c.__u)==0;if(c===null&&s==null||p&&s==c.key&&d==c.type)return r;if(n>(p?1:0)){for(o=r-1,l=r+1;o>=0||l<e.length;)if((c=e[u=o>=0?o--:l++])!=null&&(2&c.__u)==0&&s==c.key&&d==c.type)return u}return-1}function De(t,e,r){e[0]=="-"?t.setProperty(e,r??""):t[e]=r==null?"":typeof r!="number"||Lt.test(e)?r:r+"px"}function ue(t,e,r,n,o){var l,u;e:if(e=="style")if(typeof r=="string")t.style.cssText=r;else{if(typeof n=="string"&&(t.style.cssText=n=""),n)for(e in n)r&&e in r||De(t.style,e,"");if(r)for(e in r)n&&r[e]==n[e]||De(t.style,e,r[e])}else if(e[0]=="o"&&e[1]=="n")l=e!=(e=e.replace(Ue,"$1")),u=e.toLowerCase(),e=u in t||e=="onFocusOut"||e=="onFocusIn"?u.slice(2):e.slice(2),t.l||(t.l={}),t.l[e+l]=r,r?n?r[J]=n[J]:(r[J]=be,t.addEventListener(e,l?xe:ke,l)):t.removeEventListener(e,l?xe:ke,l);else{if(o=="http://www.w3.org/2000/svg")e=e.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(e!="width"&&e!="height"&&e!="href"&&e!="list"&&e!="form"&&e!="tabIndex"&&e!="download"&&e!="rowSpan"&&e!="colSpan"&&e!="role"&&e!="popover"&&e in t)try{t[e]=r??"";break e}catch{}typeof r=="function"||(r==null||r===!1&&e[4]!="-"?t.removeAttribute(e):t.setAttribute(e,e=="popover"&&r==1?"":r))}}function Be(t){return function(e){if(this.l){var r=this.l[e.type+t];if(e[ne]==null)e[ne]=be++;else if(e[ne]<r[J])return;return r(k.event?k.event(e):e)}}}function Se(t,e,r,n,o,l,u,s,d,c){var p,f,i,_,g,w,m,v,h,b,y,P,x,$,N,A,C=e.type;if(e.constructor!==void 0)return null;128&r.__u&&(d=!!(32&r.__u),l=[s=e.__e=r.__e]),(p=k.__b)&&p(e);e:if(typeof C=="function"){f=u.length;try{if(h=e.props,b=C.prototype&&C.prototype.render,y=(p=C.contextType)&&n[p.__c],P=p?y?y.props.value:p.__:n,r.__c?v=(i=e.__c=r.__c).__=i.__E:(b?e.__c=i=new C(h,P):(e.__c=i=new ce(h,P),i.constructor=C,i.render=Ut),y&&y.sub(i),i.state||(i.state={}),i.__n=n,_=i.__d=!0,i.__h=[],i._sb=[]),b&&i.__s==null&&(i.__s=i.state),b&&C.getDerivedStateFromProps!=null&&(i.__s==i.state&&(i.__s=U({},i.__s)),U(i.__s,C.getDerivedStateFromProps(h,i.__s))),g=i.props,w=i.state,i.__v=e,_)b&&C.getDerivedStateFromProps==null&&i.componentWillMount!=null&&i.componentWillMount(),b&&i.componentDidMount!=null&&i.__h.push(i.componentDidMount);else{if(b&&C.getDerivedStateFromProps==null&&h!==g&&i.componentWillReceiveProps!=null&&i.componentWillReceiveProps(h,P),e.__v==r.__v||!i.__e&&i.shouldComponentUpdate!=null&&i.shouldComponentUpdate(h,i.__s,P)===!1){e.__v!=r.__v&&(i.props=h,i.state=i.__s,i.__d=!1),e.__e=r.__e,e.__k=r.__k,e.__k.some(function(L){L&&(L.__=e)}),le.push.apply(i.__h,i._sb),i._sb=[],i.__h.length&&u.push(i);break e}i.componentWillUpdate!=null&&i.componentWillUpdate(h,i.__s,P),b&&i.componentDidUpdate!=null&&i.__h.push(function(){i.componentDidUpdate(g,w,m)})}if(i.context=P,i.props=h,i.__P=t,i.__e=!1,x=k.__r,$=0,b)i.state=i.__s,i.__d=!1,x&&x(e),p=i.render(i.props,i.state,i.context),le.push.apply(i.__h,i._sb),i._sb=[];else do i.__d=!1,x&&x(e),p=i.render(i.props,i.state,i.context),i.state=i.__s;while(i.__d&&++$<25);i.state=i.__s,i.getChildContext!=null&&(n=U(U({},n),i.getChildContext())),b&&!_&&i.getSnapshotBeforeUpdate!=null&&(m=i.getSnapshotBeforeUpdate(g,w)),N=p!=null&&p.type===j&&p.key==null?Ve(p.props.children):p,s=Ne(t,ie(N)?N:[N],e,r,n,o,l,u,s,d,c),i.base=e.__e,e.__u&=-161,i.__h.length&&u.push(i),v&&(i.__E=i.__=null)}catch(L){if(u.length=f,e.__v=null,d||l!=null){if(L.then){for(e.__u|=d?160:128;s&&s.nodeType==8&&s.nextSibling;)s=s.nextSibling;l!=null&&(l[l.indexOf(s)]=null),e.__e=s}else if(l!=null)for(A=l.length;A--;)we(l[A])}else e.__e=r.__e;e.__k==null&&(e.__k=r.__k||[]),L.then||He(e),k.__e(L,e,r)}}else l==null&&e.__v==r.__v?(e.__k=r.__k,e.__e=r.__e):s=e.__e=At(r.__e,e,r,n,o,l,u,d,c);return(p=k.diffed)&&p(e),128&e.__u?void 0:s}function He(t){t&&(t.__c&&(t.__c.__e=!0),t.__k&&t.__k.some(He))}function qe(t,e,r){for(var n=0;n<r.length;n++)Pe(r[n],r[++n],r[++n]);k.__c&&k.__c(e,t),t.some(function(o){try{t=o.__h,o.__h=[],t.some(function(l){l.call(o)})}catch(l){k.__e(l,o.__v)}})}function Ve(t){return typeof t!="object"||t==null||t.__b>0?t:ie(t)?t.map(Ve):t.constructor!==void 0?null:U({},t)}function At(t,e,r,n,o,l,u,s,d){var c,p,f,i,_,g,w,m=r.props||oe,v=e.props,h=e.type;if(h=="svg"?o="http://www.w3.org/2000/svg":h=="math"?o="http://www.w3.org/1998/Math/MathML":o||(o="http://www.w3.org/1999/xhtml"),l!=null){for(c=0;c<l.length;c++)if((_=l[c])&&"setAttribute"in _==!!h&&(h?_.localName==h:_.nodeType==3)){t=_,l[c]=null;break}}if(t==null){if(h==null)return document.createTextNode(v);t=document.createElementNS(o,h,v.is&&v),s&&(k.__m&&k.__m(e,l),s=!1),l=null}if(h==null)m===v||s&&t.data==v||(t.data=v);else{if(l=h=="textarea"&&v.defaultValue!=null?null:l&&re.call(t.childNodes),!s&&l!=null)for(m={},c=0;c<t.attributes.length;c++)m[(_=t.attributes[c]).name]=_.value;for(c in m)_=m[c],c=="dangerouslySetInnerHTML"?f=_:c=="children"||c in v||c=="value"&&"defaultValue"in v||c=="checked"&&"defaultChecked"in v||ue(t,c,null,_,o);for(c in v)_=v[c],c=="children"?i=_:c=="dangerouslySetInnerHTML"?p=_:c=="value"?g=_:c=="checked"?w=_:s&&typeof _!="function"||m[c]===_||ue(t,c,_,m[c],o);if(p)s||f&&(p.__html==f.__html||p.__html==t.innerHTML)||(t.innerHTML=p.__html),e.__k=[];else if(f&&(t.innerHTML=""),Ne(e.type=="template"?t.content:t,ie(i)?i:[i],e,r,n,h=="foreignObject"?"http://www.w3.org/1999/xhtml":o,l,u,l?l[0]:r.__k&&z(r,0),s,d),l!=null)for(c=l.length;c--;)we(l[c]);s&&h!="textarea"||(c="value",h=="progress"&&g==null?t.removeAttribute("value"):g!=null&&(g!==t[c]||h=="progress"&&!g||h=="option"&&g!=m[c])&&ue(t,c,g,m[c],o),c="checked",w!=null&&w!=t[c]&&ue(t,c,w,m[c],o))}return t}function Pe(t,e,r){try{if(typeof t=="function"){var n=typeof t.__u=="function";n&&t.__u(),n&&e==null||(t.__u=t(e))}else t.current=e}catch(o){k.__e(o,r)}}function We(t,e,r){var n,o;if(k.unmount&&k.unmount(t),(n=t.ref)&&(n.current&&n.current!=t.__e||Pe(n,null,e)),(n=t.__c)!=null){if(n.componentWillUnmount)try{n.componentWillUnmount()}catch(l){k.__e(l,e)}n.base=n.__P=n.__n=null}if(n=t.__k)for(o=0;o<n.length;o++)n[o]&&We(n[o],e,r||typeof t.type!="function");r||we(t.__e),t.__c=t.__=t.__e=void 0}function Ut(t,e,r){return this.constructor(t,r)}function Je(t,e,r){var n,o,l,u;e==document&&(e=document.documentElement),k.__&&k.__(t,e),o=(n=!1)?null:e.__k,l=[],u=[],Se(e,t=e.__k=Ft(j,null,[t]),o||oe,oe,e.namespaceURI,o?null:e.firstChild?re.call(e.childNodes):null,l,o?o.__e:e.firstChild,n,u),qe(l,t,u),t.props.children=null}re=le.slice,k={__e:function(t,e,r,n){for(var o,l,u;e=e.__;)if((o=e.__c)&&!o.__)try{if((l=o.constructor)&&l.getDerivedStateFromError!=null&&(o.setState(l.getDerivedStateFromError(t)),u=o.__d),o.componentDidCatch!=null&&(o.componentDidCatch(t,n||{}),u=o.__d),u)return o.__E=o}catch(s){t=s}throw t}},$e=0,ce.prototype.setState=function(t,e){var r;r=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=U({},this.state),typeof t=="function"&&(t=t(U({},r),this.props)),t&&U(r,t),t!=null&&this.__v&&(e&&this._sb.push(e),Me(this))},ce.prototype.forceUpdate=function(t){this.__v&&(this.__e=!0,t&&this.__h.push(t),Me(this))},ce.prototype.render=j,M=[],je=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,Ae=function(t,e){return t.__v.__b-e.__v.__b},se.__r=0,ve=Math.random().toString(8),ne="__d"+ve,J="__a"+ve,Ue=/(PointerCapture)$|Capture$/i,be=0,ke=Be(!1),xe=Be(!0);var Ot=0;function a(t,e,r,n,o,l){e||(e={});var u,s,d=e;if("ref"in d)for(s in d={},e)s=="ref"?u=e[s]:d[s]=e[s];var c={type:t,props:d,key:r,ref:u,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--Ot,__i:-1,__u:0,__source:o,__self:l};if(typeof t=="function"&&(u=t.defaultProps))for(s in u)d[s]===void 0&&(d[s]=u[s]);return k.vnode&&k.vnode(c),c}const Mt=`
:host {
  --pk-color-primary: #1DC6C4;
  --pk-color-primary-hover: color-mix(in srgb, var(--pk-color-primary) 88%, #000);
  --pk-color-on-primary: #fff;
  --pk-color-background: #FDFEFB;
  --pk-color-surface: #fff;
  --pk-color-text: #061928;
  --pk-color-text-muted: #676867;
  --pk-color-border: #CCCCCB;
  --pk-color-border-strong: #949494;
  --pk-color-hover: #F8F8F8;
  --pk-color-danger: #D41C22;
  --pk-color-success: #008044;
  --pk-color-warning: #F18579;
  --pk-color-signature: #C8B898;
  --pk-font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --pk-radius: 8px;

  all: initial;
  display: block;
  font-family: var(--pk-font-family);
  color: var(--pk-color-text);
  -webkit-font-smoothing: antialiased;
}

*, *::before, *::after { box-sizing: border-box; }

.root {
  background: var(--pk-color-background);
  border-radius: calc(var(--pk-radius) * 1.5);
  padding: 16px;
  max-width: 480px;
  margin: 0 auto;
}

.stack > * + * { margin-top: 16px; }
.stack-sm > * + * { margin-top: 8px; }

h2, h3, p, ul, hr { margin: 0; }
ul { padding: 0; list-style: none; }
hr { border: none; border-top: 1px solid var(--pk-color-border); }
/* Dividers only separate sections; none above the first one. */
.stack-sm > hr:first-child { display: none; }
.stack-sm > hr:first-child + * { margin-top: 0; }
a { color: var(--pk-color-primary); font-weight: 600; text-decoration: none; }
a:hover { text-decoration: underline; }

.section-title { font-size: 16px; font-weight: 600; }
.muted { font-size: 14px; color: var(--pk-color-text-muted); }
.small { font-size: 12px; color: var(--pk-color-text-muted); }
.error-text { font-size: 14px; color: var(--pk-color-danger); }

.center-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 0;
  text-align: center;
}

.status-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.status-icon svg { width: 32px; height: 32px; }
.status-icon.success { background: color-mix(in srgb, var(--pk-color-success) 10%, transparent); color: var(--pk-color-success); }
.status-icon.error { background: color-mix(in srgb, var(--pk-color-danger) 10%, transparent); color: var(--pk-color-danger); }
.status-icon.expired { background: color-mix(in srgb, var(--pk-color-warning) 20%, transparent); color: var(--pk-color-danger); }
.status-title { font-size: 20px; font-weight: 700; }

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: pk-spin 0.7s linear infinite;
}
.spinner.lg { width: 32px; height: 32px; color: var(--pk-color-primary); }
@keyframes pk-spin { to { transform: rotate(360deg); } }

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: var(--pk-radius);
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn.primary { background: var(--pk-color-primary); color: var(--pk-color-on-primary); width: 100%; }
.btn.primary:hover:not(:disabled) { background: var(--pk-color-primary-hover); }
.btn.secondary { background: var(--pk-color-surface); color: var(--pk-color-text); border: 1px solid var(--pk-color-border); }
.btn.secondary:hover:not(:disabled) { background: var(--pk-color-hover); }
.btn.text {
  background: none;
  color: var(--pk-color-primary);
  padding: 0;
  text-underline-offset: 2px;
}
.btn.text:hover:not(:disabled) { text-decoration: underline; }

.section-header {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}
.section-header .label { font-size: 16px; font-weight: 600; color: var(--pk-color-primary); }
.section-header .chevron { width: 16px; height: 16px; color: var(--pk-color-text-muted); transition: transform 0.15s ease; }
.section-header .chevron.open { transform: rotate(180deg); }

.plan-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.plan-card-wrap { display: flex; flex-direction: column; height: 100%; padding-top: 20px; position: relative; }
.plan-badge {
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  border-radius: calc(var(--pk-radius) * 0.75);
  background: color-mix(in srgb, var(--pk-color-success) 10%, transparent);
  padding: 2px 6px;
  font-size: 9px;
  font-weight: 500;
  line-height: 1;
  color: var(--pk-color-success);
}
.plan-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-radius: calc(var(--pk-radius) * 1.5);
  border: 1px solid var(--pk-color-border);
  background: var(--pk-color-surface);
  padding: 16px 8px;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.plan-card.selected {
  border-color: color-mix(in srgb, var(--pk-color-primary) 40%, transparent);
  background: color-mix(in srgb, var(--pk-color-primary) 5%, transparent);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
.plan-price { font-size: 24px; font-weight: 700; line-height: 1.2; }
.plan-term { font-size: 12px; font-style: italic; color: var(--pk-color-text-muted); }
.plan-select-btn {
  min-width: 64px;
  border-radius: calc(var(--pk-radius) * 0.75);
  border: 1px solid var(--pk-color-border-strong);
  background: var(--pk-color-surface);
  color: var(--pk-color-text);
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}
.plan-select-btn:hover:not(:disabled) { background: var(--pk-color-hover); }
.plan-select-btn:disabled { opacity: 0.5; }
.plan-select-btn.selected { background: var(--pk-color-text); border-color: var(--pk-color-text); color: var(--pk-color-surface); }
.plan-select-btn.selected:hover:not(:disabled) { background: color-mix(in srgb, var(--pk-color-text) 90%, transparent); }

.pay-in-full {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  border-radius: calc(var(--pk-radius) * 1.5);
  border: 1px solid transparent;
  padding: 8px 12px;
}
.pay-in-full.selected {
  border-color: color-mix(in srgb, var(--pk-color-primary) 40%, transparent);
  background: color-mix(in srgb, var(--pk-color-primary) 5%, transparent);
}
.pay-in-full .plan-select-btn { align-self: flex-end; min-width: 80px; }

.row { display: flex; align-items: center; justify-content: space-between; font-size: 14px; }
.row .label { color: var(--pk-color-text-muted); }
.row .value { color: var(--pk-color-text); }
.row.bold .label, .row.bold .value { font-weight: 600; color: var(--pk-color-text); }

.summary-card {
  border-radius: calc(var(--pk-radius) * 1.5);
  border: 1px solid var(--pk-color-border);
  background: var(--pk-color-surface);
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.summary-card .card-title { font-size: 14px; font-weight: 600; color: var(--pk-color-primary); }
.summary-card .card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }

.sign-box {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: var(--pk-radius);
  border: 2px dashed var(--pk-color-signature);
  background: color-mix(in srgb, var(--pk-color-signature) 5%, transparent);
  padding: 16px;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  color: var(--pk-color-text);
  cursor: pointer;
}
.sign-box:hover:not(:disabled) { background: color-mix(in srgb, var(--pk-color-signature) 10%, transparent); }
.sign-box:disabled { opacity: 0.5; }
.sign-box svg { width: 16px; height: 16px; }

.signed-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: var(--pk-radius);
  border: 2px dashed color-mix(in srgb, var(--pk-color-success) 50%, transparent);
  background: color-mix(in srgb, var(--pk-color-success) 5%, transparent);
  padding: 12px 16px;
}
.signed-box .name { font-size: 14px; font-weight: 500; }
.signed-box .clear {
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  color: var(--pk-color-primary);
  cursor: pointer;
  text-underline-offset: 2px;
}
.signed-box .clear:hover:not(:disabled) { text-decoration: underline; }

.name-prompt {
  border-radius: var(--pk-radius);
  border: 2px dashed var(--pk-color-signature);
  background: color-mix(in srgb, var(--pk-color-signature) 5%, transparent);
  padding: 12px 16px;
}
.name-prompt label { display: block; font-size: 12px; color: var(--pk-color-text-muted); margin-bottom: 8px; }
.name-prompt .controls { display: flex; gap: 8px; }
.name-prompt input {
  flex: 1;
  border-radius: calc(var(--pk-radius) * 0.75);
  border: 1px solid var(--pk-color-border);
  background: var(--pk-color-surface);
  color: var(--pk-color-text);
  padding: 8px 12px;
  font-size: 14px;
  font-family: inherit;
}
.name-prompt input:focus { border-color: var(--pk-color-primary); outline: none; }
.name-prompt .confirm {
  border: none;
  border-radius: calc(var(--pk-radius) * 0.75);
  background: var(--pk-color-text);
  color: var(--pk-color-surface);
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}
.name-prompt .confirm:disabled { opacity: 0.5; }

.expiry-note { font-size: 12px; color: var(--pk-color-warning); text-align: center; }
.cancel-row { margin-top: 16px; text-align: center; }
.cancel-row button {
  background: none;
  border: none;
  font-size: 14px;
  font-family: inherit;
  color: var(--pk-color-border-strong);
  cursor: pointer;
  text-underline-offset: 2px;
}
.cancel-row button:hover { text-decoration: underline; }
`;var Y,S,Ce,Ye,G=0,Ge=[],E=k,Ke=E.__b,Xe=E.__r,Qe=E.diffed,Ze=E.__c,et=E.unmount,tt=E.__;function Ee(t,e){E.__h&&E.__h(S,t,G||e),G=0;var r=S.__H||(S.__H={__:[],__h:[]});return t>=r.__.length&&r.__.push({}),r.__[t]}function I(t){return G=1,Nt(lt,t)}function Nt(t,e,r){var n=Ee(Y++,2);if(n.t=t,!n.__c&&(n.__=[lt(void 0,e),function(s){var d=n.__N?n.__N[0]:n.__[0],c=n.t(d,s);d!==c&&(n.__N=[c,n.__[1]],n.__c.setState({}))}],n.__c=S,!S.__f)){var o=function(s,d,c){if(!n.__c.__H)return!0;var p=!1,f=n.__c.props!==s;if(n.__c.__H.__.some(function(_){if(_.__N){p=!0;var g=_.__[0];_.__=_.__N,_.__N=void 0,g!==_.__[0]&&(f=!0)}}),l){var i=l.call(this,s,d,c);return p?i||f:i}return!p||f};S.__f=!0;var l=S.shouldComponentUpdate,u=S.componentWillUpdate;S.componentWillUpdate=function(s,d,c){if(this.__e){var p=l;l=void 0,o(s,d,c),l=p}u&&u.call(this,s,d,c)},S.shouldComponentUpdate=o}return n.__N||n.__}function D(t,e){var r=Ee(Y++,3);!E.__s&&ot(r.__H,e)&&(r.__=t,r.u=e,S.__H.__h.push(r))}function K(t){return G=5,rt(function(){return{current:t}},[])}function rt(t,e){var r=Ee(Y++,7);return ot(r.__H,e)&&(r.__=t(),r.__H=e,r.__h=t),r.__}function de(t,e){return G=8,rt(function(){return t},e)}function zt(){for(var t;t=Ge.shift();){var e=t.__H;if(t.__P&&e)try{e.__h.some(pe),e.__h.some(Te),e.__h=[]}catch(r){e.__h=[],E.__e(r,t.__v)}}}E.__b=function(t){S=null,Ke&&Ke(t)},E.__=function(t,e){t&&e.__k&&e.__k.__m&&(t.__m=e.__k.__m),tt&&tt(t,e)},E.__r=function(t){Xe&&Xe(t),Y=0;var e=(S=t.__c).__H;e&&(Ce===S?(e.__h=[],S.__h=[],e.__.some(function(r){r.__N&&(r.__=r.__N),r.u=r.__N=void 0})):(e.__h.some(pe),e.__h.some(Te),e.__h=[],Y=0)),Ce=S},E.diffed=function(t){Qe&&Qe(t);var e=t.__c;e&&e.__H&&(e.__H.__h.length&&(Ge.push(e)!==1&&Ye===E.requestAnimationFrame||((Ye=E.requestAnimationFrame)||Dt)(zt)),e.__H.__.some(function(r){r.u&&(r.__H=r.u,r.u=void 0)})),Ce=S=null},E.__c=function(t,e){e.some(function(r){try{r.__h.some(pe),r.__h=r.__h.filter(function(n){return!n.__||Te(n)})}catch(n){e.some(function(o){o.__h&&(o.__h=[])}),e=[],E.__e(n,r.__v)}}),Ze&&Ze(t,e)},E.unmount=function(t){et&&et(t);var e,r=t.__c;r&&r.__H&&(r.__H.__.some(function(n){try{pe(n)}catch(o){e=o}}),r.__H=void 0,e&&E.__e(e,r.__v))};var nt=typeof requestAnimationFrame=="function";function Dt(t){var e,r=function(){clearTimeout(n),nt&&cancelAnimationFrame(e),setTimeout(t)},n=setTimeout(r,35);nt&&(e=requestAnimationFrame(r))}function pe(t){var e=S,r=t.__c;typeof r=="function"&&(t.__c=void 0,r()),S=e}function Te(t){var e=S;t.__c=t.__(),S=e}function ot(t,e){return!t||t.length!==e.length||e.some(function(r,n){return r!==t[n]})}function lt(t,e){return typeof e=="function"?e(t):e}async function _e(t,e){const r=await fetch(`${mt()}${t}`,{...e,headers:{"Content-Type":"application/json",...e==null?void 0:e.headers}});if(!r.ok){const n=await r.json().catch(()=>({error:r.statusText}));throw new W(typeof n.error=="string"?n.error:"request_failed",typeof n.message=="string"?n.message:typeof n.error=="string"?n.error:`Request failed: ${r.status}`,r.status)}return r.json()}function Bt(t){return _e(`/checkout/sessions/${t}/details`)}function Ht(t,e){const r=typeof e=="number"?{term_length:e}:{payment_option:e.payment_option};return _e(`/checkout/sessions/${t}/select-plan`,{method:"POST",body:JSON.stringify(r)})}function it(t){return _e(`/checkout/sessions/${t}/prepare-payment`,{method:"POST"})}function qt(t,e){const r={signature:e.signature,payment_method_id:e.paymentMethodId};return e.paymentIntentId&&(r.payment_intent_id=e.paymentIntentId),e.setupIntentId&&(r.setup_intent_id=e.setupIntentId),_e(`/checkout/sessions/${t}/confirm`,{method:"POST",body:JSON.stringify(r)})}function Vt(t){const[e,r]=I({state:"loading",session:null,payment:null,contractId:null,error:null});D(()=>{let s=!1;async function d(){try{const c=await Bt(t);if(s)return;if(c.status==="completed"){r({state:"success",session:c,payment:null,contractId:c.contract_id,error:null});return}if(c.status==="expired"||c.status==="canceled"){r({state:"expired",session:c,payment:null,contractId:null,error:null});return}if(c.status==="payment_ready"&&c.selected_plan){r({state:"loading",session:c,payment:null,contractId:null,error:null});try{const p=await it(t);s||r({state:"review",session:c,payment:p,contractId:null,error:null})}catch{s||r({state:"selectPlan",session:c,payment:null,contractId:null,error:null})}return}r({state:"selectPlan",session:c,payment:null,contractId:null,error:null})}catch(c){if(s)return;const p=c instanceof W?c:null;(p==null?void 0:p.status)===410?r({state:"expired",session:null,payment:null,contractId:null,error:null}):r({state:"error",session:null,payment:null,contractId:null,error:c.message??"Failed to load checkout session"})}}return d(),()=>{s=!0}},[t]);const n=de(async s=>{try{const d=await Ht(t,s);r(p=>({...p,session:p.session?{...p.session,selected_plan:d.selected_plan,status:"plan_selected",expires_at:d.expires_at}:p.session,error:null}));const c=await it(t);r(p=>({...p,state:"review",payment:c,session:p.session?{...p.session,status:"payment_ready"}:p.session}))}catch(d){r(c=>({...c,error:d.message??"Failed to select plan"}))}},[t]),o=de(async s=>{r(d=>({...d,state:"processing",error:null}));try{const d=await qt(t,s);r(c=>({...c,state:"success",contractId:d.contract_id,session:c.session?{...c.session,status:"completed"}:c.session}))}catch(d){r(c=>({...c,state:"review",error:d.message??"Payment failed"}))}},[t]),l=de(()=>{r(s=>({...s,state:"expired"}))},[]),u=de(()=>{r(s=>({...s,state:"selectPlan",payment:null,error:null}))},[]);return{...e,selectPlan:n,confirm:o,setExpired:l,backToPlanSelection:u}}function Wt(t){const[e,r]=I(null);return D(()=>{if(!t)return;const n=new Date(t).getTime();function o(){const u=Math.max(0,Math.floor((n-Date.now())/1e3));r(u)}o();const l=setInterval(o,1e3);return()=>clearInterval(l)},[t]),e}const Jt=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"});function T(t){return Jt.format(t/100)}function at(t){return t===1?"1 month":`${t} months`}function Ie({large:t=!1}){return a("span",{class:`spinner${t?" lg":""}`,role:"status","aria-label":"Loading"})}function Yt({children:t,onClick:e,type:r="button",variant:n="primary",loading:o=!1,disabled:l=!1}){return a("button",{type:r,class:`btn ${n}`,disabled:l||o,onClick:e,children:[o&&a(Ie,{}),t]})}function Gt(){return a("div",{class:"center-col",children:[a(Ie,{large:!0}),a("p",{class:"muted",children:"Loading checkout..."})]})}function Kt(){return a("div",{class:"center-col",children:[a("div",{class:"status-icon success",children:a("svg",{fill:"none",viewBox:"0 0 24 24",stroke:"currentColor","stroke-width":"2",children:a("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M5 13l4 4L19 7"})})}),a("h2",{class:"status-title",children:"Payment Successful"})]})}function Xt({message:t}){return a("div",{class:"center-col",children:[a("div",{class:"status-icon error",children:a("svg",{fill:"none",viewBox:"0 0 24 24",stroke:"currentColor","stroke-width":"2",children:a("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})})}),a("h2",{class:"status-title",children:"Something went wrong"}),a("p",{class:"muted",children:t})]})}function Qt(){return a("div",{class:"center-col",children:[a("div",{class:"status-icon expired",children:a("svg",{fill:"none",viewBox:"0 0 24 24",stroke:"currentColor","stroke-width":"2",children:a("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"})})}),a("h2",{class:"status-title",children:"Session Expired"}),a("p",{class:"muted",children:"This checkout session has expired. Please contact your provider for a new link."})]})}function B({label:t,value:e,bold:r=!1}){return a("div",{class:`row${r?" bold":""}`,children:[a("span",{class:"label",children:t}),a("span",{class:"value",children:e})]})}function X(t){return t.term_length===1||t.down_payment===t.total_amount}function Zt({plan:t,feeAmount:e=0}){const r=X(t);return a("div",{class:"summary-card",children:[a("div",{class:"card-head",children:a("h3",{class:"card-title",children:r?"Pay in full":"Your Payment Plan"})}),a("div",{class:"stack-sm",children:[!r&&a(j,{children:[a(B,{label:"Monthly Payment",value:`${T(t.monthly_payment)} / mo`}),a(B,{label:"Term",value:at(t.term_length)}),t.down_payment>0&&a(B,{label:"Down Payment",value:T(t.down_payment)}),a(B,{label:"Total",value:T(t.total_amount)}),a("hr",{}),a(B,{label:"Due Today",value:T(t.down_payment),bold:!0})]}),r&&a(j,{children:[a(B,{label:"Due Today",value:T(t.total_amount),bold:!0}),e>0&&a("p",{class:"small",children:["Includes ",T(e)," service fee"]})]})]})]})}function er({customerName:t,oneTimeAmount:e=null,serviceAgreementUrl:r,signature:n,onChange:o,disabled:l=!1}){const[u,s]=I(!1),[d,c]=I(t??"");function p(){if(!l){if(t&&t.trim().length>0){o(t.trim());return}s(!0)}}function f(){const _=d.trim();_.length!==0&&(o(_),s(!1))}function i(){o(null),s(!1)}return a("section",{class:"stack-sm",children:[a("h3",{class:"section-title",children:"Signature"}),a("p",{class:"muted",children:[e!=null?`By signing below, you authorize a one-time payment of ${T(e)}`:"By signing below, you agree to the terms above",r?a(j,{children:[e!=null?" and agree to the ":" and the ",a("a",{href:r,target:"_blank",rel:"noreferrer",children:"Client Service Agreement"})]}):null,"."]}),n?a("div",{class:"signed-box",children:[a("span",{class:"name",children:["✓ Signed by ",n]}),a("button",{type:"button",class:"clear",onClick:i,disabled:l,children:"Clear"})]}):u?a("div",{class:"name-prompt",children:[a("label",{for:"pk-signature-name",children:"Type your full name to sign"}),a("div",{class:"controls",children:[a("input",{id:"pk-signature-name",type:"text",value:d,onInput:_=>c(_.target.value),disabled:l,placeholder:"Full name"}),a("button",{type:"button",class:"confirm",onClick:f,disabled:l||d.trim().length===0,children:"Sign"})]})]}):a("button",{type:"button",class:"sign-box",onClick:p,disabled:l,children:[a("svg",{viewBox:"0 0 20 20",fill:"currentColor","aria-hidden":!0,children:a("path",{"fill-rule":"evenodd",d:"M10 3a1 1 0 011 1v9.586l3.293-3.293a1 1 0 011.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 011.414-1.414L9 13.586V4a1 1 0 011-1z","clip-rule":"evenodd"})}),"Click Here to Sign Document"]})]})}function tr({open:t}){return a("svg",{class:`chevron${t?" open":""}`,viewBox:"0 0 20 20",fill:"currentColor","aria-hidden":!0,children:a("path",{"fill-rule":"evenodd",d:"M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z","clip-rule":"evenodd"})})}function Le({label:t,open:e,onToggle:r}){return a("button",{type:"button",class:"section-header",onClick:r,"aria-expanded":e,children:[a("span",{class:"label",children:t}),a(tr,{open:e})]})}function rr({plan:t,selected:e,mostPopular:r,onSelect:n,disabled:o}){return a("div",{class:"plan-card-wrap",children:[r&&a("div",{class:"plan-badge",children:"Most Popular"}),a("div",{class:`plan-card${e?" selected":""}`,children:[a("div",{class:"plan-price",children:T(t.monthly_payment).replace(".00","")}),a("div",{class:"small",children:"per month"}),a("button",{type:"button",class:`plan-select-btn${e?" selected":""}`,"aria-pressed":e,onClick:n,disabled:o,children:"Select"}),a("div",{class:"plan-term",children:at(t.term_length)})]})]})}function nr({session:t,plans:e,payInFullOffered:r,selected:n,onSelect:o,loading:l}){var b;const[u,s]=I(!0),[d,c]=I(!0),[p,f]=I(!0),i=((b=e[Math.floor(e.length/2)])==null?void 0:b.term_length)??null,_=typeof n=="number"?n:n==="full"?null:i,g=e.find(y=>y.term_length===_)??e.find(y=>y.term_length===i)??e[0]??null,w=(g==null?void 0:g.down_payment)??0,m=r?t.pay_in_full??null:null,v=n==="full",h=t.services??[];return a("div",{class:"stack-sm",children:[e.length>0&&a(j,{children:[a("hr",{}),a("section",{children:[a(Le,{label:"Pay Over Time",open:u,onToggle:()=>s(y=>!y)}),u&&a("div",{class:"plan-grid",children:e.map(y=>a(rr,{plan:y,selected:y.term_length===_,mostPopular:y.term_length===i,onSelect:()=>o(y.term_length),disabled:l},y.term_length))}),a("div",{class:"row bold",style:"margin-top: 12px",children:[a("span",{class:"label",children:"Down Payment (due today)"}),a("span",{class:"value",children:T(w)})]})]})]}),m&&a(j,{children:[a("hr",{}),a("section",{"data-pk-section":"pay-in-full",children:[a(Le,{label:"Pay In Full",open:d,onToggle:()=>c(y=>!y)}),d&&a("div",{class:`pay-in-full${v?" selected":""}`,children:[a("div",{class:"stack-sm",children:[a("div",{class:"row bold",children:[a("span",{class:"label",children:"Total:"}),a("span",{class:"value",children:T(m.total_amount)})]}),m.fee_amount>0&&a("p",{class:"small",children:["Includes ",T(m.fee_amount)," service fee"]})]}),a("button",{type:"button",class:`plan-select-btn${v?" selected":""}`,"aria-pressed":v,onClick:()=>o("full"),disabled:l,children:"Select"})]})]})]}),h.length>0&&a(j,{children:[a("hr",{}),a("section",{children:[a(Le,{label:"Items",open:p,onToggle:()=>f(y=>!y)}),p&&a("ul",{class:"stack-sm",children:h.map((y,P)=>{const x=y.quantity??1,$=y.name??"Item";return a("li",{class:"row",children:[a("span",{class:"label",children:[$,x>1?` (x${x})`:""]}),y.amount!=null&&a("span",{class:"label",children:T(y.amount)})]},P)})})]})]})]})}const ct={primary:"--pk-color-primary",primaryText:"--pk-color-on-primary",background:"--pk-color-background",surface:"--pk-color-surface",text:"--pk-color-text",textMuted:"--pk-color-text-muted",border:"--pk-color-border",danger:"--pk-color-danger",success:"--pk-color-success"},Q={colorPrimary:"#1DC6C4",colorBackground:"#FDFEFB",colorText:"#061928",fontFamily:"system-ui, sans-serif",borderRadius:"8px"};function F(t){return typeof t=="string"&&t.trim().length>0}function or(t){const e={};if(!t)return e;const r=t.colors??{};for(const n of Object.keys(ct)){const o=r[n];F(o)&&(e[ct[n]]=o)}return F(t.fontFamily)&&(e["--pk-font-family"]=t.fontFamily),F(t.borderRadius)&&(e["--pk-radius"]=t.borderRadius),e}function lr(t,e){const r=or(e);for(const[n,o]of Object.entries(r))t.style.setProperty(n,o)}function ir(t){if(!t)return;const e=new Set(Array.from(document.head.querySelectorAll("link[data-puurk-font]")).map(r=>r.getAttribute("data-puurk-font")));for(const r of t){if(!F(r==null?void 0:r.cssSrc)||e.has(r.cssSrc))continue;const n=document.createElement("link");n.rel="stylesheet",n.href=r.cssSrc,n.setAttribute("data-puurk-font",r.cssSrc),document.head.appendChild(n),e.add(r.cssSrc)}}function ar(t){const e=(t==null?void 0:t.colors)??{},r={colorPrimary:F(e.primary)?e.primary:Q.colorPrimary,colorBackground:F(e.surface)?e.surface:F(e.background)?e.background:Q.colorBackground,colorText:F(e.text)?e.text:Q.colorText,fontFamily:F(t==null?void 0:t.fontFamily)?t.fontFamily:Q.fontFamily,borderRadius:F(t==null?void 0:t.borderRadius)?t.borderRadius:Q.borderRadius};return F(e.danger)&&(r.colorDanger=e.danger),{theme:"stripe",variables:r}}function cr(t,e){return X(t)?`Sign and Pay ${T(t.total_amount)}`:e==="payment"?`Sign and Pay ${T(t.down_payment)}`:"Sign and Save Card"}function sr({session:t,selectedPlan:e,payment:r,appearance:n,paymentSlotEl:o,onConfirm:l,processing:u,error:s}){var $,N;const[d,c]=I(null),[p,f]=I(null),[i,_]=I(!1),[g,w]=I(!1),m=K(null),v=K(null),h=K(n);h.current=n,D(()=>{let A=!1,C=null;async function L(){try{const{loadStripe:ye}=await Promise.resolve().then(()=>Tr),H=await ye(r.publishable_key);if(A)return;if(!H){f("Failed to load payment form. Please refresh and try again.");return}const O=h.current,te=H.elements({clientSecret:r.client_secret,appearance:ar(O),fonts:O==null?void 0:O.fonts,paymentMethodCreation:"manual"});C=te.create("payment"),C.mount(o),C.on("ready",()=>{A||_(!0)}),m.current=H,v.current=te}catch{A||f("Failed to load payment form. Please refresh and try again.")}}return L(),()=>{A=!0,C==null||C.destroy(),m.current=null,v.current=null}},[r.client_secret,r.publishable_key,o]);const b=X(e),y=cr(e,r.mode);async function P(A){A.preventDefault();const C=m.current,L=v.current;if(!(!C||!L||g)){if(!d){f("Please sign before continuing.");return}f(null),w(!0);try{const{error:ye}=await L.submit();if(ye){f(ye.message??"Please check your card details");return}if(r.mode==="payment"){const{error:te,paymentMethod:Ir}=await C.createPaymentMethod({elements:L});if(te){f(te.message??"Failed to process card");return}l({signature:d,paymentIntentId:r.payment_intent_id,paymentMethodId:Ir.id});return}const{error:H,setupIntent:O}=await C.confirmSetup({elements:L,clientSecret:r.client_secret,redirect:"if_required"});if(H){f(H.message??"Failed to save card");return}if(!O||typeof O.payment_method!="string"){f("Could not retrieve saved payment method.");return}l({signature:d,setupIntentId:O.id,paymentMethodId:O.payment_method})}finally{w(!1)}}}const x=s??p;return a("form",{class:"stack",onSubmit:P,children:[a(Zt,{plan:e,feeAmount:b?(($=t.pay_in_full)==null?void 0:$.fee_amount)??0:0}),a(er,{customerName:((N=t.customer)==null?void 0:N.name)??null,oneTimeAmount:b?e.total_amount:null,serviceAgreementUrl:t.service_agreement_url,signature:d,onChange:c,disabled:u}),a("section",{class:"stack-sm",children:[a("h3",{class:"section-title",children:r.mode==="payment"||b?"Payment details":"Card on file"}),r.mode==="setup"&&!b&&a("p",{class:"small",children:"We'll save your card so we can charge your monthly payments automatically. No charge today."}),!i&&!x&&a("div",{style:"display: flex; justify-content: center; padding: 16px 0",children:a(Ie,{})}),a("slot",{name:"payment"})]}),x&&a("p",{class:"error-text",role:"alert",children:x}),a(Yt,{type:"submit",loading:u||g,disabled:!i||!d,children:y})]})}function ur(t){return(t??[]).filter(e=>!X(e))}function dr(t,e){return e!==!1&&t.pay_in_full!=null}function pr(t,e,r,n){return t??(r?X(r)?n?"full":null:e.some(o=>o.term_length===r.term_length)?r.term_length:null:null)}function _r(t){return t==="full"?{payment_option:"full"}:t}function fr({sessionId:t,paymentSlotEl:e,options:r}){const{state:n,session:o,payment:l,contractId:u,error:s,selectPlan:d,confirm:c,setExpired:p,backToPlanSelection:f}=Vt(t),[i,_]=I(null),[g,w]=I(!1),m=Wt((o==null?void 0:o.expires_at)??null),v=K(!1);D(()=>{var x;if(n==="success"&&!v.current){v.current=!0;const $={session_id:t,contract_id:u,status:"completed"};(x=r.onComplete)==null||x.call(r,$)}},[n,u,t,r]);const h=K(null);D(()=>{var x;n==="error"&&s&&h.current!==s&&(h.current=s,(x=r.onError)==null||x.call(r,new W("checkout_error",s)))},[n,s,r]),D(()=>{m===0&&n!=="expired"&&n!=="success"&&p()},[m,n,p]);const b=o?dr(o,r.payInFull):!1,y=ur((o==null?void 0:o.plans)??null);async function P(x){x==="full"&&!b||x!=="full"&&!y.some($=>$.term_length===x)||(_(x),w(!0),await d(_r(x)),w(!1))}return a("div",{class:"root",children:[m!=null&&m>0&&m<=300&&n!=="success"&&a("p",{class:"expiry-note",children:["Session expires in ",Math.floor(m/60),":",String(m%60).padStart(2,"0")]}),n==="loading"&&a(Gt,{}),n==="error"&&a(Xt,{message:s??"Checkout session not found"}),n==="expired"&&a(Qt,{}),n==="success"&&a(Kt,{}),(n==="selectPlan"||n==="review"||n==="processing")&&o&&a("div",{class:"stack",children:[n==="selectPlan"&&a(nr,{session:o,plans:y,payInFullOffered:b,selected:pr(i,y,o.selected_plan,b),onSelect:P,loading:g}),(n==="review"||n==="processing")&&l&&o.selected_plan&&a(sr,{session:o,selectedPlan:o.selected_plan,payment:l,appearance:r.appearance,paymentSlotEl:e,onConfirm:c,processing:n==="processing",error:s}),s&&n==="selectPlan"&&a("p",{class:"error-text",role:"alert",children:s})]}),(n==="review"||n==="processing")&&a("div",{class:"cancel-row",children:a("button",{type:"button",onClick:f,children:"Back to plan selection"})})]})}function hr(t,e,r){var p;const n=typeof t=="string"?document.querySelector(t):t;if(!n)throw new W("container_not_found",`Puurk.checkout.mount(): no element matches ${JSON.stringify(t)}`);const o=document.createElement("div");o.setAttribute("data-puurk-checkout","true"),lr(o,r.appearance),ir((p=r.appearance)==null?void 0:p.fonts),n.appendChild(o);const l=o.attachShadow({mode:"open"}),u=document.createElement("style");u.textContent=Mt,l.appendChild(u);const s=document.createElement("div");l.appendChild(s);const d=document.createElement("div");d.setAttribute("slot","payment"),o.appendChild(d),Je(a(fr,{sessionId:e,paymentSlotEl:d,options:r}),s);let c=!1;return{destroy(){c||(c=!0,Je(null,s),o.remove())}}}const mr=Object.freeze(Object.defineProperty({__proto__:null,renderCheckout:hr},Symbol.toStringTag,{value:"Module"}));function Z(t){"@babel/helpers - typeof";return typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?Z=function(e){return typeof e}:Z=function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Z(t)}var st="dahlia",yr=function(e){return e===3?"v3":e},ut="https://js.stripe.com",gr="".concat(ut,"/").concat(st,"/stripe.js"),vr=/^https:\/\/js\.stripe\.com\/v3\/?(\?.*)?$/,br=/^https:\/\/js\.stripe\.com\/(v3|[a-z]+)\/stripe\.js(\?.*)?$/,dt="loadStripe.setLoadParameters was called but an existing Stripe.js script already exists in the document; existing script parameters will be used",kr=function(e){return vr.test(e)||br.test(e)},xr=function(){for(var e=document.querySelectorAll('script[src^="'.concat(ut,'"]')),r=0;r<e.length;r++){var n=e[r];if(kr(n.src))return n}return null},pt=function(e){var r=e&&!e.advancedFraudSignals?"?advancedFraudSignals=false":"",n=document.createElement("script");n.src="".concat(gr).concat(r);var o=document.head||document.body;if(!o)throw new Error("Expected document.body not to be null. Stripe.js requires a <body> element.");return o.appendChild(n),n},wr=function(e,r){!e||!e._registerWrapper||e._registerWrapper({name:"stripe-js",version:"9.12.1",startTime:r})},ee=null,fe=null,he=null,Sr=function(e){return function(r){e(new Error("Failed to load Stripe.js",{cause:r}))}},Pr=function(e,r){return function(){window.Stripe?e(window.Stripe):r(new Error("Stripe.js not available"))}},Cr=function(e){return ee!==null?ee:(ee=new Promise(function(r,n){if(typeof window>"u"||typeof document>"u"){r(null);return}if(window.Stripe&&e&&console.warn(dt),window.Stripe){r(window.Stripe);return}try{var o=xr();if(o&&e)console.warn(dt);else if(!o)o=pt(e);else if(o&&he!==null&&fe!==null){var l;o.removeEventListener("load",he),o.removeEventListener("error",fe),(l=o.parentNode)===null||l===void 0||l.removeChild(o),o=pt(e)}he=Pr(r,n),fe=Sr(n),o.addEventListener("load",he),o.addEventListener("error",fe)}catch(u){n(u);return}}),ee.catch(function(r){return ee=null,Promise.reject(r)}))},Er=function(e,r,n){if(e===null)return null;var o=r[0];if(typeof o!="string")throw new Error("Expected publishable key to be of type string, got type ".concat(Z(o)," instead."));var l=o.match(/^pk_test/),u=yr(e.version),s=st;l&&u!==s&&console.warn("Stripe.js@".concat(u," was loaded on the page, but @stripe/stripe-js@").concat("9.12.1"," expected Stripe.js@").concat(s,". This may result in unexpected behavior. For more information, see https://docs.stripe.com/sdks/stripejs-versioning"));var d=e.apply(void 0,r);return wr(d,n),d},_t=function(e){var r=`invalid load parameters; expected object of shape

    {advancedFraudSignals: boolean}

but received

    `.concat(JSON.stringify(e),`
`);if(e===null||Z(e)!=="object")throw new Error(r);if(Object.keys(e).length===1&&typeof e.advancedFraudSignals=="boolean")return e;throw new Error(r)},me,Fe=!1,ft=function(){for(var e=arguments.length,r=new Array(e),n=0;n<e;n++)r[n]=arguments[n];Fe=!0;var o=Date.now();return Cr(me).then(function(l){return Er(l,r,o)})};ft.setLoadParameters=function(t){if(Fe&&me){var e=_t(t),r=Object.keys(e),n=r.reduce(function(o,l){var u;return o&&t[l]===((u=me)===null||u===void 0?void 0:u[l])},!0);if(n)return}if(Fe)throw new Error("You cannot change load parameters after calling loadStripe");me=_t(t)};const Tr=Object.freeze(Object.defineProperty({__proto__:null,loadStripe:ft},Symbol.toStringTag,{value:"Module"}));return It}));
