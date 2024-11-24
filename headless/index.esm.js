import { useState, useEffect, useCallback } from 'react';

const isFunction = (valOrFunction) => typeof valOrFunction === "function";
const resolveValue = (valOrFunction, arg) => isFunction(valOrFunction) ? valOrFunction(arg) : valOrFunction;

const genId = /* @__PURE__ */ (() => {
  let count = 0;
  return () => {
    return (++count).toString();
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
  useEffect(() => {
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

export { toast as default, resolveValue, toast, useToaster, useStore as useToasterStore };
//# sourceMappingURL=index.esm.js.map
