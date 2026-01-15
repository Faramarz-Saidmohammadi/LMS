export function getHttpErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Something went wrong"
  );
}
