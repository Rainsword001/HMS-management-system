import mongoose from "mongoose";

const radiologyScanSchema = new mongoose.Schema({
  scanNumber: { type: String, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  admission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' },
  scanType: { 
    type: String, 
    enum: ['xray', 'ct', 'mri', 'ultrasound', 'mammography', 'fluoroscopy', 'other'],
    required: true 
  },
  bodyPart: { type: String, required: true },
  priority: { type: String, enum: ['routine', 'urgent', 'stat'], default: 'routine' },
  clinicalIndication: { type: String, required: true },
  contrastUsed: { type: Boolean, default: false },
  contrastType: { type: String },
  findings: { type: String },
  impression: { type: String },
  recommendations: { type: String },
  images: [{ 
    filename: String, 
    path: String,
    description: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  status: { 
    type: String, 
    enum: ['ordered', 'scheduled', 'in_progress', 'completed', 'reported', 'cancelled'],
    default: 'ordered'
  },
  scheduledAt: { type: Date },
  performedAt: { type: Date },
  reportedAt: { type: Date },
  notes: { type: String },
  cost: { type: Number }
}, { timestamps: true });

radiologyScanSchema.pre('save', function(next) {
  if (!this.scanNumber) {
    this.scanNumber = `RAD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  next();
});

const RadiologyScan = mongoose.model('RadiologyScan', radiologyScanSchema);


export default RadiologyScan;