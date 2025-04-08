import { Link } from "react-router-dom";
import { twMerge } from "tailwind-merge";

interface Props {
  title: string;
  icon?: React.ReactNode;
  path?: string;
  className?: string;
  img?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const Button = ({
  title,
  icon,
  path,
  className,
  img,
  onClick,
  disabled = false,
  type = "button",
}: Props) => {
  const newClassName = twMerge(
    "flex whitespace-nowrap gap-1 text-sm font-bold items-center capitalize border rounded-lg py-1.5 px-3 transition-all duration-300",
    disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90",
    className
  );

  const content = (
    <>
      {img && <img src={img} alt="" className="w-[18px] h-[18px]" />}
      {title}
      {icon && icon}
    </>
  );

  if (path) {
    return (
      <Link
        to={path}
        className={newClassName}
        onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}
        aria-disabled={disabled}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={newClassName}
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
      disabled={disabled}
    >
      {content}
    </button>
  );
};

export default Button;
