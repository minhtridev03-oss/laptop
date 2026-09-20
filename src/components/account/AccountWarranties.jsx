import { useState } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";

export default function AccountWarranties({ warranties, refresh }) {
  const [selectedWarranty, setSelectedWarranty] = useState(null);

  if (!warranties || warranties.length === 0) {
    return (
      <div className="luxury-panel rounded-[10px] p-8 text-center">
        <ShieldCheck size={38} className="mx-auto mb-4 text-primary/40" />
        <p className="font-['Be_Vietnam_Pro'] font-medium text-text-main">
          Chưa có sản phẩm nào được bảo hành
        </p>
        <p className="mt-2 text-sm text-text-muted">
          Khi bạn nhận được hàng, sổ bảo hành điện tử sẽ được kích hoạt tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="luxury-heading text-lg border-b border-border-subtle pb-3">Sổ Bảo Hành Điện Tử</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {warranties.map((warranty) => {
          const isActive = warranty.status === "active";
          const isExpired = warranty.status === "expired";
          const end = new Date(warranty.end_date);
          
          return (
            <article
              key={warranty.id}
              className={`luxury-panel relative overflow-hidden rounded-[10px] border p-5 ${
                isActive ? "border-primary/30" : "border-border-subtle/50 opacity-80"
              }`}
            >
              {isActive && (
                <div className="absolute right-0 top-0 rounded-bl-lg bg-primary/[0.15] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Còn hạn
                </div>
              )}
              {isExpired && (
                <div className="absolute right-0 top-0 rounded-bl-lg bg-bg-card px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Hết hạn
                </div>
              )}
              
              <div className="flex gap-4">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${isActive ? 'bg-primary/[0.08] text-primary' : 'bg-bg-card text-text-muted'}`}>
                  {isActive ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
                </span>
                <div>
                  <h3 className="font-['Be_Vietnam_Pro'] text-sm font-semibold text-text-main">
                    Sản phẩm ID: {warranty.product_id?.split('-')[0]}
                  </h3>
                  <p className="mt-1 font-['JetBrains_Mono'] text-[11px] text-text-muted">
                    S/N: {warranty.serial_number || "Chưa cập nhật"}
                  </p>
                  <p className="mt-2 text-[11px] text-text-muted">
                    Hết hạn: <strong className="text-text-main">{end.toLocaleDateString("vi-VN")}</strong>
                  </p>
                </div>
              </div>

              {isActive && (
                <button
                  type="button"
                  onClick={() => setSelectedWarranty(warranty)}
                  className="mt-5 w-full rounded-md border border-primary/20 bg-primary/[0.05] py-2.5 text-xs font-bold text-primary-hover transition-colors hover:bg-primary/[0.1]"
                >
                  Yêu cầu bảo hành / Báo lỗi
                </button>
              )}

              {/* Danh sách Claims */}
              {warranty.warranty_claims && warranty.warranty_claims.length > 0 && (
                <div className="mt-4 border-t border-border-subtle pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted mb-2">Lịch sử Yêu cầu</p>
                  <ul className="space-y-2">
                    {warranty.warranty_claims.map((claim) => (
                      <li key={claim.id} className="flex items-center justify-between rounded bg-bg-main/50 px-3 py-2 text-xs">
                        <span className="truncate pr-4 text-text-main">{claim.issue_description}</span>
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          claim.status === 'completed' ? 'bg-[#9ed1ad]/20 text-[#9ed1ad]' :
                          claim.status === 'pending' ? 'bg-[#d1b39e]/20 text-[#d1b39e]' :
                          'bg-primary/20 text-primary-hover'
                        }`}>
                          {claim.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {selectedWarranty && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/80 px-4 py-8 backdrop-blur-sm">
          <div className="luxury-panel w-full max-w-lg rounded-xl p-6 shadow-2xl">
            <h3 className="luxury-heading mb-2 text-xl">Yêu cầu Bảo hành</h3>
            <p className="mb-6 text-sm text-text-muted">
              Vui lòng mô tả chi tiết lỗi của sản phẩm. Chúng tôi sẽ liên hệ lại qua số điện thoại để hỗ trợ.
            </p>
            <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                alert("Đã gửi yêu cầu thành công! (Demo)");
                setSelectedWarranty(null);
            }}>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted">
                  Tình trạng / Lỗi gặp phải
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full rounded-md border border-border-subtle bg-bg-main p-3 text-sm text-text-main outline-none focus:border-primary/50"
                  placeholder="Ví dụ: Máy hay bị sập nguồn khi chạy nặng..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedWarranty(null)}
                  className="flex-1 rounded-md border border-border-subtle py-2.5 text-xs font-bold uppercase text-text-muted hover:text-text-main"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="luxury-primary-button flex-1 rounded-md py-2.5 text-xs font-bold uppercase"
                >
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
