import axios from "axios";
import { showAlert } from "./alert";

const stripe = Stripe(
  "pk_test_51MJHBsSHelWAwtP5VtSh8IK7BEJCksWhMBWTnVA5WnY8Tn8Pklm18j7A9Ysootc2FuPRYNGOaMrMqkpJAe2kA95p00vkzEEyzi"
);
export const bookTour = async (tourId) => {
  //Get checkout session from api
  try {
    const session = await axios(
      `http://localhost:8080/api/v1/bookings/checkout-session/${tourId}`
    );
    //create checkout forms and charge credit cards
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (er) {
    console.log(er);
    showAlert("error", er);
  }
};
