import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";

type Variant = "primary" | "secondary" | "github";
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

const SIZE_CLASSES: Record<Size, string> = {
    sm: "px-3 py-[7px] text-sm",
    md: "px-4 py-2.5 text-sm",
};

// Inner corner radius is 1px tighter than the pill's rounded-lg so the
// gradient border reads as a consistent ring at every size.
const INNER_RADIUS = "rounded-[7px]";

// Duotone variants share the same two-layer structure (gradient border that
// reveals on hover) and only differ in color.
const DUOTONE_STYLES: Record<DuotoneVariant, { outer: string; inner: string; ring: string }> = {
    primary: {
        outer: "bg-linear-to-br from-brand-light-green-400 to-brand-light-green-700",
        inner: "bg-brand-pitch-black-500 text-brand-alabaster-grey-100 group-hover:bg-transparent group-hover:text-brand-pitch-black-500",
        ring: "focus:ring-brand-light-green-500/30",
    },
    github: {
        outer: "bg-linear-to-br from-white to-neutral-400",
        inner: "bg-black text-white group-hover:bg-transparent group-hover:text-black",
        ring: "focus:ring-neutral-400/40",
    },
};

export default function Button({
    variant = "primary",
    size = "md",
    fullWidth = false,
    className = "",
    children,
    ...props
}: ButtonProps) {
    const width = fullWidth ? "w-full" : "";
    const isAnchor = props.href !== undefined;
    // Internal routes (e.g. "/login") go through react-router's Link so navigation
    // stays client-side; in-page anchors (#section) and external URLs use a plain <a>.
    const isInternalLink = isAnchor && props.href!.startsWith("/");

    if (variant === "secondary") {
        const secondaryClasses = `inline-flex items-center justify-center gap-1 rounded-lg border border-brand-carbon-black-700 bg-brand-carbon-black-800/60 font-medium text-brand-alabaster-grey-700 transition hover:border-brand-carbon-black-600 hover:bg-brand-carbon-black-800 hover:text-brand-alabaster-grey-100 disabled:cursor-not-allowed disabled:opacity-50 ${SIZE_CLASSES[size]} ${width} ${className}`;

        if (isInternalLink) {
            const { href, ...rest } = props as AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
            return (
                <Link to={href} className={secondaryClasses} {...rest}>
                    {children}
                </Link>
            );
        }
        return isAnchor ? (
            <a className={secondaryClasses} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
                {children}
            </a>
        ) : (
            <button className={secondaryClasses} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
                {children}
            </button>
        );
    }

    // primary / github: duotone gradient border that reveals on hover, à la Flowbite's gradient-duotone buttons.
    const styles = DUOTONE_STYLES[variant];
    const outerClasses = `group inline-flex items-center overflow-hidden rounded-lg ${styles.outer} p-0.5 font-medium transition focus:outline-none focus:ring-4 ${styles.ring} disabled:cursor-not-allowed disabled:opacity-50 ${width} ${className}`;
    const innerClasses = `flex w-full items-center justify-center gap-1 ${INNER_RADIUS} ${styles.inner} transition-all duration-150 ease-in ${SIZE_CLASSES[size]}`;

    if (isInternalLink) {
        const { href, ...rest } = props as AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
        return (
            <Link to={href} className={outerClasses} {...rest}>
                <span className={innerClasses}>{children}</span>
            </Link>
        );
    }
    return isAnchor ? (
        <a className={outerClasses} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
            <span className={innerClasses}>{children}</span>
        </a>
    ) : (
        <button className={outerClasses} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
            <span className={innerClasses}>{children}</span>
        </button>
    );
}
