// Modelos de base de datos para BaruLogix
import mongoose from 'mongoose';

// Esquema de Usuario con permisos completos de administrador
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  company: { type: String },
  phone: { type: String },
  subscription: {
    plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    status: { type: String, enum: ['active', 'inactive', 'trial'], default: 'trial' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    features: {
      unlimitedDeliveries: { type: Boolean, default: false },
      unlimitedConductors: { type: Boolean, default: false },
      advancedReports: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      customBranding: { type: Boolean, default: false }
    }
  },
  permissions: {
    canViewAll: { type: Boolean, default: false },
    canEditAll: { type: Boolean, default: false },
    canDeleteAll: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canManageSettings: { type: Boolean, default: false },
    canAccessReports: { type: Boolean, default: true },
    canManagePayments: { type: Boolean, default: false }
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  },
  subscriptionExpiry: {
    type: Date,
    default: null
  },
  company: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Esquema de Entrega
const deliverySchema = new mongoose.Schema({
  tracking: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  conductor: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  type: {
    type: String,
    enum: ['Shein/Temu', 'Dropi'],
    required: true
  },
  status: {
    type: Number,
    enum: [0, 1, 2], // 0=no entregado, 1=entregado, 2=devuelto
    default: 0,
    index: true
  },
  deliveryDate: {
    type: Date,
    required: true,
    index: true
  },
  value: {
    type: Number,
    default: 0,
    min: 0
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Esquema de Pago
const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'COP',
    enum: ['COP', 'USD']
  },
  paymentMethod: {
    type: String,
    enum: ['PSE', 'PayPal', 'Nequi', 'Card'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  subscriptionMonths: {
    type: Number,
    default: 1,
    min: 1
  }
}, {
  timestamps: true
});

// Esquema de Reporte
const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['general', 'specific', 'conductor'],
    required: true
  },
  filters: {
    startDate: Date,
    endDate: Date,
    conductor: String,
    status: Number,
    type: String
  },
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  }
}, {
  timestamps: true
});

// Esquema de Conductor
const conductorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  }
}, {
  timestamps: true
});

// Índices compuestos para optimización
deliverySchema.index({ userId: 1, deliveryDate: -1 });
deliverySchema.index({ userId: 1, conductor: 1 });
deliverySchema.index({ userId: 1, status: 1 });
deliverySchema.index({ userId: 1, type: 1 });
deliverySchema.index({ tracking: 1, userId: 1 }, { unique: true });

conductorSchema.index({ userId: 1, name: 1 }, { unique: true });

// Middleware para validaciones
deliverySchema.pre('save', function(next) {
  // Validar que los paquetes Dropi tengan valor
  if (this.type === 'Dropi' && (!this.value || this.value <= 0)) {
    this.value = 0; // Permitir 0 pero no undefined
  }
  next();
});

// Métodos estáticos útiles
deliverySchema.statics.getDeliveryStats = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        deliveryDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$value' }
      }
    }
  ]);
};

deliverySchema.statics.getConductorStats = function(userId, conductor, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        conductor: conductor,
        deliveryDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { type: '$type', status: '$status' },
        count: { $sum: 1 },
        totalValue: { $sum: '$value' }
      }
    }
  ]);
};

// Exportar modelos
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Delivery = mongoose.models.Delivery || mongoose.model('Delivery', deliverySchema);
export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);
export const Conductor = mongoose.models.Conductor || mongoose.model('Conductor', conductorSchema);

