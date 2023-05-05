import { login, logout } from "./login";
import { signup } from "./signup";
import { updateSettings, changePassword } from "./updateSettings";
import { bookTour } from "./stripe";
//DOM ELEMENTS
const formLogin = document.querySelector(".form--login");
const formSignup = document.querySelector(".form--signup");
const logoutBtn = document.querySelector(".nav__el--logout");
const updateSettingForm = document.querySelector(".form-user-data");
const passwordUpdateForm = document.querySelector(".form-user-settings");
const bookingTourBtn = document.querySelector("#book");
//DELEGATION
if (formLogin) {
  formLogin.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password);
  });
}
if (formSignup) {
  formSignup.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const name = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("confirm__password").value;
    const role = "user";
    signup({ email, name, password, passwordConfirm, role });
  });
}
if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}

if (updateSettingForm) {
  updateSettingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append("email", document.getElementById("email").value);
    form.append("name", document.getElementById("name").value);
    if (document.getElementById("photo").files[0]) {
      // console.log(document.getElementById("photo").files[0]);
      form.append("photo", document.getElementById("photo").files[0]);
    }
    updateSettings(form);
  });
}

if (passwordUpdateForm) {
  passwordUpdateForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.querySelector(".save-password-btn").textContent = "Updating";
    const currentPassword = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;
    await changePassword(currentPassword, password, passwordConfirm);
    document.querySelector(".save-password-btn").textContent = "Save Password";
    document.getElementById("password-current").value = "";
    document.getElementById("password").value = "";
    document.getElementById("password-confirm").value = "";
  });
}

if (bookingTourBtn) {
  bookingTourBtn.addEventListener("click", (e) => {
    e.target.textContent = "Processing...";
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}
