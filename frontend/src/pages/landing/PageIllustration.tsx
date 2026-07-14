export default function PageIllustration({
  multiple = false,
}: {
  multiple?: boolean;
}) {
  return (
    <>
      <div
        className="pointer-events-none absolute top-0 left-1/2 -z-10 -translate-x-1/4"
        aria-hidden="true"
      >
        <img
          className="max-w-none opacity-85 brightness-50 contrast-125 grayscale"
          src="/images/page-illustration.svg"
          width={846}
          height={594}
          alt="Page illustration"
        />
      </div>
      {multiple && (
        <>
          <div
            className="pointer-events-none absolute top-100 left-1/2 -z-10 -mt-20 -translate-x-full opacity-50"
            aria-hidden="true"
          >
            <img
              className="max-w-none opacity-50 brightness-50 contrast-125 grayscale"
              src="/images/blurred-shape-gray.svg"
              width={760}
              height={668}
              alt="Blurred shape"
            />
          </div>
          <div
            className="pointer-events-none absolute top-110 left-1/2 -z-10 -translate-x-1/3"
            aria-hidden="true"
          >
            <img
              className="max-w-none opacity-65 brightness-50 contrast-125 grayscale"
              src="/images/blurred-shape.svg"
              width={760}
              height={668}
              alt="Blurred shape"
            />
          </div>
        </>
      )}
    </>
  );
}
