

const paystack = (request) =>{
    const MySecretKey = process.env.PAYSTACK_SECRET_KEY

    //initialize payment
    const initializePayment = (form, mycallback) =>{
        const options = {
            url: 'https://api.paystack.co/transaction/initialize',
            headers: {
                authorization: MySecretKey,
                'Content-type': 'application/json',
                'cache-control' : 'no-cache'
            },
            form
        }

        const callback = (error, response, body) =>{
            return mycallback(error, body)
        }
    }


    //verify payment
    const verifyPayment = (ref, mycallback)=>{
        const options = {
            url: 'https://api.paystack.co/transaction/verify/'+encodedURIComponent(ref),
            hearders:{
               autorization: MySecretKey,
               'Content-type': 'application/json',
                'cache-control' : 'no-cache'
            }
        }
        const callback = (error, response, body) =>{
            return mycallback(error, body)
        }
        request(options, callback)
    }

    return {initializePayment, verifyPayment}


}


export default paystack