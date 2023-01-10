import { showAlert } from "./alert";
import axios from "axios";
export const updateSettings = async (data) => {
  try {
    const res = await axios({
      method: "PATCH",
      url: "http://localhost:8080/api/v1/users/updateMe",
      data
    });

    if (res.data.status === "success") {
      showAlert("success", "Data Updated Successfully");
    }
  } catch (er) {
    showAlert("error", er.response.data.message);
  }
};

export const changePassword = async (
  currentPassword,
  password,
  passwordConfirm
) => {
  try {
    const res = await axios({
      method: "PATCH",
      url: "http://localhost:8080/api/v1/users/updatePassword",
      data: {
        currentPassword,
        password,
        passwordConfirm
      },
    });

    if (res.data.status === "success") {
      showAlert("success", "Password Updated Successfully");
    }
  } catch (er) {
    showAlert("error", er.response.data.message);
  }
};
