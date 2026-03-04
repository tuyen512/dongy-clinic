import Link from "next/link";
import { LogoMark } from "@/components/ui/logo-mark";

interface AuthCardProps {
  mode: "login" | "register";
}

export function AuthCard({ mode }: AuthCardProps) {
  const isLogin = mode === "login";

  return (
    <section className="panel mx-auto w-full max-w-[460px] p-6 md:p-7">
      <div className="mb-6 flex flex-col items-center text-center">
        <LogoMark />
        <h1 className="mt-4 text-4xl font-bold text-white">MediCore</h1>
        <p className="mt-2 text-slate-400">Hệ thống quản lý phòng khám chuyên nghiệp</p>
      </div>

      <div className="mb-6 grid grid-cols-2 rounded-lg bg-[#1a2f53] p-1 text-center text-sm">
        <Link href="/login" className={`rounded-md py-2 ${isLogin ? "bg-[#0a1e3f] text-white" : "text-slate-400"}`}>
          Đăng nhập
        </Link>
        <Link href="/register" className={`rounded-md py-2 ${!isLogin ? "bg-[#0a1e3f] text-white" : "text-slate-400"}`}>
          Đăng ký
        </Link>
      </div>

      <form className="space-y-4" action={isLogin ? "/api/auth/sign-in" : "/api/auth/register"} method="post">
        {!isLogin ? (
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Tên phòng khám</span>
            <input className="input-dark" name="clinicName" placeholder="Phòng khám Đông y An Khang" required />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Email đăng nhập</span>
          <input className="input-dark" name="email" type="email" placeholder="owner@clinic.vn" required />
        </label>

        {!isLogin ? (
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Họ và tên</span>
            <input className="input-dark" name="fullName" placeholder="Nguyễn Văn A" required />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Mật khẩu</span>
          <input className="input-dark" name="password" type="password" placeholder="••••••••" required minLength={8} />
        </label>

        {!isLogin ? (
          <>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Số điện thoại</span>
              <input className="input-dark" name="phone" placeholder="090xxxxxxx" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Ghi chú tay</span>
              <textarea className="input-dark min-h-[88px]" name="notes" placeholder="Ghi chú vận hành nội bộ..." />
            </label>
          </>
        ) : null}

        <button className="btn-primary w-full text-lg" type="submit">
          {isLogin ? "Đăng nhập hệ thống" : "Đăng ký phòng khám"}
        </button>
      </form>
    </section>
  );
}
