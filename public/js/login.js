import axios from "axios";
import { showAlert } from "./alert";
export const login = async (email, password) => {
  // console.log(email, password);
  try {
    const result = await axios({
      method: "POST",
      url: "/api/v1/users/login",
      data: {
        email,
        password,
      },
    });
    if (result.data.status === "success") {
      showAlert("success", "logged in suucessfully");
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (er) {
    showAlert("error", er.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: "/api/v1/users/logout",
    });
    if (res.data.status === "success") {
      location.assign("/login"); //true for reloading it from server side and not using browser cache
    }
  } catch (er) {
    console.log(er);
    showAlert("error", "Error in logging you out");
  }
};
