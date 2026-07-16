import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { Link } from "react-router";

type Variant = "primary" | "secondary" | "github" | "danger";
type Size = "sm" | "md";
type DuotoneVariant = Exclude<Variant, "secondary">;

type BaseProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type ButtonAsAnchor = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;
type ButtonRestProps =
  Omit<ButtonAsButton, keyof BaseProps> | Omit<ButtonAsAnchor, keyof BaseProps>;

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-[7px] text-sm",
  md: "px-4 py-2.5 text-sm",
};

const INNER_RADIUS = "rounded-[7px]";

const DUOTONE_STYLES: Record<
  DuotoneVariant,
  { outer: string; inner: string; ring: string }
> = {
  primary: {
    outer:
      "bg-linear-to-br from-brand-light-green-500 via-brand-light-green-600 to-brand-light-green-800 shadow-[0_10px_24px_rgba(0,0,0,0.20)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.26)]",
    inner:
      "bg-brand-pitch-black-500 text-brand-alabaster-grey-100 group-hover:bg-transparent group-hover:text-brand-pitch-black-500",
    ring: "focus:ring-brand-light-green-500/30",
  },
  github: {
    outer: "bg-linear-to-br from-white to-neutral-400",
    inner:
      "bg-black text-white group-hover:bg-transparent group-hover:text-black",
    ring: "focus:ring-neutral-400/40",
  },
  danger: {
    outer:
      "border border-1 border-brand-brick-red-500 bg-transparent hover:bg-brand-brick-red-500/10",
    inner:
      "bg-transparent text-brand-brick-red-400 group-hover:bg-transparent group-hover:text-brand-brick-red-300",
    ring: "focus:ring-brand-brick-red-500/30",
  },
};

function hasHref(
  props: ButtonRestProps,
): props is Omit<ButtonAsAnchor, keyof BaseProps> & { href: string } {
  return "href" in props && typeof props.href === "string";
}

function isInternalLink(
  props: ButtonRestProps,
): props is Omit<ButtonAsAnchor, keyof BaseProps> & { href: string } {
  return hasHref(props) && props.href.startsWith("/");
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const width = fullWidth ? "w-full" : "";

  if (variant === "secondary") {
    const classes = `inline-flex items-center justify-center gap-1 rounded-lg border border-brand-carbon-black-700 bg-brand-carbon-black-800/60 font-medium text-brand-alabaster-grey-700 transition hover:border-brand-carbon-black-600 hover:bg-brand-carbon-black-800 hover:text-brand-alabaster-grey-100 disabled:cursor-not-allowed disabled:opacity-50 ${SIZE_CLASSES[size]} ${width} ${className}`;

    if (isInternalLink(props)) {
      const { href, ...rest } = props;
      return (
        <Link to={href} className={classes} {...rest}>
          {children}
        </Link>
      );
    }

    if (hasHref(props)) {
      const anchorProps = props as Omit<ButtonAsAnchor, keyof BaseProps>;
      return (
        <a className={classes} {...anchorProps}>
          {children}
        </a>
      );
    }

    const buttonProps = props as Omit<ButtonAsButton, keyof BaseProps>;
    return (
      <button className={classes} {...buttonProps}>
        {children}
      </button>
    );
  }

  const styles = DUOTONE_STYLES[variant];
  const outerClasses = `group inline-flex items-center overflow-hidden rounded-lg ${styles.outer} p-0.5 font-medium transition focus:outline-none focus:ring-4 ${styles.ring} disabled:cursor-not-allowed disabled:opacity-50 ${width} ${className}`;
  const innerClasses = `flex w-full items-center justify-center gap-1 cursor-pointer ${INNER_RADIUS} ${styles.inner} transition-all duration-150 ease-in ${SIZE_CLASSES[size]}`;

  if (isInternalLink(props)) {
    const { href, ...rest } = props;
    return (
      <Link to={href} className={outerClasses} {...rest}>
        <span className={innerClasses}>{children}</span>
      </Link>
    );
  }

  if (hasHref(props)) {
    const anchorProps = props as Omit<ButtonAsAnchor, keyof BaseProps>;
    return (
      <a className={outerClasses} {...anchorProps}>
        <span className={innerClasses}>{children}</span>
      </a>
    );
  }

  const buttonProps = props as Omit<ButtonAsButton, keyof BaseProps>;
  return (
    <button className={outerClasses} {...buttonProps}>
      <span className={innerClasses}>{children}</span>
    </button>
  );
}
