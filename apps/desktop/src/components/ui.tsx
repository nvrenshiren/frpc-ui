import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type ReactNode,
  type ComponentProps,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import { Check, Minus, X } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";
import { useI18n } from "../i18n";

const buttonVariants = cva("button", {
  variants: {
    variant: {
      primary: "button-primary",
      outline: "button-outline",
      ghost: "button-ghost",
      danger: "button-danger",
    },
    size: { default: "", sm: "button-sm", icon: "button-icon" },
  },
  defaultVariants: { variant: "outline", size: "default" },
});
export function Button({
  variant = "outline",
  size = "default",
  className,
  asChild,
  type = "button",
  ...props
}: ComponentProps<"button"> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "default" | "sm" | "icon";
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("input", className)} {...props} />;
}
export { Select } from "./select";
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  const descriptionId = `${htmlFor}-description`;
  const describe = (nodes: ReactNode): ReactNode =>
    Children.map(nodes, (node) => {
      if (!isValidElement<Record<string, unknown>>(node)) return node;
      const props = node.props;
      const changes: Record<string, unknown> = {};
      if (props.id === htmlFor) {
        changes["aria-describedby"] =
          error || hint
            ? [props["aria-describedby"], descriptionId]
                .filter(Boolean)
                .join(" ")
            : props["aria-describedby"];
        if (error) changes["aria-invalid"] = true;
      }
      if (props.children)
        changes.children = describe(props.children as ReactNode);
      return cloneElement(node, changes);
    });
  return (
    <div className={cn("field", className)} data-invalid={error ? true : undefined}>
      <LabelPrimitive.Root htmlFor={htmlFor} className="field-label">
        {label}
      </LabelPrimitive.Root>
      {describe(children)}
      {error ? (
        <p id={descriptionId} className="field-error" role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={descriptionId} className="field-hint">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
export function Checkbox({
  checked,
  onCheckedChange,
  label,
  disabled,
  ...props
}: {
  checked: boolean | "indeterminate";
  onCheckedChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  "aria-label"?: string;
  id?: string;
}) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  return (
    <span className="checkbox-field">
      <CheckboxPrimitive.Root
        {...props}
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="checkbox"
      >
        <CheckboxPrimitive.Indicator>
          {checked === "indeterminate" ? (
            <Minus size={12} />
          ) : (
            <Check size={12} />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && <LabelPrimitive.Root htmlFor={id}>{label}</LabelPrimitive.Root>}
    </span>
  );
}
export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: "neutral" | "success" | "warning" | "danger";
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("badge", `badge-${tone}`, className)}>{children}</span>
  );
}
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay" />
        <DialogPrimitive.Content
          className={cn("dialog-content", className)}
          {...(!description ? { "aria-describedby": undefined } : {})}
        >
          <div className="dialog-heading">
            <div>
              <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description>
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("关闭编辑器", "Close editor")}
              >
                <X size={18} />
              </Button>
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
