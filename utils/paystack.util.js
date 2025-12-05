import axios from "axios";

const paystack = (request) => {
  const MySecretKey = process.env.PAYSTACK_SECRET_KEY;

  //initialize payment
  const initializePayment = async (form, mycallback) => {
    try {
    } catch (error) {}
    const response = await axios.post(
      `${process.env.PAYSTACK_BASE_URL}/transaction/initialize`,
      form,
      {
        headers: {
          authorization: `Bearer ${MySecretKey}`,
          "Content-type": "application/json",
          "cache-control": "no-cache",
        },
      }
    );
    return mycallback(
      !response.data.status ? "Error Occures" : null,
      response.data
    );
  };

  //verify payment
  const verifyPayment = (ref, mycallback) => {
    const options = {
      url:
        "https://api.paystack.co/transaction/verify/" +
        encodedURIComponent(ref),
      hearders: {
        autorization: MySecretKey,
        "Content-type": "application/json",
        "cache-control": "no-cache",
      },
    };
    const callback = (error, response, body) => {
      return mycallback(error, body);
    };
    request(options, callback);
  };

  return { initializePayment, verifyPayment };
};

export default paystack;
