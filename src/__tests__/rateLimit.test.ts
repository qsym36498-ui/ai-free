import { enforceRateLimit } from "@/lib/rateLimit";

function makeRequest(ip = "127.0.0.1"): Request {
  return new Request("http://localhost/api/test", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("enforceRateLimit", () => {
  let ipCounter = 0;
  function uniqueRequest(): Request {
    ipCounter += 1;
    return makeRequest(`127.0.0.${ipCounter}`);
  }

  it("allows first request", () => {
    const res = enforceRateLimit(uniqueRequest(), "test", 5, 60_000);
    expect(res).toBeNull();
  });

  it("allows requests within limit", () => {
    const req = uniqueRequest();
    for (let i = 0; i < 5; i++) {
      const res = enforceRateLimit(req, "test", 5, 60_000);
      expect(res).toBeNull();
    }
  });

  it("blocks requests over limit", () => {
    const req = uniqueRequest();
    for (let i = 0; i < 5; i++) {
      enforceRateLimit(req, "test", 5, 60_000);
    }
    const res = enforceRateLimit(req, "test", 5, 60_000);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
  });

  it("returns retry-after header", () => {
    const req = uniqueRequest();
    for (let i = 0; i < 5; i++) {
      enforceRateLimit(req, "test", 5, 60_000);
    }
    const res = enforceRateLimit(req, "test", 5, 60_000);
    expect(res!.headers.get("Retry-After")).toBeTruthy();
  });

  it("different IPs get separate buckets", () => {
    const req1 = makeRequest("1.1.1.1");
    const req2 = makeRequest("2.2.2.2");

    for (let i = 0; i < 5; i++) {
      enforceRateLimit(req1, "test", 5, 60_000);
    }
    // req1 should be blocked, req2 should be fine
    expect(enforceRateLimit(req1, "test", 5, 60_000)).not.toBeNull();
    expect(enforceRateLimit(req2, "test", 5, 60_000)).toBeNull();
  });

  it("different endpoint names get separate buckets", () => {
    const req = makeRequest();
    for (let i = 0; i < 5; i++) {
      enforceRateLimit(req, "endpoint1", 5, 60_000);
    }
    expect(enforceRateLimit(req, "endpoint1", 5, 60_000)).not.toBeNull();
    expect(enforceRateLimit(req, "endpoint2", 5, 60_000)).toBeNull();
  });
});
