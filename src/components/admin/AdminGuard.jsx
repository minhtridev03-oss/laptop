import { Link } from "react-router-dom";
import { Database, LoaderCircle, LockKeyhole, ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function AccessPanel({ icon: Icon, title, children }) {
  return (
    <section className="luxury-page-section mx-auto grid min-h-[65vh] w-full max-w-[760px] place-items-center px-4 py-14">
      <div className="luxury-panel w-full rounded-[12px] p-7 text-center sm:p-10">
        <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-xl border border-primary/25 bg-primary/[0.07] text-primary-hover">
          <Icon size={25} aria-hidden="true" />
        </span>
        <h1 className="luxury-heading text-2xl">{title}</h1>
        <div className="mx-auto mt-3 max-w-xl text-sm leading-6 text-text-muted">
          {children}
        </div>
      </div>
    </section>
  );
}

export default function AdminGuard({ children }) {
  const { isStaff, loading, staffError, staffLoading, user } = useAuth();

  if (loading || staffLoading) {
    return (
      <AccessPanel icon={LoaderCircle} title="Đang xác minh quyền truy cập">
        <p>Hệ thống đang kiểm tra tài khoản nhân viên.</p>
      </AccessPanel>
    );
  }

  if (!user) {
    return (
      <AccessPanel icon={LockKeyhole} title="Cần đăng nhập">
        <p>
          Đăng nhập bằng tài khoản đã được cấp quyền quản trị, sau đó mở lại
          trang này.
        </p>
        <Link
          to="/"
          className="luxury-primary-button mt-6 inline-flex min-h-11 items-center rounded-md px-5 text-xs font-bold uppercase tracking-[0.08em]"
        >
          Về trang chủ
        </Link>
      </AccessPanel>
    );
  }

  if (staffError) {
    return (
      <AccessPanel icon={Database} title="Chưa thể xác minh dữ liệu quản trị">
        <p>
          Hãy chạy migration quản trị mới trong Supabase, sau đó cấp quyền cho
          tài khoản nhân viên.
        </p>
      </AccessPanel>
    );
  }

  if (!isStaff) {
    return (
      <AccessPanel icon={ShieldAlert} title="Tài khoản chưa được cấp quyền">
        <p>
          Tài khoản hiện tại đã đăng nhập nhưng không thuộc nhóm quản trị hoặc
          nhân viên đang hoạt động.
        </p>
      </AccessPanel>
    );
  }

  return children;
}
