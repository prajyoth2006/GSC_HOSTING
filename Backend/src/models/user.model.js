import mongoose,{Schema} from 'mongoose';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Please add a name'], 
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, 'Please add an email'], 
    unique: true, 
    trim: true,
    lowercase: true,
  },
  password: { 
    type: String, 
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false // Hides the password from API responses by default
  },
  role: { 
    type: String, 
    enum: ['Admin', 'Worker', 'Volunteer'], 
    required: true 
  },
  
  // --- Volunteer Specific Fields ---
  skills: { 
    type: [String], 
  },
  category: {
    type: String,
    required: function() { 
        return this.role === 'Volunteer'; 
    },
    enum: [
      'Medical', 'Rescue', 'Food & Water', 'Shelter', 
      'Sanitation', 'Labor', 'Transport', 'Supplies', 
      'Animal Rescue', 'Infrastructure', 'Other'
    ]
  },
  isAvailable: { 
    type: Boolean, 
  },
  location: {
    type: { 
      type: String, 
      enum: ['Point'], 
    },
    coordinates: { 
      type: [Number], // MongoDB requires [Longitude, Latitude]
    }
  },
  refreshToken: {
    type: String
  }
}, { 
  timestamps: true // Automatically tracks createdAt and updatedAt
});

userSchema.index({ location: '2dsphere' }, { sparse: true });

userSchema.pre("save",async function () {
    if(!this.isModified("password")) return ;
    this.password = await bcrypt.hash(this.password,10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
   return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            name : this.name
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema);