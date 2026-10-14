/*! @puurk/js v1.1.1 (941ae60) — vendored by scripts/vendor-sdk.mjs */
(function(R,B){typeof exports=="object"&&typeof module<"u"?module.exports=B():typeof define=="function"&&define.amd?define(B):(R=typeof globalThis<"u"?globalThis:R||self,R.Puurk=B())})(this,(function(){"use strict";const R={staging:"https://checkoutstaging.puurk.com",demo:"https://checkoutdemo.puurk.com",sandbox:"https://checkoutsandbox.puurk.com",production:"https://checkout.puurk.com"},B={staging:"https://apistaging.puurk.com",demo:"https://apidemo.puurk.com",sandbox:"https://apisandbox.puurk.com",production:"https://api.puurk.com"};let L={environment:"production"};function st(t){t.environment&&(L={...L,environment:t.environment}),"checkoutUrl"in t&&(L={...L,checkoutUrl:t.checkoutUrl}),"apiUrl"in t&&(L={...L,apiUrl:t.apiUrl})}function de(){return L.checkoutUrl??R[L.environment]}function ct(){return L.apiUrl??B[L.environment]}function ut(t){window.location.href=`${de()}/s/${t}`}class H extends Error{constructor(e,n,r){super(n),this.name="PuurkError",this.code=e,this.status=r}}const dt=`
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
`,_t=`
  position: relative;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  background: #FDFEFB;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  margin: 16px;
`,pt=`
  width: 100%;
  border: none;
  display: block;
  min-height: 400px;
  transition: height 0.2s ease;
`,ft=`
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
`;function ht(t){const e=document.createElement("div");e.setAttribute("style",dt),e.setAttribute("data-puurk-overlay","true");const n=document.createElement("div");n.setAttribute("style",_t);const r=document.createElement("button");r.setAttribute("style",ft),r.setAttribute("aria-label","Close"),r.innerHTML="&#x2715;";const o=document.createElement("iframe");return o.setAttribute("style",pt),o.setAttribute("src",t),o.setAttribute("allow","payment"),o.setAttribute("title","Puurk Checkout"),n.appendChild(r),n.appendChild(o),e.appendChild(n),{overlay:e,container:n,iframe:o,closeButton:r}}function mt(t){t.offsetHeight,t.style.opacity="1"}function yt(t){t.style.opacity="0",setTimeout(()=>{t.remove()},200)}function gt(t){const e=de();try{const n=new URL(e).origin;return t.origin===n}catch{return!1}}function bt(t){if(!gt(t))return null;const e=t.data;return!e||typeof e.type!="string"||!e.type.startsWith("puurk:")?null:e}function vt(t,e={}){const n=`${de()}/s/${t}?embed=true`,{overlay:r,iframe:o,closeButton:i}=ht(n);let u=!1;function c(){u||(u=!0,window.removeEventListener("message",_),window.removeEventListener("keydown",s),yt(r))}function _(d){var l,p,b,w,g,v,m,k,y;const f=bt(d);if(f)switch(f.type){case"puurk:ready":mt(r);break;case"puurk:resize":{const h=(l=f.payload)==null?void 0:l.height;h&&h>0&&(o.style.height=`${h}px`);break}case"puurk:complete":{const h={session_id:((p=f.payload)==null?void 0:p.session_id)??t,contract_id:((b=f.payload)==null?void 0:b.contract_id)??null,status:((w=f.payload)==null?void 0:w.status)??"completed"};c(),(g=e.onComplete)==null||g.call(e,h);break}case"puurk:cancel":c(),(v=e.onCancel)==null||v.call(e);break;case"puurk:error":{const h=new H(((m=f.payload)==null?void 0:m.code)??"checkout_error",((k=f.payload)==null?void 0:k.message)??"An error occurred during checkout");(y=e.onError)==null||y.call(e,h);break}}}function s(d){var f;d.key==="Escape"&&(c(),(f=e.onCancel)==null||f.call(e))}return r.addEventListener("click",d=>{var f;d.target===r&&(c(),(f=e.onCancel)==null||f.call(e))}),i.addEventListener("click",()=>{var d;c(),(d=e.onCancel)==null||d.call(e)}),window.addEventListener("message",_),window.addEventListener("keydown",s),document.body.appendChild(r),r.style.opacity="0",{destroy:c}}async function xt(t,e,n={}){const{renderCheckout:r}=await Promise.resolve().then(()=>nn);return r(t,e,n)}const wt={configure(t){st(t)},checkout:{redirect:ut,open:vt,mount:xt}};var G,x,Pe,O,Ee,Te,Ie,_e,K,q,$e,pe,fe,he,X={},Q=[],kt=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,Z=Array.isArray;function j(t,e){for(var n in e)t[n]=e[n];return t}function me(t){t&&t.parentNode&&t.parentNode.removeChild(t)}function St(t,e,n){var r,o,i,u={};for(i in e)i=="key"?r=e[i]:i=="ref"?o=e[i]:u[i]=e[i];if(arguments.length>2&&(u.children=arguments.length>3?G.call(arguments,2):n),typeof t=="function"&&t.defaultProps!=null)for(i in t.defaultProps)u[i]===void 0&&(u[i]=t.defaultProps[i]);return ee(t,u,r,o,null)}function ee(t,e,n,r,o){var i={type:t,props:e,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:o??++Pe,__i:-1,__u:0};return o==null&&x.vnode!=null&&x.vnode(i),i}function z(t){return t.children}function te(t,e){this.props=t,this.context=e}function D(t,e){if(e==null)return t.__?D(t.__,t.__i+1):null;for(var n;e<t.__k.length;e++)if((n=t.__k[e])!=null&&n.__e!=null)return n.__e;return typeof t.type=="function"?D(t):null}function Ct(t){if(t.__P&&t.__d){var e=t.__v,n=e.__e,r=[],o=[],i=j({},e);i.__v=e.__v+1,x.vnode&&x.vnode(i),ye(t.__P,i,e,t.__n,t.__P.namespaceURI,32&e.__u?[n]:null,r,n??D(e),!!(32&e.__u),o),i.__v=e.__v,i.__.__k[i.__i]=i,De(r,i,o),e.__e=e.__=null,i.__e!=n&&Le(i)}}function Le(t){if((t=t.__)!=null&&t.__c!=null)return t.__e=t.__c.base=null,t.__k.some(function(e){if(e!=null&&e.__e!=null)return t.__e=t.__c.base=e.__e}),Le(t)}function Fe(t){(!t.__d&&(t.__d=!0)&&O.push(t)&&!ne.__r++||Ee!=x.debounceRendering)&&((Ee=x.debounceRendering)||Te)(ne)}function ne(){try{for(var t,e=1;O.length;)O.length>e&&O.sort(Ie),t=O.shift(),e=O.length,Ct(t)}finally{O.length=ne.__r=0}}function je(t,e,n,r,o,i,u,c,_,s,d){var f,l,p,b,w,g,v,m=r&&r.__k||Q,k=e.length;for(_=Pt(n,e,m,_,k),f=0;f<k;f++)(p=n.__k[f])!=null&&(l=p.__i!=-1&&m[p.__i]||X,p.__i=f,g=ye(t,p,l,o,i,u,c,_,s,d),b=p.__e,p.ref&&l.ref!=p.ref&&(l.ref&&ge(l.ref,null,p),d.push(p.ref,p.__c||b,p)),w==null&&b!=null&&(w=b),(v=!!(4&p.__u))||l.__k===p.__k?(_=Me(p,_,t,v),v&&l.__e&&(l.__e=null)):typeof p.type=="function"&&g!==void 0?_=g:b&&(_=b.nextSibling),p.__u&=-7);return n.__e=w,_}function Pt(t,e,n,r,o){var i,u,c,_,s,d=n.length,f=d,l=0;for(t.__k=new Array(o),i=0;i<o;i++)(u=e[i])!=null&&typeof u!="boolean"&&typeof u!="function"?(typeof u=="string"||typeof u=="number"||typeof u=="bigint"||u.constructor==String?u=t.__k[i]=ee(null,u,null,null,null):Z(u)?u=t.__k[i]=ee(z,{children:u},null,null,null):u.constructor===void 0&&u.__b>0?u=t.__k[i]=ee(u.type,u.props,u.key,u.ref?u.ref:null,u.__v):t.__k[i]=u,_=i+l,u.__=t,u.__b=t.__b+1,c=null,(s=u.__i=Et(u,n,_,f))!=-1&&(f--,(c=n[s])&&(c.__u|=2)),c==null||c.__v==null?(s==-1&&(o>d?l--:o<d&&l++),typeof u.type!="function"&&(u.__u|=4)):s!=_&&(s==_-1?l--:s==_+1?l++:(s>_?l--:l++,u.__u|=4))):t.__k[i]=null;if(f)for(i=0;i<d;i++)(c=n[i])!=null&&(2&c.__u)==0&&(c.__e==r&&(r=D(c)),Ae(c,c));return r}function Me(t,e,n,r){var o,i;if(typeof t.type=="function"){for(o=t.__k,i=0;o&&i<o.length;i++)o[i]&&(o[i].__=t,e=Me(o[i],e,n,r));return e}t.__e!=e&&(r&&(e&&t.type&&!e.parentNode&&(e=D(t)),n.insertBefore(t.__e,e||null)),e=t.__e);do e=e&&e.nextSibling;while(e!=null&&e.nodeType==8);return e}function Et(t,e,n,r){var o,i,u,c=t.key,_=t.type,s=e[n],d=s!=null&&(2&s.__u)==0;if(s===null&&c==null||d&&c==s.key&&_==s.type)return n;if(r>(d?1:0)){for(o=n-1,i=n+1;o>=0||i<e.length;)if((s=e[u=o>=0?o--:i++])!=null&&(2&s.__u)==0&&c==s.key&&_==s.type)return u}return-1}function Ue(t,e,n){e[0]=="-"?t.setProperty(e,n??""):t[e]=n==null?"":typeof n!="number"||kt.test(e)?n:n+"px"}function re(t,e,n,r,o){var i,u;e:if(e=="style")if(typeof n=="string")t.style.cssText=n;else{if(typeof r=="string"&&(t.style.cssText=r=""),r)for(e in r)n&&e in n||Ue(t.style,e,"");if(n)for(e in n)r&&n[e]==r[e]||Ue(t.style,e,n[e])}else if(e[0]=="o"&&e[1]=="n")i=e!=(e=e.replace($e,"$1")),u=e.toLowerCase(),e=u in t||e=="onFocusOut"||e=="onFocusIn"?u.slice(2):e.slice(2),t.l||(t.l={}),t.l[e+i]=n,n?r?n[q]=r[q]:(n[q]=pe,t.addEventListener(e,i?he:fe,i)):t.removeEventListener(e,i?he:fe,i);else{if(o=="http://www.w3.org/2000/svg")e=e.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(e!="width"&&e!="height"&&e!="href"&&e!="list"&&e!="form"&&e!="tabIndex"&&e!="download"&&e!="rowSpan"&&e!="colSpan"&&e!="role"&&e!="popover"&&e in t)try{t[e]=n??"";break e}catch{}typeof n=="function"||(n==null||n===!1&&e[4]!="-"?t.removeAttribute(e):t.setAttribute(e,e=="popover"&&n==1?"":n))}}function Oe(t){return function(e){if(this.l){var n=this.l[e.type+t];if(e[K]==null)e[K]=pe++;else if(e[K]<n[q])return;return n(x.event?x.event(e):e)}}}function ye(t,e,n,r,o,i,u,c,_,s){var d,f,l,p,b,w,g,v,m,k,y,h,S,T,M,F,E=e.type;if(e.constructor!==void 0)return null;128&n.__u&&(_=!!(32&n.__u),i=[c=e.__e=n.__e]),(d=x.__b)&&d(e);e:if(typeof E=="function"){f=u.length;try{if(m=e.props,k=E.prototype&&E.prototype.render,y=(d=E.contextType)&&r[d.__c],h=d?y?y.props.value:d.__:r,n.__c?v=(l=e.__c=n.__c).__=l.__E:(k?e.__c=l=new E(m,h):(e.__c=l=new te(m,h),l.constructor=E,l.render=It),y&&y.sub(l),l.state||(l.state={}),l.__n=r,p=l.__d=!0,l.__h=[],l._sb=[]),k&&l.__s==null&&(l.__s=l.state),k&&E.getDerivedStateFromProps!=null&&(l.__s==l.state&&(l.__s=j({},l.__s)),j(l.__s,E.getDerivedStateFromProps(m,l.__s))),b=l.props,w=l.state,l.__v=e,p)k&&E.getDerivedStateFromProps==null&&l.componentWillMount!=null&&l.componentWillMount(),k&&l.componentDidMount!=null&&l.__h.push(l.componentDidMount);else{if(k&&E.getDerivedStateFromProps==null&&m!==b&&l.componentWillReceiveProps!=null&&l.componentWillReceiveProps(m,h),e.__v==n.__v||!l.__e&&l.shouldComponentUpdate!=null&&l.shouldComponentUpdate(m,l.__s,h)===!1){e.__v!=n.__v&&(l.props=m,l.state=l.__s,l.__d=!1),e.__e=n.__e,e.__k=n.__k,e.__k.some(function(U){U&&(U.__=e)}),Q.push.apply(l.__h,l._sb),l._sb=[],l.__h.length&&u.push(l);break e}l.componentWillUpdate!=null&&l.componentWillUpdate(m,l.__s,h),k&&l.componentDidUpdate!=null&&l.__h.push(function(){l.componentDidUpdate(b,w,g)})}if(l.context=h,l.props=m,l.__P=t,l.__e=!1,S=x.__r,T=0,k)l.state=l.__s,l.__d=!1,S&&S(e),d=l.render(l.props,l.state,l.context),Q.push.apply(l.__h,l._sb),l._sb=[];else do l.__d=!1,S&&S(e),d=l.render(l.props,l.state,l.context),l.state=l.__s;while(l.__d&&++T<25);l.state=l.__s,l.getChildContext!=null&&(r=j(j({},r),l.getChildContext())),k&&!p&&l.getSnapshotBeforeUpdate!=null&&(g=l.getSnapshotBeforeUpdate(b,w)),M=d!=null&&d.type===z&&d.key==null?Ne(d.props.children):d,c=je(t,Z(M)?M:[M],e,n,r,o,i,u,c,_,s),l.base=e.__e,e.__u&=-161,l.__h.length&&u.push(l),v&&(l.__E=l.__=null)}catch(U){if(u.length=f,e.__v=null,_||i!=null){if(U.then){for(e.__u|=_?160:128;c&&c.nodeType==8&&c.nextSibling;)c=c.nextSibling;i!=null&&(i[i.indexOf(c)]=null),e.__e=c}else if(i!=null)for(F=i.length;F--;)me(i[F])}else e.__e=n.__e;e.__k==null&&(e.__k=n.__k||[]),U.then||ze(e),x.__e(U,e,n)}}else i==null&&e.__v==n.__v?(e.__k=n.__k,e.__e=n.__e):c=e.__e=Tt(n.__e,e,n,r,o,i,u,_,s);return(d=x.diffed)&&d(e),128&e.__u?void 0:c}function ze(t){t&&(t.__c&&(t.__c.__e=!0),t.__k&&t.__k.some(ze))}function De(t,e,n){for(var r=0;r<n.length;r++)ge(n[r],n[++r],n[++r]);x.__c&&x.__c(e,t),t.some(function(o){try{t=o.__h,o.__h=[],t.some(function(i){i.call(o)})}catch(i){x.__e(i,o.__v)}})}function Ne(t){return typeof t!="object"||t==null||t.__b>0?t:Z(t)?t.map(Ne):t.constructor!==void 0?null:j({},t)}function Tt(t,e,n,r,o,i,u,c,_){var s,d,f,l,p,b,w,g=n.props||X,v=e.props,m=e.type;if(m=="svg"?o="http://www.w3.org/2000/svg":m=="math"?o="http://www.w3.org/1998/Math/MathML":o||(o="http://www.w3.org/1999/xhtml"),i!=null){for(s=0;s<i.length;s++)if((p=i[s])&&"setAttribute"in p==!!m&&(m?p.localName==m:p.nodeType==3)){t=p,i[s]=null;break}}if(t==null){if(m==null)return document.createTextNode(v);t=document.createElementNS(o,m,v.is&&v),c&&(x.__m&&x.__m(e,i),c=!1),i=null}if(m==null)g===v||c&&t.data==v||(t.data=v);else{if(i=m=="textarea"&&v.defaultValue!=null?null:i&&G.call(t.childNodes),!c&&i!=null)for(g={},s=0;s<t.attributes.length;s++)g[(p=t.attributes[s]).name]=p.value;for(s in g)p=g[s],s=="dangerouslySetInnerHTML"?f=p:s=="children"||s in v||s=="value"&&"defaultValue"in v||s=="checked"&&"defaultChecked"in v||re(t,s,null,p,o);for(s in v)p=v[s],s=="children"?l=p:s=="dangerouslySetInnerHTML"?d=p:s=="value"?b=p:s=="checked"?w=p:c&&typeof p!="function"||g[s]===p||re(t,s,p,g[s],o);if(d)c||f&&(d.__html==f.__html||d.__html==t.innerHTML)||(t.innerHTML=d.__html),e.__k=[];else if(f&&(t.innerHTML=""),je(e.type=="template"?t.content:t,Z(l)?l:[l],e,n,r,m=="foreignObject"?"http://www.w3.org/1999/xhtml":o,i,u,i?i[0]:n.__k&&D(n,0),c,_),i!=null)for(s=i.length;s--;)me(i[s]);c&&m!="textarea"||(s="value",m=="progress"&&b==null?t.removeAttribute("value"):b!=null&&(b!==t[s]||m=="progress"&&!b||m=="option"&&b!=g[s])&&re(t,s,b,g[s],o),s="checked",w!=null&&w!=t[s]&&re(t,s,w,g[s],o))}return t}function ge(t,e,n){try{if(typeof t=="function"){var r=typeof t.__u=="function";r&&t.__u(),r&&e==null||(t.__u=t(e))}else t.current=e}catch(o){x.__e(o,n)}}function Ae(t,e,n){var r,o;if(x.unmount&&x.unmount(t),(r=t.ref)&&(r.current&&r.current!=t.__e||ge(r,null,e)),(r=t.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(i){x.__e(i,e)}r.base=r.__P=r.__n=null}if(r=t.__k)for(o=0;o<r.length;o++)r[o]&&Ae(r[o],e,n||typeof t.type!="function");n||me(t.__e),t.__c=t.__=t.__e=void 0}function It(t,e,n){return this.constructor(t,n)}function Re(t,e,n){var r,o,i,u;e==document&&(e=document.documentElement),x.__&&x.__(t,e),o=(r=!1)?null:e.__k,i=[],u=[],ye(e,t=e.__k=St(z,null,[t]),o||X,X,e.namespaceURI,o?null:e.firstChild?G.call(e.childNodes):null,i,o?o.__e:e.firstChild,r,u),De(i,t,u),t.props.children=null}G=Q.slice,x={__e:function(t,e,n,r){for(var o,i,u;e=e.__;)if((o=e.__c)&&!o.__)try{if((i=o.constructor)&&i.getDerivedStateFromError!=null&&(o.setState(i.getDerivedStateFromError(t)),u=o.__d),o.componentDidCatch!=null&&(o.componentDidCatch(t,r||{}),u=o.__d),u)return o.__E=o}catch(c){t=c}throw t}},Pe=0,te.prototype.setState=function(t,e){var n;n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=j({},this.state),typeof t=="function"&&(t=t(j({},n),this.props)),t&&j(n,t),t!=null&&this.__v&&(e&&this._sb.push(e),Fe(this))},te.prototype.forceUpdate=function(t){this.__v&&(this.__e=!0,t&&this.__h.push(t),Fe(this))},te.prototype.render=z,O=[],Te=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,Ie=function(t,e){return t.__v.__b-e.__v.__b},ne.__r=0,_e=Math.random().toString(8),K="__d"+_e,q="__a"+_e,$e=/(PointerCapture)$|Capture$/i,pe=0,fe=Oe(!1),he=Oe(!0);var $t=0;function a(t,e,n,r,o,i){e||(e={});var u,c,_=e;if("ref"in _)for(c in _={},e)c=="ref"?u=e[c]:_[c]=e[c];var s={type:t,props:_,key:n,ref:u,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--$t,__i:-1,__u:0,__source:o,__self:i};if(typeof t=="function"&&(u=t.defaultProps))for(c in u)_[c]===void 0&&(_[c]=u[c]);return x.vnode&&x.vnode(s),s}const Lt=`
:host {
  all: initial;
  display: block;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: #061928;
  -webkit-font-smoothing: antialiased;
}

*, *::before, *::after { box-sizing: border-box; }

.root {
  background: #FDFEFB;
  border-radius: 12px;
  padding: 16px;
  max-width: 480px;
  margin: 0 auto;
}

.stack > * + * { margin-top: 16px; }
.stack-sm > * + * { margin-top: 8px; }

h2, h3, p, ul, hr { margin: 0; }
ul { padding: 0; list-style: none; }
hr { border: none; border-top: 1px solid #CCCCCB; }
a { color: #1DC6C4; font-weight: 600; text-decoration: none; }
a:hover { text-decoration: underline; }

.title { font-size: 28px; font-weight: 700; line-height: 1.2; }
.subtitle { font-size: 14px; color: #676867; margin-top: 4px; }
.section-title { font-size: 16px; font-weight: 600; }
.muted { font-size: 14px; color: #676867; }
.small { font-size: 12px; color: #676867; }
.error-text { font-size: 14px; color: #D41C22; }

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
.status-icon.success { background: rgba(0, 128, 68, 0.1); color: #008044; }
.status-icon.error { background: rgba(212, 28, 34, 0.1); color: #D41C22; }
.status-icon.expired { background: rgba(241, 133, 121, 0.2); color: #D41C22; }
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
.spinner.lg { width: 32px; height: 32px; color: #1DC6C4; }
@keyframes pk-spin { to { transform: rotate(360deg); } }

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn.primary { background: #1DC6C4; color: #fff; width: 100%; }
.btn.primary:hover:not(:disabled) { background: #19b2b0; }
.btn.secondary { background: #fff; color: #061928; border: 1px solid #CCCCCB; }
.btn.secondary:hover:not(:disabled) { background: #F8F8F8; }
.btn.text {
  background: none;
  color: #1DC6C4;
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
.section-header .label { font-size: 16px; font-weight: 600; color: #1DC6C4; }
.section-header .chevron { width: 16px; height: 16px; color: #676867; transition: transform 0.15s ease; }
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
  border-radius: 6px;
  background: rgba(0, 128, 68, 0.1);
  padding: 2px 6px;
  font-size: 9px;
  font-weight: 500;
  line-height: 1;
  color: #008044;
}
.plan-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-radius: 12px;
  border: 1px solid #CCCCCB;
  background: #fff;
  padding: 16px 8px;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.plan-card.selected {
  border-color: rgba(29, 198, 196, 0.4);
  background: rgba(29, 198, 196, 0.05);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
.plan-price { font-size: 24px; font-weight: 700; line-height: 1.2; }
.plan-term { font-size: 12px; font-style: italic; color: #676867; }
.plan-select-btn {
  min-width: 64px;
  border-radius: 6px;
  border: 1px solid #949494;
  background: #fff;
  color: #061928;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}
.plan-select-btn:hover:not(:disabled) { background: #F8F8F8; }
.plan-select-btn:disabled { opacity: 0.5; }
.plan-select-btn.selected { background: #061928; border-color: #061928; color: #fff; }
.plan-select-btn.selected:hover:not(:disabled) { background: rgba(6, 25, 40, 0.9); }

.row { display: flex; align-items: center; justify-content: space-between; font-size: 14px; }
.row .label { color: #676867; }
.row .value { color: #061928; }
.row.bold .label, .row.bold .value { font-weight: 600; color: #061928; }

.summary-card {
  border-radius: 12px;
  border: 1px solid #CCCCCB;
  background: #fff;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.summary-card .card-title { font-size: 14px; font-weight: 600; color: #1DC6C4; }
.summary-card .card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }

.sign-box {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  border: 2px dashed #C8B898;
  background: rgba(200, 184, 152, 0.05);
  padding: 16px;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  color: #061928;
  cursor: pointer;
}
.sign-box:hover:not(:disabled) { background: rgba(200, 184, 152, 0.1); }
.sign-box:disabled { opacity: 0.5; }
.sign-box svg { width: 16px; height: 16px; }

.signed-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 8px;
  border: 2px dashed rgba(0, 128, 68, 0.5);
  background: rgba(0, 128, 68, 0.05);
  padding: 12px 16px;
}
.signed-box .name { font-size: 14px; font-weight: 500; }
.signed-box .clear {
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  color: #1DC6C4;
  cursor: pointer;
  text-underline-offset: 2px;
}
.signed-box .clear:hover:not(:disabled) { text-decoration: underline; }

.name-prompt {
  border-radius: 8px;
  border: 2px dashed #C8B898;
  background: rgba(200, 184, 152, 0.05);
  padding: 12px 16px;
}
.name-prompt label { display: block; font-size: 12px; color: #676867; margin-bottom: 8px; }
.name-prompt .controls { display: flex; gap: 8px; }
.name-prompt input {
  flex: 1;
  border-radius: 6px;
  border: 1px solid #CCCCCB;
  padding: 8px 12px;
  font-size: 14px;
  font-family: inherit;
}
.name-prompt input:focus { border-color: #1DC6C4; outline: none; }
.name-prompt .confirm {
  border: none;
  border-radius: 6px;
  background: #061928;
  color: #fff;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}
.name-prompt .confirm:disabled { opacity: 0.5; }

.expiry-note { font-size: 12px; color: #F18579; text-align: center; }
.cancel-row { margin-top: 16px; text-align: center; }
.cancel-row button {
  background: none;
  border: none;
  font-size: 14px;
  font-family: inherit;
  color: #949494;
  cursor: pointer;
  text-underline-offset: 2px;
}
.cancel-row button:hover { text-decoration: underline; }
`;var W,C,be,Be,V=0,He=[],P=x,qe=P.__b,We=P.__r,Ve=P.diffed,Je=P.__c,Ye=P.unmount,Ge=P.__;function ve(t,e){P.__h&&P.__h(C,t,V||e),V=0;var n=C.__H||(C.__H={__:[],__h:[]});return t>=n.__.length&&n.__.push({}),n.__[t]}function I(t){return V=1,Ft(Ze,t)}function Ft(t,e,n){var r=ve(W++,2);if(r.t=t,!r.__c&&(r.__=[Ze(void 0,e),function(c){var _=r.__N?r.__N[0]:r.__[0],s=r.t(_,c);_!==s&&(r.__N=[s,r.__[1]],r.__c.setState({}))}],r.__c=C,!C.__f)){var o=function(c,_,s){if(!r.__c.__H)return!0;var d=!1,f=r.__c.props!==c;if(r.__c.__H.__.some(function(p){if(p.__N){d=!0;var b=p.__[0];p.__=p.__N,p.__N=void 0,b!==p.__[0]&&(f=!0)}}),i){var l=i.call(this,c,_,s);return d?l||f:l}return!d||f};C.__f=!0;var i=C.shouldComponentUpdate,u=C.componentWillUpdate;C.componentWillUpdate=function(c,_,s){if(this.__e){var d=i;i=void 0,o(c,_,s),i=d}u&&u.call(this,c,_,s)},C.shouldComponentUpdate=o}return r.__N||r.__}function N(t,e){var n=ve(W++,3);!P.__s&&Qe(n.__H,e)&&(n.__=t,n.u=e,C.__H.__h.push(n))}function oe(t){return V=5,Ke(function(){return{current:t}},[])}function Ke(t,e){var n=ve(W++,7);return Qe(n.__H,e)&&(n.__=t(),n.__H=e,n.__h=t),n.__}function ie(t,e){return V=8,Ke(function(){return t},e)}function jt(){for(var t;t=He.shift();){var e=t.__H;if(t.__P&&e)try{e.__h.some(le),e.__h.some(xe),e.__h=[]}catch(n){e.__h=[],P.__e(n,t.__v)}}}P.__b=function(t){C=null,qe&&qe(t)},P.__=function(t,e){t&&e.__k&&e.__k.__m&&(t.__m=e.__k.__m),Ge&&Ge(t,e)},P.__r=function(t){We&&We(t),W=0;var e=(C=t.__c).__H;e&&(be===C?(e.__h=[],C.__h=[],e.__.some(function(n){n.__N&&(n.__=n.__N),n.u=n.__N=void 0})):(e.__h.some(le),e.__h.some(xe),e.__h=[],W=0)),be=C},P.diffed=function(t){Ve&&Ve(t);var e=t.__c;e&&e.__H&&(e.__H.__h.length&&(He.push(e)!==1&&Be===P.requestAnimationFrame||((Be=P.requestAnimationFrame)||Mt)(jt)),e.__H.__.some(function(n){n.u&&(n.__H=n.u,n.u=void 0)})),be=C=null},P.__c=function(t,e){e.some(function(n){try{n.__h.some(le),n.__h=n.__h.filter(function(r){return!r.__||xe(r)})}catch(r){e.some(function(o){o.__h&&(o.__h=[])}),e=[],P.__e(r,n.__v)}}),Je&&Je(t,e)},P.unmount=function(t){Ye&&Ye(t);var e,n=t.__c;n&&n.__H&&(n.__H.__.some(function(r){try{le(r)}catch(o){e=o}}),n.__H=void 0,e&&P.__e(e,n.__v))};var Xe=typeof requestAnimationFrame=="function";function Mt(t){var e,n=function(){clearTimeout(r),Xe&&cancelAnimationFrame(e),setTimeout(t)},r=setTimeout(n,35);Xe&&(e=requestAnimationFrame(n))}function le(t){var e=C,n=t.__c;typeof n=="function"&&(t.__c=void 0,n()),C=e}function xe(t){var e=C;t.__c=t.__(),C=e}function Qe(t,e){return!t||t.length!==e.length||e.some(function(n,r){return n!==t[r]})}function Ze(t,e){return typeof e=="function"?e(t):e}async function ae(t,e){const n=await fetch(`${ct()}${t}`,{...e,headers:{"Content-Type":"application/json",...e==null?void 0:e.headers}});if(!n.ok){const r=await n.json().catch(()=>({error:n.statusText}));throw new H(typeof r.error=="string"?r.error:"request_failed",typeof r.message=="string"?r.message:typeof r.error=="string"?r.error:`Request failed: ${n.status}`,n.status)}return n.json()}function Ut(t){return ae(`/checkout/sessions/${t}/details`)}function Ot(t,e){return ae(`/checkout/sessions/${t}/select-plan`,{method:"POST",body:JSON.stringify({term_length:e})})}function et(t){return ae(`/checkout/sessions/${t}/prepare-payment`,{method:"POST"})}function zt(t,e){const n={signature:e.signature,payment_method_id:e.paymentMethodId};return e.paymentIntentId&&(n.payment_intent_id=e.paymentIntentId),e.setupIntentId&&(n.setup_intent_id=e.setupIntentId),ae(`/checkout/sessions/${t}/confirm`,{method:"POST",body:JSON.stringify(n)})}function Dt(t){const[e,n]=I({state:"loading",session:null,payment:null,contractId:null,error:null});N(()=>{let c=!1;async function _(){try{const s=await Ut(t);if(c)return;if(s.status==="completed"){n({state:"success",session:s,payment:null,contractId:s.contract_id,error:null});return}if(s.status==="expired"||s.status==="canceled"){n({state:"expired",session:s,payment:null,contractId:null,error:null});return}if(s.status==="payment_ready"&&s.selected_plan){n({state:"loading",session:s,payment:null,contractId:null,error:null});try{const d=await et(t);c||n({state:"review",session:s,payment:d,contractId:null,error:null})}catch{c||n({state:"selectPlan",session:s,payment:null,contractId:null,error:null})}return}n({state:"selectPlan",session:s,payment:null,contractId:null,error:null})}catch(s){if(c)return;const d=s instanceof H?s:null;(d==null?void 0:d.status)===410?n({state:"expired",session:null,payment:null,contractId:null,error:null}):n({state:"error",session:null,payment:null,contractId:null,error:s.message??"Failed to load checkout session"})}}return _(),()=>{c=!0}},[t]);const r=ie(async c=>{try{const _=await Ot(t,c);n(d=>({...d,session:d.session?{...d.session,selected_plan:_.selected_plan,status:"plan_selected",expires_at:_.expires_at}:d.session,error:null}));const s=await et(t);n(d=>({...d,state:"review",payment:s,session:d.session?{...d.session,status:"payment_ready"}:d.session}))}catch(_){n(s=>({...s,error:_.message??"Failed to select plan"}))}},[t]),o=ie(async c=>{n(_=>({..._,state:"processing",error:null}));try{const _=await zt(t,c);n(s=>({...s,state:"success",contractId:_.contract_id,session:s.session?{...s.session,status:"completed"}:s.session}))}catch(_){n(s=>({...s,state:"review",error:_.message??"Payment failed"}))}},[t]),i=ie(()=>{n(c=>({...c,state:"expired"}))},[]),u=ie(()=>{n(c=>({...c,state:"selectPlan",payment:null,error:null}))},[]);return{...e,selectPlan:r,confirm:o,setExpired:i,backToPlanSelection:u}}function Nt(t){const[e,n]=I(null);return N(()=>{if(!t)return;const r=new Date(t).getTime();function o(){const u=Math.max(0,Math.floor((r-Date.now())/1e3));n(u)}o();const i=setInterval(o,1e3);return()=>clearInterval(i)},[t]),e}function $(t){return`$${(t/100).toFixed(2)}`}function tt(t){return t===1?"1 month":`${t} months`}function we({large:t=!1}){return a("span",{class:`spinner${t?" lg":""}`,role:"status","aria-label":"Loading"})}function At({children:t,onClick:e,type:n="button",variant:r="primary",loading:o=!1,disabled:i=!1}){return a("button",{type:n,class:`btn ${r}`,disabled:i||o,onClick:e,children:[o&&a(we,{}),t]})}function Rt(){return a("div",{class:"center-col",children:[a(we,{large:!0}),a("p",{class:"muted",children:"Loading checkout..."})]})}function Bt(){return a("div",{class:"center-col",children:[a("div",{class:"status-icon success",children:a("svg",{fill:"none",viewBox:"0 0 24 24",stroke:"currentColor","stroke-width":"2",children:a("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M5 13l4 4L19 7"})})}),a("h2",{class:"status-title",children:"Payment Successful"})]})}function Ht({message:t}){return a("div",{class:"center-col",children:[a("div",{class:"status-icon error",children:a("svg",{fill:"none",viewBox:"0 0 24 24",stroke:"currentColor","stroke-width":"2",children:a("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})})}),a("h2",{class:"status-title",children:"Something went wrong"}),a("p",{class:"muted",children:t})]})}function qt(){return a("div",{class:"center-col",children:[a("div",{class:"status-icon expired",children:a("svg",{fill:"none",viewBox:"0 0 24 24",stroke:"currentColor","stroke-width":"2",children:a("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"})})}),a("h2",{class:"status-title",children:"Session Expired"}),a("p",{class:"muted",children:"This checkout session has expired. Please contact your provider for a new link."})]})}function Wt({session:t}){var e;return a("div",{children:[a("h2",{class:"title",children:t.organization_name??"Your Order"}),((e=t.customer)==null?void 0:e.name)&&a("p",{class:"subtitle",children:t.customer.name})]})}function A({label:t,value:e,bold:n=!1}){return a("div",{class:`row${n?" bold":""}`,children:[a("span",{class:"label",children:t}),a("span",{class:"value",children:e})]})}function ke(t){return t.term_length===1||t.down_payment===t.total_amount}function Vt({plan:t}){const e=ke(t);return a("div",{class:"summary-card",children:[a("div",{class:"card-head",children:a("h3",{class:"card-title",children:e?"Pay In Full":"Your Payment Plan"})}),a("div",{class:"stack-sm",children:[!e&&a(z,{children:[a(A,{label:"Monthly Payment",value:`${$(t.monthly_payment)} / mo`}),a(A,{label:"Term",value:tt(t.term_length)}),t.down_payment>0&&a(A,{label:"Down Payment",value:$(t.down_payment)}),a(A,{label:"Total",value:$(t.total_amount)})]}),e&&a(A,{label:"Total",value:$(t.total_amount)}),a("hr",{}),a(A,{label:"Due Today",value:$(t.down_payment),bold:!0})]})]})}function Jt({customerName:t,serviceAgreementUrl:e,signature:n,onChange:r,disabled:o=!1}){const[i,u]=I(!1),[c,_]=I(t??"");function s(){if(!o){if(t&&t.trim().length>0){r(t.trim());return}u(!0)}}function d(){const l=c.trim();l.length!==0&&(r(l),u(!1))}function f(){r(null),u(!1)}return a("section",{class:"stack-sm",children:[a("h3",{class:"section-title",children:"Signature"}),a("p",{class:"muted",children:["By signing below, you agree to the terms above",e?a(z,{children:[" ","and the"," ",a("a",{href:e,target:"_blank",rel:"noreferrer",children:"Client Service Agreement"})]}):null,"."]}),n?a("div",{class:"signed-box",children:[a("span",{class:"name",children:["✓ Signed by ",n]}),a("button",{type:"button",class:"clear",onClick:f,disabled:o,children:"Clear"})]}):i?a("div",{class:"name-prompt",children:[a("label",{for:"pk-signature-name",children:"Type your full name to sign"}),a("div",{class:"controls",children:[a("input",{id:"pk-signature-name",type:"text",value:c,onInput:l=>_(l.target.value),disabled:o,placeholder:"Full name"}),a("button",{type:"button",class:"confirm",onClick:d,disabled:o||c.trim().length===0,children:"Sign"})]})]}):a("button",{type:"button",class:"sign-box",onClick:s,disabled:o,children:[a("svg",{viewBox:"0 0 20 20",fill:"currentColor","aria-hidden":!0,children:a("path",{"fill-rule":"evenodd",d:"M10 3a1 1 0 011 1v9.586l3.293-3.293a1 1 0 011.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 011.414-1.414L9 13.586V4a1 1 0 011-1z","clip-rule":"evenodd"})}),"Click Here to Sign Document"]})]})}function Yt({open:t}){return a("svg",{class:`chevron${t?" open":""}`,viewBox:"0 0 20 20",fill:"currentColor","aria-hidden":!0,children:a("path",{"fill-rule":"evenodd",d:"M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z","clip-rule":"evenodd"})})}function Se({label:t,open:e,onToggle:n}){return a("button",{type:"button",class:"section-header",onClick:n,"aria-expanded":e,children:[a("span",{class:"label",children:t}),a(Yt,{open:e})]})}function Gt({plan:t,selected:e,mostPopular:n,onSelect:r,disabled:o}){return a("div",{class:"plan-card-wrap",children:[n&&a("div",{class:"plan-badge",children:"Most Popular"}),a("div",{class:`plan-card${e?" selected":""}`,children:[a("div",{class:"plan-price",children:$(t.monthly_payment).replace(".00","")}),a("div",{class:"small",children:"per month"}),a("button",{type:"button",class:`plan-select-btn${e?" selected":""}`,onClick:r,disabled:o,children:"Select"}),a("div",{class:"plan-term",children:tt(t.term_length)})]})]})}function Kt({session:t,plans:e,selectedIndex:n,onSelect:r,loading:o}){var m,k;const[i,u]=I(!0),[c,_]=I(!0),[s,d]=I(!0),f=e.map((y,h)=>({plan:y,index:h})).filter(({plan:y})=>!ke(y)),l=e.map((y,h)=>({plan:y,index:h})).find(({plan:y})=>ke(y))??null,p=((m=f[Math.floor(f.length/2)])==null?void 0:m.index)??null,b=n??p,w=b!=null?e[b]??null:((k=f[0])==null?void 0:k.plan)??null,g=(w==null?void 0:w.down_payment)??0,v=t.services??[];return a("div",{class:"stack-sm",children:[f.length>0&&a(z,{children:[a("hr",{}),a("section",{children:[a(Se,{label:"Pay Over Time",open:i,onToggle:()=>u(y=>!y)}),i&&a("div",{class:"plan-grid",children:f.map(({plan:y,index:h})=>a(Gt,{plan:y,selected:h===b,mostPopular:h===p,onSelect:()=>r(h),disabled:o},h))}),a("div",{class:"row bold",style:"margin-top: 12px",children:[a("span",{class:"label",children:"Down Payment (due today)"}),a("span",{class:"value",children:$(g)})]})]})]}),a("hr",{}),a("section",{children:[a(Se,{label:"Pay In Full",open:c,onToggle:()=>_(y=>!y)}),c&&a("div",{class:"stack-sm",children:[a("div",{class:"row bold",children:[a("span",{class:"label",children:"Total:"}),a("span",{class:"value",children:t.amount!=null?$(t.amount):l?$(l.plan.total_amount):"--"})]}),l&&a("div",{style:"display: flex; justify-content: flex-end",children:a("button",{type:"button",class:"plan-select-btn",style:"min-width: 80px",onClick:()=>r(l.index),disabled:o,children:"Select"})})]})]}),v.length>0&&a(z,{children:[a("hr",{}),a("section",{children:[a(Se,{label:"Items",open:s,onToggle:()=>d(y=>!y)}),s&&a("ul",{class:"stack-sm",children:v.map((y,h)=>{const S=y.quantity??1,T=y.name??"Item";return a("li",{class:"row",children:[a("span",{class:"label",children:[T,S>1?` (x${S})`:""]}),y.amount!=null&&a("span",{class:"label",children:$(y.amount)})]},h)})})]})]})]})}const Xt={theme:"stripe",variables:{colorPrimary:"#1DC6C4",colorBackground:"#FDFEFB",colorText:"#061928",fontFamily:"system-ui, sans-serif",borderRadius:"8px"}};function Qt({session:t,selectedPlan:e,payment:n,paymentSlotEl:r,onConfirm:o,processing:i,error:u}){var y;const[c,_]=I(null),[s,d]=I(null),[f,l]=I(!1),[p,b]=I(!1),w=oe(null),g=oe(null);N(()=>{let h=!1,S=null;async function T(){try{const{loadStripe:M}=await Promise.resolve().then(()=>hn),F=await M(n.publishable_key);if(h)return;if(!F){d("Failed to load payment form. Please refresh and try again.");return}const E=F.elements({clientSecret:n.client_secret,appearance:Xt,paymentMethodCreation:"manual"});S=E.create("payment"),S.mount(r),S.on("ready",()=>{h||l(!0)}),w.current=F,g.current=E}catch{h||d("Failed to load payment form. Please refresh and try again.")}}return T(),()=>{h=!0,S==null||S.destroy(),w.current=null,g.current=null}},[n.client_secret,n.publishable_key,r]);const v=n.mode==="payment"?`Sign and Pay ${$(e.down_payment)}`:"Sign and Save Card";async function m(h){h.preventDefault();const S=w.current,T=g.current;if(!(!S||!T||p)){if(!c){d("Please sign before continuing.");return}d(null),b(!0);try{const{error:M}=await T.submit();if(M){d(M.message??"Please check your card details");return}if(n.mode==="payment"){const{error:U,paymentMethod:mn}=await S.createPaymentMethod({elements:T});if(U){d(U.message??"Failed to process card");return}o({signature:c,paymentIntentId:n.payment_intent_id,paymentMethodId:mn.id});return}const{error:F,setupIntent:E}=await S.confirmSetup({elements:T,clientSecret:n.client_secret,redirect:"if_required"});if(F){d(F.message??"Failed to save card");return}if(!E||typeof E.payment_method!="string"){d("Could not retrieve saved payment method.");return}o({signature:c,setupIntentId:E.id,paymentMethodId:E.payment_method})}finally{b(!1)}}}const k=u??s;return a("form",{class:"stack",onSubmit:m,children:[a(Vt,{plan:e}),a(Jt,{customerName:((y=t.customer)==null?void 0:y.name)??null,serviceAgreementUrl:t.service_agreement_url,signature:c,onChange:_,disabled:i}),a("section",{class:"stack-sm",children:[a("h3",{class:"section-title",children:n.mode==="payment"?"Payment details":"Card on file"}),n.mode==="setup"&&a("p",{class:"small",children:"We'll save your card so we can charge your monthly payments automatically. No charge today."}),!f&&!k&&a("div",{style:"display: flex; justify-content: center; padding: 16px 0",children:a(we,{})}),a("slot",{name:"payment"})]}),k&&a("p",{class:"error-text",role:"alert",children:k}),a(At,{type:"submit",loading:i||p,disabled:!f||!c,children:v})]})}function Zt(t,e,n){if(t!=null)return t;if(n==null)return null;const r=e.findIndex(o=>o.term_length===n);return r>=0?r:null}function en({sessionId:t,paymentSlotEl:e,options:n}){var y;const{state:r,session:o,payment:i,contractId:u,error:c,selectPlan:_,confirm:s,setExpired:d,backToPlanSelection:f}=Dt(t),[l,p]=I(null),[b,w]=I(!1),g=Nt((o==null?void 0:o.expires_at)??null),v=oe(!1);N(()=>{var h;if(r==="success"&&!v.current){v.current=!0;const S={session_id:t,contract_id:u,status:"completed"};(h=n.onComplete)==null||h.call(n,S)}},[r,u,t,n]);const m=oe(null);N(()=>{var h;r==="error"&&c&&m.current!==c&&(m.current=c,(h=n.onError)==null||h.call(n,new H("checkout_error",c)))},[r,c,n]),N(()=>{g===0&&r!=="expired"&&r!=="success"&&d()},[g,r,d]);async function k(h){var T;const S=(T=o==null?void 0:o.plans)==null?void 0:T[h];S&&(p(h),w(!0),await _(S.term_length),w(!1))}return a("div",{class:"root",children:[g!=null&&g>0&&g<=300&&r!=="success"&&a("p",{class:"expiry-note",children:["Session expires in ",Math.floor(g/60),":",String(g%60).padStart(2,"0")]}),r==="loading"&&a(Rt,{}),r==="error"&&a(Ht,{message:c??"Checkout session not found"}),r==="expired"&&a(qt,{}),r==="success"&&a(Bt,{}),(r==="selectPlan"||r==="review"||r==="processing")&&o&&a("div",{class:"stack",children:[a(Wt,{session:o}),r==="selectPlan"&&o.plans&&a(Kt,{session:o,plans:o.plans,selectedIndex:Zt(l,o.plans,((y=o.selected_plan)==null?void 0:y.term_length)??null),onSelect:k,loading:b}),(r==="review"||r==="processing")&&i&&o.selected_plan&&a(Qt,{session:o,selectedPlan:o.selected_plan,payment:i,paymentSlotEl:e,onConfirm:s,processing:r==="processing",error:c}),c&&r==="selectPlan"&&a("p",{class:"error-text",role:"alert",children:c})]}),(r==="review"||r==="processing")&&a("div",{class:"cancel-row",children:a("button",{type:"button",onClick:f,children:"Back to plan selection"})})]})}function tn(t,e,n){const r=typeof t=="string"?document.querySelector(t):t;if(!r)throw new H("container_not_found",`Puurk.checkout.mount(): no element matches ${JSON.stringify(t)}`);const o=document.createElement("div");o.setAttribute("data-puurk-checkout","true"),r.appendChild(o);const i=o.attachShadow({mode:"open"}),u=document.createElement("style");u.textContent=Lt,i.appendChild(u);const c=document.createElement("div");i.appendChild(c);const _=document.createElement("div");_.setAttribute("slot","payment"),o.appendChild(_),Re(a(en,{sessionId:e,paymentSlotEl:_,options:n}),c);let s=!1;return{destroy(){s||(s=!0,Re(null,c),o.remove())}}}const nn=Object.freeze(Object.defineProperty({__proto__:null,renderCheckout:tn},Symbol.toStringTag,{value:"Module"}));function J(t){"@babel/helpers - typeof";return typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?J=function(e){return typeof e}:J=function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},J(t)}var nt="dahlia",rn=function(e){return e===3?"v3":e},rt="https://js.stripe.com",on="".concat(rt,"/").concat(nt,"/stripe.js"),ln=/^https:\/\/js\.stripe\.com\/v3\/?(\?.*)?$/,an=/^https:\/\/js\.stripe\.com\/(v3|[a-z]+)\/stripe\.js(\?.*)?$/,ot="loadStripe.setLoadParameters was called but an existing Stripe.js script already exists in the document; existing script parameters will be used",sn=function(e){return ln.test(e)||an.test(e)},cn=function(){for(var e=document.querySelectorAll('script[src^="'.concat(rt,'"]')),n=0;n<e.length;n++){var r=e[n];if(sn(r.src))return r}return null},it=function(e){var n=e&&!e.advancedFraudSignals?"?advancedFraudSignals=false":"",r=document.createElement("script");r.src="".concat(on).concat(n);var o=document.head||document.body;if(!o)throw new Error("Expected document.body not to be null. Stripe.js requires a <body> element.");return o.appendChild(r),r},un=function(e,n){!e||!e._registerWrapper||e._registerWrapper({name:"stripe-js",version:"9.12.1",startTime:n})},Y=null,se=null,ce=null,dn=function(e){return function(n){e(new Error("Failed to load Stripe.js",{cause:n}))}},_n=function(e,n){return function(){window.Stripe?e(window.Stripe):n(new Error("Stripe.js not available"))}},pn=function(e){return Y!==null?Y:(Y=new Promise(function(n,r){if(typeof window>"u"||typeof document>"u"){n(null);return}if(window.Stripe&&e&&console.warn(ot),window.Stripe){n(window.Stripe);return}try{var o=cn();if(o&&e)console.warn(ot);else if(!o)o=it(e);else if(o&&ce!==null&&se!==null){var i;o.removeEventListener("load",ce),o.removeEventListener("error",se),(i=o.parentNode)===null||i===void 0||i.removeChild(o),o=it(e)}ce=_n(n,r),se=dn(r),o.addEventListener("load",ce),o.addEventListener("error",se)}catch(u){r(u);return}}),Y.catch(function(n){return Y=null,Promise.reject(n)}))},fn=function(e,n,r){if(e===null)return null;var o=n[0];if(typeof o!="string")throw new Error("Expected publishable key to be of type string, got type ".concat(J(o)," instead."));var i=o.match(/^pk_test/),u=rn(e.version),c=nt;i&&u!==c&&console.warn("Stripe.js@".concat(u," was loaded on the page, but @stripe/stripe-js@").concat("9.12.1"," expected Stripe.js@").concat(c,". This may result in unexpected behavior. For more information, see https://docs.stripe.com/sdks/stripejs-versioning"));var _=e.apply(void 0,n);return un(_,r),_},lt=function(e){var n=`invalid load parameters; expected object of shape

    {advancedFraudSignals: boolean}

but received

    `.concat(JSON.stringify(e),`
`);if(e===null||J(e)!=="object")throw new Error(n);if(Object.keys(e).length===1&&typeof e.advancedFraudSignals=="boolean")return e;throw new Error(n)},ue,Ce=!1,at=function(){for(var e=arguments.length,n=new Array(e),r=0;r<e;r++)n[r]=arguments[r];Ce=!0;var o=Date.now();return pn(ue).then(function(i){return fn(i,n,o)})};at.setLoadParameters=function(t){if(Ce&&ue){var e=lt(t),n=Object.keys(e),r=n.reduce(function(o,i){var u;return o&&t[i]===((u=ue)===null||u===void 0?void 0:u[i])},!0);if(r)return}if(Ce)throw new Error("You cannot change load parameters after calling loadStripe");ue=lt(t)};const hn=Object.freeze(Object.defineProperty({__proto__:null,loadStripe:at},Symbol.toStringTag,{value:"Module"}));return wt}));
