"use client";
import * as React from 'react';
import React__default, { useState, useEffect, useCallback, useRef } from 'react';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { createPortal } from 'react-dom';

const isFunction = (valOrFunction) => typeof valOrFunction === "function";
const resolveValue = (valOrFunction, arg) => isFunction(valOrFunction) ? valOrFunction(arg) : valOrFunction;

const genId = /* @__PURE__ */ (() => {
  let count = 0;
  return () => {
    return (++count).toString();
  };
})();
const prefersReducedMotion = /* @__PURE__ */ (() => {
  let shouldReduceMotion = void 0;
  return () => {
    if (shouldReduceMotion === void 0 && typeof window !== "undefined") {
      const mediaQuery = matchMedia("(prefers-reduced-motion: reduce)");
      shouldReduceMotion = !mediaQuery || mediaQuery.matches;
    }
    return shouldReduceMotion;
  };
})();
const getBackgroundColor = (type) => {
  switch (type) {
    case "info":
      return "rgba(50, 50, 50, 1)";
    case "success":
      return "rgba(46, 125, 50, 1)";
    case "error":
      return "rgba(211, 47, 47, 1)";
    case "warning":
      return "rgba(237, 108, 2, 1)";
    default:
      return "#fff";
  }
};

const TOAST_LIMIT = 20;
var ActionType = /* @__PURE__ */ ((ActionType2) => {
  ActionType2[ActionType2["ADD_TOAST"] = 0] = "ADD_TOAST";
  ActionType2[ActionType2["UPDATE_TOAST"] = 1] = "UPDATE_TOAST";
  ActionType2[ActionType2["UPSERT_TOAST"] = 2] = "UPSERT_TOAST";
  ActionType2[ActionType2["DISMISS_TOAST"] = 3] = "DISMISS_TOAST";
  ActionType2[ActionType2["REMOVE_TOAST"] = 4] = "REMOVE_TOAST";
  ActionType2[ActionType2["START_PAUSE"] = 5] = "START_PAUSE";
  ActionType2[ActionType2["END_PAUSE"] = 6] = "END_PAUSE";
  return ActionType2;
})(ActionType || {});
const toastTimeouts = /* @__PURE__ */ new Map();
const TOAST_EXPIRE_DISMISS_DELAY = 1e3;
const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: 4 /* REMOVE_TOAST */,
      toastId
    });
  }, TOAST_EXPIRE_DISMISS_DELAY);
  toastTimeouts.set(toastId, timeout);
};
const clearFromRemoveQueue = (toastId) => {
  const timeout = toastTimeouts.get(toastId);
  if (timeout) {
    clearTimeout(timeout);
  }
};
const reducer = (state, action) => {
  switch (action.type) {
    case 0 /* ADD_TOAST */:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT)
      };
    case 1 /* UPDATE_TOAST */:
      if (action.toast.id) {
        clearFromRemoveQueue(action.toast.id);
      }
      return {
        ...state,
        toasts: state.toasts.map(
          (t) => t.id === action.toast.id ? { ...t, ...action.toast } : t
        )
      };
    case 2 /* UPSERT_TOAST */:
      const { toast } = action;
      return state.toasts.find((t) => t.id === toast.id) ? reducer(state, { type: 1 /* UPDATE_TOAST */, toast }) : reducer(state, { type: 0 /* ADD_TOAST */, toast });
    case 3 /* DISMISS_TOAST */:
      const { toastId } = action;
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast2) => {
          addToRemoveQueue(toast2.id);
        });
      }
      return {
        ...state,
        toasts: state.toasts.map(
          (t) => t.id === toastId || toastId === void 0 ? {
            ...t,
            visible: false
          } : t
        )
      };
    case 4 /* REMOVE_TOAST */:
      if (action.toastId === void 0) {
        return {
          ...state,
          toasts: []
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId)
      };
    case 5 /* START_PAUSE */:
      return {
        ...state,
        pausedAt: action.time
      };
    case 6 /* END_PAUSE */:
      const diff = action.time - (state.pausedAt || 0);
      return {
        ...state,
        pausedAt: void 0,
        toasts: state.toasts.map((t) => ({
          ...t,
          pauseDuration: t.pauseDuration + diff
        }))
      };
  }
};
const listeners = [];
let memoryState = { toasts: [], pausedAt: void 0 };
const dispatch = (action) => {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
};
const defaultTimeouts = {
  blank: 4e3,
  error: 4e3,
  success: 4e3,
  info: 4e3,
  warning: 4e3,
  loading: Infinity,
  custom: 4e3
};
const useStore = (toastOptions = {}) => {
  const [state, setState] = useState(memoryState);
  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);
  const mergedToasts = state.toasts.map((t) => ({
    ...toastOptions,
    ...toastOptions[t.type],
    ...t,
    duration: t.duration || toastOptions[t.type]?.duration || toastOptions?.duration || defaultTimeouts[t.type],
    style: {
      ...toastOptions.style,
      ...toastOptions[t.type]?.style,
      ...t.style
    }
  }));
  return {
    ...state,
    toasts: mergedToasts
  };
};

