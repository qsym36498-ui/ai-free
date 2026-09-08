/**
 * اختبارات طبقة إيقاظ قاعدة البيانات وإعادة المحاولة (Neon Scale-to-Zero).
 * وحدة نقيّة بلا اتصال حقيقي — نُمرّر pool وهمية.
 */
import { pingPool, withQueryRetry, isTransientError } from "@/db/wake";

describe("isTransientError", () => {
  it("يعرف أخطاء الاتصال/الانقطاع العابرة", () => {
    expect(isTransientError(new Error("ECONNRESET connecting to neon-tech"))).toBe(true);
    expect(isTransientError(new Error("Connection terminated due to timeout"))).toBe(true);
  });

  it("لا يخلط الأخطاء المنطقية مع العابرة", () => {
    expect(isTransientError(new Error("duplicate key value violates unique constraint"))).toBe(false);
    expect(isTransientError(new Error("syntax error at or near SELECT"))).toBe(false);
  });
});

describe("pingPool — إيقاظ القاعدة النائمة", () => {
  it("يعيد النجاح بمجرد نجاح أول SELECT 1 بعد فشلين", async () => {
    const query = jest
      .fn()
      .mockRejectedValueOnce(new Error("ECONNRESET"))
      .mockRejectedValueOnce(new Error("08P01"))
      .mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });
    const ok = await pingPool({ query }, 6, 5);
    expect(ok).toBe(true);
    expect(query).toHaveBeenCalledTimes(3);
  });

  it("ينفد بصبر ويعيد false لو القاعدة لم تستيقظ", async () => {
    const query = jest.fn().mockRejectedValue(new Error("Connection refused"));
    const ok = await pingPool({ query }, 2, 5);
    expect(ok).toBe(false);
    expect(query).toHaveBeenCalledTimes(2);
  });
});

describe("withQueryRetry — إعادة محاولة العابر فقط", () => {
  it("يعيد المحاولة مرتين ثم ينجح", async () => {
    let calls = 0;
    const operation = jest.fn(async () => {
      calls++;
      if (calls <= 2) throw new Error("terminating connection due to postmaster exit");
      return 42;
    });
    await expect(withQueryRetry(operation, 3, 5)).resolves.toBe(42);
    expect(calls).toBe(3);
  });

  it("يرمي الخطأ المنطقي فوراً بلا إعادة", async () => {
    const operation = jest.fn().mockRejectedValue(new Error("duplicate key value"));
    await expect(withQueryRetry(operation, 3, 5)).rejects.toThrow("duplicate key");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("يرمي آخر خطأ بعد نفاد المحاولات", async () => {
    const operation = jest.fn().mockRejectedValue(new Error("ECONNRESET"));
    await expect(withQueryRetry(operation, 2, 5)).rejects.toThrow("ECONNRESET");
    expect(operation).toHaveBeenCalledTimes(2);
  });
});