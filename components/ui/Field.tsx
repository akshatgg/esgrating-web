import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import clsx from "clsx";

type BaseProps = {
  label: string;
  name: string;
  error?: string;
};

type InputProps = BaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "id"> & {
    as?: "input";
  };

type TextareaProps = BaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "id"> & {
    as: "textarea";
  };

export type FieldProps = InputProps | TextareaProps;

const FIELD_CLASSES =
  "w-full rounded-[10px] border border-field bg-white px-4 py-3 text-ink placeholder:text-muted focus:border-calc-blue focus:outline-none focus:ring-2 focus:ring-calc-blue/20";

/** A labeled form field matching the calculator card style (border-field, label). */
export default function Field(props: FieldProps) {
  const { label, name, error, className, ...rest } = props;
  const id = `field-${name}`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-label">
        {label}
        {"required" in rest && rest.required ? (
          <span className="text-grade-d"> *</span>
        ) : null}
      </label>
      {props.as === "textarea" ? (
        <textarea
          id={id}
          name={name}
          className={clsx(FIELD_CLASSES, "min-h-32 resize-y", className)}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={id}
          name={name}
          className={clsx(FIELD_CLASSES, className)}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error ? <p className="text-sm text-grade-d">{error}</p> : null}
    </div>
  );
}
