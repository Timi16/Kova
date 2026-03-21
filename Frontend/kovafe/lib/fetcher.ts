export async function fetchJson<T>(input: string): Promise<T> {
  const response = await fetch(input);

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(error?.error ?? `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}
