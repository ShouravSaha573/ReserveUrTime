import HomepageCmsManagement from "../components/admin/HomepageCmsManagement";
import PlatformAdminSectionNav from "../components/PlatformAdminSectionNav";

export default function PlatformAdminHomepagePage() {
  return (
    <main className="admin-workspace mx-auto max-w-6xl px-6 py-12 md:px-8 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-[.3em] text-white/35">
            Platform Admin · Homepage CMS
          </p>
          <h1 className="mt-5 font-display text-5xl md:text-7xl">
            Public experience
          </h1>
          <p className="mt-5 max-w-2xl leading-7 text-white/45">
            Edit the platform-facing homepage without touching source code.
            Restaurant-internal operations remain outside Platform Admin scope.
          </p>
        </div>
      </div>
      <PlatformAdminSectionNav />

      <div className="mt-12">
        <HomepageCmsManagement />
      </div>
    </main>
  );
}
