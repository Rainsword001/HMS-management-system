import mongoose from 'mongoose';

const testResultSchema = new mongoose.Schema({
  testName: { type: String, required: true },
  result: { type: String, required: true },
  unit: { type: String },
  referenceRange: { type: String },
  flag: { type: String, enum: ['normal', 'low', 'high', 'critical'] }
});

const labResultSchema = new mongoose.Schema({
  labNumber: { type: String, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  admission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' },
  testCategory: { 
    type: String, 
    enum: ['hematology', 'biochemistry', 'microbiology', 'urinalysis', 'serology', 'histopathology', 'other'],
    required: true 
  },
  testType: { type: String, required: true },
  priority: { type: String, enum: ['routine', 'urgent', 'stat'], default: 'routine' },
  clinicalHistory: { type: String },
  specimenType: { type: String },
  specimenCollectedAt: { type: Date },
  results: [testResultSchema],
  interpretation: { type: String },
  attachments: [{ 
    filename: String, 
    path: String, 
    uploadedAt: { type: Date, default: Date.now }
  }],
  status: { 
    type: String, 
    enum: ['ordered', 'collected', 'processing', 'completed', 'verified', 'cancelled'],
    default: 'ordered'
  },
  completedAt: { type: Date },
  verifiedAt: { type: Date },
  notes: { type: String },
  cost: { type: Number }
}, { timestamps: true });

labResultSchema.pre('save', function(next) {
  if (!this.labNumber) {
    this.labNumber = `LAB-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  next();
});

const LabResult = mongoose.model('LabResult', labResultSchema);

export default LabResult;
