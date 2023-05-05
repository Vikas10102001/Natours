import axios from "axios";
import { showAlert } from "./alert";
export const signup = async ({
  email,
  password,
  name,
  role,
  passwordConfirm,
}) => {
  // console.log(email, password);
  try {
    const result = await axios({
      method: "POST",
      url: "/api/v1/users/signup",
      data: {
        email,
        name,
        passwordConfirm,
        role,
        password,
      },
    });
    if (result.data.status === "success") {
      showAlert("success", "Signup sucessfull");
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (er) {
    showAlert("error", er.response.data.message);
  }
};
