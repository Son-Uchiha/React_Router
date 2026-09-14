# Hướng Dẫn Cấu Hình và Sử Dụng React Router v7 (Data Mode)

Tài liệu này hướng dẫn chi tiết cách cấu hình và triển khai **React Router v7** cho ứng dụng **Client-Side Rendering (CSR)** với Vite và React 19 theo kiến trúc **Data Mode** (khuyến nghị chuẩn từ React Router).

---

## 📑 Mục Lục
1. [Cài đặt Thư Viện](#1-cài-đặt-thư-viện)
2. [Tổng Quan Kiến Trúc Data Mode](#2-tổng-quan-kiến-trúc-data-mode)
3. [Các Bước Cấu Hình Chuẩn](#3-các-bước-cấu-hình-chuẩn)
   - [Bước 1: Định nghĩa danh sách routes (`routes.tsx`)](#bước-1-định-nghĩa-danh-sách-routes-routestsx)
   - [Bước 2: Cung cấp Router cho ứng dụng (`App.tsx`)](#bước-2-cung-cấp-router-cho-ứng-dụng-appsx)
   - [Bước 3: Tạo Layout chung với `<Outlet />` (`Layout.tsx`)](#bước-3-tạo-layout-chung-với-outlet-layouttsx)
4. [Khai Thác Sức Mạnh Của Data Mode](#4-khai-thác-sức-mạnh-của-data-mode)
   - [Dùng `loader` thay cho `useEffect`](#41-data-loading-dùng-loader-thay-cho-useeffect)
   - [Trạng thái chuyển trang với `useNavigation`](#42-trạng-thái-chuyển-trang-với-usenavigation)
   - [Dynamic Routes & `useParams`](#43-dynamic-routes--useparams)
   - [Xử lý lỗi với `errorElement`](#44-xử-lý-lỗi-với-errorelement)
   - [Xử lý trang 404 Not Found](#45-xử-lý-trang-404-not-found)
5. [Các Thành Phần Điều Hướng Thường Dùng](#5-các-thành-phần-điều-hướng-thường-dùng)
6. [Bảng Tra Cứu Hooks Quan Trọng](#6-bảng-tra-cứu-hooks-quan-trọng)

---

## 1. Cài đặt Thư Viện

Từ phiên bản v7, package chính thức được gộp lại thành `react-router`:

```bash
npm install react-router
```

> **Lưu ý:** Không cần cài `react-router-dom` độc lập nữa trong React Router v7 vì các API DOM đều có sẵn trực tiếp trong `react-router`.

---

## 2. Tổng Quan Kiến Trúc Data Mode

Data Mode sử dụng cấu hình **Object-based router** (`createBrowserRouter`) kết hợp với `<RouterProvider>`.

### Lợi ích cốt lõi:
- **Tải dữ liệu song song (Parallel Fetching):** Fetch dữ liệu ngay khi URL thay đổi thông qua `loader` trước khi render component, loại bỏ hiện tượng giật lag màn hình (network waterfalls).
- **Quản lý nested layout tự nhiên:** Layout lồng nhau rõ ràng, component cha giữ nguyên và chỉ re-render `<Outlet />` bên trong.
- **Xử lý lỗi tập trung:** Bắt lỗi API hoặc crash component thông qua `errorElement` mà không làm chết toàn bộ ứng dụng.

---

## 3. Các Bước Cấu Hình Chuẩn

### Bước 1: Định nghĩa danh sách routes (`routes.tsx`)

Tạo file tập trung quản lý toàn bộ các đường dẫn trong ứng dụng:

```tsx
// src/routes.tsx
import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Users, { usersLoader } from "./pages/Users";
import UserDetail, { userDetailLoader } from "./pages/UserDetail";
import NotFound from "./pages/NotFound";
import ErrorPage from "./pages/ErrorPage";

const routes = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    ErrorBoundary: ErrorPage, // Bắt lỗi cấp toàn layout
    children: [
      {
        index: true, // Khớp chính xác route "/"
        Component: Home,
      },
      {
        path: "about",
        Component: About,
      },
      {
        path: "users",
        children: [
          {
            index: true, // Khớp "/users"
            Component: Users,
            loader: usersLoader, // Chạy trước khi render Users
          },
          {
            path: ":userId", // Khớp "/users/1", "/users/abc"
            Component: UserDetail,
            loader: userDetailLoader,
          },
        ],
      },
      {
        path: "*", // Bắt tất cả đường dẫn không tồn tại (404)
        Component: NotFound,
      },
    ],
  },
]);

export default routes;
```

---

### Bước 2: Cung cấp Router cho ứng dụng (`App.tsx`)

Truyền instance `routes` vào `<RouterProvider>`:

```tsx
// src/App.tsx
import { RouterProvider } from "react-router";
import routes from "./routes";

export default function App() {
  return <RouterProvider router={routes} />;
}
```

---

### Bước 3: Tạo Layout chung với `<Outlet />` (`Layout.tsx`)

Layout chứa Header/Navbar, Footer và vị trí `<Outlet />` để render component con tương ứng:

```tsx
// src/components/Layout.tsx
import { NavLink, Outlet, useNavigation } from "react-router";

export default function Layout() {
  const navigation = useNavigation();
  // Kiểm tra xem trang có đang tải dữ liệu (loader đang chạy) hay không
  const isLoading = navigation.state === "loading";

  return (
    <div>
      <nav style={{ display: "flex", gap: "16px", padding: "12px", background: "#f5f5f5" }}>
        <NavLink 
          to="/" 
          end 
          style={({ isActive }) => ({ fontWeight: isActive ? "bold" : "normal" })}
        >
          Home
        </NavLink>
        <NavLink 
          to="/about" 
          style={({ isActive }) => ({ fontWeight: isActive ? "bold" : "normal" })}
        >
          About
        </NavLink>
        <NavLink 
          to="/users" 
          style={({ isActive }) => ({ fontWeight: isActive ? "bold" : "normal" })}
        >
          Users
        </NavLink>
      </nav>

      {/* Hiển thị thanh tiến trình hoặc loading indicator khi loader đang chạy */}
      {isLoading && <div style={{ background: "#e0f2fe", padding: "8px" }}>⏳ Đang tải dữ liệu...</div>}

      <main style={{ padding: "24px" }}>
        {/* Nơi nội dung của route con được render */}
        <Outlet />
      </main>
    </div>
  );
}
```

---

## 4. Khai Thác Sức Mạnh Của Data Mode

### 4.1. Data Loading: Dùng `loader` thay cho `useEffect`

Thay vì `useEffect` + `useState` (gây ra tình trạng component render trước rồi màn hình trống hoặc xoay spinner), Data Mode dùng `loader`:

```tsx
// src/pages/Users.tsx
import { useLoaderData, Link } from "react-router";

export type User = {
  id: number;
  name: string;
  email: string;
};

// 1. Khai báo hàm loader (chạy tự động khi truy cập route)
export async function usersLoader(): Promise<User[]> {
  const res = await fetch("https://jsonplaceholder.typicode.com/users");
  if (!res.ok) {
    throw new Error("Không thể tải danh sách người dùng!");
  }
  return res.json();
}

// 2. Component tiêu thụ dữ liệu qua useLoaderData()
export default function Users() {
  const users = useLoaderData() as User[];

  return (
    <div>
      <h1>👥 Danh sách Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <Link to={`/users/${user.id}`}>
              <strong>{user.name}</strong>
            </Link> - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

### 4.2. Trạng thái chuyển trang với `useNavigation`

Khi người dùng nhấn vào route có `loader`, `navigation.state` sẽ chuyển từ `"idle"` sang `"loading"`.
Bạn có thể đọc trạng thái này ở bất kỳ đâu bên trong `RouterProvider`:

```tsx
import { useNavigation } from "react-router";

const navigation = useNavigation();

console.log(navigation.state); 
// "idle" | "loading" | "submitting"
```

---

### 4.3. Dynamic Routes & `useParams`

Để truyền param từ URL vào `loader`, tham số `params` được cung cấp sẵn:

```tsx
// src/pages/UserDetail.tsx
import { useLoaderData, Link, type LoaderFunctionArgs } from "react-router";
import type { User } from "./Users";

// Lấy params trực tiếp trong loader mà không cần hook
export async function userDetailLoader({ params }: LoaderFunctionArgs): Promise<User> {
  const { userId } = params;
  const res = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`);
  if (!res.ok) {
    throw new Response("Người dùng không tồn tại", { status: 404 });
  }
  return res.json();
}

export default function UserDetail() {
  const user = useLoaderData() as User;

  return (
    <div>
      <Link to="/users">← Quay lại danh sách</Link>
      <h1>👤 Chi tiết: {user.name}</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

---

### 4.4. Xử lý lỗi với `errorElement` hoặc `ErrorBoundary`

Khi `loader` ném ra ngoại lệ (`throw new Error(...)` hoặc `throw new Response(...)`), React Router sẽ tự động chuyển sang render `ErrorBoundary`:

```tsx
// src/pages/ErrorPage.tsx
import { useRouteError, isRouteErrorResponse, Link } from "react-router";

export default function ErrorPage() {
  const error = useRouteError();

  return (
    <div style={{ padding: "24px", color: "#b91c1c" }}>
      <h2>⚠️ Đã xảy ra lỗi!</h2>
      {isRouteErrorResponse(error) ? (
        <p>{error.status} - {error.statusText || error.data}</p>
      ) : (
        <p>{(error as Error)?.message || "Lỗi không xác định"}</p>
      )}
      <Link to="/">Quay về Trang chủ</Link>
    </div>
  );
}
```

---

### 4.5. Xử lý trang 404 Not Found

Dùng route có `path: "*"` đặt ở cuối danh sách route con:

```tsx
// src/pages/NotFound.tsx
import { Link } from "react-router";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <h1>404</h1>
      <p>Trang bạn đang tìm kiếm không tồn tại.</p>
      <Link to="/">← Quay lại Trang chủ</Link>
    </div>
  );
}
```

---

## 5. Các Thành Phần Điều Hướng Thường Dùng

| Component / Hook | Mục đích sử dụng | Ví dụ |
| :--- | :--- | :--- |
| `<Link to="...">` | Điều hướng client-side không reload lại trang | `<Link to="/users">Users</Link>` |
| `<NavLink to="...">` | Giống `Link` nhưng hỗ trợ class/style kích hoạt (`isActive`, `isPending`) | `<NavLink className={({isActive}) => isActive ? 'active' : ''}>` |
| `<Navigate to="..." replace />` | Chuyển hướng tự động bằng component (Redirect) | `<Navigate to="/login" replace />` |
| `useNavigate()` | Điều hướng bằng code Javascript (sau khi bấm nút, submit form,...) | `const navigate = useNavigate(); navigate('/dashboard');` |
| `useSearchParams()` | Đọc và ghi query parameters trên URL (`?key=value`) | `const [params, setParams] = useSearchParams();` |

---

## 6. Bảng Tra Cứu Hooks Quan Trọng

1. **`useLoaderData()`**: Lấy dữ liệu trả về từ hàm `loader` tương ứng với route hiện tại.
2. **`useParams()`**: Lấy object chứa các URL dynamic segments (ví dụ: `:userId` -> `params.userId`).
3. **`useNavigation()`**: Theo dõi trạng thái toàn cục của việc chuyển trang (`idle`, `loading`, `submitting`).
4. **`useNavigate()`**: Hàm chuyển trang theo lệnh (Imperative navigation).
5. **`useLocation()`**: Lấy thông tin URL hiện tại (`pathname`, `search`, `hash`, `state`).
6. **`useRouteError()`**: Bắt lỗi văng ra từ `loader`, `action`, hoặc quá trình render bên trong `ErrorBoundary`.
