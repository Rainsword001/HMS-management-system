import PaymentService from "../services/paystack.service.js";

const paymentInstance = new PaymentService();


export const startPayment = async(req, res) =>{
    try {
        const response = await paymentInstance.startPayment(req.body);
        res.status(201).json({
            status: "Success",
            data: response
        })
    } catch (error) {
         res.status(500).json({
            status: "|Failed",
            message: error.message
        })
    }
}

export const createPayment = async (req, res) =>{
    try {
        const response = await paymentInstance.createPayment(req.body);
         res.status(201).json({
            status: "Success",
            data: response
        })
    } catch (error) {
        res.status(500).json({
            status: "Failed",
            message: error.message
        })
    }
}


export const getPayment = async (req, res) =>{
    try {
        const response = await paymentInstance.getPayment(req.body);
        res.status(200).json({
            status: "Success",
            data: response
        })
    } catch (error) {
        res.status(500).json({
            status: "Failed",
            message: error.message
        })
    }

} 

export const paystackWebhook = async (req, res) =>{
    const signature = req.headers ["x-paystack-signature"];

    //verify signature
    const isValid = verifyWebhookSignature(req.rawBody, signature);

    if(!isValid) {
        return res.status(401).json({
            message: "Invalid webhook signature"
        })
    }


    const data = req.body;
    if(data.event === "charge.success") {
        console.log("Payment successful", data.data.reference)
    }


    return res.status(200).send('OK')
}
