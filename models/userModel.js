import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { isUsablePhoneForOtp } from "../utils/phone.js";

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    uniqe: true,
  },
  /** Google / Firebase OAuth subject; optional, unique when set */
  googleId: {
    type: String,
    sparse: true,
    unique: true,
  },
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  phone: {
    type: String
  },
  city: {
    type: String
  },
  password: {
    type: String
  },
  role: {
    type: String
  },
  image: {
    type: String
  },
  shippingAddress: {
    type: String
  },
  companyName: {
    type: String
  },
  permission: {
    type: Boolean
  },
  userView: {
    type: String
  },
  dob: {
    type: String
  },
  appPinHash: {
    type: String,
    select: true,
  }
}, { timestamps: true });

function oauthUserName(googleId) {
  const safe = String(googleId ?? "").replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 80);
  return `g_${safe || "user"}`;
}

userSchema.statics.signup = async function (
  userName,
  firstName,
  lastName,
  role,
  phone,
  password,
  city,
  shippingAddress,
  companyName, dob
) {
  const existU = await this.findOne({ userName });

  console.log('req.body', userName, firstName,
    lastName,
    role,
    phone,
    password,
    city, shippingAddress, dob);

  if (existU) {
    throw Error("Username already taken.!.");
  }

  if (!phone || !isUsablePhoneForOtp(phone)) {
    throw Error("Phone number is required.");
  }
  const existP = await this.findOne({ phone });
  if (existP) {
    throw Error("Phone number already registered.");
  }

  if (!password || !firstName || !userName) {
    throw Error("All fields must be filled...");
  }

  const isAppSignup =
    !String(city ?? "").trim() &&
    !String(shippingAddress ?? "").trim() &&
    !String(companyName ?? "").trim() &&
    !String(dob ?? "").trim();

  if (isAppSignup) {
    if (String(password).length < 6) {
      throw Error("Password must be at least 6 characters.");
    }
  } else {
    if (
      !String(lastName ?? "").trim() ||
      !String(city ?? "").trim() ||
      !String(shippingAddress ?? "").trim() ||
      !String(companyName ?? "").trim() ||
      !String(dob ?? "").trim()
    ) {
      throw Error("All fields must be filled...");
    }
    if (!/^\d{4}$/.test(String(password))) {
      throw Error("PIN must be exactly 4 digits.");
    }
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(String(password), salt);

  const user = await this.create({
    userName,
    firstName,
    lastName,
    role,
    phone,
    password: hash,
    city, shippingAddress, companyName, permission: false, userView: "FC", dob
  });

  return user;
};

userSchema.statics.gSignup = async function (
  firstName,
  lastName,
  googleId,
  role,
  phone
) {
  if (!googleId || !String(googleId).trim()) {
    throw Error("Google sign-in is missing account id.");
  }

  const existG = await this.findOne({ googleId });
  if (existG) {
    throw Error("This Google account is already registered. Please log in.");
  }

  if (!phone || !isUsablePhoneForOtp(phone)) {
    throw Error("Phone number is required.");
  }
  const existP = await this.findOne({ phone });
  if (existP) {
    throw Error("Phone number already registered.");
  }

  const baseName = oauthUserName(googleId);
  let userName = baseName;
  let n = 0;
  while (await this.findOne({ userName })) {
    userName = `${baseName}_${++n}`;
  }

  const user = await this.create({
    userName,
    googleId: String(googleId).trim(),
    firstName,
    lastName,
    phone,
    role,
    userView: "FC",
  });

  return user;
};

userSchema.statics.gLogin = async function (
  firstName,
  lastName,
  googleId
) {
  if (!googleId || !String(googleId).trim()) {
    throw Error("Google sign-in is missing account id.");
  }

  const gid = String(googleId).trim();
  const exist = await this.findOne({ googleId: gid });

  if (exist) {
    return exist;
  }

  const baseName = oauthUserName(gid);
  let userName = baseName;
  let n = 0;
  while (await this.findOne({ userName })) {
    userName = `${baseName}_${++n}`;
  }

  const user = await this.create({
    userName,
    googleId: gid,
    firstName,
    lastName,
    role: 'user',
    userView: "FC",
  });

  return user;
};

/** Local BD mobile after normalization: 01 + 9 digits */
function looksLikeBdMobile(key) {
  return /^01\d{9}$/.test(String(key).trim());
}

userSchema.statics.login = async function (userName, password) {
  if (!password || !userName) {
    throw Error("All fields must be filled...");
  }

  const key = String(userName).trim();
  const user = await this.findOne({
    $or: [{ userName: key }, { phone: key }],
  });

  if (!user) {
    if (looksLikeBdMobile(key)) {
      throw Error(
        "No account found for this phone number. Please sign up first."
      );
    }
    throw Error("Incorrect Username.!.");
  }

  if (!user.password) {
    throw Error("No password set for this account. Please reset your password or use the website.");
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw Error("Incorrect password.!.");
  }

  return user;
};

const user = mongoose.model("UserCollection", userSchema);

export default user;
