import type { ComponentProps } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

type SelectProps = Omit<
  ComponentProps<typeof SelectPrimitive.Trigger>,
  "children" | "value" | "defaultValue" | "onChange" | "asChild"
> & {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
};

/** A controlled Select; field labels and validation describe the visible trigger. */
export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  className,
  title,
  ...triggerProps
}: SelectProps) {
  // Radix reserves the empty string for placeholders. Keep empty choices available
  // (for example, clearing a connection) without passing an empty Item value.
  let emptyValue = "__frpc_ui_empty_value__";
  while (options.some((option) => option.value === emptyValue))
    emptyValue += "_";
  const hasEmptyOption = options.some((option) => option.value === "");
  const encodedValue = value === "" && hasEmptyOption ? emptyValue : value;
  const selected = options.find((option) => option.value === value);
  const unavailable = disabled || !options.some((option) => !option.disabled);

  return (
    <SelectPrimitive.Root
      value={encodedValue}
      onValueChange={(nextValue) =>
        onValueChange(nextValue === emptyValue ? "" : nextValue)
      }
      disabled={unavailable}
    >
      <SelectPrimitive.Trigger
        {...triggerProps}
        className={cn("input select select-trigger", className)}
        title={title ?? selected?.label ?? placeholder}
      >
        <span className="select-value">
          <SelectPrimitive.Value placeholder={placeholder}>
            {selected?.label}
          </SelectPrimitive.Value>
        </span>
        <SelectPrimitive.Icon className="select-icon">
          <ChevronDown aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="select-content"
          position="popper"
          sideOffset={6}
          align="start"
          collisionPadding={12}
          hideWhenDetached
        >
          <SelectPrimitive.ScrollUpButton className="select-scroll-button">
            <ChevronUp aria-hidden="true" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="select-viewport">
            <SelectPrimitive.Group>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value === "" ? emptyValue : option.value}
                  disabled={option.disabled}
                  textValue={option.label}
                  className="select-item"
                >
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="select-item-indicator">
                    <Check aria-hidden="true" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Group>
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="select-scroll-button">
            <ChevronDown aria-hidden="true" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