const createToast = (message, type = "blank", opts) => ({
  createdAt: Date.now(),
  visible: true,
  type,
  ariaProps: {
    role: "status",
    "aria-live": "polite"
  },
  message,
  pauseDuration: 0,
  ...opts,
  id: opts?.id || genId(),
  style: {
    backgroundColor: opts?.style?.backgroundColor ? opts?.style?.backgroundColor : opts?.theme === "coloured" ? getBackgroundColor(type) : "#fff",
    color: opts?.style?.color ? opts?.style?.color : opts?.theme === "coloured" ? type === "blank" ? "#262626" : "#fff" : "#262626",
    ...opts?.style
  },
  autoClose: opts?.autoClose === false ? false : true
});
const createHandler = (type) => (message, options) => {
  const toast2 = createToast(
    typeof message === "string" ? message.trim() : message,
    type,
    { ...options, theme: options?.theme ? options?.theme : "coloured" }
  );
  dispatch({ type: ActionType.UPSERT_TOAST, toast: toast2 });
  return toast2.id;
};
const toast = (message, opts) => createHandler("blank")(message, opts);
toast.success = createHandler("success");
toast.info = createHandler("info");
toast.error = createHandler("error");
toast.warning = createHandler("warning");
toast.loading = createHandler("loading");
toast.custom = createHandler("custom");
toast.dismiss = (toastId) => {
  dispatch({
    type: ActionType.DISMISS_TOAST,
    toastId
  });
};
toast.remove = (toastId) => dispatch({ type: ActionType.REMOVE_TOAST, toastId });
toast.promise = (promise, msgs, opts) => {
  const id = toast.loading(msgs.loading, { ...opts, ...opts?.loading });
  promise.then((p) => {
    toast.success(resolveValue(msgs.success, p), {
      id,
      ...opts,
      ...opts?.success
    });
    return p;
  }).catch((e) => {
    toast.error(resolveValue(msgs.error, e), {
      id,
      ...opts,
      ...opts?.error
    });
  });
  return promise;
};

const updateHeight = (toastId, height) => {
  dispatch({
    type: ActionType.UPDATE_TOAST,
    toast: { id: toastId, height }
  });
};
const startPause = () => {
  dispatch({
    type: ActionType.START_PAUSE,
    time: Date.now()
  });
};
const useToaster = (toastOptions) => {
  const { toasts, pausedAt } = useStore(toastOptions);
  useEffect(() => {
    if (pausedAt) {
      return;
    }
    const now = Date.now();
    const timeouts = toasts.map((t) => {
      if (t.duration === Infinity || !t.autoClose) {
        return;
      }
      const durationLeft = (t.duration || 0) + t.pauseDuration - (now - t.createdAt);
      if (durationLeft < 0) {
        if (t.visible) {
          toast.dismiss(t.id);
        }
        return;
      }
      return setTimeout(() => toast.dismiss(t.id), durationLeft);
    });
    return () => {
      timeouts.forEach((timeout) => timeout && clearTimeout(timeout));
    };
  }, [toasts, pausedAt]);
  const endPause = useCallback(() => {
    if (pausedAt) {
      dispatch({ type: ActionType.END_PAUSE, time: Date.now() });
    }
  }, [pausedAt]);
  const calculateOffset = useCallback(
    (toast2, opts) => {
      const { reverseOrder = false, gutter = 8, defaultPosition } = opts || {};
      const relevantToasts = toasts.filter(
        (t) => (t.position || defaultPosition) === (toast2.position || defaultPosition) && t.height
      );
      const toastIndex = relevantToasts.findIndex((t) => t.id === toast2.id);
      const toastsBefore = relevantToasts.filter(
        (toast3, i) => i < toastIndex && toast3.visible
      ).length;
      const offset = relevantToasts.filter((t) => t.visible).slice(...reverseOrder ? [toastsBefore + 1] : [0, toastsBefore]).reduce((acc, t) => acc + (t.height || 0) + gutter, 0);
      return offset;
    },
    [toasts]
  );
  return {
    toasts,
    handlers: {
      updateHeight,
      startPause,
      endPause,
      calculateOffset
    }
  };
};

