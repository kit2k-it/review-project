"use client";

export function ShowInactiveToggle({
  showInactive,
}: {
  showInactive: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Hiện đã tắt</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          defaultChecked={showInactive}
          onChange={(e) => {
            const url = new URL(window.location.href);
            if (e.target.checked) {
              url.searchParams.set("includeInactive", "1");
            } else {
              url.searchParams.delete("includeInactive");
            }
            window.location.href = url.toString();
          }}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
  );
}
