import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  textClassName?: string;
};

const LOGO_SRC = "https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png";

export default function BrandLogo({
  href = "/",
  className = "",
  imageClassName = "h-9 w-9",
  showText = true,
  textClassName = "",
}: BrandLogoProps) {
  const content = (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src={LOGO_SRC}
        alt="DUA Edu"
        className={`object-contain shrink-0 ${imageClassName}`}
      />
      {showText && (
        <span className={`font-display font-bold tracking-tight ${textClassName}`}>DUA Edu</span>
      )}
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex">
      {content}
    </Link>
  );
}
