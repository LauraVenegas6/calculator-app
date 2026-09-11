interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="error" role="alert" aria-live="assertive">
      {message}
    </div>
  );
}
