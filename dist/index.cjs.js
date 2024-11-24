"use client";
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var jsxRuntime = require('react/jsx-runtime');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

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
  success: 2e3,
  loading: Infinity,
  custom: 4e3
};
const useStore = (toastOptions = {}) => {
  const [state, setState] = React.useState(memoryState);
  React.useEffect(() => {
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
  id: opts?.id || genId()
});
const createHandler = (type) => (message, options) => {
  const toast2 = createToast(message, type, options);
  dispatch({ type: ActionType.UPSERT_TOAST, toast: toast2 });
  return toast2.id;
};
const toast = (message, opts) => createHandler("blank")(message, opts);
toast.error = createHandler("error");
toast.success = createHandler("success");
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
  React.useEffect(() => {
    if (pausedAt) {
      return;
    }
    const now = Date.now();
    const timeouts = toasts.map((t) => {
      if (t.duration === Infinity) {
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
  const endPause = React.useCallback(() => {
    if (pausedAt) {
      dispatch({ type: ActionType.END_PAUSE, time: Date.now() });
    }
  }, [pausedAt]);
  const calculateOffset = React.useCallback(
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

const circleAnimation$1 = h`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`;
const firstLineAnimation = h`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`;
const secondLineAnimation = h`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`;
const ErrorIcon = j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${(p) => p.primary || "#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${circleAnimation$1} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${firstLineAnimation} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${(p) => p.secondary || "#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${secondLineAnimation} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`;

const rotate = h`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;
const LoaderIcon = j("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${(p) => p.secondary || "#e0e0e0"};
  border-right-color: ${(p) => p.primary || "#616161"};
  animation: ${rotate} 1s linear infinite;
`;

const circleAnimation = h`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`;
const checkmarkAnimation = h`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`;
const CheckmarkIcon = j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${(p) => p.primary || "#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${circleAnimation} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${checkmarkAnimation} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${(p) => p.secondary || "#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`;

const StatusWrapper = j("div")`
  position: absolute;
`;
const IndicatorWrapper = j("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
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
  const { icon, type, iconTheme } = toast;
  if (icon !== void 0) {
    if (typeof icon === "string") {
      return /* @__PURE__ */ jsxRuntime.jsx(AnimatedIconWrapper, { children: icon });
    } else {
      return icon;
    }
  }
  if (type === "blank") {
    return null;
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(IndicatorWrapper, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(LoaderIcon, { ...iconTheme }),
    type !== "loading" && /* @__PURE__ */ jsxRuntime.jsx(StatusWrapper, { children: type === "error" ? /* @__PURE__ */ jsxRuntime.jsx(ErrorIcon, { ...iconTheme }) : /* @__PURE__ */ jsxRuntime.jsx(CheckmarkIcon, { ...iconTheme }) })
  ] });
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
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`;
const Message = j("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`;
const getAnimationStyle = (position, visible) => {
  const top = position.includes("top");
  const factor = top ? 1 : -1;
  const [enter, exit] = prefersReducedMotion() ? [fadeInAnimation, fadeOutAnimation] : [enterAnimation(factor), exitAnimation(factor)];
  return {
    animation: visible ? `${h(enter)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards` : `${h(exit)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`
  };
};
const ToastBar = React__namespace.memo(
  ({ toast, position, style, children }) => {
    const animationStyle = toast.height ? getAnimationStyle(
      toast.position || position || "top-center",
      toast.visible
    ) : { opacity: 0 };
    const icon = /* @__PURE__ */ jsxRuntime.jsx(ToastIcon, { toast });
    const message = /* @__PURE__ */ jsxRuntime.jsx(Message, { ...toast.ariaProps, children: resolveValue(toast.message, toast) });
    return /* @__PURE__ */ jsxRuntime.jsx(
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
        }) : /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
          icon,
          message
        ] })
      }
    );
  }
);

m(React__namespace.createElement);
const ToastWrapper = ({
  id,
  className,
  style,
  onHeightUpdate,
  children
}) => {
  const ref = React__namespace.useCallback(
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
  return /* @__PURE__ */ jsxRuntime.jsx("div", { ref, className, style, children });
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
  containerClassName
}) => {
  const { toasts, handlers } = useToaster(toastOptions);
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      style: {
        position: "fixed",
        zIndex: 9999,
        top: DEFAULT_OFFSET,
        left: DEFAULT_OFFSET,
        right: DEFAULT_OFFSET,
        bottom: DEFAULT_OFFSET,
        pointerEvents: "none",
        ...containerStyle
      },
      className: containerClassName,
      onMouseEnter: handlers.startPause,
      onMouseLeave: handlers.endPause,
      children: toasts.map((t) => {
        const toastPosition = t.position || position;
        const offset = handlers.calculateOffset(t, {
          reverseOrder,
          gutter,
          defaultPosition: position
        });
        const positionStyle = getPositionStyle(toastPosition, offset);
        return /* @__PURE__ */ jsxRuntime.jsx(
          ToastWrapper,
          {
            id: t.id,
            onHeightUpdate: handlers.updateHeight,
            className: t.visible ? activeClass : "",
            style: positionStyle,
            children: t.type === "custom" ? resolveValue(t.message, t) : children ? children(t) : /* @__PURE__ */ jsxRuntime.jsx(ToastBar, { toast: t, position: toastPosition })
          },
          t.id
        );
      })
    }
  );
};

exports.CheckmarkIcon = CheckmarkIcon;
exports.ErrorIcon = ErrorIcon;
exports.LoaderIcon = LoaderIcon;
exports.ToastBar = ToastBar;
exports.ToastIcon = ToastIcon;
exports.Toaster = Toaster;
exports.default = toast;
exports.resolveValue = resolveValue;
exports.toast = toast;
exports.useToaster = useToaster;
exports.useToasterStore = useStore;
//# sourceMappingURL=index.cjs.js.map
