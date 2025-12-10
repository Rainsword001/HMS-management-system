import mongoose from 'mongoose';



export const walletSchema = new mongoose.Schema({
    patientId:{
        type: mongoose.Schema.Types.ObjectId, ref: 'Patient',
        required: true,
        unique: true,
        index:true
    },
    balance:{
        type: Number,
        default: 0,
        min: 0
    },
    currency: {type: String, default: 'NGN'}
}, {timestamps: true})


const Wallet = mongoose.model('Wallet', walletSchema);


export default Wallet;