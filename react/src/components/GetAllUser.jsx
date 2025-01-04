import axios from "axios";
import { useEffect, useState } from "react";

const GetAllUser = () => {
  const [users, setAllUser] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    axios
      .get("http://localhost:8000/api/all")
      .then((response) => setAllUser(response.data))
      .catch((err) => {
        console.error(err);
      });
  };

  const deleteUser = (id) => {
    axios
      .delete(`http://localhost:8000/api/user/${id}`)
      .then(() => {
        fetchUsers(); // Refresh the list after deletion
      })
      .catch((err) => {
        console.error(err);
      });
  };

  return (
    <>
      <h1>All Users</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            <h3>ID: {user.id} </h3>
            name: {user.name} <br />
            email: {user.email} <br />
            password: {user.password} <br />
            secret: {user.secret} <br />
            <button onClick={() => deleteUser(user.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </>
  );
};

export default GetAllUser;