/*! @puurk/js v1.2.0 (9c4358c) — vendored by scripts/vendor-sdk.mjs */
(function(J,K){typeof exports=="object"&&typeof module<"u"?module.exports=K():typeof define=="function"&&define.amd?define(K):(J=typeof globalThis<"u"?globalThis:J||self,J.Puurk=K())})(this,(function(){"use strict";const J={staging:"https://checkoutstaging.puurk.com",demo:"https://checkoutdemo.puurk.com",sandbox:"https://checkoutsandbox.puurk.com",production:"https://checkout.puurk.com"},K={staging:"https://apistaging.puurk.com",demo:"https://apidemo.puurk.com",sandbox:"https://apisandbox.puurk.com",production:"https://api.puurk.com"};let $={environment:"production"};function Dt(t){t.environment&&($={...$,environment:t.environment}),"checkoutUrl"in t&&($={...$,checkoutUrl:t.checkoutUrl}),"apiUrl"in t&&($={...$,apiUrl:t.apiUrl}),"clientId"in t&&($={...$,clientId:t.clientId}),"oid"in t&&($={...$,oid:t.oid})}function xe(){return $.checkoutUrl??J[$.environment]}function Bt(){return $.apiUrl??K[$.environment]}function Ht(){return $.clientId}function De(){return $.oid}function Wt(t){window.location.href=`${xe()}/s/${t}`}class L extends Error{constructor(e,r,n){super(r),this.name="PuurkError",this.code=e,this.status=n}}const Vt=`
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
`,Yt=`
  position: relative;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  background: #FDFEFB;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  margin: 16px;
`,Jt=`
  width: 100%;
  border: none;
  display: block;
  min-height: 400px;
  transition: height 0.2s ease;
`,Kt=`
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
`;function Gt(t){const e=document.createElement("div");e.setAttribute("style",Vt),e.setAttribute("data-puurk-overlay","true");const r=document.createElement("div");r.setAttribute("style",Yt);const n=document.createElement("button");n.setAttribute("style",Kt),n.setAttribute("aria-label","Close"),n.innerHTML="&#x2715;";const o=document.createElement("iframe");return o.setAttribute("style",Jt),o.setAttribute("src",t),o.setAttribute("allow","payment"),o.setAttribute("title","Puurk Checkout"),r.appendChild(n),r.appendChild(o),e.appendChild(r),{overlay:e,container:r,iframe:o,closeButton:n}}function Qt(t){t.offsetHeight,t.style.opacity="1"}function Xt(t){t.style.opacity="0",setTimeout(()=>{t.remove()},200)}function Zt(t){const e=xe();try{const r=new URL(e).origin;return t.origin===r}catch{return!1}}function er(t){if(!Zt(t))return null;const e=t.data;return!e||typeof e.type!="string"||!e.type.startsWith("puurk:")?null:e}function Be(t,e={}){const r=`${xe()}/s/${t}?embed=true`,{overlay:n,iframe:o,closeButton:i}=Gt(r);let a=!1;function s(){a||(a=!0,window.removeEventListener("message",d),window.removeEventListener("keydown",c),Xt(n))}function d(p){var u,f,g,w,h,v,m,b,y;const _=er(p);if(_)switch(_.type){case"puurk:ready":Qt(n);break;case"puurk:resize":{const P=(u=_.payload)==null?void 0:u.height;P&&P>0&&(o.style.height=`${P}px`);break}case"puurk:complete":{const P={session_id:((f=_.payload)==null?void 0:f.session_id)??t,contract_id:((g=_.payload)==null?void 0:g.contract_id)??null,status:((w=_.payload)==null?void 0:w.status)??"completed"};s(),(h=e.onComplete)==null||h.call(e,P);break}case"puurk:cancel":s(),(v=e.onCancel)==null||v.call(e);break;case"puurk:error":{const P=new L(((m=_.payload)==null?void 0:m.code)??"checkout_error",((b=_.payload)==null?void 0:b.message)??"An error occurred during checkout");(y=e.onError)==null||y.call(e,P);break}}}function c(p){var _;p.key==="Escape"&&(s(),(_=e.onCancel)==null||_.call(e))}return n.addEventListener("click",p=>{var _;p.target===n&&(s(),(_=e.onCancel)==null||_.call(e))}),i.addEventListener("click",()=>{var p;s(),(p=e.onCancel)==null||p.call(e)}),window.addEventListener("message",d),window.addEventListener("keydown",c),document.body.appendChild(n),n.style.opacity="0",{destroy:s}}async function He(t,e,r={}){const{renderCheckout:n}=await Promise.resolve().then(()=>Xr);return n(t,e,r)}async function D(t,e){const r=await fetch(`${Bt()}${t}`,{...e,headers:{"Content-Type":"application/json",...e==null?void 0:e.headers}});if(!r.ok){const n=await r.json().catch(()=>({error:r.statusText}));throw new L(typeof n.error=="string"?n.error:"request_failed",typeof n.message=="string"?n.message:typeof n.error=="string"?n.error:`Request failed: ${r.status}`,r.status)}return r.json()}function we(t){const e=Ht(),r=De();if(!e||!r)throw new L("not_configured",`${t}: call Puurk.configure({ clientId, oid }) first`);return{clientId:e,oid:r}}async function tr(t={}){const{clientId:e,oid:r}=we("Puurk.catalog.services()"),n=new URLSearchParams({client_id:e,oid:r});return t.ids&&t.ids.length>0&&n.set("ids",t.ids.join(",")),(await D(`/checkout/services?${n}`)).services}function Se(t,e=[]){const{clientId:r,oid:n}=we("Puurk.catalog.quote()"),o=new URLSearchParams({client_id:r});return D(`/checkout/quotes?${o}`,{method:"POST",body:JSON.stringify({oid:n,items:t,candidates:e})})}function rr(t){const{clientId:e,oid:r}=we("Puurk.checkout.start()"),n=new URLSearchParams({client_id:e}),o={oid:r,items:t.items.map(i=>({service_id:i.service_id,quantity:i.quantity})),customer:t.customer};return t.returnUrl&&(o.return_url=t.returnUrl),t.cancelUrl&&(o.cancel_url=t.cancelUrl),t.metadata&&(o.metadata=t.metadata),D(`/checkout/sessions?${n}`,{method:"POST",body:JSON.stringify(o)})}async function nr(t){var s,d;const e=((s=t.cart)==null?void 0:s.items)??t.items??[];if(e.length===0)throw new L("empty_cart","Puurk.checkout.start(): the cart is empty");if(!((d=t.customer)!=null&&d.email))throw new L("customer_email_required","Puurk.checkout.start(): customer.email is required");const r=t.mode??(t.container?"inline":"modal");if(r==="inline"&&!t.container)throw new L("container_not_found","Puurk.checkout.start(): inline mode needs a container");const n=await rr({items:e,customer:t.customer,metadata:t.metadata}),o=t.clearCart??!0,i={...t,onComplete:c=>{var p,_;o&&((p=t.cart)==null||p.clear()),(_=t.onComplete)==null||_.call(t,c)}},a=r==="modal"?Be(n.session_id,i):await He(t.container,n.session_id,i);return{destroy:()=>a.destroy(),sessionId:n.session_id,expiresAt:n.expires_at??null}}async function or(t){const{getSessionDetails:e}=await Promise.resolve().then(()=>Mr);try{const r=await e(t);return{session_id:t,status:r.status,contract_id:r.contract_id??null}}catch(r){if(r instanceof L&&r.status===410)return{session_id:t,status:"expired",contract_id:null};throw r}}const We=10,Ve=20;function ir(t){try{const e=window.localStorage.getItem(t);if(!e)return[];const r=JSON.parse(e);return Array.isArray(r)?r.filter(n=>n!=null&&typeof n.service_id=="string"&&Number.isInteger(n.quantity)&&n.quantity>=1).slice(0,Ve).map(n=>({service_id:n.service_id,quantity:Math.min(n.quantity,We)})):[]}catch{return[]}}class lr{constructor(e={},r="default"){this.listeners=new Set;const n=e.persist??!0;this.storageKey=n===!1?null:typeof n=="string"?n:`puurk:cart:${r}`,this.lines=this.storageKey?ir(this.storageKey):[]}get items(){return this.lines.map(e=>({...e}))}get count(){return this.lines.reduce((e,r)=>e+r.quantity,0)}quantityOf(e){var r;return((r=this.lines.find(n=>n.service_id===e))==null?void 0:r.quantity)??0}add(e,r=1){this.setQuantity(e,this.quantityOf(e)+r)}setQuantity(e,r){if(Number.isNaN(r))return;const n=Math.max(0,Math.min(We,Math.floor(r))),o=this.lines.findIndex(i=>i.service_id===e);if(n===0){if(o===-1)return;this.lines=this.lines.filter((i,a)=>a!==o)}else if(o===-1){if(this.lines.length>=Ve)return;this.lines=[...this.lines,{service_id:e,quantity:n}]}else{if(this.lines[o].quantity===n)return;this.lines=this.lines.map((i,a)=>a===o?{...i,quantity:n}:i)}this.changed()}remove(e){this.setQuantity(e,0)}clear(){this.lines.length!==0&&(this.lines=[],this.changed())}on(e,r){return this.listeners.add(r),()=>this.listeners.delete(r)}changed(){if(this.storageKey)try{window.localStorage.setItem(this.storageKey,JSON.stringify(this.lines))}catch{}const e=this.items;for(const r of this.listeners)r(e)}}var ie,k,Ye,R,Je,Ke,Ge,Pe,le,G,Qe,Ce,Ee,Ie,ae={},se=[],ar=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,ce=Array.isArray;function j(t,e){for(var r in e)t[r]=e[r];return t}function Te(t){t&&t.parentNode&&t.parentNode.removeChild(t)}function sr(t,e,r){var n,o,i,a={};for(i in e)i=="key"?n=e[i]:i=="ref"?o=e[i]:a[i]=e[i];if(arguments.length>2&&(a.children=arguments.length>3?ie.call(arguments,2):r),typeof t=="function"&&t.defaultProps!=null)for(i in t.defaultProps)a[i]===void 0&&(a[i]=t.defaultProps[i]);return ue(t,a,n,o,null)}function ue(t,e,r,n,o){var i={type:t,props:e,key:r,ref:n,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:o??++Ye,__i:-1,__u:0};return o==null&&k.vnode!=null&&k.vnode(i),i}function A(t){return t.children}function de(t,e){this.props=t,this.context=e}function H(t,e){if(e==null)return t.__?H(t.__,t.__i+1):null;for(var r;e<t.__k.length;e++)if((r=t.__k[e])!=null&&r.__e!=null)return r.__e;return typeof t.type=="function"?H(t):null}function cr(t){if(t.__P&&t.__d){var e=t.__v,r=e.__e,n=[],o=[],i=j({},e);i.__v=e.__v+1,k.vnode&&k.vnode(i),$e(t.__P,i,e,t.__n,t.__P.namespaceURI,32&e.__u?[r]:null,n,r??H(e),!!(32&e.__u),o),i.__v=e.__v,i.__.__k[i.__i]=i,it(n,i,o),e.__e=e.__=null,i.__e!=r&&Xe(i)}}function Xe(t){if((t=t.__)!=null&&t.__c!=null)return t.__e=t.__c.base=null,t.__k.some(function(e){if(e!=null&&e.__e!=null)return t.__e=t.__c.base=e.__e}),Xe(t)}function Ze(t){(!t.__d&&(t.__d=!0)&&R.push(t)&&!pe.__r++||Je!=k.debounceRendering)&&((Je=k.debounceRendering)||Ke)(pe)}function pe(){try{for(var t,e=1;R.length;)R.length>e&&R.sort(Ge),t=R.shift(),e=R.length,cr(t)}finally{R.length=pe.__r=0}}function et(t,e,r,n,o,i,a,s,d,c,p){var _,u,f,g,w,h,v,m=n&&n.__k||se,b=e.length;for(d=ur(r,e,m,d,b),_=0;_<b;_++)(f=r.__k[_])!=null&&(u=f.__i!=-1&&m[f.__i]||ae,f.__i=_,h=$e(t,f,u,o,i,a,s,d,c,p),g=f.__e,f.ref&&u.ref!=f.ref&&(u.ref&&Fe(u.ref,null,f),p.push(f.ref,f.__c||g,f)),w==null&&g!=null&&(w=g),(v=!!(4&f.__u))||u.__k===f.__k?(d=tt(f,d,t,v),v&&u.__e&&(u.__e=null)):typeof f.type=="function"&&h!==void 0?d=h:g&&(d=g.nextSibling),f.__u&=-7);return r.__e=w,d}function ur(t,e,r,n,o){var i,a,s,d,c,p=r.length,_=p,u=0;for(t.__k=new Array(o),i=0;i<o;i++)(a=e[i])!=null&&typeof a!="boolean"&&typeof a!="function"?(typeof a=="string"||typeof a=="number"||typeof a=="bigint"||a.constructor==String?a=t.__k[i]=ue(null,a,null,null,null):ce(a)?a=t.__k[i]=ue(A,{children:a},null,null,null):a.constructor===void 0&&a.__b>0?a=t.__k[i]=ue(a.type,a.props,a.key,a.ref?a.ref:null,a.__v):t.__k[i]=a,d=i+u,a.__=t,a.__b=t.__b+1,s=null,(c=a.__i=dr(a,r,d,_))!=-1&&(_--,(s=r[c])&&(s.__u|=2)),s==null||s.__v==null?(c==-1&&(o>p?u--:o<p&&u++),typeof a.type!="function"&&(a.__u|=4)):c!=d&&(c==d-1?u--:c==d+1?u++:(c>d?u--:u++,a.__u|=4))):t.__k[i]=null;if(_)for(i=0;i<p;i++)(s=r[i])!=null&&(2&s.__u)==0&&(s.__e==n&&(n=H(s)),at(s,s));return n}function tt(t,e,r,n){var o,i;if(typeof t.type=="function"){for(o=t.__k,i=0;o&&i<o.length;i++)o[i]&&(o[i].__=t,e=tt(o[i],e,r,n));return e}t.__e!=e&&(n&&(e&&t.type&&!e.parentNode&&(e=H(t)),r.insertBefore(t.__e,e||null)),e=t.__e);do e=e&&e.nextSibling;while(e!=null&&e.nodeType==8);return e}function dr(t,e,r,n){var o,i,a,s=t.key,d=t.type,c=e[r],p=c!=null&&(2&c.__u)==0;if(c===null&&s==null||p&&s==c.key&&d==c.type)return r;if(n>(p?1:0)){for(o=r-1,i=r+1;o>=0||i<e.length;)if((c=e[a=o>=0?o--:i++])!=null&&(2&c.__u)==0&&s==c.key&&d==c.type)return a}return-1}function rt(t,e,r){e[0]=="-"?t.setProperty(e,r??""):t[e]=r==null?"":typeof r!="number"||ar.test(e)?r:r+"px"}function _e(t,e,r,n,o){var i,a;e:if(e=="style")if(typeof r=="string")t.style.cssText=r;else{if(typeof n=="string"&&(t.style.cssText=n=""),n)for(e in n)r&&e in r||rt(t.style,e,"");if(r)for(e in r)n&&r[e]==n[e]||rt(t.style,e,r[e])}else if(e[0]=="o"&&e[1]=="n")i=e!=(e=e.replace(Qe,"$1")),a=e.toLowerCase(),e=a in t||e=="onFocusOut"||e=="onFocusIn"?a.slice(2):e.slice(2),t.l||(t.l={}),t.l[e+i]=r,r?n?r[G]=n[G]:(r[G]=Ce,t.addEventListener(e,i?Ie:Ee,i)):t.removeEventListener(e,i?Ie:Ee,i);else{if(o=="http://www.w3.org/2000/svg")e=e.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(e!="width"&&e!="height"&&e!="href"&&e!="list"&&e!="form"&&e!="tabIndex"&&e!="download"&&e!="rowSpan"&&e!="colSpan"&&e!="role"&&e!="popover"&&e in t)try{t[e]=r??"";break e}catch{}typeof r=="function"||(r==null||r===!1&&e[4]!="-"?t.removeAttribute(e):t.setAttribute(e,e=="popover"&&r==1?"":r))}}function nt(t){return function(e){if(this.l){var r=this.l[e.type+t];if(e[le]==null)e[le]=Ce++;else if(e[le]<r[G])return;return r(k.event?k.event(e):e)}}}function $e(t,e,r,n,o,i,a,s,d,c){var p,_,u,f,g,w,h,v,m,b,y,P,x,q,B,M,C=e.type;if(e.constructor!==void 0)return null;128&r.__u&&(d=!!(32&r.__u),i=[s=e.__e=r.__e]),(p=k.__b)&&p(e);e:if(typeof C=="function"){_=a.length;try{if(m=e.props,b=C.prototype&&C.prototype.render,y=(p=C.contextType)&&n[p.__c],P=p?y?y.props.value:p.__:n,r.__c?v=(u=e.__c=r.__c).__=u.__E:(b?e.__c=u=new C(m,P):(e.__c=u=new de(m,P),u.constructor=C,u.render=_r),y&&y.sub(u),u.state||(u.state={}),u.__n=n,f=u.__d=!0,u.__h=[],u._sb=[]),b&&u.__s==null&&(u.__s=u.state),b&&C.getDerivedStateFromProps!=null&&(u.__s==u.state&&(u.__s=j({},u.__s)),j(u.__s,C.getDerivedStateFromProps(m,u.__s))),g=u.props,w=u.state,u.__v=e,f)b&&C.getDerivedStateFromProps==null&&u.componentWillMount!=null&&u.componentWillMount(),b&&u.componentDidMount!=null&&u.__h.push(u.componentDidMount);else{if(b&&C.getDerivedStateFromProps==null&&m!==g&&u.componentWillReceiveProps!=null&&u.componentWillReceiveProps(m,P),e.__v==r.__v||!u.__e&&u.shouldComponentUpdate!=null&&u.shouldComponentUpdate(m,u.__s,P)===!1){e.__v!=r.__v&&(u.props=m,u.state=u.__s,u.__d=!1),e.__e=r.__e,e.__k=r.__k,e.__k.some(function(F){F&&(F.__=e)}),se.push.apply(u.__h,u._sb),u._sb=[],u.__h.length&&a.push(u);break e}u.componentWillUpdate!=null&&u.componentWillUpdate(m,u.__s,P),b&&u.componentDidUpdate!=null&&u.__h.push(function(){u.componentDidUpdate(g,w,h)})}if(u.context=P,u.props=m,u.__P=t,u.__e=!1,x=k.__r,q=0,b)u.state=u.__s,u.__d=!1,x&&x(e),p=u.render(u.props,u.state,u.context),se.push.apply(u.__h,u._sb),u._sb=[];else do u.__d=!1,x&&x(e),p=u.render(u.props,u.state,u.context),u.state=u.__s;while(u.__d&&++q<25);u.state=u.__s,u.getChildContext!=null&&(n=j(j({},n),u.getChildContext())),b&&!f&&u.getSnapshotBeforeUpdate!=null&&(h=u.getSnapshotBeforeUpdate(g,w)),B=p!=null&&p.type===A&&p.key==null?lt(p.props.children):p,s=et(t,ce(B)?B:[B],e,r,n,o,i,a,s,d,c),u.base=e.__e,e.__u&=-161,u.__h.length&&a.push(u),v&&(u.__E=u.__=null)}catch(F){if(a.length=_,e.__v=null,d||i!=null){if(F.then){for(e.__u|=d?160:128;s&&s.nodeType==8&&s.nextSibling;)s=s.nextSibling;i!=null&&(i[i.indexOf(s)]=null),e.__e=s}else if(i!=null)for(M=i.length;M--;)Te(i[M])}else e.__e=r.__e;e.__k==null&&(e.__k=r.__k||[]),F.then||ot(e),k.__e(F,e,r)}}else i==null&&e.__v==r.__v?(e.__k=r.__k,e.__e=r.__e):s=e.__e=pr(r.__e,e,r,n,o,i,a,d,c);return(p=k.diffed)&&p(e),128&e.__u?void 0:s}function ot(t){t&&(t.__c&&(t.__c.__e=!0),t.__k&&t.__k.some(ot))}function it(t,e,r){for(var n=0;n<r.length;n++)Fe(r[n],r[++n],r[++n]);k.__c&&k.__c(e,t),t.some(function(o){try{t=o.__h,o.__h=[],t.some(function(i){i.call(o)})}catch(i){k.__e(i,o.__v)}})}function lt(t){return typeof t!="object"||t==null||t.__b>0?t:ce(t)?t.map(lt):t.constructor!==void 0?null:j({},t)}function pr(t,e,r,n,o,i,a,s,d){var c,p,_,u,f,g,w,h=r.props||ae,v=e.props,m=e.type;if(m=="svg"?o="http://www.w3.org/2000/svg":m=="math"?o="http://www.w3.org/1998/Math/MathML":o||(o="http://www.w3.org/1999/xhtml"),i!=null){for(c=0;c<i.length;c++)if((f=i[c])&&"setAttribute"in f==!!m&&(m?f.localName==m:f.nodeType==3)){t=f,i[c]=null;break}}if(t==null){if(m==null)return document.createTextNode(v);t=document.createElementNS(o,m,v.is&&v),s&&(k.__m&&k.__m(e,i),s=!1),i=null}if(m==null)h===v||s&&t.data==v||(t.data=v);else{if(i=m=="textarea"&&v.defaultValue!=null?null:i&&ie.call(t.childNodes),!s&&i!=null)for(h={},c=0;c<t.attributes.length;c++)h[(f=t.attributes[c]).name]=f.value;for(c in h)f=h[c],c=="dangerouslySetInnerHTML"?_=f:c=="children"||c in v||c=="value"&&"defaultValue"in v||c=="checked"&&"defaultChecked"in v||_e(t,c,null,f,o);for(c in v)f=v[c],c=="children"?u=f:c=="dangerouslySetInnerHTML"?p=f:c=="value"?g=f:c=="checked"?w=f:s&&typeof f!="function"||h[c]===f||_e(t,c,f,h[c],o);if(p)s||_&&(p.__html==_.__html||p.__html==t.innerHTML)||(t.innerHTML=p.__html),e.__k=[];else if(_&&(t.innerHTML=""),et(e.type=="template"?t.content:t,ce(u)?u:[u],e,r,n,m=="foreignObject"?"http://www.w3.org/1999/xhtml":o,i,a,i?i[0]:r.__k&&H(r,0),s,d),i!=null)for(c=i.length;c--;)Te(i[c]);s&&m!="textarea"||(c="value",m=="progress"&&g==null?t.removeAttribute("value"):g!=null&&(g!==t[c]||m=="progress"&&!g||m=="option"&&g!=h[c])&&_e(t,c,g,h[c],o),c="checked",w!=null&&w!=t[c]&&_e(t,c,w,h[c],o))}return t}function Fe(t,e,r){try{if(typeof t=="function"){var n=typeof t.__u=="function";n&&t.__u(),n&&e==null||(t.__u=t(e))}else t.current=e}catch(o){k.__e(o,r)}}function at(t,e,r){var n,o;if(k.unmount&&k.unmount(t),(n=t.ref)&&(n.current&&n.current!=t.__e||Fe(n,null,e)),(n=t.__c)!=null){if(n.componentWillUnmount)try{n.componentWillUnmount()}catch(i){k.__e(i,e)}n.base=n.__P=n.__n=null}if(n=t.__k)for(o=0;o<n.length;o++)n[o]&&at(n[o],e,r||typeof t.type!="function");r||Te(t.__e),t.__c=t.__=t.__e=void 0}function _r(t,e,r){return this.constructor(t,r)}function fe(t,e,r){var n,o,i,a;e==document&&(e=document.documentElement),k.__&&k.__(t,e),o=(n=!1)?null:e.__k,i=[],a=[],$e(e,t=e.__k=sr(A,null,[t]),o||ae,ae,e.namespaceURI,o?null:e.firstChild?ie.call(e.childNodes):null,i,o?o.__e:e.firstChild,n,a),it(i,t,a),t.props.children=null}ie=se.slice,k={__e:function(t,e,r,n){for(var o,i,a;e=e.__;)if((o=e.__c)&&!o.__)try{if((i=o.constructor)&&i.getDerivedStateFromError!=null&&(o.setState(i.getDerivedStateFromError(t)),a=o.__d),o.componentDidCatch!=null&&(o.componentDidCatch(t,n||{}),a=o.__d),a)return o.__E=o}catch(s){t=s}throw t}},Ye=0,de.prototype.setState=function(t,e){var r;r=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=j({},this.state),typeof t=="function"&&(t=t(j({},r),this.props)),t&&j(r,t),t!=null&&this.__v&&(e&&this._sb.push(e),Ze(this))},de.prototype.forceUpdate=function(t){this.__v&&(this.__e=!0,t&&this.__h.push(t),Ze(this))},de.prototype.render=A,R=[],Ke=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,Ge=function(t,e){return t.__v.__b-e.__v.__b},pe.__r=0,Pe=Math.random().toString(8),le="__d"+Pe,G="__a"+Pe,Qe=/(PointerCapture)$|Capture$/i,Ce=0,Ee=nt(!1),Ie=nt(!0);var fr=0;function l(t,e,r,n,o,i){e||(e={});var a,s,d=e;if("ref"in d)for(s in d={},e)s=="ref"?a=e[s]:d[s]=e[s];var c={type:t,props:d,key:r,ref:a,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--fr,__i:-1,__u:0,__source:o,__self:i};if(typeof t=="function"&&(a=t.defaultProps))for(s in a)d[s]===void 0&&(d[s]=a[s]);return k.vnode&&k.vnode(c),c}var Q,S,Le,st,X=0,ct=[],E=k,ut=E.__b,dt=E.__r,pt=E.diffed,_t=E.__c,ft=E.unmount,mt=E.__;function Ae(t,e){E.__h&&E.__h(S,t,X||e),X=0;var r=S.__H||(S.__H={__:[],__h:[]});return t>=r.__.length&&r.__.push({}),r.__[t]}function T(t){return X=1,mr(vt,t)}function mr(t,e,r){var n=Ae(Q++,2);if(n.t=t,!n.__c&&(n.__=[vt(void 0,e),function(s){var d=n.__N?n.__N[0]:n.__[0],c=n.t(d,s);d!==c&&(n.__N=[c,n.__[1]],n.__c.setState({}))}],n.__c=S,!S.__f)){var o=function(s,d,c){if(!n.__c.__H)return!0;var p=!1,_=n.__c.props!==s;if(n.__c.__H.__.some(function(f){if(f.__N){p=!0;var g=f.__[0];f.__=f.__N,f.__N=void 0,g!==f.__[0]&&(_=!0)}}),i){var u=i.call(this,s,d,c);return p?u||_:u}return!p||_};S.__f=!0;var i=S.shouldComponentUpdate,a=S.componentWillUpdate;S.componentWillUpdate=function(s,d,c){if(this.__e){var p=i;i=void 0,o(s,d,c),i=p}a&&a.call(this,s,d,c)},S.shouldComponentUpdate=o}return n.__N||n.__}function O(t,e){var r=Ae(Q++,3);!E.__s&&gt(r.__H,e)&&(r.__=t,r.u=e,S.__H.__h.push(r))}function W(t){return X=5,ht(function(){return{current:t}},[])}function ht(t,e){var r=Ae(Q++,7);return gt(r.__H,e)&&(r.__=t(),r.__H=e,r.__h=t),r.__}function me(t,e){return X=8,ht(function(){return t},e)}function hr(){for(var t;t=ct.shift();){var e=t.__H;if(t.__P&&e)try{e.__h.some(he),e.__h.some(Oe),e.__h=[]}catch(r){e.__h=[],E.__e(r,t.__v)}}}E.__b=function(t){S=null,ut&&ut(t)},E.__=function(t,e){t&&e.__k&&e.__k.__m&&(t.__m=e.__k.__m),mt&&mt(t,e)},E.__r=function(t){dt&&dt(t),Q=0;var e=(S=t.__c).__H;e&&(Le===S?(e.__h=[],S.__h=[],e.__.some(function(r){r.__N&&(r.__=r.__N),r.u=r.__N=void 0})):(e.__h.some(he),e.__h.some(Oe),e.__h=[],Q=0)),Le=S},E.diffed=function(t){pt&&pt(t);var e=t.__c;e&&e.__H&&(e.__H.__h.length&&(ct.push(e)!==1&&st===E.requestAnimationFrame||((st=E.requestAnimationFrame)||yr)(hr)),e.__H.__.some(function(r){r.u&&(r.__H=r.u,r.u=void 0)})),Le=S=null},E.__c=function(t,e){e.some(function(r){try{r.__h.some(he),r.__h=r.__h.filter(function(n){return!n.__||Oe(n)})}catch(n){e.some(function(o){o.__h&&(o.__h=[])}),e=[],E.__e(n,r.__v)}}),_t&&_t(t,e)},E.unmount=function(t){ft&&ft(t);var e,r=t.__c;r&&r.__H&&(r.__H.__.some(function(n){try{he(n)}catch(o){e=o}}),r.__H=void 0,e&&E.__e(e,r.__v))};var yt=typeof requestAnimationFrame=="function";function yr(t){var e,r=function(){clearTimeout(n),yt&&cancelAnimationFrame(e),setTimeout(t)},n=setTimeout(r,35);yt&&(e=requestAnimationFrame(r))}function he(t){var e=S,r=t.__c;typeof r=="function"&&(t.__c=void 0,r()),S=e}function Oe(t){var e=S;t.__c=t.__(),S=e}function gt(t,e){return!t||t.length!==e.length||e.some(function(r,n){return r!==t[n]})}function vt(t,e){return typeof e=="function"?e(t):e}const gr=40;class bt{constructor(e){this.candidates=new Map,this.listeners=new Set,this.requested=new Set,this.timer=null,this.sequence=0,this.state={quote:null,loading:!1,error:null},this.cart=e,e==null||e.on("change",()=>this.schedule(!0))}get items(){var e;return((e=this.cart)==null?void 0:e.items)??[]}watch(e,r){let n=!1;for(const o of e)this.candidates.set(o,(this.candidates.get(o)??0)+1),this.requested.has(o)||(n=!0);return this.listeners.add(r),r(this.state),(n||this.state.quote==null&&!this.state.loading)&&this.schedule(!1),()=>{this.listeners.delete(r);for(const o of e){const i=(this.candidates.get(o)??1)-1;i<=0?this.candidates.delete(o):this.candidates.set(o,i)}}}refresh(){this.schedule(!0)}schedule(e){e&&this.requested.clear(),this.timer!=null&&clearTimeout(this.timer),this.timer=setTimeout(()=>{this.timer=null,this.load()},gr)}async load(){const e=++this.sequence,r=[...this.candidates.keys()];r.forEach(n=>this.requested.add(n)),this.publish({...this.state,loading:!0});try{const n=await Se(this.items,r);if(e!==this.sequence)return;this.publish({quote:n,loading:!1,error:null})}catch(n){if(e!==this.sequence)return;r.forEach(o=>this.requested.delete(o)),this.publish({...this.state,loading:!1,error:n})}}publish(e){this.state=e;for(const r of this.listeners)r(e)}}const kt=new WeakMap;let xt=null;function ye(t){if(!t)return xt??(xt=new bt(null)),xt;let e=kt.get(t);return e||(e=new bt(t),kt.set(t,e)),e}const vr=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"});function I(t){return vr.format(t/100)}function wt(t){return t===1?"1 month":`${t} months`}function Ue({large:t=!1}){return l("span",{class:`spinner${t?" lg":""}`,role:"status","aria-label":"Loading"})}function br({children:t,onClick:e,type:r="button",variant:n="primary",loading:o=!1,disabled:i=!1}){return l("button",{type:r,class:`btn ${n}`,disabled:i||o,onClick:e,children:[o&&l(Ue,{}),t]})}function kr(){return l("div",{class:"center-col",children:[l(Ue,{large:!0}),l("p",{class:"muted",children:"Loading checkout..."})]})}function xr(){return l("div",{class:"center-col",children:[l("div",{class:"status-icon success",children:l("svg",{fill:"none",viewBox:"0 0 24 24",stroke:"currentColor","stroke-width":"2",children:l("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M5 13l4 4L19 7"})})}),l("h2",{class:"status-title",children:"Payment Successful"})]})}function wr({message:t}){return l("div",{class:"center-col",children:[l("div",{class:"status-icon error",children:l("svg",{fill:"none",viewBox:"0 0 24 24",stroke:"currentColor","stroke-width":"2",children:l("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})})}),l("h2",{class:"status-title",children:"Something went wrong"}),l("p",{class:"muted",children:t})]})}function Sr(){return l("div",{class:"center-col",children:[l("div",{class:"status-icon expired",children:l("svg",{fill:"none",viewBox:"0 0 24 24",stroke:"currentColor","stroke-width":"2",children:l("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"})})}),l("h2",{class:"status-title",children:"Session Expired"}),l("p",{class:"muted",children:"This checkout session has expired. Please contact your provider for a new link."})]})}function V({label:t,value:e,bold:r=!1}){return l("div",{class:`row${r?" bold":""}`,children:[l("span",{class:"label",children:t}),l("span",{class:"value",children:e})]})}function Z(t){return t.term_length===1||t.down_payment===t.total_amount}function Pr({plan:t,feeAmount:e=0}){const r=Z(t);return l("div",{class:"summary-card",children:[l("div",{class:"card-head",children:l("h3",{class:"card-title",children:r?"Pay in full":"Your Payment Plan"})}),l("div",{class:"stack-sm",children:[!r&&l(A,{children:[l(V,{label:"Monthly Payment",value:`${I(t.monthly_payment)} / mo`}),l(V,{label:"Term",value:wt(t.term_length)}),t.down_payment>0&&l(V,{label:"Down Payment",value:I(t.down_payment)}),l(V,{label:"Total",value:I(t.total_amount)}),l("hr",{}),l(V,{label:"Due Today",value:I(t.down_payment),bold:!0})]}),r&&l(A,{children:[l(V,{label:"Due Today",value:I(t.total_amount),bold:!0}),e>0&&l("p",{class:"small",children:["Includes ",I(e)," service fee"]})]})]})]})}function Cr({customerName:t,oneTimeAmount:e=null,serviceAgreementUrl:r,signature:n,onChange:o,disabled:i=!1}){const[a,s]=T(!1),[d,c]=T(t??"");function p(){if(!i){if(t&&t.trim().length>0){o(t.trim());return}s(!0)}}function _(){const f=d.trim();f.length!==0&&(o(f),s(!1))}function u(){o(null),s(!1)}return l("section",{class:"stack-sm",children:[l("h3",{class:"section-title",children:"Signature"}),l("p",{class:"muted",children:[e!=null?`By signing below, you authorize a one-time payment of ${I(e)}`:"By signing below, you agree to the terms above",r?l(A,{children:[e!=null?" and agree to the ":" and the ",l("a",{href:r,target:"_blank",rel:"noreferrer",children:"Client Service Agreement"})]}):null,"."]}),n?l("div",{class:"signed-box",children:[l("span",{class:"name",children:["✓ Signed by ",n]}),l("button",{type:"button",class:"clear",onClick:u,disabled:i,children:"Clear"})]}):a?l("div",{class:"name-prompt",children:[l("label",{for:"pk-signature-name",children:"Type your full name to sign"}),l("div",{class:"controls",children:[l("input",{id:"pk-signature-name",type:"text",value:d,onInput:f=>c(f.target.value),disabled:i,placeholder:"Full name"}),l("button",{type:"button",class:"confirm",onClick:_,disabled:i||d.trim().length===0,children:"Sign"})]})]}):l("button",{type:"button",class:"sign-box",onClick:p,disabled:i,children:[l("svg",{viewBox:"0 0 20 20",fill:"currentColor","aria-hidden":!0,children:l("path",{"fill-rule":"evenodd",d:"M10 3a1 1 0 011 1v9.586l3.293-3.293a1 1 0 011.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 011.414-1.414L9 13.586V4a1 1 0 011-1z","clip-rule":"evenodd"})}),"Click Here to Sign Document"]})]})}const St=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0});function ee(t){return St.format(Math.ceil(t/100))}function z(t){return t%100===0?St.format(t/100):I(t)}const Pt={primary:"--pk-color-primary",primaryText:"--pk-color-on-primary",background:"--pk-color-background",surface:"--pk-color-surface",text:"--pk-color-text",textMuted:"--pk-color-text-muted",border:"--pk-color-border",danger:"--pk-color-danger",success:"--pk-color-success"},te={colorPrimary:"#1DC6C4",colorBackground:"#FDFEFB",colorText:"#061928",fontFamily:"system-ui, sans-serif",borderRadius:"8px"};function U(t){return typeof t=="string"&&t.trim().length>0}function Er(t){const e={};if(!t)return e;const r=t.colors??{};for(const n of Object.keys(Pt)){const o=r[n];U(o)&&(e[Pt[n]]=o)}return U(t.fontFamily)&&(e["--pk-font-family"]=t.fontFamily),U(t.borderRadius)&&(e["--pk-radius"]=t.borderRadius),e}function Ct(t,e){const r=Er(e);for(const[n,o]of Object.entries(r))t.style.setProperty(n,o)}function Et(t){if(!t)return;const e=new Set(Array.from(document.head.querySelectorAll("link[data-puurk-font]")).map(r=>r.getAttribute("data-puurk-font")));for(const r of t){if(!U(r==null?void 0:r.cssSrc)||e.has(r.cssSrc))continue;const n=document.createElement("link");n.rel="stylesheet",n.href=r.cssSrc,n.setAttribute("data-puurk-font",r.cssSrc),document.head.appendChild(n),e.add(r.cssSrc)}}function Ir(t){const e=(t==null?void 0:t.colors)??{},r={colorPrimary:U(e.primary)?e.primary:te.colorPrimary,colorBackground:U(e.surface)?e.surface:U(e.background)?e.background:te.colorBackground,colorText:U(e.text)?e.text:te.colorText,fontFamily:U(t==null?void 0:t.fontFamily)?t.fontFamily:te.fontFamily,borderRadius:U(t==null?void 0:t.borderRadius)?t.borderRadius:te.borderRadius};return U(e.danger)&&(r.colorDanger=e.danger),{theme:"stripe",variables:r}}const Tr=`
:host {
  --pk-color-primary: #1DC6C4;
  --pk-color-on-primary: #fff;
  --pk-color-background: #FDFEFB;
  --pk-color-surface: #fff;
  --pk-color-text: currentColor;
  --pk-color-text-muted: color-mix(in srgb, currentColor 62%, transparent);
  --pk-color-border: color-mix(in srgb, currentColor 18%, transparent);
  --pk-color-danger: #D41C22;
  --pk-color-success: #008044;
  --pk-font-family: inherit;
  --pk-radius: 8px;
  --pk-price-font-family: inherit;
  --pk-price-size: 1.5em;
  --pk-price-weight: 600;

  all: initial;
  display: block;
  font-family: var(--pk-font-family);
  color: inherit;
  line-height: 1.35;
}
:host([hidden]) { display: none; }
*, *::before, *::after { box-sizing: border-box; }

.price { display: grid; gap: 2px; color: var(--pk-color-text); }
.price__label { font-size: 0.78em; letter-spacing: 0.04em; text-transform: uppercase; color: var(--pk-color-text-muted); }
.price__main { font-family: var(--pk-price-font-family); font-size: var(--pk-price-size); font-weight: var(--pk-price-weight); letter-spacing: -0.01em; }
.price__main small { font-size: 0.55em; font-weight: 500; color: var(--pk-color-text-muted); margin-left: 1px; }
.price__sub, .price__alt { font-size: 0.86em; color: var(--pk-color-text-muted); }
.price__alt strong { color: var(--pk-color-text); font-weight: 600; }
.price--loading .price__main { opacity: 0.45; }

.link {
  all: unset;
  cursor: pointer;
  justify-self: start;
  margin-top: 4px;
  font-size: 0.86em;
  color: var(--pk-color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.link:focus-visible { outline: 2px solid var(--pk-color-primary); outline-offset: 2px; border-radius: 2px; }

.skeleton { display: inline-block; width: 7em; height: 1em; border-radius: 4px; background: var(--pk-color-border); }

.summary { display: grid; gap: 10px; color: var(--pk-color-text); }
.summary__lines { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.summary__line { display: flex; justify-content: space-between; gap: 12px; font-size: 0.94em; }
.summary__line span:first-child { color: var(--pk-color-text-muted); }
.summary__total { display: flex; justify-content: space-between; font-weight: 600; }
.summary__lines + .summary__total { padding-top: 10px; border-top: 1px solid var(--pk-color-border); }
.summary__plan { font-size: 0.94em; }
.summary__plan strong { font-weight: 600; }
.summary__empty { color: var(--pk-color-text-muted); font-size: 0.94em; }

.overlay {
  position: fixed; inset: 0; z-index: 2147483000;
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  background: rgba(6, 25, 40, 0.48);
}
.dialog {
  width: min(460px, 100%); max-height: calc(100vh - 32px); overflow: auto;
  background: var(--pk-color-surface);
  color: #061928;
  border-radius: calc(var(--pk-radius) * 1.5);
  padding: 24px;
  box-shadow: 0 24px 64px rgba(6, 25, 40, 0.28);
  font-family: var(--pk-font-family);
}
.dialog__head { display: flex; justify-content: space-between; align-items: start; gap: 16px; margin-bottom: 16px; }
.dialog__title { margin: 0; font-size: 1.15em; font-weight: 600; }
.dialog__close { all: unset; cursor: pointer; font-size: 1.4em; line-height: 1; padding: 2px 6px; border-radius: 4px; color: #676867; }
.dialog__close:focus-visible { outline: 2px solid var(--pk-color-primary); }
.dialog__section { margin-top: 18px; }
.dialog__section h3 { margin: 0 0 8px; font-size: 0.78em; letter-spacing: 0.06em; text-transform: uppercase; color: #676867; font-weight: 600; }
.plans { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.plan {
  display: grid; grid-template-columns: 1fr auto; gap: 2px 12px;
  padding: 12px 14px; border: 1px solid #E4E4E3; border-radius: var(--pk-radius);
}
.plan__monthly { font-weight: 600; }
.plan__term, .plan__total { font-size: 0.86em; color: #676867; }
.plan__total { text-align: right; }
.due { display: flex; justify-content: space-between; font-weight: 600; }
.note { margin: 18px 0 0; font-size: 0.8em; color: #676867; }
.error { color: var(--pk-color-danger); font-size: 0.9em; }
`;function It(t,e){const r=typeof t=="string"?document.querySelector(t):t;if(!r)throw new L("container_not_found",`${e}: no element matches ${JSON.stringify(t)}`);return r}function qe(t,e,r){const n=document.createElement("div");n.setAttribute("data-puurk-widget",e),Ct(n,r),Et(r==null?void 0:r.fonts),t.appendChild(n);const o=n.attachShadow({mode:"open"}),i=document.createElement("style");i.textContent=Tr,o.appendChild(i);const a=document.createElement("div");o.appendChild(a);let s=!1;return{element:n,draw(d){s||fe(d,a)},destroy(){s||(s=!0,fe(null,a),n.remove())}}}function $r({items:t,options:e,onClose:r}){var p;const[n,o]=T(null),[i,a]=T(null),s=W(null),d=e.payInFull??!0;O(()=>{let _=!0;return Se(t,[]).then(u=>_&&o(u)).catch(u=>_&&a(u)),()=>{_=!1}},[]),O(()=>{var u;(u=s.current)==null||u.focus();const _=f=>{f.key==="Escape"&&r()};return document.addEventListener("keydown",_),()=>document.removeEventListener("keydown",_)},[]);const c=e.title??(e.serviceId&&((p=n==null?void 0:n.lines[0])==null?void 0:p.name))??(e.serviceId?"Payment options":"Your cart");return l("div",{class:"overlay",onClick:_=>_.target===_.currentTarget&&r(),children:l("div",{class:"dialog",role:"dialog","aria-modal":"true","aria-labelledby":"pk-plan-title",children:[l("div",{class:"dialog__head",children:[l("h2",{class:"dialog__title",id:"pk-plan-title",children:c}),l("button",{ref:s,type:"button",class:"dialog__close","aria-label":"Close",onClick:r,children:"×"})]}),i&&l("p",{class:"error",children:"We couldn't load the payment options. Please try again."}),!n&&!i&&l("span",{class:"skeleton","aria-busy":"true"}),n&&l(A,{children:[l("div",{class:"due",children:[l("span",{children:"Price"}),l("span",{children:z(n.amount)})]}),n.plans.length>0&&l("div",{class:"dialog__section",children:[l("h3",{children:"Pay over time"}),n.down_payment>0&&l("div",{class:"due",children:[l("span",{children:"Due today"}),l("span",{children:I(n.down_payment)})]}),l("ul",{class:"plans",style:{marginTop:n.down_payment>0?"10px":"0"},children:n.plans.map(_=>l("li",{class:"plan",children:[l("span",{class:"plan__monthly",children:[I(_.monthly_payment),"/mo"]}),l("span",{class:"plan__total",children:[I(_.total_amount)," total"]}),l("span",{class:"plan__term",children:[_.term_length," months"]})]},_.term_length))})]}),d&&n.pay_in_full&&l("div",{class:"dialog__section",children:[l("h3",{children:"Pay in full"}),l("div",{class:"due",children:[l("span",{children:"Due today"}),l("span",{children:I(n.pay_in_full.total_amount)})]}),n.pay_in_full.fee_amount>0&&l("div",{class:"plan__term",children:["Includes a ",I(n.pay_in_full.fee_amount)," service fee"]})]}),l("p",{class:"note",children:"Payment plans are set by your provider and processed securely by Puurk. You'll choose a plan and see the full terms at checkout."})]})]})})}function ze(t){var i;const e=t.serviceId?[{service_id:t.serviceId,quantity:1}]:((i=t.cart)==null?void 0:i.items)??[],r=qe(document.body,"plan-details",t.appearance);let n=!1;const o=()=>{var a;n||(n=!0,r.destroy(),(a=t.onClose)==null||a.call(t))};return r.draw(l($r,{items:e,options:t,onClose:o})),{destroy:o}}function Fr(t){const e=t.as_low_as;if(!e)return null;const r=`as low as ${ee(e.monthly_payment)}/mo for ${e.term_length} months`;return t.down_payment>0?`or ${z(t.down_payment)} today, then ${r}`:`or ${r}`}function Lr({options:t}){const{cart:e,lines:r=!0,payInFull:n=!0,planDetails:o=!0,appearance:i}=t,[a,s]=T(()=>ye(e).state);O(()=>ye(e).watch([],s),[e]);const d=a.quote;if(e.count===0)return l("div",{class:"summary__empty",children:t.emptyText??"Your cart is empty."});if(!d)return a.error?l("div",{class:"error",children:"We couldn't price your cart. Please try again."}):l("span",{class:"skeleton","aria-busy":"true"});const c=Fr(d);return l("div",{class:`summary${a.loading?" price--loading":""}`,"aria-live":"polite",children:[r&&l("ul",{class:"summary__lines",children:d.lines.map(p=>l("li",{class:"summary__line",children:[l("span",{children:[p.name??"Service",p.quantity>1?` × ${p.quantity}`:""]}),l("span",{children:z(p.amount)})]},p.service_id))}),l("div",{class:"summary__total",children:[l("span",{children:"Total"}),l("span",{children:z(d.amount)})]}),c&&l("div",{class:"summary__plan",children:c}),n&&d.pay_in_full&&l("div",{class:"price__alt",children:["or ",l("strong",{children:z(d.pay_in_full.total_amount)})," paid in full"]}),o&&l("button",{type:"button",class:"link",onClick:()=>ze({cart:e,payInFull:n,appearance:i}),children:"See plans"})]})}function Tt(t,e){const r=It(t,"Puurk.widgets.cartSummary()"),n=qe(r,"cart-summary",e.appearance),o=()=>n.draw(l(Lr,{options:e})),i=e.cart.on("change",o);return o(),{destroy(){i(),n.destroy()}}}function Ar(t,e,r=!0){const n=t.increments[e];if(!n)return null;const o=t.lines.length===0,i=n.as_low_as;if(o){const s=r&&n.pay_in_full?`or ${z(n.pay_in_full.total_amount)} paid in full`:null;if(!i)return{label:"Price",main:z(n.amount),suffix:"",sub:null,alt:null};const d=n.down_payment>0?` · ${z(n.down_payment)} today`:"";return{label:"As low as",main:ee(i.monthly_payment),suffix:"/mo",sub:`for ${i.term_length} months${d}`,alt:s}}if(!i||n.delta==null)return{label:"Adds to your cart",main:`+${z(n.amount-t.amount)}`,suffix:"",sub:null,alt:null};const a=r&&n.pay_in_full&&t.pay_in_full?`or +${z(n.pay_in_full.total_amount-t.pay_in_full.total_amount)} paid in full`:null;return n.delta>0?{label:"Adds to your cart",main:`+${ee(n.delta)}`,suffix:"/mo",sub:`Cart: ${ee(i.monthly_payment)}/mo for ${i.term_length} months`,alt:a}:{label:n.delta<0?"Your cart drops to":"Your cart stays at",main:ee(i.monthly_payment),suffix:"/mo",sub:`for ${i.term_length} months with this added`,alt:a}}function Or({options:t,onEmpty:e}){const{serviceId:r,cart:n,payInFull:o=!0,planDetails:i=!0,appearance:a}=t,[s,d]=T(()=>ye(n).state);O(()=>ye(n).watch([r],d),[r,n]);const c=s.quote?Ar(s.quote,r,o):null,p=!s.quote&&!s.error;return O(()=>e(!p&&c==null),[p,c==null]),p?l("div",{class:"price price--loading","aria-busy":"true",children:l("span",{class:"skeleton"})}):c?l("div",{class:`price${s.loading?" price--loading":""}`,"aria-live":"polite",children:[l("div",{class:"price__label",children:c.label}),l("div",{class:"price__main",children:[c.main,c.suffix&&l("small",{children:c.suffix})]}),c.sub&&l("div",{class:"price__sub",children:c.sub}),c.alt&&l("div",{class:"price__alt",children:c.alt}),i&&l("button",{type:"button",class:"link",onClick:()=>ze({serviceId:r,payInFull:o,appearance:a}),children:"See plans"})]}):null}function $t(t,e){const r=It(t,"Puurk.widgets.priceBlock()"),n=qe(r,"price-block",e.appearance);return n.draw(l(Or,{options:e,onEmpty:o=>n.element.toggleAttribute("hidden",o)})),{destroy:n.destroy}}const Ft=new Map;function Lt(t={}){const e=De()??"default";let r=Ft.get(e);return r||(r=new lr(t,e),Ft.set(e,r)),r}const Me="data-puurk-mounted";function Ur(t={}){const e=t.root??document,r=t.cart??Lt(),n=[],o=a=>Array.from(e.querySelectorAll(a)).filter(s=>s.hasAttribute(Me)?!1:(s.setAttribute(Me,""),n.push(()=>s.removeAttribute(Me)),!0));for(const a of o("[data-puurk-price]")){const s=a.getAttribute("data-puurk-price");if(!s)continue;const d=a.getAttribute("data-puurk-cart")!=="false",c=$t(a,{serviceId:s,cart:d?r:null,appearance:t.appearance,payInFull:t.payInFull});n.push(c.destroy)}for(const a of o("[data-puurk-cart-summary]")){const s=Tt(a,{cart:r,appearance:t.appearance,payInFull:t.payInFull});n.push(s.destroy)}for(const a of o("[data-puurk-add-to-cart]")){const s=()=>{const d=a.getAttribute("data-puurk-add-to-cart");d&&r.add(d)};a.addEventListener("click",s),n.push(()=>a.removeEventListener("click",s))}const i=o("[data-puurk-cart-count]");if(i.length>0){const a=()=>i.forEach(s=>s.textContent=String(r.count));a(),n.push(r.on("change",a))}return{destroy(){n.splice(0).reverse().forEach(a=>a())}}}const qr={configure(t){Dt(t)},cart(t){return Lt(t)},catalog:{services:tr,quote:Se},widgets:{priceBlock:$t,cartSummary:Tt,openPlanDetails:ze,mountAll:Ur},checkout:{redirect:Wt,open:Be,mount:He,start:nr,status:or}},zr=`
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
`;function At(t){return D(`/checkout/sessions/${t}/details`)}function Ot(t,e){const r=typeof e=="number"?{term_length:e}:{payment_option:e.payment_option};return D(`/checkout/sessions/${t}/select-plan`,{method:"POST",body:JSON.stringify(r)})}function je(t){return D(`/checkout/sessions/${t}/prepare-payment`,{method:"POST"})}function Ut(t,e){const r={signature:e.signature,payment_method_id:e.paymentMethodId};return e.paymentIntentId&&(r.payment_intent_id=e.paymentIntentId),e.setupIntentId&&(r.setup_intent_id=e.setupIntentId),D(`/checkout/sessions/${t}/confirm`,{method:"POST",body:JSON.stringify(r)})}const Mr=Object.freeze(Object.defineProperty({__proto__:null,confirmPayment:Ut,getSessionDetails:At,preparePayment:je,selectPlan:Ot},Symbol.toStringTag,{value:"Module"}));function jr(t){const[e,r]=T({state:"loading",session:null,payment:null,contractId:null,error:null});O(()=>{let s=!1;async function d(){try{const c=await At(t);if(s)return;if(c.status==="completed"){r({state:"success",session:c,payment:null,contractId:c.contract_id,error:null});return}if(c.status==="expired"||c.status==="canceled"){r({state:"expired",session:c,payment:null,contractId:null,error:null});return}if(c.status==="payment_ready"&&c.selected_plan){r({state:"loading",session:c,payment:null,contractId:null,error:null});try{const p=await je(t);s||r({state:"review",session:c,payment:p,contractId:null,error:null})}catch{s||r({state:"selectPlan",session:c,payment:null,contractId:null,error:null})}return}r({state:"selectPlan",session:c,payment:null,contractId:null,error:null})}catch(c){if(s)return;const p=c instanceof L?c:null;(p==null?void 0:p.status)===410?r({state:"expired",session:null,payment:null,contractId:null,error:null}):r({state:"error",session:null,payment:null,contractId:null,error:c.message??"Failed to load checkout session"})}}return d(),()=>{s=!0}},[t]);const n=me(async s=>{try{const d=await Ot(t,s);r(p=>({...p,session:p.session?{...p.session,selected_plan:d.selected_plan,status:"plan_selected",expires_at:d.expires_at}:p.session,error:null}));const c=await je(t);r(p=>({...p,state:"review",payment:c,session:p.session?{...p.session,status:"payment_ready"}:p.session}))}catch(d){r(c=>({...c,error:d.message??"Failed to select plan"}))}},[t]),o=me(async s=>{r(d=>({...d,state:"processing",error:null}));try{const d=await Ut(t,s);r(c=>({...c,state:"success",contractId:d.contract_id,session:c.session?{...c.session,status:"completed"}:c.session}))}catch(d){r(c=>({...c,state:"review",error:d.message??"Payment failed"}))}},[t]),i=me(()=>{r(s=>({...s,state:"expired"}))},[]),a=me(()=>{r(s=>({...s,state:"selectPlan",payment:null,error:null}))},[]);return{...e,selectPlan:n,confirm:o,setExpired:i,backToPlanSelection:a}}function Nr(t){const[e,r]=T(null);return O(()=>{if(!t)return;const n=new Date(t).getTime();function o(){const a=Math.max(0,Math.floor((n-Date.now())/1e3));r(a)}o();const i=setInterval(o,1e3);return()=>clearInterval(i)},[t]),e}function Rr({open:t}){return l("svg",{class:`chevron${t?" open":""}`,viewBox:"0 0 20 20",fill:"currentColor","aria-hidden":!0,children:l("path",{"fill-rule":"evenodd",d:"M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z","clip-rule":"evenodd"})})}function Ne({label:t,open:e,onToggle:r}){return l("button",{type:"button",class:"section-header",onClick:r,"aria-expanded":e,children:[l("span",{class:"label",children:t}),l(Rr,{open:e})]})}function Dr({plan:t,selected:e,mostPopular:r,onSelect:n,disabled:o}){return l("div",{class:"plan-card-wrap",children:[r&&l("div",{class:"plan-badge",children:"Most Popular"}),l("div",{class:`plan-card${e?" selected":""}`,children:[l("div",{class:"plan-price",children:I(t.monthly_payment).replace(".00","")}),l("div",{class:"small",children:"per month"}),l("button",{type:"button",class:`plan-select-btn${e?" selected":""}`,"aria-pressed":e,onClick:n,disabled:o,children:"Select"}),l("div",{class:"plan-term",children:wt(t.term_length)})]})]})}function Br({session:t,plans:e,payInFullOffered:r,selected:n,onSelect:o,loading:i}){var b;const[a,s]=T(!0),[d,c]=T(!0),[p,_]=T(!0),u=((b=e[Math.floor(e.length/2)])==null?void 0:b.term_length)??null,f=typeof n=="number"?n:n==="full"?null:u,g=e.find(y=>y.term_length===f)??e.find(y=>y.term_length===u)??e[0]??null,w=(g==null?void 0:g.down_payment)??0,h=r?t.pay_in_full??null:null,v=n==="full",m=t.services??[];return l("div",{class:"stack-sm",children:[e.length>0&&l(A,{children:[l("hr",{}),l("section",{children:[l(Ne,{label:"Pay Over Time",open:a,onToggle:()=>s(y=>!y)}),a&&l("div",{class:"plan-grid",children:e.map(y=>l(Dr,{plan:y,selected:y.term_length===f,mostPopular:y.term_length===u,onSelect:()=>o(y.term_length),disabled:i},y.term_length))}),l("div",{class:"row bold",style:"margin-top: 12px",children:[l("span",{class:"label",children:"Down Payment (due today)"}),l("span",{class:"value",children:I(w)})]})]})]}),h&&l(A,{children:[l("hr",{}),l("section",{"data-pk-section":"pay-in-full",children:[l(Ne,{label:"Pay In Full",open:d,onToggle:()=>c(y=>!y)}),d&&l("div",{class:`pay-in-full${v?" selected":""}`,children:[l("div",{class:"stack-sm",children:[l("div",{class:"row bold",children:[l("span",{class:"label",children:"Total:"}),l("span",{class:"value",children:I(h.total_amount)})]}),h.fee_amount>0&&l("p",{class:"small",children:["Includes ",I(h.fee_amount)," service fee"]})]}),l("button",{type:"button",class:`plan-select-btn${v?" selected":""}`,"aria-pressed":v,onClick:()=>o("full"),disabled:i,children:"Select"})]})]})]}),m.length>0&&l(A,{children:[l("hr",{}),l("section",{children:[l(Ne,{label:"Items",open:p,onToggle:()=>_(y=>!y)}),p&&l("ul",{class:"stack-sm",children:m.map((y,P)=>{const x=y.quantity??1,q=y.name??"Item";return l("li",{class:"row",children:[l("span",{class:"label",children:[q,x>1?` (x${x})`:""]}),y.amount!=null&&l("span",{class:"label",children:I(y.amount)})]},P)})})]})]})]})}function Hr(t,e){return Z(t)?`Sign and Pay ${I(t.total_amount)}`:e==="payment"?`Sign and Pay ${I(t.down_payment)}`:"Sign and Save Card"}function Wr({session:t,selectedPlan:e,payment:r,appearance:n,paymentSlotEl:o,onConfirm:i,processing:a,error:s}){var q,B;const[d,c]=T(null),[p,_]=T(null),[u,f]=T(!1),[g,w]=T(!1),h=W(null),v=W(null),m=W(n);m.current=n,O(()=>{let M=!1,C=null;async function F(){try{const{loadStripe:ke}=await Promise.resolve().then(()=>dn),Y=await ke(r.publishable_key);if(M)return;if(!Y){_("Failed to load payment form. Please refresh and try again.");return}const N=m.current,oe=Y.elements({clientSecret:r.client_secret,appearance:Ir(N),fonts:N==null?void 0:N.fonts,paymentMethodCreation:"manual"});C=oe.create("payment"),C.mount(o),C.on("ready",()=>{M||f(!0)}),h.current=Y,v.current=oe}catch{M||_("Failed to load payment form. Please refresh and try again.")}}return F(),()=>{M=!0,C==null||C.destroy(),h.current=null,v.current=null}},[r.client_secret,r.publishable_key,o]);const b=Z(e),y=Hr(e,r.mode);async function P(M){M.preventDefault();const C=h.current,F=v.current;if(!(!C||!F||g)){if(!d){_("Please sign before continuing.");return}_(null),w(!0);try{const{error:ke}=await F.submit();if(ke){_(ke.message??"Please check your card details");return}if(r.mode==="payment"){const{error:oe,paymentMethod:pn}=await C.createPaymentMethod({elements:F});if(oe){_(oe.message??"Failed to process card");return}i({signature:d,paymentIntentId:r.payment_intent_id,paymentMethodId:pn.id});return}const{error:Y,setupIntent:N}=await C.confirmSetup({elements:F,clientSecret:r.client_secret,redirect:"if_required"});if(Y){_(Y.message??"Failed to save card");return}if(!N||typeof N.payment_method!="string"){_("Could not retrieve saved payment method.");return}i({signature:d,setupIntentId:N.id,paymentMethodId:N.payment_method})}finally{w(!1)}}}const x=s??p;return l("form",{class:"stack",onSubmit:P,children:[l(Pr,{plan:e,feeAmount:b?((q=t.pay_in_full)==null?void 0:q.fee_amount)??0:0}),l(Cr,{customerName:((B=t.customer)==null?void 0:B.name)??null,oneTimeAmount:b?e.total_amount:null,serviceAgreementUrl:t.service_agreement_url,signature:d,onChange:c,disabled:a}),l("section",{class:"stack-sm",children:[l("h3",{class:"section-title",children:r.mode==="payment"||b?"Payment details":"Card on file"}),r.mode==="setup"&&!b&&l("p",{class:"small",children:"We'll save your card so we can charge your monthly payments automatically. No charge today."}),!u&&!x&&l("div",{style:"display: flex; justify-content: center; padding: 16px 0",children:l(Ue,{})}),l("slot",{name:"payment"})]}),x&&l("p",{class:"error-text",role:"alert",children:x}),l(br,{type:"submit",loading:a||g,disabled:!u||!d,children:y})]})}function Vr(t){return(t??[]).filter(e=>!Z(e))}function Yr(t,e){return e!==!1&&t.pay_in_full!=null}function Jr(t,e,r,n){return t??(r?Z(r)?n?"full":null:e.some(o=>o.term_length===r.term_length)?r.term_length:null:null)}function Kr(t){return t==="full"?{payment_option:"full"}:t}function Gr({sessionId:t,paymentSlotEl:e,options:r}){const{state:n,session:o,payment:i,contractId:a,error:s,selectPlan:d,confirm:c,setExpired:p,backToPlanSelection:_}=jr(t),[u,f]=T(null),[g,w]=T(!1),h=Nr((o==null?void 0:o.expires_at)??null),v=W(!1);O(()=>{var x;if(n==="success"&&!v.current){v.current=!0;const q={session_id:t,contract_id:a,status:"completed"};(x=r.onComplete)==null||x.call(r,q)}},[n,a,t,r]);const m=W(null);O(()=>{var x;n==="error"&&s&&m.current!==s&&(m.current=s,(x=r.onError)==null||x.call(r,new L("checkout_error",s)))},[n,s,r]),O(()=>{h===0&&n!=="expired"&&n!=="success"&&p()},[h,n,p]);const b=o?Yr(o,r.payInFull):!1,y=Vr((o==null?void 0:o.plans)??null);async function P(x){x==="full"&&!b||x!=="full"&&!y.some(q=>q.term_length===x)||(f(x),w(!0),await d(Kr(x)),w(!1))}return l("div",{class:"root",children:[h!=null&&h>0&&h<=300&&n!=="success"&&l("p",{class:"expiry-note",children:["Session expires in ",Math.floor(h/60),":",String(h%60).padStart(2,"0")]}),n==="loading"&&l(kr,{}),n==="error"&&l(wr,{message:s??"Checkout session not found"}),n==="expired"&&l(Sr,{}),n==="success"&&l(xr,{}),(n==="selectPlan"||n==="review"||n==="processing")&&o&&l("div",{class:"stack",children:[n==="selectPlan"&&l(Br,{session:o,plans:y,payInFullOffered:b,selected:Jr(u,y,o.selected_plan,b),onSelect:P,loading:g}),(n==="review"||n==="processing")&&i&&o.selected_plan&&l(Wr,{session:o,selectedPlan:o.selected_plan,payment:i,appearance:r.appearance,paymentSlotEl:e,onConfirm:c,processing:n==="processing",error:s}),s&&n==="selectPlan"&&l("p",{class:"error-text",role:"alert",children:s})]}),(n==="review"||n==="processing")&&l("div",{class:"cancel-row",children:l("button",{type:"button",onClick:_,children:"Back to plan selection"})})]})}function Qr(t,e,r){var p;const n=typeof t=="string"?document.querySelector(t):t;if(!n)throw new L("container_not_found",`Puurk.checkout.mount(): no element matches ${JSON.stringify(t)}`);const o=document.createElement("div");o.setAttribute("data-puurk-checkout","true"),Ct(o,r.appearance),Et((p=r.appearance)==null?void 0:p.fonts),n.appendChild(o);const i=o.attachShadow({mode:"open"}),a=document.createElement("style");a.textContent=zr,i.appendChild(a);const s=document.createElement("div");i.appendChild(s);const d=document.createElement("div");d.setAttribute("slot","payment"),o.appendChild(d),fe(l(Gr,{sessionId:e,paymentSlotEl:d,options:r}),s);let c=!1;return{destroy(){c||(c=!0,fe(null,s),o.remove())}}}const Xr=Object.freeze(Object.defineProperty({__proto__:null,renderCheckout:Qr},Symbol.toStringTag,{value:"Module"}));function re(t){"@babel/helpers - typeof";return typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?re=function(e){return typeof e}:re=function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},re(t)}var qt="dahlia",Zr=function(e){return e===3?"v3":e},zt="https://js.stripe.com",en="".concat(zt,"/").concat(qt,"/stripe.js"),tn=/^https:\/\/js\.stripe\.com\/v3\/?(\?.*)?$/,rn=/^https:\/\/js\.stripe\.com\/(v3|[a-z]+)\/stripe\.js(\?.*)?$/,Mt="loadStripe.setLoadParameters was called but an existing Stripe.js script already exists in the document; existing script parameters will be used",nn=function(e){return tn.test(e)||rn.test(e)},on=function(){for(var e=document.querySelectorAll('script[src^="'.concat(zt,'"]')),r=0;r<e.length;r++){var n=e[r];if(nn(n.src))return n}return null},jt=function(e){var r=e&&!e.advancedFraudSignals?"?advancedFraudSignals=false":"",n=document.createElement("script");n.src="".concat(en).concat(r);var o=document.head||document.body;if(!o)throw new Error("Expected document.body not to be null. Stripe.js requires a <body> element.");return o.appendChild(n),n},ln=function(e,r){!e||!e._registerWrapper||e._registerWrapper({name:"stripe-js",version:"9.12.1",startTime:r})},ne=null,ge=null,ve=null,an=function(e){return function(r){e(new Error("Failed to load Stripe.js",{cause:r}))}},sn=function(e,r){return function(){window.Stripe?e(window.Stripe):r(new Error("Stripe.js not available"))}},cn=function(e){return ne!==null?ne:(ne=new Promise(function(r,n){if(typeof window>"u"||typeof document>"u"){r(null);return}if(window.Stripe&&e&&console.warn(Mt),window.Stripe){r(window.Stripe);return}try{var o=on();if(o&&e)console.warn(Mt);else if(!o)o=jt(e);else if(o&&ve!==null&&ge!==null){var i;o.removeEventListener("load",ve),o.removeEventListener("error",ge),(i=o.parentNode)===null||i===void 0||i.removeChild(o),o=jt(e)}ve=sn(r,n),ge=an(n),o.addEventListener("load",ve),o.addEventListener("error",ge)}catch(a){n(a);return}}),ne.catch(function(r){return ne=null,Promise.reject(r)}))},un=function(e,r,n){if(e===null)return null;var o=r[0];if(typeof o!="string")throw new Error("Expected publishable key to be of type string, got type ".concat(re(o)," instead."));var i=o.match(/^pk_test/),a=Zr(e.version),s=qt;i&&a!==s&&console.warn("Stripe.js@".concat(a," was loaded on the page, but @stripe/stripe-js@").concat("9.12.1"," expected Stripe.js@").concat(s,". This may result in unexpected behavior. For more information, see https://docs.stripe.com/sdks/stripejs-versioning"));var d=e.apply(void 0,r);return ln(d,n),d},Nt=function(e){var r=`invalid load parameters; expected object of shape

    {advancedFraudSignals: boolean}

but received

    `.concat(JSON.stringify(e),`
`);if(e===null||re(e)!=="object")throw new Error(r);if(Object.keys(e).length===1&&typeof e.advancedFraudSignals=="boolean")return e;throw new Error(r)},be,Re=!1,Rt=function(){for(var e=arguments.length,r=new Array(e),n=0;n<e;n++)r[n]=arguments[n];Re=!0;var o=Date.now();return cn(be).then(function(i){return un(i,r,o)})};Rt.setLoadParameters=function(t){if(Re&&be){var e=Nt(t),r=Object.keys(e),n=r.reduce(function(o,i){var a;return o&&t[i]===((a=be)===null||a===void 0?void 0:a[i])},!0);if(n)return}if(Re)throw new Error("You cannot change load parameters after calling loadStripe");be=Nt(t)};const dn=Object.freeze(Object.defineProperty({__proto__:null,loadStripe:Rt},Symbol.toStringTag,{value:"Module"}));return qr}));
