# Hướng Dẫn Cấu Hình và Sử Dụng React Router v7 (Client-Side CSR Không Dùng Loader)

Tài liệu này hướng dẫn chi tiết cách cấu hình và triển khai **React Router v7** cho ứng dụng **Client-Side Rendering (CSR)** với Vite và React 19 dựa trên cấu trúc thực tế của dự án hiện tại: **sử dụng cấu hình Object-based Router (`createBrowserRouter`), Layout lồng nhau (`<Outlet />`), và quản lý/fetch dữ liệu trực tiếp trong component bằng React Hooks (`useState`, `useEffect`, `useParams`) thay vì dùng `loader`**.

---

## 📑 Mục Lục
1. [Cài đặt Thư Viện](#1-cài-đặt-thư-viện)
2. [Kiến Trúc Router của Dự Án](#2-kiến-trúc-router-của-dự-án)
3. [Cấu Hình và Tổ Chức Mã Nguồn](#3-cấu-hình-và-tổ-chức-mã-nguồn)
   - [Bước 1: Định nghĩa danh sách routes (`src/routes.tsx`)](#bước-1-định-nghĩa-danh-sách-routes-srcroutestsx)
   - [Bước 2: Cung cấp Router cho ứng dụng (`src/App.tsx`)](#bước-2-cung-cấp-router-cho-ứng-dụng-srcappsx)
   - [Bước 3: Xây dựng Layout chung với `<Outlet />` (`src/components/Layout.tsx`)](#bước-3-xây-dựng-layout-chung-với-outlet-srccomponentslayouttsx)
4. [Fetch Dữ Liệu Trong Component (Không Dùng `loader`)](#4-fetch-dữ-liệu-trong-component-không-dùng-loader)
   - [Trang danh sách: `useEffect` + `useState` (`src/pages/Users.tsx`)](#41-trang-danh-sách-useeffect--usestate-srcpagesuserstsx)
   - [Dynamic Route & Đọc URL Params với `useParams` (`src/pages/UserDetail.tsx`)](#42-dynamic-route--đọc-url-params-với-useparams-srcpagesuserdetailtsx)
   - [Các trang tĩnh (`Home.tsx`, `About.tsx`)](#43-các-trang-tĩnh-hometsx-abouttsx)
5. [So Sánh: Fetch trong Component vs Dùng `loader`](#5-so-sánh-fetch-trong-component-vs-dùng-loader)
6. [Các Thành Phần Điều Hướng & Hooks Thường Dùng](#6-các-thành-phần-điều-hướng--hooks-thường-dùng)

---

## 1. Cài đặt Thư Viện

Từ phiên bản React Router v7, toàn bộ tính năng routing cho web được gộp gọn trong package `react-router`:

```bash
npm install react-router
```

> [!NOTE]
> Trong React Router v7, bạn không cần cài thêm `react-router-dom` độc lập nữa. Các API như `createBrowserRouter`, `RouterProvider`, `Link`, `NavLink`, `Outlet`, `useParams`, `useNavigate` đều được export trực tiếp từ `react-router`.

---

## 2. Kiến Trúc Router của Dự Án

Dự án này sử dụng mô hình **Object-based Router** nhưng **không sử dụng `loader`**:

- **Cấu hình tuyến đường dạng mảng Object (`createBrowserRouter`)**: Quản lý tập trung toàn bộ cấu trúc URL của ứng dụng, hỗ trợ route cha/con (`children`), định tuyến lồng nhau (nested routes) và route động (`:userId`).
- **Sử dụng thuộc tính `Component`**: Khai báo component dạng tham chiếu (`Component: Layout`, `Component: Home`) theo chuẩn mới của React Router v7 thay vì `element: <Layout />`.
- **Fetch dữ liệu độc lập tại Component (`useEffect` + `useState`)**: Mỗi component tự quản lý trạng thái tải (loading), dữ liệu (data), và lỗi (error) bằng React Hooks truyền thống.
- **Trải nghiệm người dùng tức thì (Instant Navigation)**: Khi người dùng bấm chuyển trang, router mount ngay lập tức layout/page mới mà không bị chặn chờ mạng phản hồi như khi dùng route `loader`.

---

## 3. Cấu Hình và Tổ Chức Mã Nguồn

### Bước 1: Định nghĩa danh sách routes (`src/routes.tsx`)

File `routes.tsx` là nơi khai báo toàn bộ cây điều hướng của ứng dụng:

```tsx
// src/routes.tsx
import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Users from "./pages/Users";
import UserDetail from "./pages/UserDetail";

const routes = createBrowserRouter([
  {
    path: "/",
    Component: Layout, // Layout bọc ngoài cùng cho toàn bộ ứng dụng
    children: [
      {
        index: true, // Khớp chính xác với đường dẫn gốc "/"
        Component: Home,
      },
      {
        path: "about", // Khớp "/about"
        Component: About,
      },
      {
        path: "users", // Nhóm các route liên quan đến users
        children: [
          {
            index: true, // Khớp "/users" - hiển thị danh sách
            Component: Users,
          },
          {
            path: ":userId", // Khớp route động: "/users/1", "/users/2",...
            Component: UserDetail,
            // Không dùng loader ở đây, component sẽ tự lấy userId qua useParams()
          },
        ],
      },
    ],
  },
]);

export default routes;
```

#### Điểm mấu chốt:
1. **`Component` thay vì `element`**: Bạn truyền trực tiếp định danh Component (`Component: Home`) thay vì truyền JSX element (`element: <Home />`).
2. **`index: true`**: Đại diện cho route mặc định khi truy cập vào đường dẫn của route cha.
3. **`children`**: Tạo các tuyến đường con lồng nhau. Component của route cha (`Layout`) sẽ hiển thị component con thông qua `<Outlet />`.
4. **Không khai báo `loader`**: Route chỉ làm nhiệm vụ điều hướng thuần túy.

---

### Bước 2: Cung cấp Router cho ứng dụng (`src/App.tsx`)

Truyền instance `routes` đã tạo vào component `<RouterProvider>`:

```tsx
// src/App.tsx
import { RouterProvider } from "react-router";
import routes from "./routes";

function App() {
  return (
    <>
      <RouterProvider router={routes} />
    </>
  );
}

export default App;
```

`<RouterProvider>` sẽ quản lý context điều hướng cho toàn bộ cây component con.

---

### Bước 3: Xây dựng Layout chung với `<Outlet />` (`src/components/Layout.tsx`)

`Layout` đóng vai trò khung giao diện dùng chung (thanh điều hướng menu, header, footer) cho tất cả các trang:

```tsx
// src/components/Layout.tsx
import {
  NavLink,
  Outlet,
  useNavigation,
} from "react-router";

export default function Layout() {
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);

  return (
    <div>
      <nav
        style={{
          display: "flex",
          gap: "16px",
          padding: "12px",
          background: "#f0f0f0",
        }}
      >
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/about" end>
          About
        </NavLink>
        <NavLink to="/users" end>
          Users
        </NavLink>
      </nav>

      <main style={{ padding: "24px" }}>
        {isNavigating ? (
          <p>Đang chuyển trang...</p>
        ) : (
          <Outlet /> // Nơi nội dung của trang con (Home, About, Users, UserDetail) hiển thị
        )}
      </main>
    </div>
  );
}
```

#### Các thành phần chính trong Layout:
- **`<NavLink to="..." end>`**: Giúp tạo liên kết điều hướng. Khi URL hiện tại trùng khớp, React Router tự động áp dụng class `.active` (hoặc bạn có thể tự style dựa theo hàm callback `({ isActive }) => ...`).
- **`<Outlet />`**: Vị trí đặt "giữ chỗ" để React Router render component con tương ứng với URL hiện tại.
- **`useNavigation()`**: Theo dõi trạng thái điều hướng khi chuyển trang.

---

## 4. Fetch Dữ Liệu Trong Component (Không Dùng `loader`)

Thay vì dùng `loader` tại tầng khai báo route, dự án này fetch dữ liệu bằng các React Hook tiêu chuẩn (`useState` và `useEffect`). Cách tiếp cận này cực kỳ quen thuộc, dễ kiểm soát và không yêu cầu cơ chế xử lý phức tạp của Data Router.

### 4.1. Trang danh sách: `useEffect` + `useState` (`src/pages/Users.tsx`)

Component tự gọi API khi được mount vào DOM và lưu dữ liệu vào local state:

```tsx
// src/pages/Users.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router";

export type User = {
  id: number;
  name: string;
  username: string;
  website: string;
  phone: string;
  email: string;
  company: {
    name: string;
  };
  address: {
    city: string;
  };
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Fetch dữ liệu khi component được mount
    fetch("https://jsonplaceholder.typicode.com/users")
      .then((res) => res.json())
      .then((res) => {
        setUsers(res);
      });
  }, []);

  return (
    <div>
      <h1>👥 Danh sách Users</h1>
      <p>
        Data được fetch bằng <strong>useEffect & useState</strong> trong component.
      </p>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {/* Sử dụng Link để chuyển tới trang chi tiết user */}
            <Link to={`/users/${user.id}`}>
              <strong>{user.name}</strong>
            </Link>
            <span
              style={{
                marginLeft: "12px",
                color: "#666",
              }}
            >
              {user.email}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

### 4.2. Dynamic Route & Đọc URL Params với `useParams` (`src/pages/UserDetail.tsx`)

Khi route được định nghĩa với param `:userId` trong `routes.tsx`, component `UserDetail` sử dụng hook `useParams()` để lấy giá trị `userId` từ URL, sau đó truyền vào `useEffect` để fetch thông tin chi tiết:

```tsx
// src/pages/UserDetail.tsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import type { User } from "./Users";

export default function UserDetail() {
  // 1. Lấy tham số userId từ dynamic route "/users/:userId"
  const { userId } = useParams();
  const [user, setUser] = useState<User | null>(null);

  // 2. Fetch lại dữ liệu mỗi khi userId thay đổi
  useEffect(() => {
    fetch(`https://jsonplaceholder.typicode.com/users/${userId}`)
      .then((res) => res.json())
      .then((res) => {
        setUser(res);
      });
  }, [userId]);

  return (
    <div>
      <Link to="/users">← Quay lại danh sách</Link>
      <h1>👤 Chi tiết User #{userId}</h1>
      {user && (
        <div>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Phone:</strong> {user.phone}</p>
          <p><strong>Website:</strong> {user.website}</p>
          <p><strong>Company:</strong> {user.company.name}</p>
          <p><strong>City:</strong> {user.address.city}</p>
        </div>
      )}
    </div>
  );
}
```

---

### 4.3. Các trang tĩnh (`Home.tsx`, `About.tsx`)

Với các trang tĩnh không cần gọi API, component chỉ đơn giản render JSX:

```tsx
// src/pages/Home.tsx
export default function Home() {
  return (
    <div>
      <h1>🏠 Trang chủ</h1>
      <p>Chào mừng đến với ứng dụng React Router!</p>
    </div>
  );
}
```

```tsx
// src/pages/About.tsx
export default function About() {
  return (
    <div>
      <h1>📖 Giới thiệu</h1>
      <p>Đây là trang About. Không có loader, chỉ render thuần.</p>
    </div>
  );
}
```

---

## 5. So Sánh: Fetch trong Component vs Dùng `loader`

| Đặc điểm | Fetch trong Component (`useEffect` + `useState`) *(Dự án này)* | Dùng Data Router `loader` |
| :--- | :--- | :--- |
| **Vị trí lấy data** | Bên trong component (`useEffect`) | Tách biệt ngoài route config (`loader: ...`) |
| **Tốc độ chuyển trang** | Chuyển trang **tức thì**, sau đó hiển thị skeleton/loading indicator trong trang con | Bị dừng ở trang cũ cho tới khi API fetch xong mới render trang mới |
| **Độ phức tạp** | Rất thấp, chuẩn tư duy React cơ bản | Cao hơn (cần hiểu cơ chế Data Router, `useLoaderData`, `ErrorBoundary`) |
| **Quản lý State** | Tự chủ hoàn toàn trong component bằng `useState` | Nhận qua hook `useLoaderData()` |
| **Khả năng tích hợp thư viện** | Tương thích hoàn hảo với React Query (`@tanstack/react-query`), SWR, RTK Query | Thường phải kết hợp qua `queryClient.ensureQueryData` |

> [!TIP]
> **Tại sao dự án chọn cách này?**
> Với các ứng dụng SPA (CSR) thông thường, việc sử dụng `createBrowserRouter` để định tuyến lồng nhau và quản lý fetch data trực tiếp trong component giúp code minh bạch, phân tách rõ trách nhiệm điều hướng và xử lý logic giao diện, đồng thời tạo tiền đề thuận lợi nếu bạn muốn tích hợp thư viện quản lý server-state mạnh mẽ như React Query sau này.

---

## 6. Các Thành Phần Điều Hướng & Hooks Thường Dùng

### Component điều hướng:
- **`<Link to="...">`**: Điều hướng client-side không làm tải lại trang.
- **`<NavLink to="..." end>`**: Tương tự `<Link>` nhưng tự động bổ sung trạng thái active để làm nổi bật menu đang chọn.
- **`<Outlet />`**: Điểm neo để hiển thị nội dung route con bên trong layout cha.

### Hooks phổ biến:
- **`useParams()`**: Trích xuất các tham số động từ URL (ví dụ: `:userId` trong `/users/:userId`).
- **`useNavigate()`**: Điều hướng chủ động bằng mã JavaScript (thường dùng sau khi submit form hoặc bấm nút):
  ```tsx
  import { useNavigate } from "react-router";

  const navigate = useNavigate();
  // Chuyển trang:
  navigate("/users");
  // Quay lại trang trước:
  navigate(-1);
  ```
- **`useLocation()`**: Đọc thông tin chi tiết về URL hiện tại (`pathname`, `search`, `hash`, `state`).
- **`useSearchParams()`**: Đọc và chỉnh sửa query parameters trên URL (`?keyword=abc&page=1`):
  ```tsx
  import { useSearchParams } from "react-router";

  const [searchParams, setSearchParams] = useSearchParams();
  const page = searchParams.get("page");
  ```
- **`useNavigation()`**: Kiểm tra trạng thái điều hướng toàn cục của router.
