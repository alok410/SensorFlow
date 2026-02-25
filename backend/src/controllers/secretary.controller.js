import User from "../models/User.js";
import bcrypt from "bcryptjs";

/* ===============================
   ADMIN: CREATE SECRETARY
=================================*/
export const createSecretary = async (req, res) => {
  try {
    const { email, password, name, phone, locationId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const secretary = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
      locationId,
      role: "secretary",
    });

    res.status(201).json(secretary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ===============================
   ADMIN: GET ALL SECRETARIES
=================================*/
export const getAllSecretaries = async (req, res) => {
  try {
    const secretaries = await User.find({ role: "secretary" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: secretaries.length,
      data: secretaries,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



/* ===============================
   SECRETARY: GET OWN PROFILE
=================================*/
export const getMyProfile = async (req, res) => {
  try {
    const secretary = await User.findById(req.user.id)
      .select("-password")
      .populate("locationId");

    res.json(secretary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ===============================
   ADMIN: UPDATE SECRETARY
=================================*/
export const updateSecretary = async (req, res) => {
  try {
    delete req.body.role; // prevent role change

    // ✅ If password is empty, remove it completely
    if (!req.body.password || req.body.password.trim() === "") {
      delete req.body.password;
    } else {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    const updated = await User.findOneAndUpdate(
      { _id: req.params.id, role: "secretary" },
      { $set: req.body },   // ✅ safer
      { new: true }
    ).select("-password");

    if (!updated) {
      return res.status(404).json({ message: "Secretary not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   ADMIN: DELETE SECRETARY
=================================*/
export const deleteSecretary = async (req, res) => {
  try {
    const deleted = await User.findOneAndDelete({
      _id: req.params.id,
      role: "secretary",
    });

    if (!deleted) {
      return res.status(404).json({ message: "Secretary not found" });
    }

    res.json({ message: "Secretary deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
  