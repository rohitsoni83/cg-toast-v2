import { CSSProperties } from "react";

export type ToastType =
  | "success"
  | "error"
  | "info"
  | "warning"
  | "loading"
  | "blank"
  | "custom";

export type ToastPosition =
  | string
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type Renderable = JSX.Element | string | null;

export type ValueFunction<TValue, TArg> = (arg: TArg) => TValue;
export type ValueOrFunction<TValue, TArg> =
  | TValue
  | ValueFunction<TValue, TArg>;

const isFunction = <TValue, TArg>(
  valOrFunction: ValueOrFunction<TValue, TArg>
): valOrFunction is ValueFunction<TValue, TArg> =>
  typeof valOrFunction === "function";

export const resolveValue = <TValue, TArg>(
  valOrFunction: ValueOrFunction<TValue, TArg>,
  arg: TArg
): TValue => (isFunction(valOrFunction) ? valOrFunction(arg) : valOrFunction);

export interface Toast {
  type: ToastType;
  id: string;
  message: ValueOrFunction<Renderable, Toast> | string;
  icon?: Renderable;
  duration?: number;
  pauseDuration: number;
  position?: ToastPosition;
  progressbar?: boolean;
  theme?: string | "coloured" | "light";
  ariaProps: {
    role: "status" | "alert";
    "aria-live": "assertive" | "off" | "polite";
  };
  style?: CSSProperties;
  className?: string;
  createdAt: number;
  visible: boolean;
  height?: number;
  iconColor?: string;
  autoClose?: boolean;
  closeButton?: JSX.Element;
}

export type ToastOptions = Partial<
  Pick<
    Toast,
    | "id"
    | "icon"
    | "duration"
    | "ariaProps"
    | "className"
    | "style"
    | "position"
    | "theme"
    | "progressbar"
    | "iconColor"
    | "autoClose"
    | "closeButton"
  >
>;

export type DefaultToastOptions = ToastOptions & {
  [key in ToastType]?: ToastOptions;
};

export interface ToasterProps {
  position?: ToastPosition;
  toastOptions?: DefaultToastOptions;
  reverseOrder?: boolean;
  gutter?: number;
  containerStyle?: React.CSSProperties;
  containerClassName?: string;
  children?: (toast: Toast) => JSX.Element;
  hidden?: boolean;
}

export interface ToastWrapperProps {
  id: string;
  className?: string;
  style?: React.CSSProperties;
  onHeightUpdate: (id: string, height: number) => void;
  children?: React.ReactNode;
}