let e={data:""},t=t=>"object"==typeof window?((t?t.querySelector("#_goober"):window._goober)||Object.assign((t||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:t||e,l=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,a=/\/\*[^]*?\*\/|  +/g,n=/\n+/g,o=(e,t)=>{let r="",l="",a="";for(let n in e){let c=e[n];"@"==n[0]?"i"==n[1]?r=n+" "+c+";":l+="f"==n[1]?o(c,n):n+"{"+o(c,"k"==n[1]?"":t)+"}":"object"==typeof c?l+=o(c,t?t.replace(/([^,])+/g,e=>n.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):n):null!=c&&(n=/^--/.test(n)?n:n.replace(/[A-Z]/g,"-$&").toLowerCase(),a+=o.p?o.p(n,c):n+":"+c+";");}return r+(t&&a?t+"{"+a+"}":a)+l},c={},s=e=>{if("object"==typeof e){let t="";for(let r in e)t+=r+s(e[r]);return t}return e},i=(e,t,r,i,p)=>{let u=s(e),d=c[u]||(c[u]=(e=>{let t=0,r=11;for(;t<e.length;)r=101*r+e.charCodeAt(t++)>>>0;return "go"+r})(u));if(!c[d]){let t=u!==e?e:(e=>{let t,r,o=[{}];for(;t=l.exec(e.replace(a,""));)t[4]?o.shift():t[3]?(r=t[3].replace(n," ").trim(),o.unshift(o[0][r]=o[0][r]||{})):o[0][t[1]]=t[2].replace(n," ").trim();return o[0]})(e);c[d]=o(p?{["@keyframes "+d]:t}:t,r?"":"."+d);}let f=r&&c.g?c.g:null;return r&&(c.g=c[d]),((e,t,r,l)=>{l?t.data=t.data.replace(l,e):-1===t.data.indexOf(e)&&(t.data=r?e+t.data:t.data+e);})(c[d],t,i,f),d},p=(e,t,r)=>e.reduce((e,l,a)=>{let n=t[a];if(n&&n.call){let e=n(r),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;n=t?"."+t:e&&"object"==typeof e?e.props?"":o(e,""):!1===e?"":e;}return e+l+(null==n?"":n)},"");function u(e){let r=this||{},l=e.call?e(r.p):e;return i(l.unshift?l.raw?p(l,[].slice.call(arguments,1),r.p):l.reduce((e,t)=>Object.assign(e,t&&t.call?t(r.p):t),{}):l,t(r.target),r.g,r.o,r.k)}let d,f,g;u.bind({g:1});let h=u.bind({k:1});function m(e,t,r,l){o.p=t,d=e,f=r,g=l;}function j(e,t){let r=this||{};return function(){let l=arguments;function a(n,o){let c=Object.assign({},n),s=c.className||a.className;r.p=Object.assign({theme:f&&f()},c),r.o=/ *go\d+/.test(s),c.className=u.apply(r,l)+(s?" "+s:"");let i=e;return e[0]&&(i=c.as||e,delete c.as),g&&i[0]&&g(c),d(i,c)}return a}}

const IndicatorWrapper = j("div")`
  position: relative;
  display: flex;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
  font-size: 18px;
`;
const rotation = h`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }`;
const Spinner = j("div")`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: inline-block;
  border-top: 3px solid #262626;
  border-right: 3px solid transparent;
  box-sizing: border-box;
  animation: ${rotation} 1s linear infinite;
`;
const enter = h`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`;
const AnimatedIconWrapper = j("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${enter} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`;
const ToastIcon = ({ toast }) => {
  const { icon, type, theme, iconColor } = toast;
  if (icon !== void 0) {
    if (typeof icon === "string") {
      return /* @__PURE__ */ jsx(AnimatedIconWrapper, { children: icon });
    } else {
      return icon;
    }
  }
  if (type === "blank") {
    return null;
  }
  return /* @__PURE__ */ jsx(IndicatorWrapper, { children: type !== "loading" && (type === "success" ? /* @__PURE__ */ jsxs(
    "svg",
    {
      width: "19px",
      height: "19px",
      viewBox: "0 0 24 24",
      xmlns: "http://www.w3.org/2000/svg",
      children: [
        /* @__PURE__ */ jsx("g", { id: "SVGRepo_bgCarrier", "stroke-width": "0" }),
        /* @__PURE__ */ jsx(
          "g",
          {
            id: "SVGRepo_tracerCarrier",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        ),
        /* @__PURE__ */ jsx("g", { id: "SVGRepo_iconCarrier", children: /* @__PURE__ */ jsx(
          "path",
          {
            "fill-rule": "evenodd",
            "clip-rule": "evenodd",
            d: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm-1.5-5.009c0-.867.659-1.491 1.491-1.491.85 0 1.509.624 1.509 1.491 0 .867-.659 1.509-1.509 1.509-.832 0-1.491-.642-1.491-1.509zM11.172 6a.5.5 0 0 0-.499.522l.306 7a.5.5 0 0 0 .5.478h1.043a.5.5 0 0 0 .5-.478l.305-7a.5.5 0 0 0-.5-.522h-1.655z",
            fill: "#000000",
            style: {
              fill: iconColor ? iconColor : theme === "coloured" ? "#fff" : "rgb(211, 47, 47)"
            }
          }
        ) })
      ]
    }
  ) : type === "info" ? /* @__PURE__ */ jsxs(
    "svg",
    {
      fill: "#000000",
      xmlns: "http://www.w3.org/2000/svg",
      width: "18px",
      height: "18px",
      viewBox: "0 0 52 52",
      "enable-background": "new 0 0 52 52",
      children: [
        /* @__PURE__ */ jsx("g", { id: "SVGRepo_bgCarrier", "stroke-width": "0" }),
        /* @__PURE__ */ jsx(
          "g",
          {
            id: "SVGRepo_tracerCarrier",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        ),
        /* @__PURE__ */ jsxs("g", { id: "SVGRepo_iconCarrier", children: [
          /* @__PURE__ */ jsx(
            "path",
            {
              d: "M26,2C12.7,2,2,12.7,2,26s10.7,24,24,24s24-10.7,24-24S39.3,2,26,2z M26,14.1c1.7,0,3,1.3,3,3s-1.3,3-3,3 s-3-1.3-3-3S24.3,14.1,26,14.1z M31,35.1c0,0.5-0.4,0.9-1,0.9h-3c-0.4,0-3,0-3,0h-2c-0.5,0-1-0.3-1-0.9v-2c0-0.5,0.4-1.1,1-1.1l0,0 c0.5,0,1-0.3,1-0.9v-4c0-0.5-0.4-1.1-1-1.1l0,0c-0.5,0-1-0.3-1-0.9v-2c0-0.5,0.4-1.1,1-1.1h6c0.5,0,1,0.5,1,1.1v8 c0,0.5,0.4,0.9,1,0.9l0,0c0.5,0,1,0.5,1,1.1V35.1z",
              style: {
                fill: iconColor ? iconColor : theme === "coloured" ? "#fff" : "rgb(2, 136, 209)"
              }
            }
          ),
          " "
        ] })
      ]
    }
  ) : type === "warning" ? /* @__PURE__ */ jsxs(
    "svg",
    {
      fill: "#000000",
      width: "18px",
      height: "18px",
      viewBox: "0 0 24 24",
      xmlns: "http://www.w3.org/2000/svg",
      children: [
        /* @__PURE__ */ jsx("g", { id: "SVGRepo_bgCarrier", "stroke-width": "0" }),
        /* @__PURE__ */ jsx(
          "g",
          {
            id: "SVGRepo_tracerCarrier",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        ),
        /* @__PURE__ */ jsx("g", { id: "SVGRepo_iconCarrier", children: /* @__PURE__ */ jsx(
          "path",
          {
            d: "M22.25,17.55,14.63,3.71a3,3,0,0,0-5.26,0L1.75,17.55A3,3,0,0,0,4.38,22H19.62a3,3,0,0,0,2.63-4.45ZM12,18a1,1,0,1,1,1-1A1,1,0,0,1,12,18Zm1-5a1,1,0,0,1-2,0V9a1,1,0,0,1,2,0Z",
            style: {
              fill: iconColor ? iconColor : theme === "coloured" ? "#262626" : "rgb(245, 124, 0)"
            }
          }
        ) })
      ]
    }
  ) : /* @__PURE__ */ jsxs(
    "svg",
    {
      viewBox: "0 0 48 48",
      xmlns: "http://www.w3.org/2000/svg",
      fill: "#000000",
      width: "18px",
      height: "18px",
      children: [
        /* @__PURE__ */ jsx("g", { id: "SVGRepo_bgCarrier", "stroke-width": "0" }),
        /* @__PURE__ */ jsx(
          "g",
          {
            id: "SVGRepo_tracerCarrier",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        ),
        /* @__PURE__ */ jsxs("g", { id: "SVGRepo_iconCarrier", children: [
          /* @__PURE__ */ jsx("title", { children: "check-circle-solid" }),
          /* @__PURE__ */ jsxs("g", { id: "Layer_2", "data-name": "Layer 2", children: [
            /* @__PURE__ */ jsx("g", { id: "invisible_box", "data-name": "invisible box", children: /* @__PURE__ */ jsx("rect", { width: "48", height: "48", fill: "none" }) }),
            /* @__PURE__ */ jsx("g", { id: "icons_Q2", "data-name": "icons Q2", children: /* @__PURE__ */ jsx(
              "path",
              {
                d: "M24,2A22,22,0,1,0,46,24,21.9,21.9,0,0,0,24,2ZM35.4,18.4l-14,14a1.9,1.9,0,0,1-2.8,0l-5.9-5.9a2.2,2.2,0,0,1-.4-2.7,2,2,0,0,1,3.1-.2L20,28.2,32.6,15.6a2,2,0,0,1,2.8,2.8Z",
                style: {
                  fill: iconColor ? iconColor : theme === "coloured" ? "#fff" : "rgb(56, 142, 60)"
                }
              }
            ) })
          ] })
        ] })
      ]
    }
  )) || type === "loading" && /* @__PURE__ */ jsx(Spinner, {}) });
};

const enterAnimation = (factor) => `
0% {transform: translate3d(0,${factor * -200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`;
const exitAnimation = (factor) => `
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${factor * -150}%,-1px) scale(.6); opacity:0;}
`;
const fadeInAnimation = `0%{opacity:0;} 100%{opacity:1;}`;
const fadeOutAnimation = `0%{opacity:1;} 100%{opacity:0;}`;
const ToastBarBase = j("div")`
  display: flex;
  align-items: center;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 360px;
  pointer-events: auto;
  border-radius: 8px;
  position: relative;
  font-size: 14px;
  padding: 6px 8px;
  font-family: "Roboto", sans-serif;
`;
const MessageBarBase = j("div")`
  display: flex;
  justify-content: flex-start;
  color: inherit;
  margin: 4px 4px 4px 8px;
  flex: 1 1 auto;
  white-space: pre-line;
`;
const ProgressbarBase = j("div")`
  position: absolute;
  bottom: 0.1%;
  left: 0.5%;
  right: 0.1%;
  width: 98%;
  height: 0.3rem;
  background-color: transparent;
`;
const ProgressbarSpan = j("div")`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  height: 100%;
`;
const CloseButton = j("span")`
  display: flex;
  align-items: center;
  margin-left: 16px;
  cursor: pointer;
`;
const getAnimationStyle = (position, visible) => {
  const top = position.includes("top");
  const factor = top ? 1 : -1;
  const [enter, exit] = prefersReducedMotion() ? [fadeInAnimation, fadeOutAnimation] : [enterAnimation(factor), exitAnimation(factor)];
  return {
    animation: visible ? `${h(enter)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards` : `${h(exit)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`
  };
};
const ToastBar = React__default.memo(
  ({ toast, position, style, children }) => {
    const animationStyle = toast.height ? getAnimationStyle(
      toast.position || position || "top-center",
      toast.visible
    ) : { opacity: 0 };
    const icon = /* @__PURE__ */ jsx(ToastIcon, { toast });
    const message = /* @__PURE__ */ jsx(MessageBarBase, { ...toast.ariaProps, children: resolveValue(toast.message, toast) });
    const closeButtonSpan = /* @__PURE__ */ jsx(CloseButton, { children: toast.closeButton });
    const progressBarRef = useRef();
    const [progress, setProgress] = useState(100);
    useEffect(() => {
      const complete = 0;
      if (toast.duration) {
        progressBarRef.current = setInterval(() => {
          if (progress > complete) {
            setProgress((prev) => prev - 1);
          } else {
            return;
          }
        }, toast.duration / 100);
      }
      return () => {
        clearInterval(progressBarRef.current);
      };
    }, []);
    const progressbar = toast.progressbar && /* @__PURE__ */ jsx(ProgressbarBase, { children: /* @__PURE__ */ jsx(
      ProgressbarSpan,
      {
        style: {
          width: `${progress}%`,
          backgroundColor: toast.theme === "coloured" ? "#fff" : getBackgroundColor(toast.type),
          borderRadius: toast.style?.borderRadius ? toast.style?.borderRadius : "8px"
        }
      }
    ) });
    return /* @__PURE__ */ jsx(
      ToastBarBase,
      {
        className: toast.className,
        style: {
          ...animationStyle,
          ...style,
          ...toast.style
        },
        children: typeof children === "function" ? children({
          icon,
          message
        }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          icon,
          message,
          toast.closeButton && closeButtonSpan,
          toast.progressbar && progressbar
        ] })
      }
    );
  }
);

m(React.createElement);
const ToastWrapper = ({
  id,
  className,
  style,
  onHeightUpdate,
  children
}) => {
  const ref = React.useCallback(
    (el) => {
      if (el) {
        const updateHeight = () => {
          const height = el.getBoundingClientRect().height;
          onHeightUpdate(id, height);
        };
        updateHeight();
        new MutationObserver(updateHeight).observe(el, {
          subtree: true,
          childList: true,
          characterData: true
        });
      }
    },
    [id, onHeightUpdate]
  );
  return /* @__PURE__ */ jsx("div", { ref, className, style, children });
};
const getPositionStyle = (position, offset) => {
  const top = position.includes("top");
  const verticalStyle = top ? { top: 0 } : { bottom: 0 };
  const horizontalStyle = position.includes("center") ? {
    justifyContent: "center"
  } : position.includes("right") ? {
    justifyContent: "flex-end"
  } : {};
  return {
    left: 0,
    right: 0,
    display: "flex",
    position: "absolute",
    transition: prefersReducedMotion() ? void 0 : `all 230ms cubic-bezier(.21,1.02,.73,1)`,
    transform: `translateY(${offset * (top ? 1 : -1)}px)`,
    ...verticalStyle,
    ...horizontalStyle
  };
};
const activeClass = u`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;
const DEFAULT_OFFSET = 16;
const Toaster = ({
  reverseOrder,
  position = "top-center",
  toastOptions,
  gutter,
  children,
  containerStyle,
  containerClassName,
  hidden = false
}) => {
  const { toasts, handlers } = useToaster(toastOptions);
  return createPortal(
    /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          position: "fixed",
          zIndex: 99999,
          top: DEFAULT_OFFSET,
          left: DEFAULT_OFFSET,
          right: DEFAULT_OFFSET,
          bottom: DEFAULT_OFFSET,
          pointerEvents: "none",
          ...containerStyle
        },
        className: containerClassName,
        hidden,
        children: toasts.map((t) => {
          const toastPosition = t.position || position;
          const offset = handlers.calculateOffset(t, {
            reverseOrder,
            gutter,
            defaultPosition: position
          });
          const positionStyle = getPositionStyle(toastPosition, offset);
          return /* @__PURE__ */ jsx(
            ToastWrapper,
            {
              id: t.id,
              onHeightUpdate: handlers.updateHeight,
              className: t.visible ? activeClass : "",
              style: positionStyle,
              children: t.type === "custom" ? resolveValue(t.message, t) : children ? children(t) : /* @__PURE__ */ jsx(ToastBar, { toast: t, position: toastPosition })
            },
            t.id
          );
        })
      }
    ),
    document.body
  );
};

export { ToastBar, ToastIcon, Toaster, toast as default, resolveValue, toast, useToaster, useStore as useToasterStore };
//# sourceMappingURL=index.esm.js.map
