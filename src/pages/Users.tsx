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
    fetch(
      "https://jsonplaceholder.typicode.com/users",
    )
      .then((res) => res.json())
      .then((res) => {
        setUsers(res);
      });
  }, []);
  return (
    <div>
      <h1>👥 Danh sách Users</h1>
      <p>
        Data được fetch bằng{" "}
        <strong>useEffect & useState</strong> trong component.
      </p>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
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
