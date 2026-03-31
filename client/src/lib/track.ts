// Call this anywhere in the app to log events
export async function track(
  eventType: string,
  ticker?: string,
  metadata?: Record<string, unknown>
) {
  const token = localStorage.getItem("aliasist-token");
  try {
    await fetch("./api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ event_type: eventType, ticker, metadata }),
    });
  } catch {
    /* silent */
  }
}
