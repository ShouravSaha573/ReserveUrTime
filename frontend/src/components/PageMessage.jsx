export default function PageMessage({
  title,
  message,
  action
}) {
  return (
    <div className="surface rounded-3xl p-7">
      <h2 className="font-display text-2xl">
        {title}
      </h2>
      <p className="mt-3 leading-7 text-white/60">
        {message}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
