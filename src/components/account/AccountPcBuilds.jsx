import { Link } from "react-router-dom";
import { Cpu, Trash2 } from "lucide-react";
import { formatCommercePrice } from "../../lib/commerce";
import { createBuildUrl, removePcBuild } from "../../services/pcBuildService";

export default function AccountPcBuilds({ builds, onChanged }) {
  const remove = async (buildId) => {
    try {
      await removePcBuild(buildId);
      await onChanged();
    } catch (error) {
      console.error("Saved PC build delete failed:", error);
    }
  };
  return (
    <section className="luxury-panel rounded-[10px] p-5 sm:p-6">
      <div className="mb-5">
        <p className="luxury-eyebrow mb-2">PC CONFIGURATOR</p>
        <h2 className="luxury-heading text-lg">Cấu hình đã lưu</h2>
        <p className="mt-2 text-xs text-text-muted">
          Giá được chụp tại thời điểm lưu; khi mở lại, hệ thống dùng giá và tồn
          kho hiện tại.
        </p>
      </div>
      <div className="space-y-3">
        {builds.map((build) => (
          <article
            key={build.id}
            className="flex flex-col justify-between gap-4 rounded-lg border border-border-subtle bg-bg-main/55 p-4 sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/[0.07] text-primary">
                <Cpu size={19} />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-text-main">
                  {build.name}
                </h3>
                <p className="mt-1 text-xs text-text-muted">
                  {Object.keys(build.selected_product_ids || {}).length} linh
                  kiện · {formatCommercePrice(build.total_snapshot)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                to={createBuildUrl(build.selected_product_ids)}
                className="flex min-h-10 items-center rounded-md border border-primary/25 px-3 text-[10px] font-bold uppercase text-primary-hover"
              >
                Mở cấu hình
              </Link>
              <button
                type="button"
                onClick={() => remove(build.id)}
                className="grid h-10 w-10 place-items-center rounded-md border border-border-subtle text-text-muted hover:text-[#e7958d]"
                aria-label={`Xóa ${build.name}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </article>
        ))}
        {builds.length === 0 && (
          <div className="py-12 text-center">
            <Cpu size={30} className="mx-auto mb-3 text-primary" />
            <p className="text-sm text-text-muted">
              Bạn chưa lưu cấu hình PC nào.
            </p>
            <Link
              to="/build-pc"
              className="mt-4 inline-block text-xs font-semibold text-primary-hover"
            >
              Bắt đầu Build PC
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
