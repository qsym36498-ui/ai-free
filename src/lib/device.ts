/** معرف ثابت لكل جهاز زائر — يستخدم في التدريب والتصويت */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "unknown";
  let id = localStorage.getItem("luau-mind-device");
  if (!id) {
    id = "dev-" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    localStorage.setItem("luau-mind-device", id);
  }
  return id;
}
